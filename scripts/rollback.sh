#!/bin/bash
# ============================================
# rollback.sh - Mundur 1 commit ke belakang jika terjadi kegagalan fatal
# ============================================

set -e
echo "⚠️  AWAS! MEMULAI PROSES ROLLBACK APLIKASI..."

# 1. Pastikan di dalam git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Direktori saat ini bukan repository git. Rollback dibatalkan."
    exit 1
fi

# Simpan hash commit sebelumnya sebagai referensi log
CURRENT_COMMIT=$(git rev-parse --short HEAD)
PREVIOUS_COMMIT=$(git rev-parse --short HEAD~1)

echo "🔄 Revert dari commit saat ini [$CURRENT_COMMIT] ke commit sebelumnya [$PREVIOUS_COMMIT]..."

# 2. Reset hard ke commit sebelumnya
git reset --hard HEAD~1

# 3. Clean untracked files yang mungkin tertinggal dari build sebelumnya
git clean -fd

# 4. Install dependencies (mungkin ada lib yang hilang/dicabut)
echo "📦 Menginstall dependencies untuk versi sebelumnya..."
npm ci

# 5. Build aplikasi ulang
echo "🏗️ Membangun ulang (Build) aplikasi (standalone)..."
npm run build

# 6. Susun aset statis
echo "📂 Menyusun aset statis (public & .next/static)..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# 7. Restart PM2 (Zero-downtime)
echo "🚀 Merestart aplikasi di PM2..."
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "✅ Rollback berhasil! Aplikasi di-restart ke snapshot commit: $PREVIOUS_COMMIT"
echo "🔍 Menjalankan Health Check..."
bash scripts/health-check.sh
