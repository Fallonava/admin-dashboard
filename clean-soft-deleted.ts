import { prisma } from './src/lib/prisma';

async function main() {
  console.log('Cleaning up soft-deleted records via raw SQL...');
  
  const deletedUsers = await (prisma as any).$executeRawUnsafe(`DELETE FROM "User" WHERE "deletedAt" IS NOT NULL`);
  console.log(`Deleted soft-deleted users: ${deletedUsers}`);

  const deletedShifts = await (prisma as any).$executeRawUnsafe(`DELETE FROM "Shift" WHERE "deletedAt" IS NOT NULL`);
  console.log(`Deleted soft-deleted shifts: ${deletedShifts}`);

  const deletedDoctors = await (prisma as any).$executeRawUnsafe(`DELETE FROM "Doctor" WHERE "deletedAt" IS NOT NULL`);
  console.log(`Deleted soft-deleted doctors: ${deletedDoctors}`);

  console.log('Cleanup complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
