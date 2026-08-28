export type DoctorStatusType = 'PRAKTEK' | 'CUTI' | 'LIBUR' | 'PENUH' | 'SELESAI';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  status: DoctorStatusType | string;
  image?: string | null;
  category?: 'Bedah' | 'NonBedah' | string;
  startTime?: string;
  endTime?: string;
  queueCode?: string;
  order?: number;
  lastCall?: string | null;
  registrationTime?: string | null;
  lastManualOverride?: bigint | number | null;
  activeLeave?: LeaveRequest | null;
  todayShift?: Shift | null;
  _isActive?: boolean;
}

export type DoctorSchedule = Doctor;

export interface Shift {
  id: string;
  dayIdx: number;
  timeIdx?: number;
  title?: string;
  color?: string;
  formattedTime?: string | null;
  registrationTime?: string | null;
  extra?: string | null;
  disabledDates?: string[];
  statusOverride?: DoctorStatusType | null;
  doctorId: string;
  doctorName?: string;
}

export type ShiftSlot = Shift;

export interface LeaveRequest {
  id: string;
  specialty?: string | null;
  type?: string;
  startDate: string | Date;
  endDate?: string | Date;
  reason?: string | null;
  notes?: string | null;
  status: string;
  avatar?: string | null;
  replacementDoctor?: string | null;
  doctorId?: string;
  doctorName?: string;
  doctor?: Doctor | string;
}

export type LeaveItem = LeaveRequest;

export interface BroadcastRule {
  id: string;
  message: string;
  alertLevel: 'INFO' | 'WARNING' | 'CRITICAL';
  targetZone: string;
  duration: number;
  active: boolean;
}

export interface DisplayApiResponse {
  doctors?: Doctor[];
  shifts?: Shift[];
  leaves?: LeaveRequest[];
  broadcasts?: BroadcastRule[];
  serverTime?: string;
}

export interface BentoStatsData {
  presentCount?: number;
  totalDoctors?: number;
  specialtiesCount?: number;
  onLeaveCount?: number;
  attendanceRate?: number;
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
  dateStr?: string;
  dateKey?: string;
  dayName: string;
  dayNum?: number;
  dateFormatted?: string;
  monthName?: string;
  isToday?: boolean;
  isHoliday: boolean;
  isSunday?: boolean;
  holidayName?: string;
}

export type SpecialtyCategory = 'all' | 'bedah' | 'nonbedah' | 'khusus';
