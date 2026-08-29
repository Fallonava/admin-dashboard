import { getIndonesianHoliday } from '@/lib/holidays';
import { isShiftActiveForDate } from '@/lib/schedule-utils';
import type { Doctor, Shift, LeaveRequest, DayDateItem, DoctorStatusType } from '../types';

export const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
export const INDO_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Gold-standard WIB (Asia/Jakarta) date string converter 'YYYY-MM-DD'
 */
export function toWibDateStr(dateInput: Date | string): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d); // returns 'YYYY-MM-DD'
  } catch {
    return '';
  }
}

/**
 * Returns current Date in WIB timezone
 */
export function getWibNow(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

export function getInitials(name: string): string {
  if (!name) return 'DR';
  const clean = name.replace(/^(dr\.|drg\.|prof\.|dr\s+|drg\s+|prof\s+)/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function isSurgeonSpecialty(specialty: string): boolean {
  const s = (specialty || '').toLowerCase();
  return (
    s.includes('bedah') ||
    s.includes('sp.b') ||
    s.includes('sp.ba') ||
    s.includes('sp.btkv') ||
    s.includes('sp.bs') ||
    s.includes('sp.bp') ||
    s.includes('ortopedi') ||
    s.includes('sp.ot') ||
    s.includes('urologi') ||
    s.includes('sp.u') ||
    s.includes('anestesi') ||
    s.includes('sp.an')
  );
}

export function categorizeDoctor(specialty: string): 'Bedah' | 'NonBedah' {
  return isSurgeonSpecialty(specialty) ? 'Bedah' : 'NonBedah';
}

export function calculateDoctorStatus(
  doctor: any,
  shift?: any,
  leaves: any[] = [],
  date: Date = new Date()
): { status: string; replacementDoctor?: string | null } {
  const result = evaluateDoctorRealtimeStatus(doctor, shift ? [shift] : [], leaves, date);
  return {
    status: result.status,
    replacementDoctor: result.activeLeave?.replacementDoctor || null,
  };
}

export function getSpecialtyBadgeClass(specialty: string): string {
  const s = (specialty || '').toLowerCase();
  if (s.includes('jantung') || s.includes('sp.jp')) return 'spec-jantung';
  if (s.includes('anak') || s.includes('sp.a')) return 'spec-anak';
  if (s.includes('bedah') || s.includes('sp.b')) return 'spec-bedah';
  if (s.includes('saraf') || s.includes('sp.s') || s.includes('sp.n')) return 'spec-saraf';
  if (s.includes('kandungan') || s.includes('obgyn') || s.includes('sp.og')) return 'spec-kandungan';
  if (s.includes('gigi') || s.includes('drg') || s.includes('sp.kg')) return 'spec-gigi';
  if (s.includes('paru') || s.includes('sp.p')) return 'spec-paru';
  if (s.includes('mata') || s.includes('sp.m')) return 'spec-mata';
  if (s.includes('tht') || s.includes('sp.tht')) return 'spec-tht';
  if (s.includes('ortopedi') || s.includes('sp.ot')) return 'spec-ortho';
  return 'spec-default';
}

export function isDoctorOnLeave(
  doctorId: string,
  targetDate: Date | string,
  leaves: LeaveRequest[] = []
): LeaveRequest | null {
  const targetDateStr = typeof targetDate === 'string' ? targetDate : toWibDateStr(targetDate);
  if (!targetDateStr) return null;

  for (const leave of leaves) {
    const docIdObj = typeof leave.doctor === 'object' && leave.doctor !== null ? leave.doctor.id : undefined;
    if (leave.doctorId !== doctorId && docIdObj !== doctorId && leave.doctorName !== doctorId) continue;
    
    const startStr = toWibDateStr(leave.startDate);
    const endStr = toWibDateStr(leave.endDate || leave.startDate);
    if (!startStr) continue;

    if (targetDateStr >= startStr && targetDateStr <= (endStr || startStr)) {
      return leave;
    }
  }
  return null;
}

export function isDateInLeave(checkDate: Date | string, leave: LeaveRequest): boolean {
  if (!leave.startDate) return false;
  const checkStr = typeof checkDate === 'string' ? checkDate : toWibDateStr(checkDate);
  const startStr = toWibDateStr(leave.startDate);
  const endStr = toWibDateStr(leave.endDate || leave.startDate);
  if (!checkStr || !startStr) return false;

  return checkStr >= startStr && checkStr <= (endStr || startStr);
}

export function evaluateDoctorRealtimeStatus(
  doctor: Doctor,
  shifts: Shift[] = [],
  leaves: LeaveRequest[] = [],
  currentDate: Date = new Date()
): { status: DoctorStatusType; reason?: string; activeLeave?: LeaveRequest | null } {
  // Convert to WIB (UTC+7)
  const wibTime = new Date(currentDate.getTime() + (7 * 60 * 60 * 1000));
  const currentDayIdx = (wibTime.getUTCDay() + 6) % 7; // 0=Senin ... 6=Minggu
  const todayStr = toWibDateStr(currentDate);
  const currentTimeMinutes = wibTime.getUTCHours() * 60 + wibTime.getUTCMinutes();

  // 1. Check active leave for today in WIB
  const leave = isDoctorOnLeave(doctor.id, todayStr, leaves);
  if (leave) {
    return { status: 'CUTI', reason: leave.reason || 'Cuti Dokter', activeLeave: leave };
  }

  // 2. Check shifts for today (filtered by dayIdx, disabledDates, and week parity)
  const todayShifts = shifts.filter(
    (s) =>
      s.doctorId === doctor.id &&
      s.dayIdx === currentDayIdx &&
      !(s.disabledDates || []).includes(todayStr) &&
      isShiftActiveForDate(s.extra, wibTime)
  );

  // Check manual/status override on shift
  const activeShiftWithOverride = todayShifts.find((s) => s.statusOverride);
  if (activeShiftWithOverride?.statusOverride) {
    return { status: activeShiftWithOverride.statusOverride as DoctorStatusType };
  }

  const holiday = getIndonesianHoliday(currentDate);

  if (holiday.isTanggalMerah && todayShifts.length === 0) {
    return { status: 'LIBUR', reason: holiday.name || 'Hari Libur Nasional' };
  }

  if (todayShifts.length === 0) {
    return { status: (doctor.status as DoctorStatusType) || 'LIBUR' };
  }

  // 3. Precise time-of-day calculation (TERJADWAL, PRAKTEK, SELESAI)
  const todayShift = todayShifts[0];
  const jamStr = todayShift.formattedTime || todayShift.title || '-';
  if (jamStr !== '-') {
    const parts = jamStr.replace(/\s/g, '').replace(/\./g, ':').toLowerCase().match(/(\d{1,2}:\d{2})/g);
    if (parts && parts.length > 0) {
      const parseMins = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const startMins = parseMins(parts[0]);
      let endMins: number | null = null;

      if (parts.length >= 2) {
        endMins = parseMins(parts[1]);
        if (endMins < startMins) endMins += 24 * 60;
      } else if (jamStr.toLowerCase().includes('selesai')) {
        endMins = startMins + 240;
      }

      let regMins = startMins - 30;
      const rTime = todayShift.registrationTime || doctor.registrationTime;
      if (rTime && rTime !== '-') {
        const rParts = rTime.replace(/\./g, ':').split(':');
        if (rParts.length >= 2) regMins = Number(rParts[0]) * 60 + Number(rParts[1]);
      }

      if (endMins !== null && currentTimeMinutes >= endMins) {
        return { status: 'SELESAI', reason: 'Praktik Telah Selesai' };
      } else if (currentTimeMinutes >= regMins && currentTimeMinutes < startMins) {
        return { status: 'PENDAFTARAN', reason: `Pendaftaran dibuka (${parts[0]} WIB)` };
      } else if (currentTimeMinutes < regMins) {
        return { status: 'TERJADWAL', reason: `Praktik dimulai ${parts[0]} WIB` };
      } else {
        return { status: 'PRAKTEK' };
      }
    }
  }

  return { status: 'PRAKTEK' };
}

export function getWeeklyDateStrip(referenceDate: Date = new Date()): DayDateItem[] {
  const result: DayDateItem[] = [];
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const dateStr = toWibDateStr(d);
    const holiday = getIndonesianHoliday(d);
    const dayIdx = d.getDay();

    result.push({
      date: d,
      dateStr,
      dateKey: dateStr,
      dayName: INDO_DAYS[dayIdx],
      dayNum: d.getDate(),
      dateFormatted: d.getDate().toString().padStart(2, '0'),
      monthName: INDO_MONTHS_SHORT[d.getMonth()],
      isToday: i === 0,
      isHoliday: holiday.isTanggalMerah,
      isSunday: holiday.isSunday,
      holidayName: holiday.name,
    });
  }

  return result;
}

export function formatTimeSlot(startTime?: string, endTime?: string, formattedTime?: string | null): string {
  if (formattedTime) return formattedTime;
  if (startTime && endTime) return `${startTime} - ${endTime} WIB`;
  if (startTime) return `Mulai ${startTime} WIB`;
  return 'Sesuai Perjanjian';
}

export function filterLeaves(leaves: any[], filterType: 'all' | 'active' | 'upcoming' | 'past' = 'all'): any[] {
  const todayWibStr = toWibDateStr(new Date());

  return leaves.filter((l) => {
    if (!l.startDate) return false;
    const startStr = toWibDateStr(l.startDate);
    const endStr = toWibDateStr(l.endDate || l.startDate);

    if (filterType === 'all') return true;
    if (filterType === 'active') return todayWibStr >= startStr && todayWibStr <= endStr;
    if (filterType === 'upcoming') return todayWibStr < startStr;
    if (filterType === 'past') return todayWibStr > endStr;
    return true;
  });
}

export interface CalendarDayItem {
  dayNum: number;
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  leavesCount: number;
  leaves: LeaveRequest[];
}

export function getCalendarGrid(year: number, month: number, leaves: LeaveRequest[] = []): CalendarDayItem[] {
  const result: CalendarDayItem[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const todayWibStr = toWibDateStr(new Date());

  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Padding days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    const dateStr = toWibDateStr(d);
    const holiday = getIndonesianHoliday(d);
    const dayLeaves = leaves.filter((l) => isDateInLeave(dateStr, l));
    result.push({
      dayNum: d.getDate(),
      date: d,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayWibStr,
      isHoliday: holiday.isTanggalMerah,
      holidayName: holiday.name,
      leavesCount: dayLeaves.length,
      leaves: dayLeaves,
    });
  }

  // Days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    const dateStr = toWibDateStr(d);
    const holiday = getIndonesianHoliday(d);
    const dayLeaves = leaves.filter((l) => isDateInLeave(dateStr, l));
    result.push({
      dayNum: day,
      date: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayWibStr,
      isHoliday: holiday.isTanggalMerah,
      holidayName: holiday.name,
      leavesCount: dayLeaves.length,
      leaves: dayLeaves,
    });
  }

  // Padding days for next month to complete 35 or 42 grid
  const remaining = (7 - (result.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = toWibDateStr(d);
    const holiday = getIndonesianHoliday(d);
    const dayLeaves = leaves.filter((l) => isDateInLeave(dateStr, l));
    result.push({
      dayNum: i,
      date: d,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayWibStr,
      isHoliday: holiday.isTanggalMerah,
      holidayName: holiday.name,
      leavesCount: dayLeaves.length,
      leaves: dayLeaves,
    });
  }

  return result;
}

export { isShiftActiveForDate, getWeekOfMonth, getRoutineLabel } from '@/lib/schedule-utils';

export function formatDateIndonesian(dateInput: Date | string): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Parses time string like "07:30", "07.30 - 11.00", "08:00 - Selesai" into total minutes from midnight
 */
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 9999;
  const str = String(timeStr).trim();
  const match = str.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  }
  const singleHourMatch = str.match(/^(\d{1,2})/);
  if (singleHourMatch) {
    const hours = parseInt(singleHourMatch[1], 10);
    if (!isNaN(hours)) return hours * 60;
  }
  return 9999;
}

/**
 * Returns numeric priority weight for doctor operational status
 */
export function getStatusWeight(status?: string | null): number {
  const st = (status || '').toUpperCase();
  if (st === 'PRAKTEK' || st === 'PENDAFTARAN') return 1; // Prioritas 1: Sedang berlangsung / Loket Buka
  if (st === 'TERJADWAL') return 2;                      // Prioritas 2: Terjadwal bertugas hari ini
  if (st === 'SELESAI' || st === 'PENUH') return 3;       // Prioritas 3: Selesai / Kuota Penuh
  if (st.includes('CUTI') || st === 'LIBUR') return 4;   // Prioritas 4: Cuti / Libur
  return 5;
}

/**
 * Standard multi-tier sorting for doctors:
 * Tier 1: Operational Status (Praktek/Pendaftaran -> Terjadwal -> Selesai -> Cuti)
 * Tier 2: Registration Opening Time (Earliest first)
 * Tier 3: Practice Start Time (Earliest first)
 * Tier 4: Specialty (A-Z)
 * Tier 5: Doctor Name (A-Z)
 */
export function sortDoctorsBySchedule(doctors: Doctor[]): Doctor[] {
  return [...doctors].sort((a, b) => {
    // 1. Status Weight
    const weightA = getStatusWeight(a.status);
    const weightB = getStatusWeight(b.status);
    if (weightA !== weightB) {
      return weightA - weightB;
    }

    // 2. Registration Time (Paling Pagi Duluan)
    const regA = parseTimeToMinutes(a.registrationTime || a.todayShift?.registrationTime);
    const regB = parseTimeToMinutes(b.registrationTime || b.todayShift?.registrationTime);
    if (regA !== regB && regA !== 9999 && regB !== 9999) {
      return regA - regB;
    }

    // 3. Practice Start Time (Paling Pagi Duluan)
    const startA = parseTimeToMinutes(a.startTime || a.todayShift?.formattedTime);
    const startB = parseTimeToMinutes(b.startTime || b.todayShift?.formattedTime);
    if (startA !== startB) {
      return startA - startB;
    }

    // 4. Specialty (A-Z)
    const specA = a.specialty || '';
    const specB = b.specialty || '';
    const specDiff = specA.localeCompare(specB);
    if (specDiff !== 0) return specDiff;

    // 5. Doctor Name (A-Z)
    return (a.name || '').localeCompare(b.name || '');
  });
}
