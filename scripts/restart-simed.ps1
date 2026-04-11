# ============================================================
# restart-simed.ps1 — Shortcut dari Laptop untuk Restart srimed
# Jalankan dari PowerShell LAPTOP: .\scripts\restart-simed.ps1
# ============================================================

Write-Host "🔗 Menghubungkan ke srimed dan menjalankan start-server..." -ForegroundColor Cyan
ssh srimed "powershell -ExecutionPolicy Bypass -File 'C:\Users\ANTRIAN 1\_work\admin-dashboard\admin-dashboard\scripts\start-server.ps1'"
Write-Host "`n✅ Selesai!" -ForegroundColor Green
