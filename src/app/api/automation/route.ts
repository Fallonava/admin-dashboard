import { NextResponse } from 'next/server';
import { broadcastStore } from '@/lib/data-service';

export async function GET() {
    return NextResponse.json(broadcastStore.getAll());
}

export async function POST(req: Request) {
    const body = await req.json();
    const newItem = broadcastStore.create(body);
    return NextResponse.json(newItem);
}

export async function PUT(req: Request) {
    const body = await req.json();
    const { id, ...updates } = body;
    const updated = broadcastStore.update(id, updates);
    return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    broadcastStore.delete(id);
    return NextResponse.json({ success: true });
}
