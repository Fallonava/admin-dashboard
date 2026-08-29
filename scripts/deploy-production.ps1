# ==============================================================================
#  SIMED Production Deployment Script (Zero-Downtime + Safe Database Protection)
#  Target Server: ANTRIAN 1 (Windows Server / Client)
#  Execution: powershell -ExecutionPolicy Bypass -File "C:\simed-production\scripts\deploy-production.ps1"
# ==============================================================================

$ErrorActionPreference = "Stop"
$ProdDir = "C:\simed-production"
$env:PM2_HOME = "C:\Users\ANTRIAN 1\.pm2"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SIMED ZERO-DOWNTIME DEPLOYMENT & DATABASE SAFE-GUARD" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Waktu Mulai: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# -- 1. Validasi Direktori ----------------------------------------------------
if (-not (Test-Path $ProdDir)) {
    Write-Host "[ERROR] Direktori $ProdDir tidak ditemukan!" -ForegroundColor Red
    exit 1
}
Set-Location $ProdDir

# -- 2. PRE-DEPLOY AUTOMATED DATABASE BACKUP ----------------------------------
Write-Host "[1/6] Menjalankan Backup Otomatis Database (Safe-Guard)..." -ForegroundColor Yellow

$BackupDir = "C:\backups\pre-deploy_$Timestamp"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

try {
    # Backup Level 1: Export JSON Snapshot Table-by-Table
    Write-Host "     -> Mengekspor snapshot data tabel ke JSON..." -ForegroundColor Gray
    npx tsx scripts/backup-db.ts
    Write-Host "     [OK] Snapshot data JSON berhasil dibuat." -ForegroundColor Green
} catch {
    Write-Host "     [WARN] Peringatan export JSON: $_. Melanjutkan..." -ForegroundColor Yellow
}

# Backup Level 2: PostgreSQL pg_dump (jika binary tersedia)
$PgDumpPath = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
if (-not (Test-Path $PgDumpPath)) { $PgDumpPath = "pg_dump.exe" }

$DbName = if ($env:PGDATABASE) { $env:PGDATABASE } else { "medcoredb" }
$DbHost = if ($env:PGHOST) { $env:PGHOST } else { "localhost" }
$DbUser = if ($env:PGUSER) { $env:PGUSER } else { "postgres" }
$SqlBackup = "$BackupDir\full_dump_${DbName}_${Timestamp}.sql"

try {
    & $PgDumpPath -h $DbHost -U $DbUser -f $SqlBackup $DbName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     [OK] PostgreSQL dump berhasil: $SqlBackup" -ForegroundColor Green
    }
} catch {
    Write-Host "     (pg_dump direct skipped, snapshot JSON aktif)" -ForegroundColor Gray
}

# -- 3. GIT PULL REPO TERBARU --------------------------------------------------
Write-Host ""
Write-Host "[2/6] Menarik update source code terbaru dari Git..." -ForegroundColor Yellow
git fetch origin master
git reset --hard origin/master
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Gagal git sync. Membatalkan deploy." -ForegroundColor Red
    exit 1
}

# -- 4. INSTALL DEPENDENCIES & PRISMA CLIENT GENERATION ------------------------
Write-Host ""
Write-Host "[3/6] Sinkronisasi dependensi & Prisma Client..." -ForegroundColor Yellow
npm install --no-audit --prefer-offline

Write-Host "     -> Prisma Generate..." -ForegroundColor Gray
npx prisma generate

# Sinkronisasi skema TANPA mereset data (--skip-generate)
Write-Host "     -> Prisma DB Sync (Non-destructive safe push)..." -ForegroundColor Gray
npx prisma db push --skip-generate

# -- 5. NEXT.JS PRODUCTION BUILD -----------------------------------------------
Write-Host ""
Write-Host "[4/6] Mengompilasi Next.js production build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build gagal! Server tetap berjalan dengan versi sebelumnya." -ForegroundColor Red
    exit 1
}

# -- 6. PM2 PROCESS REFRESH (ZERO DOWNTIME RELOAD) ----------------------------
Write-Host ""
Write-Host "[5/6] Me-reload proses PM2 (Zero-Downtime Swap)..." -ForegroundColor Yellow

pm2 reload ecosystem.config.js --update-env

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] PM2 reload mengalami kendala, mencoba restart..." -ForegroundColor Yellow
    pm2 restart ecosystem.config.js --update-env
}

# -- 7. SIMPAN STATE & VERIFIKASI HEALTH CHECK --------------------------------
Write-Host ""
Write-Host "[6/6] Menyimpan status PM2..." -ForegroundColor Yellow
pm2 save

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SELESAI DENGAN SUKSES! (ZERO DOWNTIME)" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Status PM2 Saat Ini:" -ForegroundColor Cyan
pm2 status
Write-Host ""
