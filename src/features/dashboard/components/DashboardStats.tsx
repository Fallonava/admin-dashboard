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
      <div className="bg-[#131620] border border-[#232736] hover:border-[#353D56] p-5 rounded-[20px] shadow-sm relative overflow-hidden group transition-all duration-300">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 bg-[#1A1E2B] text-blue-400 rounded-[14px] border border-[#2B3145]">
            <BriefcaseMedical size={20} strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/50 uppercase tracking-wider">
            <TrendingUp size={11} strokeWidth={3} />
            Live
          </span>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Bertugas</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-100 tracking-tight">{activeDocs.length}</span>
          <span className="text-xs font-semibold text-zinc-500">/ {todayDoctors.length}</span>
        </div>
        <div className="mt-4 h-1.5 w-full bg-[#1A1E2B] rounded-full overflow-hidden border border-[#2B3145]">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${activePercent}%` }} />
        </div>
      </div>

      {/* Stat 2: Cuti */}
      <div className="bg-[#131620] border border-[#232736] hover:border-[#353D56] p-5 rounded-[20px] shadow-sm relative overflow-hidden group transition-all duration-300">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 bg-[#1A1E2B] text-rose-400 rounded-[14px] border border-[#2B3145]">
            <FileClock size={20} strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cuti</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-100 tracking-tight">{onLeaveDocs.length}</span>
          <span className="text-xs font-semibold text-zinc-500">dokter</span>
        </div>
      </div>

      {/* Stat 3: Efisiensi */}
      <div className="bg-[#131620] border border-[#232736] hover:border-[#353D56] p-5 rounded-[20px] shadow-sm relative overflow-hidden group transition-all duration-300">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 bg-[#1A1E2B] text-emerald-400 rounded-[14px] border border-[#2B3145]">
            <CheckCircle2 size={20} strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/50 uppercase tracking-wider">
            <TrendingUp size={11} strokeWidth={3} />
            +2.4%
          </span>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Efisiensi</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-100 tracking-tight">{efficiency}%</span>
        </div>
      </div>

      {/* Stat 4: Total Shift */}
      <div className="bg-[#131620] border border-[#232736] hover:border-[#353D56] p-5 rounded-[20px] shadow-sm relative overflow-hidden group transition-all duration-300">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 bg-[#1A1E2B] text-amber-400 rounded-[14px] border border-[#2B3145]">
            <BarChart3 size={20} strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Shift Hari Ini</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-100 tracking-tight">{todayShiftCount}</span>
          <span className="text-xs font-semibold text-zinc-500">sesi</span>
        </div>
      </div>
    </div>
  );
}
