import { NextResponse } from 'next/server';
import { doctorStore, settingsStore, Doctor, Settings } from '@/lib/data-service';

export async function GET() {
    const doctors = doctorStore.getAll();
    const settings = settingsStore.getAll()[0] || { id: 1, automationEnabled: false, runTextMessage: "Selamat Datang di RSU Siaga Medika", emergencyMode: false };

    // Inject default custom messages if missing (migration for existing data)
    if (!settings.customMessages || settings.customMessages.length === 0) {
        settings.customMessages = [
            { title: 'Info', text: 'Terimakasih sudah menunggu 🙏' },
            { title: 'Info', text: 'Terimakasih sudah tertib 🌟' },
            { title: 'Antrian', text: 'Belum online? Yo ambil antrian 🎫' },
            { title: 'Info', text: 'Terimakasih sudah mengantri 😊' }
        ];
        // Persist the migration
        settingsStore.update(settings.id, settings);
    }

    // Format data to match what display/index.html expects
    // Based on index.html: it expects { doctors: [...], settings: {...} }
    // Doctor fields expected: name, specialty, status, startTime, endTime, queueCode, category, callTime?

    // We Map 'Doctor' from data-service to the format expected by Display
    // Actually, our new Doctor interface in data-service ALREADY matches what Display needs mostly.

    return NextResponse.json({
        doctors,
        settings
    }, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-store'
        },
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Handle updates from Display Control Page
        if (body.doctors) {
            // Bulk update or overwrite?
            // The display control page sends the WHOLE state back.
            // We should probably replace our store data or update individually.
            // For simplicity and to match previous behavior (saveDisplayData), we save the list.

            // However, JSONStore doesn't have a 'setAll' method openly exposed as 'save' is private.
            // We need to implement a way to update. 
            // Since we don't want to break encapsulation too much, we can iterate update or delete all and create.
            // But 'JSONStore' is simple. Let's assume we can add a 'setAll' or just map updates.

            // Ideally we should update individual items to avoid overwriting IDs or other separate fields if we were a real DB.
            // But here, let's treat the body.doctors as the source of truth for now, 
            // OR update matching IDs.

            const currentDocs = doctorStore.getAll();
            const incomingDocs = body.doctors as Doctor[];

            // 1. Update existing and Create new
            incomingDocs.forEach(inc => {
                const exists = currentDocs.find(d => d.id == inc.id);
                if (exists) {
                    doctorStore.update(inc.id, inc);
                } else {
                    doctorStore.create(inc);
                }
            });

            // 2. Delete missing? 
            // If the control panel removes a doctor, it won't be in incomingDocs.
            // So we should find IDs in currentDocs that are NOT in incomingDocs and delete them.
            const incomingIds = new Set(incomingDocs.map(d => d.id));
            currentDocs.forEach(d => {
                if (!incomingIds.has(d.id)) {
                    doctorStore.delete(d.id);
                }
            });
        }

        if (body.settings) {
            const currentSettings = settingsStore.getAll()[0];
            if (currentSettings) {
                settingsStore.update(currentSettings.id, body.settings);
            } else {
                settingsStore.create(body.settings);
            }
        }

        return NextResponse.json({ success: true }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error("Error in POST /api/display", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
