import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Compute today's WIB day index
    const wibDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const todayDayIdx = (wibDate.getDay() + 6) % 7;
    const tomorrowDayIdx = (todayDayIdx + 1) % 7;

    const [doctors, leaves] = await Promise.all([
      prisma.doctor.findMany({
        orderBy: [{ specialty: 'asc' }, { name: 'asc' }],
        include: {
          shifts: {
            select: { dayIdx: true, formattedTime: true, title: true },
          },
        },
      }),
      prisma.leaveRequest.findMany({
        where: { status: 'APPROVED', endDate: { gte: new Date() } },
        select: {
          doctorId: true,
          startDate: true,
          endDate: true,
          type: true,
          reason: true,
        },
      }),
    ]);

    // Build a leave lookup map by doctorId
    const leaveMap = new Map<string, typeof leaves[0][]>();
    for (const l of leaves) {
      if (!leaveMap.has(l.doctorId)) leaveMap.set(l.doctorId, []);
      leaveMap.get(l.doctorId)!.push(l);
    }

    const serialized = doctors.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      status: d.status,
      image: d.image,
      category: d.category,
      queueCode: d.queueCode,
      registrationTime: d.registrationTime,
      order: d.order,
      shifts: d.shifts,
      leaveRequests: (leaveMap.get(d.id) ?? []).map(l => ({
        ...l,
        startDate: l.startDate.toISOString(),
        endDate: l.endDate.toISOString(),
      })),
    }));

    return NextResponse.json({ doctors: serialized, todayDayIdx, tomorrowDayIdx }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=59'
      }
    });
  } catch (err) {
    console.error('Public dokter API error:', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
