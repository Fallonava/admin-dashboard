$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   MENGUNCI PM2 KE BACKGROUND SYSTEM (24/7)   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$ProdDir = "C:\simed-production"
$EcosystemFile = "$ProdDir\ecosystem.config.js"
$PM2Home = "C:\Users\ANTRIAN 1\.pm2"

Write-Host "`n[1/4] Memastikan aplikasi berjalan dari ecosystem..." -ForegroundColor Yellow
$env:PM2_HOME = $PM2Home
& pm2.cmd stop all 2>&1 | Out-Null
& pm2.cmd delete all 2>&1 | Out-Null
& pm2.cmd start $EcosystemFile --update-env
& pm2.cmd save --force
Write-Host "Aplikasi berjalan dan dump tersimpan." -ForegroundColor Green

Write-Host "`n[2/4] Mencari lokasi pm2.cmd..." -ForegroundColor Yellow
$Pm2Path = (Get-Command pm2.cmd -ErrorAction Stop).Source
Write-Host "Ditemukan: $Pm2Path" -ForegroundColor Green

Write-Host "`n[3/4] Membuat Startup Script permanen..." -ForegroundColor Yellow
# Buat sebuah .bat launcher yang dijalankan Task Scheduler
$LauncherPath = "$ProdDir\start-pm2.bat"
@"
@echo off
set PM2_HOME=$PM2Home
cd /d $ProdDir
call "$Pm2Path" start "$EcosystemFile" --update-env
call "$Pm2Path" save --force
"@ | Set-Content -Path $LauncherPath -Encoding ASCII
Write-Host "Launcher dibuat di: $LauncherPath" -ForegroundColor Green

Write-Host "`n[4/4] Mendaftarkan ke Task Scheduler (berjalan saat startup)..." -ForegroundColor Yellow
$TaskName = "SIMED_PM2_Autostart"
$User     = "$env:USERDOMAIN\$env:USERNAME"
$Password = "qwer"

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$LauncherPath`""
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Days 0) `
    -Hidden

# Hapus task lama jika ada
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -User $User `
    -Password $Password `
    -RunLevel Highest `
    -Settings $Settings `
    -Force | Out-Null

Write-Host "Task Scheduler berhasil terdaftar!" -ForegroundColor Green

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   SELESAI! PM2 adalah ROH ABADI SEKARANG    " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Anda bisa menutup SSH kapan saja - server tetap nyala!" -ForegroundColor Green
Write-Host ""
& pm2.cmd list
