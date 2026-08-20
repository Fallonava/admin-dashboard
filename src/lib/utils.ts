import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Doctor } from "@/lib/data-service";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function parseTimeToMinutes(timeStr: string | undefined | null) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return isNaN(h) || isNaN(m) ? 0 : h * 60 + m;
}

export function getRelevantShift(doc: Doctor, currentTimeMinutes: number, nowMs: number) {
  if (!doc.shifts || doc.shifts.length === 0) return null;
  const dayIdx = new Date(nowMs + 7 * 3600_000).getUTCDay() === 0 ? 6 : new Date(nowMs + 7 * 3600_000).getUTCDay() - 1;
  const todayShifts = doc.shifts.filter(s => s.dayIdx === dayIdx && s.formattedTime);
  if (todayShifts.length === 0) return null;
  
  if (todayShifts.length === 1) return todayShifts[0];

  for (const shift of todayShifts) {
    const parts = shift.formattedTime!.split('-');
    if (parts.length < 2) continue;
    const startMins = parseTimeToMinutes(parts[0]);
    const endMins = parseTimeToMinutes(parts[1]);
    if (currentTimeMinutes >= startMins - 60 && currentTimeMinutes <= endMins) return shift;
  }
  
  const upcoming = todayShifts.find(s => {
    const startMins = parseTimeToMinutes(s.formattedTime!.split('-')[0]);
    return startMins > currentTimeMinutes;
  });
  
  return upcoming || todayShifts[todayShifts.length - 1];
}

/**
 * Centralized calculation of remaining shift time.
 */
export function calculateRemainingTime(endTime?: string | null, status?: string | null): string {
  if (!endTime || status === "LIBUR" || status === "SELESAI" || status === "CUTI") {
    return "";
  }

  const now = new Date();
  const [endHour, endMin] = (endTime || "00:00").split(':').map(Number);
  if (isNaN(endHour) || isNaN(endMin)) return "";

  const endDate = new Date();
  endDate.setHours(endHour, endMin, 0, 0);

  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) {
    return "Selesai";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Berakhir ${hours > 0 ? `${hours}j ` : ''}${minutes}m lagi`;
}
