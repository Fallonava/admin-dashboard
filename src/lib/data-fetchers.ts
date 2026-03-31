import { prisma } from './prisma';

/**
 * Fetches all doctors with their leave requests.
 * Maps BigInt fields to Number for JSON serialization.
 */
export async function fetchDoctors() {
    const doctors = await prisma.doctor.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        include: {
            leaveRequests: true,
            shifts: true,
        }
    });
    return doctors.map(d => ({
        ...d,
        id: String(d.id),
        lastManualOverride: d.lastManualOverride ? Number(d.lastManualOverride) : null,
    }));
}

/**
 * Fetches all shifts with all fields.
 * Essential for the dashboard's todayDoctors calculation.
 */
export async function fetchShifts() {
    const shifts = await (prisma as any).shift.findMany({
        orderBy: [{ dayIdx: 'asc' }, { timeIdx: 'asc' }],
    });
    return shifts.map((s: any) => ({
        ...s,
        id: String(s.id),
        doctorId: String(s.doctorId),
        disabledDates: s.disabledDates || [],
    }));
}

/**
 * Fetches all non-rejected leave requests.
 */
export async function fetchLeaves() {
    const leaves = await (prisma as any).leaveRequest.findMany({
        where: {
            // Case-insensitive: match 'Approved', 'approved', 'Pending' etc but exclude rejected
            status: { not: 'rejected' }
        },
        orderBy: { startDate: 'asc' }
    });
    return leaves.map((l: any) => ({
        ...l,
        id: String(l.id),
        doctorId: String(l.doctorId),
    }));
}

/**
 * Fetches the global settings row.
 */
export async function fetchSettings() {
    const s = await prisma.settings.findFirst();
    if (!s) return { id: 'default', automationEnabled: false };
    return {
        ...s,
        id: String(s.id),
    };
}

/**
 * Returns the full data snapshot for broadcasting to admin clients.
 * This is the single source of truth for all admin dashboard data.
 */
export async function getFullSnapshot() {
    const [doctors, shifts, leaves, settings] = await Promise.all([
        fetchDoctors(),
        fetchShifts(),
        fetchLeaves(),
        fetchSettings(),
    ]);
    return { doctors, shifts, leaves, settings };
}
