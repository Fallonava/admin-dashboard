import { NextResponse } from 'next/server';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import { z } from 'zod';
import { ShiftCreateSchema, ShiftUpdateSchema } from '@/features/schedules/types';
import { ShiftService } from '@/features/schedules/services/ShiftService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const includeLeaves = searchParams.get('include') === 'leaves';
    const dayIdxParam = searchParams.get('dayIdx');
    const dayIdx = dayIdxParam !== null ? parseInt(dayIdxParam, 10) : null;
    const dateParam = searchParams.get('date'); 
    const filterDate = dateParam ? new Date(dateParam) : null;

    const shifts = await ShiftService.getShifts(dayIdx, filterDate, includeLeaves);

    return NextResponse.json(shifts, {
        headers: {
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
        }
    });
}

export async function POST(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'shifts');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'schedules', 'write');
    if (authErr) return authErr;

    try {
        const body = await req.json();
        if (body.id === null) delete body.id;
        const validated = ShiftCreateSchema.parse(body);

        const newShift = await ShiftService.create(validated);
        return NextResponse.json(newShift);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: e.flatten() }, { status: 400 });
        }
        console.error("Shift POST Error:", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'shifts');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'schedules', 'write');
    if (authErr) return authErr;

    try {
        const body = await req.json();
        const validated = ShiftUpdateSchema.parse(body);
        const { id, ...updates } = validated;

        const updated = await ShiftService.update(id, updates);
        return NextResponse.json(updated);
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: e.flatten() }, { status: 400 });
        }
        if (e.code === 'P2025') {
            return NextResponse.json({ error: 'P2025: Record not found' }, { status: 404 });
        }
        console.error("Shift PUT Error:", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'shifts');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'schedules', 'write');
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await ShiftService.delete(String(id));
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return NextResponse.json({ success: true, message: 'Already deleted' });
        }
        console.error("Shift DELETE Error:", err);
        return NextResponse.json({ error: "Gagal menghapus shift." }, { status: 500 });
    }
}
