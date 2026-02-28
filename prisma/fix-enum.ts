import { config } from 'dotenv'
config()
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    await prisma.$executeRawUnsafe(`UPDATE "Doctor" SET "status" = 'AKAN_BUKA'::"DoctorStatus" WHERE "status"::text = 'TUTUP'`);
    console.log('Fixed');
}
main().catch(console.error).finally(() => prisma.$disconnect());
