import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const leaves = await prisma.leaveRequest.findMany();
    const serialized = leaves.map(l => ({ ...l, id: Number(l.id) }));
    return NextResponse.json(serialized);
}

export async function POST(req: Request) {
    const data = await req.json();

    if (Array.isArray(data)) {
        // Bulk add
        // createMany doesn't return the inserted records in Prisma, just the count
        // So we might need to insert them individually if we need to return them
        const newLeaves = await Promise.all(
            data.map(item => prisma.leaveRequest.create({ data: item }))
        );
        return NextResponse.json(newLeaves.map(l => ({ ...l, id: Number(l.id) })));
    } else {
        // Single add
        const newLeave = await prisma.leaveRequest.create({ data });
        return NextResponse.json({ ...newLeave, id: Number(newLeave.id) });
    }
}

export async function PUT(req: Request) {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    try {
        const updatedLeave = await prisma.leaveRequest.update({
            where: { id: Number(id) },
            data: updates
        });
        return NextResponse.json({ ...updatedLeave, id: Number(updatedLeave.id) });
    } catch (error) {
        return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
        await prisma.leaveRequest.delete({
            where: { id: Number(id) }
        });
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
}
