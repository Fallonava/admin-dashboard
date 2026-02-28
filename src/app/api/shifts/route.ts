import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const shifts = await (prisma.shift as any).findMany({
        include: { doctor: true }
    });

    const mappedShifts = shifts.map((s: any) => ({
        ...s,
        doctor: s.doctor?.name || 'Unknown'
    }));

    return NextResponse.json(mappedShifts);
}

export async function POST(req: Request) {
    const body = await req.json();
    const newShift = await prisma.shift.create({ data: body });
    return NextResponse.json(newShift);
}

export async function PUT(req: Request) {
    const body = await req.json();
    const { id, ...updates } = body;
    const updated = await (prisma.shift as any).update({
        where: { id: String(id) },
        data: updates
    });
    return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await (prisma.shift as any).delete({
        where: { id: String(id) }
    });
    return NextResponse.json({ success: true });
}
