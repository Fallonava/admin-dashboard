import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/jadwal/override?month=2026-04
// Ambil semua override untuk bulan tertentu
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult) return authResult;

  const month = req.nextUrl.searchParams.get('month'); // e.g. "2026-04"
  if (!month) return NextResponse.json({ error: 'month wajib diisi' }, { status: 400 });

  const overrides = await prisma.shiftOverride.findMany({
    where: { dateStr: { startsWith: month } },
    orderBy: { dateStr: 'asc' },
  });

  // Transformasi ke format { staffId: { dateStr: shiftValue } }
  const map: Record<string, Record<string, string>> = {};
  for (const ov of overrides) {
    if (!map[ov.staffId]) map[ov.staffId] = {};
    map[ov.staffId][ov.dateStr] = ov.shiftValue;
  }

  return NextResponse.json({ success: true, data: map });
}

// POST /api/jadwal/override — set satu override (upsert)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult) return authResult;

  const body = await req.json();
  const { staffId, dateStr, shiftValue } = body;

  if (!staffId || !dateStr || !shiftValue) {
    return NextResponse.json({ error: 'staffId, dateStr, shiftValue wajib diisi' }, { status: 400 });
  }

  if (shiftValue === 'CLEAR') {
    // Hapus override jika CLEAR
    await prisma.shiftOverride.deleteMany({ where: { staffId, dateStr } });
  } else {
    await prisma.shiftOverride.upsert({
      where:  { staffId_dateStr: { staffId, dateStr } },
      create: { staffId, dateStr, shiftValue },
      update: { shiftValue },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/jadwal/override?staffId=s1&month=2026-04
// Reset semua override satu staf untuk bulan ini
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult) return authResult;

  const staffId = req.nextUrl.searchParams.get('staffId');
  const month   = req.nextUrl.searchParams.get('month');

  if (staffId && month) {
    await prisma.shiftOverride.deleteMany({ where: { staffId, dateStr: { startsWith: month } } });
  } else if (month) {
    // Reset semua staf untuk bulan ini
    await prisma.shiftOverride.deleteMany({ where: { dateStr: { startsWith: month } } });
  }

  return NextResponse.json({ success: true });
}
