const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BACKUP_DIR = path.join(process.cwd(), 'backups', '2026-04-02T13-13-59');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('--- STARTING RAW DB RESTORATION ---');

    // 1. Disable constraints or delete in order
    // Order of deletion (reverse of insertion)
    const tablesToDelete = [
      'RefreshToken', 'AuditLog', 'AutomationLog', 'AutomationRule', 'BroadcastRule',
      'LeaveRequest', 'Shift', 'Doctor', 'User', 'RolePermission', 'Role', 'Settings'
    ];

    for (const table of tablesToDelete) {
      console.log(`Clearing ${table}...`);
      await client.query(`DELETE FROM "${table}"`);
    }

    // 2. Insert in order
    const tablesToRestore = [
      { name: 'Role', file: 'Role.json' },
      { name: 'RolePermission', file: 'RolePermission.json' },
      { name: 'User', file: 'User.json' },
      { name: 'Doctor', file: 'Doctor.json' },
      { name: 'Shift', file: 'Shift.json' },
      { name: 'LeaveRequest', file: 'LeaveRequest.json' },
      { name: 'Settings', file: 'Settings.json' },
      { name: 'BroadcastRule', file: 'BroadcastRule.json' },
      { name: 'AutomationRule', file: 'AutomationRule.json' },
      { name: 'AutomationLog', file: 'AutomationLog.json' },
      { name: 'AuditLog', file: 'AuditLog.json' },
      { name: 'RefreshToken', file: 'RefreshToken.json' },
    ];

    for (const { name, file } of tablesToRestore) {
      const filePath = path.join(BACKUP_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.log(`[SKIPPING] ${name} (file not found)`);
        continue;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.length === 0) {
        console.log(`[EMPTY] ${name}`);
        continue;
      }

      console.log(`Restoring ${name} (${data.length} records)...`);

      const columns = Object.keys(data[0]);
      const columnNames = columns.map(c => `"${c}"`).join(', ');
      
      for (const item of data) {
        const values = columns.map(col => {
          let val = item[col];
          if (val === null) return null;
          
          // Shift.disabledDates is a PG Array (String[])
          if (name === 'Shift' && col === 'disabledDates') {
             return Array.isArray(val) ? val : [];
          }

          // Other objects/arrays are likely JSON/JSONB columns
          if (typeof val === 'object') {
            return JSON.stringify(val); 
          }
          
          return val;
        });

        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO "${name}" (${columnNames}) VALUES (${placeholders})`;
        await client.query(query, values);
      }
    }

    console.log('--- RESTORATION SUCCESSFUL ---');
  } catch (error) {
    console.error('--- RESTORATION FAILED ---');
    console.error(error);
  } finally {
    await client.end();
  }
}

main();
