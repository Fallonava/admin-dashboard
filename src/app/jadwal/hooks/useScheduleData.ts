import useSWR from 'swr';
import { calculateDoctorStatus, categorizeDoctor, isShiftActiveForDate } from '../lib/schedule-utils';
import { ScheduleDisplayData, BentoStatsData, DoctorSchedule, ShiftSlot, LeaveItem } from '../types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useScheduleData() {
  const { data, error, isLoading, mutate } = useSWR<{
    doctors: DoctorSchedule[];
    shifts: ShiftSlot[];
    leaves: LeaveItem[];
  }>('/api/display', fetcher, { refreshInterval: 30000 });

  let todayDoctors: ScheduleDisplayData[] = [];
  let bedahDoctors: ScheduleDisplayData[] = [];
  let nonBedahDoctors: ScheduleDisplayData[] = [];
  let khususDoctors: ScheduleDisplayData[] = [];
  const bentoStats: BentoStatsData = { buka: 0, penuh: 0, cuti: 0 };

  if (data) {
    const { doctors = [], shifts = [], leaves = [] } = data;
    const now = new Date();
    const todayDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

    const todayShifts = shifts.filter(
      (s) => s.dayIdx === todayDayIdx && isShiftActiveForDate(s.extra, now)
    );

    const mappedData: ScheduleDisplayData[] = [];

    todayShifts.forEach((shift) => {
      const doc = doctors.find((d) => d.id === shift.doctorId);
      if (!doc) return;

      const { status, replacementDoctor } = calculateDoctorStatus(doc, shift, leaves, now);
      const category = doc.category || categorizeDoctor(doc.specialty);

      mappedData.push({
        Dokter: doc.name,
        Spesialis: doc.specialty,
        Status: status,
        Jam: shift.formattedTime || '-',
        JamPraktek: shift.formattedTime || '-',
        JamDaftar: shift.registrationTime || doc.registrationTime || '-',
        Jenis: category,
        'Code Antrian': doc.queueCode,
        _shiftId: shift.id,
        DokterPengganti: replacementDoctor,
        _isActive: ['PRAKTEK', 'PENDAFTARAN', 'TERJADWAL'].includes(status) || status.includes('PENUH'),
      });
    });

    mappedData.forEach((d) => {
      const s = d.Status.toUpperCase();
      if (['PRAKTEK', 'PENDAFTARAN', 'TERJADWAL'].includes(s)) bentoStats.buka++;
      else if (s === 'PENUH') bentoStats.penuh++;
      else if (s.includes('CUTI')) bentoStats.cuti++;
    });

    todayDoctors = mappedData;
    bedahDoctors = mappedData.filter(
      (d) =>
        d.Jenis === 'Bedah' &&
        !['SELESAI', 'LIBUR', 'PENUH', 'CUTI', 'OPERASI'].some((x) => d.Status.includes(x))
    );
    nonBedahDoctors = mappedData.filter(
      (d) =>
        d.Jenis === 'NonBedah' &&
        !['SELESAI', 'LIBUR', 'PENUH', 'CUTI', 'OPERASI'].some((x) => d.Status.includes(x))
    );
    khususDoctors = mappedData.filter(
      (d) =>
        ['PENUH', 'CUTI', 'OPERASI'].some((x) => d.Status.includes(x)) &&
        !['SELESAI', 'LIBUR'].some((x) => d.Status.includes(x))
    );
  }

  return { todayDoctors, bedahDoctors, nonBedahDoctors, khususDoctors, bentoStats, isLoading, error, mutate };
}
