"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift } from "@/lib/data-service";

const DAYS = [
    { day: "MON", date: 12 },
    { day: "TUE", date: 13 },
    { day: "WED", date: 14 },
    { day: "THU", date: 15 },
    { day: "FRI", date: 16 },
    { day: "SAT", date: 17 },
    { day: "SUN", date: 18 },
];

const TIME_SLOTS = [
    "08:00 AM",
    "12:00 PM",
    "04:00 PM",
    "08:00 PM",
];

const colorStyles: Record<string, string> = {
    blue: "bg-blue-900/40-4-500 text-blue-100 hover:bg-blue-900/60",
    emerald: "bg-emerald-900/40-4-500 text-emerald-100 hover:bg-emerald-900/60",
    purple: "bg-purple-900/40-4-500 text-purple-100 hover:bg-purple-900/60",
    orange: "bg-orange-900/40-4-500 text-orange-100 hover:bg-orange-900/60",
    rose: "bg-rose-900/40-4-500 text-rose-100 hover:bg-rose-900/60",
    indigo: "bg-indigo-900/40-4-500 text-indigo-100 hover:bg-indigo-900/60",
};

export function CalendarGrid() {
    const [view, setView] = useState("Week");
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [newShift, setNewShift] = useState<Partial<Shift>>({
        dayIdx: 0,
        timeIdx: 0,
        color: 'blue',
        doctorId: ''
    });

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        const res = await fetch('/api/shifts');
        const data = await res.json();
        setShifts(data);
    };

    const handleAddShift = async () => {
        if (!newShift.title || !newShift.doctor) return;

        await fetch('/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newShift)
        });

        setShowModal(false);
        setNewShift({ dayIdx: 0, timeIdx: 0, color: 'blue', title: '', doctor: '', doctorId: '' });
        fetchShifts();
    };

    const handleDeleteShift = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Delete this shift?")) return;

        await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
        fetchShifts();
    };

    return (
        <div className="flex-1 bg-slate-900/30 backdrop-blur-md rounded-2xl p-6 min-h-[600px] flex flex-col relative">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="bg-slate-800/50 p-1 rounded-lg flex text-sm">
                    {["Week", "Month", "Day"].map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "px-4 py-1.5 rounded-md transition-all font-medium",
                                view === v ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 text-slate-300">
                    <button className="p-1 hover:text-white hover:bg-white/10 rounded-full"><ChevronLeft size={20} /></button>
                    <span className="text-white font-medium text-lg">Oct 12 - 18, 2026</span>
                    <button className="p-1 hover:text-white hover:bg-white/10 rounded-full"><ChevronRight size={20} /></button>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus size={18} />
                    Add Shift
                </button>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-8 gap-px bg-slate-800 rounded-t-lg overflow-hidden border-800">
                <div className="p-4 bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</div>
                {DAYS.map((d) => (
                    <div key={d.day} className="p-4 bg-slate-900/50 text-center-800">
                        <div className="text-[10px] text-slate-500 font-bold">{d.day}</div>
                        <div className="text-xl font-bold text-white mt-1">{d.date}</div>
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-8 gap-px bg-slate-800-800 rounded-b-lg overflow-hidden flex-1">
                {TIME_SLOTS.map((time, timeIdx) => (
                    <>
                        <div key={time} className="p-4 bg-slate-900/30 text-xs text-slate-400-800/50 relative">
                            <span className="-top-3 relative">{time}</span>
                        </div>
                        {DAYS.map((day, dayIdx) => {
                            const shift = shifts.find(s => s.dayIdx === dayIdx && s.timeIdx === timeIdx);
                            return (
                                <div key={`${day.day}-${time}`} className="bg-slate-900/30 min-h-[120px] p-2-800/50 relative group transition-colors hover:bg-white/[0.02]">
                                    {shift && (
                                        <div className={cn("p-3 rounded-lg text-xs cursor-pointer shadow-lg transition-all hover:scale-[1.02] relative group/item", colorStyles[shift.color])}>
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold mb-1">{shift.title}</p>
                                                <button
                                                    onClick={(e) => handleDeleteShift(e, shift.id)}
                                                    className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-white transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-90">
                                                <div className="h-4 w-4 rounded-full bg-white/20" />
                                                <span>{shift.doctor || 'Unknown'}</span>
                                            </div>
                                            {shift.extra && (
                                                <p className="mt-2 text-[10px] opacity-70 bg-black/20 px-1.5 py-0.5 rounded w-fit">{shift.extra}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                ))}
            </div>

            {/* Add Shift Modal */}
            {showModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Add New Shift</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Shift Title</label>
                                <input
                                    className="w-full bg-slate-900 border-700 rounded-lg p-2 text-white text-sm"
                                    placeholder="e.g. Surgery, Consultation"
                                    value={newShift.title || ''}
                                    onChange={e => setNewShift({ ...newShift, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Doctor Name</label>
                                <input
                                    className="w-full bg-slate-900 border-700 rounded-lg p-2 text-white text-sm"
                                    placeholder="Dr. Name"
                                    value={newShift.doctor || ''}
                                    onChange={e => setNewShift({ ...newShift, doctor: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Day</label>
                                    <select
                                        className="w-full bg-slate-900 border-700 rounded-lg p-2 text-white text-sm"
                                        value={newShift.dayIdx}
                                        onChange={e => setNewShift({ ...newShift, dayIdx: parseInt(e.target.value) })}
                                    >
                                        {DAYS.map((d, i) => <option key={i} value={i}>{d.day}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Time Slot</label>
                                    <select
                                        className="w-full bg-slate-900 border-700 rounded-lg p-2 text-white text-sm"
                                        value={newShift.timeIdx}
                                        onChange={e => setNewShift({ ...newShift, timeIdx: parseInt(e.target.value) })}
                                    >
                                        {TIME_SLOTS.map((t, i) => <option key={i} value={i}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Color Tag</label>
                                <select
                                    className="w-full bg-slate-900 border-700 rounded-lg p-2 text-white text-sm"
                                    value={newShift.color}
                                    onChange={e => setNewShift({ ...newShift, color: e.target.value })}
                                >
                                    {Object.keys(colorStyles).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddShift}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
                                >
                                    Create Shift
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
