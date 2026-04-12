# ============================================================
# restart-production.ps1 — Emergency Restart Script
# Jalankan LANGSUNG di server jika PM2 perlu restart manual
# Di server: powershell -ExecutionPolicy Bypass -File "C:\simed-production\scripts\restart-production.ps1"
# ============================================================

$ProdDir  = "C:\simed-production"
$env:PM2_HOME = "C:\Users\ANTRIAN 1\.pm2"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  SIMED Restart Production Script" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Validasi direktori production ada
if (-not (Test-Path $ProdDir)) {
    Write-Host "ERROR: $ProdDir tidak ditemukan. Jalankan deploy-production.ps1 dahulu." -ForegroundColor Red
    exit 1
}

# 1. Hentikan PM2
Write-Host "[1/5] Menghentikan klaster PM2..." -ForegroundColor Yellow
pm2 stop all 2>$null
pm2 delete all 2>$null
Start-Sleep -Seconds 3
pm2 flush

# 2. Pindah ke production directory
Set-Location $ProdDir

# 3. Tentukan server.js — WAJIB root server.js (ada Socket.IO)
# JANGAN gunakan .next\standalone\server.js
$serverJs = "$ProdDir\server.js"

if (-not (Test-Path $serverJs)) {
    Write-Host "ERROR: $ProdDir\server.js tidak ditemukan!" -ForegroundColor Red
    Write-Host "       Jalankan 'npm run build' di folder production terlebih dahulu." -ForegroundColor Yellow
    exit 1
}
Write-Host "[2/5] Server: $serverJs (Socket.IO enabled)" -ForegroundColor Gray

# 4. Start admin-dashboard
Write-Host "[3/5] Start admin-dashboard..." -ForegroundColor Yellow
pm2 start $serverJs --name "admin-dashboard" --update-env

# 5. Start wa-worker
Write-Host "[4/5] Start wa-worker..." -ForegroundColor Yellow
if (Test-Path "$ProdDir\wa-bot\index.js") {
    pm2 start "$ProdDir\wa-bot\index.js" --name "wa-worker" --update-env
} else {
    Write-Host "       wa-bot tidak ditemukan, skip." -ForegroundColor DarkYellow
}

# 6. Simpan dan tampilkan status
Write-Host "[5/5] Simpan state PM2..." -ForegroundColor Yellow
pm2 save --force

Write-Host ""
Write-Host "✅ Restart selesai! Status saat ini:" -ForegroundColor Green
pm2 list
