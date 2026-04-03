/**
 * MedCore Database Backup Script
 * Menggunakan pg (native) agar bypass Prisma adapter complexity.
 * Jalankan: npx tsx scripts/backup-db.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('❌ DATABASE_URL tidak ditemukan di .env');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL, ssl: false });

const TABLES = [
  'Doctor',
  'Shift',
  'LeaveRequest',
  'User',
  'Settings',
  'AutomationLog',
  'AutomationRule',
  'BroadcastRule',
  'AuditLog',
  'Role',
  'RolePermission',
  'RefreshToken',
];

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(process.cwd(), 'backups', timestamp);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log('\n📦  MedCore Database Backup');
  console.log(`🗄️   DB  : medcoredb @ 192.168.1.12:5433`);
  console.log(`📁  Out : ${backupDir}\n`);

  const summary: Record<string, number | string> = {};

  // Dapatkan daftar tabel yang benar-benar ada
  const { rows: existingTables } = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  const existing = new Set(existingTables.map(r => r.tablename));

  for (const table of TABLES) {
    if (!existing.has(table)) {
      console.log(`  ⚠️   ${table.padEnd(20)} → tidak ada (dilewati)`);
      summary[table] = 'NOT_FOUND';
      continue;
    }
    try {
      const { rows } = await pool.query(`SELECT * FROM "${table}"`);
      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf-8');
      const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(1);
      summary[table] = rows.length;
      console.log(`  ✅  ${table.padEnd(20)} → ${String(rows.length).padStart(5)} baris  (${sizeKB} KB)`);
    } catch (err: any) {
      console.log(`  ❌  ${table.padEnd(20)} → ERROR: ${err.message.split('\n')[0]}`);
      summary[table] = 'ERROR';
    }
  }

  // Tulis manifest
  const manifest = {
    backupDate: new Date().toISOString(),
    backupDir,
    database: 'medcoredb @ 192.168.1.12:5433',
    tables: summary,
    totalRows: Object.values(summary).filter(v => typeof v === 'number').reduce((a, b) => (a as number) + (b as number), 0),
  };
  fs.writeFileSync(path.join(backupDir, '_manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n✔  Backup selesai!`);
  console.log(`📊  Total baris : ${manifest.totalRows}`);
  console.log(`📋  Manifest    : ${path.join(backupDir, '_manifest.json')}\n`);

  await pool.end();
}

backup().catch(async (e) => {
  console.error('❌ Backup gagal:', e.message);
  await pool.end();
  process.exit(1);
});
