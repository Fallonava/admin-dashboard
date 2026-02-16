import { NextResponse } from 'next/server';
import { doctorStore, shiftStore } from '@/lib/data-service';

export async function GET() {
    const doctors = doctorStore.getAll();
    const shifts = shiftStore.getAll();

    // Calculate Today's Index (0=Senin, ..., 6=Minggu)
    // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    const jsDay = new Date().getDay();
    const todayIdx = (jsDay + 6) % 7;

    const enhancedDoctors = doctors.map(doc => {
        // Find shift for today
        const todayShift = shifts.find((s: any) => s.doctor === doc.name && s.dayIdx === todayIdx);

        return {
            ...doc,
            // Prioritize shift-specific registration time, fallback to doctor profile (legacy), fallback to null
            currentRegistrationTime: todayShift?.registrationTime || doc.registrationTime
        };
    });

    return NextResponse.json(enhancedDoctors);
}

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
        const doctors = doctorStore.getAll();
        doctors.forEach((doc: any) => {
            // Reset status to TIDAK PRAKTEK, clear queue, override
            doctorStore.update(doc.id, {
                status: 'TIDAK PRAKTEK',
                queueCode: '', // Optional: clear queue code not usually needed but 'currentPatient' etc might
                lastCall: undefined,
                registrationTime: undefined,
                lastManualOverride: undefined // Reset override so automation can take over again freely
            });
        });
        return NextResponse.json({ success: true, message: "All doctors reset." });
    }

    const body = await req.json();
    const newDoctor = doctorStore.create(body);
    return NextResponse.json(newDoctor);
}

export async function PUT(req: Request) {
    const body = await req.json();
    const { id, ...updates } = body;
    const updated = doctorStore.update(id, updates);
    return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    doctorStore.delete(id);
    return NextResponse.json({ success: true });
}
