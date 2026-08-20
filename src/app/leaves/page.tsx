"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { LeaveCalendar } from "@/features/leaves/components/LeaveCalendar";
import { Search, CalendarDays, Loader2 } from "lucide-react";
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
    const debouncedSearch = useDebounce(searchQuery, 400); // 400ms delay for visual feedback
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

    const { onLeaveToday, cutiBuilanIni } = useMemo(() => {
        const now = new Date();
        const onLeaveToday = leaves.filter(l => isDateInLeave(now, l)).length;
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const cutiBuilanIni = leaves.filter(l => {
            for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
                if (isDateInLeave(new Date(d), l)) return true;
            }
            return false;
        }).length;

        return { onLeaveToday, cutiBuilanIni };
    }, [leaves, totalLeaves]);

    const filteredLeaves = useMemo(() =>
        debouncedSearch === ""
            ? leaves
            : leaves.filter(l => (l.doctor || "").toLowerCase().includes(debouncedSearch.toLowerCase())),
        [leaves, debouncedSearch]
    );

    return (
        <div className="flex-1 w-full flex flex-col h-[calc(100vh-1rem)] overflow-hidden relative bg-[#F4F4F6] dark:bg-[#0B0D13] text-zinc-900 dark:text-zinc-100">
            <div className="relative z-10 flex flex-col h-full w-full">
                <PageHeader
                  icon={<CalendarDays size={20} className="text-white" />}
                  title="Jadwal Cuti"
                  subtitle="Kelola jadwal cuti dokter"
                  iconGradient="from-emerald-500 to-teal-600"
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
                        className="w-full bg-white dark:bg-[#131620] border border-zinc-200 dark:border-[#232736] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none rounded-xl pl-10 pr-3.5 py-2 focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>
                  }
                />

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
