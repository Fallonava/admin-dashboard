"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  X, Users, Activity, Flame, ClockAlert, Timer, Clock,
  CheckCircle2, Circle, Calendar, CalendarOff, Stethoscope, ChevronRight, Wifi
} from "lucide-react";
import { cn, parseTimeToMinutes, getRelevantShift } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";

interface WingDetailModalProps {
  specialty: string;
  doctors: Doctor[];
  wingStatus: 'EMERGENCY' | 'BUSY' | 'NORMAL' | 'OFFLINE';
  currentTimeMinutes: number;
  nowMs: number;
  onClose: () => void;
}



function formatDateId(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const LEAVE_TYPE_COLOR: Record<string, string> = {
  Sakit: "bg-red-100 text-red-700 border-red-200",
  Liburan: "bg-sky-100 text-sky-700 border-sky-200",
  Pribadi: "bg-violet-100 text-violet-700 border-violet-200",
  Konferensi: "bg-amber-100 text-amber-700 border-amber-200",
  Lainnya: "bg-slate-100 text-slate-600 border-slate-200",
};

const WING_LIGHT_CONFIG = {
  EMERGENCY: {
    headerBg: "bg-gradient-to-br from-red-50 to-rose-100",
    headerBorder: "border-red-200",
    accent: "from-red-500 to-rose-600",
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "🚨 Kondisi Darurat",
    progressBar: "from-red-500 to-rose-400",
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.12)]",
  },
  BUSY: {
    headerBg: "bg-gradient-to-br from-orange-50 to-amber-100",
    headerBorder: "border-orange-200",
    accent: "from-orange-500 to-amber-500",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    label: "⚡ Antrean Tinggi",
    progressBar: "from-orange-500 to-amber-400",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.1)]",
  },
  NORMAL: {
    headerBg: "bg-gradient-to-br from-sky-50 to-indigo-50",
    headerBorder: "border-indigo-200",
    accent: "from-blue-500 to-indigo-500",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    label: "🟢 Beroperasi Normal",
    progressBar: "from-blue-500 to-indigo-400",
    glow: "shadow-[0_0_30px_rgba(99,102,241,0.08)]",
  },
  OFFLINE: {
    headerBg: "bg-gradient-to-br from-slate-50 to-slate-100",
    headerBorder: "border-slate-200",
    accent: "from-slate-400 to-slate-500",
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    label: "⚫ Tidak Aktif",
    progressBar: "from-slate-400 to-slate-300",
    glow: "",
  },
};



function getAvatarGradient(status: Doctor['status']) {
  switch (status) {
    case 'PRAKTEK':     return "from-blue-500 to-indigo-500";
    case 'PENUH':    return "from-orange-500 to-amber-500";
    case 'CUTI':     return "from-pink-500 to-rose-500";
    case 'OPERASI':  return "from-red-500 to-rose-600";
    case 'PENDAFTARAN':return "from-indigo-400 to-purple-500";
    case 'TERJADWAL':return "from-sky-300 to-blue-400";
    default:         return "from-slate-300 to-slate-400";
  }
}

function StatusBadge({ status }: { status: Doctor['status'] }) {
  const map: Record<Doctor['status'], string> = {
    PRAKTEK:      "bg-blue-100 text-blue-700 border-blue-200",
    PENUH:        "bg-orange-100 text-orange-700 border-orange-200",
    OPERASI:      "bg-red-100 text-red-700 border-red-200",
    PENDAFTARAN:  "bg-indigo-100 text-indigo-600 border-indigo-200",
    CUTI:         "bg-slate-100 text-rose-600 border-rose-200",
    SELESAI:      "bg-emerald-100 text-emerald-700 border-emerald-200",
    TERJADWAL:    "bg-sky-100 text-sky-600 border-sky-200",
    LIBUR:        "bg-slate-100 text-slate-500 border-slate-200",
  };
  const label: Record<Doctor['status'], string> = {
    PRAKTEK: "PRAKTEK", PENUH: "PENUH", OPERASI: "OPERASI",
    PENDAFTARAN: "PENDAFTARAN", CUTI: "SEDANG CUTI", SELESAI: "SELESAI",
    TERJADWAL: "TERJADWAL", LIBUR: "LIBUR",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-xl text-[11px] font-black border tracking-wider shrink-0", map[status])}>
      {label[status]}
    </span>
  );
}

export function WingDetailModal({
  specialty, doctors, wingStatus, currentTimeMinutes, nowMs, onClose,
}: WingDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cfg = WING_LIGHT_CONFIG[wingStatus];

  const activeDoctors = doctors.filter(d => ['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(d.status));
  const offlineDoctors = doctors.filter(d => !['PRAKTEK', 'PENUH', 'OPERASI', 'PENDAFTARAN'].includes(d.status));

  const shiftProgress = useMemo(() => {
    if (activeDoctors.length === 0) return 0;
    let minStart = Infinity, maxEnd = 0;
    for (const d of activeDoctors) {
      const shift = getRelevantShift(d, currentTimeMinutes, nowMs);
      if (!shift || !shift.formattedTime) continue;
      const parts = shift.formattedTime.split('-');
      const s = parseTimeToMinutes(parts[0]);
      const e = parseTimeToMinutes(parts[1]);
      if (s < minStart) minStart = s;
      if (e > maxEnd) maxEnd = e;
    }
    if (maxEnd <= minStart || minStart === Infinity) return 50;
    const elapsed = currentTimeMinutes - minStart;
    const total = maxEnd - minStart;
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  }, [activeDoctors, currentTimeMinutes, nowMs]);

  const nextActive = useMemo(() => {
    if (wingStatus !== 'OFFLINE') return null;
    let nextStart = Infinity;
    for (const doc of doctors) {
      const shift = getRelevantShift(doc, currentTimeMinutes, nowMs);
      if (shift && shift.formattedTime) {
        const s = parseTimeToMinutes(shift.formattedTime.split('-')[0]);
        if (s > currentTimeMinutes && s < nextStart) nextStart = s;
      }
    }
    if (nextStart === Infinity) return null;
    const diff = nextStart - currentTimeMinutes;
    const h = Math.floor(diff / 60), m = diff % 60;
    return h > 0 ? `${h}j ${m}m lagi` : `${m} mnt lagi`;
  }, [wingStatus, doctors, currentTimeMinutes, nowMs]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Center Modal — Light Theme */}
      <div className={cn(
        "rounded-t-[32px] sm:rounded-[40px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden",
        "bg-white border-t sm:border text-left",
        "animate-in zoom-in-95 duration-300 ease-out",
        cfg.headerBorder,
        cfg.glow
      )}>
        {/* HEADER — Colored accent strip */}
        <div className={cn("shrink-0 px-6 sm:px-8 py-5", cfg.headerBg, `border-b ${cfg.headerBorder}`)}>
          {/* Drag Handle */}
          <div className="flex justify-center mb-4 cursor-pointer" onClick={onClose}>
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Stethoscope size={10} /> Poliklinik
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">{specialty}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={cn("px-3 py-1.5 rounded-full text-[11px] font-black border tracking-widest uppercase", cfg.badge)}>
                  {cfg.label}
                </span>
                {activeDoctors.length > 0 && (
                  <span className="text-slate-400 text-[12px] font-bold flex items-center gap-1">
                    <Activity size={11} className="text-emerald-500" /> {activeDoctors.length} Aktif
                  </span>
                )}
                {nextActive && (
                  <span className="text-slate-400 text-[12px] font-bold flex items-center gap-1">
                    <Timer size={11} className="text-indigo-400 animate-pulse" /> Buka {nextActive}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 mt-1 bg-white/70 hover:bg-white active:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all flex-shrink-0 border border-slate-200 shadow-sm touch-ripple"
            >
              <X size={20} />
            </button>
          </div>

          {/* Shift Progress */}
          {activeDoctors.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Progress Shift</span>
                <span className="text-[12px] font-black text-slate-500">{shiftProgress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", cfg.progressBar)}
                  style={{ width: `${shiftProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* BODY — Scrollable */}
        <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">

          {/* Active Doctors */}
          {activeDoctors.length > 0 && (
            <div className="px-6 sm:px-8 py-5">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity size={12} className="text-emerald-500" /> Sedang Bertugas
              </p>
              <div className="space-y-2.5">
                {activeDoctors.map(doc => {
                  const shift = getRelevantShift(doc, currentTimeMinutes, nowMs);
                  let startMins = 0, endMins = 0;
                  let formattedTime = 'Jadwal belum diatur';
                  if (shift && shift.formattedTime) {
                    formattedTime = shift.formattedTime;
                    const parts = formattedTime.split('-');
                    startMins = parseTimeToMinutes(parts[0]);
                    endMins = parseTimeToMinutes(parts[1]);
                  }
                  
                  const isOvertime = currentTimeMinutes > endMins && endMins > 0;
                  const isSurge = doc.status === 'PENUH' && doc.lastManualOverride && (nowMs - doc.lastManualOverride) < (15 * 60 * 1000);
                  const progress = endMins > startMins
                    ? Math.max(0, Math.min(100, Math.round(((currentTimeMinutes - startMins) / (endMins - startMins)) * 100)))
                    : 50;

                  // Active leave for this doctor today
                  const activeLeavesToday = doc.leaveRequests?.filter(lr => {
                    const nowDate = new Date(nowMs);
                    const start = new Date(lr.startDate);
                    const end = new Date(lr.endDate);
                    return start <= nowDate && nowDate <= end && lr.status !== 'rejected';
                  });

                  // Upcoming leaves (within next 30 days)
                  const upcomingLeaves = doc.leaveRequests?.filter(lr => {
                    const nowDate = new Date(nowMs);
                    const start = new Date(lr.startDate);
                    const diffDays = (start.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24);
                    return diffDays > 0 && diffDays <= 30 && lr.status !== 'rejected';
                  });

                  return (
                    <div key={doc.id} className={cn(
                      "bg-white rounded-[24px] border p-4 shadow-sm transition-all",
                      isOvertime ? "border-purple-200 bg-purple-50/30" : doc.status === 'OPERASI' ? "border-red-200 bg-red-50/30" : "border-slate-200/80"
                    )}>
                      <div className="flex items-center gap-3.5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-md",
                            `bg-gradient-to-br ${getAvatarGradient(doc.status)}`
                          )}>
                            {doc.queueCode || doc.name.charAt(0)}
                          </div>
                          {/* Orbiting ring for OPERASI */}
                          {doc.status === 'OPERASI' && (
                            <div className="absolute inset-[-5px] rounded-full border-2 border-dashed border-red-400/50 animate-spin" style={{ animationDuration: '3s' }} />
                          )}
                          {doc.status === 'PENUH' && (
                            <div className="absolute inset-[-5px] rounded-full border-2 border-dashed border-orange-400/40 animate-spin" style={{ animationDuration: '6s' }} />
                          )}
                          {/* Pulse dot */}
                          <span className={cn(
                            "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center",
                            doc.status === 'PRAKTEK' ? "bg-blue-500" : doc.status === 'PENUH' ? "bg-orange-500" : doc.status === 'OPERASI' ? "bg-red-500" : "bg-slate-300"
                          )}>
                            <span className={cn("absolute inset-0 rounded-full animate-ping opacity-50", doc.status === 'PRAKTEK' ? "bg-blue-500" : doc.status === 'PENUH' ? "bg-orange-500" : "bg-red-400")} />
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[15px] font-black text-slate-800">
                              {doc.name.replace(/dr\.?\s*/i, '').trim()}
                            </p>
                            {isSurge && (
                              <span className="flex items-center gap-1 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full text-[10px] font-black text-orange-600">
                                <Flame size={9} fill="currentColor" strokeWidth={0} /> Lonjakan
                              </span>
                            )}
                            {isOvertime && (
                              <span className="flex items-center gap-1 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-black text-purple-600">
                                <ClockAlert size={9} /> Lembur
                              </span>
                            )}
                          </div>

                          {/* Timeline Track */}
                          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5 relative shadow-inner">
                            <div className="flex justify-between text-[10px] items-center font-black font-mono text-slate-400 mb-1.5 px-1">
                              <span>{formattedTime.split('-')[0] || '--:--'}</span>
                              <span className="flex items-center gap-1">
                                {isOvertime ? (
                                  <span className="text-purple-500 animate-pulse text-[9px] uppercase tracking-wider">Lembur</span>
                                ) : (
                                  <span className="text-indigo-500 text-[9px] uppercase tracking-wider">Live</span>
                                )}
                              </span>
                              <span>{formattedTime.split('-')[1] || '--:--'}</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                              <div
                                className={cn("h-full rounded-full transition-all duration-1000",
                                  isOvertime ? "bg-purple-400" :
                                  doc.status === 'OPERASI' ? "bg-red-400" :
                                  doc.status === 'PENUH' ? "bg-orange-400" : "bg-blue-400"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="self-start mt-1">
                          <StatusBadge status={doc.status} />
                        </div>
                      </div>

                      {/* Active Leave Warning */}
                      {activeLeavesToday && activeLeavesToday.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-red-100">
                          {activeLeavesToday.map(lr => (
                            <div key={lr.id} className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                              <CalendarOff size={13} className="text-red-500 shrink-0" />
                              <span className="text-[12px] text-red-600 font-semibold">
                                Cuti hari ini: <strong>{lr.type}</strong>
                                {lr.reason && ` — ${lr.reason}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upcoming Leaves */}
                      {upcomingLeaves && upcomingLeaves.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {upcomingLeaves.map(lr => (
                            <div key={lr.id} className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                              <Calendar size={12} className="text-amber-500 shrink-0" />
                              <span className="text-[12px] text-amber-700 font-medium">
                                Cuti terjadwal: <strong>{lr.type}</strong> · {formatDateId(lr.startDate)}–{formatDateId(lr.endDate)}
                              </span>
                              <span className={cn("ml-auto text-[10px] font-black px-2 py-0.5 rounded-lg border shrink-0", LEAVE_TYPE_COLOR[lr.type] || LEAVE_TYPE_COLOR.Lainnya)}>
                                {lr.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          {activeDoctors.length > 0 && offlineDoctors.length > 0 && (
            <div className="mx-6 sm:mx-8 h-px bg-slate-200" />
          )}

          {/* Offline Doctors */}
          {offlineDoctors.length > 0 && (
            <div className="px-6 sm:px-8 py-5">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Circle size={10} className="text-slate-300" /> Tidak Bertugas
              </p>
              <div className="space-y-2">
                {offlineDoctors.map(doc => {
                  const shift = getRelevantShift(doc, currentTimeMinutes, nowMs);
                  let nextMins = 0;
                  if (shift && shift.formattedTime) {
                    nextMins = parseTimeToMinutes(shift.formattedTime.split('-')[0]);
                  }
                  const timeUntil = nextMins > currentTimeMinutes ? nextMins - currentTimeMinutes : null;

                  // Upcoming leaves
                  const nextLeave = doc.leaveRequests?.filter(lr => {
                    const start = new Date(lr.startDate);
                    const diffDays = (start.getTime() - new Date(nowMs).getTime()) / (1000 * 60 * 60 * 24);
                    return diffDays >= 0 && diffDays <= 14 && lr.status !== 'rejected';
                  })[0];

                  return (
                    <div key={doc.id} className="flex items-center gap-3.5 bg-white border border-slate-200/60 px-4 py-3 rounded-[20px]">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm bg-gradient-to-br grayscale opacity-60",
                        getAvatarGradient(doc.status)
                      )}>
                        {doc.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-500 truncate">
                          {doc.name.replace(/dr\.?\s*/i, '').trim()}
                        </p>
                        {nextLeave && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar size={10} className="text-amber-400" />
                            <span className="text-[11px] text-amber-600 font-medium">
                              Cuti: {formatDateId(nextLeave.startDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {timeUntil !== null && timeUntil < 120 && (
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-1">
                            <Timer size={9} className="animate-pulse" />
                            {Math.floor(timeUntil / 60) > 0 ? `${Math.floor(timeUntil / 60)}j ${timeUntil % 60}m` : `${timeUntil}m`}
                          </span>
                        )}
                        <StatusBadge status={doc.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {doctors.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">Tidak ada dokter terdaftar</p>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* FOOTER */}
        <div className={cn(
          "px-6 sm:px-8 pb-6 pt-4 shrink-0 flex items-center justify-between gap-3 bg-white border-t border-slate-100"
        )}>
          <div className="text-[12px] text-slate-400 font-medium">
            <span className="font-black text-slate-600">{doctors.length}</span> dokter terdaftar
          </div>
          <button
            onClick={onClose}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 touch-manipulation text-white shadow-md",
              `bg-gradient-to-r ${cfg.accent}`
            )}
          >
            <CheckCircle2 size={15} /> Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
