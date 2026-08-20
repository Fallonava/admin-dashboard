"use client";

import { memo, useMemo } from "react";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, Shift } from "@/lib/data-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const STATUS_BUTTONS = [
  { id: 'TERJADWAL', label: 'Terjadwal', clayClass: 'clay-button text-zinc-700 dark:text-zinc-300', activeClay: 'clay-pill-blue text-white' },
  { id: 'PENDAFTARAN', label: 'Daftar', clayClass: 'clay-button text-indigo-700 dark:text-indigo-300', activeClay: 'clay-pill-violet text-white' },
  { id: 'PRAKTEK', label: 'Praktek', clayClass: 'clay-button text-blue-700 dark:text-blue-300', activeClay: 'clay-pill-blue text-white' },
  { id: 'PENUH', label: 'Penuh', clayClass: 'clay-button text-amber-700 dark:text-amber-300', activeClay: 'clay-pill-amber text-white' },
  { id: 'OPERASI', label: 'Ops', clayClass: 'clay-button text-red-700 dark:text-red-300', activeClay: 'clay-pill-rose text-white' },
  { id: 'SELESAI', label: 'Selesai', clayClass: 'clay-button text-emerald-700 dark:text-emerald-300', activeClay: 'clay-pill-emerald text-white' },
  { id: 'CUTI', label: 'Cuti', clayClass: 'clay-button text-pink-700 dark:text-pink-300', activeClay: 'clay-pill-rose text-white' },
  { id: 'LIBUR', label: 'Libur', clayClass: 'clay-button text-zinc-500 dark:text-zinc-400', activeClay: 'clay-button text-zinc-900 dark:text-white font-black' },
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

function getStatusBadgeClass(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK': return "clay-pill-blue text-white";
    case 'PENUH': return "clay-pill-amber text-white";
    case 'CUTI': return "clay-pill-rose text-white";
    case 'OPERASI': return "clay-pill-rose text-white";
    case 'SELESAI': return "clay-pill-emerald text-white";
    case 'PENDAFTARAN': return "clay-pill-violet text-white";
    case 'TERJADWAL': return "clay-button text-zinc-700 dark:text-zinc-300";
    default: return "clay-button text-zinc-500 dark:text-zinc-400";
  }
}

function getAvatarGradient(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK': return "bg-gradient-to-br from-blue-500 to-indigo-600";
    case 'PENUH': return "bg-gradient-to-br from-amber-500 to-orange-600";
    case 'CUTI': return "bg-gradient-to-br from-pink-500 to-rose-600";
    case 'OPERASI': return "bg-gradient-to-br from-red-500 to-rose-700";
    case 'PENDAFTARAN': return "bg-gradient-to-br from-indigo-500 to-purple-600";
    case 'TERJADWAL': return "bg-gradient-to-br from-sky-400 to-blue-500";
    default: return "bg-gradient-to-br from-zinc-400 to-zinc-600";
  }
}

interface DoctorCardProps {
  doc: Doctor;
  shifts: Shift[];
  todayDayIdx: number;
  todayStr: string;
  currentTimeMinutes: number;
  weekOfMonth: number;
  automationEnabled: boolean;
  density?: 'comfortable' | 'compact';
  onStatusChange: (id: string, status: Doctor['status']) => void;
  onToggleShift: (shiftId: string, shift: Shift) => void;
}

export const DoctorCard = memo(function DoctorCard({
  doc, shifts, todayDayIdx, todayStr,
  currentTimeMinutes, weekOfMonth,
  automationEnabled, density = 'comfortable', onStatusChange, onToggleShift
}: DoctorCardProps) {

  // Shifts filter
  const docShiftsToday = useMemo(() => shifts.filter(s => {
    if (s.doctorId !== doc.id || s.dayIdx !== todayDayIdx) return false;
    if ((s.disabledDates || []).includes(todayStr)) return false;
    if (!s.formattedTime || s.formattedTime === '-' || !s.formattedTime.includes(':')) return false;
    if (s.extra === 'odd_weeks' && weekOfMonth % 2 === 0) return false;
    if (s.extra === 'even_weeks' && weekOfMonth % 2 !== 0) return false;
    return true;
  }), [shifts, doc.id, todayDayIdx, todayStr, weekOfMonth]);

  const activeShift = useMemo(() => shifts.find(s =>
    s.doctorId === doc.id && s.dayIdx === todayDayIdx &&
    !(s.disabledDates || []).includes(todayStr) &&
    s.registrationTime
  ), [shifts, doc.id, todayDayIdx, todayStr]);

  const isCompact = density === 'compact';

  return (
    <div className={cn(
      "clay-surface relative overflow-hidden transition-all duration-200 group flex flex-col justify-between",
      isCompact ? "p-4 rounded-[20px]" : "p-5 sm:p-6 rounded-[26px]"
    )}>
      <div>
        {/* Top: Doctor Info & Avatar */}
        <div className={cn("flex items-start gap-3.5 relative z-10", isCompact ? "mb-2.5" : "mb-4")}>
          <div className="clay-button p-1 rounded-[18px] shrink-0">
            <Avatar className={cn(
              "rounded-[14px]",
              isCompact ? "h-9 w-9" : "h-11 w-11"
            )}>
              <AvatarFallback className={cn("text-xs sm:text-sm font-black text-white rounded-[14px]", getAvatarGradient(doc.status))}>
              {doc.queueCode || doc.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className={cn(
              "font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-1",
              isCompact ? "text-[13.5px]" : "text-[15px] sm:text-[16px]"
            )}>
              {doc.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 font-bold line-clamp-1">
                {doc.specialty}
              </p>
              {activeShift?.registrationTime && (
                <div className="flex items-center gap-1 clay-inset px-2 py-0.5 rounded-full text-blue-600 dark:text-blue-400">
                  <Clock size={9} strokeWidth={2.5} />
                  <span className="text-[9.5px] font-black">{activeShift.registrationTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0",
            getStatusBadgeClass(doc.status)
          )}>
            {STATUS_LABELS[doc.status] || doc.status}
          </div>
        </div>

        {/* Shift pills */}
        {docShiftsToday.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
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
                    "flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all",
                    isDisabledToday
                      ? "clay-inset text-rose-500 opacity-60 line-through"
                      : isActive
                        ? "clay-pill-emerald text-white"
                        : "clay-button text-zinc-600 dark:text-zinc-400"
                  )}
                  title={isDisabledToday ? 'Klik untuk aktifkan hari ini' : 'Klik untuk nonaktifkan hari ini'}
                >
                  <Clock size={10} strokeWidth={2.5} />
                  <span>{shift.formattedTime}</span>
                  {isDisabledToday && <span className="text-rose-500 ml-0.5 font-black">✕</span>}
                  {isActive && (
                    <span className="relative flex h-1.5 w-1.5 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Controls / AI Automation state */}
      <div className="relative z-10 w-full mt-2">
        {automationEnabled ? (
          <div className="w-full flex flex-col items-center justify-center py-3.5 px-3 rounded-[20px] clay-inset">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={13} className="text-violet-500 fill-violet-500" />
              <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                Otomasi AI Aktif
              </span>
            </div>
            
            <div className={cn(
              "px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider",
              getStatusBadgeClass(doc.status)
            )}>
               {STATUS_LABELS[doc.status] || doc.status}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: 2 rows × 4 buttons */}
            <div className="lg:hidden grid grid-cols-4 gap-1.5">
              {STATUS_BUTTONS.map((action) => {
                const isActive = doc.status === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => onStatusChange(doc.id, action.id as Doctor['status'])}
                    className={cn(
                      "touch-ripple py-2 px-1 rounded-xl text-[10px] font-extrabold transition-all text-center min-h-[36px] flex items-center justify-center tracking-tight active:scale-95",
                      isActive ? action.activeClay : action.clayClass
                    )}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>

            {/* Desktop: Flex-wrap layout */}
            <div className="hidden lg:flex lg:flex-wrap gap-1.5 w-full">
              {STATUS_BUTTONS.map((action) => {
                const isActive = doc.status === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => onStatusChange(doc.id, action.id as Doctor['status'])}
                    className={cn(
                      "py-1.5 px-2 flex-1 min-w-[32px] rounded-xl text-[10px] font-extrabold transition-all truncate text-center",
                      isActive ? action.activeClay : action.clayClass
                    )}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
