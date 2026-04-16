# scripts/backup-db.ps1
# Pelindung Data Otomatis MedCore

$BackupDir = "C:\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "${BackupDir}\medcoredb_backup_${Timestamp}.sql"

# Path pg_dump (Ditemukan di Laragon)
$PgDumpPath = "C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe"

# Jika tidak ada di Laragon, coba fallback ke path sistem
if (-not (Test-Path $PgDumpPath)) {
    $PgDumpPath = "pg_dump.exe"
}

# Konfigurasi Database - Ambil dari Environment (untuk CI/CD) atau Fallback ke Default Laragon
$DbHost = if ($env:PGHOST) { $env:PGHOST } else { "localhost" }
$DbUser = if ($env:PGUSER) { $env:PGUSER } else { "postgres" }
$DbName = if ($env:PGDATABASE) { $env:PGDATABASE } else { "medcoredb" }

# Gunakan PGPASSWORD jika ada di env, jika tidak gunakan default lokal
if (-not $env:PGPASSWORD) {
    if ($DbUser -eq "medcore") {
        $env:PGPASSWORD = "medcore_local_password"
    }
    # User postgres biasanya tidak pakai password di Laragon default
}

Write-Host "--- [DATABASE BACKUP] ---"
Write-Host "Memulai backup database ${DbName} (User: ${DbUser}) ke ${BackupFile}..."

# Pastikan folder backup ada
if (-not (Test-Path ${BackupDir})) {
    try {
        New-Item -ItemType Directory -Path ${BackupDir} -Force -ErrorAction Stop | Out-Null
        Write-Host "Direktori backup ${BackupDir} berhasil dibuat."
    } catch {
        Write-Error "Gagal membuat direktori ${BackupDir}: $_"
        exit 1
    }
}

try {
    # Gunakan operator call & untuk mengeksekusi path
    & $PgDumpPath -h $DbHost -U $DbUser -f "${BackupFile}" $DbName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup BERHASIL: ${BackupFile}"
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
if (Test-Path ${BackupDir}) {
    Get-ChildItem ${BackupDir} -Filter "*.sql" | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$DaysToRetain) } | Remove-Item -Force
    Write-Host "Pembersihan backup lama selesai (Retention: ${DaysToRetain} hari)."
}
