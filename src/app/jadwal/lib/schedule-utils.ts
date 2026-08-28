import { getIndonesianHoliday } from '@/lib/holidays';
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
  targetDate: Date,
  leaves: LeaveRequest[] = []
): LeaveRequest | null {
  const targetTime = targetDate.getTime();

  for (const leave of leaves) {
    if (leave.doctorId !== doctorId && leave.doctor?.id !== doctorId && leave.doctorName !== doctorId) continue;
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate || leave.startDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (targetTime >= start.getTime() && targetTime <= end.getTime()) {
      return leave;
    }
  }
  return null;
}

export function isDateInLeave(checkDate: Date, leave: LeaveRequest): boolean {
  if (!leave.startDate) return false;
  const target = new Date(checkDate);
  target.setHours(0, 0, 0, 0);
  const start = new Date(leave.startDate);
  start.setHours(0, 0, 0, 0);
  const end = leave.endDate ? new Date(leave.endDate) : new Date(leave.startDate);
  end.setHours(23, 59, 59, 999);
  return target >= start && target <= end;
}

export function evaluateDoctorRealtimeStatus(
  doctor: Doctor,
  shifts: Shift[] = [],
  leaves: LeaveRequest[] = [],
  currentDate: Date = new Date()
): { status: DoctorStatusType; reason?: string; activeLeave?: LeaveRequest | null } {
  // 1. Check active leave
  const leave = isDoctorOnLeave(doctor.id, currentDate, leaves);
  if (leave) {
    return { status: 'CUTI', reason: leave.reason || 'Cuti Dokter', activeLeave: leave };
  }

  // 2. Check national holiday / sunday
  const holiday = getIndonesianHoliday(currentDate);
  const dayIdx = currentDate.getDay(); // 0=Sunday..6=Saturday

  // Find shift for today
  const todayShift = shifts.find(
    (s) => s.doctorId === doctor.id && (s.dayIdx === dayIdx || (dayIdx === 0 && s.dayIdx === 7))
  );

  if (todayShift?.statusOverride) {
    return { status: todayShift.statusOverride };
  }

  const dateStr = currentDate.toISOString().split('T')[0];
  if (todayShift?.disabledDates?.includes(dateStr)) {
    return { status: 'LIBUR', reason: 'Jadwal Dinonaktifkan' };
  }

  if (holiday.isTanggalMerah && !todayShift) {
    return { status: 'LIBUR', reason: holiday.name || 'Hari Libur Nasional' };
  }

  if (todayShift) {
    return { status: 'PRAKTEK' };
  }

  return { status: doctor.status || 'LIBUR' };
}

export function getWeeklyDateStrip(referenceDate: Date = new Date()): DayDateItem[] {
  const result: DayDateItem[] = [];
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

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
      holidayName: holiday.name
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

export function filterLeaves(leaves: LeaveRequest[], filterType: 'all' | 'active' | 'upcoming' | 'past'): LeaveRequest[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return leaves.filter((l) => {
    if (!l.startDate) return false;
    const start = new Date(l.startDate);
    start.setHours(0, 0, 0, 0);
    const end = l.endDate ? new Date(l.endDate) : start;
    end.setHours(23, 59, 59, 999);

    if (filterType === 'all') return true;
    if (filterType === 'active') return now >= start && now <= end;
    if (filterType === 'upcoming') return now < start;
    if (filterType === 'past') return now > end;
    return true;
  });
}
