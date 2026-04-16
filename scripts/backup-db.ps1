# scripts/backup-db.ps1
# Pelindung Data Otomatis MedCore

$BackupDir = "F:\Next\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\medcoredb_backup_$Timestamp.sql"

# Path pg_dump (Ditemukan di Laragon)
$PgDumpPath = "C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe"

# Konfigurasi Database (Default dari .env server)
$DbHost = "localhost"
$DbUser = "medcore"
$DbName = "medcoredb"
$env:PGPASSWORD = "medcore_local_password" # Set password env agar pg_dump tidak tanya interaktif

Write-Host "--- [DATABASE BACKUP] ---"
Write-Host "Memulai backup database $DbName ke $BackupFile..."

# Pastikan folder backup ada
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "Direktori backup $BackupDir dibuat."
}

try {
    & $PgDumpPath -h $DbHost -U $DbUser -f $BackupFile $DbName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup BERHASIL: $BackupFile"
    } else {
        Write-Error "❌ Backup GAGAL dengan exit code: $LASTEXITCODE"
        exit 1
    }
} catch {
    Write-Error "❌ Terjadi eror saat menjalankan pg_dump: $_"
    exit 1
}

# Opsional: Hapus backup lama (lebih dari 7 hari)
$DaysToRetain = 7
Get-ChildItem $BackupDir -Filter "*.sql" | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$DaysToRetain) } | Remove-Item -Force
Write-Host "Pembersihan backup lama selesai (Retention: $DaysToRetain hari)."
