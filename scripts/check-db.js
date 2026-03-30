require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const r1 = await pool.query('SELECT COUNT(*) as c FROM "Doctor"');
  console.log('Doctors in DB:', r1.rows[0].c);
  
  const r2 = await pool.query('SELECT COUNT(*) as c FROM "Shift"');
  console.log('Shifts in DB:', r2.rows[0].c);
  
  const r3 = await pool.query('SELECT "dayIdx", COUNT(*) as c FROM "Shift" GROUP BY "dayIdx" ORDER BY "dayIdx"');
  console.log('Shifts per dayIdx:', r3.rows);
  
  const r4 = await pool.query('SELECT "automationEnabled" FROM "Settings" LIMIT 1');
  console.log('Settings (automationEnabled):', r4.rows[0]);
  
  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
