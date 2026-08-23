import { NextResponse } from 'next/server';
import { QueueService } from '@/features/queue/services/QueueService';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'doctors');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'doctors', 'write');
    if (authErr) return authErr;

    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        if (action === 'reset') {
            const result = await QueueService.resetDoctorQueue();
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err: any) {
        console.error("Queue POST Error:", err);
        return NextResponse.json({ error: "Gagal memproses antrean dokter." }, { status: 500 });
    }
}
