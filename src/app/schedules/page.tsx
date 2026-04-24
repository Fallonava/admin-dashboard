"use client";

import { useState, useMemo, useEffect } from "react";
import { RealtimeCalendar } from "@/features/schedules/components/RealtimeCalendar";
import { UpcomingShifts } from "@/features/schedules/components/UpcomingShifts";
import { CalendarDays, ChevronLeft, ChevronRight, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SchedulesPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Close sheet on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsSheetOpen(false); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // Prevent body scroll when sheet is open on mobile
    useEffect(() => {
        document.body.style.overflow = isSheetOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isSheetOpen]);

    const stripDays = useMemo(() => {
        return Array.from({ length: 14 }, (_, i) => {
            const d = new Date(selectedDate);
            d.setDate(selectedDate.getDate() - 3 + i);
            return d;
        });
    }, [selectedDate]);

    return (
        <div className="flex-1 w-full flex flex-col h-[calc(100vh-1rem)] overflow-hidden relative">
            {/* Ambient Animated Glowing Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-violet-300/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 w-full flex-none">
                <PageHeader
                  icon={<CalendarDays size={20} className="text-white" />}
                  title="Jadwal Dokter"
                  accentWord="Dokter"
                  accentColor="text-blue-600"
                  subtitle="Kelola jadwal mingguan dan shift dokter"
                  iconGradient="from-blue-500 to-indigo-600"
                  accentBarGradient="from-blue-500 via-indigo-500 to-violet-500"
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row flex-1 gap-3 lg:gap-6 px-4 sm:px-6 lg:px-8 py-3 lg:py-6 overflow-y-auto lg:overflow-hidden min-h-0 relative z-10 custom-scrollbar">

                {/* ── LEFT: Calendar Column ────────────────────── */}
                <div className="flex-none lg:flex-1 w-full flex flex-col lg:min-h-0 lg:overflow-hidden space-y-3 lg:space-y-4">

                    {/* Calendar Strip - sticky on mobile */}
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-150 fill-mode-both flex-none bg-white/70 backdrop-blur-2xl saturate-150 rounded-[24px] p-1.5 lg:p-2 flex items-center gap-1.5 lg:gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 sticky top-0 z-20">

                        {/* Month Indicator */}
                        <div className="hidden sm:flex flex-col items-center justify-center px-4 py-3 bg-white/60 text-blue-600 rounded-[18px] mr-0.5 shadow-sm backdrop-blur-xl border border-white/80 transition-all flex-shrink-0">
                            <CalendarDays size={20} className="mb-1 opacity-90" strokeWidth={2.5} />
                            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{selectedDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                        </div>

                        {/* Prev Button */}
                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }} className="p-2 lg:p-3 bg-white/40 hover:bg-white text-slate-400 hover:text-blue-600 rounded-[16px] lg:rounded-[18px] transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] border border-white/60 hover:border-white active:scale-95 flex-shrink-0">
                            <ChevronLeft size={18} strokeWidth={3} />
                        </button>

                        {/* Date Pills */}
                        <div className="flex-1 flex justify-between gap-1 lg:gap-2 overflow-x-auto custom-scrollbar-hide px-0.5 py-0.5 snap-x select-none">
                            {stripDays.slice(0, 7).map((date, i) => {
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center py-2 lg:py-3 px-1.5 sm:px-2 lg:px-3 rounded-[16px] lg:rounded-[18px] transition-all duration-500 ease-out min-w-[38px] sm:min-w-[48px] lg:min-w-[55px] group overflow-hidden border snap-center flex-shrink-0",
                                            isSelected
                                                ? "text-white scale-105 shadow-[0_12px_30px_-8px_rgba(0,92,255,0.5)] border-transparent"
                                                : "bg-transparent hover:bg-white/60 text-slate-500 hover:text-slate-800 hover:scale-105 border-transparent hover:border-white/80 shadow-none"
                                        )}
                                    >
                                        {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 z-0" />}
                                        {isSelected && <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full animate-shimmer z-0" />}
                                        <span className={cn("relative z-10 text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-0.5 lg:mb-1", isSelected ? "text-blue-100" : (isToday ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"))}>
                                            {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                                        </span>
                                        <span className={cn("relative z-10 text-base lg:text-[18px] font-black leading-none", isSelected ? "text-white" : "text-slate-800 group-hover:text-slate-900")}>
                                            {date.getDate()}
                                        </span>
                                        {isToday && !isSelected && <div className="absolute bottom-1.5 lg:bottom-2.5 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Button */}
                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }} className="p-2 lg:p-3 bg-white/40 hover:bg-white text-slate-400 hover:text-blue-600 rounded-[16px] lg:rounded-[18px] transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] border border-white/60 hover:border-white active:scale-95 flex-shrink-0">
                            <ChevronRight size={18} strokeWidth={3} />
                        </button>
                    </div>

                    <RealtimeCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
                </div>

                {/* ── RIGHT: Doctor List (Desktop Sidebar only) ── */}
                <div className="hidden lg:flex lg:w-[320px] xl:w-[380px] flex-col flex-shrink-0">
                    <UpcomingShifts />
                </div>
            </div>

            {/* ════════════════════════════════════════════════════
                MOBILE BOTTOM SHEET — Doctor List
                ════════════════════════════════════════════════════ */}

            {/* Backdrop Overlay */}
            <div
                onClick={() => setIsSheetOpen(false)}
                className={cn(
                    "lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[108] transition-all duration-300",
                    isSheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            />

            {/* Bottom Sheet Panel */}
            <div className={cn(
                "lg:hidden fixed bottom-0 left-0 right-0 z-[115] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                isSheetOpen ? "translate-y-0" : "translate-y-full"
            )}>
                {/* Sheet Container */}
                <div className="bg-white/80 backdrop-blur-[40px] border border-white/60 rounded-t-[32px] shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.2)] flex flex-col" style={{ maxHeight: "80vh" }}>
                    {/* Drag Handle */}
                    <div className="flex flex-col items-center pt-3 pb-1 flex-none">
                        <div className="w-10 h-1.5 bg-slate-300/80 rounded-full" />
                    </div>

                    {/* Sheet Header */}
                    <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-none border-b border-slate-100/60">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/80 text-blue-600 rounded-[14px] shadow-sm border border-white/80">
                                <Users size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-[16px] font-black text-slate-800 tracking-tight">Daftar Dokter</h2>
                                <p className="text-[11px] text-slate-400 font-bold">Ketuk untuk lihat jadwal</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSheetOpen(false)}
                            className="p-2 rounded-[14px] bg-slate-100/80 text-slate-500 hover:text-slate-700 hover:bg-slate-200/80 transition-all active:scale-95"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Sheet Content — Scrollable */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <UpcomingShifts />
                    </div>
                </div>
            </div>

            {/* ── MOBILE: Floating Trigger Button ── */}
            <button
                onClick={() => setIsSheetOpen(true)}
                className={cn(
                    "lg:hidden fixed z-[105] flex items-center gap-2.5 pl-4 pr-5 py-3.5 rounded-full shadow-[0_8px_32px_-8px_rgba(0,92,255,0.55)] transition-all duration-300 active:scale-95",
                    "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
                    "border border-blue-400/30",
                    "right-5 bottom-[calc(5rem+1rem)]",   /* 5rem = h-20 nav height, +1rem gap */
                    isSheetOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
                )}
            >
                <Users size={18} strokeWidth={2.5} />
                <span className="text-[13px] font-black tracking-wide">Daftar Dokter</span>
                {/* Ping dot */}
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/80" />
                </span>
            </button>
        </div>
    );
}
