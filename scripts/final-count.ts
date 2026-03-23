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
  const count0 = await prisma.shift.count({ where: { dayIdx: 0 } });
  const count1 = await prisma.shift.count({ where: { dayIdx: 1 } });
  console.log(`Day 0 (Monday): ${count0}`);
  console.log(`Day 1 (Tuesday): ${count1}`);
}

verify().finally(() => prisma.$disconnect());
