import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, canWrite } from '@/lib/auth';
import { withMutationRateLimit } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
    id: "1",
    automationEnabled: false,
    runTextMessage: "Selamat Datang di RSU Siaga Medika",
    emergencyMode: false,
    customMessages: [
        { title: 'Info', text: 'Terimakasih sudah menunggu 🙏' },
        { title: 'Info', text: 'Terimakasih sudah tertib 🌟' },
        { title: 'Antrian', text: 'Belum online? Yo ambil antrian 🎫' },
        { title: 'Info', text: 'Terimakasih sudah mengantri 😊' }
    ],
    portalSettings: null,
};

export async function GET() {
    try {
        const all = await prisma.settings.findMany();
        const settings = all.length > 0 ? all[0] : null;
        if (settings) {
            return NextResponse.json({
                ...settings,
                id: String(settings.id),
                customMessages: Array.isArray(settings.customMessages) ? settings.customMessages : DEFAULT_SETTINGS.customMessages,
            });
        }
        return NextResponse.json(DEFAULT_SETTINGS);
    } catch (err: any) {
        console.error('Settings GET Error:', err);
        return NextResponse.json({ error: 'Gagal mengambil pengaturan.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const rateLimitErr = await withMutationRateLimit(req, 'settings');
    if (rateLimitErr) return rateLimitErr;

    // Verify session & permissions (allow settings, automation, display_tv, or Super Admin)
    const session = await getSession(req);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission =
        session.roleName === 'Super Admin' ||
        canWrite(session, 'settings') ||
        canWrite(session, 'automation') ||
        canWrite(session, 'display_tv') ||
        canWrite(session, 'kontrol_status');

    if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden: Akses ditolak' }, { status: 403 });
    }

    try {
        const body = await req.json();

        // Only pick valid fields for Settings model
        const data: any = {};
        if (typeof body.automationEnabled === 'boolean') data.automationEnabled = body.automationEnabled;
        if (typeof body.runTextMessage === 'string' || body.runTextMessage === null) data.runTextMessage = body.runTextMessage;
        if (typeof body.emergencyMode === 'boolean' || body.emergencyMode === null) data.emergencyMode = body.emergencyMode;
        if (body.customMessages !== undefined) data.customMessages = Array.isArray(body.customMessages) ? body.customMessages : [];
        if (body.portalSettings !== undefined) data.portalSettings = body.portalSettings;

        const all = await prisma.settings.findMany();
        const current = all.length > 0 ? all[0] : null;
        let result: any;

        if (current) {
            result = await prisma.settings.update({
                where: { id: current.id },
                data,
            });
        } else {
            result = await prisma.settings.create({
                data: { ...data, id: "1" },
            });
        }

        // Live WebSocket trigger to update TV display
        if ((global as any).io) {
            try {
                (global as any).io.emit('settings_updated', result);
                (global as any).io.emit('schedule_changed', { type: 'settings', data: result });
            } catch (e) {}
        }

        return NextResponse.json({
            ...result,
            id: String(result.id),
            customMessages: Array.isArray(result.customMessages) ? result.customMessages : [],
        });
    } catch (err: any) {
        console.error('Settings POST Error:', err);
        return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
    }
}
