export interface DoctorSchedule {
  id: string;
  name: string;
  specialty: string;
  category?: 'Bedah' | 'NonBedah';
  queueCode?: string;
  registrationTime?: string;
  status?: string;
  _isActive?: boolean;
}

export interface ShiftSlot {
  id: string;
  doctorId: string;
  doctorName?: string;
  title?: string;
  dayIdx: number;
  formattedTime: string;
  registrationTime?: string;
  extra?: 'odd_weeks' | 'even_weeks';
  disabledDates?: string[];
}

export interface LeaveItem {
  id: string;
  doctorId: string;
  doctorName?: string;
  doctor?: string;
  startDate: string;
  endDate?: string;
  reason?: string;
  notes?: string;
  replacementDoctor?: string;
}

export interface BentoStatsData {
  buka: number;
  penuh: number;
  cuti: number;
}

export interface ScheduleDisplayData {
  Dokter: string;
  Spesialis: string;
  Status: string;
  Jam: string;
  JamPraktek: string;
  JamDaftar: string;
  Jenis: string;
  'Code Antrian'?: string;
  _shiftId?: string | number;
  DokterPengganti?: string | null;
  _isActive?: boolean;
}

export interface DayDateItem {
  date: Date;
  dateKey: string;
  dayName: string;
  dateFormatted: string;
  isHoliday: boolean;
  isSunday: boolean;
  holidayName?: string;
}

export type SpecialtyCategory = 'all' | 'bedah' | 'nonbedah' | 'khusus';
