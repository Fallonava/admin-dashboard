"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { BrainCircuit, RotateCw, Users, Calendar, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift, Doctor, BroadcastRule } from "@/lib/data-service";

export function NeuralCore() {
    const { data: shifts = [] } = useSWR<Shift[]>('/api/shifts');
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const { data: broadcasts = [] } = useSWR<BroadcastRule[]>('/api/automation');
    const [syncCountdown, setSyncCountdown] = useState(300);

    useEffect(() => {
        const iv = setInterval(() => {
            setSyncCountdown(prev => (prev <= 0 ? 300 : prev - 1));
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    const formatCountdown = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const { totalShifts, totalDoctors, activeBroadcasts, todayShifts, efficiency, circumference, dashOffset } = useMemo(() => {
        const totalShifts = shifts.length;
        const totalDoctors = doctors.length;
        const activeBroadcasts = broadcasts.filter(b => b.active).length;
        const now = new Date();
        const todayDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const todayShifts = shifts.filter(s => s.dayIdx === todayDayIdx).length;
        const efficiency = totalDoctors > 0 ? Math.min(Math.round((totalShifts / (totalDoctors * 1.5)) * 100), 100) : 0;
        const circumference = 2 * Math.PI * 60;
        const dashOffset = circumference - (efficiency / 100) * circumference;
        return { totalShifts, totalDoctors, activeBroadcasts, todayShifts, efficiency, circumference, dashOffset };
    }, [shifts, doctors, broadcasts]);

    return (
        <div className="relative flex flex-col rounded-[40px] border border-white/60 bg-white/40 backdrop-blur-2xl p-7 md:p-8 overflow-hidden group shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_8px_50px_rgba(0,0,0,0.08)] hover:bg-white/60 hover:border-white/80">
            {/* Soft ambient light glows */}
            <div className="absolute top-0 right-0 h-56 w-56 bg-gradient-to-br from-indigo-300/30 to-purple-300/30 blur-[60px] -z-10 pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-out" />
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-gradient-to-tr from-cyan-300/20 to-blue-300/20 blur-[50px] -z-10 pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-out" />

            {/* Header */}
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex gap-4 items-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-300/40 group-hover:shadow-indigo-400/60 transition-all duration-500 group-hover:scale-105">
                        <div className="absolute inset-0 rounded-[22px] border border-white/40 mix-blend-overlay" />
                        <BrainCircuit className="text-white h-8 w-8" />
                        <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-400 border-[3px] border-white animate-pulse shadow-md" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Neural Engine</h3>
                        <p className="text-[11px] text-indigo-600/80 font-mono uppercase tracking-widest mt-1 flex items-center gap-1.5 font-bold">
                            <Cpu size={12} className="text-indigo-500" /> Core Process
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 px-3.5 py-1.5 rounded-full shadow-sm mt-1">
                    <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-700 tracking-widest uppercase">Monitoring</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {/* Circular Progress */}
                <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-white/80 to-slate-50/50 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                            <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" strokeLinecap="round" />
                            <circle
                                cx="80" cy="80" r="60" stroke="url(#gradient)" strokeWidth="12" fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                className="transition-all duration-[1500ms] ease-out drop-shadow-md"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#4F46E5" />
                                    <stop offset="100%" stopColor="#D946EF" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-800 tracking-tighter">{efficiency}</span>
                                <span className="text-2xl font-bold text-indigo-500">%</span>
                            </div>
                        </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Efficiency Rated</span>
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-4">
                    {/* Doctors Card */}
                    <div className="group/stat bg-gradient-to-br from-indigo-50/80 to-blue-50/50 backdrop-blur-md hover:from-indigo-100/80 hover:to-blue-100/60 rounded-[28px] p-5 border border-indigo-100/60 transition-all duration-300 relative overflow-hidden flex-1 flex flex-col justify-center shadow-sm">
                        <div className="absolute -right-4 -top-4 text-indigo-200/50 group-hover/stat:scale-110 group-hover/stat:rotate-12 transition-all duration-500">
                            <Users size={80} strokeWidth={1} />
                        </div>
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <div className="p-2 rounded-[12px] bg-indigo-200/50 text-indigo-700 shadow-inner">
                                <Users size={14} />
                            </div>
                            <p className="text-[11px] text-indigo-700 uppercase font-black tracking-widest">Active Doctors</p>
                        </div>
                        <span className="text-4xl font-black text-indigo-900 relative z-10 tracking-tight">{totalDoctors}</span>
                    </div>

                    {/* Shifts Card */}
                    <div className="group/stat bg-gradient-to-br from-fuchsia-50/80 to-purple-50/50 backdrop-blur-md hover:from-fuchsia-100/80 hover:to-purple-100/60 rounded-[28px] p-5 border border-fuchsia-100/60 transition-all duration-300 relative overflow-hidden flex-1 flex flex-col justify-center shadow-sm">
                        <div className="absolute -right-4 -top-4 text-fuchsia-200/50 group-hover/stat:scale-110 group-hover/stat:rotate-12 transition-all duration-500">
                            <Calendar size={80} strokeWidth={1} />
                        </div>
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <div className="p-2 rounded-[12px] bg-fuchsia-200/50 text-fuchsia-700 shadow-inner">
                                <Calendar size={14} />
                            </div>
                            <p className="text-[11px] text-fuchsia-700 uppercase font-black tracking-widest">Total Shifts</p>
                        </div>
                        <div className="flex items-baseline gap-3 relative z-10">
                            <span className="text-4xl font-black text-fuchsia-900 tracking-tight">{totalShifts}</span>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-[10px] border border-emerald-200 uppercase tracking-wider backdrop-blur-md shadow-sm">
                                {todayShifts} Today
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Status Panel */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {[
                        { label: "Scheduling Engine", ok: true },
                        { label: "Broadcast Service", ok: activeBroadcasts > 0 },
                        { label: "Data Pipeline", ok: true },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2 whitespace-nowrap bg-white/60 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/80 shadow-sm hover:shadow-md transition-shadow">
                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                s.ok ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse"
                            )} />
                            <span className="text-[11px] text-slate-700 font-bold">{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 bg-indigo-50/80 backdrop-blur-md border border-indigo-200/60 px-5 py-2.5 rounded-2xl shrink-0 shadow-sm">
                    <RotateCw size={16} className="text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-indigo-500 uppercase font-black tracking-[0.2em] leading-none mb-1.5">Next Sync</span>
                        <span className="text-sm font-mono font-bold text-indigo-800 leading-none">{formatCountdown(syncCountdown)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
