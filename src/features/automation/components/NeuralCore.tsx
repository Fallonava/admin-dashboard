"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { BrainCircuit, RotateCw, Users, Calendar, Activity, Cpu, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift, Doctor, BroadcastRule } from "@/lib/data-service";
import { useSocket } from "@/hooks/use-socket";

export function NeuralCore() {
    const { data: shifts = [] } = useSWR<Shift[]>('/api/shifts');
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const { data: broadcasts = [] } = useSWR<BroadcastRule[]>('/api/automation');
    const { lastUpdate } = useSocket();

    const formatLastUpdate = (ts: number | null) => {
        if (!ts) return "SYNC PENDING";
        const d = new Date(ts);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
        <div className="relative flex flex-col rounded-[36px] clay-surface p-7 md:p-8 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex gap-4 items-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-[24px] clay-pill-violet shadow-lg text-white">
                        <BrainCircuit className="text-white h-8 w-8" />
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-[3px] border-white dark:border-zinc-900 animate-pulse shadow-md" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Neural Engine</h3>
                        <p className="text-[11px] text-violet-600 dark:text-violet-400 font-mono uppercase tracking-widest mt-1 flex items-center gap-1.5 font-bold">
                            <Cpu size={12} className="text-violet-500" /> Core Process
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 clay-pill-emerald text-white px-3.5 py-1.5 rounded-full shadow-sm mt-1">
                    <Activity className="h-3.5 w-3.5 text-white animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Monitoring</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {/* Circular Progress */}
                <div className="relative flex flex-col items-center justify-center clay-inset rounded-[30px] p-6">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-200 dark:text-zinc-800" strokeLinecap="round" />
                            <circle
                                cx="80" cy="80" r="60" stroke="url(#gradient)" strokeWidth="12" fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                className="transition-all duration-[1500ms] ease-out"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="100%" stopColor="#A855F7" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">{efficiency}</span>
                                <span className="text-2xl font-black text-violet-500">%</span>
                            </div>
                        </div>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-[0.2em] mt-3">Efficiency Rated</span>
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-4">
                    {/* Doctors Card */}
                    <div className="clay-surface rounded-[26px] p-5 relative overflow-hidden flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2.5 mb-2 relative z-10">
                            <div className="p-2 rounded-[12px] clay-button text-blue-600 dark:text-blue-400">
                                <Users size={16} />
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-widest">Active Doctors</p>
                        </div>
                        <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100 relative z-10 tracking-tight">{totalDoctors}</span>
                    </div>

                    {/* Shifts Card */}
                    <div className="clay-surface rounded-[26px] p-5 relative overflow-hidden flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2.5 mb-2 relative z-10">
                            <div className="p-2 rounded-[12px] clay-button text-violet-600 dark:text-violet-400">
                                <Calendar size={16} />
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-widest">Total Shifts</p>
                        </div>
                        <div className="flex items-baseline gap-3 relative z-10">
                            <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{totalShifts}</span>
                            <span className="text-[11px] font-black text-white clay-pill-emerald px-3 py-1 rounded-[10px] uppercase tracking-wider shadow-sm">
                                {todayShifts} Today
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Status Panel */}
            <div className="mt-8 pt-6 border-t border-zinc-200/60 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
                <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {[
                        { label: "Scheduling Engine", ok: true },
                        { label: "Broadcast Service", ok: activeBroadcasts > 0 },
                        { label: "Data Pipeline", ok: true },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2 whitespace-nowrap clay-button px-3.5 py-2 rounded-full">
                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                s.ok ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"
                            )} />
                            <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-extrabold">{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 clay-inset px-4 py-2.5 rounded-[18px] shrink-0">
                    <Radio size={16} className="text-violet-500 animate-pulse" />
                    <div className="flex flex-col relative z-10">
                        <span className="text-[9px] text-violet-500 uppercase font-black tracking-[0.2em] leading-none mb-1">Stream: LIVE</span>
                        <span className="text-sm font-mono font-black text-zinc-800 dark:text-zinc-200 leading-none tracking-tight">{formatLastUpdate(lastUpdate)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
