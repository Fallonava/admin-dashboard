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
  Filter,
  Monitor,
  Tablet,
  Radio,
  ArrowUpRight,
  Sparkles,
  Layers,
  Calendar,
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

// Custom Apple Obsidian Tooltip for Charts
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#10131C]/95 dark:bg-[#0B0D13]/95 border border-white/10 rounded-[14px] p-3 shadow-2xl backdrop-blur-md text-white text-xs">
        <div className="font-bold text-zinc-300 mb-1.5 border-b border-white/10 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-[10px] text-zinc-400 font-mono">Real-time</span>
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-300">{entry.name}:</span>
              </div>
              <span className="font-black font-mono text-white">{entry.value.toLocaleString("id-ID")}</span>
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
    refreshInterval: 8000, // auto refresh every 8s
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
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-y-auto bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100 pb-20 custom-scrollbar">
      {/* ═══ PAGE HEADER ═══ */}
      <PageHeader
        icon={<Activity size={22} className="text-white" strokeWidth={2.5} />}
        title="Monitoring Trafik"
        accentWord="Trafik"
        subtitle="Pusat analitik real-time kunjungan publik simed.fallonava.my.id/jadwal"
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
              Live Beacon Active
            </span>
          </div>
        }
        actions={
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="clay-button text-zinc-700 dark:text-zinc-200 px-3.5 py-2 rounded-[14px] text-xs font-black flex items-center gap-2 active:scale-95 transition-all shadow-sm cursor-pointer"
            title="Perbarui analitik trafik sekarang"
          >
            <RefreshCw size={14} className={cn(isLoading ? "animate-spin text-indigo-600" : "text-zinc-400")} />
            <span>{isLoading ? "Memuat..." : "Refresh Data"}</span>
          </button>
        }
      />

      <div className="px-3 sm:px-6 space-y-4 max-w-7xl mx-auto w-full">
        {/* ═══ 4 TOP CLAY KPI CARDS ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Today Views */}
          <div className="clay-surface rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 flex flex-col justify-between border border-zinc-200/50 dark:border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Views Hari Ini
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-blue flex items-center justify-center text-white">
                <Eye size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {overview.todayViews.toLocaleString("id-ID")}
                </span>
                <span className="text-[11px] font-extrabold text-zinc-400">tayangan</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-200/40 dark:border-white/5 flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp size={13} />
                {overview.todayUniques} Unik
              </span>
              <span className="text-[10px] font-extrabold text-zinc-400">Hari ini</span>
            </div>
          </div>

          {/* Card 2: Total Views */}
          <div className="clay-surface rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 flex flex-col justify-between border border-zinc-200/50 dark:border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Total Views ({days} Hari)
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-indigo flex items-center justify-center text-white">
                <Activity size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {overview.totalViews.toLocaleString("id-ID")}
                </span>
                <span className="text-[11px] font-extrabold text-zinc-400">total hits</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-200/40 dark:border-white/5 flex items-center justify-between text-[11px]">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                ~{Math.round(overview.totalViews / Math.max(days, 1))} / hari
              </span>
              <span className="text-[10px] font-extrabold text-zinc-400">Rata-rata</span>
            </div>
          </div>

          {/* Card 3: Unique Visitors */}
          <div className="clay-surface rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 flex flex-col justify-between border border-zinc-200/50 dark:border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Pengunjung Unik
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-emerald flex items-center justify-center text-white">
                <Users size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {overview.totalUniques.toLocaleString("id-ID")}
                </span>
                <span className="text-[11px] font-extrabold text-zinc-400">perangkat</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-200/40 dark:border-white/5 flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {overview.totalViews > 0
                  ? `${((overview.totalUniques / overview.totalViews) * 100).toFixed(0)}% Baru`
                  : "0%"}
              </span>
              <span className="text-[10px] font-extrabold text-zinc-400">Rasio Unik</span>
            </div>
          </div>

          {/* Card 4: Peak Hour */}
          <div className="clay-surface rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 flex flex-col justify-between border border-zinc-200/50 dark:border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Jam Teramai
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-amber flex items-center justify-center text-white">
                <Clock size={18} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                  {overview.peakHour}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-200/40 dark:border-white/5 flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                Puncak Pasien
              </span>
              <span className="text-[10px] font-extrabold text-zinc-400">WIB</span>
            </div>
          </div>
        </div>

        {/* ═══ FILTER & TIMEFRAME BAR ═══ */}
        <div className="clay-surface rounded-[20px] p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 border border-zinc-200/50 dark:border-white/5">
          {/* Path Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setSelectedPath("")}
              className={cn(
                "px-3.5 py-1.5 rounded-[12px] text-xs font-black transition-all cursor-pointer",
                selectedPath === ""
                  ? "clay-pill-blue text-white shadow-md"
                  : "clay-button text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              )}
            >
              Semua Halaman
            </button>
            <button
              onClick={() => setSelectedPath("/jadwal")}
              className={cn(
                "px-3.5 py-1.5 rounded-[12px] text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                isScheduleOnly
                  ? "clay-pill-emerald text-white shadow-md"
                  : "clay-button text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              )}
            >
              <Smartphone size={13} strokeWidth={2.5} />
              /jadwal (Jadwal Pasien)
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="clay-inset p-1 rounded-[14px] flex items-center gap-1">
            {[
              { label: "Hari Ini", val: 1 },
              { label: "7 Hari", val: 7 },
              { label: "30 Hari", val: 30 },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => setDays(t.val)}
                className={cn(
                  "px-3 py-1 text-xs font-black rounded-[10px] transition-all cursor-pointer",
                  days === t.val
                    ? "clay-button text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ CHARTS SECTION (TREND & DEVICE DONUT) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Trend Chart (2 Cols) */}
          <div className="lg:col-span-2 clay-surface rounded-[24px] p-4 sm:p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-600" strokeWidth={2.5} />
                  {days === 1 ? "Distribusi Trafik Hari Ini (Per Jam)" : `Tren Kunjungan Harian (${days} Hari Terakhir)`}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  Perbandingan total views vs pengunjung unik
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-black">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                  <span className="text-zinc-600 dark:text-zinc-300">Views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-zinc-600 dark:text-zinc-300">Unik</span>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                {days === 1 ? (
                  <AreaChart data={data?.hourlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clayViewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="clayUniquesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 700 }} allowDecimals={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#clayViewsGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="uniques"
                      name="Uniques"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#clayUniquesGrad)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={data?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 700 }} allowDecimals={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="views" name="Views" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="uniques" name="Uniques" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Breakdown (1 Col) */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Smartphone size={16} className="text-blue-600" strokeWidth={2.5} />
                Tipe Perangkat
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">Distribusi smartphone vs desktop</p>
            </div>

            <div className="h-44 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.deviceBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {(data?.deviceBreakdown || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2">
              {(data?.deviceBreakdown || []).map((dev: any, i: number) => (
                <div key={dev.name} className="clay-inset rounded-[12px] px-3 py-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 capitalize">{dev.name}</span>
                  </div>
                  <span className="font-black font-mono text-zinc-900 dark:text-zinc-100">
                    {dev.count} <span className="text-zinc-400 font-medium">({dev.percentage}%)</span>
                  </span>
                </div>
              ))}
              {(!data?.deviceBreakdown || data.deviceBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-3 text-center">Belum ada data perangkat</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ 3 DETAILED BREAKDOWN CARDS (REFERRER, OS, PATH) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Referrers Source */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-5 border border-zinc-200/50 dark:border-white/5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-[12px] clay-icon-emerald flex items-center justify-center text-white">
                <Share2 size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">Sumber Referrer</h3>
                <p className="text-[10px] text-zinc-400 font-bold">Asal klik pengunjung</p>
              </div>
            </div>
            <div className="space-y-2">
              {(data?.referrerBreakdown || []).slice(0, 5).map((ref: any) => (
                <div key={ref.name} className="clay-inset rounded-[12px] px-3 py-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[160px] capitalize">
                    {ref.name}
                  </span>
                  <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-[8px]">
                    {ref.count} hit
                  </span>
                </div>
              ))}
              {(!data?.referrerBreakdown || data.referrerBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-4 text-center">Belum ada data referrer</p>
              )}
            </div>
          </div>

          {/* Operating System */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-5 border border-zinc-200/50 dark:border-white/5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-[12px] clay-icon-indigo flex items-center justify-center text-white">
                <Globe size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">Sistem Operasi</h3>
                <p className="text-[10px] text-zinc-400 font-bold">OS perangkat pemakai</p>
              </div>
            </div>
            <div className="space-y-2">
              {(data?.osBreakdown || []).slice(0, 5).map((os: any) => (
                <div key={os.name} className="clay-inset rounded-[12px] px-3 py-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{os.name}</span>
                  <span className="font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-[8px]">
                    {os.count} <span className="text-[10px] opacity-75">({os.percentage}%)</span>
                  </span>
                </div>
              ))}
              {(!data?.osBreakdown || data.osBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-4 text-center">Belum ada data OS</p>
              )}
            </div>
          </div>

          {/* Top URL Paths */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-5 border border-zinc-200/50 dark:border-white/5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-[12px] clay-icon-amber flex items-center justify-center text-white">
                <Layers size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">Halaman Terpopuler</h3>
                <p className="text-[10px] text-zinc-400 font-bold">Rute yang diakses</p>
              </div>
            </div>
            <div className="space-y-2">
              {(data?.pathBreakdown || []).slice(0, 5).map((p: any) => (
                <div key={p.path} className="clay-inset rounded-[12px] px-3 py-2 flex items-center justify-between text-xs">
                  <span className="font-bold font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]">
                    {p.path}
                  </span>
                  <span className="font-black font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-[8px]">
                    {p.count} views
                  </span>
                </div>
              ))}
              {(!data?.pathBreakdown || data.pathBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-4 text-center">Belum ada data rute</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ LIVE FEED: RECENT HITS TABLE ═══ */}
        <div className="clay-surface rounded-[24px] p-4 sm:p-6 border border-zinc-200/50 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Radio size={16} className="text-emerald-500 animate-pulse" strokeWidth={2.5} />
                Feed Kunjungan Terakhir (Live Stream)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">15 hit pengunjung publik teranyar</p>
            </div>
            <div className="clay-pill-blue text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
              Auto-Sync 8s
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/60 dark:border-white/5 text-zinc-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5 px-2.5">Waktu</th>
                  <th className="pb-2.5 px-2.5">Halaman</th>
                  <th className="pb-2.5 px-2.5">Perangkat</th>
                  <th className="pb-2.5 px-2.5">OS & Browser</th>
                  <th className="pb-2.5 px-2.5">Sumber Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5">
                {(data?.recentHits || []).map((hit: any) => (
                  <tr key={hit.id} className="hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2.5 font-mono font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(hit.createdAt).toLocaleTimeString("id-ID")}
                    </td>
                    <td className="py-2.5 px-2.5 font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {hit.path}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] clay-inset text-[10px] font-black text-zinc-700 dark:text-zinc-300">
                        {hit.device === "mobile" ? "📱 Mobile" : hit.device === "desktop" ? "💻 Desktop" : "📟 Tablet"}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-zinc-600 dark:text-zinc-300 font-bold">
                      {hit.os} <span className="text-zinc-400 font-medium">• {hit.browser}</span>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="px-2 py-0.5 rounded-[8px] bg-zinc-200/60 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
                        {hit.referrer}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.recentHits || data.recentHits.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      Belum ada log kunjungan yang tercatat. Buka <span className="font-mono text-indigo-500 font-bold">/jadwal</span> untuk mengirim hit pertama.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
