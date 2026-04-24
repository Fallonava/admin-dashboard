import { NextResponse } from 'next/server';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import { z } from 'zod';
import { LeaveCreateBulkSchema, LeaveUpdateSchema } from '@/features/schedules/types';
import { LeaveService } from '@/features/schedules/services/LeaveService';

export const dynamic = 'force-dynamic';

export async function GET() {
    const mappedLeaves = await LeaveService.getLeaves();
    return NextResponse.json(mappedLeaves);
}

export async function POST(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'leaves');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'leaves', 'write');
    if (authErr) return authErr;

    try {
        const body = await req.json();
        const data = LeaveCreateBulkSchema.parse(body);

        if (Array.isArray(data)) {
            const newLeaves = await LeaveService.createBulk(data);
            return NextResponse.json(newLeaves);
        } else {
            const newLeave = await LeaveService.create(data);
            return NextResponse.json(newLeave);
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
        }
        if ((error as any).message === 'Doctor not found') {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'leaves');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'leaves', 'write');
    if (authErr) return authErr;

    try {
        const body = await req.json();
        const validated = LeaveUpdateSchema.parse(body);
        const { id, ...updates } = validated;

        const updatedLeave = await LeaveService.update(id, updates);
        return NextResponse.json(updatedLeave);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: 'Leave request not found or update failed' }, { status: 404 });
    }
}

export async function DELETE(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'leaves');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'leaves', 'write');
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
        try {
            await LeaveService.delete(String(id));
            return NextResponse.json({ success: true });
        } catch (err) {
            console.error("Leave DELETE Error:", err);
            return NextResponse.json({ error: "Gagal menghapus data cuti." }, { status: 500 });
        }
    }
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
}
