"use client";

import { memo, useMemo } from "react";
import { Clock, Zap } from "lucide-react";
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
    case 'PRAKTEK': return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60";
    case 'PENUH': return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60";
    case 'CUTI': return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60";
    case 'OPERASI': return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800/60";
    case 'SELESAI': return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60";
    case 'PENDAFTARAN': return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/60";
    case 'TERJADWAL': return "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700";
    default: return "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700";
  }
}

function getCardGlowClass(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK': return "border-blue-400/80 dark:border-blue-500/80";
    case 'OPERASI': return "border-red-400/80 dark:border-red-500/80";
    case 'PENUH': return "border-amber-400/80 dark:border-amber-500/80";
    case 'PENDAFTARAN': return "border-indigo-400/80 dark:border-indigo-500/80";
    default: return "border-zinc-200 dark:border-[#232736]";
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
  density?: 'comfortable' | 'compact';
  onStatusChange: (id: string, status: Doctor['status']) => void;
  onToggleShift: (shiftId: string, shift: Shift) => void;
}

/**
 * DoctorCard — Memoized for performance.
 * Solid Dual-Mode Precision UI (Zero Blur, Zero Ambient Blob).
 */
export const DoctorCard = memo(function DoctorCard({
  doc, shifts, todayDayIdx, todayStr,
  currentTimeMinutes, weekOfMonth,
  automationEnabled, density = 'comfortable', onStatusChange, onToggleShift
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

  const isCompact = density === 'compact';

  return (
    <div className={cn(
      "bg-white dark:bg-[#131620] border hover:border-zinc-300 dark:hover:border-[#3A425C] shadow-sm relative overflow-hidden transition-all duration-200",
      isCompact ? "p-3 sm:p-3.5 rounded-[16px]" : "p-4 sm:p-5 rounded-[20px]",
      getCardGlowClass(doc.status)
    )}>
      {/* Status dot */}
      <div className={cn("absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full z-20", getStatusDotColor(doc.status))} />

      {/* Doctor info */}
      <div className={cn("flex items-start gap-3 relative z-10", isCompact ? "mb-2" : "mb-3.5")}>
        <Avatar className={cn(
          "shadow-sm border border-zinc-200 dark:border-[#2B3145] shrink-0",
          isCompact ? "h-9 w-9" : "h-11 w-11"
        )}>
          <AvatarFallback className={cn("text-xs font-black text-white", getAvatarGradient(doc.status))}>
            {doc.queueCode || doc.name.charAt(4)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h4 className={cn(
            "font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-1",
            isCompact ? "text-[13px]" : "text-[14.5px] sm:text-[15px]"
          )}>{doc.name}</h4>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1">{doc.specialty}</p>
            {activeShift?.registrationTime && (
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#1A1E2B] text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-[6px] border border-zinc-200 dark:border-[#2B3145]">
                <Clock size={8} strokeWidth={2.5} />
                <span className="text-[9px] font-bold">{activeShift.registrationTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className={cn("relative z-10", isCompact ? "mb-2" : "mb-3")}>
        <div className={cn("inline-flex px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-wider border", 
          getStatusBadgeStyle(doc.status))}
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
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold transition-all border",
                  isDisabledToday
                    ? "bg-red-50 text-red-500 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50 line-through"
                    : isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-[#1A1E2B] dark:text-zinc-400 dark:border-[#2B3145] dark:hover:border-[#3A425C]"
                )}
                title={isDisabledToday ? 'Klik untuk aktifkan hari ini' : 'Klik untuk nonaktifkan hari ini'}
              >
                <Clock size={8} />
                {shift.formattedTime}
                {isDisabledToday && <span className="text-red-500 dark:text-red-400 ml-0.5">✕</span>}
                {isActive && <span className="relative flex h-1.5 w-1.5 ml-0.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Status change buttons or AI status rendering */}
      <div className="relative z-10 w-full mt-1">
        {automationEnabled ? (
          <div className="w-full flex flex-col items-center justify-center py-3.5 px-3 rounded-[14px] bg-zinc-50 dark:bg-[#161924] border border-zinc-200 dark:border-[#262C3E]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={11} className="text-violet-500 dark:text-violet-400 fill-violet-500 dark:fill-violet-400" />
              <span className="text-[9.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Otomasi Pintar Aktif</span>
            </div>
            
            <div className={cn(
              "px-4 py-1.5 rounded-[10px] text-[11px] font-bold uppercase tracking-wider border",
              getStatusBadgeStyle(doc.status)
            )}>
               {STATUS_LABELS[doc.status] || doc.status}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: 2 rows × 4 buttons grid */}
            <div className="lg:hidden grid grid-cols-4 gap-1">
              {STATUS_BUTTONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onStatusChange(doc.id, action.id as Doctor['status'])}
                  className={cn(
                    "py-2 px-1 rounded-[10px] text-[9.5px] font-bold transition-all disabled:opacity-50 text-center min-h-[38px] flex items-center justify-center tracking-tight border",
                    doc.status === action.id
                      ? `${action.bg} text-white shadow-sm border-transparent`
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#1A1E2B] dark:text-zinc-400 dark:border-[#2B3145] dark:hover:text-zinc-200 dark:hover:border-[#3A425C]",
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Desktop: Flex-wrap layout */}
            <div className="hidden lg:flex lg:flex-wrap gap-1 w-full">
              {STATUS_BUTTONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onStatusChange(doc.id, action.id as Doctor['status'])}
                  className={cn(
                    "py-1.5 px-1 flex-1 min-w-[28px] rounded-[8px] text-[9.5px] font-bold transition-all disabled:opacity-50 truncate text-center border",
                    doc.status === action.id
                      ? `${action.bg} text-white shadow-sm border-transparent`
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#1A1E2B] dark:text-zinc-400 dark:border-[#2B3145] dark:hover:text-zinc-200 dark:hover:border-[#3A425C]",
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
