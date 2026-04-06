import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const docId = 'cmndoblgr0005js6xysq45w70';
    const doc = await prisma.doctor.findUnique({
        where: { id: docId },
        include: { shifts: true }
    });
    console.log("Doctor:", doc?.name);
    if (doc) {
        for (const s of doc.shifts) {
            console.log(`- Day: ${s.dayIdx}, Time: ${s.formattedTime}`);
        }
    }
}
check().finally(() => prisma.$disconnect());
