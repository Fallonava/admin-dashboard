import { prisma } from '../src/lib/prisma';
async function run() {
  const count = await prisma.knowledgeBase.count();
  console.log(`CURRENT_COUNT: ${count}`);
}
run().finally(() => prisma.$disconnect());
