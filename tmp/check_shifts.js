const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const doc = await prisma.doctor.findFirst({
        where: { name: { contains: "Ardian" } },
        include: { shifts: true }
    });
    console.log("Doctor:", doc.name, "ID:", doc.id);
    for (const shift of doc.shifts) {
        console.log(`- DayIdx: ${shift.dayIdx}, Time: ${shift.formattedTime}, TimeIdx: ${shift.timeIdx}`);
    }
}
check().finally(() => prisma.$disconnect());
