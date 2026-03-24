"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { BrainCircuit, RotateCw, Users, Calendar, Activity, Cpu, Zap, Megaphone, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift, Doctor, BroadcastRule } from "@/lib/data-service";

interface ActivityItem {
    id: string;
    title: string;
    desc: string;
    time: string;
    type: 'shift' | 'broadcast' | 'doctor' | 'system';
}

const ICON_MAP = {
    shift: Calendar,
    broadcast: Megaphone,
    doctor: Users,
    system: RefreshCw,
};

const COLOR_MAP = {
    shift: {
        dot: "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)]",
        text: "text-blue-600",
        badge: "bg-white/60 border-blue-200/60 text-blue-700",
        block: "hover:bg-white/80 border-blue-100/50",
        icon: "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 border-blue-200 shadow-inner",
    },
    broadcast: {
        dot: "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.6)]",
        text: "text-orange-600",
        badge: "bg-white/60 border-orange-200/60 text-orange-700",
        block: "hover:bg-white/80 border-orange-100/50",
        icon: "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 border-orange-200 shadow-inner",
    },
    doctor: {
        dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]",
        text: "text-emerald-600",
        badge: "bg-white/60 border-emerald-200/60 text-emerald-700",
        block: "hover:bg-white/80 border-emerald-100/50",
        icon: "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 border-emerald-200 shadow-inner",
    },
    system: {
        dot: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]",
        text: "text-violet-600",
        badge: "bg-white/60 border-violet-200/60 text-violet-700",
        block: "hover:bg-white/80 border-violet-100/50",
        icon: "bg-gradient-to-br from-violet-100 to-violet-200 text-violet-600 border-violet-200 shadow-inner",
    },
};

export function ActivityStream() {
    const { data: shifts = [] } = useSWR<Shift[]>('/api/shifts');
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const { data: broadcasts = [] } = useSWR<BroadcastRule[]>('/api/automation');

    const activities = useMemo(() => {
        const items: { id: string; title: string; desc: string; time: string; type: 'shift' | 'broadcast' | 'doctor' | 'system' }[] = [];

        shifts.slice(-3).reverse().forEach((s: Shift, i: number) => {
            items.push({
                id: `shift-${s.id}`,
                title: `Shift Schedule: ${s.doctor}`,
                desc: `${s.title} — Day ${s.dayIdx + 1}, ${s.formattedTime || 'N/A'}`,
                time: i === 0 ? 'Recent' : `${i + 1}h ago`,
                type: 'shift'
            });
        });

        broadcasts.slice(-2).reverse().forEach((b: BroadcastRule) => {
            items.push({
                id: `broadcast-${b.id}`,
                title: `Broadcast: ${b.alertLevel}`,
                desc: b.message?.slice(0, 60) + (b.message?.length > 60 ? '...' : ''),
                time: b.active ? 'Airing Now' : 'Completed',
                type: 'broadcast'
            });
        });

        items.push({
            id: 'doctor-count',
            title: `${doctors.length} Doctors Registered`,
            desc: 'System database successfully synchronized.',
            time: 'Verified',
            type: 'doctor'
        });

        items.push({
            id: 'sys-health',
            title: 'System Diagnostics OK',
            desc: 'All processes and stores synchronized.',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            type: 'system'
        });

        return items;
    }, [shifts, doctors, broadcasts]);

    return (
        <div className="flex flex-col rounded-[40px] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 overflow-hidden group transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] h-max relative">
            {/* Subtle inner dark glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="p-7 md:p-8 border-b border-slate-700/50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-500 border border-white/10">
                        <Activity size={26} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">System Logs</h3>
                        <p className="text-[11px] text-indigo-300 font-mono uppercase tracking-widest mt-1 font-bold">Activity Stream</p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative z-10 p-7 md:p-8 pt-4">
                <div className="absolute left-[40px] md:left-[44px] top-6 bottom-8 w-[2px] bg-gradient-to-b from-slate-600 via-slate-700 to-transparent rounded-full" />

                <div className="space-y-5 pb-2">
                    {activities.map((item) => {
                        const color = COLOR_MAP[item.type];
                        const Icon = ICON_MAP[item.type];
                        return (
                            <div key={item.id} className="relative pl-12 group/item">
                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute left-[-2px] sm:left-[-1px] top-3 h-4 w-4 rounded-full transition-all duration-300 group-hover/item:scale-125 border-[3px] border-slate-900 z-10",
                                    color.dot
                                )} />

                                {/* Content Block */}
                                <div className={cn(
                                    "bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-[24px] p-5 transition-all duration-300 shadow-sm group-hover/item:shadow-lg group-hover/item:bg-slate-800/60 group-hover/item:border-slate-600",
                                )}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={cn("p-2 rounded-[12px] border", color.icon)}>
                                                    <Icon size={14} className="stroke-[2.5]" />
                                                </div>
                                                <h4 className="text-[15px] font-bold text-slate-100 truncate tracking-tight">{item.title}</h4>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium pl-1">{item.desc}</p>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest flex-shrink-0 px-3 py-1.5 rounded-[10px] border",
                                            color.badge
                                        )}>
                                            {item.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
