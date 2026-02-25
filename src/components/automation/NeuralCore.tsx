"use client";

import { useEffect, useState, useMemo } from "react";
import { BrainCircuit, CheckCircle2, RotateCw, Users, Calendar, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift, Doctor, BroadcastRule } from "@/lib/data-service";

export function NeuralCore() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [broadcasts, setBroadcasts] = useState<BroadcastRule[]>([]);
    const [syncCountdown, setSyncCountdown] = useState(300); // 5 min countdown

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [sRes, dRes, bRes] = await Promise.all([
                    fetch('/api/shifts'),
                    fetch('/api/doctors'),
                    fetch('/api/automation')
                ]);
                setShifts(await sRes.json());
                setDoctors(await dRes.json());
                setBroadcasts(await bRes.json());
                setSyncCountdown(300);
            } catch { /* silent */ }
        };
        fetchAll();
        const iv = setInterval(fetchAll, 30000);
        return () => clearInterval(iv);
    }, []);

    // Countdown timer
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

    const totalShifts = shifts.length;
    const totalDoctors = doctors.length;
    const activeBroadcasts = broadcasts.filter(b => b.active).length;
    const now = new Date();
    const todayDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const todayShifts = shifts.filter(s => s.dayIdx === todayDayIdx).length;

    // Efficiency mock (based on coverage)
    const efficiency = totalDoctors > 0 ? Math.min(Math.round((totalShifts / (totalDoctors * 1.5)) * 100), 100) : 0;
    const circumference = 2 * Math.PI * 60;
    const dashOffset = circumference - (efficiency / 100) * circumference;

    return (
        <div className="rounded-2xl border[0.06] bg-slate-950/40 p-6 backdrop-blur-xl relative overflow-hidden group">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 h-48 w-48 bg-blue-500/5 blur-3xl -z-10 group-hover:bg-blue-500/10 transition-all duration-700" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BrainCircuit className="text-white h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">System Overview</h3>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Real-time Engine Status</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border-500/20 px-2.5 py-1 rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-400 tracking-wider">ONLINE</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-2 gap-5">
                {/* Circular Progress */}
                <div className="relative flex items-center justify-center h-44">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                        <circle
                            cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="6" fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            className="text-blue-500 transition-all duration-1000"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white">{efficiency}%</span>
                        <span className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">Efficiency</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="space-y-3">
                    <div className="bg-white/[0.02] rounded-xl p-3 border[0.04]">
                        <div className="flex items-center gap-2 mb-1">
                            <Users size={10} className="text-blue-400" />
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Doctors</p>
                        </div>
                        <span className="text-lg font-bold text-white">{totalDoctors}</span>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border[0.04]">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar size={10} className="text-violet-400" />
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Shifts</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-white">{totalShifts}</span>
                            <span className="text-[10px] text-slate-500">{todayShifts} today</span>
                        </div>
                    </div>
                    <div className="bg-blue-500/[0.05] rounded-xl p-3 border-500/10">
                        <div className="flex items-center gap-2 mb-1">
                            <RotateCw size={10} className="text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
                            <p className="text-[9px] text-blue-300 uppercase font-bold tracking-wider">Next Sync</p>
                        </div>
                        <span className="text-lg font-mono font-bold text-white">{formatCountdown(syncCountdown)}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Status Indicators */}
            <div className="flex items-center gap-5 mt-5 pt-4[0.04]">
                {[
                    { label: "Scheduling", ok: true },
                    { label: "Broadcasting", ok: activeBroadcasts > 0 },
                    { label: "Data Sync", ok: true },
                ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            s.ok ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-amber-500 shadow-[0_0_6px_#f59e0b]"
                        )} />
                        <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
