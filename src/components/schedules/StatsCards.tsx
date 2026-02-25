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
    blue: { glow: "bg-blue-500/5", icon: "bg-blue-50 text-blue-500", progressBg: "bg-slate-100", progressBar: "btn-gradient" },
    violet: { glow: "bg-violet-500/5", icon: "bg-violet-50 text-violet-500", progressBg: "", progressBar: "" },
    emerald: { glow: "bg-emerald-500/5", icon: "bg-emerald-50 text-emerald-500", progressBg: "", progressBar: "" },
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
            label: "Bertugas",
            value: safeStats.activeDoctors,
            sub: `/ ${safeStats.totalDoctors}`,
            icon: BriefcaseMedical,
            color: "blue",
            progress: safeStats.totalDoctors > 0 ? (safeStats.activeDoctors / safeStats.totalDoctors) * 100 : 0,
        },
        {
            label: "Cuti",
            value: safeStats.onLeave,
            sub: "dokter",
            icon: FileClock,
            color: "violet",
        },
        {
            label: "Efisiensi",
            value: `${safeStats.efficiency}%`,
            sub: "+2.4%", // This could be dynamic later if we have historical data
            subColor: "text-emerald-500",
            icon: CheckCircle2,
            color: "emerald",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((card) => {
                const c = COLOR_MAP[card.color];
                return (
                    <div key={card.label} className="super-glass-card rounded-3xl p-6 group">
                        <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${c.glow} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{card.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-foreground tracking-tight">{card.value}</span>
                                    <span className={`text-xs font-semibold ${card.subColor || 'text-muted-foreground'}`}>{card.sub}</span>
                                </div>
                            </div>
                            <div className={`h-12 w-12 rounded-2xl ${c.icon} flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_14px_rgba(0,0,0,0.05)] backdrop-blur-md`}>
                                <card.icon className="h-6 w-6" />
                            </div>
                        </div>
                        {card.progress !== undefined && (
                            <div className={`mt-5 h-1.5 w-full rounded-full ${c.progressBg} overflow-hidden`}>
                                <div className={`h-full rounded-full ${c.progressBar} transition-all duration-1000 ease-out`} style={{ width: `${card.progress}%` }} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
