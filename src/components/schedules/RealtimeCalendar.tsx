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

interface RealtimeCalendarProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export function RealtimeCalendar({ selectedDate, onDateChange }: RealtimeCalendarProps) {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newShift, setNewShift] = useState({
        doctor: "",
        dayIdx: 0,
        start: "08:00",
        end: "12:00",
        title: "Praktek",
        registrationTime: "07:30"
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

    // Since we are showing daily view, weekDays and weekly navigation are no longer needed
    // We only need info for the single selectedDate
    const currentDayIdx = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;

    // Date formatter for header
    const formatDateObj = (d: Date) => {
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
                registrationTime: newShift.registrationTime,
                color: 'blue'
            })
        });
        setShowAddModal(false);
        setNewShift({ doctor: "", dayIdx: 0, start: "08:00", end: "12:00", title: "Praktek", registrationTime: "07:30" });
        fetchData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this shift?")) return;
        await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
        fetchData();
    };

    // Selected Date formatted for disabled date checks
    const todayStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');

    return (
        <div className="flex-1 flex flex-col min-h-0 relative">
            {/* ── Header Controls ──────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white capitalize">{formatDateObj(selectedDate)}</h2>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-lg shadow-blue-600/15 transition-all active:scale-95"
                >
                    <Plus size={16} /> Add Shift
                </button>
            </div>

            {/* ── Daily Grid ──────────────────────────────────── */}
            <div className="flex-1 overflow-auto rounded-2xl border border-white/[0.06] bg-slate-950/40 backdrop-blur-xl">
                <div className="min-w-full">

                    {/* Hour Rows for single day */}
                    {HOURS.map((slot, hIdx) => {
                        // Filter shifts that fall on this day and hour, AND are not disabled for this specific date
                        const cellShifts = shifts.filter(s =>
                            s.dayIdx === currentDayIdx &&
                            getShiftHour(s) === slot.hour &&
                            !(s.disabledDates || []).includes(todayStr)
                        );

                        return (
                            <div key={`h-${hIdx}`} className="grid grid-cols-[80px_1fr] border-b border-white/[0.03] last:border-b-0 min-h-[64px] group/row hover:bg-white/[0.01] transition-colors relative">

                                {/* Time label */}
                                <div className="p-3 text-right border-r border-white/[0.04] bg-slate-950/50">
                                    <span className="text-xs font-mono font-semibold text-slate-400 leading-none">{slot.label}</span>
                                </div>

                                {/* Timeline content */}
                                <div className="p-2 relative">
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-white/[0.03] pointer-events-none" />

                                    <div className="flex flex-wrap gap-2 relative z-10">
                                        {cellShifts.map((shift, sIdx) => {
                                            const color = getColor(shift.doctor);
                                            return (
                                                <div
                                                    key={shift.id}
                                                    className={cn(
                                                        "group/card flex-1 min-w-[200px] max-w-[280px] p-3 rounded-xl border cursor-default transition-all hover:scale-[1.02] hover:shadow-xl",
                                                        color.bg, color.border
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", color.dot)} />
                                                            <p className={cn("text-xs font-bold truncate", color.text)}>{shift.doctor}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(shift.id)}
                                                            className="opacity-0 group-hover/card:opacity-100 p-1 bg-black/20 rounded-md text-slate-300 hover:text-red-400 hover:bg-black/40 transition-all flex-shrink-0"
                                                            title="Hapus Jadwal"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-white/10 ml-1">
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{shift.title}</p>

                                                        <div className="flex items-center justify-between mt-1">
                                                            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded w-fit">
                                                                <Clock size={10} className="text-slate-400 flex-shrink-0" />
                                                                <span className="text-[11px] font-mono text-slate-300 font-medium">{shift.formattedTime}</span>
                                                            </div>

                                                            {shift.registrationTime && (
                                                                <div className="text-[9px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">
                                                                    Reg: {shift.registrationTime}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {cellShifts.length === 0 && (
                                            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">+ Kosong</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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

                            <div>
                                <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Registration Time</label>
                                <input
                                    type="time"
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                    value={newShift.registrationTime || ''}
                                    onChange={e => setNewShift({ ...newShift, registrationTime: e.target.value })}
                                />
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
