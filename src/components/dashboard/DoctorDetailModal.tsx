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
    case 'BUKA':     return "from-blue-500 to-indigo-500 shadow-blue-500/30";
    case 'PENUH':    return "from-orange-500 to-amber-500 shadow-orange-500/30";
    case 'CUTI':     return "from-pink-500 to-rose-500 shadow-pink-500/30";
    case 'OPERASI':  return "from-red-500 to-rose-600 shadow-red-500/30";
    case 'AKAN_BUKA':return "from-indigo-400 to-purple-500 shadow-indigo-500/30";
    default:         return "from-slate-300 to-slate-400 shadow-slate-300/30";
  }
}

const LEAVE_TYPE_COLOR: Record<string, string> = {
  Sakit: "bg-red-100 text-red-700 border-red-200",
  Liburan: "bg-sky-100 text-sky-700 border-sky-200",
  Pribadi: "bg-violet-100 text-violet-700 border-violet-200",
  Konferensi: "bg-amber-100 text-amber-700 border-amber-200",
  Lainnya: "bg-slate-100 text-slate-600 border-slate-200",
};

export function DoctorDetailModal({
  doctor, specialty, wingStatus, currentTimeMinutes, nowMs, onClose,
}: DoctorDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isActive = ['BUKA', 'PENUH', 'OPERASI'].includes(doctor.status);
  const isAkanBuka = doctor.status === 'AKAN_BUKA';
  const endMins = parseTimeToMinutes(doctor.endTime);
  const startMins = parseTimeToMinutes(doctor.startTime);
  const isOvertime = isActive && currentTimeMinutes > endMins && endMins > 0;
  const isSurge = doctor.status === 'PENUH' && doctor.lastManualOverride && (nowMs - doctor.lastManualOverride) < (15 * 60 * 1000);

  const progress = endMins > startMins
    ? Math.max(0, Math.min(100, Math.round(((currentTimeMinutes - startMins) / (endMins - startMins)) * 100)))
    : (isActive ? 50 : 0);

  const minsUntilOpen = isAkanBuka ? Math.max(0, startMins - currentTimeMinutes) : 0;

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
      BUKA: "bg-blue-100 text-blue-700 border-blue-200",
      PENUH: "bg-orange-100 text-orange-700 border-orange-200",
      OPERASI: "bg-red-100 text-red-700 border-red-200",
      AKAN_BUKA: "bg-indigo-100 text-indigo-700 border-indigo-200",
      CUTI: "bg-pink-100 text-pink-700 border-pink-200",
      SELESAI: "bg-emerald-100 text-emerald-700 border-emerald-200",
      TIDAK_PRAKTEK: "bg-slate-100 text-slate-500 border-slate-200",
    };
    const label: Record<Doctor['status'], string> = {
      BUKA: "Tersedia", PENUH: "Antrean Penuh", OPERASI: "Sedang Operasi",
      AKAN_BUKA: "Segera Buka", CUTI: "Cuti / Izin", SELESAI: "Selesai",
      TIDAK_PRAKTEK: "Tidak Praktek",
    };
    const dotMap: Record<Doctor['status'], string> = {
      BUKA: "bg-blue-500 animate-pulse", PENUH: "bg-orange-500", OPERASI: "bg-red-500",
      AKAN_BUKA: "bg-indigo-500", CUTI: "bg-pink-500", SELESAI: "bg-emerald-500",
      TIDAK_PRAKTEK: "bg-slate-400",
    };

    return (
      <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[13px] tracking-wide", map[doctor.status])}>
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Center Modal */}
      <div className={cn(
        "relative w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden",
        "rounded-[36px] bg-white border border-slate-200/60 shadow-2xl",
        "animate-in zoom-in-95 duration-400 ease-out"
      )}>
        {/* HEADER AREA */}
        <div className="relative pt-8 pb-6 px-6 sm:px-8 text-center shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full text-slate-400 hover:text-slate-600 transition-all z-10 touch-ripple"
          >
            <X size={18} />
          </button>

          {/* LARGE AVATAR */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className={cn(
              "w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] sm:rounded-[32px] flex items-center justify-center font-black text-white text-3xl sm:text-4xl shadow-xl",
              `bg-gradient-to-br ${getAvatarStyle(doctor.status)}`,
              !isActive && doctor.status !== 'AKAN_BUKA' && "grayscale opacity-80"
            )}>
              {doctor.queueCode?.charAt(0) || doctor.name.charAt(0)}
            </div>

            {/* Orbiting ring for OPERASI */}
            {doctor.status === 'OPERASI' && (
              <div className="absolute inset-[-6px] rounded-[34px] sm:rounded-[38px] border-[3px] border-dashed border-red-500/60 animate-spin" style={{ animationDuration: '4s' }} />
            )}
            {/* Pulsing ring for BUKA */}
            {doctor.status === 'BUKA' && (
              <div className="absolute inset-[-6px] rounded-[34px] sm:rounded-[38px] border-[2px] border-blue-400/40" />
            )}
            {/* Surge warning */}
            {isSurge && (
              <div className="absolute -top-3 -right-6 flex items-center gap-1.5 px-3 py-1 bg-orange-500 text-white text-[11px] font-black rounded-full border-[3px] border-white shadow-sm animate-bounce">
                <Flame size={12} fill="currentColor" /> Lonjakan
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {doctor.name}
          </h2>
          <p className="text-[14px] text-slate-500 font-medium mt-1 mb-4 flex items-center justify-center gap-1.5">
            <Stethoscope size={14} className="text-slate-400" />
            Poliklinik {specialty}
          </p>

          {getStatusBadge()}
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6 custom-scrollbar">
          <div className="space-y-4">
            
            {/* SHIFT & TIMING CARD */}
            <div className="bg-slate-50/70 border border-slate-200/60 rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-slate-400" />
                <h3 className="text-[14px] font-black text-slate-700 tracking-wide">Jadwal Praktik</h3>
              </div>
              
              <div className="flex justify-between items-end mb-2">
                <div className="text-[16px] font-bold text-slate-800">
                  {doctor.startTime || '--:--'} <span className="text-slate-400 font-medium mx-1">s/d</span> {doctor.endTime || '--:--'}
                </div>
                {doctor.queueCode && (
                  <div className="text-[12px] font-black text-slate-400 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    KODE: {doctor.queueCode}
                  </div>
                )}
              </div>

              {/* Progress Shift atau Countdown */}
              {isAkanBuka && minsUntilOpen > 0 ? (
                <div className="mt-4 flex items-center gap-2 text-[13px] font-black text-indigo-600 bg-indigo-50 px-4 py-2.5 rounded-[14px] border border-indigo-100">
                  <Timer size={14} className="animate-pulse" />
                  Buka dalam {minsUntilOpen >= 60 ? `${Math.floor(minsUntilOpen/60)}j ${minsUntilOpen % 60}m` : `${minsUntilOpen} menit`}
                </div>
              ) : isActive ? (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Activity size={10} className="text-blue-500" /> Progress Shift
                    </span>
                    {isOvertime && (
                      <span className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-1 bg-purple-100 px-2 py-0.5 rounded-full">
                        <ClockAlert size={10} /> Lembur
                      </span>
                    )}
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden w-full">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000",
                        isOvertime ? "bg-purple-500" :
                        doctor.status === 'OPERASI' ? "bg-red-500" :
                        doctor.status === 'PENUH' ? "bg-orange-500" : "bg-blue-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-[12px] text-slate-400 font-medium italic">
                  Sedang tidak ada jam praktik aktif.
                </div>
              )}
            </div>

            {/* CUTI/LEAVES CARD */}
            {(activeLeavesToday?.length || upcomingLeaves?.length) ? (
              <div className="bg-white border text-left border-red-100 shadow-sm rounded-[24px] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarOff size={16} className="text-red-400" />
                  <h3 className="text-[14px] font-black text-slate-700 tracking-wide">Jadwal Cuti & Izin</h3>
                </div>

                <div className="space-y-3">
                  {/* Active Leaves */}
                  {activeLeavesToday?.map(lr => (
                    <div key={lr.id} className="flex flex-col gap-1.5 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] text-red-700 font-bold flex items-center gap-1.5">
                          <Flame size={12} className="text-red-500" /> Sedang Cuti ({lr.type})
                        </span>
                      </div>
                      <span className="text-[12px] text-red-600/80 font-medium leading-snug">
                         Tanggal: {formatDateId(lr.startDate)} - {formatDateId(lr.endDate)}
                         {lr.reason && <><br />Keterangan: {lr.reason}</>}
                      </span>
                    </div>
                  ))}

                  {/* Upcoming Leaves */}
                  {upcomingLeaves?.map(lr => (
                    <div key={lr.id} className="flex flex-col gap-1.5 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] text-amber-700 font-bold flex items-center gap-1.5">
                          <Calendar size={12} className="text-amber-500" /> Akan Datang ({lr.type})
                        </span>
                      </div>
                      <span className="text-[12px] text-amber-600/80 font-medium leading-snug">
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
