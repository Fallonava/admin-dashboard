const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: 'postgresql://medcore:medcore_local_password@192.168.1.12:5433/medcoredb?sslmode=disable'
    });
    await client.connect();

    const shifts = await client.query(`
        SELECT d.name, d.status, s."dayIdx", s."formattedTime", s."registrationTime", s."statusOverride"
        FROM "Doctor" d
        JOIN "Shift" s ON s."doctorId" = d.id
        WHERE d.name LIKE '%Luthfi%'
    `);
    
    console.log(`Shifts for Luthfi:`);
    for (const r of shifts.rows) {
        console.log(`Name: ${r.name}, Status Doctor: ${r.status}, Day: ${r.dayIdx}, Time: ${r.formattedTime}, Override: ${r.statusOverride}`);
    }

    await client.end();
}
main().catch(console.error);
