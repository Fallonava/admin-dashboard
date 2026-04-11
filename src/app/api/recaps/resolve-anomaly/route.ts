import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { date, no_rm, new_status, note, user } = payload;

    if (!date || !no_rm || !new_status || !note || !user) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const validStatuses = ['OPEN', 'RESOLVED', 'PENDING_DOCTOR', 'PENDING_SYSTEM', 'REJECTED', 'IGNORED'];
    if (!validStatuses.includes(new_status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const recap = await prisma.dailyRecap.findUnique({ where: { date: new Date(date) } });
    if (!recap) {
      return NextResponse.json({ success: false, error: 'Recap not found for this date' }, { status: 404 });
    }

    const details = recap.missing_sep_details as any[];
    const detailIndex = details.findIndex((d: any) => d.no_rm === no_rm);
    if (detailIndex === -1) {
      return NextResponse.json({ success: false, error: 'Patient RM not found in anomalies' }, { status: 404 });
    }

    const currentDetail = details[detailIndex];
    currentDetail.status = new_status;

    if (['RESOLVED', 'IGNORED', 'REJECTED'].includes(new_status)) {
      currentDetail.resolvedAt = new Date();
    }

    currentDetail.audit_logs = currentDetail.audit_logs || [];
    currentDetail.audit_logs.push({
      action: `Marked as ${new_status}`,
      note,
      by: user,
      timestamp: new Date()
    });

    const updated = await prisma.dailyRecap.update({
      where: { id: recap.id },
      data: { missing_sep_details: details }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error resolving anomaly:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
