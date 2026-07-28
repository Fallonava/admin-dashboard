import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('❌ DATABASE_URL tidak ditemukan');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL, ssl: false });
const backupDir = path.join(process.cwd(), 'backups', '2026-04-02T13-13-59');

const TABLES_ORDER = [
  'Role',
  'User',
  'RolePermission',
  'Doctor',
  'Shift',
  'LeaveRequest',
  'AutomationRule',
  'AutomationLog',
  'BroadcastRule',
  'AuditLog',
  'RefreshToken',
  'Settings',
];

async function restore() {
  console.log('🔄  Restoring database from JSON backups with strict FK order...');

  for (const tableName of TABLES_ORDER) {
    const file = `${tableName}.json`;
    const filePath = path.join(backupDir, file);
    if (!fs.existsSync(filePath)) continue;

    const rows = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!Array.isArray(rows) || rows.length === 0) continue;

    console.log(`⏳ Restoring table: ${tableName} (${rows.length} rows)...`);

    for (const row of rows) {
      const keys = Object.keys(row);
      const values = Object.values(row).map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v);

      const columns = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const query = `
        INSERT INTO "${tableName}" (${columns})
        VALUES (${placeholders})
        ON CONFLICT (id) DO NOTHING;
      `;

      try {
        await pool.query(query, values);
      } catch (err: any) {
        console.error(`  ⚠️ Error inserting row into ${tableName}:`, err.message);
      }
    }
    console.log(`  ✅ ${tableName} restored successfully!`);
  }

  await pool.end();
  console.log('🎉 Data restoration complete!');
}

restore().catch(async (err) => {
  console.error('❌ Restoration failed:', err);
  await pool.end();
});
