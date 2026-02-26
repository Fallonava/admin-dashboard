"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { LeaveCalendar } from "@/components/leaves/LeaveCalendar";
import { Search, CalendarDays, UserCheck, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/lib/data-service";

export default function LeavesPage() {
    const { data: leaves = [] } = useSWR<LeaveRequest[]>('/api/leaves');
    const [searchQuery, setSearchQuery] = useState("");

    const totalLeaves = leaves.length;

    function isDateInLeave(checkDate: Date, leaveDates: string) {
        const target = new Date(checkDate);
        target.setHours(0, 0, 0, 0);
        try {
            if (leaveDates.includes(' - ')) {
                const [startStr, endStr] = leaveDates.split(' - ');
                const start = new Date(startStr);
                const end = new Date(endStr);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                return target >= start && target <= end;
            }
            const d = new Date(leaveDates);
            return !isNaN(d.getTime()) && d.setHours(0, 0, 0, 0) === target.getTime();
        } catch { return false; }
    }

    const now = new Date();
    const onLeaveToday = leaves.filter(l => isDateInLeave(now, l.dates)).length;

    // Cuti bulan ini
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const cutiBuilanIni = leaves.filter(l => {
        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            if (isDateInLeave(new Date(d), l.dates)) return true;
        }
        return false;
    }).length;

    const stats = [
        {
            label: "Total Data Cuti",
            value: totalLeaves,
            icon: CalendarDays,
            color: "text-blue-600",
            bg: "bg-blue-50",
            iconBg: "bg-blue-100",
        },
        {
            label: "Cuti Hari Ini",
            value: onLeaveToday,
            icon: UserCheck,
            color: "text-amber-600",
            bg: "bg-amber-50",
            iconBg: "bg-amber-100",
        },
        {
            label: "Cuti Bulan Ini",
            value: cutiBuilanIni,
            icon: Clock3,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            iconBg: "bg-emerald-100",
        },
    ];

    return (
        <div className="w-full h-full flex flex-col px-2 lg:px-4">

            {/* ═══ HEADER ═══ */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 gap-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-[0_4px_14px_0_rgba(16,185,129,0.3)] text-white flex-shrink-0">
                        <CalendarDays size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
                            Jadwal <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Cuti</span>
                        </h1>
                        <p className="text-xs lg:text-sm text-slate-400 font-medium mt-0.5">Kelola dan pantau jadwal cuti seluruh dokter</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Cari dokter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-slate-700 outline-none shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                    />
                </div>
            </header>

            {/* ═══ STATS CARDS ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="super-glass-card p-6 rounded-[32px] flex items-center gap-5 transition-all duration-500 hover:-translate-y-1"
                        >
                            <div className={cn("flex-shrink-0 w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner", stat.iconBg)}>
                                <Icon className={cn("h-8 w-8", stat.color)} />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ CALENDAR CONTENT ═══ */}
            <div className="flex-1 min-h-0">
                <LeaveCalendar
                    leaves={leaves.filter(l =>
                        searchQuery === "" ||
                        l.doctor.toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    onRefresh={() => mutate('/api/leaves')}
                />
            </div>
        </div>
    );
}
