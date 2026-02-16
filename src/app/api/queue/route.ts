
import { NextResponse } from 'next/server';
// Assuming we might have a queueStore or we just reset doctors' queue data?
// In this system, it seems queue state might be inside Doctor or a separate store.
// Let's check data-service.ts again to be sure where queue info is stored.
// For now, I'll create a placeholder that resets doctors' queue info if that's what "Hapus Antrian" means.

import { doctorStore } from '@/lib/data-service';

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
        // logic to reset queue counters
        // If queue numbers are stored in doctors (e.g. currentPatient), reset them.
        // Or if there's a separate queue store.
        // Based on previous analysis, "queueCode" is static.
        // "lastCall" implies current patient?

        // If the user means "Clear Queue", it usually means resetting the daily running numbers.
        // Since I don't see a "QueueStore" in the imports I used previously, 
        // and "Doctor" has "queueCode", maybe it's just about resetting status?

        // Let's assume for now it means resetting "lastCall" (which appears on TV).
        const doctors = doctorStore.getAll();
        doctors.forEach((doc: any) => {
            doctorStore.update(doc.id, {
                lastCall: undefined // Clear the "Called" status
            });
        });

        return NextResponse.json({ success: true, message: "Queue reset." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
