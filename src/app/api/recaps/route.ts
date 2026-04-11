import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const recaps = await prisma.dailyRecap.findMany({ orderBy: { date: 'asc' } });
    return NextResponse.json({ success: true, data: recaps });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || !payload.date) {
      return NextResponse.json({ success: false, error: 'Invalid payload: date is required' }, { status: 400 });
    }

    const existingRecap = await prisma.dailyRecap.findUnique({ where: { date: new Date(payload.date) } });

    if (!existingRecap) {
      const newRecap = await prisma.dailyRecap.create({
        data: {
          date: new Date(payload.date),
          total_patients: payload.total_patients || 0,
          missing_sep_count: payload.missing_sep_count || 0,
          staff_performance: payload.staff_performance || [],
          missing_sep_details: payload.missing_sep_details || [],
        }
      });
      return NextResponse.json({ success: true, data: newRecap });
    }

    // Smart Merge Logic
    const incomingAnomalies: any[] = payload.missing_sep_details || [];
    const incomingRMs = new Set(incomingAnomalies.map((a: any) => a.no_rm));
    const existingDetails = existingRecap.missing_sep_details as any[];

    const mergedAnomalies: any[] = [];

    existingDetails.forEach((existingAnomaly: any) => {
      if (incomingRMs.has(existingAnomaly.no_rm)) {
        const updatedInfo = incomingAnomalies.find((a: any) => a.no_rm === existingAnomaly.no_rm);
        existingAnomaly.nama = updatedInfo.nama;
        existingAnomaly.asuransi = updatedInfo.asuransi;
        mergedAnomalies.push(existingAnomaly);
      } else {
        if (['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(existingAnomaly.status)) {
          existingAnomaly.status = 'RESOLVED';
          existingAnomaly.resolvedAt = new Date();
          existingAnomaly.audit_logs.push({
            action: 'System Auto-Resolve',
            note: 'SEP terdeteksi pada hasil unggahan rekap Excel terbaru.',
            by: 'Sistem',
            timestamp: new Date()
          });
        }
        mergedAnomalies.push(existingAnomaly);
      }
    });

    const existingRMs = new Set(existingDetails.map((a: any) => a.no_rm));
    incomingAnomalies.forEach((incomingAnomaly: any) => {
      if (!existingRMs.has(incomingAnomaly.no_rm)) {
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

    const newMissingCount = mergedAnomalies.filter(
      (a: any) => !['RESOLVED', 'IGNORED', 'REJECTED'].includes(a.status)
    ).length;

    const savedRecap = await prisma.dailyRecap.update({
      where: { id: existingRecap.id },
      data: {
        total_patients: payload.total_patients,
        staff_performance: payload.staff_performance || [],
        missing_sep_details: mergedAnomalies,
        missing_sep_count: newMissingCount,
      }
    });

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
    if (!date) return NextResponse.json({ success: false, error: 'Parameter date diperlukan.' }, { status: 400 });

    const result = await prisma.dailyRecap.delete({ where: { date: new Date(date) } });
    return NextResponse.json({ success: true, message: `Rekap tanggal ${date} berhasil dihapus.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
