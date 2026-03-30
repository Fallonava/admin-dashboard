const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://medcore:medcore_local_password@192.168.1.12:5433/medcoredb?sslmode=disable'
});

async function main() {
  try {
    // Check Settings
    const settingsRes = await pool.query('SELECT * FROM "Settings" LIMIT 1');
    console.log('Settings rows:', settingsRes.rows.length);
    if (settingsRes.rows.length > 0) {
      console.log('Settings:', JSON.stringify(settingsRes.rows[0]));
    } else {
      console.log('NO SETTINGS ROW - automation will never run!');
    }

    // Check Doctor count
    const drRes = await pool.query('SELECT COUNT(*) FROM "Doctor"');
    console.log('Doctor count:', drRes.rows[0].count);

    // Check Shift count
    const shiftRes = await pool.query('SELECT COUNT(*) FROM "Shift"');
    console.log('Shift count:', shiftRes.rows[0].count);

    // Check today's shifts (dayIdx=1 = Tuesday today 2026-03-31)
    const todayRes = await pool.query('SELECT COUNT(*) FROM "Shift" WHERE "dayIdx" = 1');
    console.log('Today shifts (dayIdx=1):', todayRes.rows[0].count);

  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await pool.end();
  }
}
main();
