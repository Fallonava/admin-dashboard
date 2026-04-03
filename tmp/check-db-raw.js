const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    const tables = ['Doctor', 'Shift', 'User', 'StaffShiftConfig'];
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`${table}: ${res.rows[0].count}`);
      } catch (e) {
        console.log(`${table}: Table doesn't exist or error: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

check();
