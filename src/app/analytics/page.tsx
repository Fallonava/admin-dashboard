"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    BarChart3,
    TrendingUp,
    Users,
    Clock,
    Activity,
    Download,
    Calendar,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Doctor, LeaveRequest, Shift } from "@/lib/data-service";
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
    Legend
} from "recharts";

// Mock Data for Charts (since we don't have historical data in the API yet)
const visitData = [
    { name: 'Senin', visits: 120, target: 100 },
    { name: 'Selasa', visits: 145, target: 110 },
    { name: 'Rabu', visits: 130, target: 110 },
    { name: 'Kamis', visits: 170, target: 120 },
    { name: 'Jumat', visits: 190, target: 130 },
    { name: 'Sabtu', visits: 210, target: 150 },
    { name: 'Minggu', visits: 150, target: 140 },
];

const workloadData = [
    { name: 'Poli Umum', load: 85, ideal: 75 },
    { name: 'Gigi', load: 60, ideal: 70 },
    { name: 'Anak', load: 90, ideal: 80 },
    { name: 'Kandungan', load: 75, ideal: 65 },
    { name: 'Mata', load: 45, ideal: 50 },
];

export default function AnalyticsPage() {
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const { data: shifts = [] } = useSWR<Shift[]>('/api/shifts');
    const [timeRange, setTimeRange] = useState("7 Hari Terakhir");

    // Calculate some real stats from current data
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(d => d.status === 'BUKA' || d.status === 'PENUH').length;
    const utilizationRate = totalDoctors > 0 ? Math.round((activeDoctors / totalDoctors) * 100) : 0;

    return (
        <div className="absolute inset-x-0 inset-y-4 px-2 lg:px-6 flex flex-col overflow-hidden">
            {/* ── Header ────────────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 flex-shrink-0">
                <div className="flex items-baseline gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-[0_4px_14px_0_rgba(0,92,255,0.39)] text-white mr-2">
                        <BarChart3 size={24} />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gradient pb-1">Analytics</h1>
                    <span className="text-slate-500 text-sm font-semibold hidden sm:inline-block">Daskbor Performa</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Time Filter */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative flex items-center bg-white/60 backdrop-blur-xl rounded-2xl p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_10px_-3px_rgba(0,0,0,0.02)] border border-white/50">
                            {["Hari Ini", "7 Hari Terakhir", "Bulan Ini"].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                                        timeRange === range
                                            ? "bg-white text-blue-600 shadow-sm scale-105"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export Button */}
                    <button className="btn-gradient p-2.5 px-4 rounded-2xl text-white font-bold flex items-center gap-2 text-sm shadow-[0_4px_14px_0_rgba(0,92,255,0.39)] hover:scale-105 transition-transform group relative overflow-hidden">
                        <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-shimmer" />
                        <Download size={18} className="relative z-10" />
                        <span className="relative z-10 hidden sm:inline">Export Report</span>
                    </button>
                </div>
            </header>

            {/* ── Main Scrollable Content ────────────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-6">

                {/* Top Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Stat 1 */}
                    <div className="super-glass-card p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/60 text-blue-600 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md">
                                <Users size={22} strokeWidth={2.5} />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                <TrendingUp size={12} strokeWidth={3} />
                                +12.5%
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 mb-1 relative z-10">Total Kunjungan Pasien</h3>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black text-slate-800 tracking-tight">1,248</span>
                            <span className="text-xs font-medium text-slate-400">minggu ini</span>
                        </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="super-glass-card p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/60 text-emerald-600 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md">
                                <Clock size={22} strokeWidth={2.5} />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                <TrendingUp size={12} strokeWidth={3} className="rotate-180" />
                                -5.2%
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 mb-1 relative z-10">Rata-rata Waktu Tunggu</h3>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black text-slate-800 tracking-tight">14<span className="text-xl">m</span></span>
                            <span className="text-xs font-medium text-slate-400">per pasien</span>
                        </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="super-glass-card p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/60 text-purple-600 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md">
                                <Activity size={22} strokeWidth={2.5} />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                <TrendingUp size={12} strokeWidth={3} />
                                +2.4%
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 mb-1 relative z-10">Utilisasi Dokter Aktif</h3>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black text-slate-800 tracking-tight">{utilizationRate}%</span>
                            <span className="text-xs font-medium text-slate-400">{activeDoctors} / {totalDoctors} dokter</span>
                        </div>
                    </div>

                    {/* Stat 4 */}
                    <div className="super-glass-card p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-rose-500/20 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/60 text-rose-600 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md">
                                <Activity size={22} strokeWidth={2.5} />
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 mb-1 relative z-10">Kepuasan Pelayanan</h3>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black text-slate-800 tracking-tight">4.8</span>
                            <span className="text-xs font-medium text-slate-400">/ 5.0</span>
                        </div>
                    </div>
                </div>

                {/* Charts Container */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Main Area Chart */}
                    <div className="xl:col-span-2 super-glass-card p-6 rounded-[32px] shadow-sm border border-white/50">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">Tren Kunjungan Pasien</h2>
                                <p className="text-xs font-medium text-slate-400">Berdasarkan data operasional mingguan</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> Aktual</div>
                                <div className="flex items-center gap-1.5 ml-3"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Target</div>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    />
                                    <Tooltip
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
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorVisits)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb', style: { filter: 'drop-shadow(0px 0px 5px rgba(37,99,235,0.8))' } }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="target"
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
                    </div>
                </div>

                {/* Live Patient Pipeline */}
                <div className="super-glass-card p-6 rounded-[32px] shadow-sm border border-white/50 relative overflow-hidden mt-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                Live Patient Pipeline
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                            </h2>
                            <p className="text-xs font-medium text-slate-400">Antrian berjalan di seluruh poliklinik</p>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-white px-3 py-1.5 rounded-xl transition-colors shadow-sm border border-blue-100/50">
                            Lihat Semua
                        </button>
                    </div>

                    <div className="space-y-3 relative z-10">
                        {activeDoctors > 0 ? doctors.filter(d => d.status === 'BUKA' || d.status === 'PENUH').slice(0, 4).map((doc, i) => (
                            <div key={doc.id} className="group flex items-center justify-between p-4 bg-white/40 hover:bg-white/80 rounded-2xl border border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                        {doc.image ? (
                                            <AvatarImage src={doc.image} alt={doc.name} className="object-cover" />
                                        ) : (
                                            <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-indigo-500 text-white text-xs font-bold">{doc.queueCode || doc.name.charAt(0)}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.name}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">{doc.specialty}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">EST. WAKTU</p>
                                        <p className="text-xs font-bold text-slate-700">{15 + (i * 5)} min</p>
                                    </div>
                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner hidden md:block">
                                        <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" style={{ width: `${80 - (i * 15)}%` }}></div>
                                    </div>
                                    <div className={cn("px-3 py-1 rounded-xl text-xs font-bold shadow-sm whitespace-nowrap", doc.status === 'BUKA' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100")}>
                                        {doc.status === 'BUKA' ? 'TERIMA PASIEN' : 'ANTRIAN PENUH'}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                                <Clock size={32} className="opacity-20 mb-2" />
                                <p className="text-sm font-bold">Belum ada aktivitas poliklinik</p>
                                <p className="text-xs font-medium">Data antrian live akan muncul di sini</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
