const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: 'postgresql://medcore:medcore_local_password@192.168.1.12:5433/medcoredb?sslmode=disable'
    });
    await client.connect();

    const shifts = await client.query(`
        SELECT DISTINCT d.name, d.status 
        FROM "Doctor" d
        JOIN "Shift" s ON s."doctorId" = d.id
        WHERE s."dayIdx" = 1 AND d.status = 'LIBUR'
    `);
    
    console.log(`Doctors with a schedule on Tuesday (dayIdx=1) but currently in LIBUR status:`);
    for (const r of shifts.rows) {
        console.log(`- ${r.name} (Status: ${r.status})`);
    }

    const allDocs = await client.query(`SELECT d.name, d.status FROM "Doctor" d JOIN "Shift" s ON s."doctorId" = d.id WHERE s."dayIdx" = 1`);
    console.log(`\nAll Doctors with a schedule on Tuesday:`);
    for (const r of allDocs.rows) {
        console.log(`- ${r.name} (Status: ${r.status})`);
    }

    await client.end();
}
main().catch(console.error);
