import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import type { LeaveRequest } from "@/lib/data-service";

const TYPE_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
    'Sakit': { color: "text-red-600", bg: "bg-red-50", emoji: "🤒" },
    'Liburan': { color: "text-emerald-600", bg: "bg-emerald-50", emoji: "🏖" },
    'Konferensi': { color: "text-purple-600", bg: "bg-purple-50", emoji: "🎤" },
    'Pribadi': { color: "text-blue-600", bg: "bg-blue-50", emoji: "👤" },
    'Lainnya': { color: "text-slate-600", bg: "bg-slate-100", emoji: "📋" },
    'Sick Leave': { color: "text-red-600", bg: "bg-red-50", emoji: "🤒" },
    'Vacation': { color: "text-emerald-600", bg: "bg-emerald-50", emoji: "🏖" },
    'Conference': { color: "text-purple-600", bg: "bg-purple-50", emoji: "🎤" },
    'Personal': { color: "text-blue-600", bg: "bg-blue-50", emoji: "👤" },
};

export function LeaveRequests() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/leaves');
            if (res.ok) setLeaves(await res.json());
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
        const interval = setInterval(fetchLeaves, 10000);
        return () => clearInterval(interval);
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isDateInLeave = (checkDate: Date, leave: LeaveRequest) => {
        const target = new Date(checkDate);
        target.setHours(0, 0, 0, 0);

        const start = leave.startDate ? new Date(leave.startDate) : new Date();
        const end = leave.endDate ? new Date(leave.endDate) : new Date();

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        return target >= start && target <= end;
    };

    const todayLeaves = leaves.filter(l => isDateInLeave(today, l));
    const upcomingLeaves = leaves
        .filter(l => {
            if (!l.startDate) return false;
            const d = new Date(l.startDate);
            return !isNaN(d.getTime()) && d > today;
        })
        .slice(0, 5);

    if (isLoading && leaves.length === 0) {
        return (
            <div className="w-80 bg-white/60 backdrop-blur-xl p-6 h-full ml-6 hidden xl:flex items-center justify-center rounded-2xl">
                <Loader2 className="animate-spin text-slate-300" />
            </div>
        );
    }

    return (
        <div className="w-80 bg-white/60 backdrop-blur-xl p-5 h-full ml-5 hidden xl:flex flex-col gap-5 overflow-y-auto rounded-2xl shadow-sm">
            {/* Header */}
            <div>
                <h2 className="text-base font-black text-slate-800">Jadwal Cuti</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Hari ini & mendatang</p>
            </div>

            {/* Cuti hari ini */}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Cuti Hari Ini</p>
                {todayLeaves.length === 0 ? (
                    <div className="flex items-center gap-2 py-3 px-3 bg-emerald-50 rounded-xl">
                        <CalendarDays className="h-4 w-4 text-emerald-400" />
                        <p className="text-xs text-emerald-600 font-semibold">Semua dokter tersedia</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayLeaves.map(l => {
                            const conf = TYPE_CONFIG[l.type] || { color: "text-slate-500", bg: "bg-slate-50", emoji: "📋" };

                            // Map generic text colors to background variant
                            const ringColor = conf.color.replace('text-', 'ring-').replace('-600', '-600/20');
                            const bgColor = conf.color.replace('text-', 'bg-').replace('-600', '-100/60');

                            return (
                                <div key={l.id} className="group relative flex items-center gap-4 p-3 rounded-2xl bg-white hover:bg-slate-50/80 transition-all duration-300 border border-slate-100 hover:border-slate-200/60 shadow-sm hover:shadow-md">
                                    <div className="relative shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl overflow-hidden shadow-inner ring-1 ring-black/5 bg-gradient-to-br from-slate-700 to-slate-900 group-hover:scale-105 transition-transform duration-300 ease-out">
                                        {l.avatar ? (
                                            <img src={l.avatar} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                                        ) : null}
                                        <span className="text-xs font-black text-white/90 uppercase tracking-wider relative z-10">
                                            {l.doctor?.[0] || 'D'}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>

                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <h4 className="font-extrabold text-[13px] text-slate-800 truncate tracking-tight">
                                                {l.doctor || 'Unknown Doctor'}
                                            </h4>
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0 ${bgColor} ${conf.color} ring-1 ${ringColor} backdrop-blur-sm`}>
                                                <span>{conf.emoji}</span> {l.type}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] text-slate-400 font-medium italic truncate max-w-[120px]">
                                                {l.reason ? `"${l.reason}"` : "Cuti Hari Ini"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cuti mendatang */}
            {upcomingLeaves.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">Akan Datang</p>
                    <div className="space-y-3">
                        {upcomingLeaves.map(l => {
                            const conf = TYPE_CONFIG[l.type] || { color: "text-slate-500", bg: "bg-slate-50", emoji: "📋" };

                            const ringColor = conf.color.replace('text-', 'ring-').replace('-600', '-600/20');
                            const bgColor = conf.color.replace('text-', 'bg-').replace('-600', '-100/60');

                            const startDt = new Date(l.startDate);
                            const endDt = l.endDate ? new Date(l.endDate) : null;
                            let dateStr = startDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                            if (endDt && endDt > startDt) {
                                dateStr += ` — ${endDt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
                            }

                            return (
                                <div key={l.id} className="group relative flex items-center gap-4 p-3 rounded-2xl bg-white hover:bg-slate-50/80 transition-all duration-300 border border-slate-100/60 hover:border-slate-200/60 shadow-sm hover:shadow-md">
                                    <div className="relative shrink-0 flex items-center justify-center h-10 w-10 rounded-xl overflow-hidden shadow-inner ring-1 ring-black/5 bg-gradient-to-br from-slate-600 to-slate-800 group-hover:scale-105 transition-transform duration-300 ease-out">
                                        {l.avatar ? (
                                            <img src={l.avatar} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                                        ) : null}
                                        <span className="text-[10px] font-black text-white/90 uppercase tracking-wider relative z-10">
                                            {l.doctor?.[0] || 'D'}
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <h4 className="font-bold text-xs text-slate-800 truncate tracking-tight">
                                                {l.doctor || 'Unknown Doctor'}
                                            </h4>
                                            <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0 ${bgColor} ${conf.color} ring-1 ${ringColor} backdrop-blur-sm`}>
                                                <span>{conf.emoji}</span> {l.type}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                                <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>{dateStr}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
