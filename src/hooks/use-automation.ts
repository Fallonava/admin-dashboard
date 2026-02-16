
import { useEffect, useRef } from "react";
import useSWR, { mutate } from "swr";
import type { Doctor, Shift, Settings, LeaveRequest } from "@/lib/data-service";

export function useAutomation() {
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const { data: shifts = [] } = useSWR<Shift[]>('/api/shifts');
    const { data: leaves = [] } = useSWR<LeaveRequest[]>('/api/leaves');
    const { data: settings } = useSWR<Settings>('/api/settings');

    const automationEnabled = settings?.automationEnabled || false;
    const lastRunRef = useRef<number>(0);

    useEffect(() => {
        if (!automationEnabled || doctors.length === 0 || shifts.length === 0) return;

        const checkAutomation = () => {
            const now = new Date();
            // Throttle: run at most every 5 seconds
            if (now.getTime() - lastRunRef.current < 5000) return;
            lastRunRef.current = now.getTime();

            const currentDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            const currentTs = now.getTime();

            // Format today's date as YYYY-MM-DD for leave comparison
            const todayStr = formatDateYMD(now);

            doctors.forEach(async (doc) => {
                // Skip OPERASI — always manual
                if (doc.status === 'OPERASI') return;

                // === CHECK LEAVE (CUTI) ===
                const isOnLeaveToday = leaves.some(leave =>
                    leave.status === 'Approved' &&
                    matchDoctorName(leave.doctor, doc.name) &&
                    isDateInRange(todayStr, leave.dates)
                );

                if (isOnLeaveToday) {
                    if (doc.status !== 'CUTI') {
                        await autoUpdateStatus(doc.id, 'CUTI');
                    }
                    return;
                }

                // If doctor WAS on CUTI but leave ended, bring them back
                if (doc.status === 'CUTI' && !isOnLeaveToday) {
                    await autoUpdateStatus(doc.id, 'Idle');
                    return;
                }

                // === SHIFT-BASED STATUS ===
                // Get ALL active shifts for this doctor today (skip disabled shifts)
                const todayShifts = shifts.filter(s =>
                    s.doctor === doc.name && s.dayIdx === currentDayIdx && s.formattedTime && !s.disabled
                );

                if (todayShifts.length === 0) {
                    // No shift today → should be Idle
                    if (doc.status === 'BUKA' || doc.status === 'Istirahat') {
                        await autoUpdateStatus(doc.id, 'Idle');
                    }
                    return;
                }

                // Check if currently within ANY of the doctor's shifts
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
                    // During shift → BUKA (unless PENUH/Istirahat — manual states)
                    if (doc.status === 'Idle' || doc.status === 'TIDAK PRAKTEK' || doc.status === 'SELESAI') {
                        await autoUpdateStatus(doc.id, 'BUKA');
                    }
                } else if (isAfterAllShifts && latestEndMinutes > 0) {
                    // After ALL shifts end → SELESAI
                    if (doc.status === 'BUKA' || doc.status === 'PENUH' || doc.status === 'Istirahat') {
                        await autoUpdateStatus(doc.id, 'SELESAI');
                    }
                }
                // Before first shift: do nothing (keep current state)
            });
        };

        const autoInterval = setInterval(checkAutomation, 5000);
        checkAutomation();
        return () => clearInterval(autoInterval);
    }, [automationEnabled, doctors, shifts, leaves]);
}

// === HELPERS ===

function parseTimeToMinutes(timeStr: string | undefined): number | null {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    if (isNaN(h) || isNaN(m)) return null;
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

    const legacyMatch = dateRange.match(/([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2})/);
    if (legacyMatch) {
        const monthStr = legacyMatch[1];
        const startDay = parseInt(legacyMatch[2]);
        const endDay = parseInt(legacyMatch[3]);
        const monthMap: Record<string, string> = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const mm = monthMap[monthStr];
        if (!mm) return false;
        const year = todayStr.substring(0, 4);
        const rangeStart = `${year}-${mm}-${String(startDay).padStart(2, '0')}`;
        const rangeEnd = `${year}-${mm}-${String(endDay).padStart(2, '0')}`;
        return todayStr >= rangeStart && todayStr <= rangeEnd;
    }

    return false;
}

function matchDoctorName(leaveName: string, doctorName: string): boolean {
    const normalize = (s: string) => s.toLowerCase()
        .replace(/^dr\.?\s*/i, '')
        .replace(/,?\s*sp\.?\s*\w+/gi, '')
        .trim();
    return normalize(leaveName) === normalize(doctorName);
}

async function autoUpdateStatus(id: string | number, status: Doctor['status']) {
    try {
        await fetch('/api/doctors', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, isAuto: true })
        });
        mutate('/api/doctors');
    } catch (e) {
        console.error("Auto-update failed", e);
    }
}
