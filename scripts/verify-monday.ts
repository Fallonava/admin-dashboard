import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('--- CHECKING DAY 1 (MONDAY) SHIFTS ---');
  const mondayShifts = await prisma.shift.findMany({
    where: { dayIdx: 1 },
    include: { doctor: true }
  });
  console.log(`Found ${mondayShifts.length} shifts for dayIdx 1.`);
  if (mondayShifts.length > 0) {
    mondayShifts.slice(0, 5).forEach(s => {
      console.log(`  Doctor: ${s.doctor.name}, Time: ${s.formattedTime}`);
    });
  }

  console.log('--- CHECKING LEAVE REQUESTS FOR TODAY (2026-03-23) ---');
  const today = new Date('2026-03-23T00:00:00.000Z');
  const leavesToday = await prisma.leaveRequest.findMany({
    where: {
      startDate: { lte: today },
      endDate: { gte: today }
    },
    include: { doctor: true }
  });
  console.log(`Found ${leavesToday.length} leave requests for 2026-03-23.`);
}

verify()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
