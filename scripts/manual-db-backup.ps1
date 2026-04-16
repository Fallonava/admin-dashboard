# scripts/manual-db-backup.ps1
# Manual Database Backup (Expert Mode)

$BackupDir = "C:\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "${BackupDir}\medcore_manual_${Timestamp}.dump"

$PgDumpPath = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
$DbUser = "postgres"
$DbName = "medcoredb"

# Pastikan folder ada
if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }

Write-Host "--- [MANUAL BACKUP START] ---"
Write-Host "Mencadangkan database ke: $BackupFile"

# Gunakan format custom (-Fc) untuk restore yang lebih mudah dan cepat
& $PgDumpPath -Fc -h localhost -U $DbUser -f "$BackupFile" $DbName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup Sukses!"
    Write-Host "Lokasi file: $BackupFile"
} else {
    Write-Error "❌ Backup Gagal!"
}
