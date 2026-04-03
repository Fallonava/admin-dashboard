import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const doctorCount = await prisma.doctor.count();
    const shiftCount = await prisma.shift.count();
    const leaveCount = await prisma.leaveRequest.count();
    const userCount = await prisma.user.count();
    const staffConfigCount = await prisma.staffShiftConfig.count();
    const auditLogCount = await prisma.auditLog.count();

    console.log('--- Database Status ---');
    console.log(`Doctor: ${doctorCount}`);
    console.log(`Shift: ${shiftCount}`);
    console.log(`LeaveRequest: ${leaveCount}`);
    console.log(`User: ${userCount}`);
    console.log(`StaffShiftConfig: ${staffConfigCount}`);
    console.log(`AuditLog: ${auditLogCount}`);

    const total = doctorCount + shiftCount + leaveCount + userCount + staffConfigCount;
    if (total === 0) {
      console.log('\nDatabase setuju kosong (hanya tabel sistem atau benar-benar kosong).');
    } else {
      console.log(`\nDatabase TIDAK kosong. Total records: ${total}`);
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
