import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-utils';

export const revalidate = 10;

export async function GET() {
    let dbStatus = 'error';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'ok';
    } catch (error) {
        console.error('Health check DB error:', error);
    }

    return apiResponse({
        status: dbStatus === 'ok' ? 'ok' : 'degraded',
        db: dbStatus,
        uptime: process.uptime(),
        version: '1.0'
    });
}
