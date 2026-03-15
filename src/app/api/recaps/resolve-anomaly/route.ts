import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyRecap from '@/models/DailyRecap';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { date, no_rm, new_status, note, user } = payload;
    
    if (!date || !no_rm || !new_status || !note || !user) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['OPEN', 'RESOLVED', 'PENDING_DOCTOR', 'PENDING_SYSTEM', 'REJECTED', 'IGNORED'].includes(new_status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the recap for that date
    const recap = await DailyRecap.findOne({ date });
    if (!recap) {
        return NextResponse.json({ success: false, error: 'Recap not found for this date' }, { status: 404 });
    }

    // Find the specific missing SEP detail
    const detailIndex = recap.missing_sep_details.findIndex((d: any) => d.no_rm === no_rm);
    if (detailIndex === -1) {
        return NextResponse.json({ success: false, error: 'Patient RM not found in anomalies' }, { status: 404 });
    }

    // Update the detail
    const currentDetail = recap.missing_sep_details[detailIndex];
    currentDetail.status = new_status;
    
    if (new_status === 'RESOLVED') {
        currentDetail.resolvedAt = new Date();
    } else if (new_status === 'IGNORED' || new_status === 'REJECTED') {
        currentDetail.resolvedAt = new Date(); // counts as resolved effectively
    }

    // Push audit log
    currentDetail.audit_logs.push({
        action: `Marked as ${new_status}`,
        note: note,
        by: user,
        timestamp: new Date()
    });

    // Save
    await recap.save();

    return NextResponse.json({ success: true, data: recap });
  } catch (error: any) {
    console.error('Error resolving anomaly:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
