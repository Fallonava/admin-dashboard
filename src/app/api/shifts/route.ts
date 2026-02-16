import { NextResponse } from 'next/server';
import { shiftStore } from '@/lib/data-service';

export async function GET() {
    return NextResponse.json(shiftStore.getAll());
}

export async function POST(req: Request) {
    const body = await req.json();
    const newShift = shiftStore.create(body);
    return NextResponse.json(newShift);
}

export async function PUT(req: Request) {
    const body = await req.json();
    const { id, ...updates } = body;
    const updated = shiftStore.update(id, updates);
    return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    shiftStore.delete(id);
    return NextResponse.json({ success: true });
}
