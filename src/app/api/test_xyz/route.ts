import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    const doc = await prisma.doctor.findFirst({
        where: { name: { contains: "nova", mode: "insensitive" } }
    });
    if (!doc) return NextResponse.json({ error: "Not found" });
    const shifts = await prisma.shift.findMany({
        where: { doctorId: doc.id }
    });
    return NextResponse.json({ doc, shifts });
}
