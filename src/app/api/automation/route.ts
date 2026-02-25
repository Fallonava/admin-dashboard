import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const rules = await prisma.broadcastRule.findMany();
    const serialized = rules.map(r => ({ ...r, id: Number(r.id) }));
    return NextResponse.json(serialized);
}

export async function POST(req: Request) {
    const body = await req.json();
    const newItem = await prisma.broadcastRule.create({ data: body });
    return NextResponse.json({ ...newItem, id: Number(newItem.id) });
}

export async function PUT(req: Request) {
    const body = await req.json();
    const { id, ...updates } = body;
    const updated = await prisma.broadcastRule.update({
        where: { id: Number(id) },
        data: updates
    });
    return NextResponse.json({ ...updated, id: Number(updated.id) });
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.broadcastRule.delete({
        where: { id: Number(id) }
    });
    return NextResponse.json({ success: true });
}
