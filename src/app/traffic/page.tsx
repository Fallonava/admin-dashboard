"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Activity,
  Users,
  Eye,
  Clock,
  Smartphone,
  Globe,
  Share2,
  RefreshCw,
  TrendingUp,
  Radio,
  Sparkles,
  Layers,
  Zap,
  BarChart3,
  ShieldCheck,
  Flame,
  MessageCircle,
  Laptop,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="clay-surface rounded-[18px] p-3 shadow-xl backdrop-blur-xl text-xs">
        <div className="font-black text-zinc-500 dark:text-zinc-400 mb-1.5 border-b border-zinc-200/50 dark:border-white/10 pb-1.5 flex items-center gap-1.5">
          <Sparkles size={11} className="text-indigo-500" />
          {label}
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-500 dark:text-zinc-400">{entry.name}:</span>
              </div>
              <span className="font-black font-mono text-zinc-900 dark:text-zinc-100">
                {entry.value.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function TrafficDashboardPage() {
  const [days, setDays] = useState<number>(7);
  const [selectedPath, setSelectedPath] = useState<string>("");

  const queryUrl = `/api/traffic/stats?days=${days}${selectedPath ? `&path=${encodeURIComponent(selectedPath)}` : ""}`;
  const { data, isLoading, mutate } = useSWR(queryUrl, fetcher, {
    refreshInterval: 8000,
  });

  const overview = data?.overview || {
    todayViews: 0,
    todayUniques: 0,
    totalViews: 0,
    totalUniques: 0,
    peakHour: "-",
  };

  const isScheduleOnly = selectedPath === "/jadwal";

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-hidden relative bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100">
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* ═══ PAGE HEADER ═══ */}
        <PageHeader
          icon={<Activity size={22} className="text-white" strokeWidth={2.5} />}
          title="Monitoring Trafik"
          accentWord="Trafik"
          subtitle="Analitik real-time kunjungan publik simed.fallonava.my.id/jadwal"
          iconClay="clay-icon-indigo"
          accentBarGradient="from-blue-600 via-indigo-600 to-violet-600"
          accentColor="text-indigo-600 dark:text-indigo-400"
          badge={
            <div className="flex items-center gap-2 clay-pill-emerald text-white px-3.5 py-1 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase">
                Live Engine Active
              </span>
            </div>
          }
          actions={
            <button
              onClick={() => mutate()}
              disabled={isLoading}
              className="clay-button text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-[14px] text-xs font-black flex items-center gap-2 active:scale-95 transition-all shadow-sm"
              title="Perbarui data analitik trafik sekarang"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin text-indigo-600" : "text-zinc-400"}
              />
              <span>{isLoading ? "Menyinkronkan..." : "Sync Live Data"}</span>
            </button>
          }
        />

        {/* ═══ SCROLLABLE CONTENT ═══ */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 sm:px-6 pb-32 lg:pb-10 pr-1">
          <div className="space-y-3 max-w-7xl mx-auto w-full">

            {/* ═══ 4 TOP KPI CARDS ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1: Views Hari Ini */}
              <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                    Views Hari Ini
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {overview.todayViews.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 hidden sm:inline">Tayangan</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp size={11} className="text-emerald-500" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {overview.todayUniques} Unik
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Eye size={17} strokeWidth={2.5} />
                </div>
              </div>

              {/* Card 2: Total Views */}
              <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                    Total ({days} Hari)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {overview.totalViews.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 hidden sm:inline">Hits</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap size={11} className="text-indigo-500" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      ~{Math.round(overview.totalViews / Math.max(days, 1))}/hr
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-indigo flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Activity size={17} strokeWidth={2.5} />
                </div>
              </div>

              {/* Card 3: Pengunjung Unik */}
              <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                    Pengunjung Unik
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {overview.totalUniques.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 hidden sm:inline">Perangkat</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ShieldCheck size={11} className="text-emerald-500" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {overview.totalViews > 0
                        ? `${((overview.totalUniques / overview.totalViews) * 100).toFixed(0)}% Unik`
                        : "0%"}
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-emerald flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Users size={17} strokeWidth={2.5} />
                </div>
              </div>

              {/* Card 4: Jam Teramai */}
              <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                    Jam Teramai
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {overview.peakHour}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Sparkles size={11} className="text-amber-500" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      Puncak Pasien
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-amber flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Clock size={17} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* ═══ FILTER / TIMEFRAME CONTROL BAR ═══ */}
            <div className="flex items-center gap-1 clay-inset p-1 rounded-[18px] overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedPath("")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-black transition-all whitespace-nowrap active:scale-95",
                  selectedPath === ""
                    ? "clay-pill-blue text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                )}
              >
                <Globe size={13} strokeWidth={2.5} />
                Semua Halaman
              </button>
              <button
                onClick={() => setSelectedPath("/jadwal")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-black transition-all whitespace-nowrap active:scale-95",
                  isScheduleOnly
                    ? "clay-pill-emerald text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                )}
              >
                <Smartphone size={13} strokeWidth={2.5} />
                /jadwal (Mobile Pasien)
              </button>

              <div className="ml-auto flex items-center gap-1 pl-2 border-l border-zinc-200/60 dark:border-white/10">
                {[
                  { label: "Hari Ini", val: 1 },
                  { label: "7 Hari", val: 7 },
                  { label: "30 Hari", val: 30 },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setDays(t.val)}
                    className={cn(
                      "px-3.5 py-2 rounded-[14px] text-xs font-black transition-all whitespace-nowrap active:scale-95",
                      days === t.val
                        ? "clay-pill-violet text-white shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══ CHARTS: TREND + DEVICE DONUT ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {/* Trend Chart (2 cols) */}
              <div className="lg:col-span-2 clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 shadow-sm border border-zinc-200/50 dark:border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[14px] clay-icon-indigo flex items-center justify-center text-white shadow-sm">
                      <BarChart3 size={17} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">
                        {days === 1 ? "Distribusi Trafik Hari Ini" : `Tren ${days} Hari Terakhir`}
                      </h2>
                      <p className="text-[11px] text-zinc-400 font-bold mt-0.5">Views vs Pengunjung Unik</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-black">
                    <div className="flex items-center gap-1.5 clay-inset px-2.5 py-1 rounded-[10px]">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-600 dark:text-zinc-300">Views</span>
                    </div>
                    <div className="flex items-center gap-1.5 clay-inset px-2.5 py-1 rounded-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-zinc-600 dark:text-zinc-300">Unik</span>
                    </div>
                  </div>
                </div>

                <div className="h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {days === 1 ? (
                      <AreaChart data={data?.hourlyTrend || []} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gUniques" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 800 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800 }} allowDecimals={false} tickLine={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Area type="monotone" dataKey="views" name="Views" stroke="#3B82F6" strokeWidth={2.5} fill="url(#gViews)" />
                        <Area type="monotone" dataKey="uniques" name="Uniques" stroke="#10B981" strokeWidth={2} fill="url(#gUniques)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={data?.dailyTrend || []} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 800 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800 }} allowDecimals={false} tickLine={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="views" name="Views" fill="#3B82F6" radius={[5, 5, 0, 0]} />
                        <Bar dataKey="uniques" name="Uniques" fill="#10B981" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Device Donut (1 col) */}
              <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 shadow-sm border border-zinc-200/50 dark:border-white/5 flex flex-col">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-[14px] clay-icon-blue flex items-center justify-center text-white shadow-sm">
                    <Smartphone size={17} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">Tipe Perangkat</h2>
                    <p className="text-[11px] text-zinc-400 font-bold mt-0.5">Smartphone vs Desktop</p>
                  </div>
                </div>

                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.deviceBreakdown || []} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={4} dataKey="count">
                        {(data?.deviceBreakdown || []).map((_: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 mt-auto">
                  {(data?.deviceBreakdown || []).map((dev: any, i: number) => (
                    <div key={dev.name} className="clay-inset rounded-[12px] px-3 py-1.5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 capitalize">{dev.name}</span>
                      </div>
                      <span className="font-black font-mono text-zinc-900 dark:text-zinc-100">
                        {dev.count} <span className="text-zinc-400 font-medium">({dev.percentage}%)</span>
                      </span>
                    </div>
                  ))}
                  {(!data?.deviceBreakdown || data.deviceBreakdown.length === 0) && (
                    <p className="text-[11px] text-zinc-400 py-3 text-center font-bold">Belum ada data</p>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ 3 BREAKDOWN CARDS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {/* Referrer */}
              <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 shadow-sm border border-zinc-200/50 dark:border-white/5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-[14px] clay-icon-emerald flex items-center justify-center text-white shadow-sm">
                    <Share2 size={17} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">Sumber Referrer</h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Asal klik pengunjung</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(data?.referrerBreakdown || []).slice(0, 5).map((ref: any) => {
                    const total = (data?.referrerBreakdown || []).reduce((acc: number, c: any) => acc + c.count, 0) || 1;
                    const pct = Math.round((ref.count / total) * 100);
                    return (
                      <div key={ref.name} className="clay-inset rounded-[12px] px-3 py-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span className="text-zinc-700 dark:text-zinc-300 capitalize truncate max-w-[140px]">{ref.name}</span>
                          <span className="clay-pill-emerald text-white text-[9px] px-2 py-0.5 rounded-full">{ref.count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-zinc-200/60 dark:bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!data?.referrerBreakdown || data.referrerBreakdown.length === 0) && (
                    <p className="text-[11px] text-zinc-400 py-4 text-center font-bold">Belum ada data referrer</p>
                  )}
                </div>
              </div>

              {/* OS */}
              <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 shadow-sm border border-zinc-200/50 dark:border-white/5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-[14px] clay-icon-indigo flex items-center justify-center text-white shadow-sm">
                    <Globe size={17} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">Sistem Operasi</h3>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">OS perangkat pemakai</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(data?.osBreakdown || []).slice(0, 5).map((os: any) => (
                    <div key={os.name} className="clay-inset rounded-[12px] px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <span className="text-zinc-700 dark:text-zinc-300">{os.name}</span>
                        <span className="clay-pill-violet text-white text-[9px] px-2 py-0.5 rounded-full">{os.count} ({os.percentage}%)</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-zinc-200/60 dark:bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${os.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                  {(!data?.osBreakdown || data.osBreakdown.length === 0) && (
                    <p className="text-[11px] text-zinc-400 py-4 text-center font-bold">Belum ada data OS</p>
                  )}
                </div>
              </div>

              {/* Top Path */}
              <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 shadow-sm border border-zinc-200/50 dark:border-white/5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-[14px] clay-icon-amber flex items-center justify-center text-white shadow-sm">
                    <Layers size={17} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">Halaman Terpopuler</h3>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Rute yang sering dibuka</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(data?.pathBreakdown || []).slice(0, 5).map((p: any) => {
                    const total = (data?.pathBreakdown || []).reduce((acc: number, c: any) => acc + c.count, 0) || 1;
                    const pct = Math.round((p.count / total) * 100);
                    return (
                      <div key={p.path} className="clay-inset rounded-[12px] px-3 py-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]">{p.path}</span>
                          <span className="clay-pill-amber text-white text-[9px] px-2 py-0.5 rounded-full">{p.count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-zinc-200/60 dark:bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!data?.pathBreakdown || data.pathBreakdown.length === 0) && (
                    <p className="text-[11px] text-zinc-400 py-4 text-center font-bold">Belum ada data rute</p>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ LIVE ACTIVITY FEED ═══ */}
            <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 shadow-sm border border-zinc-200/50 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[14px] clay-icon-emerald flex items-center justify-center text-white shadow-sm">
                    <Radio size={17} className="animate-pulse" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">Live Activity Feed</h3>
                    <p className="text-[11px] text-zinc-400 font-bold mt-0.5">15 request pengunjung teranyar</p>
                  </div>
                </div>
                <span className="clay-pill-blue text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                  Polling 8s
                </span>
              </div>

              <div className="space-y-1.5">
                {(data?.recentHits || []).map((hit: any) => (
                  <div key={hit.id} className="clay-inset rounded-[14px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-black text-zinc-500 dark:text-zinc-400 shrink-0 clay-button px-2.5 py-1 rounded-[10px] text-[10px]">
                        {new Date(hit.createdAt).toLocaleTimeString("id-ID")}
                      </span>
                      <span className="font-black font-mono text-indigo-600 dark:text-indigo-400 truncate">
                        {hit.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                      <span className="clay-pill-blue text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        {hit.device === "mobile" ? <Smartphone size={10} strokeWidth={2.5} /> : <Laptop size={10} strokeWidth={2.5} />}
                        {hit.device === "mobile" ? "Mobile" : hit.device === "desktop" ? "Desktop" : "Tablet"}
                      </span>
                      <span className="font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                        {hit.os} <span className="text-zinc-400">• {hit.browser}</span>
                      </span>
                      <span className="clay-button text-zinc-600 dark:text-zinc-300 text-[9px] font-black px-2.5 py-0.5 rounded-full capitalize shrink-0">
                        {hit.referrer}
                      </span>
                    </div>
                  </div>
                ))}
                {(!data?.recentHits || data.recentHits.length === 0) && (
                  <div className="py-8 text-center text-[11px] text-zinc-400 font-bold">
                    Belum ada log. Buka <span className="font-mono text-indigo-500">/jadwal</span> untuk hit pertama.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
