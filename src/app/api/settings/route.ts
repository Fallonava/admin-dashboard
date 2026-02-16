import { NextResponse } from 'next/server';
import { settingsStore } from '@/lib/data-service';

export async function GET() {
    const settings = settingsStore.getById(1);
    return NextResponse.json(settings || { automationEnabled: false });
}

export async function POST(req: Request) {
    const body = await req.json();
    const current = settingsStore.getById(1);

    if (current) {
        settingsStore.update(1, body);
        return NextResponse.json({ ...current, ...body });
    } else {
        const newSettings = settingsStore.create({ id: 1, ...body });
        return NextResponse.json(newSettings);
    }
}
