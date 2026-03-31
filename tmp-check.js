const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Looking for doctor 'Nova'...");
    const doctor = await prisma.doctor.findFirst({
        where: { name: { contains: "nova", mode: "insensitive" } }
    });
    
    if (!doctor) {
        console.log("Doctor not found!");
        return;
    }
    
    console.log("Doctor found:", doctor.name, "| Status:", doctor.status, "| RegTime:", doctor.registrationTime);
    
    const wibTime = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const dayIdx = wibTime.getUTCDay() === 0 ? 6 : wibTime.getUTCDay() - 1;
    console.log("Checking shifts for dayIdx:", dayIdx);
    
    const shifts = await prisma.shift.findMany({
        where: { doctorId: doctor.id, dayIdx: dayIdx }
    });
    
    console.log("Shifts today:", shifts.length);
    shifts.forEach(s => {
        console.log(`- ${s.formattedTime} (Reg: ${s.registrationTime || 'none'})`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
