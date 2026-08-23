import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const all = await prisma.settings.findMany();
        const settings = all.length > 0 ? all[0] : null;
        if (settings) {
            return NextResponse.json({ ...settings, id: Number(settings.id) });
        }
        return NextResponse.json({ id: 1, automationEnabled: false });
    } catch (err: any) {
        console.error('Settings GET Error:', err);
        return NextResponse.json({ error: 'Gagal mengambil pengaturan.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'settings');
    if (rateLimitErr) return rateLimitErr;

    const authErr = await requirePermission(req, 'settings', 'write');
    if (authErr) return authErr;

    try {
        const body = await req.json();

        // Only pick fields that exist in the Prisma Settings model
        const data: Prisma.SettingsUpdateInput = {};
        if (typeof body.automationEnabled === 'boolean') data.automationEnabled = body.automationEnabled;
        if (typeof body.runTextMessage === 'string') data.runTextMessage = body.runTextMessage;
        if (body.runTextMessage === null) data.runTextMessage = null;
        if (typeof body.emergencyMode === 'boolean') data.emergencyMode = body.emergencyMode;
        if (body.emergencyMode === null) data.emergencyMode = null;
        if (body.customMessages !== undefined) data.customMessages = body.customMessages;
        if (body.portalSettings !== undefined) data.portalSettings = body.portalSettings;

        const all = await prisma.settings.findMany();
        const current = all.length > 0 ? all[0] : null;

        if (current) {
            const updated = await prisma.settings.update({
                where: { id: current.id },
                data,
            });
            return NextResponse.json({ ...updated, id: Number(updated.id) });
        } else {
            const newSettings = await prisma.settings.create({ data: data as any });
            return NextResponse.json({ ...newSettings, id: Number(newSettings.id) });
        }
    } catch (err: any) {
        console.error('Settings POST Error:', err);
        return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
    }
}
