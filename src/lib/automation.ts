import type { Doctor, Shift, LeaveRequest, Settings } from "./data-service";
import { prisma } from "./prisma";
import { notifyDoctorUpdates, syncAdminData } from "./automation-broadcaster";
import { getFullSnapshot } from "./data-fetchers";
// NOTE: revalidatePath is loaded dynamically because this module runs
// inside the custom server.ts context where next/cache is unavailable.
import { logger } from './logger';

// Fungsi Utilitas Internal

/**
 * Mengonversi string waktu (misal: "09:00", "5 PM") menjadi total menit sejak tengah malam.
 * @param timeStr String waktu mentah.
 * @returns Total menit, atau null jika gagal parsing.
 */
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

/**
 * Memformat objek Date menjadi string format YYYY-MM-DD.
 * @param date Objek Date.
 * @returns String tanggal format pendek.
 */
function formatDateYMD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Mengecek apakah tanggal tertentu (hari ini) masuk dalam periode cuti.
 * Mengabaikan zona waktu dengan melakukan komparasi utuh pada tengah malam waktu lokal.
 * @param todayStr Tanggal dalam string format YYYY-MM-DD.
 * @param startDate Waktu mulai cuti.
 * @param endDate Waktu selesai cuti.
 * @returns True jika masuk rentang tanggal cuti.
 */
function isDateInLeavePeriod(todayStr: string, startDate: Date | string | null, endDate: Date | string | null): boolean {
    if (!startDate || !endDate) return false;

    // Normalize todayStr (YYYY-MM-DD) into components
    const todayMatch = todayStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!todayMatch) return false;

    // To avoid timezone shift issues, parse strictly to midnight local time for comparison
    const target = new Date(Number(todayMatch[1]), Number(todayMatch[2]) - 1, Number(todayMatch[3]));
    target.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    const end = new Date(endDate);

    // We only care about YMD boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
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
/**
 * Mesin Status Deterministik (Deterministic State Machine) untuk mengkalkulasi status ideal seorang dokter pada waktu saat ini.
 * Mempertimbangkan status cuti, jadwal shift, dan intervensi manual (cooldown).
 * @param doc Instansi data dokter dari database.
 * @param todayShifts Array jadwal dokter yang relevan hari ini.
 * @param leaves Array status cuti.
 * @param currentTimeMinutes Waktu server saat ini dalam menit dari tengah malam.
 * @param todayStr Tanggal hari ini formated YYYY-MM-DD.
 * @param isCooldownActive Menandai apakah sedang ada intervensi manual dalam 4 jam terakhir.
 * @returns Status deterministik final.
 */
export function determineIdealStatus(
    doc: Doctor,
    todayShifts: Shift[],
    leaves: LeaveRequest[],
    currentTimeMinutes: number,
    todayStr: string,
    isCooldownActive: boolean
): Doctor['status'] {
    // 1. Cuti Check
    const isOnLeaveToday = leaves.some(leave =>
        leave.doctorId === doc.id &&
        isDateInLeavePeriod(todayStr, leave.startDate, leave.endDate)
    );
    if (isOnLeaveToday) return 'CUTI';

    // 2. No Shifts Today Check
    if (todayShifts.length === 0) return 'LIBUR';

    // 3. Time-based State Calculation
    let isWithinAnyShift = false;
    let isAfterAllShifts = true;
    let activeShiftStatusOverride: Doctor['status'] | null = null;
    let latestEndMinutes = 0;

    for (const shift of todayShifts) {
        if (!shift.formattedTime) continue;
        const [startStr, endStr] = shift.formattedTime.split('-');
        const startMinutes = parseTimeToMinutes(startStr);
        const endMinutes = parseTimeToMinutes(endStr);
        if (startMinutes === null || endMinutes === null) continue;

        if (endMinutes > latestEndMinutes) latestEndMinutes = endMinutes;

        if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
            isWithinAnyShift = true;
            if (shift.statusOverride) activeShiftStatusOverride = shift.statusOverride as Doctor['status'];
        }
        if (currentTimeMinutes < endMinutes) {
            isAfterAllShifts = false;
        }
    }

    // Sweep check: If the day is completely over, force SELESAI (respects cooldown)
    if (isAfterAllShifts && latestEndMinutes > 0) {
        if (isCooldownActive) return doc.status;
        return 'SELESAI';
    }

    // Inside Shift -> PRAKTEK (or override)
    if (isWithinAnyShift) {
        if (isCooldownActive) return doc.status;
        return activeShiftStatusOverride || 'PRAKTEK';
    }

    // Checks Registration Window for Upcoming Shifts
    // Default lookahead if no registrationTime is provided: 30 minutes
    const DEFAULT_LOOKAHEAD_MINS = 30;

    for (const shift of todayShifts) {
        if (!shift.formattedTime) continue;
        const [startStr, endStr] = shift.formattedTime.split('-');
        const startMinutes = parseTimeToMinutes(startStr);
        const endMinutes = parseTimeToMinutes(endStr);
        if (startMinutes === null || endMinutes === null) continue;

        if (currentTimeMinutes >= endMinutes) continue;

        let registrationStart = startMinutes - DEFAULT_LOOKAHEAD_MINS;
        const rTime = shift.registrationTime || doc.registrationTime;
        if (rTime) {
            const regMin = parseTimeToMinutes(rTime);
            if (regMin !== null) registrationStart = regMin;
        }

        // Inside registration window (before shift starts)
        if (currentTimeMinutes >= registrationStart && currentTimeMinutes < startMinutes) {
            if (isCooldownActive) return doc.status;
            const override = shift.statusOverride;
            return (override === 'PENUH' || override === 'OPERASI') ? override as Doctor['status'] : 'PENDAFTARAN';
        }
    }

    // Between shifts or before any registration begins
    if (isCooldownActive) return doc.status;
    return 'TERJADWAL';
}

/**
 * Mengevaluasi daftar aturan (rules) automasi terhadap ketersediaan data dokter & jadwal saat ini.
 * Mengembalikan list rekomendasi perubahan (tidak melalukan mutasi data). Fungsi ini aman (pure-like) dan bisa digunakan untuk disimulasikan.
 * @param rules Array objek aturan dari database.
 * @param doctors Daftar data semua dokter aktif.
 * @param shifts Penjadwalan shifts hari ini.
 * @param leaves Data permhonan cuti.
 * @param now Waktu eksekusi lokal (opsional).
 * @returns Array rekomendasi pembaruan.
 */
export function evaluateRules(
    rules: any[],
    doctors: Doctor[],
    shifts: Shift[],
    leaves: LeaveRequest[],
    now?: Date
): Array<{ id: string | number; status: Doctor['status'] }> {
    const updates: Array<{ id: string | number; status: Doctor['status'] }> = [];
    const ts = now || new Date();
    // Shift the date to WIB (UTC+7) so that our UTC methods get the actual Jakarta time
    const wibTime = new Date(ts.getTime() + (7 * 60 * 60 * 1000));

    const currentDayIdx = wibTime.getUTCDay() === 0 ? 6 : wibTime.getUTCDay() - 1;
    const currentHour = wibTime.getUTCHours();
    const currentMinute = wibTime.getUTCMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const todayStr = `${wibTime.getUTCFullYear()}-${String(wibTime.getUTCMonth() + 1).padStart(2, '0')}-${String(wibTime.getUTCDate()).padStart(2, '0')}`;

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
                    // Deprecated: dateRange as condition checking removed in automated leave implementation
                    // if (!isDateInRange(todayStr, cond.dateRange)) match = false;
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
            logger.warn('rule evaluate error', (rule && (rule as any).id) || '<unknown>', e);
        }
    }
    return updates;
}
/**
 * Mesin Induk Otomatisasi (Main Automation Engine).
 * Akan mengevaluasi jadwal harian, aturan khusus, cuti, dan secara langsung bermutasi ke database / queue.
 * @returns Feedback operasi (sukses terubah dan yang gagal).
 */
export async function runAutomation(): Promise<{ applied: number, failed: number }> {
    const runStartTime = Date.now();
    let applied = 0, failed = 0;
    let error: string | null = null;

    try {
        const now = new Date();
        const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const currentDayIdx = wibTime.getUTCDay() === 0 ? 6 : wibTime.getUTCDay() - 1;
        const currentHour = wibTime.getUTCHours();
        const currentMinute = wibTime.getUTCMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const todayStr = `${wibTime.getUTCFullYear()}-${String(wibTime.getUTCMonth() + 1).padStart(2, '0')}-${String(wibTime.getUTCDate()).padStart(2, '0')}`;

        // fetch data - Optimized targeted queries!
        const rawDoctors = await prisma.doctor.findMany();
        const doctors = rawDoctors.map(d => ({
            ...d,
            id: String(d.id),
            lastManualOverride: d.lastManualOverride !== null ? Number(d.lastManualOverride) : undefined
        })) as unknown as Doctor[];

        // Only fetch shifts for TODAY
        const rawShifts = await ((prisma as any).shift as any).findMany({
            where: { dayIdx: currentDayIdx }
        });
        const shifts = rawShifts.map((s: any) => {
            const docRef = rawDoctors.find(d => d.id === s.doctorId);
            return { ...s, id: Number(s.id), doctor: docRef?.name || '' };
        }) as unknown as Shift[];

        // Only fetch leaves that ended recently or are active (Optimization to prevent reading ALL history)
        const recentDateLimit = new Date(wibTime.getTime() - (24 * 60 * 60 * 1000));
        const rawLeaves = await ((prisma as any).leaveRequest as any).findMany({
            where: { endDate: { gte: recentDateLimit } }
        });
        const leaves = rawLeaves.map((l: any) => {
            const docRef = rawDoctors.find(d => d.id === l.doctorId);
            return { ...l, id: String(l.id), doctor: docRef?.name || '' };
        }) as unknown as LeaveRequest[];

        let settingsRow = await prisma.settings.findFirst();
        if (!settingsRow) {
            // Auto seed default settings jika belum ada
            settingsRow = await (prisma.settings as any).create({
                data: {
                    id: "1",
                    automationEnabled: true,
                    runTextMessage: "Selamat Datang di RSU Siaga Medika",
                    emergencyMode: false,
                    customMessages: []
                }
            });
            logger.info('[automation] Auto-seeded default Settings row with automationEnabled=true');
        }

        const settings: Settings | null = settingsRow ? {
            ...settingsRow,
            id: String(settingsRow.id),
            runTextMessage: settingsRow.runTextMessage ?? undefined,
            emergencyMode: settingsRow.emergencyMode ?? undefined,
            customMessages: (settingsRow as any).customMessages ?? undefined,
        } : null;

        // prepare updates collector early so rules can push into it
        const updates: Array<{ id: string | number; status: Doctor['status'] }> = [];

        const automationEnabled = settings?.automationEnabled || false;
        if (doctors.length === 0) {
            logger.warn('[automation] No doctors found, skipping automation run.');
            return { applied: 0, failed: 0 };
        }

        if (!automationEnabled) {
            // Even when automation is disabled, broadcast current DB state to admins
            // so the dashboard always populates on load
            logger.info('[automation] Automation disabled. Broadcasting current state only.');
            getFullSnapshot().then(snapshot => {
                syncAdminData(snapshot);
            }).catch(err => {
                logger.error('[automation] Startup broadcast failed:', err.message);
            });
            return { applied: 0, failed: 0 };
        }

        // Override cooldown: 4 hours
        const OVERRIDE_COOLDOWN_MS = 4 * 60 * 60 * 1000;

        // load active rules and evaluate them first
        const rules: any[] = (prisma as any).automationRule ? await (prisma as any).automationRule.findMany({ where: { active: true } }) : [];
        if (rules.length > 0) logger.debug('[automation] loaded', rules.length, 'active rules');
        const ruleUpdates = evaluateRules(rules, doctors, shifts, leaves, now);

        // Deterministic State Evaluation combined with rules
        for (const doc of doctors) {
            const isCooldownActive = false; // [REVISI] Penalti otomatisasi dimatikan atas perintah user agar 100% full otomatis

            const todayShifts = shifts.filter(s =>
                s.doctorId === doc.id && s.dayIdx === currentDayIdx && s.formattedTime &&
                !(s.disabledDates || []).includes(todayStr)
            );

            // 1. Check if there's a custom rule for this doctor
            const ruleUpdate = ruleUpdates.find(u => String(u.id) === String(doc.id));
            
            // 2. Use Deterministic State Machine
            const idealStatus = determineIdealStatus(doc, todayShifts, leaves, currentTimeMinutes, todayStr, isCooldownActive);

            // 3. Resolve final target status (Rules override Time-based, but Manual Cooldown overrides ALL)
            let targetStatus = doc.status;
            
            if (ruleUpdate) {
                // Custom rule takes precedence over normal schedule
                targetStatus = ruleUpdate.status;
            } else if (doc.status !== idealStatus) {
                // Otherwise fallback to schedule machine
                targetStatus = idealStatus;
            }

            // Apply ideal status
            if (doc.status !== targetStatus) {
                logger.info(`[automation DEBUG] ${doc.name} (id ${doc.id}) state changed: ${doc.status} -> ${targetStatus}`);
                updates.push({ id: doc.id, status: targetStatus });
            }
        }

        // Direct Prisma DB writes — most reliable path
        if (updates.length > 0) {
            const concurrency = 5;
            for (let i = 0; i < updates.length; i += concurrency) {
                const chunk = updates.slice(i, i + concurrency);
                const promises = chunk.map(u =>
                    prisma.doctor.update({ where: { id: String(u.id) }, data: { status: u.status as any } })
                );
                const results = await Promise.allSettled(promises);
                results.forEach(r => r.status === 'fulfilled' ? applied++ : failed++);
            }
        }

        if (applied > 0) {
            // notify any listeners about which doctors changed (SSE/Specific)
            notifyDoctorUpdates(updates.map(u => ({ id: u.id })));

            // High Performance: Fetch updated state and push to all ADMINS via Socket.io
            getFullSnapshot().then(snapshot => {
                syncAdminData(snapshot);
            }).catch(syncErr => {
                logger.error('[automation] Sync snapshot failed:', syncErr.message);
            });

            try {
                // Force Next.js to purge the static Edge Cache for the TV display
                // Dynamic import because next/cache is unavailable in custom server context
                const { revalidatePath } = await import('next/cache');
                revalidatePath('/api/display');
            } catch {
                // Expected to fail in custom server context — safe to ignore
            }
        }
    } catch (err: any) {
        const errMsg = err instanceof Error ? err.stack || err.message : String(err);
        logger.error(`[automation] run failed: ${errMsg}`);
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
                }).catch((writeErr: any) => {
                    logger.error('failed writing automationLog', writeErr);
                });
            } catch { /* ignore fallback errors */ }
        }
    }

    return { applied, failed };
}
