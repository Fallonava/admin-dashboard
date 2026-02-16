
import { useEffect, useRef } from "react";
import useSWR, { mutate } from "swr";
import type { Doctor, Shift, Settings } from "@/lib/data-service";

export function useAutomation() {
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const { data: shifts = [] } = useSWR<Shift[]>('/api/shifts');
    const { data: settings } = useSWR<Settings>('/api/settings');

    const automationEnabled = settings?.automationEnabled || false;
    const lastRunRef = useRef<number>(0);

    useEffect(() => {
        if (!automationEnabled || doctors.length === 0 || shifts.length === 0) return;

        const checkAutomation = () => {
            const now = new Date();
            // Trottle: run at most every 5 seconds
            if (now.getTime() - lastRunRef.current < 5000) return;
            lastRunRef.current = now.getTime();

            const currentDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon
            const currentHour = now.getHours();
            const currentTs = now.getTime();
            const OVERRIDE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

            doctors.forEach(async (doc) => {
                // Skip if currently on leave or break or operating
                if (['CUTI', 'OPERASI', 'ISTIRAHAT'].includes(doc.status)) return;

                // SKIP if manually overridden recently
                if (doc.lastManualOverride && (currentTs - doc.lastManualOverride < OVERRIDE_TIMEOUT)) {
                    return;
                }

                // Find active shift for this doctor
                const activeShift = shifts.find(s => {
                    if (s.doctor !== doc.name || s.dayIdx !== currentDayIdx || !s.formattedTime) return false;
                    const [startStr, endStr] = s.formattedTime.split('-');
                    const startH = parseInt(startStr?.split(':')[0] || '0');
                    const endH = parseInt(endStr?.split(':')[0] || '24');
                    return currentHour >= startH && currentHour < endH;
                });

                let newStatus: Doctor['status'] = 'Idle';
                if (activeShift) {
                    newStatus = 'BUKA'; // Default to Open if shift is active
                }

                // If status should change, update it
                if (doc.status !== newStatus && doc.status !== 'PENUH') { // Respect 'PENUH' as a manual-like state
                    if (doc.status === 'Idle' && newStatus === 'BUKA') {
                        await autoUpdateStatus(doc.id, 'BUKA');
                    } else if ((doc.status === 'BUKA') && newStatus === 'Idle') {
                        await autoUpdateStatus(doc.id, 'Idle');
                    }
                }
            });
        };

        const autoInterval = setInterval(checkAutomation, 5000); // Check every 5s
        checkAutomation(); // Run immediately
        return () => clearInterval(autoInterval);
    }, [automationEnabled, doctors, shifts]);
}

// Helper for Automation (does NOT set manual override flag)
async function autoUpdateStatus(id: string | number, status: Doctor['status']) {
    try {
        await fetch('/api/doctors', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, isAuto: true }) // isAuto flag to prevent override timestamp update
        });
        mutate('/api/doctors');
    } catch (e) {
        console.error("Auto-update failed", e);
    }
}
