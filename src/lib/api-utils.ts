import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function requireAdmin(req: Request) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('medcore_session');

    const key = req.headers.get('x-admin-key'); // Fallback for some internal calls if needed, but primary is cookie

    if ((!sessionCookie || sessionCookie.value !== process.env.ADMIN_KEY) && key !== process.env.ADMIN_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}
