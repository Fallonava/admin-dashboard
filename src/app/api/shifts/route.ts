import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import { z } from 'zod';
import { notifyViaSocket } from '@/lib/automation-broadcaster';
export const dynamic = 'force-dynamic';

const ShiftCreateSchema = z.object({
    doctorId: z.string().min(1),
    dayIdx: z.number().int().min(0).max(6),
    timeIdx: z.number().int().min(0).optional().default(0),
    title: z.string().min(1),
    color: z.string().min(1),
    formattedTime: z.string().min(1),
    registrationTime: z.string().nullable().optional(),
    extra: z.string().nullable().optional(),
    disabledDates: z.array(z.string()).optional(),
    statusOverride: z.enum(['BUKA', 'PENUH', 'OPERASI', 'CUTI', 'SELESAI', 'AKAN_BUKA', 'TIDAK_PRAKTEK']).nullable().optional(),
});

const ShiftUpdateSchema = ShiftCreateSchema.partial().extend({
    id: z.string().min(1),
});

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const includeLeaves = searchParams.get('include') === 'leaves';
    const dayIdxParam = searchParams.get('dayIdx');
    const dayIdx = dayIdxParam !== null ? parseInt(dayIdxParam, 10) : null;

    const whereClause: any = {
        doctorId: { not: "" }
    };
    if (dayIdx !== null && !isNaN(dayIdx)) {
        whereClause.dayIdx = dayIdx;
    }

    const shifts = await prisma.shift.findMany({
        where: whereClause,
        include: { 
            doctor: {
                include: {
                    ...(includeLeaves ? { leaveRequests: true } : {})
                }
            } 
        },
        orderBy: [{ dayIdx: 'asc' }, { timeIdx: 'asc' }]
    });

    const mappedShifts = shifts.filter(s => s.doctor !== null).map((s: any) => {
        const doctorRel = s.doctor ? { ...s.doctor } : null;
        if (doctorRel && typeof doctorRel.lastManualOverride === 'bigint') {
            doctorRel.lastManualOverride = Number(doctorRel.lastManualOverride);
        }
        return {
            ...s,
            doctor: s.doctor?.name || 'Unknown',
            doctorName: s.doctor?.name || 'Unknown',
            doctorRel: doctorRel
        };
    });

    return NextResponse.json(mappedShifts, {
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

        const newShift = await prisma.shift.create({ data: validated });
        notifyViaSocket('shift_updated', { id: newShift.id });
        notifyViaSocket('doctor_updated', { ids: [newShift.doctorId] });
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

        const updated = await prisma.shift.update({
            where: { id },
            data: updates as any // Zod-to-Prisma overlap can be tricky
        });
        notifyViaSocket('shift_updated', { id });
        if (updated.doctorId) {
            notifyViaSocket('doctor_updated', { ids: [updated.doctorId] });
        }
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
        const deleted = await prisma.shift.delete({
            where: { id: String(id) }
        });
        notifyViaSocket('shift_updated', { id });
        if (deleted && deleted.doctorId) {
            notifyViaSocket('doctor_updated', { ids: [deleted.doctorId] });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.code === 'P2025') {
            // If already deleted, consider it a success (idempotency)
            return NextResponse.json({ success: true, message: 'Already deleted' });
        }
        console.error("Shift DELETE Error:", err);
        return NextResponse.json({ error: "Gagal menghapus shift." }, { status: 500 });
    }
}
