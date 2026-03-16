"use client";

import { useState, useMemo } from "react";
import { RealtimeCalendar } from "@/components/schedules/RealtimeCalendar";
import { UpcomingShifts } from "@/components/schedules/UpcomingShifts";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SchedulesPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Generate 14 days around selected date for the strip
    const stripDays = useMemo(() => {
        return Array.from({ length: 14 }, (_, i) => {
            const d = new Date(selectedDate);
            d.setDate(selectedDate.getDate() - 3 + i);
            return d;
        });
    }, [selectedDate]);

    return (
        <div className="w-full h-full flex flex-col overflow-hidden -mx-4 lg:-mx-6 -mt-2 lg:-mt-6">
            <PageHeader
              icon={<CalendarDays size={20} className="text-white" />}
              title="Jadwal Dokter"
              accentWord="Dokter"
              accentColor="text-blue-600"
              subtitle="Kelola jadwal mingguan dan shift dokter"
              iconGradient="from-blue-500 to-indigo-600"
              accentBarGradient="from-blue-500 via-indigo-500 to-violet-500"
            />

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden pb-6 lg:pb-0 custom-scrollbar pr-1 lg:pr-0">
                <div className="flex-none lg:flex-1 w-full flex flex-col min-h-[400px] md:min-h-[500px] lg:min-h-0 lg:overflow-hidden">

                    {/* Calendar Strip (Premium Glass) */}
                    <div className="mb-4 lg:mb-6 super-glass-card rounded-[20px] lg:rounded-[24px] p-1 lg:p-2 flex items-center gap-1 lg:gap-2 shadow-sm border border-white/40">
                        {/* Month Indicator — compact on mobile */}
                        <div className="hidden sm:flex flex-col items-center justify-center px-4 lg:px-4 py-3 lg:py-3 bg-gradient-to-b from-white/90 to-white/50 text-blue-600 rounded-[16px] lg:rounded-[20px] mr-0.5 lg:mr-0.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_20px_-6px_rgba(0,92,255,0.1)] backdrop-blur-xl border border-white transition-all flex-shrink-0">
                            <CalendarDays size={20} className="mb-1 opacity-90 lg:hidden" strokeWidth={2.5} />
                            <CalendarDays size={22} className="mb-1 hidden lg:block" strokeWidth={2.5} />
                            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{selectedDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                        </div>

                        {/* Prev Button */}
                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }} className="p-2 lg:p-3.5 bg-white/40 hover:bg-white text-slate-400 hover:text-blue-600 rounded-xl lg:rounded-[20px] transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] border border-transparent hover:border-white active:scale-95 flex-shrink-0">
                            <ChevronLeft size={18} className="lg:hidden" strokeWidth={3} />
                            <ChevronLeft size={22} className="hidden lg:block" strokeWidth={3} />
                        </button>

                        {/* Date Pills — scrollable on mobile */}
                        <div className="flex-1 flex justify-between gap-1 lg:gap-2 overflow-x-auto custom-scrollbar-hide px-0.5 lg:px-1 py-0.5 lg:py-1 snap-x select-none">
                            {stripDays.slice(0, 7).map((date, i) => {
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center py-2 lg:py-3 px-1.5 sm:px-2 lg:px-3 rounded-xl lg:rounded-[18px] transition-all duration-500 ease-out min-w-[38px] sm:min-w-[50px] lg:min-w-[55px] group overflow-hidden border snap-center flex-shrink-0",
                                            isSelected ? "text-white scale-105 shadow-[0_12px_30px_-8px_rgba(0,92,255,0.5)] border-transparent"
                                                : "bg-transparent hover:bg-white/60 text-slate-500 hover:text-slate-800 hover:scale-105 border-transparent hover:border-white shadow-none hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.05)]"
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 z-0"></div>
                                        )}
                                        {isSelected && (
                                            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full animate-shimmer z-0"></div>
                                        )}

                                        <span className={cn("relative z-10 text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-0.5 lg:mb-1 transition-colors duration-300", isSelected ? "text-blue-100" : (isToday ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"))}>
                                            {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                                        </span>
                                        <span className={cn("relative z-10 text-base lg:text-[18px] font-black transition-colors duration-300 leading-none", isSelected ? "text-white" : "text-slate-800 group-hover:text-slate-900")}>
                                            {date.getDate()}
                                        </span>
                                        {isToday && !isSelected && <div className="absolute bottom-1.5 lg:bottom-2.5 h-1 w-1 lg:h-1.5 lg:w-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Button */}
                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }} className="p-2 lg:p-3.5 bg-white/40 hover:bg-white text-slate-400 hover:text-blue-600 rounded-xl lg:rounded-[20px] transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] border border-transparent hover:border-white active:scale-95 flex-shrink-0">
                            <ChevronRight size={18} className="lg:hidden" strokeWidth={3} />
                            <ChevronRight size={22} className="hidden lg:block" strokeWidth={3} />
                        </button>
                    </div>

                    <RealtimeCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
                </div>
                <UpcomingShifts />
            </div>
        </div>
    );
}
