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

    const todayLeaves = leaves.filter(l => isDateInLeave(today, l.dates));
    const upcomingLeaves = leaves
        .filter(l => {
            const dateStr = l.dates.includes(' - ') ? l.dates.split(' - ')[0] : l.dates;
            const d = new Date(dateStr);
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cuti Hari Ini</p>
                {todayLeaves.length === 0 ? (
                    <div className="flex items-center gap-2 py-3 px-3 bg-emerald-50 rounded-xl">
                        <CalendarDays className="h-4 w-4 text-emerald-400" />
                        <p className="text-xs text-emerald-600 font-semibold">Semua dokter tersedia</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {todayLeaves.map(l => {
                            const conf = TYPE_CONFIG[l.type] || { color: "text-slate-500", bg: "bg-slate-50", emoji: "📋" };
                            return (
                                <div key={l.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                                    <Avatar className="h-8 w-8 rounded-xl flex-shrink-0">
                                        <AvatarImage src={l.avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] text-white font-black rounded-xl">
                                            {l.doctor[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-700 truncate">{l.doctor}</p>
                                        <p className="text-[10px] text-slate-400">{conf.emoji} {l.type}</p>
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Akan Datang</p>
                    <div className="space-y-2">
                        {upcomingLeaves.map(l => {
                            const conf = TYPE_CONFIG[l.type] || { color: "text-slate-500", bg: "bg-slate-50", emoji: "📋" };
                            return (
                                <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                    <Avatar className="h-8 w-8 rounded-xl flex-shrink-0">
                                        <AvatarImage src={l.avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-700 text-[10px] text-white font-black rounded-xl">
                                            {l.doctor[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-700 truncate">{l.doctor}</p>
                                        <p className="text-[10px] text-slate-400">{l.dates}</p>
                                    </div>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${conf.color} ${conf.bg}`}>
                                        {conf.emoji}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
