"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { ChevronRight } from "lucide-react";

// Pre-define days mapping for correct ordering
const WEEK_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

interface Shift {
    dayIdx: number;
    // ... other shift properties aren't strictly needed for just count
}

export function AnalyticsCharts({ shifts = [] }: { shifts?: Shift[] }) {
    // Dynamically calculate shift density per day
    const dynamicVisitData = WEEK_DAYS.map((dayName, idx) => {
        // dayIdx in Shift maps 1: Senin, 2: Selasa, ... 7: Minggu
        const count = shifts.filter(s => s.dayIdx === idx + 1).length;

        return {
            name: dayName,
            visits: count,
            // A mock target to show difference (could be an average or set goal)
            target: Math.max(10, Math.round(count * 0.8))
        };
    });

    const workloadData = [
        { name: 'Poli Umum', load: 85, ideal: 75 },
        { name: 'Gigi', load: 60, ideal: 70 },
        { name: 'Anak', load: 90, ideal: 80 },
        { name: 'Kandungan', load: 75, ideal: 65 },
        { name: 'Mata', load: 45, ideal: 50 },
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Main Area Chart */}
            <div className="xl:col-span-2 super-glass-card p-6 rounded-[32px] shadow-sm border border-white/50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Kepadatan Jadwal Mingguan</h2>
                        <p className="text-xs font-medium text-slate-400">Total sesi praktik berjalan per hari</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> Aktual</div>
                        <div className="flex items-center gap-1.5 ml-3"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Target Minimal</div>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dynamicVisitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                formatter={(value: number | string | Array<number | string> | undefined) => [value, 'Sesi Praktik']}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                                }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="visits"
                                name="Aktual"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorVisits)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb', style: { filter: 'drop-shadow(0px 0px 5px rgba(37,99,235,0.8))' } }}
                            />
                            <Area
                                type="monotone"
                                dataKey="target"
                                name="Target Minimal"
                                stroke="#cbd5e1"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                fill="none"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Workload Bar Chart */}
            <div className="super-glass-card p-6 rounded-[32px] shadow-sm border border-white/50 flex flex-col">
                <div className="mb-6">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Utilisasi Poliklinik</h2>
                    <p className="text-xs font-medium text-slate-400">Persentase beban kerja optimal</p>
                </div>

                <div className="flex-1 min-h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workloadData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Bar
                                dataKey="load"
                                fill="#8b5cf6"
                                radius={[0, 8, 8, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <button className="mt-4 w-full py-3 bg-white/50 hover:bg-white text-blue-600 rounded-2xl text-xs font-bold transition-colors border border-white shadow-sm flex items-center justify-center gap-2 group">
                    <span>Lihat Rincian Dokter</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div >
        </div >
    );
}
