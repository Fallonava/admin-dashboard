import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

function subtractOneHour(timeStr: string | null | undefined): string | null {
    if (!timeStr) return null;

    // For Shift formattedTime e.g., "08:00-12:00" or just "08:00"
    const startPart = timeStr.split('-')[0].trim();

    // Check if it's a valid HH:MM format
    if (!/^\d{2}:\d{2}$/.test(startPart)) {
        return null;
    }

    const [hoursStr, minutesStr] = startPart.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Subtract 1 hour
    hours -= 1;
    if (hours < 0) {
        hours = 23; // Wrap around if needed
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

async function main() {
    console.log("Connecting to database...");

    const doctors = await prisma.doctor.findMany();
    let doctorUpdateCount = 0;

    console.log(`Found ${doctors.length} doctors. Updating registration times...`);
    for (const doc of doctors) {
        if (doc.startTime) {
            const regTime = subtractOneHour(doc.startTime);
            if (regTime) {
                await prisma.doctor.update({
                    where: { id: doc.id },
                    data: { registrationTime: regTime }
                });
                doctorUpdateCount++;
            }
        }
    }
    console.log(`✅ Updated ${doctorUpdateCount} doctors.`);

    const shifts = await prisma.shift.findMany();
    let shiftUpdateCount = 0;

    console.log(`Found ${shifts.length} shifts. Updating registration times...`);
    for (const shift of shifts) {
        if (shift.formattedTime) {
            const regTime = subtractOneHour(shift.formattedTime);
            if (regTime) {
                await prisma.shift.update({
                    where: { id: shift.id },
                    data: { registrationTime: regTime }
                });
                shiftUpdateCount++;
            }
        }
    }
    console.log(`✅ Updated ${shiftUpdateCount} shifts.`);

    console.log("🎉 All registration times have been updated successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Error updating database:");
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
