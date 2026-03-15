#!/bin/bash
# ==============================================================================
# quick-install.sh - One-Click Installer for MedCore Admin
# Cara Pakai (Jalankan di Server Ubuntu Kosong):
# bash <(curl -s https://raw.githubusercontent.com/Fallonava/admin-dashboard/master/scripts/quick-install.sh)
# ==============================================================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 MEMULAI MEDCORE ADMIN AUTO-INSTALLER (UBUNTU 22/24)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pastikan Anda menjalankan ini sebagai user normal (bukan root langsung)."
sleep 3

# 1. Update system & Dependencies
echo "📦 1/5 Memperbarui Sistem & Memasang Git/Curl..."
sudo apt-get update -y && sudo apt-get install -y git curl unzip

# 2. Clone Repositori Utama ke folder medcore-admin
if [ ! -d "/home/$USER/admin-dashboard" ]; then
    echo "📥 2/5 Mengunduh Kode (Clone) dari GitHub..."
    cd /home/$USER
    git clone https://github.com/Fallonava/admin-dashboard.git
else
    echo "ℹ️ 2/5 Folder admin-dashboard sudah ada, melewati fase clone."
fi

cd /home/$USER/admin-dashboard

# 3. Menjalankan Skrip Setup Inti (Node, Nginx, PM2)
echo "⚙️ 3/5 Memasang Node.js, PM2, dan Nginx (membutuhkan password sudo)..."
bash scripts/setup-ec2.sh

# 4. Mempersiapkan File .env
echo "🔐 4/5 Mempersiapkan Environment (Sangat Penting!)..."
if [ ! -f ".env" ]; then
    if [ -f ".env.production.remote" ]; then
        cp .env.production.remote .env
        echo "✅ File .env berhasil disalin dari .env.production.remote!"
    else
        echo "⚠️ Peringatan: Tidak ada file .env atau .env.production.remote."
        echo "Silakan buat file .env secara manual setelah skrip ini selesai."
    fi
else
    echo "✅ File .env sudah tersedia."
fi

# 5. Build Pertama
echo "🏗️ 5/5 Menginstall Modul dan Membangun Aplikasi..."
npm ci
npx prisma generate
npm run build 

echo "📂 Sinkronisasi aset statis..."
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
cp -r public .next/standalone/public 2>/dev/null || true

# 6. Menyalakan PM2
echo "🚀 Mengaktifkan PM2 Cluster Server..."
pm2 start ecosystem.config.js --env production
pm2 save

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 INSTALASI SELESAI!"
echo "Aplikasi MedCore Admin kini berjalan di background."
echo ""
echo "📝 Langkah Berikutnya (Wajib):"
echo "1. Jalankan: nano /home/$USER/admin-dashboard/.env"
echo "2. Pastikan DATABASE_URL & REDIS_URL terisi valid!"
echo "3. Setelah mengubah .env, jalankan migrasi database:"
echo "   cd /home/$USER/admin-dashboard && npx prisma migrate deploy"
echo "4. Reload server:"
echo "   pm2 reload medcore-admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
