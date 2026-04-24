import { NextResponse } from 'next/server';
import { QueueService } from '@/features/queue/services/QueueService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
        const result = await QueueService.resetDoctorQueue();
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
