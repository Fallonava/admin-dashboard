/**
 * scheduler.ts
 *
 * Event-driven real-time scheduler sebagai pengganti cron daemon.
 *
 * Cara kerja:
 * 1. Saat dipanggil, baca semua jadwal shift dari DB untuk hari ini.
 * 2. Hitung milidetik tepat sampai setiap event (shift mulai, shift selesai).
 * 3. Jadwalkan setTimeout presisi untuk setiap event.
 * 4. Saat setTimeout terpicu → jalankan runAutomation() → broadcast via Socket.IO.
 * 5. Tengah malam: reschedule untuk hari berikutnya.
 *
 * Keunggulan vs cron per-menit:
 * - Status berubah tepat di detik yang benar (tidak ada delay 0–59 detik)
 * - Zero polling — hanya berjalan saat ada event yang terjadwal
 * - Tidak perlu proses PM2 kedua
 */

import { prisma } from './prisma';
import { runAutomation } from './automation';
import { notifyViaSocket, syncAdminData } from './automation-broadcaster';
import { getFullSnapshot } from './data-fetchers';
import { logger } from './logger';

// Kumpulan semua timer aktif agar bisa dibersihkan saat reschedule
const activeTimers: ReturnType<typeof setTimeout>[] = [];

/**
 * Parse waktu "HH:MM" atau "H AM/PM" ke menit sejak tengah malam.
 */
function parseToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const t = timeStr.trim().toLowerCase();
  const ampm = t.match(/(am|pm)$/);
  let cleaned = t.replace(/\s*(am|pm)$/, '').replace('.', ':');
  const parts = cleaned.split(':');
  if (parts.length < 2) return null;
  let h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  if (isNaN(h) || isNaN(m)) return null;
  if (ampm) {
    if (ampm[1] === 'pm' && h < 12) h += 12;
    if (ampm[1] === 'am' && h === 12) h = 0;
  }
  return h * 60 + m;
}

/**
 * Get current WIB (UTC+7) time in minutes since midnight.
 */
function getNowWIBMinutes(): number {
  const wib = new Date(Date.now() + 7 * 3600_000);
  return wib.getUTCHours() * 60 + wib.getUTCMinutes();
}

/**
 * Milliseconds remaining until a given minute-of-day (WIB).
 * Returns null if the time is already passed today.
 */
function msUntilMinute(targetMinutes: number): number | null {
  const now = Date.now();
  const wib = new Date(now + 7 * 3600_000);
  const todayMidnightMs = Date.UTC(
    wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()
  ) - 7 * 3600_000; // back to UTC epoch for actual scheduling
  const targetMs = todayMidnightMs + targetMinutes * 60_000;
  const delta = targetMs - now;
  return delta > 0 ? delta : null;
}

/**
 * Trigger the automation engine and broadcast results via Socket.IO.
 */
async function triggerAndBroadcast(reason: string) {
  const redisClient = (global as any).redisClient;
  if (redisClient) {
    const lockKey = `medcore-lock:scheduler:${reason.replace(/\s+/g, '-')}:${getNowWIBMinutes()}`;
    try {
      // Set lock only if it doesn't exist (NX), expires in 30 seconds (EX)
      const acquired = await redisClient.set(lockKey, 'locked', { NX: true, EX: 30 });
      if (!acquired) {
        logger.info(`[scheduler] Batal dieksekusi: Lock sudah diambil oleh node PM2 lain.`);
        return; // Prevent duplication!
      }
    } catch (lockErr: any) {
      logger.warn(`[scheduler] Gagal acquire Redis lock: ${lockErr.message}. Fallback ke run paralel.`);
    }
  }

  logger.info(`[scheduler] Triggered: ${reason}`);
  try {
    const { applied, failed } = await runAutomation();
    logger.info(`[scheduler] Done. Applied: ${applied}, Failed: ${failed}`);
    
    // Always broadcast fresh state to all admin tabs, regardless of changes
    // This ensures dashboard always shows correct state after every shift event
    try {
      const snapshot = await getFullSnapshot();
      syncAdminData(snapshot);
      logger.info(`[scheduler] Broadcast admin_sync_all: ${snapshot.doctors.length} doctors`);
    } catch (snapErr: any) {
      logger.error('[scheduler] Failed to broadcast snapshot:', snapErr.message);
    }

    if (applied > 0) {
      notifyViaSocket('schedule_changed', { reason, applied, ts: Date.now() });
    }
  } catch (err: any) {
    logger.error('[scheduler] runAutomation error:', err.message);
  }
}

/**
 * Clear all pending timers.
 */
function clearAllTimers() {
  for (const t of activeTimers) clearTimeout(t);
  activeTimers.length = 0;
}

/**
 * Schedule timers for today's shift events.
 * Called on startup and at midnight.
 */
export async function scheduleToday() {
  clearAllTimers();

  const wib = new Date(Date.now() + 7 * 3600_000);
  const dayIdx = wib.getUTCDay() === 0 ? 6 : wib.getUTCDay() - 1;
  const todayStr = `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, '0')}-${String(wib.getUTCDate()).padStart(2, '0')}`;

  logger.info(`[scheduler] Scheduling for today (dayIdx=${dayIdx}, date=${todayStr})`);

  // Load all active shifts for today
  let shifts: any[] = [];
  try {
    shifts = await (prisma as any).shift.findMany({
      where: { dayIdx },
      include: { doctor: { select: { registrationTime: true } } }
    });
  } catch (err: any) {
    logger.error('[scheduler] Failed to load shifts:', err.message);
    return;
  }

  // Collect unique trigger times (shift start + shift end)
  const triggerMinutes = new Set<number>();
  for (const shift of shifts) {
    if (!shift.formattedTime) continue;
    // Skip if today is a disabled date
    if ((shift.disabledDates || []).includes(todayStr)) continue;

    const [startStr, endStr] = shift.formattedTime.split('-');
    const start = parseToMinutes(startStr);
    const end = parseToMinutes(endStr);
    if (start !== null) {
      triggerMinutes.add(start);
      // Tambahkan trigger untuk window registrasi (PENDAFTARAN)
      let regStart = start - 30; // default 30 menit
      const rTime = shift.registrationTime || shift.doctor?.registrationTime;
      if (rTime) {
        const customReg = parseToMinutes(rTime);
        if (customReg !== null) regStart = customReg;
      }
      triggerMinutes.add(regStart);
    }
    if (end !== null) triggerMinutes.add(end);
  }

  let scheduled = 0;
  for (const minutes of Array.from(triggerMinutes)) {
    const ms = msUntilMinute(minutes);
    if (ms === null) continue; // already passed, skip

    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    const label = `shift event at ${h}:${m}`;

    const timer = setTimeout(() => triggerAndBroadcast(label), ms);
    activeTimers.push(timer);
    scheduled++;
    logger.info(`[scheduler] Queued: ${label} in ${Math.round(ms / 60000)} min`);
  }

  // Also run immediately on startup to fix any drift
  triggerAndBroadcast('startup sync');

  logger.info(`[scheduler] ${scheduled} event(s) scheduled for today.`);

  // Schedule reschedule at midnight WIB
  const msUntilMidnight = msUntilMinute(24 * 60) ?? msUntilMinute(0) ?? 86_400_000;
  const midnightTimer = setTimeout(async () => {
    logger.info('[scheduler] Midnight reached, rescheduling for new day...');
    await scheduleToday();
  }, msUntilMidnight);
  activeTimers.push(midnightTimer);
}
