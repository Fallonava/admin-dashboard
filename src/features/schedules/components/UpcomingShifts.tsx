"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { UserCheck, Clock, Stethoscope, ChevronRight, Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift, Doctor } from "@/lib/data-service";
import { ScheduleModal } from "./ScheduleModal";

interface UpcomingShiftsProps {
  selectedDate?: Date;
  onOpenScheduleModal?: (doctor: Doctor) => void;
}

export function UpcomingShifts({ selectedDate = new Date(), onOpenScheduleModal }: UpcomingShiftsProps) {
  const currentDayIdx = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
  const weekOfMonth = Math.ceil(selectedDate.getDate() / 7);
  const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const { data: rawShifts } = useSWR<Shift[]>(`/api/shifts?include=leaves&date=${dateKey}`);
  const { data: rawDoctors } = useSWR<Doctor[]>('/api/doctors');

  const shifts = Array.isArray(rawShifts) ? rawShifts : [];
  const doctors = Array.isArray(rawDoctors) ? rawDoctors : [];

  const [selectedDocForModal, setSelectedDocForModal] = useState<Doctor | null>(null);

  // Doctors on duty for the selected date
  const activeDoctorsOnDuty = useMemo(() => {
    const dayShifts = shifts.filter((s) => {
      if (!s || !s.formattedTime || s.formattedTime === '-' || typeof s.formattedTime !== 'string' || !s.formattedTime.includes(':')) return false;
      if (Number(s.dayIdx) !== currentDayIdx) return false;
      
      const rawDisabled = s.disabledDates;
      const disabledList: string[] = Array.isArray(rawDisabled)
        ? rawDisabled
        : typeof rawDisabled === 'string'
          ? (() => { try { const p = JSON.parse(rawDisabled); return Array.isArray(p) ? p : [rawDisabled]; } catch { return [rawDisabled]; } })()
          : [];
      if (disabledList.includes(dateKey)) return false;

      if (s.extra === 'odd_weeks' && weekOfMonth % 2 === 0) return false;
      if (s.extra === 'even_weeks' && weekOfMonth % 2 !== 0) return false;
      return true;
    });

    const docMap = new Map<string, { doctor: Doctor; shifts: Shift[] }>();

    dayShifts.forEach((shift) => {
      const doc: Doctor = doctors.find((d) => (shift.doctorId && d.id === shift.doctorId) || (shift.doctor && d.name.toLowerCase() === shift.doctor.toLowerCase())) || {
        id: shift.doctorId || shift.id || 'unknown',
        name: shift.doctor || 'Dokter',
        specialty: shift.title || 'Spesialis',
        category: 'NonBedah',
        status: 'LIBUR',
        startTime: '08:00',
        endTime: '12:00',
        queueCode: '',
        order: 0,
      };

      if (!docMap.has(doc.id)) {
        docMap.set(doc.id, { doctor: doc, shifts: [] });
      }
      docMap.get(doc.id)!.shifts.push(shift);
    });

    return Array.from(docMap.values());
  }, [shifts, doctors, currentDayIdx, dateKey, weekOfMonth]);

  const handleCardClick = (doc: Doctor) => {
    if (onOpenScheduleModal) {
      onOpenScheduleModal(doc);
    } else {
      setSelectedDocForModal(doc);
    }
  };

  const dayName = selectedDate.toLocaleDateString('id-ID', { weekday: 'long' });
  const dateFormatted = selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  return (
    <div className="w-full lg:w-[310px] xl:w-[350px] clay-surface rounded-[28px] lg:rounded-[32px] flex flex-col z-10 p-3.5 sm:p-4 flex-shrink-0 shadow-lg min-h-[280px] lg:min-h-0 lg:h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/60 dark:border-white/5 flex-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[12px] clay-icon-blue flex items-center justify-center text-white shrink-0">
            <UserCheck size={16} className="relative z-10" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Dokter Bertugas
            </h3>
            <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {dayName}, {dateFormatted}
            </p>
          </div>
        </div>
        <span className="text-[10.5px] font-black px-2.5 py-1 rounded-[12px] clay-button text-zinc-700 dark:text-zinc-300">
          {activeDoctorsOnDuty.length} Dokter
        </span>
      </div>

      {/* ── Content List ── */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-0">
        {activeDoctorsOnDuty.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-[18px] clay-surface flex items-center justify-center text-zinc-400 mb-1">
              <Calendar size={22} strokeWidth={2} />
            </div>
            <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
              Tidak Ada Shift
            </p>
            <p className="text-[10.5px] text-zinc-400 font-bold max-w-[200px]">
              Belum ada dokter yang terjadwal bertugas pada {dayName}.
            </p>
          </div>
        ) : (
          activeDoctorsOnDuty.map(({ doctor, shifts }) => {
            const isBedah = doctor.category === 'Bedah';
            const avatarClay = isBedah ? "clay-icon-rose" : "clay-icon-blue";
            const initials =
              doctor.queueCode ||
              doctor.name
                .replace(/^dr\.\s*/i, '')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase() || 'DR';

            return (
              <div
                key={doctor.id}
                onClick={() => handleCardClick(doctor)}
                className="p-3 rounded-[20px] clay-button hover:-translate-y-0.5 transition-all text-left group cursor-pointer relative"
              >
                <div className="flex items-start gap-2.5">
                  {/* 3D Clay Avatar */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm",
                      avatarClay
                    )}
                  >
                    <span className="relative z-10">{initials}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 transition-colors">
                      {doctor.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold truncate flex items-center gap-1 mt-0.5">
                      <Stethoscope size={11} className="shrink-0" />
                      <span>{doctor.specialty}</span>
                    </p>

                    {/* Shift badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {shifts.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] clay-inset text-[9.5px] font-black text-blue-600 dark:text-blue-400"
                        >
                          <Clock size={10} strokeWidth={2.5} />
                          {s.formattedTime}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ChevronRight size={14} className="text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0 mt-2" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Internal Schedule Modal fallback */}
      {selectedDocForModal && (
        <ScheduleModal
          doctor={selectedDocForModal}
          shifts={shifts}
          isOpen={Boolean(selectedDocForModal)}
          onClose={() => setSelectedDocForModal(null)}
          onUpdate={() => {
            mutate('/api/doctors');
            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/shifts'));
          }}
        />
      )}
    </div>
  );
}
