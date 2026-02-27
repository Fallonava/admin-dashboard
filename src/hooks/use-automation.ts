
import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import type { Doctor, Settings } from "@/lib/data-service";

export function useAutomation() {
    const { data: doctors } = useSWR<Doctor[]>('/api/doctors');
    const { data: settings } = useSWR<Settings>('/api/settings');

    // revalidate doctors periodically as a fallback
    useEffect(() => {
        const iv = setInterval(() => mutate('/api/doctors'), 5000);
        return () => clearInterval(iv);
    }, []);

    // listen for server-sent events to refresh immediately
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const es = new EventSource('/api/stream/doctors');
        es.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data);
                if (msg.type === 'doctors') {
                    mutate('/api/doctors');
                }
            } catch (e) {
                console.warn('invalid SSE message', e);
            }
        };
        es.onerror = () => {
            // attempt reconnect after delay
            es.close();
            setTimeout(() => {
                // just create a new EventSource
                const newEs = new EventSource('/api/stream/doctors');
                newEs.onmessage = es.onmessage;
                newEs.onerror = es.onerror;
            }, 5000);
        };
        return () => es.close();
    }, []);
}

// === HELPERS ===

function parseTimeToMinutes(timeStr: string | undefined): number | null {
    if (!timeStr) return null;
    const t = timeStr.trim().toLowerCase();
    // Remove am/pm if present (assume 24h preferred)
    const ampm = t.match(/(am|pm)$/);
    let cleaned = t.replace(/\s*(am|pm)$/, '');
    // Accept separators ':' or '.'
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
    // YYYY-MM-DD - YYYY-MM-DD
    const standardMatch = dateRange.match(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (standardMatch) {
        return todayStr >= standardMatch[1] && todayStr <= standardMatch[2];
    }

    // Single ISO date
    const singleISO = dateRange.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (singleISO) return todayStr === singleISO[1];

    // Month name formats, support English short/full and Indonesian full names
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

    // Fallback: if the string can be parsed to a single date, compare
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
    // fallback: partial match (e.g., leave record may be shorter)
    return a.includes(b) || b.includes(a);
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
