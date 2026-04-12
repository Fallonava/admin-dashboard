param(
    [string]$ProdDir = "C:\simed-production"
)

Write-Host "Memulai deployment pipeline aman di $ProdDir..."

# Set environment PM2
$env:PM2_HOME = "C:\Users\ANTRIAN 1\.pm2"
$SourceDir = "C:\Users\ANTRIAN 1\_work\admin-dashboard\admin-dashboard"

# 1. Hentikan seluruh PM2 daemon di cluster ini
Write-Host "Menghentikan klaster PM2 lama..."
pm2 kill

Write-Host "Membersihkan file log cache..."
pm2 flush

# 2. Sinkronisasi (Deployment) dari folder Github Actions -> Production
Write-Host "Menyalin file rilis terbaru ke $ProdDir..."
robocopy $SourceDir $ProdDir /MIR /XD .git .github
if ($LASTEXITCODE -le 7) { 
    Write-Host "Robocopy berhasil menyinkronkan file!" 
} else {
    Write-Host "Peringatan: Robocopy menemui kendala!"
}

# Pindah ke direktori rilis
cd $ProdDir

# 2. Start PM2 Admin Dashboard (Berjalan via Build Standalone)
Write-Host "Start Admin Dashboard (Standalone Next.js)..."
pm2 start server.js --name "admin-dashboard" --env production

# 3. Start PM2 WA Worker
Write-Host "Start WA Worker Engine..."
if (Test-Path "$ProdDir\wa-bot\index.js") {
    pm2 start ".\wa-bot\index.js" --name "wa-worker"
} else {
    Write-Host "Peringatan: Modul wa-bot tidak ditemukan di production."
}

# 4. Simpan state config PM2
pm2 save --force
Write-Host "Status PM2 berhasil dikunci."
pm2 list
