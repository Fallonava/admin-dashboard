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
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gradient pb-1">Schedules</h1>
                    <span className="text-muted-foreground text-sm font-medium">Weekly Overview</span>
                </div>

                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search doctor or shift..."
                                className="bg-white/40 backdrop-blur-xl rounded-2xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-blue-500/50 outline-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_10px_-3px_rgba(0,0,0,0.02)] focus:bg-white/60 w-72 placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <button className="relative p-2.5 bg-white/40 backdrop-blur-xl rounded-2xl text-muted-foreground hover:text-foreground hover:bg-white/60 hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] transition-all group shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                        <Bell className="h-5 w-5 group-hover:animate-wiggle" />
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                    </button>

                    <div className="flex items-center gap-3 pl-5">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-foreground">Dr. Admin</p>
                            <p className="text-[11px] text-primary font-semibold">Super Admin</p>
                        </div>
                        <Avatar className="h-10 w-10 shadow-sm hover:scale-105 transition-transform duration-300">
                            <AvatarImage src="/avatars/admin.png" />
                            <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-cyan-400 text-xs font-bold text-white shadow-inner" />
                        </Avatar>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 min-h-0 gap-6">
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                    {/* Calendar Strip (Premium Glass) */}
                    <div className="mb-6 super-glass rounded-3xl p-4 flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mr-2 shadow-inner">
                            <CalendarIcon size={24} className="mb-1" />
                            <span className="text-[10px] font-extrabold uppercase tracking-widest">{selectedDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                        </div>

                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }} className="p-2 hover:bg-black/[0.03] rounded-xl text-muted-foreground hover:text-foreground transition-colors">
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
                                            "flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl transition-all duration-300 min-w-[60px]",
                                            isSelected ? "btn-gradient shadow-[0_4px_14px_0_rgba(0,92,255,0.39)] text-white scale-105"
                                                : "hover:bg-black/[0.03] text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isSelected ? "text-blue-100" : (isToday ? "text-primary" : "text-muted-foreground/80"))}>
                                            {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                                        </span>
                                        <span className={cn("text-lg font-extrabold", isSelected ? "text-white" : "text-foreground")}>
                                            {date.getDate()}
                                        </span>
                                        {isToday && !isSelected && <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shadow-sm" />}
                                    </button>
                                );
                            })}
                        </div>

                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }} className="p-2 hover:bg-black/[0.03] rounded-xl text-muted-foreground hover:text-foreground transition-colors">
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
