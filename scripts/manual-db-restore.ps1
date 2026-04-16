# scripts/manual-db-restore.ps1
# Manual Database Restore (Emergency Mode)

param (
    [Parameter(Mandatory=$true)]
    [string]$File
)

$PgRestorePath = "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"
$DbUser = "postgres"
$DbName = "medcoredb"

if (-not (Test-Path $File)) {
    Write-Error "File tidak ditemukan: $File"
    exit 1
}

Write-Host "--- [MANUAL RESTORE START] ---"
Write-Host "Memulihkan database dari: $File"
Write-Host "⚠️ Ini akan menimpa data yang ada di $DbName!"

# --clean: hapus objek sebelum dibuat ulang
# --no-owner: abaikan error owner (aman untuk lintas pc)
# -d: target database
& $PgRestorePath -h localhost -U $DbUser --clean --no-owner -d $DbName "$File"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pemulihan Sukses!"
} else {
    Write-Error "❌ Pemulihan Gagal! Pastikan tidak ada aplikasi yang sedang mengunci database (PM2 stop all)."
}
