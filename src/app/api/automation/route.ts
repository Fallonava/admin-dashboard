import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rules = await prisma.broadcastRule.findMany();
        return NextResponse.json(rules);
    } catch (err: any) {
        console.error('Automation GET Error:', err);
        return NextResponse.json({ error: 'Gagal mengambil aturan otomasi.' }, { status: 500 });
    }
}

// Helpers for Prisma Enum mappings
const parseTargetZone = (zone: string) => {
    if (!zone) return 'All_Zones';
    if (zone.includes('All')) return 'All_Zones';
    if (zone.includes('Lobby')) return 'Lobby_Only';
    if (zone.includes('ER')) return 'ER_Wards';
    return 'All_Zones';
};

export async function POST(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'automation');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'automation', 'write');
    if (authErr) return authErr;

    try {
        const body = await req.json();
        if (body.targetZone) body.targetZone = parseTargetZone(body.targetZone);
        const newItem = await prisma.broadcastRule.create({ data: body });
        return NextResponse.json(newItem);
    } catch (err: any) {
        console.error('Automation POST Error:', err);
        return NextResponse.json({ error: 'Gagal membuat aturan otomasi.' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'automation');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'automation', 'write');
    if (authErr) return authErr;

    try {
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        if (updates.targetZone) updates.targetZone = parseTargetZone(updates.targetZone);

        const updated = await prisma.broadcastRule.update({
            where: { id: String(id) },
            data: updates
        });
        return NextResponse.json(updated);
    } catch (err: any) {
        console.error('Automation PUT Error:', err);
        return NextResponse.json({ error: 'Gagal memperbarui aturan otomasi.' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'automation');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'automation', 'write');
    if (authErr) return authErr;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.broadcastRule.delete({
            where: { id: String(id) }
        });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Automation DELETE Error:', err);
        return NextResponse.json({ error: 'Gagal menghapus aturan otomasi.' }, { status: 500 });
    }
}
