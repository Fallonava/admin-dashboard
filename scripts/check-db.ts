const { prisma } = require('../src/lib/prisma');

async function main() {
  try {
    const doctors = await prisma.doctor.count();
    const shifts = await prisma.shift.count();
    const leaves = await prisma.leaveRequest.count();
    console.log('counts', { doctors, shifts, leaves });
  } catch (e) {
    console.error('error querying', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
