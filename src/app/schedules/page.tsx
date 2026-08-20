"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { RealtimeCalendar } from "@/features/schedules/components/RealtimeCalendar";
import { UpcomingShifts } from "@/features/schedules/components/UpcomingShifts";
import { ScheduleModal } from "@/features/schedules/components/ScheduleModal";
import { CalendarDays, ChevronLeft, ChevronRight, Users, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Doctor, Shift } from "@/lib/data-service";
import { getIndonesianHoliday } from "@/lib/holidays";

export default function SchedulesPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<Doctor | null>(null);

    const { data: rawShifts } = useSWR<Shift[]>('/api/shifts');
    const shifts = Array.isArray(rawShifts) ? rawShifts : [];

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

    const isTodaySelected = selectedDate.toDateString() === new Date().toDateString();

    const jumpToToday = () => {
        setSelectedDate(new Date());
    };

    return (
        <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-hidden relative bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100">
            {/* ─── PAGE HEADER ─── */}
            <div className="relative z-10 w-full flex-none">
                <PageHeader
                  icon={<CalendarDays size={22} className="text-white" strokeWidth={2.5} />}
                  title="Jadwal Dokter"
                  accentWord="Dokter"
                  accentColor="text-blue-600 dark:text-blue-400"
                  subtitle="Kelola jadwal mingguan dan rotasi shift dokter"
                  iconClay="clay-icon-blue"
                  accentBarGradient="from-blue-500 via-indigo-500 to-violet-500"
                  actions={
                    <button
                      onClick={jumpToToday}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[18px] font-black text-xs sm:text-sm active:scale-95 transition-all shadow-sm shrink-0",
                        isTodaySelected
                          ? "clay-button text-zinc-500 dark:text-zinc-400 cursor-default"
                          : "clay-pill-blue text-white"
                      )}
                    >
                      <RotateCcw size={14} strokeWidth={2.5} />
                      <span>Hari Ini</span>
                    </button>
                  }
                />
            </div>

            {/* ─── MAIN CONTENT AREA ─── */}
            <div className="flex flex-col lg:flex-row flex-1 gap-3 lg:gap-5 px-3 sm:px-6 lg:px-8 pt-2 pb-32 lg:py-3 overflow-y-auto lg:overflow-hidden min-h-0 relative z-10 custom-scrollbar">

                {/* ── LEFT: Calendar & Timeline Column ────────────────────── */}
                <div className="flex-none lg:flex-1 w-full flex flex-col lg:min-h-0 lg:overflow-hidden space-y-2.5 lg:space-y-3">

                    {/* Date Strip Bar */}
                    <div className="flex-none clay-surface rounded-[24px] p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 sticky top-0 z-20 shadow-sm">
                        {/* Month Indicator */}
                        <div className="hidden sm:flex flex-col items-center justify-center px-3.5 py-2.5 clay-button text-blue-600 dark:text-blue-400 rounded-[18px] flex-shrink-0">
                            <CalendarDays size={18} className="mb-0.5" strokeWidth={2.5} />
                            <span className="text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap">
                                {selectedDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        {/* Prev Button */}
                        <button 
                            onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
                            className="p-2 sm:p-2.5 clay-button text-zinc-500 hover:text-blue-600 rounded-[16px] transition-all active:scale-95 flex-shrink-0"
                            title="Hari Sebelumnya"
                        >
                            <ChevronLeft size={16} strokeWidth={3} />
                        </button>

                        {/* Date Pills */}
                        <div className="flex-1 flex justify-between gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar px-0.5 py-0.5 select-none">
                            {stripDays.slice(0, 7).map((date, i) => {
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                const isToday = date.toDateString() === new Date().toDateString();
                                const holiday = getIndonesianHoliday(date);

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        title={holiday.name}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-2 rounded-[16px] transition-all duration-150 min-w-[40px] sm:min-w-[48px] lg:min-w-[54px] flex-1",
                                            isSelected
                                                ? "clay-pill-blue text-white shadow-md scale-[1.02]"
                                                : "clay-button text-zinc-700 dark:text-zinc-300 hover:text-blue-600",
                                            holiday.isTanggalMerah && !isSelected && "text-rose-600 dark:text-rose-400"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-wider mb-0.5",
                                            isSelected ? "text-white" : (holiday.isTanggalMerah ? "text-rose-500 font-black" : isToday ? "text-blue-600 dark:text-blue-400" : "text-zinc-400")
                                        )}>
                                            {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                                        </span>
                                        <span className={cn(
                                            "text-sm sm:text-base font-black leading-none",
                                            isSelected ? "text-white" : "text-zinc-800 dark:text-zinc-100"
                                        )}>
                                            {date.getDate()}
                                        </span>
                                        {isToday && !isSelected && <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-blue-500" />}
                                        {holiday.isHoliday && !isSelected && <div className="absolute top-1 right-1.5 h-1 w-1 rounded-full bg-rose-500" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Button */}
                        <button 
                            onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
                            className="p-2 sm:p-2.5 clay-button text-zinc-500 hover:text-blue-600 rounded-[16px] transition-all active:scale-95 flex-shrink-0"
                            title="Hari Berikutnya"
                        >
                            <ChevronRight size={16} strokeWidth={3} />
                        </button>
                    </div>

                    <RealtimeCalendar
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        onOpenDoctorSchedule={(doc) => setSelectedDoctorForModal(doc)}
                    />
                </div>

                {/* ── RIGHT: Doctor Duty List (Desktop Sidebar) ── */}
                <div className="hidden lg:flex lg:w-[310px] xl:w-[350px] flex-col flex-shrink-0">
                    <UpcomingShifts
                        selectedDate={selectedDate}
                        onOpenScheduleModal={(doc) => setSelectedDoctorForModal(doc)}
                    />
                </div>
            </div>

            {/* ════════════════════════════════════════════════════
                MOBILE BOTTOM SHEET — Active Duty Doctors
                ════════════════════════════════════════════════════ */}

            {/* Backdrop Overlay */}
            <div
                onClick={() => setIsSheetOpen(false)}
                className={cn(
                    "lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[108] transition-all duration-300",
                    isSheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            />

            {/* Bottom Sheet Panel */}
            <div className={cn(
                "lg:hidden fixed bottom-0 left-0 right-0 z-[115] transition-transform duration-300 ease-out",
                isSheetOpen ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="clay-surface rounded-t-[34px] shadow-2xl flex flex-col max-h-[82vh]">
                    {/* Drag Handle */}
                    <div className="flex flex-col items-center pt-3 pb-1 flex-none" onClick={() => setIsSheetOpen(false)}>
                        <div className="w-10 h-1.5 clay-inset rounded-full cursor-ns-resize" />
                    </div>

                    {/* Sheet Header */}
                    <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-none border-b border-zinc-200/60 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="clay-icon-blue h-9 w-9 rounded-[12px] flex items-center justify-center text-white shrink-0">
                                <Users size={17} className="relative z-10" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                                    Dokter Bertugas
                                </h2>
                                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-bold">
                                    {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSheetOpen(false)}
                            className="p-2 rounded-full clay-button text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all active:scale-90"
                        >
                            <X size={17} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Sheet Content */}
                    <div className="flex-1 overflow-y-auto min-h-0 pb-16">
                        <UpcomingShifts
                            selectedDate={selectedDate}
                            onOpenScheduleModal={(doc) => {
                                setIsSheetOpen(false);
                                setSelectedDoctorForModal(doc);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── MOBILE: Floating Trigger Button ── */}
            <button
                onClick={() => setIsSheetOpen(true)}
                className={cn(
                    "lg:hidden fixed z-[105] flex items-center gap-2 px-4 py-3 rounded-full clay-pill-blue text-white shadow-xl transition-all duration-300 active:scale-95",
                    "right-4 bottom-24",
                    isSheetOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
                )}
            >
                <Users size={16} strokeWidth={2.5} />
                <span className="text-xs font-black tracking-wide">Dokter Bertugas</span>
            </button>

            {/* Schedule Modal for Doctor Weekly Template */}
            {selectedDoctorForModal && (
                <ScheduleModal
                    doctor={selectedDoctorForModal}
                    shifts={shifts}
                    isOpen={Boolean(selectedDoctorForModal)}
                    onClose={() => setSelectedDoctorForModal(null)}
                    onUpdate={() => {
                        mutate('/api/doctors');
                        mutate((key: string) => typeof key === 'string' && key.startsWith('/api/shifts'));
                    }}
                />
            )}
        </div>
    );
}

