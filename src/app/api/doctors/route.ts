import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const doctors = await prisma.doctor.findMany();
    const shifts = await prisma.shift.findMany();

    // Calculate Today's Index (0=Senin, ..., 6=Minggu)
    const jsDay = new Date().getDay();
    const todayIdx = (jsDay + 6) % 7;

    const enhancedDoctors = doctors.map(doc => {
        const todayShift = shifts.find(s => s.doctor === doc.name && s.dayIdx === todayIdx);
        return {
            ...doc,
            lastManualOverride: doc.lastManualOverride ? Number(doc.lastManualOverride) : undefined,
            currentRegistrationTime: todayShift?.registrationTime || doc.registrationTime
        };
    });

    return NextResponse.json(enhancedDoctors);
}

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
        await prisma.doctor.updateMany({
            data: {
                status: 'TIDAK PRAKTEK',
                queueCode: '',
                lastCall: null,
                registrationTime: null,
                lastManualOverride: null
            }
        });
        return NextResponse.json({ success: true, message: "All doctors reset." });
    }

    const body = await req.json();
    // Exclude computed or unneeded fields before inserting
    const { currentRegistrationTime, id, ...dataToInsert } = body;

    // Convert lastManualOverride to BigInt if provided
    if (dataToInsert.lastManualOverride) {
        dataToInsert.lastManualOverride = BigInt(dataToInsert.lastManualOverride);
    }

    // Provide explicit ID if it exists and is not auto-generated (Prisma schema uses cuid by default, but we migrated old IDs)
    if (id) {
        dataToInsert.id = String(id);
    }

    const newDoctor = await prisma.doctor.create({ data: dataToInsert });

    return NextResponse.json({
        ...newDoctor,
        lastManualOverride: newDoctor.lastManualOverride ? Number(newDoctor.lastManualOverride) : undefined
    });
}

export async function PUT(req: Request) {
    const body = await req.json();
    const { id, currentRegistrationTime, isAuto, ...updates } = body;

    if (updates.lastManualOverride !== undefined && updates.lastManualOverride !== null) {
        updates.lastManualOverride = BigInt(updates.lastManualOverride);
    }

    const updated = await prisma.doctor.update({
        where: { id: String(id) },
        data: updates
    });

    return NextResponse.json({
        ...updated,
        lastManualOverride: updated.lastManualOverride ? Number(updated.lastManualOverride) : undefined
    });
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.doctor.delete({
        where: { id: String(id) }
    });
    return NextResponse.json({ success: true });
}
