"use client";

import { useState, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Calendar as CalendarIcon,
  Clock,
  Download,
  Trash2,
  CalendarCheck,
  Sparkles,
  Flag,
  ListOrdered,
  CalendarRange,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaveRequest, Doctor } from "@/lib/data-service";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { AiLeaveImportModal } from "./AiLeaveImportModal";
import { getIndonesianHoliday, formatDateKey } from "@/lib/holidays";
import useSWR, { mutate } from "swr";

interface LeaveCalendarProps {
  leaves: LeaveRequest[];
  onRefresh: () => void;
  onOpenAll?: () => void;
  totalLeaves?: number;
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const TYPE_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  Sakit: { color: "text-red-600 dark:text-red-400", bg: "clay-pill-rose", emoji: "🤒" },
  Liburan: { color: "text-emerald-600 dark:text-emerald-400", bg: "clay-pill-emerald", emoji: "🏖" },
  Konferensi: { color: "text-purple-600 dark:text-purple-400", bg: "clay-pill-violet", emoji: "🎤" },
  Pribadi: { color: "text-blue-600 dark:text-blue-400", bg: "clay-pill-blue", emoji: "👤" },
  Lainnya: { color: "text-amber-600 dark:text-amber-400", bg: "clay-pill-amber", emoji: "📋" },
  "Sick Leave": { color: "text-red-600 dark:text-red-400", bg: "clay-pill-rose", emoji: "🤒" },
  Vacation: { color: "text-emerald-600 dark:text-emerald-400", bg: "clay-pill-emerald", emoji: "🏖" },
  Conference: { color: "text-purple-600 dark:text-purple-400", bg: "clay-pill-violet", emoji: "🎤" },
  Personal: { color: "text-blue-600 dark:text-blue-400", bg: "clay-pill-blue", emoji: "👤" },
};

export function LeaveCalendar({ leaves, onRefresh, onOpenAll, totalLeaves = 0 }: LeaveCalendarProps) {
  const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"selected_day" | "all_agenda">("selected_day");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [agendaSearch, setAgendaSearch] = useState("");
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
    const res = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Gagal menyimpan cuti');
    }
    onRefresh();
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
      const parsedLeaves = lines
        .filter((l) => l.trim())
        .map((line) => {
          const [doctor, type, start, end] = line.split(',').map((s) => s.trim());
          if (!doctor || !start) return null;
          return {
            doctor,
            type: type || 'Lainnya',
            dates: end ? `${start} - ${end}` : start,
            startDate: start,
            endDate: end || start,
            avatar: "/avatars/default.png",
          };
        })
        .filter(Boolean);

      if (parsedLeaves.length > 0) {
        try {
          const res = await fetch('/api/leaves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedLeaves),
          });
          if (!res.ok) throw new Error('Gagal mengimpor data cuti');
          onRefresh();
          alert(`Berhasil mengimpor ${parsedLeaves.length} data cuti.`);
        } catch (err: any) {
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

  // Leaves active on selected date
  const activeLeavesOnSelectedDate = useMemo(() => {
    return leaves.filter((l) => {
      if (!isDateInLeave(selectedDate, l)) return false;
      if (selectedFilter && l.type !== selectedFilter) return false;
      return true;
    });
  }, [leaves, selectedDate, selectedFilter]);

  // All upcoming / sorted leaves
  const allAgendaLeaves = useMemo(() => {
    let list = [...leaves];
    if (agendaSearch) {
      list = list.filter((l) => (l.doctor || "").toLowerCase().includes(agendaSearch.toLowerCase()));
    }
    return list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [leaves, agendaSearch]);

  const selectedDateHoliday = getIndonesianHoliday(selectedDate);
  const selectedDateLabel = selectedDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full overflow-y-auto lg:overflow-hidden pb-32 lg:pb-0 custom-scrollbar pr-1 lg:pr-0">
      {/* ══════════ KIRI: KALENDER INTERAKTIF & TOOLBAR ══════════ */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col gap-3 lg:overflow-y-auto lg:custom-scrollbar lg:pb-4 lg:pr-1">
        <div className="rounded-[28px] lg:rounded-[32px] p-4 sm:p-5 lg:p-6 clay-surface flex-shrink-0 shadow-lg border border-zinc-200/50 dark:border-white/5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {MONTHS_ID[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-1 clay-inset rounded-[18px] p-1">
              <button
                onClick={prevMonth}
                className="p-2 clay-button rounded-[12px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-95"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft size={15} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                className="px-2.5 py-1 text-[10.5px] font-black text-emerald-600 dark:text-emerald-400 clay-button rounded-[12px] transition-all uppercase tracking-wider active:scale-95"
              >
                Hari Ini
              </button>
              <button
                onClick={nextMonth}
                className="p-2 clay-button rounded-[12px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-95"
                title="Bulan Berikutnya"
              >
                <ChevronRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Day Headers (Minggu in red) */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d, idx) => (
              <div
                key={d}
                className={cn(
                  "text-center text-[10.5px] font-black py-1 uppercase tracking-wider",
                  idx === 0 ? "text-rose-500 font-black" : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid with National Holiday & Cuti Highlights */}
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((date, i) => {
              if (!date) return <div key={`e-${i}`} className="aspect-square" />;

              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const hasLeave = leaves.some((l) => isDateInLeave(date, l));
              const holidayInfo = getIndonesianHoliday(date);

              return (
                <button
                  key={`d-${i}`}
                  onClick={() => setSelectedDate(date)}
                  title={holidayInfo.name ? `${holidayInfo.name}` : undefined}
                  className={cn(
                    "aspect-square rounded-[16px] sm:rounded-[18px] flex flex-col items-center justify-center relative transition-all duration-150 text-xs sm:text-sm font-black overflow-hidden active:scale-95",
                    isSelected
                      ? "clay-pill-emerald text-white shadow-md scale-105 z-10"
                      : isToday
                        ? "clay-surface text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/80"
                        : "clay-button hover:scale-[1.02]",
                    holidayInfo.isTanggalMerah && !isSelected && "text-rose-600 dark:text-rose-400"
                  )}
                >
                  <span className="relative z-10 leading-none">{date.getDate()}</span>

                  {/* Dots for Cuti & Libur Nasional */}
                  <div className="flex items-center gap-0.5 absolute bottom-1">
                    {hasLeave && (
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          isSelected ? "bg-white shadow-sm" : "clay-pill-amber"
                        )}
                      />
                    )}
                    {holidayInfo.isHoliday && (
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isSelected ? "bg-rose-200" : "bg-rose-500"
                        )}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legenda Kalender Indonesia */}
          <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between text-[10.5px] text-zinc-500 dark:text-zinc-400 font-black">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Tanggal Merah / Libur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full clay-pill-amber" />
              <span>Ada Cuti</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full clay-pill-emerald" />
              <span>Terpilih</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar — Compact 3D Clay Grid */}
        <div className="clay-surface rounded-[24px] p-3 shadow-md space-y-2 border border-zinc-200/50 dark:border-white/5">
          <div className="grid grid-cols-2 gap-2">
            {/* AI Smart Import */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="py-2.5 px-3 rounded-[16px] clay-pill-violet text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Sparkles size={14} className="text-violet-200 shrink-0" />
              <span>Input AI (WA)</span>
            </button>

            {/* Tambah Manual */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-2.5 px-3 rounded-[16px] clay-pill-emerald text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} className="shrink-0" />
              <span>Tambah Cuti</span>
            </button>
          </div>

          {/* CSV Tools */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/40 dark:border-white/5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-1.5 rounded-[12px] clay-button text-[10.5px] font-black text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              <Upload size={12} /> Import CSV
            </button>
            <button
              onClick={handleDownloadFormat}
              className="flex-1 py-1.5 rounded-[12px] clay-button text-[10.5px] font-black text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              <Download size={12} /> Format CSV
            </button>
          </div>
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* ══════════ KANAN: TAB PANEL DOKTER CUTI & SEMUA AGENDA ══════════ */}
      <div className="flex-1 rounded-[28px] lg:rounded-[32px] p-4 sm:p-6 lg:p-7 clay-surface flex flex-col min-h-[480px] lg:min-h-0 relative z-10 mb-8 lg:mb-0 transition-all shadow-lg border border-zinc-200/50 dark:border-white/5">
        {/* Header Panel Kanan: Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-200/50 dark:border-white/5 flex-none">
          {/* Tab buttons */}
          <div className="flex clay-inset p-1 rounded-[16px] items-center gap-1">
            <button
              onClick={() => setActiveTab("selected_day")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-black transition-all",
                activeTab === "selected_day"
                  ? "clay-pill-emerald text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <CalendarCheck size={14} strokeWidth={2.5} />
              <span>Tanggal Terpilih</span>
            </button>
            <button
              onClick={() => setActiveTab("all_agenda")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-black transition-all",
                activeTab === "all_agenda"
                  ? "clay-pill-emerald text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <CalendarRange size={14} strokeWidth={2.5} />
              <span>Semua Agenda ({leaves.length})</span>
            </button>
          </div>

          {/* Status Counter */}
          {activeTab === "selected_day" ? (
            <span className={cn(
              "text-xs font-black px-3 py-1 rounded-full shadow-sm",
              activeLeavesOnSelectedDate.length > 0 ? "clay-pill-amber text-white" : "clay-pill-blue text-white"
            )}>
              {activeLeavesOnSelectedDate.length > 0
                ? `${activeLeavesOnSelectedDate.length} Dokter Cuti`
                : "Semua Bertugas"}
            </span>
          ) : (
            <div className="relative flex items-center w-full sm:w-[200px]">
              <Search size={13} className="absolute left-3 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari agenda..."
                value={agendaSearch}
                onChange={(e) => setAgendaSearch(e.target.value)}
                className="w-full clay-inset text-[11.5px] font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 rounded-[12px] pl-8 pr-2.5 py-1.5 outline-none"
              />
            </div>
          )}
        </div>

        {/* ─── TAB CONTENT: TANGGAL TERPILIH ─── */}
        {activeTab === "selected_day" ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* National Holiday Banner if today is a public holiday */}
            {selectedDateHoliday.isHoliday && (
              <div className="p-3 rounded-[20px] clay-surface bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-[12px] clay-icon-rose flex items-center justify-center text-white shrink-0">
                  <Flag size={15} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                    Hari Libur Nasional Indonesia
                  </p>
                  <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate mt-0.5">
                    {selectedDateHoliday.name}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Category Filter */}
            {leaves.some((l) => isDateInLeave(selectedDate, l)) && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedFilter(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10.5px] font-black transition-all active:scale-95",
                    selectedFilter === null ? "clay-pill-emerald text-white" : "clay-button text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  Semua
                </button>
                {Array.from(new Set(leaves.filter((l) => isDateInLeave(selectedDate, l)).map((l) => l.type))).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedFilter(type)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10.5px] font-black transition-all flex items-center gap-1 active:scale-95",
                      selectedFilter === type ? "clay-pill-emerald text-white" : "clay-button text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    <span>{TYPE_CONFIG[type]?.emoji || '📋'}</span> {type}
                  </button>
                ))}
              </div>
            )}

            {/* Active Doctors on Leave for Selected Date */}
            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
              {activeLeavesOnSelectedDate.length > 0 ? (
                activeLeavesOnSelectedDate.map((leave) => {
                  const conf = TYPE_CONFIG[leave.type] || { color: "text-zinc-600", bg: "clay-button", emoji: "📋" };
                  const startDt = new Date(leave.startDate);
                  const endDt = leave.endDate ? new Date(leave.endDate) : null;
                  let dateStr = startDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  if (endDt && endDt > startDt) {
                    dateStr += ` - ${endDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
                  }

                  const isOngoing = isDateInLeave(new Date(), leave);

                  return (
                    <div
                      key={leave.id}
                      className="group relative flex items-center gap-3 p-3.5 rounded-[22px] clay-button hover:-translate-y-0.5 transition-all text-left"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-[14px] clay-icon-emerald text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        <span>{leave.doctor?.[0] || 'D'}</span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1 pr-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-xs sm:text-[13.5px] text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                            {leave.doctor}
                          </h4>
                          {isOngoing && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full clay-pill-emerald text-white text-[9px] font-black uppercase">
                              Sedang Cuti
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-[8px] font-black clay-inset text-zinc-700 dark:text-zinc-300">
                            <span>{conf.emoji}</span> {leave.type}
                          </span>
                          <span className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <Clock size={11} className="text-zinc-400" />
                            {dateStr}
                          </span>
                        </div>

                        {leave.reason && (
                          <p className="text-[10.5px] text-zinc-400 font-bold italic mt-1 truncate">
                            &quot;{leave.reason}&quot;
                          </p>
                        )}
                      </div>

                      {/* Action Delete */}
                      <button
                        onClick={() => handleDelete(leave.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-600 clay-button rounded-[10px] transition-all absolute right-3 top-3.5 active:scale-90"
                        title="Hapus Cuti"
                      >
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-2">
                  <div className="w-16 h-16 rounded-[22px] clay-surface flex items-center justify-center text-3xl select-none mb-1">
                    🏖️
                  </div>
                  <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100">
                    Semua Dokter Bertugas
                  </h3>
                  <p className="text-xs font-bold text-zinc-400 max-w-[240px]">
                    Tidak ada dokter yang mengajukan cuti pada {selectedDateLabel}.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─── TAB CONTENT: SEMUA AGENDA CUTI ─── */
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {allAgendaLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-zinc-400 text-xs font-bold">
                Tidak ada data agenda cuti ditemukan.
              </div>
            ) : (
              allAgendaLeaves.map((leave) => {
                const conf = TYPE_CONFIG[leave.type] || { emoji: "📋" };
                const startDt = new Date(leave.startDate);
                const endDt = leave.endDate ? new Date(leave.endDate) : null;
                const isOngoing = isDateInLeave(new Date(), leave);

                return (
                  <div
                    key={leave.id}
                    className="group flex items-center justify-between p-3 rounded-[20px] clay-button hover:-translate-y-0.5 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[12px] clay-icon-emerald text-white flex items-center justify-center font-black text-xs shrink-0">
                        <span>{leave.doctor?.[0] || 'D'}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {leave.doctor}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                          {startDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          {endDt && ` - ${endDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9.5px] font-black px-2 py-0.5 rounded-[8px] clay-inset text-zinc-700 dark:text-zinc-300">
                        {conf.emoji} {leave.type}
                      </span>
                      {isOngoing && (
                        <span className="px-2 py-0.5 rounded-full clay-pill-emerald text-white text-[8.5px] font-black uppercase">
                          Aktif
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(leave.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-600 clay-button rounded-[8px] transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
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
        onSuccess={async () => {
          await onRefresh();
          mutate('/api/doctors');
          mutate('/api/shifts');
        }}
      />
    </div>
  );
}
