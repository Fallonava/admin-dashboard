"use client";

import { useMemo } from "react";
import { BriefcaseMedical, FileClock, CheckCircle2, BarChart3, TrendingUp } from "lucide-react";
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3.5 md:gap-4">
      {/* Stat 1: Dokter Bertugas */}
      <div className="bg-white dark:bg-[#131620] border border-zinc-200 dark:border-[#232736] hover:border-zinc-300 dark:hover:border-[#353D56] p-5 rounded-[20px] shadow-sm relative overflow-hidden group transition-all duration-200">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-[#1A1E2B] dark:text-blue-400 rounded-[14px] border border-blue-100 dark:border-[#2B3145]">
            <BriefcaseMedical size={20} strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 uppercase tracking-wider">
            <TrendingUp size={11} strokeWidth={3} />
            Live
          </span>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Bertugas</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{activeDocs.length}</span>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">/ {todayDoctors.length}</span>
        </div>
        <div className="mt-4 h-1.5 w-full bg-zinc-100 dark:bg-[#1A1E2B] rounded-full overflow-hidden border border-zinc-200 dark:border-[#2B3145]">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${activePercent}%` }} />
        </div>
      </div>

      {/* Stat 2: Cuti */}
      <div className="bg-white dark:bg-[#131620] border border-zinc-200 dark:border-[#232736] hover:border-zinc-300 dark:hover:border-[#353D56] p-5 rounded-[20px] shadow-sm relative overflow-hidden group transition-all duration-200">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 bg-rose-50 text-rose-600 dark:bg-[#1A1E2B] dark:text-rose-400 rounded-[14px] border border-rose-100 dark:border-[#2B3145]">
            <FileClock size={20} strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Cuti</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{onLeaveDocs.length}</span>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">dokter</span>
        </div>
      </div>

      {/* Stat 3: Efisiensi */}
      <div className="bg-white dark:bg-[#131620] border border-zinc-200 dark:border-[#232736] hover:border-zinc-300 dark:hover:border-[#353D56] p-5 rounded-[20px] shadow-sm relative overflow-hidden group transition-all duration-200">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-[#1A1E2B] dark:text-emerald-400 rounded-[14px] border border-emerald-100 dark:border-[#2B3145]">
            <CheckCircle2 size={20} strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 uppercase tracking-wider">
            <TrendingUp size={11} strokeWidth={3} />
            +2.4%
          </span>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Efisiensi</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{efficiency}%</span>
        </div>
      </div>

      {/* Stat 4: Total Shift */}
      <div className="bg-white dark:bg-[#131620] border border-zinc-200 dark:border-[#232736] hover:border-zinc-300 dark:hover:border-[#353D56] p-5 rounded-[20px] shadow-sm relative overflow-hidden group transition-all duration-200">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-[#1A1E2B] dark:text-amber-400 rounded-[14px] border border-amber-100 dark:border-[#2B3145]">
            <BarChart3 size={20} strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Shift Hari Ini</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{todayShiftCount}</span>
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">sesi</span>
        </div>
      </div>
    </div>
  );
}
