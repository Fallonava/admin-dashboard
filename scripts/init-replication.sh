#!/usr/bin/env bash
set -e

echo "🔧 [1/3] Menyiapkan parameter Logical Replication PostgreSQL..."
docker exec panel-db psql -U admin -d postgres -c "ALTER SYSTEM SET wal_level = 'logical';"
docker exec panel-db psql -U admin -d postgres -c "ALTER SYSTEM SET max_replication_slots = '10';"
docker exec panel-db psql -U admin -d postgres -c "ALTER SYSTEM SET max_wal_senders = '10';"

echo "🔄 [2/3] Merestart PostgreSQL container..."
docker restart panel-db
sleep 4

echo "📦 [3/3] Menyiapkan Publication simed_pub di medcoredb..."
docker exec panel-db psql -U admin -d medcoredb -c "CREATE PUBLICATION simed_pub FOR ALL TABLES;" 2>/dev/null || echo "Publication already exists"

echo "✅ Selesai! PostgreSQL Home Server siap untuk Logical Replication."
