const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: 'postgresql://medcore:medcore_local_password@192.168.1.12:5433/medcoredb?sslmode=disable'
    });
    await client.connect();

    console.log("== Automation Rules ==");
    const rules = await client.query('SELECT * FROM "AutomationRule"');
    for (const r of rules.rows) {
        console.log(`Rule: ${r.name}, Active: ${r.active}`);
        console.log(`Condition:`, r.condition);
        console.log(`Action:`, r.action);
    }

    console.log("\n== Shifts == ");
    const shifts = await client.query(`SELECT "dayIdx", "formattedTime", "doctorId" FROM "Shift" WHERE "doctorId" = 'cmndoblgr0005js6xysq45w70'`);
    for (const s of shifts.rows) {
        console.log(`Doctor: cmndoblgr..., DayIdx: ${s.dayIdx}, Time: ${s.formattedTime}`);
    }

    await client.end();
}
main().catch(console.error);
