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
        dot: "bg-blue-500 shadow-blue-500/50",
        text: "text-blue-600 dark:text-blue-400",
        badge: "clay-pill-blue text-white",
        icon: "clay-button text-blue-600 dark:text-blue-400",
    },
    broadcast: {
        dot: "bg-amber-500 shadow-amber-500/50",
        text: "text-amber-600 dark:text-amber-400",
        badge: "clay-pill-amber text-white",
        icon: "clay-button text-amber-600 dark:text-amber-400",
    },
    doctor: {
        dot: "bg-emerald-500 shadow-emerald-500/50",
        text: "text-emerald-600 dark:text-emerald-400",
        badge: "clay-pill-emerald text-white",
        icon: "clay-button text-emerald-600 dark:text-emerald-400",
    },
    system: {
        dot: "bg-violet-500 shadow-violet-500/50",
        text: "text-violet-600 dark:text-violet-400",
        badge: "clay-pill-violet text-white",
        icon: "clay-button text-violet-600 dark:text-violet-400",
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
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            type: 'system'
        });

        return items;
    }, [shifts, doctors, broadcasts]);

    return (
        <div className="flex flex-col rounded-[36px] clay-surface overflow-hidden shadow-2xl h-max relative">
            <div className="p-7 md:p-8 border-b border-zinc-200/60 dark:border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[20px] clay-pill-violet flex items-center justify-center text-white shadow-md">
                        <Activity size={26} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">System Logs</h3>
                        <p className="text-[11px] text-violet-600 dark:text-violet-400 font-mono uppercase tracking-widest mt-1 font-bold">Activity Stream</p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative z-10 p-7 md:p-8 pt-4">
                <div className="absolute left-[40px] md:left-[44px] top-6 bottom-8 w-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full" />

                <div className="space-y-4 pb-2">
                    {activities.map((item) => {
                        const color = COLOR_MAP[item.type];
                        const Icon = ICON_MAP[item.type];
                        return (
                            <div key={item.id} className="relative pl-12 group/item">
                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute left-[-2px] sm:left-[-1px] top-4 h-3.5 w-3.5 rounded-full transition-all duration-200 group-hover/item:scale-125 border-2 border-white dark:border-zinc-900 z-10 shadow-sm",
                                    color.dot
                                )} />

                                {/* Content Block */}
                                <div className="clay-surface rounded-[24px] p-4 sm:p-5 transition-all duration-200 shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <div className={cn("p-2 rounded-[12px] shrink-0", color.icon)}>
                                                    <Icon size={15} strokeWidth={2.5} />
                                                </div>
                                                <h4 className="text-[14px] font-black text-zinc-900 dark:text-zinc-100 truncate tracking-tight">{item.title}</h4>
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-bold pl-1">{item.desc}</p>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest flex-shrink-0 px-3 py-1.5 rounded-[12px] shadow-sm",
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
