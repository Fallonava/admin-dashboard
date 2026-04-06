import { runAutomation } from '../src/lib/automation';
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log("Forcing automation run with fresh logic...");
    await runAutomation();
    
    // Check Luthfi
    const doc = await prisma.doctor.findUnique({
        where: { id: 'cmndoblgr0005js6xysq45w70' }, // whatever his ID is, wait I'll just search
    });
    console.log("Checking Luthfi...");
    const docs = await prisma.doctor.findMany({
        where: { name: { contains: 'Luthfi' } }
    });
    for(const d of docs) console.log(d.name, 'is now', d.status);
    
    await prisma.$disconnect();
}
main().catch(console.error);
