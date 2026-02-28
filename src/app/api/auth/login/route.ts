import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // Check if the provided password matches the ADMIN_KEY in the environment
        const expectedKey = process.env.ADMIN_KEY;

        if (!expectedKey) {
            console.error("ADMIN_KEY environment variable is missing!");
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        if (password === expectedKey) {
            // Success: Generate response with Secure HTTP-Only Cookie
            const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });

            response.cookies.set({
                name: 'medcore_session',
                value: expectedKey, // In a real system, you'd use a crypto hash/JWT, but single-tenant literal key is OK for local edge
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            return response;
        } else {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
    } catch (err) {
        return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }
}
