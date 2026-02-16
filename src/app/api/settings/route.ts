import { NextResponse } from 'next/server';
import { settingsStore } from '@/lib/data-service';

export async function GET() {
    const all = settingsStore.getAll();
    const settings = all.length > 0 ? all[0] : null;
    return NextResponse.json(settings || { id: 1, automationEnabled: false });
}

export async function POST(req: Request) {
    const body = await req.json();
    const all = settingsStore.getAll();
    const current = all.length > 0 ? all[0] : null;

    if (current) {
        const updated = settingsStore.update(current.id, body);
        return NextResponse.json(updated);
    } else {
        const newSettings = settingsStore.create({ ...body });
        return NextResponse.json(newSettings);
    }
}
