import { QueueService } from '@/features/queue/services/QueueService';

export const dynamic = 'force-dynamic';

export async function GET() {
    const result = await QueueService.getQueueMetrics();
    return Response.json(result);
}
