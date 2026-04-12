require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function main() {
  // 1. Optimalkan Postgres
  try {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://medcore:medcore_local_password@localhost:5432/medcoredb?sslmode=disable';
    // Using a regex to extract database name
    const dbMatch = dbUrl.match(/\/([^?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : 'medcoredb';

    console.log(`\nConnecting to Postgres at ${dbUrl} ...`);
    const pg = new Client({ connectionString: dbUrl });
    await pg.connect();
    
    console.log('Executing VACUUM ANALYZE...');
    await pg.query('VACUUM ANALYZE;');
    console.log('✅ VACUUM ANALYZE selesai.');

    console.log(`Executing REINDEX DATABASE ${dbName}...`);
    await pg.query(`REINDEX DATABASE ${dbName};`);
    console.log(`✅ REINDEX DATABASE ${dbName} selesai.`);

    await pg.end();
  } catch (e) {
    console.error('❌ Postgres error:', e);
  }
}

main();
