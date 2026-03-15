#!/bin/bash
# ============================================
# health-check.sh - Ping API Health & Restart if Failed
# Run via cron or manually after deploy
# ============================================

PORT=${PORT:-3000}
URL="http://localhost:$PORT/api/health"
MAX_RETRIES=3
RETRY_COUNT=0
WAIT_TIME=5 # seconds

echo "🏥 Memulai Health Check pada $URL"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ Health check berhasil! Aplikasi berjalan normal (Status 200)."
        exit 0
    else
        echo "⚠️ Percobaan $((RETRY_COUNT+1))/$MAX_RETRIES: Health check gagal (Status $HTTP_STATUS)."
        RETRY_COUNT=$((RETRY_COUNT+1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Menunggu $WAIT_TIME detik sebelum mencoba lagi..."
            sleep $WAIT_TIME
        fi
    fi
done

echo "❌ Health check gagal setelah $MAX_RETRIES percobaan!"
echo "🔄 Melakukan restart menggunakan PM2 (Zero-downtime reload)..."
pm2 reload ecosystem.config.js || pm2 restart medcore-admin
pm2 save

echo "🚨 Notifikasi dapat ditambahkan di sini (misal: panggil webhook Slack/Discord)."
exit 1
