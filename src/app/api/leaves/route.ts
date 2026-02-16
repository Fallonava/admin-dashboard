import { NextResponse } from 'next/server';
import { leaveStore, LeaveRequest } from '@/lib/data-service';

export async function GET() {
    const leaves = leaveStore.getAll();
    return NextResponse.json(leaves);
}

export async function POST(req: Request) {
    const data = await req.json();

    if (Array.isArray(data)) {
        // Bulk add
        const newLeaves = data.map(item => leaveStore.create(item));
        return NextResponse.json(newLeaves);
    } else {
        // Single add
        const newLeave = leaveStore.create(data);
        return NextResponse.json(newLeave);
    }
}

export async function PUT(req: Request) {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const updatedLeave = leaveStore.update(id, updates);

    if (!updatedLeave) {
        return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    return NextResponse.json(updatedLeave);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
        leaveStore.delete(parseInt(id));
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
}
