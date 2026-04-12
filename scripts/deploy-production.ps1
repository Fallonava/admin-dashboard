# ============================================================
# deploy-production.ps1 — Master Deploy Script (Enterprise)
# Jalankan dari LAPTOP: .\scripts\deploy-production.ps1
#
# Flow:
#   1. Build Next.js di lokal
#   2. SSH ke server -> buat C:\simed-production jika belum ada
#   3. Robocopy build artifacts via network share / SSH remote copy
#   4. SSH ke server -> restart PM2 dari C:\simed-production
# ============================================================

param(
    [string]$SshHost    = "srimed",
    [string]$ProdDir    = "C:\simed-production",
    [string]$LocalDir   = $PSScriptRoot + "\.."
)

$ErrorActionPreference = "Stop"
$LocalDir = Resolve-Path $LocalDir

function Log-Step {
    param([string]$Msg)
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "  $Msg" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
}

# ─────────────────────────────────────────────────────────────
# STEP 1: Install + Build di Lokal
# ─────────────────────────────────────────────────────────────
Log-Step "STEP 1/5 — Install dependencies (npm ci)"
Set-Location $LocalDir
npm ci
if ($LASTEXITCODE -ne 0) { Write-Error "npm ci GAGAL!"; exit 1 }

Log-Step "STEP 2/5 — Generate Prisma Client"
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Error "prisma generate GAGAL!"; exit 1 }

Log-Step "STEP 3/5 — Build Next.js + compile server.ts"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build GAGAL!"; exit 1 }

Log-Step "STEP 3b — Copy static assets ke standalone"
Copy-Item -Recurse -Force ".next\static"  ".next\standalone\.next\static"
Copy-Item -Recurse -Force "public"        ".next\standalone\public"
Write-Host "  Static assets disalin ke standalone." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# STEP 2: Siapkan Server via SSH
# ─────────────────────────────────────────────────────────────
Log-Step "STEP 4/5 — Siapkan direktori production di server"
$setupCmd = @"
powershell -NoProfile -Command "
    `$ProdDir = '$ProdDir'
    if (-not (Test-Path `$ProdDir)) {
        New-Item -ItemType Directory -Path `$ProdDir -Force | Out-Null
        Write-Host 'C:\simed-production dibuat.'
    } else {
        Write-Host 'C:\simed-production sudah ada.'
    }
    # Matikan proses lama dengan aman
    pm2 kill 2>`$null
    Write-Host 'PM2 dihentikan.'
    # Beri waktu file locks dilepas
    Start-Sleep -Seconds 3
"
"@
ssh $SshHost $setupCmd
if ($LASTEXITCODE -ne 0) { Write-Error "SSH setup server GAGAL!"; exit 1 }

# ─────────────────────────────────────────────────────────────
# STEP 3: Sinkronisasi File ke Server (Robocopy melalui jaringan)
# Catatan: SSH host "srimed" harus punya UNC path atau gunakan pscp/robocopy network
# Gunakan robocopy ke UNC share atau jalankan melalui SSH remote copy
# ─────────────────────────────────────────────────────────────
Log-Step "STEP 5/5 — Sinkronisasi file ke C:\simed-production via SSH"

# Transfer seluruh project (exclude .git, .github, node_modules dev)
# Menggunakan SSH pipe untuk menjalankan robocopy di server (source = _work folder setelah checkout)
# Strategy: server copy dari _work ke simed-production langsung (lebih efisien)

$robocopyCmd = @"
powershell -NoProfile -Command "
    `$Src  = 'C:\Users\ANTRIAN 1\_work\admin-dashboard\admin-dashboard'
    `$Dst  = '$ProdDir'

    if (-not (Test-Path `$Src)) {
        Write-Host 'PERINGATAN: Folder _work tidak ada, skip robocopy. Menggunakan .next\standalone saja.'
    } else {
        Write-Host 'Robocopy dimulai...'
        robocopy `$Src `$Dst /MIR /XD .git .github /R:2 /W:2 /NP /NFL /NJH /NDL
        if (`$LASTEXITCODE -le 7) {
            Write-Host 'Robocopy selesai.'
        } else {
            Write-Host 'Robocopy error (exit code ' + `$LASTEXITCODE + ')'
        }
    }
"
"@
ssh $SshHost $robocopyCmd

# ─────────────────────────────────────────────────────────────
# STEP 4: Restart PM2 dari C:\simed-production
# ─────────────────────────────────────────────────────────────
$startCmd = @"
powershell -NoProfile -Command "
    Set-Location '$ProdDir'

    # Buat .env production
    @'
DATABASE_URL=postgresql://medcore:medcore_local_password@localhost:5432/medcoredb?sslmode=disable
DIRECT_URL=postgresql://medcore:medcore_local_password@localhost:5432/medcoredb?sslmode=disable
PGHOST=localhost
PGUSER=medcore
PGDATABASE=medcoredb
PGPASSWORD=medcore_local_password
ADMIN_KEY=dev_key_123
NEXT_PUBLIC_ADMIN_KEY=dev_key_123
CRON_SECRET=siaga_medika_secret_2024
JWT_SECRET=mc_jwt_k3y!S1ag4M3d1k4_2024_secure_t0ken_s3cr3t
NEXT_PUBLIC_APP_URL=https://simed.fallonava.my.id
REDIS_URL=redis://localhost:6379
HOSTNAME=0.0.0.0
NODE_ENV=production
PORT=3000
'@ | Set-Content -Path '.env' -Encoding UTF8

    pm2 flush

    # Tentukan path server.js (standalone lebih ringan)
    `$serverJs = '$ProdDir\.next\standalone\server.js'
    if (-not (Test-Path `$serverJs)) {
        `$serverJs = '$ProdDir\server.js'
    }

    if (Test-Path `$serverJs) {
        Write-Host 'Start admin-dashboard dari: ' + `$serverJs
        pm2 start `$serverJs --name 'admin-dashboard' --update-env
    } else {
        Write-Host 'ERROR: server.js tidak ditemukan!'
        exit 1
    }

    # Start WA Worker
    if (Test-Path '$ProdDir\wa-bot\index.js') {
        pm2 start '$ProdDir\wa-bot\index.js' --name 'wa-worker' --update-env
        Write-Host 'wa-worker dimulai.'
    }

    pm2 save --force
    pm2 list
"
"@

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  FINAL — Start PM2 di server production" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
ssh $SshHost $startCmd

Write-Host ""
Write-Host "✅ DEPLOYMENT SELESAI!" -ForegroundColor Green
Write-Host "   Verifikasi: pm2 logs wa-worker --lines 30" -ForegroundColor Yellow
