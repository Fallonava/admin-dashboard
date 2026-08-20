"use client";

import { useState, useMemo, useDeferredValue } from "react";
import useSWR, { mutate } from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { LeaveCalendar } from "@/features/leaves/components/LeaveCalendar";
import { Search, CalendarDays, Loader2, UserMinus, CalendarCheck2, Activity, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaveRequest, Doctor } from "@/lib/data-service";
import { AllLeavesModal } from "@/features/leaves/components/AllLeavesModal";
import { PageHeader } from "@/components/ui/PageHeader";

export default function LeavesPage() {
  const { data: rawLeaves, mutate: mutateLeaves } = useSWR<LeaveRequest[]>('/api/leaves');
  const { data: rawDoctors } = useSWR<Doctor[]>('/api/doctors');

  const leaves = Array.isArray(rawLeaves) ? rawLeaves : [];
  const doctors = Array.isArray(rawDoctors) ? rawDoctors : [];
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const isSearching = searchQuery !== debouncedSearch;
  const [isAllLeavesOpen, setIsAllLeavesOpen] = useState(false);

  const totalLeaves = leaves.length;

  function isDateInLeave(checkDate: Date, leave: LeaveRequest) {
    const target = new Date(checkDate);
    target.setHours(0, 0, 0, 0);

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return target >= start && target <= end;
  }

  const { onLeaveToday, cutiBulanIni, upcomingLeaves } = useMemo(() => {
    const now = new Date();
    const todayAtMidnight = new Date();
    todayAtMidnight.setHours(0, 0, 0, 0);

    const onLeaveToday = leaves.filter((l) => isDateInLeave(now, l)).length;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const cutiBulanIni = leaves.filter((l) => {
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        if (isDateInLeave(new Date(d), l)) return true;
      }
      return false;
    }).length;

    const upcomingLeaves = leaves.filter((l) => {
      const start = new Date(l.startDate);
      start.setHours(0, 0, 0, 0);
      return start > todayAtMidnight;
    }).length;

    return { onLeaveToday, cutiBulanIni, upcomingLeaves };
  }, [leaves]);

  const filteredLeaves = useMemo(
    () =>
      deferredSearch === ""
        ? leaves
        : leaves.filter((l) => (l.doctor || "").toLowerCase().includes(deferredSearch.toLowerCase())),
    [leaves, deferredSearch]
  );

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-hidden relative bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100">
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Page Header */}
        <PageHeader
          icon={<CalendarDays size={22} className="text-white" strokeWidth={2.5} />}
          title="Jadwal Cuti"
          accentWord="Cuti"
          accentColor="text-emerald-600 dark:text-emerald-400"
          subtitle="Kelola pengajuan, jadwal libur, dan cuti dokter"
          iconClay="clay-icon-emerald"
          accentBarGradient="from-emerald-500 via-teal-500 to-cyan-400"
          actions={
            <div className="relative flex items-center w-full sm:w-[260px]">
              {isSearching ? (
                <Loader2 className="absolute left-3.5 text-emerald-500 h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Search className="absolute left-3.5 text-zinc-400 h-4 w-4 shrink-0" />
              )}
              <input
                type="text"
                placeholder="Cari nama dokter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full clay-inset placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs font-black text-zinc-900 dark:text-zinc-100 outline-none rounded-[16px] pl-10 pr-3.5 py-2.5 transition-all focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          }
        />

        {/* ═══ 3D CLAY KPI STATS BAR ═══ */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-3 flex-none">
          {/* Card 1: Sedang Cuti Hari Ini */}
          <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                Cuti Hari Ini
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {onLeaveToday}
                </span>
                <span className="text-[10.5px] font-bold text-zinc-400 hidden sm:inline">Dokter</span>
              </div>
            </div>
            <div className={cn(
              "w-9 h-9 sm:w-11 sm:h-11 rounded-[14px] sm:rounded-[16px] flex items-center justify-center text-white shrink-0 shadow-sm",
              onLeaveToday > 0 ? "clay-icon-amber" : "clay-icon-emerald"
            )}>
              <UserMinus size={18} strokeWidth={2.5} className="relative z-10" />
            </div>
          </div>

          {/* Card 2: Total Cuti Bulan Ini */}
          <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                Bulan Ini
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {cutiBulanIni}
                </span>
                <span className="text-[10.5px] font-bold text-zinc-400 hidden sm:inline">Pengajuan</span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[14px] sm:rounded-[16px] clay-icon-blue flex items-center justify-center text-white shrink-0 shadow-sm">
              <CalendarCheck2 size={18} strokeWidth={2.5} className="relative z-10" />
            </div>
          </div>

          {/* Card 3: Cuti Mendatang */}
          <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                Akan Datang
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {upcomingLeaves}
                </span>
                <span className="text-[10.5px] font-bold text-zinc-400 hidden sm:inline">Agenda</span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[14px] sm:rounded-[16px] clay-icon-violet flex items-center justify-center text-white shrink-0 shadow-sm">
              <Calendar size={18} strokeWidth={2.5} className="relative z-10" />
            </div>
          </div>
        </div>

        <AllLeavesModal
          isOpen={isAllLeavesOpen}
          onClose={() => setIsAllLeavesOpen(false)}
          leaves={leaves}
          onDelete={async (id: string) => {
            try {
              const res = await fetch(`/api/leaves?id=${id}`, { method: 'DELETE' });
              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Gagal menghapus cuti');
              }
              mutate('/api/leaves');
            } catch (err: any) {
              console.error("Gagal menghapus:", err);
              alert(err.message || "Gagal menghapus data cuti.");
            }
          }}
        />

        {/* ═══ CALENDAR CONTENT ═══ */}
        <div className="flex-1 min-h-0">
          <LeaveCalendar
            leaves={filteredLeaves}
            onRefresh={() => mutate('/api/leaves')}
            onOpenAll={() => setIsAllLeavesOpen(true)}
            totalLeaves={totalLeaves}
          />
        </div>
      </div>
    </div>
  );
}

