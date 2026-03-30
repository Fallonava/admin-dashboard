import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin, requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import { notifyDoctorUpdates, notifyViaSocket, syncAdminData } from '@/lib/automation-broadcaster';
import { getFullSnapshot } from '@/lib/data-fetchers';

export const dynamic = 'force-dynamic';

// Validation schemas
const DoctorStatusEnum = z.enum(['TERJADWAL', 'PENDAFTARAN', 'PRAKTEK', 'PENUH', 'OPERASI', 'CUTI', 'SELESAI', 'LIBUR']);

const BulkUpdateSchema = z.array(
    z.object({
        id: z.union([z.string(), z.number()]).transform(String),
        status: DoctorStatusEnum.optional(),
    }).strict()
);

const CreateDoctorSchema = z.object({
    name: z.string().min(1).max(255),
    specialty: z.string().min(1).max(255),
    status: z.any(),
    category: z.enum(['Bedah', 'NonBedah']),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
    queueCode: z.string().optional(),
    lastCall: z.string().nullable().optional(),
    registrationTime: z.string().nullable().optional(),
    lastManualOverride: z.number().optional(),
});

const UpdateDoctorSchema = CreateDoctorSchema.partial().extend({
    id: z.string(),
});

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 100) : 100;
    const skip = (page - 1) * limit;

    const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
            skip,
            take: limit,
            orderBy: [
                { order: 'asc' },
                { specialty: 'asc' },
                { name: 'asc' }
            ]
        }),
        prisma.doctor.count()
    ]);

    const shifts = await prisma.shift.findMany();

    // Calculate Today's Index (0=Senin, ..., 6=Minggu) using WIB timezone
    const now = new Date();
    const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const jsDay = wibNow.getUTCDay();
    const todayIdx = (jsDay + 6) % 7;

    const enhancedDoctors = doctors.map(doc => {
        const todayShift = shifts.find(s => s.doctorId === doc.id && s.dayIdx === todayIdx);
        return {
            ...doc,
            lastManualOverride: doc.lastManualOverride ? Number(doc.lastManualOverride) : undefined,
            currentRegistrationTime: todayShift?.registrationTime || doc.registrationTime
        };
    });

    if (!pageParam && !limitParam) {
        return NextResponse.json(enhancedDoctors);
    }

    return NextResponse.json({
        data: enhancedDoctors,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
}

export async function POST(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'doctors');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'doctors', 'write');
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
        await prisma.doctor.updateMany({
            data: {
                status: 'LIBUR',
                queueCode: '',
                lastCall: null,
                registrationTime: null,
                lastManualOverride: null
            }
        });
        const docs = await prisma.doctor.findMany({ select: { id: true } });
        const ids = docs.map(d => String(d.id));
        notifyDoctorUpdates(ids.map(id => ({ id })));
        notifyViaSocket('doctor_updated', { ids });

        // Trigger full sync for Admin Dashboard
        getFullSnapshot().then(syncAdminData).catch(console.error);

        return NextResponse.json({ success: true, message: "All doctors reset." });
    }

    if (action === 'bulk') {
        try {
            const body = await req.json();
            const validated = BulkUpdateSchema.parse(body);

            const results = await prisma.$transaction(
                validated.map((update) => {
                    const { id, ...data } = update;
                    return prisma.doctor.update({
                        where: { id },
                        data: data as any
                    });
                })
            );
            const ids = validated.map(u => String(u.id));
            notifyDoctorUpdates(ids.map(id => ({ id })));
            notifyViaSocket('doctor_updated', { ids });

            // Trigger full sync for Admin Dashboard
            getFullSnapshot().then(syncAdminData).catch(console.error);

            return NextResponse.json({ success: true, count: results.length });
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                return NextResponse.json({ error: 'Validation failed', details: err.flatten() }, { status: 400 });
            }
            if (err.code === 'P2025') {
                return NextResponse.json({ error: 'P2025: One or more records not found' }, { status: 404 });
            }
            return NextResponse.json({ error: String(err) }, { status: 500 });
        }
    }

    if (action === 'reorder') {
        try {
            const body = await req.json();
            const validated = z.array(z.object({ id: z.union([z.string(), z.number()]).transform(String), order: z.number() })).parse(body);

            await prisma.$transaction(
                validated.map((item) => 
                    prisma.doctor.update({
                        where: { id: item.id },
                        data: { order: item.order }
                    })
                )
            );
            return NextResponse.json({ success: true });
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                return NextResponse.json({ error: 'Validation failed', details: err.flatten() }, { status: 400 });
            }
            if (err.code === 'P2025') {
                return NextResponse.json({ error: 'P2025: Record not found' }, { status: 404 });
            }
            return NextResponse.json({ error: String(err) }, { status: 500 });
        }
    }

    // Create new doctor
    try {
        const body = await req.json();
        const validated = CreateDoctorSchema.parse(body);

        const newDoctor = await prisma.doctor.create({ data: validated as any });
        return NextResponse.json({
            ...newDoctor,
            lastManualOverride: newDoctor.lastManualOverride ? Number(newDoctor.lastManualOverride) : undefined
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: err.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'doctors');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'doctors', 'write');
    if (authErr) return authErr;

    try {
        const body = await req.json();
        const validated = UpdateDoctorSchema.parse(body);
        const { id, ...data } = validated;

        // Ensure lastManualOverride is updated when status is manually changed
        if (data.status && typeof data.lastManualOverride === 'undefined') {
            (data as any).lastManualOverride = Date.now();
        }

        const updated = await prisma.doctor.update({
            where: { id },
            data: data as any
        });

        notifyDoctorUpdates([{ id: String(updated.id) }]);
        notifyViaSocket('doctor_updated', { ids: [String(updated.id)] });

        // Trigger full sync for Admin Dashboard
        getFullSnapshot().then(syncAdminData).catch(console.error);

        return NextResponse.json({
            ...updated,
            lastManualOverride: updated.lastManualOverride ? Number(updated.lastManualOverride) : undefined
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: err.flatten() }, { status: 400 });
        }
        if (err.code === 'P2025') {
            return NextResponse.json({ error: 'P2025: Record not found' }, { status: 404 });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'doctors');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'doctors', 'write');
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await prisma.doctor.delete({
            where: { id: String(id) }
        });
        
        notifyDoctorUpdates([{ id: String(id) }]);
        notifyViaSocket('doctor_updated', { ids: [String(id)] });
        notifyViaSocket('schedule_changed', { reason: 'doctor_deleted', ts: Date.now() });

        // Trigger full sync for Admin Dashboard
        getFullSnapshot().then(syncAdminData).catch(console.error);
        
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return NextResponse.json({ success: true, message: 'Already deleted' });
        }
        console.error("Doctor DELETE Error:", err);
        return NextResponse.json({ error: "Gagal menghapus dokter. Pastikan tidak ada data terkait atau hubungi admin." }, { status: 500 });
    }
}
