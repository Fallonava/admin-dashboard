import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const shifts = await prisma.shift.findMany({
    where: { dayIdx: 1 },
    include: { doctor: true }
  });
  console.log(`Shifts found for dayIdx 1: ${shifts.length}`);
  
  shifts.forEach(s => {
    if (s.doctor.name.toLowerCase().includes('nova')) {
        console.log(`NOVA -> shift: ${s.formattedTime}, doc.regTime: ${s.doctor.registrationTime}, shift.regTime: ${s.registrationTime}`);
    } else {
        console.log(`${s.doctor.name}: ${s.formattedTime}`);
    }
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
