"use client";

import { memo, useMemo } from "react";
import { Users, Activity, Flame, ClockAlert, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
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
    case 'PRAKTEK': return "bg-gradient-to-br from-blue-500 to-indigo-500";
    case 'PENUH': return "bg-gradient-to-br from-orange-500 to-amber-500";
    case 'CUTI': return "bg-gradient-to-br from-pink-500 to-rose-500";
    case 'OPERASI': return "bg-gradient-to-br from-red-500 to-rose-600";
    case 'PENDAFTARAN': return "bg-gradient-to-br from-indigo-400 to-purple-500";
    case 'TERJADWAL': return "bg-gradient-to-br from-sky-300 to-blue-400";
    default: return "bg-gradient-to-br from-slate-400 to-slate-500";
  }
}

function parseTimeToMinutes(timeStr: string | undefined | null) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return isNaN(h) || isNaN(m) ? 0 : h * 60 + m;
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
        return "shadow-[0_0_40px_rgba(239,68,68,0.2)] animate-pulse border-red-200";
      case 'BUSY':
        return "shadow-[0_0_30px_rgba(249,115,22,0.15)] border-orange-200";
      case 'NORMAL':
        return "shadow-[0_0_20px_rgba(59,130,246,0.05)] border-white/60 hover:border-blue-200 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]";
      case 'OFFLINE':
      default:
        return "border-white/60 opacity-80 hover:opacity-100";
    }
  }, [wingStatus]);
  
  const bgGradient = useMemo(() => {
    switch (wingStatus) {
      case 'EMERGENCY': return "from-red-500/20 to-rose-500/10";
      case 'BUSY': return "from-orange-500/20 to-amber-500/10";
      case 'NORMAL': return "from-blue-500/10 to-indigo-500/5";
      case 'OFFLINE': return "from-slate-400/5 to-slate-500/5";
    }
  }, [wingStatus]);

  const activeDocs = doctors.filter(d => ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(d.status));
  const activeCount = activeDocs.length;

  // Next-Active Prediction logic for OFFLINE wing
  const nextActiveStr = useMemo(() => {
    if (wingStatus !== 'OFFLINE') return null;
    let nextStart = Infinity;
    for (const doc of doctors) {
        const startMins = parseTimeToMinutes(doc.startTime);
        if (startMins > currentTimeMinutes && startMins < nextStart) {
            nextStart = startMins;
        }
    }
    
    if (nextStart === Infinity) return "Selesai Hari Ini";
    
    const diff = nextStart - currentTimeMinutes;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    
    if (h > 0) return `Buka dlm ${h}j ${m}m`;
    return `Buka dlm ${m} mnt`;
  }, [wingStatus, doctors, currentTimeMinutes]);

  // Shift Progress Calculator
  const shiftProgress = useMemo(() => {
      if (activeCount === 0) return 0;
      let minStart = Infinity;
      let maxEnd = 0;
      
      for (const d of activeDocs) {
          const s = parseTimeToMinutes(d.startTime);
          const e = parseTimeToMinutes(d.endTime);
          if (s < minStart) minStart = s;
          if (e > maxEnd) maxEnd = e;
      }
      if (maxEnd <= minStart) return 50; // Fallback
      
      const elapsed = currentTimeMinutes - minStart;
      const total = maxEnd - minStart;
      if (elapsed < 0) return 0;
      if (elapsed > total) return 100;
      
      return Math.round((elapsed / total) * 100);
  }, [activeDocs, currentTimeMinutes, activeCount]);

  // Mini sparkline: simulate activity bars from shift data (5 slots over shift window)
  const sparklineBars = useMemo(() => {
    if (activeDocs.length === 0) return [];
    let minStart = Infinity, maxEnd = 0;
    for (const d of activeDocs) {
      const s = parseTimeToMinutes(d.startTime);
      const e = parseTimeToMinutes(d.endTime);
      if (s < minStart) minStart = s;
      if (e > maxEnd) maxEnd = e;
    }
    if (maxEnd <= minStart) return [];
    const slots = 8;
    const slotDuration = (maxEnd - minStart) / slots;
    return Array.from({ length: slots }, (_, i) => {
      const slotMid = minStart + slotDuration * i + slotDuration / 2;
      const isPenuhDoc = activeDocs.filter(d => d.status === 'PENUH').length;
      // Height: past slots = fully rendered; future slots = lighter
      const isPast = slotMid < currentTimeMinutes;
      const isCurrent = Math.abs(slotMid - currentTimeMinutes) < slotDuration;
      const baseH = 20 + Math.round(Math.sin(i * 0.9) * 30);
      const penuhBoost = isPenuhDoc > 0 ? 20 : 0;
      const h = Math.min(100, Math.max(15, baseH + penuhBoost));
      return { h, isPast, isCurrent };
    });
  }, [activeDocs, currentTimeMinutes]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] p-5 lg:p-6 transition-all duration-300 group bg-white/40 backdrop-blur-[20px] border touch-manipulation select-none",
        "hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] transform-gpu cursor-pointer",
        glowStyle
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
        <div className={cn(
           "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none z-0 transition-opacity duration-700",
           bgGradient
        )} />

        <div className="relative z-10 flex flex-col h-full">
            {/* Header Area */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-black text-lg text-slate-800 tracking-tight leading-tight">{specialty}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Users size={12} /> {doctors.length} Dokter
                        </p>
                        {/* 2026 Trend: Shift Progress Bar */}
                        {activeCount > 0 && (
                            <div className="w-16 h-1.5 bg-slate-200/50 rounded-full overflow-hidden flex items-center shadow-inner" title={`${shiftProgress}% Shift Berjalan`}>
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${shiftProgress}%` }} 
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Lencana */}
                {activeCount > 0 ? (
                    <div className={cn(
                        "px-3 py-1.5 rounded-[12px] text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border shadow-sm",
                        wingStatus === 'EMERGENCY' ? "bg-red-50 text-red-600 border-red-100" :
                        wingStatus === 'BUSY' ? "bg-orange-50 text-orange-600 border-orange-100" :
                        "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                        <Activity size={10} className={wingStatus === 'EMERGENCY' ? "animate-pulse" : ""} />
                        {activeCount} Aktif
                    </div>
                ) : (
                    <div className="flex flex-col items-end gap-1">
                        <div className="px-3 py-1.5 rounded-[12px] text-[10px] font-black tracking-widest border border-slate-200 bg-white/60 text-slate-400">
                            OFFLINE
                        </div>
                        {/* 2026 Trend: Next-Active Prediction */}
                        {nextActiveStr && (
                            <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-wider bg-white/40 px-2 py-1 rounded-md border border-white/60">
                                <Timer size={10} className="shrink-0 animate-pulse text-indigo-400" />
                                {nextActiveStr}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Doctor Avatars & Names - Compact List */}
            <div className="mt-auto space-y-2.5 pt-4 border-t border-white/40 relative">
                {doctors.slice(0, 4).map(doc => {
                    // Trend 2026 Calculations
                    const endMins = parseTimeToMinutes(doc.endTime);
                    const isOvertime = ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(doc.status) && (currentTimeMinutes > endMins);
                    
                    // Surge Indicator: Status penuh & diubah dalam 15 menit terakhir
                    const isSurge = doc.status === 'PENUH' && doc.lastManualOverride && (nowMs - doc.lastManualOverride) < (15 * 60 * 1000);

                    return (
                        <div key={doc.id} className="flex items-center gap-2.5 min-w-0">
                            <Avatar className={cn(
                                "h-8 w-8 shadow-sm flex-shrink-0 transition-transform",
                                ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(doc.status) ? "ring-2 ring-white" : "opacity-60 grayscale group-hover:grayscale-0",
                                isOvertime && "ring-2 ring-purple-400 animate-pulse"
                            )}>
                                <AvatarFallback className={cn("text-[10px] font-black text-white", getAvatarGradient(doc.status))}>
                                    {doc.queueCode || doc.name.charAt(4)}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className="min-w-0 flex-1 flex items-center justify-between group/doc">
                                <div className="flex items-center gap-1.5 min-w-0 mr-2">
                                    <p className={cn(
                                        "text-[13px] font-bold truncate transition-colors",
                                        ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(doc.status) ? "text-slate-800" : "text-slate-500",
                                        isOvertime && "text-purple-700"
                                    )}>
                                        {doc.name.replace(/dr\.?\s*/i, '').trim()}
                                    </p>
                                    
                                    {/* Trend 2026: Surge / Mendadak Penuh Indicator */}
                                    {isSurge && (
                                        <div className="bg-orange-100 p-0.5 rounded-full text-orange-500 shadow-sm animate-bounce" title="Lonjakan Pasien Baru Saja Terjadi">
                                            <Flame size={10} fill="currentColor" strokeWidth={0} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Trend 2026: Overtime Lencana Peringatan */}
                                    {isOvertime ? (
                                        <span className="flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider relative overflow-hidden group-hover/doc:bg-purple-100 transition-colors">
                                            <ClockAlert size={10} /> Lembur
                                        </span>
                                    ) : (
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                            doc.status === 'PRAKTEK' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            doc.status === 'PENUH' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                            doc.status === 'OPERASI' ? "bg-red-50 text-red-600 border-red-100" :
                                            doc.status === 'PENDAFTARAN' ? "bg-indigo-50 text-indigo-500 border-indigo-100" :
                                            doc.status === 'TERJADWAL' ? "bg-sky-50 text-sky-500 border-sky-100" :
                                            doc.status === 'SELESAI' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            doc.status === 'CUTI' ? "bg-pink-50 text-pink-500 border-pink-100" :
                                            "bg-slate-50/50 text-slate-400 border-slate-100/50"
                                        )}>{doc.status === 'LIBUR' ? 'LIBUR' : doc.status}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {doctors.length > 4 && (
                    <div className="text-[11px] font-bold text-slate-400 pt-2 text-center border-t border-white/20 mt-3 mix-blend-multiply">
                        + {doctors.length - 4} Dokter Lainnya
                    </div>
                )}
            </div>

            {/* Sparkline activity bars — 2026 Trend */}
            {sparklineBars.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/30 flex items-end gap-[3px] h-8">
                {sparklineBars.map((bar, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-full transition-all duration-1000",
                      bar.isCurrent
                        ? wingStatus === 'BUSY' ? "bg-orange-400" : wingStatus === 'EMERGENCY' ? "bg-red-500" : "bg-blue-500"
                        : bar.isPast
                          ? wingStatus === 'BUSY' ? "bg-orange-300/70" : wingStatus === 'EMERGENCY' ? "bg-red-400/70" : "bg-blue-400/60"
                          : "bg-slate-300/30"
                    )}
                    style={{ height: `${bar.h}%` }}
                  />
                ))}
                <span className="text-[8px] font-black text-slate-400 ml-1 mb-0.5 shrink-0 tracking-widest uppercase">Arus</span>
              </div>
            )}

            {/* Tap Hint */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[9px] font-black text-slate-400 flex items-center gap-1 pointer-events-none">
              Sentuh untuk detail
            </div>
        </div>
    </div>
  );
});
