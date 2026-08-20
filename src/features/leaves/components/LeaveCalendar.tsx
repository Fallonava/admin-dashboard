"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Upload, X, Check, Search, Calendar as CalendarIcon, Clock, AlignLeft, Download, User, Trash2, CalendarCheck, Coffee, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaveRequest, Doctor } from "@/lib/data-service";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { AiLeaveImportModal } from "./AiLeaveImportModal";
import useSWR from "swr";

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
    'Sakit': { color: "text-red-600 dark:text-red-400", bg: "clay-pill-rose", emoji: "🤒" },
    'Liburan': { color: "text-emerald-600 dark:text-emerald-400", bg: "clay-pill-emerald", emoji: "🏖" },
    'Konferensi': { color: "text-purple-600 dark:text-purple-400", bg: "clay-pill-violet", emoji: "🎤" },
    'Pribadi': { color: "text-blue-600 dark:text-blue-400", bg: "clay-pill-blue", emoji: "👤" },
    'Lainnya': { color: "text-amber-600 dark:text-amber-400", bg: "clay-pill-amber", emoji: "📋" },
    // Fallback data lama
    'Sick Leave': { color: "text-red-600 dark:text-red-400", bg: "clay-pill-rose", emoji: "🤒" },
    'Vacation': { color: "text-emerald-600 dark:text-emerald-400", bg: "clay-pill-emerald", emoji: "🏖" },
    'Conference': { color: "text-purple-600 dark:text-purple-400", bg: "clay-pill-violet", emoji: "🎤" },
    'Personal': { color: "text-blue-600 dark:text-blue-400", bg: "clay-pill-blue", emoji: "👤" },
};

export function LeaveCalendar({ leaves, onRefresh, onOpenAll, totalLeaves = 0 }: LeaveCalendarProps) {
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
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
            throw err;
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
            <div className="w-full lg:w-[40%] flex-shrink-0 flex flex-col gap-4 lg:overflow-y-auto lg:custom-scrollbar lg:pb-4 lg:pr-1">
                <div className="rounded-[32px] p-5 sm:p-6 lg:p-7 clay-surface flex-shrink-0 transition-all duration-300">
                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                        <h2 className="text-base sm:text-lg lg:text-xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">
                            {MONTHS_ID[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <div className="flex items-center gap-1 clay-inset rounded-[20px] p-1">
                            <button
                                onClick={prevMonth}
                                className="p-2 sm:p-2.5 clay-button rounded-[14px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-95"
                                title="Bulan Sebelumnya"
                            >
                                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 clay-button rounded-[14px] transition-all select-none uppercase tracking-wider active:scale-95"
                            >
                                Hari Ini
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-2 sm:p-2.5 clay-button rounded-[14px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-95"
                                title="Bulan Berikutnya"
                            >
                                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 mb-2 sm:mb-3">
                        {DAY_LABELS.map(d => (
                            <div key={d} className="text-center text-[11px] sm:text-xs font-black text-zinc-400 dark:text-zinc-500 py-1.5 uppercase tracking-wider">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
                                        "aspect-square rounded-[18px] sm:rounded-[22px] flex flex-col items-center justify-center relative transition-all duration-200 text-xs sm:text-sm font-black overflow-hidden active:scale-95",
                                        isSelected
                                            ? "clay-pill-emerald text-white scale-[1.06] z-10"
                                            : isToday
                                                ? "clay-surface text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/60"
                                                : "clay-button text-zinc-700 dark:text-zinc-300 hover:scale-[1.03]"
                                    )}
                                >
                                    <span className="relative z-10">{date.getDate()}</span>
                                    {hasLeave && (
                                        <div className={cn(
                                            "w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full absolute bottom-1.5 sm:bottom-2 transition-all duration-200",
                                            isSelected ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" : "clay-pill-amber"
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legenda */}
                    <div className="mt-5 sm:mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-center gap-5 sm:gap-6 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-black">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full clay-pill-amber" />
                            <span>Ada Cuti</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full clay-pill-emerald" />
                            <span>Terpilih</span>
                        </div>
                    </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-col gap-2.5 relative z-10 px-1 mt-1">
                    {/* AI Smart Import Button */}
                    <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="w-full h-11 sm:h-12 rounded-[20px] clay-pill-violet text-white text-xs sm:text-[13px] font-black transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Sparkles size={16} className="text-violet-200 shrink-0" />
                        <span>Input Cuti Cerdas (AI dari WA)</span>
                    </button>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full h-11 sm:h-12 rounded-[20px] clay-pill-emerald text-white text-xs sm:text-[13px] font-black transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} className="shrink-0" />
                        <span>Tambah Cuti Manual</span>
                    </button>

                    <button
                        onClick={onOpenAll}
                        className="w-full h-11 sm:h-12 rounded-[20px] clay-button text-zinc-700 dark:text-zinc-200 text-xs sm:text-[13px] font-black transition-all flex items-center justify-between px-5 sm:px-6 active:scale-95"
                    >
                        <div className="flex items-center gap-2.5">
                            <CalendarIcon size={16} className="text-emerald-500 shrink-0" />
                            <span>Lihat Semua Data Cuti</span>
                        </div>
                        <div className="clay-pill-emerald text-white rounded-full px-2.5 py-0.5 text-[10px] font-black select-none">
                            {totalLeaves} Data
                        </div>
                    </button>

                    <div className="flex justify-center items-center gap-3 sm:gap-4 mt-2 mb-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="clay-button rounded-[12px] px-3 py-1.5 text-[11px] font-black text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                            <Upload size={13} /> Import CSV
                        </button>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                        <button
                            onClick={handleDownloadFormat}
                            className="clay-button rounded-[12px] px-3 py-1.5 text-[11px] font-black text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                            <Download size={13} /> Format CSV
                        </button>
                    </div>
                    <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>

            </div>

            {/* ══════════ KANAN: DAFTAR CUTI TANGGAL TERPILIH ══════════ */}
            <div className="flex-1 lg:w-[60%] rounded-[32px] p-6 lg:p-8 clay-surface flex flex-col min-h-[500px] lg:min-h-0 relative z-10 mb-8 lg:mb-0 transition-all duration-300">
                {/* Header Panel Kanan */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                    <div>
                        <h3 className="text-base font-black text-zinc-800 dark:text-zinc-100">Dokter Cuti</h3>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-0.5 capitalize">{selectedDateLabel}</p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black select-none",
                        activeLeaves.length > 0 ? "clay-pill-amber text-white" : "clay-pill-blue text-white"
                    )}>
                        <CalendarCheck size={13} />
                        <span>{activeLeaves.length > 0 ? `${activeLeaves.length} Dokter Cuti` : "Semua Tersedia"}</span>
                    </div>
                </div>

                {/* Quick Filters */}
                {leaves.some(l => isDateInLeave(selectedDate, l)) && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3 mb-1 -mx-2 px-2">
                        <button
                            onClick={() => setSelectedFilter(null)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition-all duration-200 active:scale-95",
                                selectedFilter === null ? "clay-pill-emerald text-white" : "clay-button text-zinc-600 dark:text-zinc-400"
                            )}
                        >
                            Semua
                        </button>
                        {Array.from(new Set(leaves.filter(l => isDateInLeave(selectedDate, l)).map(l => l.type))).map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedFilter(type)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 active:scale-95",
                                    selectedFilter === type ? "clay-pill-emerald text-white" : "clay-button text-zinc-600 dark:text-zinc-400"
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
                            const conf = TYPE_CONFIG[leave.type] || { color: "text-zinc-600", bg: "clay-button", emoji: "📋" };

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
                                    className="group relative flex items-center gap-4 p-4 rounded-[22px] clay-button transition-all duration-200 hover:scale-[1.01]"
                                >
                                    {/* Hapus */}
                                    <button
                                        onClick={() => handleDelete(leave.id)}
                                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-rose-500 clay-button rounded-[12px] transition-all z-20"
                                        title="Hapus"
                                    >
                                        <Trash2 size={13} />
                                    </button>

                                    <div className="relative shrink-0 flex items-center justify-center h-11 w-11 rounded-full overflow-hidden clay-surface group-hover:scale-105 transition-transform duration-200 z-10">
                                        {leave.avatar && leave.avatar !== "/avatars/default.png" ? (
                                            <img src={leave.avatar} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                        ) : null}
                                        <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider relative z-10">
                                            {leave.doctor?.[0] || 'D'}
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1 flex flex-col justify-center pr-8 relative z-10">
                                        <div className="flex items-center gap-2 mb-1.5 w-full flex-wrap">
                                            <h4 className="font-black text-[14px] sm:text-[15px] text-zinc-800 dark:text-zinc-100 truncate tracking-tight">
                                                {leave.doctor}
                                            </h4>
                                            
                                            {isOngoing && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full clay-pill-emerald text-white">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-wider">Sedang Cuti</span>
                                                </div>
                                            )}
                                            {isUpcoming && (
                                                <div className="flex items-center px-2 py-0.5 rounded-full clay-pill-blue text-white">
                                                    <span className="text-[9px] font-black uppercase tracking-wider">Akan Datang</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-[8px] font-black tracking-wide shrink-0 clay-inset text-zinc-700 dark:text-zinc-300">
                                                    <span>{conf.emoji}</span> {leave.type}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                                                    <Clock size={12} className="text-zinc-400" />
                                                    <span>{dateStr}</span>
                                                </div>
                                            </div>
                                            {leave.reason && (
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold italic mt-0.5 truncate max-w-[90%]">
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
                            <div className="w-24 h-24 mb-6 rounded-[28px] clay-surface flex items-center justify-center text-4xl select-none animate-bounce" style={{ animationDuration: '4s' }}>
                                🏖️
                            </div>
                            <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100 tracking-tight mb-1.5">Semua Dokter Tersedia</h3>
                            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 max-w-[260px] leading-relaxed">
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

            <AiLeaveImportModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                doctors={doctors}
                onSuccess={() => onRefresh()}
            />
        </div>
    );
}
