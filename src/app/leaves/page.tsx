"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { LeaveCalendar } from "@/components/leaves/LeaveCalendar";
import { Search, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaveRequest, Doctor } from "@/lib/data-service";
import { AllLeavesModal } from "@/components/leaves/AllLeavesModal";
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
        <div className="flex-1 w-full flex flex-col h-[calc(100vh-1rem)] overflow-hidden bg-slate-50/50">
            <PageHeader
              icon={<CalendarDays size={20} className="text-white" />}
              title="Jadwal Cuti"
              accentWord="Cuti"
              accentColor="text-emerald-600"
              subtitle="Kelola jadwal cuti dokter"
              iconGradient="from-emerald-500 to-teal-600"
              accentBarGradient="from-emerald-500 via-teal-500 to-cyan-500"
              actions={
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition duration-500" />
                  <div className="relative flex items-center w-full sm:w-[260px]">
                    {isSearching ? (
                      <Loader2 className="absolute left-4 text-blue-500 h-4 w-4 animate-spin shrink-0" />
                    ) : (
                      <Search className="absolute left-4 text-slate-400 h-4 w-4 shrink-0" />
                    )}
                    <input
                      type="text"
                      placeholder="Cari nama dokter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 placeholder:text-slate-400 text-sm font-semibold text-slate-700 outline-none rounded-xl pl-11 pr-4 py-2 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
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
    );
}
