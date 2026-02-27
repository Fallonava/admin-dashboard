import type { Doctor, Shift, LeaveRequest, Settings } from "@/lib/data-service";
import { prisma } from "@/lib/prisma";
import { notifyDoctorUpdates } from "./automation-broadcaster";

// utility functions (copy from hook)
function parseTimeToMinutes(timeStr: string | undefined): number | null {
    if (!timeStr) return null;
    const t = timeStr.trim().toLowerCase();
    const ampm = t.match(/(am|pm)$/);
    let cleaned = t.replace(/\s*(am|pm)$/, '');
    cleaned = cleaned.replace('.', ':');
    const parts = cleaned.split(':');
    if (parts.length < 2) return null;
    let h = parseInt(parts[0]);
    let m = parseInt(parts[1]);
    if (isNaN(h) || isNaN(m)) return null;
    if (ampm) {
        const ap = ampm[1];
        if (ap === 'pm' && h < 12) h += 12;
        if (ap === 'am' && h === 12) h = 0;
    }
    return h * 60 + m;
}

function formatDateYMD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isDateInRange(todayStr: string, dateRange: string): boolean {
    if (!dateRange) return false;
    const standardMatch = dateRange.match(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (standardMatch) {
        return todayStr >= standardMatch[1] && todayStr <= standardMatch[2];
    }
    const singleISO = dateRange.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (singleISO) return todayStr === singleISO[1];
    const legacyMatch = dateRange.match(/([A-Za-zçéÉ]+)\s+(\d{1,2})\s*-\s*(\d{1,2})/i);
    const monthMap: Record<string, string> = {
        'jan': '01', 'january': '01', 'janvier': '01',
        'feb': '02', 'february': '02', 'februari': '02',
        'mar': '03', 'march': '03', 'maret': '03',
        'apr': '04', 'april': '04',
        'may': '05', 'mei': '05',
        'jun': '06', 'june': '06', 'juni': '06',
        'jul': '07', 'july': '07', 'juli': '07',
        'aug': '08', 'august': '08', 'agustus': '08',
        'sep': '09', 'september': '09',
        'oct': '10', 'october': '10', 'oktober': '10',
        'nov': '11', 'november': '11',
        'dec': '12', 'december': '12', 'desember': '12'
    };
    if (legacyMatch) {
        const monthStr = legacyMatch[1].toLowerCase();
        const startDay = parseInt(legacyMatch[2]);
        const endDay = parseInt(legacyMatch[3]);
        const mm = monthMap[monthStr];
        if (!mm) return false;
        const year = todayStr.substring(0, 4);
        const rangeStart = `${year}-${mm}-${String(startDay).padStart(2, '0')}`;
        const rangeEnd = `${year}-${mm}-${String(endDay).padStart(2, '0')}`;
        return todayStr >= rangeStart && todayStr <= rangeEnd;
    }
    try {
        const parsed = new Date(dateRange);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return todayStr === `${y}-${m}-${d}`;
        }
    } catch { }
    return false;
}

function matchDoctorName(leaveName: string, doctorName: string): boolean {
    const normalize = (s: string) => s.toLowerCase()
        .replace(/^dr\.?\s*/i, '')
        .replace(/,?\s*sp\.?\s*\w+/gi, '')
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    const a = normalize(leaveName);
    const b = normalize(doctorName);
    if (a === b) return true;
    return a.includes(b) || b.includes(a);
}
// Evaluate a set of automation rules against provided data. Returns status updates that
// would be applied without mutating anything. This lets us simulate/test rules.
export function evaluateRules(
    rules: any[],
    doctors: Doctor[],
    shifts: Shift[],
    leaves: LeaveRequest[],
    now?: Date
): Array<{ id: string | number; status: Doctor['status'] }> {
    const updates: Array<{ id: string | number; status: Doctor['status'] }> = [];
    const ts = now || new Date();
    const currentDayIdx = ts.getDay() === 0 ? 6 : ts.getDay() - 1;
    const currentHour = ts.getHours();
    const currentMinute = ts.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const todayStr = formatDateYMD(ts);

    for (const rule of rules) {
        try {
            const cond: any = rule.condition || {};
            const act: any = rule.action || {};
            for (const doc of doctors) {
                let match = true;
                if (cond.doctorName) {
                    if (!matchDoctorName(cond.doctorName, doc.name)) match = false;
                }
                if (cond.status && cond.status !== doc.status) match = false;
                if (cond.dateRange) {
                    if (!isDateInRange(todayStr, cond.dateRange)) match = false;
                }
                if (cond.timeRange) {
                    const parts = String(cond.timeRange).split('-');
                    if (parts.length === 2) {
                        const s = parseTimeToMinutes(parts[0]);
                        const e = parseTimeToMinutes(parts[1]);
                        if (s === null || e === null) match = false;
                        else if (!(currentTimeMinutes >= s && currentTimeMinutes < e)) match = false;
                    }
                }
                if (!match) continue;
                if (act.status && doc.status !== act.status) {
                    if (!updates.some(u => String(u.id) === String(doc.id))) {
                        updates.push({ id: doc.id, status: act.status });
                    }
                }
            }
        } catch (e) {
            console.warn('rule evaluate error', (rule && (rule as any).id) || '<unknown>', e);
        }
    }
    return updates;
}
export async function runAutomation(): Promise<{ applied: number, failed: number }> {
    const runStartTime = Date.now();
    let applied = 0, failed = 0;
    let error: string | null = null;

    try {
        // fetch data
        const rawDoctors = await prisma.doctor.findMany();
        // normalize BigInt fields and types coming from Prisma
        const doctors = rawDoctors.map(d => ({
            ...d,
            id: String(d.id),
            lastManualOverride: d.lastManualOverride !== null ? Number(d.lastManualOverride) : undefined
        })) as unknown as Doctor[];

        const rawShifts = await prisma.shift.findMany();
        const shifts = rawShifts.map(s => ({ ...s, id: Number(s.id) })) as unknown as Shift[];

        const rawLeaves = await prisma.leaveRequest.findMany();
        const leaves = rawLeaves.map(l => ({ ...l, id: Number(l.id) })) as unknown as LeaveRequest[];

        const settingsRow = await prisma.settings.findFirst();
        const settings: Settings | null = settingsRow ? {
            ...settingsRow,
            id: Number(settingsRow.id),
            runTextMessage: settingsRow.runTextMessage ?? undefined,
            emergencyMode: settingsRow.emergencyMode ?? undefined,
            customMessages: (settingsRow as any).customMessages ?? undefined,
        } : null;

        // prepare updates collector early so rules can push into it
        // collector for status updates (populated by rules and evaluation)
        const updates: Array<{ id: string | number; status: Doctor['status'] }> = [];

        // compute current time/day context for rule evaluation
        const now = new Date();
        const currentDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const todayStr = formatDateYMD(now);

        // load active rules if model exists in Prisma schema (optional)
        const rules: any[] = (prisma as any).automationRule ? await (prisma as any).automationRule.findMany({ where: { active: true } }) : [];
        if (rules.length > 0) {
            console.debug('[automation] loaded', rules.length, 'active rules');
        }
        updates.push(...evaluateRules(rules, doctors, shifts, leaves, now));

        const automationEnabled = settings?.automationEnabled || false;
        if (!automationEnabled || doctors.length === 0 || shifts.length === 0) {
            return { applied: 0, failed: 0 };
        }

        // (time context already computed above)

        for (const doc of doctors) {
            if (doc.status === 'OPERASI') continue;
            const isOnLeaveToday = leaves.some(leave =>
                matchDoctorName(leave.doctor, doc.name) &&
                isDateInRange(todayStr, leave.dates)
            );
            if (isOnLeaveToday) {
                if (doc.status !== 'CUTI') updates.push({ id: doc.id, status: 'CUTI' });
                continue;
            }
            if (doc.status === 'CUTI' && !isOnLeaveToday) {
                updates.push({ id: doc.id, status: 'TIDAK PRAKTEK' });
                continue;
            }
            const todayShifts = shifts.filter(s =>
                s.doctor === doc.name && s.dayIdx === currentDayIdx && s.formattedTime &&
                !(s.disabledDates || []).includes(todayStr)
            );
            if (todayShifts.length === 0) {
                if (doc.status === 'BUKA' || doc.status === 'SELESAI') {
                    updates.push({ id: doc.id, status: 'TIDAK PRAKTEK' });
                }
                continue;
            }
            let isWithinAnyShift = false;
            let isAfterAllShifts = true;
            let latestEndMinutes = 0;
            for (const shift of todayShifts) {
                const [startStr, endStr] = shift.formattedTime!.split('-');
                const startMinutes = parseTimeToMinutes(startStr);
                const endMinutes = parseTimeToMinutes(endStr);
                if (startMinutes === null || endMinutes === null) continue;
                if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
                    isWithinAnyShift = true;
                }
                if (currentTimeMinutes < endMinutes) {
                    isAfterAllShifts = false;
                }
                if (endMinutes > latestEndMinutes) {
                    latestEndMinutes = endMinutes;
                }
            }
            if (isWithinAnyShift) {
                if (doc.status !== 'PENUH' && (doc.status === 'TIDAK PRAKTEK' || doc.status === 'SELESAI')) {
                    updates.push({ id: doc.id, status: 'BUKA' });
                }
            } else if (isAfterAllShifts && latestEndMinutes > 0) {
                if (doc.status === 'BUKA' || doc.status === 'PENUH' || doc.status === 'TIDAK PRAKTEK') {
                    updates.push({ id: doc.id, status: 'SELESAI' });
                }
            } else if (!isWithinAnyShift && !isAfterAllShifts) {
                if (doc.status === 'SELESAI') {
                    updates.push({ id: doc.id, status: 'BUKA' });
                }
            }
        }

        try {
            if (updates.length > 0) {
                try {
                    await fetch('http://localhost:3000/api/doctors?action=bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates)
                    });
                    applied = updates.length;
                } catch {
                    // fallback to individual
                    const concurrency = 5;
                    for (let i = 0; i < updates.length; i += concurrency) {
                        const chunk = updates.slice(i, i + concurrency);
                        const promises = chunk.map(u =>
                            prisma.doctor.update({ where: { id: String(u.id) }, data: { status: u.status } })
                        );
                        const results = await Promise.allSettled(promises);
                        results.forEach(r => r.status === 'fulfilled' ? applied++ : failed++);
                    }
                }
            }
        } catch (err) {
            error = (err as any)?.message ?? String(err);
            throw err;
        }

        if (applied > 0) {
            // notify any listeners about which doctors changed
            notifyDoctorUpdates(updates.map(u => ({ id: u.id })));
        }
    } catch (err) {
        const errMsg = (err as any)?.message ?? String(err);
        console.error('[automation] run failed:', errMsg);
        error = errMsg;
    } finally {
        // Record run to automationLog
        const duration = Date.now() - runStartTime;
        if ((prisma as any).automationLog) {
            try {
                await (prisma as any).automationLog.create({
                    data: {
                        type: error ? 'error' : 'run',
                        details: {
                            applied,
                            failed,
                            error,
                            durationMs: duration,
                            timestamp: new Date().toISOString()
                        }
                    }
                });
            } catch (writeErr) {
                console.error('failed writing automationLog', writeErr);
            }
        }
    }

    return { applied, failed };
}
