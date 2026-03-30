"use client";

import { memo, useMemo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, Shift } from "@/lib/data-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const STATUS_BUTTONS = [
  { id: 'TERJADWAL', label: 'Terjadwal', bg: 'bg-slate-500', hover: 'hover:bg-slate-600' },
  { id: 'PENDAFTARAN', label: 'Daftar', bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600' },
  { id: 'PRAKTEK', label: 'Praktek', bg: 'bg-blue-500', hover: 'hover:bg-blue-600' },
  { id: 'PENUH', label: 'Penuh', bg: 'bg-orange-500', hover: 'hover:bg-orange-600' },
  { id: 'OPERASI', label: 'Ops', bg: 'bg-red-500', hover: 'hover:bg-red-600' },
  { id: 'SELESAI', label: 'Selesai', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600' },
  { id: 'CUTI', label: 'Cuti', bg: 'bg-pink-500', hover: 'hover:bg-pink-600' },
  { id: 'LIBUR', label: 'Libur', bg: 'bg-gray-400', hover: 'hover:bg-gray-500' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  TERJADWAL: 'Terjadwal',
  PENDAFTARAN: 'Pendaftaran',
  PRAKTEK: 'Praktek',
  PENUH: 'Penuh',
  OPERASI: 'Operasi',
  CUTI: 'Cuti',
  SELESAI: 'Selesai',
  LIBUR: 'Libur',
};

function getStatusDotColor(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK': return "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]";
    case 'PENUH': return "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]";
    case 'CUTI': return "bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]";
    case 'OPERASI': return "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]";
    case 'SELESAI': return "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]";
    case 'PENDAFTARAN': return "bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.6)]";
    case 'TERJADWAL': return "bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.4)]";
    default: return "bg-slate-300";
  }
}

function getAvatarGradient(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK': return "bg-gradient-to-br from-blue-500 to-indigo-500";
    case 'PENUH': return "bg-gradient-to-br from-orange-500 to-amber-500";
    case 'CUTI': return "bg-gradient-to-br from-pink-500 to-rose-500";
    case 'OPERASI': return "bg-gradient-to-br from-red-500 to-rose-600";
    case 'PENDAFTARAN': return "bg-gradient-to-br from-indigo-400 to-purple-500";
    case 'TERJADWAL': return "bg-gradient-to-br from-sky-300 to-blue-400";
    default: return "bg-gradient-to-br from-slate-400 to-slate-500";
  }
}

function getStatusBadgeStyle(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK': return "bg-blue-50 text-blue-600 border border-blue-100";
    case 'PENUH': return "bg-orange-50 text-orange-600 border border-orange-100";
    case 'CUTI': return "bg-pink-50 text-pink-600 border border-pink-100";
    case 'OPERASI': return "bg-red-50 text-red-600 border border-red-100";
    case 'SELESAI': return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    case 'PENDAFTARAN': return "bg-indigo-50 text-indigo-600 border border-indigo-100";
    case 'TERJADWAL': return "bg-sky-50 text-sky-600 border border-sky-100";
    default: return "bg-slate-50 text-slate-500 border border-slate-100";
  }
}

interface DoctorCardProps {
  doc: Doctor;
  shifts: Shift[];
  todayDayIdx: number;
  todayStr: string;
  // Performance optimizations: pass pre-calculated values
  currentTimeMinutes: number;
  weekOfMonth: number;
  automationEnabled: boolean;
  onStatusChange: (id: string, status: Doctor['status']) => void;
  onToggleShift: (shiftId: string, shift: Shift) => void;
}

/**
 * DoctorCard — Memoized for performance.
 * Refrains from re-rendering unless core data changes.
 * Logic calculations moved to props to reduce per-item overhead.
 */
export const DoctorCard = memo(function DoctorCard({
  doc, shifts, todayDayIdx, todayStr,
  currentTimeMinutes, weekOfMonth,
  automationEnabled, onStatusChange, onToggleShift
}: DoctorCardProps) {

  // Hanya tampilkan shift yang tidak di-disable hari ini
  const docShiftsToday = useMemo(() => shifts.filter(s => {
    if (s.doctorId !== doc.id || s.dayIdx !== todayDayIdx) return false;
    if ((s.disabledDates || []).includes(todayStr)) return false;
    
    // Abaikan shift tanpa format waktu yang valid
    if (!s.formattedTime || s.formattedTime === '-' || !s.formattedTime.includes(':')) return false;

    // Filter pola ganjil/genap
    if (s.extra === 'odd_weeks' && weekOfMonth % 2 === 0) return false;
    if (s.extra === 'even_weeks' && weekOfMonth % 2 !== 0) return false;

    return true;
  }), [shifts, doc.id, todayDayIdx, todayStr, weekOfMonth]);

  // Find active shift with registration time
  const activeShift = useMemo(() => shifts.find(s =>
    s.doctorId === doc.id && s.dayIdx === todayDayIdx &&
    !(s.disabledDates || []).includes(todayStr) &&
    s.registrationTime
  ), [shifts, doc.id, todayDayIdx, todayStr]);

  return (
    <div className={cn(
      "super-glass-card bg-white/40 backdrop-blur-3xl p-4 sm:p-5 rounded-[28px] group relative overflow-hidden border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.15)] hover:border-white/80 hover:bg-white/60 hover:-translate-y-1 transition-all duration-500",
      automationEnabled && "hover:opacity-100"
    )}>
      {/* Inner glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />
      {automationEnabled && (
        <div className="absolute inset-0 bg-violet-500/5 pointer-events-none z-0" />
      )}

      {/* Status dot */}
      <div className={cn("absolute top-4 right-4 w-3 h-3 rounded-full z-20 shadow-sm", getStatusDotColor(doc.status))} />

      {/* Doctor info */}
      <div className="flex items-start gap-3 mb-4 relative z-10">
        <Avatar className="h-12 w-12 shadow-sm border-[3px] border-white/80 ring-1 ring-black/5 group-hover:scale-105 transition-transform duration-300">
          <AvatarFallback className={cn("text-sm font-black text-white", getAvatarGradient(doc.status))}>
            {doc.queueCode || doc.name.charAt(4)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h4 className="font-black text-[15px] sm:text-[16px] tracking-tight text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{doc.name}</h4>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="text-[11.5px] tracking-wide text-slate-500 font-bold line-clamp-1">{doc.specialty}</p>
            {activeShift?.registrationTime && (
              <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md text-blue-600 px-2 py-0.5 rounded-[10px] border border-white/80 shadow-sm">
                <Clock size={10} strokeWidth={2.5} />
                <span className="text-[10px] font-black">{activeShift.registrationTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className="mb-4 relative z-10">
        <div className={cn("inline-flex px-3 py-1.5 rounded-[12px] text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md", 
          getStatusBadgeStyle(doc.status).replace('bg-', 'bg-white/60 border border-white/80 '))}
        >
          {STATUS_LABELS[doc.status] || doc.status}
        </div>
      </div>

      {/* Shift pills */}
      {docShiftsToday.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 relative z-10">
          {docShiftsToday.map((shift: Shift) => {
            const [startStr, endStr] = (shift.formattedTime || '').split('-');
            const startM = parseInt(startStr?.split(':')[0] || '0') * 60 + parseInt(startStr?.split(':')[1] || '0');
            const endM = parseInt(endStr?.split(':')[0] || '0') * 60 + parseInt(endStr?.split(':')[1] || '0');
            const isDisabledToday = (shift.disabledDates || []).includes(todayStr);
            const isActive = currentTimeMinutes >= startM && currentTimeMinutes < endM && !isDisabledToday;
            return (
              <button
                key={shift.id}
                onClick={() => onToggleShift(shift.id, shift)}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-semibold transition-all border",
                  isDisabledToday
                    ? "bg-red-50 text-red-400 border-red-100 line-through hover:bg-red-100"
                    : isActive
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 ring-1 ring-emerald-200"
                      : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                )}
                title={isDisabledToday ? 'Klik untuk aktifkan hari ini' : 'Klik untuk nonaktifkan hari ini'}
              >
                <Clock size={8} />
                {shift.formattedTime}
                {isDisabledToday && <span className="text-red-400 ml-0.5">✕</span>}
                {isActive && <span className="relative flex h-1.5 w-1.5 ml-0.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Status change buttons */}
      <div className="relative z-10 w-full">
        {/* Mobile: 2 rows × 4 buttons grid */}
        <div className="lg:hidden grid grid-cols-4 gap-1">
          {STATUS_BUTTONS.slice(0, 4).map((action) => (
            <button
              key={action.id}
              onClick={() => onStatusChange(doc.id, action.id as Doctor['status'])}
              className={cn(
                "py-2.5 px-1 rounded-[14px] text-[10px] font-black transition-all disabled:opacity-50 text-center min-h-[44px] flex items-center justify-center tracking-wide",
                doc.status === action.id
                  ? `${action.bg} text-white shadow-md ${action.hover}`
                  : "bg-white/60 hover:bg-white backdrop-blur-md text-slate-500 border border-white/80 hover:border-white shadow-sm",
              )}
            >
              {action.label}
            </button>
          ))}
          {STATUS_BUTTONS.slice(4).map((action) => (
            <button
              key={action.id}
              onClick={() => onStatusChange(doc.id, action.id as Doctor['status'])}
              className={cn(
                "py-2.5 px-1 rounded-[14px] text-[10px] font-black transition-all disabled:opacity-50 text-center min-h-[44px] flex items-center justify-center tracking-wide",
                doc.status === action.id
                  ? `${action.bg} text-white shadow-md ${action.hover}`
                  : "bg-white/60 hover:bg-white backdrop-blur-md text-slate-500 border border-white/80 hover:border-white shadow-sm",
              )}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Desktop: Original flex-wrap layout */}
        <div className="hidden lg:flex lg:flex-wrap gap-1 w-full">
          {STATUS_BUTTONS.map((action) => (
            <button
              key={action.id}
              onClick={() => onStatusChange(doc.id, action.id as Doctor['status'])}
              className={cn(
                "py-2 px-1 flex-1 min-w-[32px] rounded-[12px] text-[10px] tracking-wide font-black transition-all disabled:opacity-50 line-clamp-1 truncate text-center",
                doc.status === action.id
                  ? `${action.bg} text-white shadow-md ${action.hover}`
                  : "bg-white/60 hover:bg-white backdrop-blur-md text-slate-600 border border-white/80 hover:border-white shadow-sm scale-95 hover:scale-100",
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
