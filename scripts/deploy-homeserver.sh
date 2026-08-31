#!/usr/bin/env bash
set -e

APP_DIR="/home/fallonava/simed"
echo "============================================================"
echo "  SIMED HOME SERVER DEPLOYMENT (Linux Backup / Failover)"
echo "============================================================"
echo "Waktu Mulai: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

cd "$APP_DIR"

echo "[1/4] Menarik update source code terbaru dari Git..."
git fetch origin master
git reset --hard origin/master

echo ""
echo "[2/4] Sinkronisasi dependensi & Prisma Client..."
npm install --no-audit --prefer-offline
npx prisma generate
npx prisma db push --skip-generate

echo ""
echo "[3/4] Mengompilasi Next.js production build..."
npm run build

echo ""
echo "[4/4] Me-reload PM2 simed (Zero-Downtime Swap)..."
pm2 reload simed || pm2 restart simed

echo ""
echo "============================================================"
echo "  DEPLOYMENT HOME SERVER SELESAI DENGAN SUKSES!"
echo "============================================================"
curl -s http://localhost:3008/api/health || true
echo ""
