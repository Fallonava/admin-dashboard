"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { LeaveCalendar } from "@/components/leaves/LeaveCalendar";
import { Search, CalendarDays, UserCheck, Clock3 } from "lucide-react";
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
        <div className="max-w-7xl mx-auto h-full flex flex-col">

            {/* ═══ HEADER ═══ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Jadwal <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Cuti</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium mt-1">Kelola dan pantau jadwal cuti seluruh dokter</p>
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
            </div>

            {/* ═══ STATS CARDS ═══ */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center`}>
                                <Icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                                <p className="text-xs font-semibold text-slate-400 mt-0.5">{stat.label}</p>
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
