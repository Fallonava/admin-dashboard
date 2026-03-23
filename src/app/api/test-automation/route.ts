import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { determineIdealStatus } from '@/lib/automation';
import type { Doctor, Shift, LeaveRequest } from '@/lib/data-service';

export async function GET(req: Request) {
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const currentDayIdx = wibTime.getUTCDay() === 0 ? 6 : wibTime.getUTCDay() - 1;
    const currentHour = wibTime.getUTCHours();
    const currentMinute = wibTime.getUTCMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const todayStr = `${wibTime.getUTCFullYear()}-${String(wibTime.getUTCMonth() + 1).padStart(2, '0')}-${String(wibTime.getUTCDate()).padStart(2, '0')}`;

    const rawDoctors = await prisma.doctor.findMany();
    const rawShifts = await prisma.shift.findMany({ where: { dayIdx: currentDayIdx } });
    const rawLeaves = await prisma.leaveRequest.findMany();

    const results = [];

    for (const rawDoc of rawDoctors) {
        const doc = {
            ...rawDoc,
            id: String(rawDoc.id),
            lastManualOverride: rawDoc.lastManualOverride !== null ? Number(rawDoc.lastManualOverride) : undefined
        } as unknown as Doctor;

        const isCooldownActive = doc.lastManualOverride
                ? (now.getTime() - Number(doc.lastManualOverride)) < (4 * 60 * 60 * 1000)
                : false;

        const todayShifts = rawShifts.filter(s =>
            s.doctorId === doc.id && s.dayIdx === currentDayIdx && s.formattedTime &&
            !(s.disabledDates || []).includes(todayStr)
        ) as unknown as Shift[];

        const docLeaves = rawLeaves.filter(l => l.doctorId === doc.id) as unknown as LeaveRequest[];

        const idealStatus = determineIdealStatus(doc, todayShifts, docLeaves, currentTimeMinutes, todayStr, isCooldownActive);

        results.push({
            name: doc.name,
            currentStatus: doc.status,
            idealStatus: idealStatus,
            shiftsFound: todayShifts.length,
            leavesFound: docLeaves.length,
            isCooldownActive
        });
    }

    return NextResponse.json({
        timeInfo: { currentTimeMinutes, currentHour, currentMinute, todayStr, currentDayIdx },
        evaluations: results
    });
}
