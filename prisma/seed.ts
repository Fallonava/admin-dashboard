import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

import * as dotenv from 'dotenv';

dotenv.config();

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting seed from local JSON files...');

    const dataDir = path.join(process.cwd(), 'src/data');

    // Load JSON files
    const safeLoadJson = (filename: string) => {
        try {
            const filePath = path.join(dataDir, filename);
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(fileContent);
            }
        } catch (e) {
            console.error(`Error loading ${filename}:`, e);
        }
        return [];
    };

    const doctors = safeLoadJson('doctors-v2.json');
    const shifts = safeLoadJson('shifts.json');
    const leaves = safeLoadJson('leaves.json');
    const broadcasts = safeLoadJson('broadcasts.json');
    const settings = safeLoadJson('settings-v2.json');

    // Seed Doctors
    if (doctors.length > 0) {
        console.log(`Seeding ${doctors.length} doctors...`);
        // Delete existing to start fresh
        await prisma.doctor.deleteMany({});

        // Add sequentially to handle strings & BigInt
        for (const doc of doctors) {
            // Ensure bigints are parsed if available
            const lastManualOverride = doc.lastManualOverride ? BigInt(doc.lastManualOverride) : null;

            await prisma.doctor.create({
                data: {
                    id: String(doc.id),
                    name: doc.name,
                    specialty: doc.specialty,
                    status: doc.status,
                    image: doc.image || null,
                    category: doc.category,
                    startTime: doc.startTime,
                    endTime: doc.endTime,
                    queueCode: doc.queueCode,
                    lastCall: doc.lastCall || null,
                    registrationTime: doc.registrationTime || null,
                    lastManualOverride: lastManualOverride
                }
            });
        }
    }

    // Seed Shifts
    if (shifts.length > 0) {
        console.log(`Seeding ${shifts.length} shifts...`);
        await prisma.shift.deleteMany({});

        // Prisma createMany is faster, safe since no BigInt
        const shiftData = shifts.map((s: any) => ({
            // Exclude ID to let DB autoincrement, or keep ID? Usually better to keep if relationships exist. No relationships here.
            id: s.id,
            dayIdx: s.dayIdx,
            timeIdx: s.timeIdx || 0,
            title: s.title,
            doctor: s.doctor,
            color: s.color,
            formattedTime: s.formattedTime || null,
            registrationTime: s.registrationTime || null,
            extra: s.extra || null,
            disabledDates: s.disabledDates || []
        }));
        await prisma.shift.createMany({ data: shiftData });
    }

    // Seed Leave Requests
    if (leaves.length > 0) {
        console.log(`Seeding ${leaves.length} leave requests...`);
        await prisma.leaveRequest.deleteMany({});

        const leaveData = leaves.map((l: any) => ({
            id: l.id,
            doctor: l.doctor,
            specialty: l.specialty || null,
            type: l.type,
            dates: l.dates,
            reason: l.reason || null,
            status: l.status,
            avatar: l.avatar || null
        }));
        await prisma.leaveRequest.createMany({ data: leaveData });
    }

    // Seed Broadcasts
    if (broadcasts.length > 0) {
        console.log(`Seeding ${broadcasts.length} broadcast rules...`);
        await prisma.broadcastRule.deleteMany({});

        const broadcastData = broadcasts.map((b: any) => ({
            id: b.id,
            message: b.message,
            alertLevel: b.alertLevel,
            targetZone: b.targetZone,
            duration: b.duration,
            active: b.active
        }));
        await prisma.broadcastRule.createMany({ data: broadcastData });
    }

    // Seed Settings
    if (settings.length > 0) {
        console.log(`Seeding settings...`);
        await prisma.settings.deleteMany({});

        const setting = settings[0]; // Usually just one
        await prisma.settings.create({
            data: {
                id: setting.id || 1,
                automationEnabled: setting.automationEnabled || false,
                runTextMessage: setting.runTextMessage || null,
                emergencyMode: setting.emergencyMode || false,
                customMessages: setting.customMessages || null
            }
        });
    }

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
