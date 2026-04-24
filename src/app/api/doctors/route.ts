import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import { DoctorService } from '@/features/doctors/services/DoctorService';
import { 
  BulkUpdateSchema, 
  CreateDoctorSchema, 
  UpdateDoctorSchema 
} from '@/features/doctors/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 100) : 100;

    const { data, total } = await DoctorService.getDoctors(page, limit);

    if (!pageParam && !limitParam) {
        return NextResponse.json(data);
    }

    return NextResponse.json({
        data,
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
        await DoctorService.resetAllDoctors();
        return NextResponse.json({ success: true, message: "All doctors reset." });
    }

    if (action === 'bulk') {
        try {
            const body = await req.json();
            const validated = BulkUpdateSchema.parse(body);
            const results = await DoctorService.bulkUpdate(validated);
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
            await DoctorService.reorder(validated);
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
        const newDoctor = await DoctorService.create(validated);
        return NextResponse.json(newDoctor);
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

        const updated = await DoctorService.update(id, data);
        return NextResponse.json(updated);
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
        await DoctorService.delete(String(id));
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return NextResponse.json({ success: true, message: 'Already deleted' });
        }
        console.error("Doctor DELETE Error:", err);
        return NextResponse.json({ error: "Gagal menghapus dokter. Pastikan tidak ada data terkait atau hubungi admin." }, { status: 500 });
    }
}
