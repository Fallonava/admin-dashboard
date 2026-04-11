import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CREATE (Manual Addition)
export async function POST(request: Request) {
  try {
    const { date, no_rm, nama, asuransi, user } = await request.json();

    if (!date || !no_rm || !nama || !asuransi || !user) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    let recap = await prisma.dailyRecap.findUnique({ where: { date: new Date(date) } });

    if (!recap) {
      recap = await prisma.dailyRecap.create({
        data: { date: new Date(date), total_patients: 0, missing_sep_count: 0, staff_performance: [], missing_sep_details: [] }
      });
    }

    const details = recap.missing_sep_details as any[];
    if (details.some((d: any) => d.no_rm === no_rm)) {
      return NextResponse.json({ success: false, error: 'Patient RM already exists in anomalies for this date' }, { status: 400 });
    }

    details.push({
      no_rm, nama, asuransi,
      status: 'OPEN',
      audit_logs: [{ action: 'Manually Added', note: 'Added manually via dashboard', by: user, timestamp: new Date() }]
    });

    const updated = await prisma.dailyRecap.update({
      where: { id: recap.id },
      data: { missing_sep_details: details, missing_sep_count: recap.missing_sep_count + 1 }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// UPDATE (Edit details)
export async function PUT(request: Request) {
  try {
    const { recap_id, original_no_rm, no_rm, nama, asuransi, user } = await request.json();

    if (!recap_id || !original_no_rm || !no_rm || !nama || !asuransi || !user) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const recap = await prisma.dailyRecap.findUnique({ where: { id: recap_id } });
    if (!recap) return NextResponse.json({ success: false, error: 'Recap not found' }, { status: 404 });

    const details = recap.missing_sep_details as any[];
    const idx = details.findIndex((d: any) => d.no_rm === original_no_rm);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Patient anomaly not found' }, { status: 404 });

    const cur = details[idx];
    const changes = [];
    if (cur.no_rm !== no_rm) changes.push(`RM: ${cur.no_rm} -> ${no_rm}`);
    if (cur.nama !== nama) changes.push(`Nama: ${cur.nama} -> ${nama}`);
    if (cur.asuransi !== asuransi) changes.push(`Asuransi: ${cur.asuransi} -> ${asuransi}`);

    if (changes.length > 0) {
      cur.no_rm = no_rm; cur.nama = nama; cur.asuransi = asuransi;
      cur.audit_logs = cur.audit_logs || [];
      cur.audit_logs.push({ action: 'Edited Details', note: changes.join(', '), by: user, timestamp: new Date() });
    }

    const updated = await prisma.dailyRecap.update({ where: { id: recap_id }, data: { missing_sep_details: details } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recap_id = searchParams.get('recap_id');
    const no_rm = searchParams.get('no_rm');

    if (!recap_id || !no_rm) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const recap = await prisma.dailyRecap.findUnique({ where: { id: recap_id } });
    if (!recap) return NextResponse.json({ success: false, error: 'Recap not found' }, { status: 404 });

    const details = recap.missing_sep_details as any[];
    const idx = details.findIndex((d: any) => d.no_rm === no_rm);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Patient anomaly not found' }, { status: 404 });

    details.splice(idx, 1);

    const updated = await prisma.dailyRecap.update({
      where: { id: recap_id },
      data: { missing_sep_details: details, missing_sep_count: Math.max(0, recap.missing_sep_count - 1) }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
