import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyRecap from '@/models/DailyRecap';

export async function GET() {
  try {
    await connectToDatabase();
    // Fetch all DailyRecap documents sorted by date ascending
    const recaps = await DailyRecap.find({}).sort({ date: 1 }).lean();
    return NextResponse.json({ success: true, data: recaps });
  } catch (error: any) {
    console.error('Error fetching recaps:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    if (!payload || !payload.date) {
      return NextResponse.json({ success: false, error: 'Invalid payload: date is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Smart Merge Upload Logic
    const existingRecap = await DailyRecap.findOne({ date: payload.date });

    if (!existingRecap) {
        // If no existing recap for this date, just create it fresh
        const newRecap = await DailyRecap.create(payload);
        return NextResponse.json({ success: true, data: newRecap });
    }

    // Existing Recap Found. Merge the data.
    // 1. Update primitive metrics unconditionally
    existingRecap.total_patients = payload.total_patients;
    existingRecap.staff_performance = payload.staff_performance;

    // 2. Parse existing vs incoming anomalies
    const incomingAnomalies = payload.missing_sep_details || [];
    const incomingRMs = new Set(incomingAnomalies.map((a: any) => a.no_rm));
    
    // We will build a new array of anomalies to replace the current one
    const mergedAnomalies: any[] = [];

    // Check existing anomalies
    existingRecap.missing_sep_details.forEach((existingAnomaly: any) => {
        if (incomingRMs.has(existingAnomaly.no_rm)) {
            // Patient is still an anomaly in the new Excel upload.
            // Keep the existing anomaly (retaining status and audit logs)
            // But update their basic details just in case they changed
            const updatedInfo = incomingAnomalies.find((a: any) => a.no_rm === existingAnomaly.no_rm);
            existingAnomaly.nama = updatedInfo.nama;
            existingAnomaly.asuransi = updatedInfo.asuransi;
            mergedAnomalies.push(existingAnomaly);
        } else {
            // AUTO-RESOLVE LOGIC:
            // Patient was an anomaly, but is NO LONGER an anomaly in the new Excel upload!
            // This means they probably got their SEP.
            // If they were 'OPEN' or 'PENDING_*', mark them as 'RESOLVED' via Auto-resolve.
            if (['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(existingAnomaly.status)) {
                existingAnomaly.status = 'RESOLVED';
                existingAnomaly.resolvedAt = new Date();
                existingAnomaly.audit_logs.push({
                    action: 'System Auto-Resolve',
                    note: 'SEP terdeteksi pada hasil unggahan rekap Excel terbaru. Sistem otomatis menyelesaikan anomali ini.',
                    by: 'Sistem',
                    timestamp: new Date()
                });
            }
            // Keep them in the list so we have historical proof they existed and were resolved
            mergedAnomalies.push(existingAnomaly);
        }
    });

    // Check for purely NEW anomalies in the incoming data
    const existingRMs = new Set(existingRecap.missing_sep_details.map((a: any) => a.no_rm));
    incomingAnomalies.forEach((incomingAnomaly: any) => {
        if (!existingRMs.has(incomingAnomaly.no_rm)) {
            // Brand new anomaly!
            incomingAnomaly.status = 'OPEN';
            incomingAnomaly.audit_logs = [{
               action: 'Detected as Anomaly',
               note: 'Dicatat sebagai Anomali (Missing SEP) saat unggah rekap harian.',
               by: 'Sistem',
               timestamp: new Date()
            }];
            mergedAnomalies.push(incomingAnomaly);
        }
    });

    // Replace the array and recalculate the raw unresolved count
    // (You could redefine missing_sep_count as purely unresolved anomalies or total anomalies ever flagged)
    // Let's count only OPEN or PENDING ones as "missing SEP count"
    existingRecap.missing_sep_details = mergedAnomalies;
    existingRecap.missing_sep_count = mergedAnomalies.filter((a: any) => a.status !== 'RESOLVED' && a.status !== 'IGNORED' && a.status !== 'REJECTED').length;

    const savedRecap = await existingRecap.save();

    return NextResponse.json({ success: true, data: savedRecap });
  } catch (error: any) {
    console.error('Error saving recap:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ success: false, error: 'Parameter date diperlukan.' }, { status: 400 });
    }

    await connectToDatabase();
    const result = await DailyRecap.findOneAndDelete({ date });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Data rekap untuk tanggal tersebut tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Rekap tanggal ${date} berhasil dihapus.` });
  } catch (error: any) {
    console.error('Error deleting recap:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
