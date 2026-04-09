import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Default staff data (seeded jika belum ada di DB)
const DEFAULT_STAFF = [
  { id:'s1', staffName:'IBNU ISWANTORO',    cycle:['P12','P12','P10','P8','P6','P6','P8','P8','P6','P6'], isSpecial:false, sortOrder:0 },
  { id:'s2', staffName:'FAISHAL FADHLULLOH',cycle:['P10','P8','P6','P6','P8','P8','P6','P6','P12','P12'], isSpecial:false, sortOrder:1 },
  { id:'s3', staffName:'TEDI DWI C',        cycle:['P6','P6','P8','P8','P6','P6','P12','P12','P10','P8'], isSpecial:false, sortOrder:2 },
  { id:'s4', staffName:'SIDIQ ARIEF P',     cycle:['P8','P8','P6','P6','P12','P12','P10','P8','P6','P6'], isSpecial:false, sortOrder:3 },
  { id:'s5', staffName:'NUR SYAHID',        cycle:['P6','P6','P12','P12','P10','P8','P6','P6','P8','P8'], isSpecial:false, sortOrder:4 },
  { id:'s6', staffName:'RIDHO R',           cycle:[], isSpecial:true, sortOrder:5 },
];

// GET /api/jadwal/staff — ambil semua config staf
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult) return authResult;

  // Seed default jika tabel kosong
  const count = await prisma.staffShiftConfig.count();
  if (count === 0) {
    await prisma.staffShiftConfig.createMany({ data: DEFAULT_STAFF });
  }

  const staff = await prisma.staffShiftConfig.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ success: true, data: staff });
}

// PATCH /api/jadwal/staff — update nama atau siklus satu staf
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult) return authResult;

  const body = await req.json();
  const { id, staffName, cycle } = body;

  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });

  const updated = await prisma.staffShiftConfig.update({
    where: { id },
    data: {
      ...(staffName !== undefined && { staffName }),
      ...(cycle     !== undefined && { cycle }),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

// POST /api/jadwal/staff — tambah petugas baru
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult) return authResult;

  const body = await req.json();
  const { staffName, cycle, isSpecial } = body;

  if (!staffName?.trim()) {
    return NextResponse.json({ error: 'staffName wajib diisi' }, { status: 400 });
  }

  // Auto-generate unique id & sortOrder
  const maxOrder = await prisma.staffShiftConfig.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;
  const newId = `s_${Date.now().toString(36)}`;

  const created = await prisma.staffShiftConfig.create({
    data: {
      id: newId,
      staffName: staffName.trim().toUpperCase(),
      cycle: Array.isArray(cycle) ? cycle : ['P8','P8','P6','P6','P12','P12','P10','P8','P6','P6'],
      isSpecial: isSpecial ?? false,
      sortOrder: nextOrder,
    },
  });

  return NextResponse.json({ success: true, data: created });
}

// DELETE /api/jadwal/staff — hapus petugas
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult) return authResult;

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });

  await prisma.staffShiftConfig.delete({ where: { id } });
  // Also clean up any overrides for this staff
  await prisma.shiftOverride.deleteMany({ where: { staffId: id } });

  return NextResponse.json({ success: true });
}
