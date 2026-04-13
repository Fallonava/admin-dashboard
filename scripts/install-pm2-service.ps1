$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   MENGUNCI PM2 KE BACKGROUND SYSTEM (24/7)   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Menyimpan status aplikasi saat ini..." -ForegroundColor Yellow
& pm2.cmd save --force | Out-Null
Write-Host "Sukses tersimpan." -ForegroundColor Green

Write-Host "`n[2/3] Membangun Jembatan Background (Task Scheduler)..." -ForegroundColor Yellow

$TaskName = "SIMED_PM2_Daemon"
$User = "$env:USERDOMAIN\$env:USERNAME"
$Password = "qwer"  # Menggunakan sandi SSH Anda yang sebelumnya

# Mencari lokasi asli dari pm2.cmd agar Task Scheduler tidak bingung
$Pm2Path = (Get-Command pm2.cmd).Source

$Action = New-ScheduledTaskAction -Execute $Pm2Path -Argument "resurrect"
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Days 0) -Hidden

Try {
    # Mendaftarkan task yang berjalan terlepas user sedang log on atau tidak (Kebal SSH Close)
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -User $User -Password $Password -RunLevel Highest -Settings $Settings -Force | Out-Null
    Write-Host "Sistem berhasil dikunci!" -ForegroundColor Green
    
    Write-Host "`n[3/3] Menyalakan Daemon di Background Session..." -ForegroundColor Yellow
    # Matikan daemon interaktif saat ini
    & pm2.cmd kill | Out-Null
    
    # Nyalakan daemon dari background
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 5
    
    Write-Host "`n✅ SELESAI! PM2 sekarang adalah roh abadi di server Anda." -ForegroundColor Green
    Write-Host "Anda bisa menutup layar SSH ini, dan aplikasi akan tetap menyala hijau." -ForegroundColor Cyan
} Catch {
    Write-Host "`n❌ GAGAL: $($_.Exception.Message)" -ForegroundColor Red
}
