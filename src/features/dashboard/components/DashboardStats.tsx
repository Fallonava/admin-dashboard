"use client";

import { useMemo } from "react";
import { BriefcaseMedical, FileClock, CheckCircle2, BarChart3, TrendingUp, Sparkles } from "lucide-react";
import type { Doctor, Shift } from "@/lib/data-service";

interface DashboardStatsProps {
  todayDoctors: Doctor[];
  shifts: Shift[];
  todayDayIdx: number;
  efficiency: number;
}

export function DashboardStats({ todayDoctors, shifts, todayDayIdx, efficiency }: DashboardStatsProps) {
  const activeDocs = useMemo(() => todayDoctors.filter(d => d.status === 'PRAKTEK' || d.status === 'PENUH' || d.status === 'PENDAFTARAN'), [todayDoctors]);
  const onLeaveDocs = useMemo(() => todayDoctors.filter(d => d.status === 'CUTI'), [todayDoctors]);
  const todayShiftCount = useMemo(() => shifts.filter(s => s.dayIdx === todayDayIdx).length, [shifts, todayDayIdx]);
  const activePercent = todayDoctors.length > 0 ? (activeDocs.length / todayDoctors.length) * 100 : 0;
  const leavePercent  = todayDoctors.length > 0 ? (onLeaveDocs.length / todayDoctors.length) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {/* Stat 1: Dokter Bertugas */}
      <div className="clay-surface p-5 sm:p-6 rounded-[24px] relative overflow-hidden transition-all duration-200 group">
        <div className="flex justify-between items-start mb-4 relative z-10">
          {/* Clay 3D Icon */}
          <div className="clay-icon-blue w-12 h-12 rounded-[18px] shrink-0">
            <BriefcaseMedical size={22} className="text-white z-10 relative" strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-white clay-pill-emerald px-2.5 py-1 rounded-full uppercase tracking-wider">
            <TrendingUp size={11} strokeWidth={3} />
            Live
          </span>
        </div>
        <h3 className="text-[11px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
          Dokter Bertugas
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {activeDocs.length}
          </span>
          <span className="text-xs sm:text-sm font-bold text-zinc-400 dark:text-zinc-500">
            / {todayDoctors.length} terdaftar
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full clay-inset rounded-full p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full clay-pill-blue transition-all duration-700 ease-out"
            style={{ width: `${Math.max(activePercent, 4)}%` }}
          />
        </div>
      </div>

      {/* Stat 2: Cuti */}
      <div className="clay-surface p-5 sm:p-6 rounded-[24px] relative overflow-hidden transition-all duration-200 group">
        <div className="flex justify-between items-start mb-4 relative z-10">
          {/* Clay 3D Icon */}
          <div className="clay-icon-rose w-12 h-12 rounded-[18px] shrink-0">
            <FileClock size={22} className="text-white z-10 relative" strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-white clay-pill-rose px-2.5 py-1 rounded-full uppercase tracking-wider">
            Izin / Cuti
          </span>
        </div>
        <h3 className="text-[11px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
          Sedang Cuti
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {onLeaveDocs.length}
          </span>
          <span className="text-xs sm:text-sm font-bold text-zinc-400 dark:text-zinc-500">
            dokter
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full clay-inset rounded-full p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full clay-pill-rose transition-all duration-700 ease-out"
            style={{ width: `${Math.max(leavePercent, 4)}%` }}
          />
        </div>
      </div>

      {/* Stat 3: Efisiensi Pelayanan */}
      <div className="clay-surface p-5 sm:p-6 rounded-[24px] relative overflow-hidden transition-all duration-200 group">
        <div className="flex justify-between items-start mb-4 relative z-10">
          {/* Clay 3D Icon */}
          <div className="clay-icon-emerald w-12 h-12 rounded-[18px] shrink-0">
            <CheckCircle2 size={22} className="text-white z-10 relative" strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-white clay-pill-emerald px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles size={11} strokeWidth={2.5} />
            Optimal
          </span>
        </div>
        <h3 className="text-[11px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
          Skor Efisiensi
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {efficiency}%
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full clay-inset rounded-full p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full clay-pill-emerald transition-all duration-700 ease-out"
            style={{ width: `${Math.max(efficiency, 4)}%` }}
          />
        </div>
      </div>

      {/* Stat 4: Total Shift Hari Ini */}
      <div className="clay-surface p-5 sm:p-6 rounded-[24px] relative overflow-hidden transition-all duration-200 group">
        <div className="flex justify-between items-start mb-4 relative z-10">
          {/* Clay 3D Icon */}
          <div className="clay-icon-amber w-12 h-12 rounded-[18px] shrink-0">
            <BarChart3 size={22} className="text-white z-10 relative" strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-white clay-pill-amber px-2.5 py-1 rounded-full uppercase tracking-wider">
            Jadwal
          </span>
        </div>
        <h3 className="text-[11px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
          Shift Aktif Hari Ini
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {todayShiftCount}
          </span>
          <span className="text-xs sm:text-sm font-bold text-zinc-400 dark:text-zinc-500">
            sesi praktek
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full clay-inset rounded-full p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full clay-pill-amber transition-all duration-700 ease-out"
            style={{ width: `${Math.max(Math.min(todayShiftCount * 8, 100), 4)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

