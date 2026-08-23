import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('medcore_session')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        userId: session.userId,
        username: session.username,
        name: session.name,
        roleId: session.roleId,
        roleName: session.roleName,
        permissions: session.permissions,
      },
    });
  } catch (err: any) {
    console.error('Auth /me Error:', err);
    return NextResponse.json({ user: null, error: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 });
  }
}
