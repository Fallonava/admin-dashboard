import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const shifts = await prisma.shift.findMany();
    // Serialize BigInt ID
    const serialized = shifts.map(s => ({
        ...s,
        id: Number(s.id)
    }));
    return NextResponse.json(serialized);
}

export async function POST(req: Request) {
    const body = await req.json();
    const newShift = await prisma.shift.create({ data: body });
    return NextResponse.json({ ...newShift, id: Number(newShift.id) });
}

export async function PUT(req: Request) {
    const body = await req.json();
    const { id, ...updates } = body;
    const updated = await prisma.shift.update({
        where: { id: Number(id) },
        data: updates
    });
    return NextResponse.json({ ...updated, id: Number(updated.id) });
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.shift.delete({
        where: { id: Number(id) }
    });
    return NextResponse.json({ success: true });
}
