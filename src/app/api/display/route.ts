import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Doctor } from '@/lib/data-service'; // Only using for type if needed

export async function GET() {
    const allDoctors = await prisma.doctor.findMany();
    const shifts = await prisma.shift.findMany();

    const jsDay = new Date().getDay();
    const todayIdx = (jsDay + 6) % 7;
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const doctors = allDoctors.map((doc: any) => {
        const todayShifts = (shifts as any[]).filter(s => s.doctorId === doc.id && s.dayIdx === todayIdx);
        const shiftPills = todayShifts.map(s => ({
            time: s.formattedTime || '',
            disabled: s.disabledDates.includes(todayStr),
            registrationTime: s.registrationTime || ''
        }));
        const activeShift = todayShifts.find(s => !s.disabledDates.includes(todayStr));

        return {
            ...doc,
            lastManualOverride: doc.lastManualOverride ? Number(doc.lastManualOverride) : undefined,
            shiftPills,
            currentRegistrationTime: activeShift?.registrationTime || doc.registrationTime
        };
    });

    const allSettings = await prisma.settings.findMany();
    let settings = allSettings.length > 0 ? allSettings[0] : {
        id: "1",
        automationEnabled: false,
        runTextMessage: "Selamat Datang di RSU Siaga Medika",
        emergencyMode: false,
        customMessages: [] as any
    };

    if (!settings.customMessages || (settings.customMessages as any[]).length === 0) {
        settings.customMessages = [
            { title: 'Info', text: 'Terimakasih sudah menunggu 🙏' },
            { title: 'Info', text: 'Terimakasih sudah tertib 🌟' },
            { title: 'Antrian', text: 'Belum online? Yo ambil antrian 🎫' },
            { title: 'Info', text: 'Terimakasih sudah mengantri 😊' }
        ];

        // Ensure settings exist in DB with default if missing
        const existing = await (prisma.settings as any).findUnique({ where: { id: "1" } });
        if (existing) {
            await (prisma.settings as any).update({
                where: { id: "1" },
                data: { customMessages: settings.customMessages }
            });
        } else {
            await (prisma.settings as any).create({
                data: {
                    id: "1",
                    automationEnabled: settings.automationEnabled,
                    runTextMessage: settings.runTextMessage,
                    emergencyMode: settings.emergencyMode,
                    customMessages: settings.customMessages
                }
            });
        }
    }

    return NextResponse.json({
        doctors,
        settings: { ...settings, id: String(settings.id) }
    }, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-store'
        },
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Used by Display Control Page to force save state
        if (body.doctors) {
            const currentDocs = await prisma.doctor.findMany();
            const incomingDocs = body.doctors as typeof currentDocs;
            const incomingIds = new Set(incomingDocs.map(d => d.id));

            for (const inc of incomingDocs) {
                const dataToSave = { ...inc };

                const exists = currentDocs.find((d: any) => d.id === inc.id);
                if (exists) {
                    await (prisma.doctor as any).update({ where: { id: inc.id }, data: dataToSave });
                } else {
                    await (prisma.doctor as any).create({ data: dataToSave });
                }
            }

            for (const doc of currentDocs) {
                if (!incomingIds.has(doc.id as string)) {
                    await (prisma.doctor as any).delete({ where: { id: doc.id } });
                }
            }
        }

        if (body.settings) {
            const currentSettings = await (prisma.settings as any).findMany();
            const existing = currentSettings[0];
            const updates = { ...body.settings };
            delete updates.id;

            if (existing) {
                await (prisma.settings as any).update({ where: { id: existing.id }, data: updates });
            } else {
                await (prisma.settings as any).create({ data: { ...updates, id: "1" } });
            }
        }

        return NextResponse.json({ success: true }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error("Error in POST /api/display", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
