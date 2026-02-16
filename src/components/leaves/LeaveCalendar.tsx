"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Upload, Plus, Trash2, X, User, Check, Ban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/lib/data-service";
import { LeaveRequestModal } from "./LeaveRequestModal";

interface LeaveCalendarProps {
    leaves: LeaveRequest[];
    onRefresh: () => void;
}

const DAY_LABELS = [
    { key: "sun", label: "S" },
    { key: "mon", label: "M" },
    { key: "tue", label: "T" },
    { key: "wed", label: "W" },
    { key: "thu", label: "T" },
    { key: "fri", label: "F" },
    { key: "sat", label: "S" },
];

export function LeaveCalendar({ leaves, onRefresh }: LeaveCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDateInLeave = (checkDate: Date, leaveDates: string) => {
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
            if (!isNaN(d.getTime())) {
                d.setHours(0, 0, 0, 0);
                return d.getTime() === target.getTime();
            }
        } catch { return false; }
        return false;
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const grid: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let i = 1; i <= days; i++) grid.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const handleAddLeave = async (data: any) => {
        await fetch('/api/leaves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        onRefresh();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this leave request?")) return;
        await fetch(`/api/leaves?id=${id}`, { method: 'DELETE' });
        onRefresh();
    };

    const handleStatusUpdate = async (id: number, status: 'Approved' | 'Rejected') => {
        await fetch('/api/leaves', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        onRefresh();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').slice(1);
            const parsedLeaves = lines.filter(l => l.trim()).map(line => {
                const [doctor, type, start, end] = line.split(',').map(s => s.trim());
                if (!doctor || !start) return null;
                return {
                    doctor,
                    type: type || 'Vacation',
                    dates: end ? `${start} - ${end}` : start,
                    status: 'Approved',
                    avatar: "/avatars/default.png"
                };
            }).filter(Boolean);
            if (parsedLeaves.length > 0) {
                await fetch('/api/leaves', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsedLeaves)
                });
                onRefresh();
                alert(`Successfully imported ${parsedLeaves.length} leaves.`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const activeLeaves = leaves.filter(l => isDateInLeave(selectedDate, l.dates));

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            {/* ── Left: Compact Calendar Widget ─────────────────────── */}
            <div className="w-full lg:w-[280px] flex-shrink-0">
                <div className="bg-slate-950/60 rounded-3xl border border-white/[0.08] p-5 backdrop-blur-2xl shadow-2xl shadow-black/40 relative overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <h2 className="text-sm font-semibold text-white/90 tracking-wide">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-full p-0.5 border border-white/[0.06]">
                            <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all active:scale-90">
                                <ChevronLeft size={12} />
                            </button>
                            <button
                                onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
                                className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-1.5 hover:bg-blue-400 transition-colors"
                                title="Today"
                            />
                            <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all active:scale-90">
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 mb-2 relative z-10">
                        {DAY_LABELS.map(d => (
                            <div key={d.key} className="text-center text-[9px] font-medium text-slate-500/80 py-1">
                                {d.label}
                            </div>
                        ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-[3px] relative z-10">
                        {grid.map((date, i) => {
                            if (!date) return <div key={`e-${i}`} className="aspect-square" />;

                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            const isToday = date.toDateString() === new Date().toDateString();
                            const hasLeave = leaves.some(l => isDateInLeave(date, l.dates));

                            return (
                                <button
                                    key={`d-${i}`}
                                    onClick={() => setSelectedDate(date)}
                                    className={cn(
                                        "aspect-square rounded-[10px] flex flex-col items-center justify-center relative transition-all duration-200 text-[11px] font-medium",
                                        isSelected
                                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.08]"
                                            : "text-slate-400 hover:bg-white/[0.06] hover:text-white active:scale-95",
                                        isToday && !isSelected && "text-blue-400 bg-blue-500/[0.08] ring-1 ring-blue-500/30",
                                        hasLeave && !isSelected && "text-slate-200"
                                    )}
                                >
                                    {date.getDate()}
                                    {hasLeave && (
                                        <div className={cn(
                                            "w-[3px] h-[3px] rounded-full absolute bottom-[5px]",
                                            isSelected ? "bg-white/80" : "bg-amber-400"
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex gap-2 relative z-10">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                            <Upload size={11} /> Import
                        </button>
                        <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex-1 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5 active:scale-95"
                        >
                            <Plus size={11} /> Add
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Right: Doctor Leave List ──────────────────────────── */}
            <div className="flex-1 bg-slate-950/30 rounded-3xl border border-white/[0.06] p-6 backdrop-blur-xl flex flex-col relative overflow-hidden">
                {/* Ambient */}
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.06] relative z-10">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight mb-0.5">On Leave</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
                        <span className="text-sm font-bold text-white">{activeLeaves.length}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 -mr-2 pr-2 relative z-10">
                    {activeLeaves.length > 0 ? (
                        activeLeaves.map(leave => (
                            <div
                                key={leave.id}
                                className="group relative bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-4 border border-white/[0.05] transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
                            >
                                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    {leave.status === 'Pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                                                className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
                                                title="Approve"
                                            >
                                                <Check size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                                title="Reject"
                                            >
                                                <Ban size={13} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(leave.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3.5">
                                    <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                                        <AvatarImage src={leave.avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-[10px] text-white font-bold">
                                            {leave.doctor[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-semibold text-sm text-white truncate">{leave.doctor}</h4>
                                            <span className={cn(
                                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0",
                                                leave.type === 'Sick Leave' ? "bg-red-500/15 text-red-300" :
                                                    leave.type === 'Vacation' ? "bg-emerald-500/15 text-emerald-300" :
                                                        leave.type === 'Conference' ? "bg-purple-500/15 text-purple-300" :
                                                            "bg-blue-500/15 text-blue-300"
                                            )}>
                                                {leave.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                            <span>{leave.dates}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className={cn(
                                                "font-semibold",
                                                leave.status === 'Approved' ? "text-emerald-400" :
                                                    leave.status === 'Rejected' ? "text-red-400" : "text-amber-400"
                                            )}>{leave.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 py-12">
                            <div className="w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center mb-3 border border-white/[0.05]">
                                <User size={22} className="opacity-30" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">No doctors on leave</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">Everyone is available</p>
                        </div>
                    )}
                </div>
            </div>

            <LeaveRequestModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddLeave}
            />
        </div>
    );
}
