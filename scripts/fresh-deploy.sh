#!/bin/bash
# ==============================================================================
# fresh-deploy.sh - CLEAN & RE-DEPLOY FROM GITHUB
# ==============================================================================
# Skrip ini akan menghapus sisa deployment manual dan memulai fresh dari GitHub.
# ==============================================================================

set -e
LOG_FILE="/home/fallonava/logs/fresh-deploy.log"
mkdir -p /home/fallonava/logs
exec > >(tee -a "$LOG_FILE") 2>&1

# Load NVM environment
export HOME=/home/fallonava
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 [$(date '+%Y-%m-%d %H:%M:%S')] Memulai Pembersihan & Re-deploy..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Backup .env jika ada (karena biasanya tidak ada di GitHub)
if [ -f ".env" ]; then
    echo "💾 Membackup file .env..."
    cp .env /home/fallonava/admin-dashboard.env.bak
fi
if [ -f "wa-bot/.env" ]; then
    echo "💾 Membackup wa-bot/.env..."
    cp wa-bot/.env /home/fallonava/wa-bot.env.bak
fi

# 2. Hentikan SEMUA proses PM2 (medcore-admin + wa-worker + cron)
echo "🛑 Menghentikan semua proses PM2..."
pm2 delete all 2>/dev/null || true

    # Deteksi branch saat ini (default ke beta jika tidak terdeteksi)
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "beta")
    echo "📥 Menarik kode terbaru dari GitHub (Branch: $CURRENT_BRANCH)..."
    git fetch origin "$CURRENT_BRANCH"
    git reset --hard "origin/$CURRENT_BRANCH"
    git clean -fd  # hapus file "sampah"
    
    # Restore .env
    if [ -f "/home/fallonava/admin-dashboard.env.bak" ]; then
        echo "♻️ Me-restore file .env utama..."
        cp /home/fallonava/admin-dashboard.env.bak .env
    fi
     if [ -f "/home/fallonava/wa-bot.env.bak" ]; then
        echo "♻️ Me-restore file .env bot..."
        cp /home/fallonava/wa-bot.env.bak wa-bot/.env
    fi
else
    echo "❌ Folder .git tidak ditemukan! Pastikan sudah dijalankan di folder repo."
    exit 1
fi

# 4. Bersihkan folder build (simpan cache agar build lebih cepat)
echo "🧹 Membersihkan folder lama (node_modules, .next)..."
rm -rf node_modules
rm -rf wa-bot/node_modules

if [ -d ".next/cache" ]; then
    mv .next/cache /tmp/next-cache-bak
    rm -rf .next
    mkdir -p .next
    mv /tmp/next-cache-bak .next/cache
    echo "♻️  Build cache dipertahankan."
else
    rm -rf .next
fi

# 5. Install dependencies secara bersih (Untuk Web dan Bot!)
echo "📦 Menginstall dependencies Utama (npm ci)..."
npm ci --no-audit --no-fund --maxsockets=3 --loglevel=info

echo "📦 Menginstall dependencies WA-Bot..."
if [ -d "wa-bot" ]; then
    cd wa-bot && npm install --no-audit --no-fund && cd ..
fi

# 6. Jalankan Migrasi Prisma (hanya jika ada folder migrations)
echo "🗄️ Sinkronisasi database..."
if [ -d "prisma/migrations" ]; then
    npx prisma migrate deploy
else
    echo "⚠️ Folder migrations tidak ditemukan, melewati migrate deploy."
    npx prisma generate
fi

# 7. Membangun (Build) aplikasi
echo "🏗️ Membangun (Build) aplikasi..."
export NEXT_TELEMETRY_DISABLED=1
npm run build

# 8. Sinkronisasi aset statis (untuk Standalone mode)
echo "📂 Menyusun aset statis..."
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
cp -r public .next/standalone/public 2>/dev/null || true

# 9. Jalankan kembali dengan PM2
echo "🔄 Menjalankan aplikasi di PM2..."
pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "✅ PEMBERSIHAN & RE-DEPLOY SELESAI!"
echo "📈 Status: pm2 status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
