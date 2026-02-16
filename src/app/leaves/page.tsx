"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { LeaveCalendar } from "@/components/leaves/LeaveCalendar";
import { Search, Bell, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LeaveRequest } from "@/lib/data-service";

export default function LeavesPage() {
    const { data: leaves = [] } = useSWR<LeaveRequest[]>('/api/leaves');
    const [searchQuery, setSearchQuery] = useState("");

    // Stats Calculation
    const totalLeaves = leaves.length;
    const pendingApproval = leaves.filter(l => l.status === 'Pending').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const onLeaveToday = leaves.filter(l => {
        // Simple string check for now since format is "YYYY-MM-DD" or "YYYY-MM-DD - YYYY-MM-DD"
        // In a real app, use the same isDateInLeave logic from Calendar or a shared helper
        // For dashboard quick stats, we can just check if any leave covers today
        return isDateInLeave(today, l.dates);
    }).length;

    // Helper reused from Calendar (ideally move to utils)
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

    return (
        <div className="flex h-full flex-col">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-baseline gap-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight">Leave Schedule</h1>
                    <span className="text-slate-500 text-lg font-light">Doctor Availability</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search doctor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900/50 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 placeholder:text-slate-600"
                        />
                    </div>

                    <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                        <Filter className="h-6 w-6" />
                    </button>

                    <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white">Dr. Admin</p>
                            <p className="text-xs text-blue-400">Super Admin</p>
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-slate-800">
                            <AvatarImage src="/avatars/admin.png" />
                            <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-cyan-400 text-white font-bold">DA</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>

            <div className="flex-1 min-h-0 bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-800/50 p-6 flex flex-col shadow-2xl">
                <div className="mb-6 flex gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl flex-1 backdrop-blur-sm">
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Total Leaves</p>
                        <p className="text-2xl font-bold text-white">{totalLeaves}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl flex-1 backdrop-blur-sm">
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Approval</p>
                        <p className="text-2xl font-bold text-white">{pendingApproval}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl flex-1 backdrop-blur-sm">
                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">On Leave Today</p>
                        <p className="text-2xl font-bold text-white">{onLeaveToday}</p>
                    </div>
                </div>

                <LeaveCalendar leaves={leaves} onRefresh={() => mutate('/api/leaves')} />
            </div>
        </div>
    );
}
