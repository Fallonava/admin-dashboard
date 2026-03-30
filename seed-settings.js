const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgresql://medcore:medcore_local_password@192.168.1.12:5433/medcoredb?sslmode=disable'
});

async function main() {
  try {
    // Insert default Settings
    await pool.query(`
      INSERT INTO "Settings" (id, "automationEnabled", "runTextMessage", "emergencyMode", "customMessages")
      VALUES ('1', true, 'Selamat Datang di RSU Siaga Medika', false, '[]')
      ON CONFLICT (id) DO UPDATE SET "automationEnabled" = true
    `);
    console.log('✅ Settings row upserted with automationEnabled=true');

    // Verify
    const res = await pool.query('SELECT * FROM "Settings"');
    console.log('Settings:', JSON.stringify(res.rows[0]));
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await pool.end();
  }
}
main();
