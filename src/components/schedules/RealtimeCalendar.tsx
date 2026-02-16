"use client";

import { useState, useEffect, Fragment } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift, Doctor } from "@/lib/data-service";

const HOURS = [
    { label: "07:00", hour: 7 },
    { label: "08:00", hour: 8 },
    { label: "09:00", hour: 9 },
    { label: "10:00", hour: 10 },
    { label: "11:00", hour: 11 },
    { label: "12:00", hour: 12 },
    { label: "13:00", hour: 13 },
    { label: "14:00", hour: 14 },
    { label: "15:00", hour: 15 },
    { label: "16:00", hour: 16 },
    { label: "17:00", hour: 17 },
    { label: "18:00", hour: 18 },
    { label: "19:00", hour: 19 },
    { label: "20:00", hour: 20 },
];

const SHIFT_COLORS = [
    { bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-300", dot: "bg-blue-400" },
    { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-300", dot: "bg-emerald-400" },
    { bg: "bg-violet-500/15", border: "border-violet-500/30", text: "text-violet-300", dot: "bg-violet-400" },
    { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-300", dot: "bg-amber-400" },
    { bg: "bg-rose-500/15", border: "border-rose-500/30", text: "text-rose-300", dot: "bg-rose-400" },
    { bg: "bg-cyan-500/15", border: "border-cyan-500/30", text: "text-cyan-300", dot: "bg-cyan-400" },
];

export function RealtimeCalendar() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newShift, setNewShift] = useState({
        doctor: "",
        dayIdx: 0,
        start: "08:00",
        end: "12:00",
        title: "Praktek"
    });

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [resShifts, resDocs] = await Promise.all([
                fetch('/api/shifts'),
                fetch('/api/doctors')
            ]);
            setShifts(await resShifts.json());
            setDoctors(await resDocs.json());
        } catch (e) { /* silent */ }
    };

    // Week helpers
    const getWeekDays = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    };

    const weekDays = getWeekDays(currentDate);

    const formatDateRange = () => {
        const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${weekDays[0].toLocaleDateString('en-US', opts)} — ${weekDays[6].toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
    };

    const prevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };
    const nextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    // Map shift to hour row
    const getShiftHour = (shift: Shift): number => {
        if (shift.formattedTime) {
            const h = parseInt(shift.formattedTime.split(':')[0]);
            if (!isNaN(h)) return h;
        }
        return 8;
    };

    // Color by doctor name (consistent)
    const getColor = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return SHIFT_COLORS[Math.abs(hash) % SHIFT_COLORS.length];
    };

    const handleAddShift = async () => {
        const formattedTime = `${newShift.start}-${newShift.end}`;
        await fetch('/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctor: newShift.doctor,
                title: newShift.title,
                dayIdx: newShift.dayIdx,
                timeIdx: 0,
                formattedTime,
                color: 'blue'
            })
        });
        setShowAddModal(false);
        setNewShift({ doctor: "", dayIdx: 0, start: "08:00", end: "12:00", title: "Praktek" });
        fetchData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this shift?")) return;
        await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
        fetchData();
    };

    const today = new Date().toDateString();

    return (
        <div className="flex-1 flex flex-col min-h-0 relative">
            {/* ── Header Controls ──────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
                        <button onClick={prevWeek} className="p-2 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-all active:scale-90">
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1.5 text-[11px] font-semibold text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                            Today
                        </button>
                        <button onClick={nextWeek} className="p-2 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-all active:scale-90">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <h2 className="text-base font-semibold text-white/80">{formatDateRange()}</h2>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-lg shadow-blue-600/15 transition-all active:scale-95"
                >
                    <Plus size={16} /> Add Shift
                </button>
            </div>

            {/* ── Weekly Grid ──────────────────────────────────── */}
            <div className="flex-1 overflow-auto rounded-2xl border border-white/[0.06] bg-slate-950/40 backdrop-blur-xl">
                <div className="min-w-[800px]">
                    {/* Day Headers */}
                    <div className="grid grid-cols-[70px_repeat(7,1fr)] sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06]">
                        <div className="p-3 border-r border-white/[0.04]" />
                        {weekDays.map((d, i) => {
                            const isToday = d.toDateString() === today;
                            return (
                                <div key={`dh-${i}`} className={cn(
                                    "p-3 text-center border-r border-white/[0.04] last:border-r-0",
                                    isToday && "bg-blue-500/[0.06]"
                                )}>
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className={cn(
                                        "text-lg font-bold inline-flex items-center justify-center",
                                        isToday
                                            ? "text-white bg-blue-500 w-8 h-8 rounded-full shadow-lg shadow-blue-500/30"
                                            : "text-slate-300"
                                    )}>
                                        {d.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Hour Rows */}
                    {HOURS.map((slot, hIdx) => (
                        <div key={`h-${hIdx}`} className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-white/[0.03] last:border-b-0 group/row hover:bg-white/[0.01] transition-colors">
                            {/* Time label */}
                            <div className="p-2 pr-3 text-right border-r border-white/[0.04]">
                                <span className="text-[10px] font-mono text-slate-500 leading-none">{slot.label}</span>
                            </div>

                            {/* Day cells */}
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                                const isToday = weekDays[dayIndex]?.toDateString() === today;
                                const cellShifts = shifts.filter(s => s.dayIdx === dayIndex && getShiftHour(s) === slot.hour);

                                return (
                                    <div
                                        key={`c-${hIdx}-${dayIndex}`}
                                        className={cn(
                                            "min-h-[48px] p-1 border-r border-white/[0.04] last:border-r-0 relative",
                                            isToday && "bg-blue-500/[0.02]"
                                        )}
                                    >
                                        {cellShifts.map(shift => {
                                            const color = getColor(shift.doctor);
                                            return (
                                                <div
                                                    key={shift.id}
                                                    className={cn(
                                                        "group/card mb-1 p-2 rounded-lg border-l-2 cursor-default transition-all hover:scale-[1.02] hover:shadow-lg",
                                                        color.bg, color.border
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-1">
                                                        <div className="min-w-0">
                                                            <p className={cn("text-[11px] font-bold truncate", color.text)}>{shift.doctor}</p>
                                                            <p className="text-[9px] text-slate-500 font-medium mt-0.5">{shift.title}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(shift.id)}
                                                            className="opacity-0 group-hover/card:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Clock size={8} className="text-slate-500 flex-shrink-0" />
                                                        <span className="text-[9px] font-mono text-slate-500">{shift.formattedTime}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Add Shift Modal ──────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50 backdrop-blur-xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base font-bold text-white">Add New Shift</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Doctor</label>
                                <select
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                    value={newShift.doctor}
                                    onChange={e => setNewShift({ ...newShift, doctor: e.target.value })}
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Day</label>
                                    <select
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                        value={newShift.dayIdx}
                                        onChange={e => setNewShift({ ...newShift, dayIdx: parseInt(e.target.value) })}
                                    >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, i) => (
                                            <option key={i} value={i}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Type</label>
                                    <input
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                                        value={newShift.title}
                                        onChange={e => setNewShift({ ...newShift, title: e.target.value })}
                                        placeholder="e.g. Praktek"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Start</label>
                                    <input
                                        type="time"
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                        value={newShift.start}
                                        onChange={e => setNewShift({ ...newShift, start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">End</label>
                                    <input
                                        type="time"
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                        value={newShift.end}
                                        onChange={e => setNewShift({ ...newShift, end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddShift}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                >
                                    Save Shift
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
