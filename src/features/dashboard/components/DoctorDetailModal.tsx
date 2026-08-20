"use client";

import { useEffect, useRef } from "react";
import {
  X, Activity, Flame, ClockAlert, Timer, Clock,
  Calendar, CalendarOff, User, Stethoscope, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";

interface DoctorDetailModalProps {
  doctor: Doctor;
  specialty: string;
  wingStatus: 'EMERGENCY' | 'BUSY' | 'NORMAL' | 'OFFLINE';
  currentTimeMinutes: number;
  nowMs: number;
  onClose: () => void;
}

function parseTimeToMinutes(timeStr: string | undefined | null) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return isNaN(h) || isNaN(m) ? 0 : h * 60 + m;
}

function formatDateId(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getAvatarStyle(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK':    return "clay-icon-blue";
    case 'PENUH':      return "clay-icon-amber";
    case 'CUTI':       return "clay-icon-rose";
    case 'OPERASI':    return "clay-icon-rose";
    case 'PENDAFTARAN': return "clay-icon-violet";
    default:           return "clay-icon-blue";
  }
}

function getRelevantShift(doc: Doctor, currentTimeMinutes: number, nowMs: number) {
  if (!doc.shifts || doc.shifts.length === 0) return null;
  const dayIdx = new Date(nowMs + 7 * 3600_000).getUTCDay() === 0 ? 6 : new Date(nowMs + 7 * 3600_000).getUTCDay() - 1;
  const todayShifts = doc.shifts.filter(s => s.dayIdx === dayIdx && s.formattedTime);
  if (todayShifts.length === 0) return null;
  
  if (todayShifts.length === 1) return todayShifts[0];

  for (const shift of todayShifts) {
    const parts = shift.formattedTime!.split('-');
    if (parts.length < 2) continue;
    const startMins = parseTimeToMinutes(parts[0]);
    const endMins = parseTimeToMinutes(parts[1]);
    if (currentTimeMinutes >= startMins - 60 && currentTimeMinutes <= endMins) return shift;
  }
  
  const upcoming = todayShifts.find(s => {
    const startMins = parseTimeToMinutes(s.formattedTime!.split('-')[0]);
    return startMins > currentTimeMinutes;
  });
  
  return upcoming || todayShifts[todayShifts.length - 1];
}

export function DoctorDetailModal({
  doctor, specialty, wingStatus, currentTimeMinutes, nowMs, onClose,
}: DoctorDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isActive = ['PRAKTEK', 'PENUH', 'OPERASI'].includes(doctor.status);
  const isPendaftaran = doctor.status === 'PENDAFTARAN';

  const shift = getRelevantShift(doctor, currentTimeMinutes, nowMs);
  let startMins = 0, endMins = 0;
  let formattedTime = '--:-- - --:--';
  if (shift && shift.formattedTime) {
    formattedTime = shift.formattedTime;
    const parts = formattedTime.split('-');
    startMins = parseTimeToMinutes(parts[0]);
    endMins = parseTimeToMinutes(parts[1]);
  }
  const isOvertime = isActive && currentTimeMinutes > endMins && endMins > 0;
  const isSurge = doctor.status === 'PENUH' && doctor.lastManualOverride && (nowMs - doctor.lastManualOverride) < (15 * 60 * 1000);

  const progress = endMins > startMins
    ? Math.max(0, Math.min(100, Math.round(((currentTimeMinutes - startMins) / (endMins - startMins)) * 100)))
    : (isActive ? 50 : 0);

  const minsUntilOpen = isPendaftaran ? Math.max(0, startMins - currentTimeMinutes) : 0;

  // Leaves
  const activeLeavesToday = doctor.leaveRequests?.filter(lr => {
    const nowDate = new Date(nowMs);
    const start = new Date(lr.startDate);
    const end = new Date(lr.endDate);
    return start <= nowDate && nowDate <= end && lr.status !== 'rejected';
  });

  const upcomingLeaves = doctor.leaveRequests?.filter(lr => {
    const nowDate = new Date(nowMs);
    const start = new Date(lr.startDate);
    const diffDays = (start.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 30 && lr.status !== 'rejected';
  });

  const getStatusBadge = () => {
    const map: Record<Doctor['status'], string> = {
      PRAKTEK: "clay-pill-blue text-white",
      PENUH: "clay-pill-amber text-white",
      OPERASI: "clay-pill-rose text-white",
      PENDAFTARAN: "clay-pill-violet text-white",
      CUTI: "clay-pill-rose text-white",
      SELESAI: "clay-pill-emerald text-white",
      LIBUR: "clay-button text-zinc-500 dark:text-zinc-400",
      TERJADWAL: "clay-button text-sky-700 dark:text-sky-300",
    };
    const label: Record<Doctor['status'], string> = {
      PRAKTEK: "Tersedia", PENUH: "Antrean Penuh", OPERASI: "Sedang Operasi",
      PENDAFTARAN: "Segera Buka", CUTI: "Cuti / Izin", SELESAI: "Selesai",
      LIBUR: "Libur/Tidak Praktek",
      TERJADWAL: "Terjadwal",
    };
    const dotMap: Record<Doctor['status'], string> = {
      PRAKTEK: "bg-white animate-pulse", PENUH: "bg-white", OPERASI: "bg-white",
      PENDAFTARAN: "bg-white", CUTI: "bg-white", SELESAI: "bg-white",
      LIBUR: "bg-zinc-400",
      TERJADWAL: "bg-sky-400",
    };

    return (
      <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-[13px] tracking-wide", map[doctor.status])}>
        <span className={cn("w-2 h-2 rounded-full", dotMap[doctor.status])} />
        {label[doctor.status]}
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Center Modal */}
      <div className={cn(
        "relative w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden",
        "clay-surface rounded-[36px] shadow-2xl",
        "animate-in zoom-in-95 duration-300 ease-out"
      )}>
        {/* HEADER AREA */}
        <div className="relative pt-8 pb-6 px-6 sm:px-8 text-center shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 clay-button rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all z-10 active:scale-95"
          >
            <X size={18} />
          </button>

          {/* LARGE AVATAR */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className={cn(
              "w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] sm:rounded-[32px] flex items-center justify-center font-black text-white text-3xl sm:text-4xl shadow-xl shrink-0",
              getAvatarStyle(doctor.status),
              !isActive && doctor.status !== 'PENDAFTARAN' && "grayscale opacity-80"
            )}>
              <span className="relative z-10 tracking-tight">{doctor.queueCode?.charAt(0) || doctor.name.charAt(0)}</span>
            </div>

            {/* Orbiting ring for OPERASI */}
            {doctor.status === 'OPERASI' && (
              <div className="absolute inset-[-6px] rounded-[38px] border-[3px] border-dashed border-red-500 animate-spin" style={{ animationDuration: '4s' }} />
            )}
            {/* Surge warning */}
            {isSurge && (
              <div className="absolute -top-3 -right-6 flex items-center gap-1.5 px-3 py-1 clay-pill-amber text-white text-[11px] font-black rounded-full shadow-sm animate-bounce">
                <Flame size={12} fill="currentColor" /> Lonjakan
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
            {doctor.name}
          </h2>
          <p className="text-[14px] text-zinc-500 dark:text-zinc-400 font-bold mt-1 mb-4 flex items-center justify-center gap-1.5">
            <Stethoscope size={14} className="text-zinc-400" />
            Poliklinik {specialty}
          </p>

          {getStatusBadge()}
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6 custom-scrollbar">
          <div className="space-y-4">
            
            {/* SHIFT & TIMING CARD */}
            <div className="clay-inset rounded-[26px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-[14px] font-black text-zinc-800 dark:text-zinc-200 tracking-wide">Jadwal Praktik</h3>
              </div>
              
              <div className="flex justify-between items-end mb-2">
                <div className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100">
                  {formattedTime.split('-')[0] || '--:--'} <span className="text-zinc-400 font-medium mx-1">s/d</span> {formattedTime.split('-')[1] || '--:--'}
                </div>
                {doctor.queueCode && (
                  <div className="text-[12px] font-black text-zinc-600 dark:text-zinc-400 font-mono clay-button px-3 py-1 rounded-xl">
                    KODE: {doctor.queueCode}
                  </div>
                )}
              </div>

              {/* Progress Shift atau Countdown */}
              {isPendaftaran && minsUntilOpen > 0 ? (
                <div className="mt-4 flex items-center gap-2 text-[13px] font-black text-white clay-pill-violet px-4 py-2.5 rounded-[16px]">
                  <Timer size={14} className="animate-pulse" />
                  Buka dalam {minsUntilOpen >= 60 ? `${Math.floor(minsUntilOpen/60)}j ${minsUntilOpen % 60}m` : `${minsUntilOpen} menit`}
                </div>
              ) : isActive ? (
                <div className="mt-5">
                  <div className="clay-surface rounded-[20px] p-3.5 relative">
                    <div className="flex justify-between text-[11px] items-center font-black font-mono text-zinc-500 dark:text-zinc-400 mb-2 px-1">
                      <span>{formattedTime.split('-')[0] || '--:--'}</span>
                      <span className="flex items-center gap-1">
                        {isOvertime ? (
                          <span className="text-purple-600 dark:text-purple-400 animate-pulse uppercase tracking-wider clay-button px-2 py-0.5 rounded-md">Lembur</span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider clay-button px-2 py-0.5 rounded-md">Live</span>
                        )}
                      </span>
                      <span>{formattedTime.split('-')[1] || '--:--'}</span>
                    </div>
                    <div className="h-2.5 clay-inset rounded-full overflow-hidden relative">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000",
                          isOvertime ? "bg-gradient-to-r from-purple-500 to-purple-600" :
                          doctor.status === 'OPERASI' ? "bg-gradient-to-r from-red-500 to-rose-600" :
                          doctor.status === 'PENUH' ? "bg-gradient-to-r from-amber-500 to-orange-600" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-[12px] text-zinc-500 dark:text-zinc-400 font-bold italic">
                  Sedang tidak ada jam praktik aktif.
                </div>
              )}
            </div>

            {/* CUTI/LEAVES CARD */}
            {(activeLeavesToday?.length || upcomingLeaves?.length) ? (
              <div className="clay-surface rounded-[26px] p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  <CalendarOff size={16} className="text-rose-500" />
                  <h3 className="text-[14px] font-black text-zinc-900 dark:text-zinc-100 tracking-wide">Jadwal Cuti & Izin</h3>
                </div>

                <div className="space-y-3 relative z-10">
                  {/* Active Leaves */}
                  {activeLeavesToday?.map(lr => (
                    <div key={lr.id} className="flex flex-col gap-1.5 clay-button rounded-[20px] px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] text-rose-600 dark:text-rose-400 font-black flex items-center gap-1.5">
                          <Flame size={12} className="text-rose-500 animate-pulse" /> Sedang Cuti ({lr.type})
                        </span>
                      </div>
                      <span className="text-[12px] text-zinc-600 dark:text-zinc-300 font-bold leading-snug">
                         Tanggal: {formatDateId(lr.startDate)} - {formatDateId(lr.endDate)}
                         {lr.reason && <><br /><span className="text-zinc-500 dark:text-zinc-400 mt-0.5 inline-block font-normal">Keterangan: {lr.reason}</span></>}
                      </span>
                    </div>
                  ))}

                  {/* Upcoming Leaves */}
                  {upcomingLeaves?.map(lr => (
                    <div key={lr.id} className="flex flex-col gap-1.5 clay-button rounded-[20px] px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] text-amber-600 dark:text-amber-400 font-black flex items-center gap-1.5">
                          <Calendar size={12} className="text-amber-500" /> Akan Datang ({lr.type})
                        </span>
                      </div>
                      <span className="text-[12px] text-zinc-600 dark:text-zinc-300 font-bold leading-snug">
                         Tanggal: {formatDateId(lr.startDate)} - {formatDateId(lr.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </div>
  );
}
