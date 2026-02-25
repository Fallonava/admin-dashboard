"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Upload, Plus, Trash2, User, CalendarCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/lib/data-service";
import { LeaveRequestModal } from "./LeaveRequestModal";

interface LeaveCalendarProps {
    leaves: LeaveRequest[];
    onRefresh: () => void;
}

const MONTHS_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const TYPE_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
    'Sakit': { color: "text-red-600", bg: "bg-red-50", emoji: "🤒" },
    'Liburan': { color: "text-emerald-600", bg: "bg-emerald-50", emoji: "🏖" },
    'Konferensi': { color: "text-purple-600", bg: "bg-purple-50", emoji: "🎤" },
    'Pribadi': { color: "text-blue-600", bg: "bg-blue-50", emoji: "👤" },
    'Lainnya': { color: "text-slate-600", bg: "bg-slate-100", emoji: "📋" },
    // Fallback untuk data lama (bahasa Inggris)
    'Sick Leave': { color: "text-red-600", bg: "bg-red-50", emoji: "🤒" },
    'Vacation': { color: "text-emerald-600", bg: "bg-emerald-50", emoji: "🏖" },
    'Conference': { color: "text-purple-600", bg: "bg-purple-50", emoji: "🎤" },
    'Personal': { color: "text-blue-600", bg: "bg-blue-50", emoji: "👤" },
};

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
        if (!confirm("Hapus data cuti ini?")) return;
        await fetch(`/api/leaves?id=${id}`, { method: 'DELETE' });
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
                    type: type || 'Lainnya',
                    dates: end ? `${start} - ${end}` : start,
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
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const activeLeaves = leaves.filter(l => isDateInLeave(selectedDate, l.dates));

    const selectedDateLabel = selectedDate.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">

            {/* ══════════ KIRI: KALENDER ══════════ */}
            <div className="w-full lg:w-[300px] flex-shrink-0 flex flex-col gap-4">
                <div className="bg-white rounded-[28px] p-5 shadow-sm">
                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-black text-slate-800">
                            {MONTHS_ID[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <div className="flex items-center gap-0.5 bg-slate-50 rounded-xl p-0.5">
                            <button
                                onClick={prevMonth}
                                className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-700 transition-all"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-all"
                            >
                                Hari ini
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-700 transition-all"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {DAY_LABELS.map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-[2px]">
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
                                        "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 text-[12px] font-semibold",
                                        isSelected
                                            ? "bg-slate-900 text-white shadow-md scale-[1.05]"
                                            : isToday
                                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    {date.getDate()}
                                    {hasLeave && (
                                        <div className={cn(
                                            "w-1 h-1 rounded-full absolute bottom-1",
                                            isSelected ? "bg-white/70" : "bg-amber-400"
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legenda */}
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span>Ada cuti</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Hari ini</span>
                        </div>
                    </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 h-11 rounded-2xl bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Upload size={13} />
                        Import CSV
                    </button>
                    <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-1 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        <Plus size={13} />
                        Tambah Cuti
                    </button>
                </div>

                {/* Ringkasan bulan ini */}
                <div className="bg-white rounded-[24px] p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Bulan Ini — {MONTHS_ID[currentDate.getMonth()]}
                    </p>
                    {leaves.some(l => {
                        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
                            if (isDateInLeave(new Date(d), l.dates)) return true;
                        }
                        return false;
                    }) ? (
                        <div className="space-y-2">
                            {leaves
                                .filter(l => {
                                    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                                    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
                                        if (isDateInLeave(new Date(d), l.dates)) return true;
                                    }
                                    return false;
                                })
                                .slice(0, 4)
                                .map(leave => {
                                    const conf = TYPE_CONFIG[leave.type] || { color: "text-slate-500", bg: "bg-slate-50", emoji: "📋" };
                                    return (
                                        <div key={leave.id} className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-700 truncate mr-2">{leave.doctor}</span>
                                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg flex-shrink-0", conf.color, conf.bg)}>
                                                {conf.emoji} {leave.type}
                                            </span>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 text-center py-2">Tidak ada cuti bulan ini</p>
                    )}
                </div>
            </div>

            {/* ══════════ KANAN: DAFTAR CUTI TANGGAL TERPILIH ══════════ */}
            <div className="flex-1 bg-white rounded-[28px] p-6 shadow-sm flex flex-col min-h-0">
                {/* Header Panel Kanan */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-50">
                    <div>
                        <h3 className="text-base font-black text-slate-800">Dokter Cuti</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 capitalize">{selectedDateLabel}</p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black",
                        activeLeaves.length > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                        <CalendarCheck size={12} />
                        {activeLeaves.length > 0 ? `${activeLeaves.length} dokter cuti` : "Semua tersedia"}
                    </div>
                </div>

                {/* Daftar Cuti Tanggal Terpilih */}
                <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                    {activeLeaves.length > 0 ? (
                        activeLeaves.map(leave => {
                            const conf = TYPE_CONFIG[leave.type] || { color: "text-slate-600", bg: "bg-slate-100", emoji: "📋" };
                            return (
                                <div
                                    key={leave.id}
                                    className="group relative bg-slate-50/60 hover:bg-white rounded-2xl p-4 transition-all duration-300 hover:shadow-md"
                                >
                                    {/* Hapus */}
                                    <button
                                        onClick={() => handleDelete(leave.id)}
                                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Hapus"
                                    >
                                        <Trash2 size={13} />
                                    </button>

                                    <div className="flex items-center gap-3.5">
                                        <Avatar className="h-11 w-11 rounded-2xl flex-shrink-0">
                                            <AvatarImage src={leave.avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] text-white font-black rounded-2xl">
                                                {leave.doctor[0]}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h4 className="font-black text-sm text-slate-800 truncate">{leave.doctor}</h4>
                                                <span className={cn(
                                                    "text-[9px] px-2 py-0.5 rounded-lg font-black flex-shrink-0",
                                                    conf.color, conf.bg
                                                )}>
                                                    {conf.emoji} {leave.type}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium">{leave.dates}</p>
                                            {leave.reason && (
                                                <p className="text-[11px] text-slate-400 mt-0.5 italic">"{leave.reason}"</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <div className="w-16 h-16 bg-emerald-50 rounded-[20px] flex items-center justify-center mb-4">
                                <User size={24} className="text-emerald-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-600">Semua dokter tersedia</p>
                            <p className="text-xs text-slate-400 mt-1">Tidak ada cuti pada tanggal ini</p>
                        </div>
                    )}
                </div>

                {/* ── Semua Data Cuti (Footer) ── */}
                {leaves.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Semua Data Cuti ({leaves.length})
                        </p>
                        <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                            {leaves.map(leave => {
                                const conf = TYPE_CONFIG[leave.type] || { color: "text-slate-500", bg: "bg-slate-50", emoji: "📋" };
                                return (
                                    <div key={leave.id} className="group flex items-center justify-between text-xs py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-semibold text-slate-700 truncate">{leave.doctor}</span>
                                            <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0", conf.color, conf.bg)}>
                                                {conf.emoji}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <span className="text-slate-400">{leave.dates}</span>
                                            <button
                                                onClick={() => handleDelete(leave.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 rounded-lg transition-all"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <LeaveRequestModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddLeave}
            />
        </div>
    );
}
