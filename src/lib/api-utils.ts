import { NextResponse } from 'next/server';

export function requireAdmin(req: Request) {
    const key = req.headers.get('x-admin-key');
    if (!key || key !== process.env.ADMIN_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}
