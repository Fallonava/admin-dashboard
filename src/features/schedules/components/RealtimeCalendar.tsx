"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR, { mutate } from "swr";
import {
  Plus,
  X,
  Clock,
  ChevronDown,
  LayoutGrid,
  ListFilter,
  Stethoscope,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift, Doctor } from "@/lib/data-service";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useSocket } from "@/hooks/use-socket";

const HOURS = [
  { label: "06:00", hour: 6 },
  { label: "07:00", hour: 7 },
  { label: "08:00", hour: 8 },
  { label: "09:00", hour: 9 },
  { label: "10:00", hour: 10 },
  { label: "11:00", hour: 11 },
  { label: "12:00", hour: 12 },
  { label: "13:00", hour: 13 },
  { label: "14:00", hour: 14 },
  { label: "15:00", hour: 15 },
  { label: "16:00", hour: 16 },
  { label: "17:00", hour: 17 },
  { label: "18:00", hour: 18 },
  { label: "19:00", hour: 19 },
  { label: "20:00", hour: 20 },
];

const DAYS_NAME = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

interface RealtimeCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onOpenDoctorSchedule?: (doctor: Doctor) => void;
}

export function RealtimeCalendar({ selectedDate, onDateChange, onOpenDoctorSchedule }: RealtimeCalendarProps) {
  const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const { data: rawShifts } = useSWR<Shift[]>(`/api/shifts?include=leaves&date=${dateKey}`);
  const { data: rawDoctors } = useSWR<Doctor[]>('/api/doctors');

  const shifts = Array.isArray(rawShifts) ? rawShifts : [];
  const doctors = Array.isArray(rawDoctors) ? rawDoctors : [];

  // ─── Real-time Updates via Socket.IO ───
  const { lastUpdate } = useSocket('schedules');

  useEffect(() => {
    if (lastUpdate > 0) {
      mutate('/api/doctors');
      mutate((key: string) => typeof key === 'string' && key.startsWith('/api/shifts'));
    }
  }, [lastUpdate]);

  // View Mode & Poliklinik Filter
  const [viewMode, setViewMode] = useState<"timeline" | "weekly">("timeline");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("Semua");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newShift, setNewShift] = useState({
    doctor: "",
    doctorId: "",
    dayIdx: 0,
    start: "08:00",
    end: "12:00",
    title: "Praktek",
    registrationTime: "07:30",
  });

  const currentDayIdx = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
  const weekOfMonth = Math.ceil(selectedDate.getDate() / 7);

  // Unique specialties
  const specialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set);
  }, [doctors]);

  // Helper Custom Dropdown
  const CustomDropdown = ({ value, options, onChange, label, placeholder }: any) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find((o: any) => o.value === value)?.label || placeholder || "Pilih";

    return (
      <div className="relative z-30 flex-1" onMouseLeave={() => setOpen(false)}>
        {label && (
          <label className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider block mb-1">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex justify-between items-center w-full clay-button rounded-[16px] px-3.5 py-2.5 text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none transition-all"
        >
          <span className="truncate pr-2">{selectedLabel}</span>
          <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", open && "rotate-180")} />
        </button>

        <div
          className={cn(
            "absolute top-[calc(100%+6px)] left-0 w-full clay-surface rounded-[18px] shadow-xl p-1.5 transition-all duration-150 origin-top z-50 max-h-[200px] overflow-y-auto custom-scrollbar",
            open ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
          )}
        >
          {options.map((opt: any) => (
            <button
              type="button"
              key={opt.value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-[12px] text-xs font-black transition-all mb-0.5 last:mb-0 truncate",
                value === opt.value
                  ? "clay-pill-blue text-white"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-white/5"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const CustomTimeSelect = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => {
    const [h, m] = (value || "08:00").split(":");
    return (
      <div>
        {label && (
          <label className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider block mb-1">
            {label}
          </label>
        )}
        <div className="flex items-center gap-1 clay-inset rounded-[16px] px-3 py-2 h-[42px]">
          <select
            value={h || "08"}
            onChange={(e) => onChange(`${e.target.value}:${m || "00"}`)}
            className="bg-transparent text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none w-9 text-center appearance-none cursor-pointer"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i.toString().padStart(2, '0')} className="bg-white dark:bg-zinc-800">
                {i.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
          <span className="text-zinc-400 font-black text-xs">:</span>
          <select
            value={m || "00"}
            onChange={(e) => onChange(`${h || "08"}:${e.target.value}`)}
            className="bg-transparent text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none w-9 text-center appearance-none cursor-pointer"
          >
            {["00", "15", "30", "45"].map((min) => (
              <option key={min} value={min} className="bg-white dark:bg-zinc-800">
                {min}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const fetchData = () => {
    mutate((key: string) => typeof key === 'string' && key.startsWith('/api/shifts'));
    mutate('/api/doctors');
  };

  const getShiftHour = (shift: Shift): number => {
    if (shift.formattedTime) {
      const h = parseInt(shift.formattedTime.split(':')[0]);
      if (!isNaN(h)) return h;
    }
    return 8;
  };

  const handleAddShift = async () => {
    const formattedTime = `${newShift.start}-${newShift.end}`;
    await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor: newShift.doctor,
        doctorId: newShift.doctorId,
        title: newShift.title,
        dayIdx: newShift.dayIdx,
        timeIdx: 0,
        formattedTime,
        registrationTime: newShift.registrationTime,
        color: 'blue',
      }),
    });
    setShowAddModal(false);
    setNewShift({
      doctor: "",
      doctorId: "",
      dayIdx: currentDayIdx,
      start: "08:00",
      end: "12:00",
      title: "Praktek",
      registrationTime: "07:30",
    });
    fetchData();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Hapus jadwal shift ini?")) return;
    await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const openAddForHour = (hour: number) => {
    const startStr = `${hour.toString().padStart(2, '0')}:00`;
    const endStr = `${(hour + 4).toString().padStart(2, '0')}:00`;
    setNewShift({
      doctor: "",
      doctorId: "",
      dayIdx: currentDayIdx,
      start: startStr,
      end: endStr,
      title: "Praktek",
      registrationTime: `${hour > 0 ? (hour - 1).toString().padStart(2, '0') : '07'}:30`,
    });
    setShowAddModal(true);
  };

  // Filtered shifts based on Poliklinik selection
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (selectedSpecialty === "Semua") return true;
      const doc = doctors.find((d) => d.id === s.doctorId || d.name === s.doctor);
      return doc ? doc.specialty === selectedSpecialty : true;
    });
  }, [shifts, doctors, selectedSpecialty]);

  return (
    <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden relative space-y-3">
      {/* ─── SCHEDULE TOOLBAR ─── */}
      <div className="flex-none clay-surface px-4 py-2.5 sm:py-3 rounded-[22px] sm:rounded-[26px] flex flex-wrap items-center justify-between gap-2 shadow-sm">
        {/* Left: Poliklinik Filter & Quick Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 clay-inset px-3 py-1.5 rounded-[16px]">
            <Stethoscope size={14} className="text-blue-500" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="bg-transparent text-xs font-black text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="Semua" className="bg-white dark:bg-zinc-800">Semua Poliklinik</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec} className="bg-white dark:bg-zinc-800">
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full clay-button text-zinc-600 dark:text-zinc-400">
            Minggu ke-{weekOfMonth} ({weekOfMonth % 2 !== 0 ? 'Ganjil' : 'Genap'})
          </span>
        </div>

        {/* Right: View Mode Toggle & Tambah Shift */}
        <div className="flex items-center gap-2">
          {/* Toggle Timeline vs Weekly */}
          <div className="flex clay-inset p-1 rounded-[14px] items-center gap-1">
            <button
              onClick={() => setViewMode("timeline")}
              title="Tampilan Timeline Harian"
              className={cn(
                "p-1.5 rounded-[10px] transition-all flex items-center gap-1 text-xs font-black",
                viewMode === "timeline" ? "clay-pill-blue text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <Clock size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline text-[11px]">Harian</span>
            </button>
            <button
              onClick={() => setViewMode("weekly")}
              title="Tampilan Matriks Mingguan"
              className={cn(
                "p-1.5 rounded-[10px] transition-all flex items-center gap-1 text-xs font-black",
                viewMode === "weekly" ? "clay-pill-blue text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <LayoutGrid size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline text-[11px]">Mingguan</span>
            </button>
          </div>

          <button
            onClick={() => {
              setNewShift({
                doctor: "",
                doctorId: "",
                dayIdx: currentDayIdx,
                start: "08:00",
                end: "12:00",
                title: "Praktek",
                registrationTime: "07:30",
              });
              setShowAddModal(true);
            }}
            className="clay-pill-blue px-3.5 py-2 rounded-[16px] flex items-center gap-1.5 text-xs font-black text-white shadow-sm active:scale-95 transition-all shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Tambah Shift</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN SCHEDULE GRID / TIMELINE ─── */}
      <div className="flex-1 min-h-0 clay-surface rounded-[28px] overflow-hidden flex flex-col shadow-lg border border-zinc-200/50 dark:border-white/5">
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
          {viewMode === "timeline" ? (
            /* ═══════════ TIMELINE HARIAN MODE ═══════════ */
            <div className="min-w-full divide-y divide-zinc-200/50 dark:divide-white/5 pb-8">
              {HOURS.map((slot, hIdx) => {
                const cellShifts = filteredShifts.filter((s) => {
                  if (!s.formattedTime || s.formattedTime === '-' || !s.formattedTime.includes(':')) return false;
                  if (s.dayIdx !== currentDayIdx) return false;
                  if (getShiftHour(s) !== slot.hour) return false;
                  if ((s.disabledDates || []).includes(dateKey)) return false;
                  if (s.extra === 'odd_weeks' && weekOfMonth % 2 === 0) return false;
                  if (s.extra === 'even_weeks' && weekOfMonth % 2 !== 0) return false;
                  return true;
                });

                return (
                  <div
                    key={`h-${hIdx}`}
                    className="grid grid-cols-[72px_1fr] sm:grid-cols-[84px_1fr] min-h-[72px] group/row transition-colors relative"
                  >
                    {/* Time Label Column */}
                    <div className="p-3 text-right flex flex-col items-end justify-start border-r border-zinc-200/50 dark:border-white/5">
                      <span className="text-[10.5px] font-black text-zinc-600 dark:text-zinc-400 clay-inset px-2 py-1 rounded-[10px]">
                        {slot.label}
                      </span>
                    </div>

                    {/* Timeline Content */}
                    <div className="p-2.5 sm:p-3 relative">
                      <div className="flex flex-wrap items-center gap-2.5 relative z-10">
                        {cellShifts.map((shift: any) => {
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
                          const isBedah = doc?.category === 'Bedah';
                          const avatarClay = isBedah ? "clay-icon-rose" : "clay-icon-blue";
                          const initials =
                            doc?.queueCode ||
                            (shift.doctor || 'DR')
                              .replace(/^dr\.\s*/i, '')
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((w: string) => w[0])
                              .join('')
                              .toUpperCase() || 'DR';

                          return (
                            <div
                              key={shift.id}
                              onClick={() => onOpenDoctorSchedule && onOpenDoctorSchedule(doc)}
                              className="group/card flex-1 min-w-[200px] max-w-[320px] p-3 rounded-[20px] clay-button relative overflow-hidden transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={cn(
                                      "w-7 h-7 rounded-[10px] flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-sm",
                                      avatarClay
                                    )}
                                  >
                                    <span className="relative z-10">{initials}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-black truncate tracking-tight text-zinc-900 dark:text-zinc-100 group-hover/card:text-blue-600 transition-colors">
                                      {shift.doctorName || shift.doctor}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 font-bold truncate">
                                      {doc?.specialty || shift.title}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => handleDelete(e, shift.id)}
                                  className="opacity-0 group-hover/card:opacity-100 p-1 clay-button rounded-[8px] text-zinc-400 hover:text-rose-600 transition-all shrink-0 active:scale-90"
                                  title="Hapus Jadwal"
                                >
                                  <Trash2 size={12} strokeWidth={2.5} />
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 mt-1 pt-1.5 border-t border-zinc-200/40 dark:border-white/5">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-black clay-inset text-blue-600 dark:text-blue-400">
                                  <Clock size={10} strokeWidth={2.5} />
                                  {shift.formattedTime}
                                </div>

                                {shift.registrationTime && (
                                  <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400">
                                    Reg {shift.registrationTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Interactive Empty Slot Button */}
                        <button
                          onClick={() => openAddForHour(slot.hour)}
                          className={cn(
                            "text-left p-2 rounded-[16px] transition-all border border-dashed border-zinc-300 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500",
                            cellShifts.length === 0
                              ? "w-full flex items-center justify-center gap-1.5 py-3 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-black group-hover/row:bg-blue-500/5"
                              : "p-2 hover:bg-blue-500/5 text-zinc-400 hover:text-blue-500 text-[11px] font-black shrink-0"
                          )}
                        >
                          <Plus size={13} strokeWidth={2.5} />
                          <span>{cellShifts.length === 0 ? `+ Tambah Shift Jam ${slot.label}` : "+ Shift"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ═══════════ MATRIKS MINGGUAN MODE ═══════════ */
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
                {DAYS_NAME.map((dayName, dIdx) => {
                  const isCurrentSelectedDay = dIdx === currentDayIdx;
                  const dayShifts = filteredShifts.filter((s) => {
                    if (!s.formattedTime || s.formattedTime === '-' || !s.formattedTime.includes(':')) return false;
                    return s.dayIdx === dIdx;
                  });

                  return (
                    <div
                      key={dayName}
                      className={cn(
                        "clay-surface rounded-[22px] p-3 flex flex-col min-h-[220px] transition-all",
                        isCurrentSelectedDay && "ring-2 ring-blue-500 shadow-md"
                      )}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/50 dark:border-white/5">
                        <span className={cn(
                          "text-xs font-black uppercase tracking-wider",
                          isCurrentSelectedDay
                            ? "text-blue-600 dark:text-blue-400"
                            : dIdx === 0
                              ? "text-rose-500 font-black"
                              : "text-zinc-800 dark:text-zinc-200"
                        )}>
                          {dayName}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full clay-button text-zinc-500">
                          {dayShifts.length}
                        </span>
                      </div>

                      {/* Shifts for this day */}
                      <div className="space-y-2 flex-1">
                        {dayShifts.length === 0 ? (
                          <div className="h-full flex items-center justify-center py-6 text-center text-zinc-400 text-[10.5px] font-bold">
                            Tidak ada shift
                          </div>
                        ) : (
                          dayShifts.map((shift: any) => {
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

                            return (
                              <div
                                key={shift.id}
                                onClick={() => onOpenDoctorSchedule && onOpenDoctorSchedule(doc)}
                                className="p-2 rounded-[14px] clay-button text-left text-xs relative group cursor-pointer hover:-translate-y-0.5 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-black text-zinc-900 dark:text-zinc-100 truncate text-[11.5px] group-hover:text-blue-600 transition-colors">
                                    {shift.doctor || 'Dokter'}
                                  </p>
                                  <button
                                    onClick={(e) => handleDelete(e, shift.id)}
                                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 p-1"
                                    title="Hapus Jadwal"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                                  {shift.formattedTime}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setNewShift({
                            doctor: "",
                            doctorId: "",
                            dayIdx: dIdx,
                            start: "08:00",
                            end: "12:00",
                            title: "Praktek",
                            registrationTime: "07:30",
                          });
                          setShowAddModal(true);
                        }}
                        className="mt-2 w-full py-1.5 rounded-[12px] clay-button text-[10.5px] font-black text-zinc-500 hover:text-blue-600 flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        <span>Tambah</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── ADD SHIFT MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAddModal(false)}>
          <div className="clay-surface rounded-t-[32px] sm:rounded-[32px] w-full max-w-md max-h-[90dvh] sm:max-h-[88vh] relative overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border border-zinc-200/60 dark:border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header (Fixed) */}
            <div className="flex-shrink-0 flex justify-between items-center px-6 pt-5 pb-4 border-b border-zinc-200/60 dark:border-white/10 relative z-10">
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                  Tambah Shift Dokter
                </h3>
                <p className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Jadwalkan jam dinas dokter di poliklinik
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="clay-button p-2 rounded-[12px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-90"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3.5 min-h-0 relative z-10">
              <SearchableSelect
                label="Pilih Dokter"
                placeholder="Pilih Dokter..."
                searchPlaceholder="Cari nama atau spesialisasi..."
                noResultsText="Dokter tidak ditemukan"
                options={doctors.map((d) => ({
                  value: d.id,
                  label: d.name,
                  sublabel: d.specialty,
                  image: d.image,
                }))}
                value={newShift.doctorId}
                onChange={(docId: string) => {
                  const doc = doctors.find((d) => d.id === docId);
                  if (doc) {
                    setNewShift({ ...newShift, doctorId: doc.id, doctor: doc.name });
                  }
                }}
              />

              <div className="grid grid-cols-2 gap-2.5">
                <CustomDropdown
                  label="Hari Dinas"
                  value={newShift.dayIdx}
                  onChange={(val: number) => setNewShift({ ...newShift, dayIdx: val })}
                  options={DAYS_NAME.map((d, i) => ({ value: i, label: d }))}
                />
                <div>
                  <label className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider block mb-1">
                    Nama Shift
                  </label>
                  <input
                    className="w-full clay-inset rounded-[16px] px-3 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
                    value={newShift.title}
                    onChange={(e) => setNewShift({ ...newShift, title: e.target.value })}
                    placeholder="cth. Praktek Pagi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <CustomTimeSelect
                  label="Jam Mulai"
                  value={newShift.start}
                  onChange={(v) => setNewShift({ ...newShift, start: v })}
                />
                <CustomTimeSelect
                  label="Jam Selesai"
                  value={newShift.end}
                  onChange={(v) => setNewShift({ ...newShift, end: v })}
                />
              </div>

              <CustomTimeSelect
                label="Buka Pendaftaran"
                value={newShift.registrationTime}
                onChange={(v) => setNewShift({ ...newShift, registrationTime: v })}
              />
            </div>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 border-t border-zinc-200/60 dark:border-white/10 bg-white/80 dark:bg-[#121620]/90 backdrop-blur-md px-6 py-3.5 pb-[max(env(safe-area-inset-bottom),1rem)] flex gap-2.5 shadow-lg">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-[16px] clay-button text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleAddShift}
                disabled={!newShift.doctorId}
                className={cn(
                  "flex-[2] py-3 rounded-[16px] text-white text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-2",
                  newShift.doctorId ? "clay-pill-blue" : "clay-button text-zinc-400 cursor-not-allowed opacity-50"
                )}
              >
                Simpan Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

