import { getIndonesianHoliday } from '@/lib/holidays';
import { DoctorSchedule, ShiftSlot, LeaveItem, DayDateItem } from '../types';

export function isDateInLeave(checkDate: Date, leave: LeaveItem): boolean {
  if (!leave.startDate) return false;
  const target = new Date(checkDate);
  target.setHours(0, 0, 0, 0);
  const start = new Date(leave.startDate);
  start.setHours(0, 0, 0, 0);
  const end = leave.endDate ? new Date(leave.endDate) : new Date(leave.startDate);
  end.setHours(0, 0, 0, 0);
  return target >= start && target <= end;
}

export function isShiftActiveForDate(extra: string | undefined, date: Date): boolean {
  if (!extra) return true;
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  if (extra === 'odd_weeks' && weekOfMonth % 2 === 0) return false;
  if (extra === 'even_weeks' && weekOfMonth % 2 !== 0) return false;
  return true;
}

export function calculateDoctorStatus(
  doc: DoctorSchedule,
  shift: ShiftSlot,
  leaves: LeaveItem[],
  date: Date
): { status: string; replacementDoctor: string | null } {
  let status = (doc.status || '').toUpperCase();
  const jamStr = shift.formattedTime || shift.title || '-';
  
  const matchingLeave = leaves.find(l => 
    (l.doctorId === doc.id || l.doctorName === doc.name || l.doctor === doc.name) && 
    isDateInLeave(date, l)
  );
  
  const todayStr = date.toISOString().split('T')[0];
  const isLeaveToday = (shift.disabledDates || []).includes(todayStr) || Boolean(matchingLeave);
  
  if (isLeaveToday) status = 'CUTI';
  
  const isPriorityStatus = ['CUTI', 'PENUH', 'OPERASI'].some(s => status.includes(s));
  
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
      const rTime = shift.registrationTime || doc.registrationTime;
      if (rTime && rTime !== '-') {
        const rParts = rTime.replace(/\./g, ':').split(':');
        if (rParts.length >= 2) regMins = Number(rParts[0]) * 60 + Number(rParts[1]);
      }
      
      const curMins = date.getHours() * 60 + date.getMinutes();
      
      if (endMins !== null && curMins >= endMins) {
        status = 'SELESAI';
      } else if (!isPriorityStatus) {
        if (curMins < regMins) {
          status = 'TERJADWAL';
        } else {
          if (!['PRAKTEK', 'PENDAFTARAN'].includes(status)) {
            status = 'PRAKTEK';
          }
        }
      }
    }
  }

  const replacementDoctor = matchingLeave ? (matchingLeave.replacementDoctor || null) : null;
  return { status, replacementDoctor };
}

export function categorizeDoctor(specialty: string): 'Bedah' | 'NonBedah' {
  const s = specialty.toLowerCase();
  if (s.includes("bedah") || s.includes("sp.b") || s.includes("sp.ba") || s.includes("ortopedi") || s.includes("tulang") || s.includes("orthopaedi") || s.includes("sp.ot")) {
    return 'Bedah';
  }
  return 'NonBedah';
}

export function getWeeklyDateStrip(baseDate: Date): DayDateItem[] {
  const result: DayDateItem[] = [];
  const startDay = new Date(baseDate);
  const DAYS_NAME = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    const dateKey = d.toISOString().split('T')[0];
    const holiday = getIndonesianHoliday(d);
    
    result.push({
      date: d,
      dateKey,
      dayName: DAYS_NAME[d.getDay()],
      dateFormatted: d.getDate().toString().padStart(2, '0'),
      isHoliday: holiday.isHoliday || holiday.isCutiBersama || false,
      isSunday: holiday.isSunday,
      holidayName: holiday.name
    });
  }
  return result;
}

export function getCalendarGrid(year: number, month: number, leaves: LeaveItem[]) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const hol = getIndonesianHoliday(d);
    const hasLeave = leaves.some(l => isDateInLeave(d, l));
    
    cells.push({
      day,
      date: d,
      isToday: d.toDateString() === today.toDateString(),
      holiday: hol,
      hasLeave
    });
  }
  return cells;
}

export function filterLeaves(leaves: LeaveItem[], filterType: 'all' | 'active' | 'upcoming' | 'past'): LeaveItem[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return leaves.filter(l => {
    if (!l.startDate) return false;
    const start = new Date(l.startDate); start.setHours(0, 0, 0, 0);
    const end = l.endDate ? new Date(l.endDate) : start; end.setHours(0, 0, 0, 0);
    
    if (filterType === 'all') return true;
    if (filterType === 'active') return now >= start && now <= end;
    if (filterType === 'upcoming') return now < start;
    if (filterType === 'past') return now > end;
    return true;
  });
}
