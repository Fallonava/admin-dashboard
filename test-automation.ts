import { PrismaClient } from '@prisma/client';
import { determineIdealStatus } from './src/lib/automation';

const prisma = new PrismaClient();

async function debug() {
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const currentDayIdx = wibTime.getUTCDay() === 0 ? 6 : wibTime.getUTCDay() - 1;
    const currentHour = wibTime.getUTCHours();
    const currentMinute = wibTime.getUTCMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const todayStr = `${wibTime.getUTCFullYear()}-${String(wibTime.getUTCMonth() + 1).padStart(2, '0')}-${String(wibTime.getUTCDate()).padStart(2, '0')}`;

    console.log(`Current Time: ${currentHour}:${currentMinute} (Minutes: ${currentTimeMinutes})`);
    console.log(`Day Info: index ${currentDayIdx}, Date Str: ${todayStr}`);

    const rawDoctors = await prisma.doctor.findMany();
    const rawShifts: any = await (prisma as any).shift.findMany({
        where: { dayIdx: currentDayIdx }
    });

    console.log(`Found ${rawDoctors.length} doctors, ${rawShifts.length} shifts today`);

    // Only fetch leaves that ended recently or are active (Optimization to prevent reading ALL history)
    const recentDateLimit = new Date(wibTime.getTime() - (24 * 60 * 60 * 1000));
    const rawLeaves: any = await (prisma as any).leaveRequest.findMany({
        where: { endDate: { gte: recentDateLimit } }
    });

    for (const d of rawDoctors) {
        const doc: any = { ...d, id: String(d.id), lastManualOverride: d.lastManualOverride !== null ? Number(d.lastManualOverride) : undefined };
        const myShifts = rawShifts.filter((s: any) => s.doctorId === doc.id);
        const myLeaves = rawLeaves.filter((l: any) => l.doctorId === doc.id);

        if (myShifts.length > 0) {
            const isCooldownActive = false; // test without cooldown
            const ideal = determineIdealStatus(doc, myShifts, myLeaves, currentTimeMinutes, todayStr, isCooldownActive);
            if (ideal !== doc.status) {
                console.log(`Doc: ${doc.name} | Current Status: ${doc.status} | Ideal Status: ${ideal} | Shifts: ${myShifts.map((s:any) => s.formattedTime).join(', ')}`);
            }
        }
    }
}

debug().catch(console.error).finally(() => prisma.$disconnect());
