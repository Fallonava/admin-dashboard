"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown, Clock, Activity, Timer, Flame, ClockAlert,
  User, CheckCircle, XCircle, AlertCircle, Pause, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";

type WingStatus = 'EMERGENCY' | 'BUSY' | 'NORMAL' | 'OFFLINE';

interface PoliAccordionProps {
  specialty: string;
  doctors: Doctor[];
  wingStatus: WingStatus;
  currentTimeMinutes: number;
  nowMs: number;
  defaultOpen?: boolean;
  patientFilter: 'ALL' | 'ACTIVE' | 'FULL' | 'INACTIVE';
  onOpenDoctorDetail: (doc: Doctor) => void;
}

function parseTimeToMinutes(t: string | undefined | null) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return isNaN(h) || isNaN(m) ? 0 : h * 60 + m;
}

function getPatientLabel(status: Doctor['status'], endTime?: string, currentTimeMinutes?: number) {
  switch (status) {
    case 'PRAKTEK':     return { text: 'Sedang Praktek', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle };
    case 'PENUH':    return { text: 'Antrean Penuh', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', icon: XCircle };
    case 'OPERASI':  return { text: 'Sedang Operasi', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-600', icon: AlertCircle };
    case 'PENDAFTARAN':return { text: 'Buka Pendaftaran', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-400', icon: Timer };
    case 'TERJADWAL':return { text: 'Terjadwal Hari Ini', color: 'bg-sky-100 text-sky-600 border-sky-200', dot: 'bg-sky-400', icon: Timer };
    case 'CUTI':     return { text: 'Cuti Hari Ini', color: 'bg-pink-100 text-pink-600 border-pink-200', dot: 'bg-pink-400', icon: Pause };
    case 'SELESAI':  return { text: 'Selesai Hari Ini', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle };
    case 'LIBUR':    return { text: 'Libur', color: 'bg-slate-100 text-slate-400 border-slate-200', dot: 'bg-slate-300', icon: XCircle };
    default:         return { text: 'Libur', color: 'bg-slate-100 text-slate-400 border-slate-200', dot: 'bg-slate-300', icon: XCircle };
  }
}

function getAvatarGradient(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK':     return "from-emerald-400 to-teal-500";
    case 'PENUH':    return "from-red-400 to-rose-500";
    case 'OPERASI':  return "from-rose-600 to-red-700";
    case 'PENDAFTARAN':return "from-indigo-400 to-purple-500";
    case 'TERJADWAL':return "from-sky-300 to-blue-400";
    case 'CUTI':     return "from-pink-400 to-rose-500";
    case 'SELESAI':  return "from-emerald-500 to-teal-600";
    case 'LIBUR':    return "from-slate-300 to-slate-400";
    default:         return "from-slate-300 to-slate-400";
  }
}

function isActiveStatus(status: Doctor['status']) {
  return ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(status);
}

const WING_STATUS_CONFIG = {
  EMERGENCY: { badge: 'bg-red-100 text-red-700 border-red-200', headerBg: 'bg-red-50', headerBorder: 'border-red-200', label: '🚨 Kondisi Darurat', barColor: 'bg-red-500' },
  BUSY:      { badge: 'bg-orange-100 text-orange-700 border-orange-200', headerBg: 'bg-orange-50', headerBorder: 'border-orange-200', label: '⚡ Antrean Padat', barColor: 'bg-orange-500' },
  NORMAL:    { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', headerBg: 'bg-white', headerBorder: 'border-slate-200', label: '🟢 Beroperasi Normal', barColor: 'bg-emerald-500' },
  OFFLINE:   { badge: 'bg-slate-100 text-slate-500 border-slate-200', headerBg: 'bg-slate-50', headerBorder: 'border-slate-200', label: '⚫ Off-Duty', barColor: 'bg-slate-300' },
};

function getRelevantShift(doc: Doctor, currentTimeMinutes: number, nowMs: number) {
  if (!doc.shifts || doc.shifts.length === 0) return null;
  const dayIdx = new Date(nowMs + 7 * 3600_000).getUTCDay() === 0 ? 6 : new Date(nowMs + 7 * 3600_000).getUTCDay() - 1;
  const todayShifts = doc.shifts.filter(s => s.dayIdx === dayIdx && s.formattedTime);
  if (todayShifts.length === 0) return null;
  
  // Jika hanya 1 shift khusus hari ini
  if (todayShifts.length === 1) return todayShifts[0];

  // Cari shift yg sedang aktif / akan buka sebentar lagi
  for (const shift of todayShifts) {
    const parts = shift.formattedTime!.split('-');
    if (parts.length < 2) continue;
    const startMins = parseTimeToMinutes(parts[0]);
    const endMins = parseTimeToMinutes(parts[1]);
    if (currentTimeMinutes >= startMins - 60 && currentTimeMinutes <= endMins) return shift;
  }
  
  // Kalau belum ada yang aktif, cari shift berikutnya yang waktu start-nya > saat ini
  const upcoming = todayShifts.find(s => {
    const startMins = parseTimeToMinutes(s.formattedTime!.split('-')[0]);
    return startMins > currentTimeMinutes;
  });
  
  return upcoming || todayShifts[todayShifts.length - 1];
}

export function PoliAccordion({
  specialty, doctors, wingStatus, currentTimeMinutes, nowMs,
  defaultOpen = false, patientFilter, onOpenDoctorDetail,
}: PoliAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const cfg = WING_STATUS_CONFIG[wingStatus];

  const activeDoctors = doctors.filter(d => isActiveStatus(d.status));
  const activeCount = activeDoctors.length;
  const availableCount = doctors.filter(d => d.status === 'PRAKTEK').length;
  const fullCount = doctors.filter(d => d.status === 'PENUH').length;

  // Next open time for OFFLINE wing
  const nextOpenStr = useMemo(() => {
    if (wingStatus !== 'OFFLINE') return null;
    let nextStart = Infinity;
    for (const doc of doctors) {
      const shift = getRelevantShift(doc, currentTimeMinutes, nowMs);
      if (shift) {
        const s = parseTimeToMinutes(shift.formattedTime!.split('-')[0]);
        if (s > currentTimeMinutes && s < nextStart) nextStart = s;
      }
    }
    if (nextStart === Infinity) return null;
    const diff = nextStart - currentTimeMinutes;
    const h = Math.floor(diff / 60), m = diff % 60;
    return h > 0 ? `Buka dalam ${h}j ${m}m` : `Buka dalam ${m} mnt`;
  }, [wingStatus, doctors, currentTimeMinutes, nowMs]);

  // Filter doctors for display
  const filteredDoctors = useMemo(() => {
    if (patientFilter === 'ALL') return doctors;
    if (patientFilter === 'ACTIVE') return doctors.filter(d => d.status === 'PRAKTEK' || d.status === 'PENDAFTARAN');
    if (patientFilter === 'FULL') return doctors.filter(d => d.status === 'PENUH');
    if (patientFilter === 'INACTIVE') return doctors.filter(d => !isActiveStatus(d.status));
    return doctors;
  }, [doctors, patientFilter]);

  // Should this poli be visible under current filter?
  const isVisible = useMemo(() => {
    if (patientFilter === 'ALL') return true;
    if (patientFilter === 'ACTIVE') return availableCount > 0;
    if (patientFilter === 'FULL') return fullCount > 0;
    if (patientFilter === 'INACTIVE') return activeDoctors.length === 0;
    return true;
  }, [patientFilter, availableCount, fullCount, activeDoctors]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "rounded-[28px] border overflow-hidden transition-all duration-300 bg-white shadow-sm",
      isOpen ? `border-slate-300 shadow-md` : `${cfg.headerBorder}`,
      wingStatus === 'EMERGENCY' && "ring-2 ring-red-300"
    )}>
      {/* ─── Accordion Header ─── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(prev => !prev); } }}
        className={cn(
          "w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 text-left transition-all duration-300 touch-manipulation cursor-pointer",
          cfg.headerBg,
          "active:bg-slate-50/80 active:scale-[0.99]",
          isOpen ? "border-b border-slate-200/60" : ""
        )}
      >
        {/* Status bar (left edge) */}
        <div className={cn("w-1.5 h-12 rounded-full shrink-0", cfg.barColor)} />

        {/* Poli Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[17px] font-black text-slate-800 tracking-tight">
              {specialty}
            </h3>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-black border tracking-wider uppercase", cfg.badge)}>
              {cfg.label}
            </span>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {availableCount > 0 && (
              <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {availableCount} Tersedia
              </span>
            )}
            {fullCount > 0 && (
              <span className="flex items-center gap-1 text-[12px] font-bold text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {fullCount} Penuh
              </span>
            )}
            {activeCount === 0 && nextOpenStr && (
              <span className="flex items-center gap-1 text-[12px] font-bold text-slate-400">
                <Timer size={11} className="animate-pulse text-indigo-400" />
                {nextOpenStr}
              </span>
            )}
            <span className="text-[11px] text-slate-300 font-medium ml-1">
              {doctors.length} dokter terdaftar
            </span>
          </div>
        </div>

        {/* Chevron + detail button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 transition-transform duration-300",
            isOpen ? "rotate-180" : ""
          )}>
            <ChevronDown size={16} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* ─── Accordion Body ─── */}
      {isOpen && (
        <div className="bg-slate-50/50 p-4">
          {filteredDoctors.length === 0 ? (
            <p className="text-center text-slate-400 font-medium py-6 text-sm">
              Tidak ada dokter yang sesuai filter.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
              {filteredDoctors.map(doc => {
                const shift = getRelevantShift(doc, currentTimeMinutes, nowMs);
                let startMins = 0, endMins = 0;
                let formattedTime = 'Jadwal belum diatur';
                
                if (shift && shift.formattedTime) {
                   formattedTime = shift.formattedTime;
                   const parts = formattedTime.split('-');
                   startMins = parseTimeToMinutes(parts[0]);
                   endMins = parseTimeToMinutes(parts[1]);
                }

                const lbl = getPatientLabel(doc.status, shift ? shift.formattedTime?.split('-')[1] : undefined, currentTimeMinutes);
                const StatusIcon = lbl.icon;
                const isActive = isActiveStatus(doc.status);
                
                const isOvertime = isActive && currentTimeMinutes > endMins && endMins > 0;
                const isSurge = doc.status === 'PENUH' && doc.lastManualOverride && (nowMs - doc.lastManualOverride) < 15 * 60 * 1000;
                const isPendaftaran = doc.status === 'PENDAFTARAN';
                const minsUntilOpen = isPendaftaran ? startMins - currentTimeMinutes : 0;
                const shiftProgress = (isActive && endMins > startMins)
                  ? Math.max(0, Math.min(100, Math.round(((currentTimeMinutes - startMins) / (endMins - startMins)) * 100)))
                  : 0;

                return (
                  <button
                    key={doc.id}
                    onClick={() => onOpenDoctorDetail(doc)}
                    className={cn(
                      "flex items-start text-left gap-3 bg-white rounded-[20px] sm:rounded-[24px] border px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm",
                      "transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] touch-manipulation cursor-pointer active:scale-[0.98]",
                      "hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10",
                      isActive ? "border-slate-200 hover:border-indigo-200" : "border-slate-100 opacity-75"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow",
                        `bg-gradient-to-br ${getAvatarGradient(doc.status)}`,
                        !isActive && "grayscale opacity-60"
                      )}>
                        {doc.queueCode?.charAt(0) || doc.name.charAt(0)}
                      </div>
                      {/* Orbiting ring for OPERASI */}
                      {doc.status === 'OPERASI' && (
                        <div className="absolute inset-[-4px] rounded-full border-2 border-dashed border-red-400/60 animate-spin" style={{ animationDuration: '3s' }} />
                      )}
                      {/* Pulse for PRAKTEK */}
                      {doc.status === 'PRAKTEK' && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={cn(
                          "text-[14px] font-black tracking-tight truncate",
                          isActive ? "text-slate-800" : "text-slate-400"
                        )}>
                          {doc.name.replace(/dr\.?\s*/i, 'dr. ')}
                        </p>
                        {isSurge && (
                          <span className="flex items-center gap-1 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded-full text-[9px] font-black text-orange-600">
                            <Flame size={8} fill="currentColor" strokeWidth={0} /> Lonjakan
                          </span>
                        )}
                        {isOvertime && (
                          <span className="flex items-center gap-1 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-full text-[9px] font-black text-purple-600">
                            <ClockAlert size={8} /> Lembur
                          </span>
                        )}
                      </div>

                      {/* Shift time */}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock size={10} />
                          {formattedTime.replace('-', '–')}
                        </span>
                        {doc.queueCode && (
                          <span className="text-[10px] font-black text-slate-300 font-mono">Kode: {doc.queueCode}</span>
                        )}
                        {isPendaftaran && minsUntilOpen > 0 && (
                          <span className="text-[10px] font-black text-indigo-500 flex items-center gap-1">
                            <Timer size={9} className="animate-pulse" />
                            {minsUntilOpen >= 60 ? `${Math.floor(minsUntilOpen/60)}j ${minsUntilOpen % 60}m lagi` : `${minsUntilOpen} mnt`}
                          </span>
                        )}
                      </div>

                      {/* Shift progress micro-bar (only for active) */}
                      {isActive && shiftProgress > 0 && (
                        <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden w-full max-w-[120px]">
                          <div
                            className={cn("h-full rounded-full transition-all duration-1000",
                              isOvertime ? "bg-purple-400" :
                              doc.status === 'OPERASI' ? "bg-red-400" :
                              doc.status === 'PENUH' ? "bg-orange-400" : "bg-emerald-400"
                            )}
                            style={{ width: `${shiftProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black border",
                        lbl.color
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", lbl.dot,
                          doc.status === 'PRAKTEK' && "animate-pulse")} />
                        {lbl.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
