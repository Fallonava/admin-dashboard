"use client";

import { useState } from "react";
import { RealtimeCalendar } from "@/components/schedules/RealtimeCalendar";
import { UpcomingShifts } from "@/components/schedules/UpcomingShifts";
import { Bell, Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function SchedulesPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Generate 14 days around selected date for the strip
    const stripDays = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(selectedDate);
        d.setDate(selectedDate.getDate() - 3 + i);
        return d;
    });

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Schedules</h1>
                    <span className="text-slate-500 text-sm font-medium">Weekly Overview</span>
                </div>

                <div className="flex items-center gap-5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search doctor or shift..."
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 w-72 placeholder:text-slate-600"
                        />
                    </div>

                    <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 border-2 border-slate-950"></span>
                    </button>

                    <div className="flex items-center gap-3 pl-5 border-l border-white/[0.06]">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white">Dr. Admin</p>
                            <p className="text-[11px] text-blue-400 font-medium">Super Admin</p>
                        </div>
                        <Avatar className="h-9 w-9 border-2 border-white/10">
                            <AvatarImage src="/avatars/admin.png" />
                            <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-cyan-400 text-xs font-bold" />
                        </Avatar>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden pr-6">

                    {/* Calendar Strip (Replaces StatsCards) */}
                    <div className="mb-6 bg-slate-950/40 border border-white/[0.05] rounded-2xl p-4 backdrop-blur-xl flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center p-3 bg-blue-500/10 text-blue-400 rounded-xl mr-2">
                            <CalendarIcon size={24} className="mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{selectedDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                        </div>

                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }} className="p-2 hover:bg-white/[0.05] rounded-lg text-slate-400 transition-colors">
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex-1 flex justify-between gap-2 overflow-hidden">
                            {stripDays.slice(0, 9).map((date, i) => {
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        className={cn(
                                            "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px]",
                                            isSelected ? "bg-blue-600 shadow-lg shadow-blue-600/20 text-white scale-105"
                                                : "hover:bg-white/[0.04] text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <span className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", isSelected ? "text-blue-200" : (isToday ? "text-blue-400" : "text-slate-500"))}>
                                            {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                                        </span>
                                        <span className={cn("text-lg font-bold", isSelected ? "text-white" : "text-slate-300")}>
                                            {date.getDate()}
                                        </span>
                                        {isToday && !isSelected && <div className="h-1 w-1 rounded-full bg-blue-500 mt-1" />}
                                    </button>
                                );
                            })}
                        </div>

                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }} className="p-2 hover:bg-white/[0.05] rounded-lg text-slate-400 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <RealtimeCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
                </div>
                <UpcomingShifts />
            </div>
        </div>
    );
}
