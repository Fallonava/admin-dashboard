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
  const activeDocs = useMemo(() => todayDoctors.filter(d => d.status === 'BUKA' || d.status === 'PENUH'), [todayDoctors]);
  const onLeaveDocs = useMemo(() => todayDoctors.filter(d => d.status === 'CUTI'), [todayDoctors]);
  const todayShiftCount = useMemo(() => shifts.filter(s => s.dayIdx === todayDayIdx).length, [shifts, todayDayIdx]);
  const activePercent = todayDoctors.length > 0 ? (activeDocs.length / todayDoctors.length) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
      {/* Stat 1: Dokter Bertugas */}
      <div className="super-glass-card bg-white/40 backdrop-blur-3xl p-5 sm:p-6 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_60px_-12px_rgba(59,130,246,0.15)] relative overflow-hidden group border border-white/60 hover:border-white/80 hover:bg-white/50 hover:-translate-y-1 transition-all duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-[40px] -mr-8 -mt-8 group-hover:bg-blue-400/30 group-hover:scale-110 transition-all duration-700 ease-out" />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-3 bg-white/60 text-blue-600 rounded-[20px] shadow-sm border border-white/80 backdrop-blur-md">
            <BriefcaseMedical size={22} strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black text-emerald-600 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-[12px] border border-white shadow-sm ring-1 ring-emerald-500/10 uppercase tracking-widest hover:scale-105 transition-transform">
            <TrendingUp size={12} strokeWidth={3} />
            Live
          </span>
        </div>
        <h3 className="text-[11.5px] font-black text-slate-500/90 uppercase tracking-[0.2em] mb-1.5 relative z-10 transition-colors group-hover:text-blue-500">Bertugas</h3>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{activeDocs.length}</span>
          <span className="text-[13px] font-bold text-slate-400">/ {todayDoctors.length}</span>
        </div>
        <div className="mt-5 h-2 w-full bg-white/50 rounded-full overflow-hidden relative z-10 shadow-inner border border-black/5">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" style={{ width: `${activePercent}%` }} />
        </div>
      </div>

      {/* Stat 2: Cuti */}
      <div className="super-glass-card bg-white/40 backdrop-blur-3xl p-5 sm:p-6 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_60px_-12px_rgba(139,92,246,0.15)] relative overflow-hidden group border border-white/60 hover:border-white/80 hover:bg-white/50 hover:-translate-y-1 transition-all duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/20 rounded-full blur-[40px] -mr-8 -mt-8 group-hover:bg-violet-400/30 group-hover:scale-110 transition-all duration-700 ease-out" />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-3 bg-white/60 text-violet-600 rounded-[20px] shadow-sm border border-white/80 backdrop-blur-md">
            <FileClock size={22} strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-[11.5px] font-black text-slate-500/90 uppercase tracking-[0.2em] mb-1.5 relative z-10 transition-colors group-hover:text-violet-500">Cuti</h3>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{onLeaveDocs.length}</span>
          <span className="text-[13px] font-bold text-slate-400">dokter</span>
        </div>
      </div>

      {/* Stat 3: Efisiensi */}
      <div className="super-glass-card bg-white/40 backdrop-blur-3xl p-5 sm:p-6 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_60px_-12px_rgba(16,185,129,0.15)] relative overflow-hidden group border border-white/60 hover:border-white/80 hover:bg-white/50 hover:-translate-y-1 transition-all duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-[40px] -mr-8 -mt-8 group-hover:bg-emerald-400/30 group-hover:scale-110 transition-all duration-700 ease-out" />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-3 bg-white/60 text-emerald-600 rounded-[20px] shadow-sm border border-white/80 backdrop-blur-md">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black text-emerald-600 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-[12px] border border-white shadow-sm ring-1 ring-emerald-500/10 uppercase tracking-widest hover:scale-105 transition-transform">
            <TrendingUp size={12} strokeWidth={3} />
            +2.4%
          </span>
        </div>
        <h3 className="text-[11.5px] font-black text-slate-500/90 uppercase tracking-[0.2em] mb-1.5 relative z-10 transition-colors group-hover:text-emerald-500">Efisiensi</h3>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{efficiency}%</span>
        </div>
      </div>

      {/* Stat 4: Total Shift */}
      <div className="super-glass-card bg-white/40 backdrop-blur-3xl p-5 sm:p-6 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_60px_-12px_rgba(245,158,11,0.15)] relative overflow-hidden group border border-white/60 hover:border-white/80 hover:bg-white/50 hover:-translate-y-1 transition-all duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full blur-[40px] -mr-8 -mt-8 group-hover:bg-amber-400/30 group-hover:scale-110 transition-all duration-700 ease-out" />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-3 bg-white/60 text-amber-500 rounded-[20px] shadow-sm border border-white/80 backdrop-blur-md">
            <BarChart3 size={22} strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-[11.5px] font-black text-slate-500/90 uppercase tracking-[0.2em] mb-1.5 relative z-10 transition-colors group-hover:text-amber-500">Shift Hari Ini</h3>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{todayShiftCount}</span>
          <span className="text-[13px] font-bold text-slate-400">sesi</span>
        </div>
      </div>
    </div>
  );
}
