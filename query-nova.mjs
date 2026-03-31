import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkNova() {
  const d = await prisma.doctor.findFirst({where:{name:{contains:'nova', mode:'insensitive'}}});
  if(!d) return console.log('Nova not found');
  console.log('NOVA:', d);
  const shifts = await prisma.shift.findMany({where:{doctorId: d.id}});
  console.log('SHIFTS:', shifts);
}
checkNova().finally(()=>prisma.$disconnect());
