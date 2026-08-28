#!/usr/bin/env bash
set -e

RS_HOST="100.117.70.113"
RS_USER="medcore"
RS_DB="medcoredb"
RS_PASS="medcore_local_password"

LOCAL_USER="admin"
LOCAL_DB="medcoredb"
LOCAL_PASS="rahasia"

# Check if RS PostgreSQL server is reachable
if ! docker exec panel-db pg_isready -h "$RS_HOST" -p 5432 -q > /dev/null 2>&1; then
    exit 0
fi

# Sync data from RS to local replica
docker exec -e PGPASSWORD="$RS_PASS" panel-db pg_dump -h "$RS_HOST" -U "$RS_USER" -d "$RS_DB" --clean --if-exists --no-owner --no-privileges 2>/dev/null | docker exec -i -e PGPASSWORD="$LOCAL_PASS" panel-db psql -U "$LOCAL_USER" -d "$LOCAL_DB" >/dev/null 2>&1 || true
