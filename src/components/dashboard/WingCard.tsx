"use client";

import { memo, useMemo } from "react";
import { Users, Activity, Flame, ClockAlert, Timer, BedDouble } from "lucide-react";
import { cn, getRelevantShift, parseTimeToMinutes } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WingCardProps {
  specialty: string;
  doctors: Doctor[];
  currentTimeMinutes: number;
  nowMs: number;
  onClick?: () => void;
}

function getAvatarGradient(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK':    return "bg-gradient-to-br from-blue-500 to-indigo-500";
    case 'PENUH':      return "bg-gradient-to-br from-orange-500 to-amber-500";
    case 'CUTI':       return "bg-gradient-to-br from-rose-400 to-pink-500";
    case 'OPERASI':    return "bg-gradient-to-br from-red-500 to-rose-600";
    case 'PENDAFTARAN':return "bg-gradient-to-br from-indigo-400 to-purple-500";
    case 'TERJADWAL':  return "bg-gradient-to-br from-sky-300 to-blue-400";
    case 'SELESAI':    return "bg-gradient-to-br from-emerald-400 to-teal-500";
    default:           return "bg-gradient-to-br from-slate-400 to-slate-500";
  }
}

// Doctor's effective shift start/end based on today's shift data
function getDoctorShiftRange(doc: Doctor, currentTimeMinutes: number, nowMs: number): { startMins: number; endMins: number } | null {
  const shift = getRelevantShift(doc, currentTimeMinutes, nowMs);
  if (!shift || !shift.formattedTime) {
    // Fallback to startTime/endTime on Doctor object
    const s = parseTimeToMinutes(doc.startTime);
    const e = parseTimeToMinutes(doc.endTime);
    if (s > 0 || e > 0) return { startMins: s, endMins: e };
    return null;
  }
  const parts = shift.formattedTime.split('-');
  return { startMins: parseTimeToMinutes(parts[0]), endMins: parseTimeToMinutes(parts[1]) };
}

export const WingCard = memo(function WingCard({
  specialty,
  doctors,
  currentTimeMinutes,
  nowMs,
  onClick,
}: WingCardProps) {

  const wingStatus = useMemo(() => {
    let hasOperasi = false;
    let penuhCount = 0;
    let bukaCount = 0;

    for (const doc of doctors) {
      if (doc.status === 'OPERASI') hasOperasi = true;
      else if (doc.status === 'PENUH') penuhCount++;
      else if (doc.status === 'PRAKTEK') bukaCount++;
    }

    const totalActive = penuhCount + bukaCount + (hasOperasi ? 1 : 0);

    if (hasOperasi) return 'EMERGENCY';
    if (totalActive === 0) return 'OFFLINE';
    if (totalActive > 1 && penuhCount / totalActive >= 0.7) return 'BUSY';
    if (totalActive === 1 && penuhCount === 1) return 'BUSY';
    return 'NORMAL';
  }, [doctors]);

  const glowStyle = useMemo(() => {
    switch (wingStatus) {
      case 'EMERGENCY':
        return "shadow-[0_0_40px_rgba(239,68,68,0.25)] border-red-200/80 ring-1 ring-inset ring-red-100";
      case 'BUSY':
        return "shadow-[0_0_30px_rgba(249,115,22,0.18)] border-orange-200/80 ring-1 ring-inset ring-orange-100";
      case 'NORMAL':
        return "border-white/70 shadow-[0_4px_24px_rgba(0,0,0,0.05)] hover:border-blue-200/70 hover:shadow-[0_8px_32px_rgba(59,130,246,0.12)]";
      case 'OFFLINE':
      default:
        return "border-white/50 opacity-75 hover:opacity-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)]";
    }
  }, [wingStatus]);

  const bgGradient = useMemo(() => {
    switch (wingStatus) {
      case 'EMERGENCY': return "from-red-500/15 via-rose-500/8 to-transparent";
      case 'BUSY':      return "from-orange-500/15 via-amber-500/8 to-transparent";
      case 'NORMAL':    return "from-blue-500/8 via-indigo-500/4 to-transparent";
      case 'OFFLINE':   return "from-slate-400/5 to-transparent";
    }
  }, [wingStatus]);

  const activeDocs = doctors.filter(d => ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(d.status));
  const cutiDocs   = doctors.filter(d => d.status === 'CUTI');
  const activeCount = activeDocs.length;

  // ─── Accurate Workload: based on real shift data ───
  const workloadStats = useMemo(() => {
    if (activeDocs.length === 0) return { progress: 0, openSlots: 0, fullSlots: 0 };
    let minStart = Infinity, maxEnd = 0;

    for (const doc of activeDocs) {
      const range = getDoctorShiftRange(doc, currentTimeMinutes, nowMs);
      if (range) {
        if (range.startMins < minStart) minStart = range.startMins;
        if (range.endMins > maxEnd) maxEnd = range.endMins;
      }
    }

    if (maxEnd <= minStart || minStart === Infinity) {
      return { progress: 50, openSlots: activeDocs.filter(d => d.status === 'PRAKTEK').length, fullSlots: activeDocs.filter(d => d.status === 'PENUH').length };
    }

    const elapsed = currentTimeMinutes - minStart;
    const total = maxEnd - minStart;
    const progress = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));

    return {
      progress,
      openSlots: activeDocs.filter(d => d.status === 'PRAKTEK').length,
      fullSlots: activeDocs.filter(d => d.status === 'PENUH').length,
    };
  }, [activeDocs, currentTimeMinutes, nowMs]);

  // Next-Active Prediction for OFFLINE wings — using real shift data
  const nextActiveStr = useMemo(() => {
    if (wingStatus !== 'OFFLINE') return null;
    let nextStart = Infinity;
    for (const doc of doctors) {
      const range = getDoctorShiftRange(doc, currentTimeMinutes, nowMs);
      if (range && range.startMins > currentTimeMinutes && range.startMins < nextStart) {
        nextStart = range.startMins;
      }
    }

    if (nextStart === Infinity) return "Selesai Hari Ini";

    const diff = nextStart - currentTimeMinutes;
    const h = Math.floor(diff / 60);
    const m = diff % 60;

    if (h > 0) return `Buka dlm ${h}j ${m}m`;
    return `Buka dlm ${m} mnt`;
  }, [wingStatus, doctors, currentTimeMinutes, nowMs]);

  // Occupancy rate: % of doctors that are FULL (PENUH)
  const occupancyPct = activeCount > 0 ? Math.round((workloadStats.fullSlots / activeCount) * 100) : 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] p-5 lg:p-6 transition-all duration-300 group bg-white/60 backdrop-blur-3xl border touch-manipulation select-none",
        "hover:-translate-y-1 hover:scale-[1.015] active:scale-[0.98] transform-gpu cursor-pointer",
        glowStyle
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Background gradient tint */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none z-0 transition-opacity duration-700",
        bgGradient
      )} />

      {/* EMERGENCY pulse ring */}
      {wingStatus === 'EMERGENCY' && (
        <div className="absolute inset-0 rounded-[28px] border-2 border-red-400/30 animate-ping pointer-events-none z-0" style={{ animationDuration: '2.5s' }} />
      )}

      <div className="relative z-10 flex flex-col h-full gap-4">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <h3 className="font-black text-[17px] text-slate-800 tracking-tight leading-tight truncate">{specialty}</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <Users size={11} /> {doctors.length} Dokter
              {cutiDocs.length > 0 && (
                <span className="ml-1 flex items-center gap-1 text-rose-500">
                  <BedDouble size={10} /> {cutiDocs.length} Cuti
                </span>
              )}
            </p>
          </div>

          {/* Status badge */}
          {activeCount > 0 ? (
            <div className={cn(
              "flex flex-col items-end gap-1 shrink-0",
            )}>
              <div className={cn(
                "px-2.5 py-1 rounded-[10px] text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border shadow-sm",
                wingStatus === 'EMERGENCY' ? "bg-red-50 text-red-600 border-red-100" :
                wingStatus === 'BUSY'      ? "bg-orange-50 text-orange-600 border-orange-100" :
                "bg-blue-50 text-blue-600 border-blue-100"
              )}>
                <Activity size={10} className={wingStatus === 'EMERGENCY' ? "animate-pulse" : ""} />
                {activeCount} Aktif
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="px-2.5 py-1 rounded-[10px] text-[10px] font-black tracking-widest border border-slate-200 bg-white/60 text-slate-400">
                OFFLINE
              </div>
              {nextActiveStr && (
                <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-50/80 px-2 py-1 rounded-md border border-indigo-100">
                  <Timer size={9} className="shrink-0 animate-pulse" />
                  {nextActiveStr}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Workload Load Bar (replaces fake sparkline) ── */}
        {activeCount > 0 && (
          <div className="space-y-2">
            {/* Shift Progress */}
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <span>Progress Shift</span>
              <span className="text-slate-500">{workloadStats.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  wingStatus === 'EMERGENCY' ? "bg-gradient-to-r from-red-500 to-rose-400" :
                  wingStatus === 'BUSY'      ? "bg-gradient-to-r from-orange-500 to-amber-400" :
                  "bg-gradient-to-r from-blue-500 to-indigo-400"
                )}
                style={{ width: `${workloadStats.progress}%` }}
              />
            </div>

            {/* Occupancy pills */}
            <div className="flex items-center gap-1.5">
              {workloadStats.openSlots > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                  {workloadStats.openSlots} Buka
                </span>
              )}
              {workloadStats.fullSlots > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  {workloadStats.fullSlots} Penuh
                </span>
              )}
              {occupancyPct > 0 && (
                <span className="ml-auto text-[9px] font-black text-slate-400">
                  {occupancyPct}% kapasitas
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Doctor List ── */}
        <div className="mt-auto space-y-2 pt-3 border-t border-white/50">
          {doctors.slice(0, 4).map(doc => {
            const range = getDoctorShiftRange(doc, currentTimeMinutes, nowMs);
            const isOvertime = range && ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(doc.status) && currentTimeMinutes > range.endMins;
            const isSurge = doc.status === 'PENUH' && doc.lastManualOverride && (nowMs - doc.lastManualOverride) < (15 * 60 * 1000);
            const isCuti = doc.status === 'CUTI';

            return (
              <div key={doc.id} className="flex items-center gap-2.5 min-w-0">
                <Avatar className={cn(
                  "h-7 w-7 shadow-sm flex-shrink-0",
                  ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(doc.status) ? "ring-2 ring-white" : "opacity-50 grayscale",
                  isCuti && "opacity-40 grayscale ring-2 ring-rose-200",
                  isOvertime && "ring-2 ring-purple-400 animate-pulse"
                )}>
                  <AvatarFallback className={cn("text-[10px] font-black text-white", getAvatarGradient(doc.status))}>
                    {doc.queueCode || doc.name.charAt(4)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0 mr-2">
                    <p className={cn(
                      "text-[12px] font-bold truncate transition-colors",
                      isCuti ? "text-slate-400 line-through decoration-rose-300" :
                      ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(doc.status) ? "text-slate-800" : "text-slate-500",
                      isOvertime && "text-purple-700"
                    )}>
                      {doc.name.replace(/dr\.?\s*/i, '').trim()}
                    </p>
                    {isSurge && (
                      <div className="bg-orange-100 p-0.5 rounded-full text-orange-500 shrink-0 animate-bounce" title="Lonjakan Pasien">
                        <Flame size={9} fill="currentColor" strokeWidth={0} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isCuti ? (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-rose-50 text-rose-500 border-rose-200">
                        Cuti
                      </span>
                    ) : isOvertime ? (
                      <span className="flex items-center gap-0.5 bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
                        <ClockAlert size={9} /> Lembur
                      </span>
                    ) : (
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                        doc.status === 'PRAKTEK'     ? "bg-blue-50 text-blue-600 border-blue-100" :
                        doc.status === 'PENUH'       ? "bg-orange-50 text-orange-600 border-orange-100" :
                        doc.status === 'OPERASI'     ? "bg-red-50 text-red-600 border-red-100" :
                        doc.status === 'PENDAFTARAN' ? "bg-indigo-50 text-indigo-500 border-indigo-100" :
                        doc.status === 'TERJADWAL'   ? "bg-sky-50 text-sky-500 border-sky-100" :
                        doc.status === 'SELESAI'     ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        "bg-slate-50 text-slate-400 border-slate-100"
                      )}>{doc.status}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {doctors.length > 4 && (
            <div className="text-[10px] font-bold text-slate-400 pt-1.5 text-center border-t border-white/20 mt-2">
              + {doctors.length - 4} Dokter lainnya
            </div>
          )}
        </div>

        {/* Tap hint */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[9px] font-black text-slate-400 flex items-center gap-1 pointer-events-none">
          Sentuh untuk detail
        </div>
      </div>
    </div>
  );
});
