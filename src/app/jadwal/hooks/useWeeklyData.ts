import { useState, useMemo } from 'react';
import { DoctorSchedule, ShiftSlot } from '../types';
import { getWeeklyDateStrip } from '../lib/schedule-utils';
import { getIndonesianHoliday } from '@/lib/holidays';

export function useWeeklyData(doctors: DoctorSchedule[] = [], shifts: ShiftSlot[] = []) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSpec, setSelectedSpec] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dateStrip = useMemo(() => getWeeklyDateStrip(new Date()), []);

  const holidayInfo = useMemo(() => getIndonesianHoliday(selectedDate), [selectedDate]);

  const filteredShifts = useMemo(() => {
    const dayIdx = (selectedDate.getDay() + 6) % 7;
    const docMap = new Map<string, DoctorSchedule>();
    doctors.forEach(d => docMap.set(d.id, d));

    let filtered = shifts.filter(s => {
      if (!s.formattedTime || s.formattedTime === '-' || !s.formattedTime.includes(':')) return false;
      if (s.dayIdx !== dayIdx) return false;

      const doc = docMap.get(s.doctorId);
      const docName = doc ? (doc.name || '') : (s.doctorName || '');
      const docSpec = doc ? (doc.specialty || '') : (s.title || '');

      if (selectedSpec !== 'all' && docSpec !== selectedSpec) return false;
      if (searchQuery) {
        const combined = `${docName} ${docSpec} ${s.formattedTime} ${s.registrationTime || ''}`.toLowerCase();
        if (!combined.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });

    return filtered.map(s => {
      const doc = docMap.get(s.doctorId);
      return { shift: s, doc };
    });
  }, [doctors, shifts, selectedDate, selectedSpec, searchQuery]);

  return {
    selectedDate,
    setSelectedDate,
    selectedSpec,
    setSelectedSpec,
    searchQuery,
    setSearchQuery,
    dateStrip,
    holidayInfo,
    filteredShifts,
  };
}
