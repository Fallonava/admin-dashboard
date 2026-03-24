"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Upload, X, Check, Search, Calendar as CalendarIcon, Clock, AlignLeft, Download, User, Trash2, CalendarCheck, Coffee, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/lib/data-service";
import { LeaveRequestModal } from "./LeaveRequestModal";

interface LeaveCalendarProps {
    leaves: LeaveRequest[];
    onRefresh: () => void;
    onOpenAll?: () => void;
    totalLeaves?: number;
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

export function LeaveCalendar({ leaves, onRefresh, onOpenAll, totalLeaves = 0 }: LeaveCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDateInLeave = (checkDate: Date, leave: LeaveRequest) => {
        const target = new Date(checkDate);
        target.setHours(0, 0, 0, 0);

        const start = leave.startDate ? new Date(leave.startDate) : new Date();
        const end = leave.endDate ? new Date(leave.endDate) : new Date();

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        return target >= start && target <= end;
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
        try {
            const res = await fetch('/api/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Gagal menyimpan cuti');
            }
            onRefresh();
        } catch (err: any) {
            console.error(err);
            throw err; // Re-throw to be caught by LeaveRequestModal
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus data cuti ini?")) return;
        try {
            const res = await fetch(`/api/leaves?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                 const errData = await res.json().catch(() => ({}));
                 throw new Error(errData.error || 'Gagal menghapus cuti');
            }
            onRefresh();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Gagal menghapus cuti");
        }
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
                    startDate: start,
                    endDate: end || start,
                    avatar: "/avatars/default.png"
                };
            }).filter(Boolean);
            if (parsedLeaves.length > 0) {
                try {
                    const res = await fetch('/api/leaves', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(parsedLeaves)
                    });
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'Gagal mengimpor data cuti');
                    }
                    onRefresh();
                    alert(`Berhasil mengimpor ${parsedLeaves.length} data cuti.`);
                } catch (err: any) {
                    console.error(err);
                    alert(err.message || 'Gagal mengimpor data cuti');
                }
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleDownloadFormat = () => {
        const csvContent = "Nama Dokter,Tipe Cuti (Tahunan/Sakit/Hamil/Lainnya),Tanggal Mulai (YYYY-MM-DD),Tanggal Selesai (YYYY-MM-DD)\nDr. Sarah Johnson,Tahunan,2026-03-01,2026-03-05\nDr. Michael Chen,Sakit,2026-03-10,";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "format_import_cuti.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const activeLeaves = leaves.filter(l => {
        if (!isDateInLeave(selectedDate, l)) return false;
        if (selectedFilter && l.type !== selectedFilter) return false;
        return true;
    });

    const selectedDateLabel = selectedDate.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });


    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-y-auto lg:overflow-hidden pb-6 lg:pb-0 custom-scrollbar pr-1 lg:pr-0">

            {/* ══════════ KIRI: KALENDER ══════════ */}
            <div className="w-full lg:w-[40%] flex-shrink-0 flex flex-col gap-5 lg:overflow-y-auto lg:custom-scrollbar lg:pb-4 lg:pr-2">
                <div className="rounded-[40px] p-5 sm:p-6 lg:p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)] flex-shrink-0 border border-white/60 bg-white/40 backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)] hover:bg-white/50">
                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-700 tracking-tight">
                            {MONTHS_ID[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <div className="flex items-center gap-1 bg-slate-100/80 backdrop-blur-md rounded-2xl p-1 shadow-inner ring-1 ring-slate-200/50">
                            <button
                                onClick={prevMonth}
                                className="p-2 sm:p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-700 transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs lg:text-sm font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all select-none uppercase tracking-wider"
                            >
                                Hari Ini
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-2 sm:p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-700 transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 mb-2 sm:mb-3">
                        {DAY_LABELS.map(d => (
                            <div key={d} className="text-center text-[11px] sm:text-xs font-bold text-slate-400 py-1.5 uppercase tracking-wider">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                        {grid.map((date, i) => {
                            if (!date) return <div key={`e-${i}`} className="aspect-square" />;

                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            const isToday = date.toDateString() === new Date().toDateString();
                            const hasLeave = leaves.some(l => isDateInLeave(date, l));

                            return (
                                <button
                                    key={`d-${i}`}
                                    onClick={() => setSelectedDate(date)}
                                    className={cn(
                                        "aspect-square rounded-[16px] sm:rounded-[20px] flex flex-col items-center justify-center relative transition-all duration-300 text-xs sm:text-sm lg:text-base font-bold overflow-hidden group",
                                        isSelected
                                            ? "bg-slate-800 text-white shadow-[0_8px_20px_rgba(15,23,42,0.3)] ring-2 ring-slate-800/20 ring-offset-2 scale-[1.05]"
                                            : isToday
                                                ? "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 ring-1 ring-emerald-200 shadow-inner"
                                                : "text-slate-600 bg-white/40 hover:bg-white/80 hover:text-slate-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-white/60 hover:shadow-md hover:-translate-y-0.5"
                                    )}
                                >
                                    <span className="relative z-10">{date.getDate()}</span>
                                    {hasLeave && (
                                        <div className={cn(
                                            "w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full absolute bottom-1.5 sm:bottom-2 transition-all duration-300",
                                            isSelected ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-amber-400 shadow-[0_2px_4px_rgba(251,191,36,0.5)] group-hover:scale-125"
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legenda */}
                    <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-5 sm:gap-6 text-[11px] sm:text-xs text-slate-500 font-bold">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-400 shadow-[0_2px_4px_rgba(251,191,36,0.3)]" />
                            <span>Ada Cuti</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-blue-400 shadow-[0_2px_4px_rgba(96,165,250,0.3)]" />
                            <span>Hari Ini</span>
                        </div>
                    </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-col gap-3 relative z-10 px-1 mt-2 lg:mt-4">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full h-12 sm:h-14 rounded-[24px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-black transition-all shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_8px_25px_-6px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2.5 active:scale-95 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-shimmer" />
                        <Plus size={18} className="relative z-10" />
                        <span className="relative z-10">Tambah Cuti</span>
                    </button>

                    <button
                        onClick={onOpenAll}
                        className="w-full h-12 sm:h-14 rounded-[24px] bg-white/60 backdrop-blur-xl hover:bg-white text-slate-700 text-xs sm:text-sm font-black transition-all shadow-[0_4px_14px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 flex items-center justify-between px-5 sm:px-6 active:scale-95 group relative overflow-hidden border border-white/80"
                    >
                        <div className="absolute inset-0 w-full h-full bg-slate-50/50 -translate-x-full group-hover:animate-shimmer" />
                        <div className="flex items-center gap-2.5 relative z-10">
                            <CalendarIcon size={18} className="text-emerald-500" />
                            <span>Lihat Semua Data Cuti</span>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 rounded-[12px] px-2.5 py-1 text-[11px] sm:text-xs font-black relative z-10 select-none border border-emerald-100/50">
                            {totalLeaves} Data
                        </div>
                    </button>

                    <div className="flex justify-center items-center gap-3 sm:gap-4 mt-2 mb-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1"
                        >
                            <Upload size={14} /> Import CSV
                        </button>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <button
                            onClick={handleDownloadFormat}
                            className="text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1"
                        >
                            <Download size={14} /> Format CSV
                        </button>
                    </div>
                    <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>

            </div>

            {/* ══════════ KANAN: DAFTAR CUTI TANGGAL TERPILIH ══════════ */}
            <div className="flex-1 lg:w-[60%] rounded-[40px] p-6 lg:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white/60 bg-white/40 backdrop-blur-2xl flex flex-col min-h-[500px] lg:min-h-0 relative z-10 mb-8 lg:mb-0 transition-all duration-500 hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)] hover:bg-white/50">
                {/* Header Panel Kanan */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-bold text-slate-700">Dokter Cuti</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 capitalize">{selectedDateLabel}</p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm",
                        activeLeaves.length > 0 ? "bg-amber-50 text-amber-600 border border-amber-100/50" : "bg-blue-50 text-blue-500 border border-blue-100/50"
                    )}>
                        <CalendarCheck size={12} />
                        {activeLeaves.length > 0 ? `${activeLeaves.length} dokter cuti` : "Semua tersedia"}
                    </div>
                </div>

                {/* Quick Filters */}
                {leaves.some(l => isDateInLeave(selectedDate, l)) && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3 mb-1 -mx-2 px-2">
                        <button
                            onClick={() => setSelectedFilter(null)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-300 ring-1",
                                selectedFilter === null ? "bg-slate-700 text-white shadow-md ring-slate-800" : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 ring-slate-200"
                            )}
                        >
                            Semua
                        </button>
                        {Array.from(new Set(leaves.filter(l => isDateInLeave(selectedDate, l)).map(l => l.type))).map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedFilter(type)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-300 ring-1 flex items-center gap-1.5",
                                    selectedFilter === type ? "bg-slate-700 text-white shadow-md ring-slate-800" : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 ring-slate-200"
                                )}
                            >
                                <span>{TYPE_CONFIG[type]?.emoji || '📋'}</span> {type}
                            </button>
                        ))}
                    </div>
                )}

                {/* Daftar Cuti Tanggal Terpilih */}
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 pb-4">
                    {activeLeaves.length > 0 ? (
                        activeLeaves.map(leave => {
                            const conf = TYPE_CONFIG[leave.type] || { color: "text-slate-600", bg: "bg-slate-100", emoji: "📋" };
                            const ringColor = conf.color.replace('text-', 'ring-').replace('-600', '-600/20');
                            const bgColor = conf.color.replace('text-', 'bg-').replace('-600', '-100/60');

                            const startDt = new Date(leave.startDate);
                            const endDt = leave.endDate ? new Date(leave.endDate) : null;
                            let dateStr = startDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                            if (endDt && endDt > startDt) {
                                dateStr += ` - ${endDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
                            }

                            const todayAtMidnight = new Date();
                            todayAtMidnight.setHours(0, 0, 0, 0);
                            const startAtMidnight = new Date(startDt);
                            startAtMidnight.setHours(0, 0, 0, 0);

                            const isOngoing = isDateInLeave(new Date(), leave);
                            const isUpcoming = startAtMidnight > todayAtMidnight;

                            return (
                                <div
                                    key={leave.id}
                                    className="group relative flex items-center gap-4 p-4 rounded-[24px] bg-white/60 backdrop-blur-xl hover:bg-white transition-all duration-300 border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]"
                                >
                                    {/* Hapus */}
                                    <button
                                        onClick={() => handleDelete(leave.id)}
                                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all z-20"
                                        title="Hapus"
                                    >
                                        <Trash2 size={13} />
                                    </button>

                                    <div className="relative shrink-0 flex items-center justify-center h-11 w-11 rounded-full overflow-hidden shadow-sm ring-1 ring-black/5 bg-gradient-to-br from-slate-200 to-slate-300 group-hover:scale-105 transition-transform duration-300 ease-out z-10">
                                        {leave.avatar && leave.avatar !== "/avatars/default.png" ? (
                                            <img src={leave.avatar} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                        ) : null}
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider relative z-10">
                                            {leave.doctor?.[0] || 'D'}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>

                                    <div className="min-w-0 flex-1 flex flex-col justify-center pr-8 relative z-10">
                                        <div className="flex items-center gap-2 mb-1 w-full flex-wrap">
                                            <h4 className="font-bold text-[14px] sm:text-[15px] text-slate-800 truncate tracking-tight">
                                                {leave.doctor}
                                            </h4>
                                            
                                            {isOngoing && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100/50">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                    </span>
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Sedang Cuti</span>
                                                </div>
                                            )}
                                            {isUpcoming && (
                                                <div className="flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100/50">
                                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Akan Datang</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide shrink-0 ${bgColor} ${conf.color} ring-1 ${ringColor} backdrop-blur-sm`}>
                                                    <span>{conf.emoji}</span> {leave.type}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <span>{dateStr}</span>
                                                </div>
                                            </div>
                                            {leave.reason && (
                                                <p className="text-[11px] text-slate-400 font-medium italic mt-0.5 truncate max-w-[90%]">
                                                    "{leave.reason}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center pt-10 pb-0">
                            <div className="w-28 h-28 mb-8 relative">
                                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-[40px] animate-pulse"></div>
                                <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-[40px] animate-pulse animation-delay-2000"></div>
                                <div className="w-full h-full bg-white/60 border border-white/80 rounded-[32px] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] backdrop-blur-2xl relative z-10 transform transition-transform hover:scale-105 hover:-rotate-3 duration-500">
                                    <span className="text-5xl drop-shadow-md">🏖️</span>
                                </div>
                                <div className="absolute -right-3 -top-3 w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center shadow-lg border border-white/90 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                                    <span className="text-lg">✨</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Semua Dokter Tersedia</h3>
                            <p className="text-[13px] font-bold text-slate-500 max-w-[250px] leading-relaxed">
                                Klinik beroperasi dengan kapasitas penuh hari ini. Tidak ada dokter yang mengambil cuti.
                            </p>
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
