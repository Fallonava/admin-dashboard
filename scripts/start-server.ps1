# ============================================================
# start-server.ps1 — Hidupkan Paksa Admin Dashboard
# Jalankan langsung di server Windows (srimed) jika PM2 mati
# ============================================================

$APP_DIR = "C:\Users\ANTRIAN 1\_work\admin-dashboard\admin-dashboard"
$APP_NAME = "admin-dashboard"
$SERVER_JS = "$APP_DIR\.next\standalone\server.js"
$NPM_CMD   = & npm.cmd config get prefix | Join-Path -ChildPath "node_modules\next\dist\bin\next"

Set-Location $APP_DIR

Write-Host "🔍 Cek status PM2..." -ForegroundColor Cyan
$running = pm2 list | Select-String $APP_NAME

if ($running) {
    Write-Host "♻️  Restart $APP_NAME..." -ForegroundColor Yellow
    pm2 restart $APP_NAME
} else {
    Write-Host "🚀 Start baru $APP_NAME..." -ForegroundColor Green

    if (Test-Path $SERVER_JS) {
        Write-Host "  → Menggunakan .next\standalone\server.js" -ForegroundColor Gray
        pm2 start $SERVER_JS --name $APP_NAME
    } else {
        Write-Host "  → Menggunakan next start (NPM wrapper)" -ForegroundColor Gray
        $cmd = "cd '$APP_DIR'; npx next start"
        pm2 start powershell --name $APP_NAME -- "-NoProfile -Command `"$cmd`""
    }
}

Write-Host "💾 Menyimpan proses ke disk..." -ForegroundColor Cyan
pm2 save --force

Write-Host "`n✅ Done! Status aplikasi:" -ForegroundColor Green
pm2 list
