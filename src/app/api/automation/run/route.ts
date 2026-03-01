import { NextRequest, NextResponse } from 'next/server';
import { runAutomation } from '@/lib/automation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Check for Vercel Cron authorization header OR admin session cookie
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    const sessionCookie = req.cookies.get('medcore_session');
    const adminKey = process.env.ADMIN_KEY;

    const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isAdminAuth = adminKey && sessionCookie?.value === adminKey;

    if (!isCronAuth && !isAdminAuth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runAutomation();
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
