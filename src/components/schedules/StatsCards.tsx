import { BriefcaseMedical, FileClock, CheckCircle2 } from "lucide-react";

interface StatsCardsProps {
    stats?: {
        activeDoctors: number;
        totalDoctors: number;
        onLeave: number;
        efficiency: number;
    };
}

const COLOR_MAP: Record<string, { glow: string; icon: string; progressBg: string; progressBar: string }> = {
    blue: { glow: "bg-blue-500/10", icon: "bg-blue-500/10 text-blue-400", progressBg: "bg-slate-800", progressBar: "bg-blue-500" },
    violet: { glow: "bg-violet-500/10", icon: "bg-violet-500/10 text-violet-400", progressBg: "", progressBar: "" },
    emerald: { glow: "bg-emerald-500/10", icon: "bg-emerald-500/10 text-emerald-400", progressBg: "", progressBar: "" },
};

export function StatsCards({ stats }: StatsCardsProps) {
    const safeStats = stats || {
        activeDoctors: 0,
        totalDoctors: 0,
        onLeave: 0,
        efficiency: 0,
    };

    const cards = [
        {
            label: "On Duty",
            value: safeStats.activeDoctors,
            sub: `/ ${safeStats.totalDoctors}`,
            icon: BriefcaseMedical,
            color: "blue",
            progress: safeStats.totalDoctors > 0 ? (safeStats.activeDoctors / safeStats.totalDoctors) * 100 : 0,
        },
        {
            label: "On Leave",
            value: safeStats.onLeave,
            sub: "doctors",
            icon: FileClock,
            color: "violet",
        },
        {
            label: "Efficiency",
            value: `${safeStats.efficiency}%`,
            sub: "+2.4%", // This could be dynamic later if we have historical data
            subColor: "text-emerald-400",
            icon: CheckCircle2,
            color: "emerald",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {cards.map((card) => {
                const c = COLOR_MAP[card.color];
                return (
                    <div key={card.label} className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-slate-950/40 p-5 backdrop-blur-xl group hover:bg-white/[0.02] transition-all">
                        <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${c.glow} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">{card.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white">{card.value}</span>
                                    <span className={`text-xs font-medium ${card.subColor || 'text-slate-500'}`}>{card.sub}</span>
                                </div>
                            </div>
                            <div className={`h-10 w-10 rounded-xl ${c.icon} flex items-center justify-center`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                        {card.progress !== undefined && (
                            <div className={`mt-4 h-1 w-full rounded-full ${c.progressBg}`}>
                                <div className={`h-full rounded-full ${c.progressBar} transition-all`} style={{ width: `${card.progress}%` }} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
