import { prisma } from './src/lib/prisma';

const leavesToSeed = [
    {
        doctorName: "dr. Pritasari Dewi Damayanti, Sp.OG",
        type: "Liburan",
        startDate: new Date("2026-03-20T00:00:00Z"),
        endDate: new Date("2026-03-23T23:59:59Z"),
        reason: "Cuti",
        status: "Approved"
    },
    {
        doctorName: "dr. Ardian Rahmasyah, Sp.OG",
        type: "Liburan",
        startDate: new Date("2026-03-20T00:00:00Z"),
        endDate: new Date("2026-03-22T23:59:59Z"),
        reason: "Cuti",
        status: "Approved"
    },
    {
        doctorName: "drg. Robby Ramadhonie Sundaragaza, Sp.BMM",
        type: "Liburan",
        startDate: new Date("2026-03-17T00:00:00Z"),
        endDate: new Date("2026-03-17T23:59:59Z"),
        reason: "Cuti",
        status: "Approved"
    },
    {
        doctorName: "drg. Robby Ramadhonie Sundaragaza, Sp.BMM",
        type: "Liburan",
        startDate: new Date("2026-03-20T00:00:00Z"),
        endDate: new Date("2026-03-21T23:59:59Z"),
        reason: "Cuti",
        status: "Approved"
    },
    // Drg. Rafika and Drg. Yulinda might not be in the mock DB.
    // We will check by name, if found we add, otherwise we skip.
    {
        doctorName: "drg. Rafika",
        type: "Lainnya",
        startDate: new Date("2026-03-18T00:00:00Z"),
        endDate: new Date("2026-03-18T23:59:59Z"),
        reason: "Libur Lebaran",
        status: "Approved"
    },
    {
        doctorName: "drg. Rafika",
        type: "Lainnya",
        startDate: new Date("2026-03-20T00:00:00Z"),
        endDate: new Date("2026-03-20T23:59:59Z"),
        reason: "Libur Lebaran",
        status: "Approved"
    },
    {
        doctorName: "drg. Yulinda",
        type: "Lainnya",
        startDate: new Date("2026-03-19T00:00:00Z"),
        endDate: new Date("2026-03-19T23:59:59Z"),
        reason: "Libur Lebaran",
        status: "Approved"
    },
    {
        doctorName: "dr. Lita Hati Dwi Purnami Effendi, Sp.JP",
        type: "Lainnya",
        startDate: new Date("2026-03-19T00:00:00Z"),
        endDate: new Date("2026-03-19T23:59:59Z"),
        reason: "Libur Tanggal Merah",
        status: "Approved"
    },
    {
        doctorName: "dr. Lita Hati Dwi Purnami Effendi, Sp.JP",
        type: "Lainnya",
        startDate: new Date("2026-03-21T00:00:00Z"),
        endDate: new Date("2026-03-21T23:59:59Z"),
        reason: "Libur Lebaran",
        status: "Approved"
    }
];

async function main() {
    const doctors = await prisma.doctor.findMany();
    console.log(`Found ${doctors.length} doctors.`);

    for (const leave of leavesToSeed) {
        // Find doctor by exact or partial name
        const doctor = doctors.find(d => d.name.toLowerCase().includes(leave.doctorName.toLowerCase()) || leave.doctorName.toLowerCase().includes(d.name.toLowerCase()));

        if (doctor) {
            await prisma.leaveRequest.create({
                data: {
                    doctorId: doctor.id,
                    specialty: doctor.specialty,
                    type: leave.type,
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    reason: leave.reason,
                    status: leave.status,
                } as any
            });
            console.log(`Successfully added leave for ${doctor.name}: ${leave.reason} (${leave.startDate.toDateString()} - ${leave.endDate.toDateString()})`);
        } else {
            console.log(`Warning: Could not find doctor matching "${leave.doctorName}" in the database.`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
