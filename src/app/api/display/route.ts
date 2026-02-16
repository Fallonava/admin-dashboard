import { NextResponse } from 'next/server';
import { doctorStore, shiftStore, broadcastStore } from '@/lib/data-service';

export async function GET() {
    // 1. Get real doctors from doctorStore
    const allDoctors = doctorStore.getAll();
    const allShifts = shiftStore.getAll();

    // Today's day index (Mon=0, Sun=6)
    const today = new Date();
    const dayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;

    // Build a map: doctor name -> their shifts today
    const doctorShiftsToday: Record<string, typeof allShifts> = {};
    allShifts.forEach(s => {
        if (s.dayIdx === dayIdx) {
            if (!doctorShiftsToday[s.doctor]) doctorShiftsToday[s.doctor] = [];
            doctorShiftsToday[s.doctor].push(s);
        }
    });

    // Map doctors to display format
    const doctors = allDoctors.map(doc => {
        const shifts = doctorShiftsToday[doc.name] || [];
        const hasShiftToday = shifts.length > 0;

        // Determine practice time from shift
        let practiceTime = '-';
        let startTime = '-';
        let endTime = '-';
        // Admin-set status is the PRIMARY source of truth
        const STATUS_MAP: Record<string, string> = {
            'Buka': 'BUKA',
            'Penuh': 'PENUH',
            'Cuti': 'CUTI',
            'Istirahat': 'ISTIRAHAT',
            'Selesai': 'SELESAI',
        };

        // Use admin status directly if it's explicitly set (not Idle)
        let status = STATUS_MAP[doc.status] || 'TIDAK PRAKTEK';

        if (hasShiftToday) {
            const shift = shifts[0];
            if (shift.formattedTime) {
                practiceTime = shift.formattedTime;
                const parts = shift.formattedTime.split('-');
                startTime = parts[0] || '-';
                endTime = parts[1] || '-';
            } else {
                const times = ["08:00-12:00", "12:00-16:00", "16:00-20:00", "20:00-24:00"];
                const timeStr = times[shift.timeIdx] || "08:00-12:00";
                practiceTime = timeStr;
                const parts = timeStr.split('-');
                startTime = parts[0];
                endTime = parts[1];
            }

            // Only use time-based fallback when doctor status is 'Idle'
            if (doc.status === 'Idle') {
                const currentH = today.getHours();
                const startH = parseInt(startTime.split(':')[0] || '0');
                const endH = parseInt(endTime.split(':')[0] || '24');

                if (currentH >= startH && currentH < endH) {
                    status = 'BUKA';
                } else if (currentH < startH) {
                    status = 'BELUM BUKA';
                } else {
                    status = 'SELESAI';
                }
            }
        }

        return {
            name: doc.name,
            specialty: doc.specialty,
            status,
            practiceTime,
            startTime,
            endTime,
            category: doc.category,
            queueCode: 'A-' + doc.id,
            callTime: '00:00'
        };
    });

    // 2. Get active broadcast for ticker
    const broadcasts = broadcastStore.getAll();
    const activeBroadcast = broadcasts.find(b => b.active) || { message: "" };

    const responseData = {
        doctors,
        settings: {
            runTextMessage: activeBroadcast.message || '© 2026 TPPRJ RSU Siaga Medika Purbalingga'
        }
    };

    return NextResponse.json(responseData, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-store'
        },
    });
}

export async function POST(request: Request) {
    return NextResponse.json({ success: true }, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
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
