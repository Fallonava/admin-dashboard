"use client";

import { useState, useMemo } from "react";
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
  Zap,
  BarChart3,
  Compass,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  Flame,
  MessageCircle,
  Laptop,
  Check,
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

// Custom Apple Obsidian Clay Tooltip
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="clay-surface !bg-[#121622]/95 dark:!bg-[#0A0D14]/95 !border-white/10 rounded-[22px] p-4 shadow-2xl backdrop-blur-xl text-white text-xs transform transition-all duration-200 ease-out">
        <div className="font-black text-zinc-300 mb-2 border-b border-white/10 pb-2 flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 font-mono text-zinc-200">
            <Sparkles size={12} className="text-indigo-400 animate-pulse" />
            {label}
          </span>
          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider clay-pill-emerald !px-2.5 !py-0.5 rounded-full">
            Realtime
          </span>
        </div>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-6 font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-300 font-medium">{entry.name}:</span>
              </div>
              <span className="font-black font-mono text-white text-sm">
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

  // Compute platform share for hero banner
  const mobileDevice = (data?.deviceBreakdown || []).find((d: any) => d.name.toLowerCase() === "mobile");
  const mobilePercentage = mobileDevice ? mobileDevice.percentage : 0;

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-y-auto bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100 pb-28 custom-scrollbar page-enter">
      {/* ═══ SIGNATURE CLAYMORPHIC PAGE HEADER ═══ */}
      <PageHeader
        icon={<Activity size={24} className="text-white" strokeWidth={2.5} />}
        title="Monitoring Trafik"
        accentWord="Trafik"
        subtitle="Analisis real-time kunjungan publik & jadwal dokter simed.fallonava.my.id/jadwal"
        iconClay="clay-icon-indigo"
        accentBarGradient="from-blue-600 via-indigo-600 to-violet-600"
        accentColor="text-indigo-600 dark:text-indigo-400"
        badge={
          <div className="flex items-center gap-2 clay-pill-emerald text-white px-4 py-1.5 rounded-full shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75 duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="text-[11px] font-black tracking-widest uppercase">
              Live Engine Active
            </span>
          </div>
        }
        actions={
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="clay-button text-zinc-700 dark:text-zinc-200 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2.5 active:scale-90 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-md hover:shadow-lg cursor-pointer group"
            title="Perbarui data analitik trafik sekarang"
          >
            <RefreshCw
              size={15}
              className={cn(
                "transition-transform duration-500 ease-out",
                isLoading ? "animate-spin text-indigo-600" : "text-zinc-400 group-hover:rotate-180 text-zinc-600 dark:text-zinc-300"
              )}
            />
            <span>{isLoading ? "Menyinkronkan..." : "Sync Live Data"}</span>
          </button>
        }
      />

      <div className="px-3 sm:px-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ═══ HERO LIVE VELOCITY & INSIGHTS BANNER ═══ */}
        <div className="clay-surface rounded-[32px] p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4 border border-white/60 dark:border-white/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[20px] clay-icon-blue flex items-center justify-center text-white shadow-md">
              <Flame size={24} strokeWidth={2.5} className="animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Trafik Portal Publik
                </span>
                <span className="clay-pill-blue text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  Real-time Beacon
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">
                Pengunjung otomatis tercatat tanpa beban database (0-overhead beacon)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="clay-inset rounded-[18px] px-3.5 py-2 flex items-center gap-2">
              <Smartphone size={14} className="text-blue-500" strokeWidth={2.5} />
              <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">
                {mobilePercentage > 0 ? `${mobilePercentage}% Mobile` : "Mobile-First"}
              </span>
            </div>
            <div className="clay-inset rounded-[18px] px-3.5 py-2 flex items-center gap-2">
              <MessageCircle size={14} className="text-emerald-500" strokeWidth={2.5} />
              <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">
                WhatsApp Direct
              </span>
            </div>
            <div className="clay-inset rounded-[18px] px-3.5 py-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-500" strokeWidth={2.5} />
              <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">
                SHA-256 Anonymized
              </span>
            </div>
          </div>
        </div>

        {/* ═══ 4 FLAGSHIP CLAYMORPHIC STAT CARDS WITH PROGRESS BARS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Views Hari Ini */}
          <div className="clay-surface rounded-[32px] p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-2xl">
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                  Views Hari Ini
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
                    {overview.todayViews.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[11px] font-black text-zinc-400 uppercase">tayangan</span>
                </div>
              </div>
              <div className="w-13 h-13 rounded-[22px] clay-icon-blue flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shrink-0">
                <Eye size={24} strokeWidth={2.5} />
              </div>
            </div>

            {/* Micro Progress Track */}
            <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-white/5 space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp size={13} strokeWidth={2.5} />
                  {overview.todayUniques} Pengunjung Unik
                </span>
                <span className="text-zinc-400 text-[10px]">Hari ini</span>
              </div>
              <div className="w-full h-2 rounded-full clay-inset overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
                  style={{
                    width: `${overview.todayViews > 0 ? Math.min(100, Math.round((overview.todayUniques / overview.todayViews) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Total Views */}
          <div className="clay-surface rounded-[32px] p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-2xl">
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                  Total Views ({days} Hari)
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
                    {overview.totalViews.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[11px] font-black text-zinc-400 uppercase">hits</span>
                </div>
              </div>
              <div className="w-13 h-13 rounded-[22px] clay-icon-indigo flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 shrink-0">
                <Activity size={24} strokeWidth={2.5} />
              </div>
            </div>

            {/* Micro Average Rate */}
            <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-white/5 space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Zap size={13} strokeWidth={2.5} />
                  ~{Math.round(overview.totalViews / Math.max(days, 1))} / hari
                </span>
                <span className="text-zinc-400 text-[10px]">Rata-rata</span>
              </div>
              <div className="w-full h-2 rounded-full clay-inset overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Pengunjung Unik */}
          <div className="clay-surface rounded-[32px] p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-2xl">
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                  Pengunjung Unik
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
                    {overview.totalUniques.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[11px] font-black text-zinc-400 uppercase">perangkat</span>
                </div>
              </div>
              <div className="w-13 h-13 rounded-[22px] clay-icon-emerald flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shrink-0">
                <Users size={24} strokeWidth={2.5} />
              </div>
            </div>

            {/* Micro Conversion Rate */}
            <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-white/5 space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={13} strokeWidth={2.5} />
                  {overview.totalViews > 0
                    ? `${((overview.totalUniques / overview.totalViews) * 100).toFixed(0)}% Audiens Baru`
                    : "0%"}
                </span>
                <span className="text-zinc-400 text-[10px]">Rasio Unik</span>
              </div>
              <div className="w-full h-2 rounded-full clay-inset overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                  style={{
                    width: `${overview.totalViews > 0 ? Math.min(100, Math.round((overview.totalUniques / overview.totalViews) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Jam Paling Ramai */}
          <div className="clay-surface rounded-[32px] p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-2xl">
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                  Jam Paling Ramai
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                    {overview.peakHour}
                  </span>
                </div>
              </div>
              <div className="w-13 h-13 rounded-[22px] clay-icon-amber flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 shrink-0">
                <Clock size={24} strokeWidth={2.5} />
              </div>
            </div>

            {/* Peak Activity Tag */}
            <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-white/5 space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sparkles size={13} strokeWidth={2.5} />
                  Puncak Pasien Masuk
                </span>
                <span className="text-zinc-400 text-[10px] font-mono">WIB</span>
              </div>
              <div className="w-full h-2 rounded-full clay-inset overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
                  style={{ width: "85%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MODERN SEGMENTED CONTROLS BAR ═══ */}
        <div className="clay-surface rounded-[30px] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          {/* Path Filters */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedPath("")}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black transition-all duration-200 active:scale-90 cursor-pointer select-none flex items-center gap-2",
                selectedPath === ""
                  ? "clay-pill-blue text-white shadow-md scale-100"
                  : "clay-button text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              )}
            >
              <Globe size={14} strokeWidth={2.5} />
              Semua Halaman
            </button>
            <button
              onClick={() => setSelectedPath("/jadwal")}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black transition-all duration-200 active:scale-90 cursor-pointer select-none flex items-center gap-2",
                isScheduleOnly
                  ? "clay-pill-emerald text-white shadow-md scale-100"
                  : "clay-button text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              )}
            >
              <Smartphone size={14} strokeWidth={2.5} />
              /jadwal (Jadwal Dokter Mobile)
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="clay-inset p-1.5 rounded-full flex items-center gap-1.5">
            {[
              { label: "Hari Ini", val: 1 },
              { label: "7 Hari", val: 7 },
              { label: "30 Hari", val: 30 },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => setDays(t.val)}
                className={cn(
                  "px-4 py-1.5 text-xs font-black rounded-full transition-all duration-200 active:scale-90 cursor-pointer select-none",
                  days === t.val
                    ? "clay-pill-violet text-white shadow-md"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ CHARTS SECTION (MAIN TREND + DEVICE DONUT) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Trend Chart (2 Cols) */}
          <div className="lg:col-span-2 clay-surface rounded-[36px] p-6 sm:p-7 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[20px] clay-icon-indigo flex items-center justify-center text-white shadow-md">
                  <BarChart3 size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {days === 1 ? "Distribusi Trafik Hari Ini" : `Tren Kunjungan (${days} Hari Terakhir)`}
                  </h2>
                  <p className="text-xs text-zinc-400 font-bold mt-0.5">
                    Grafik perbandingan total views vs pengunjung unik
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-black">
                <div className="clay-inset px-3.5 py-1.5 rounded-full flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                  <span className="text-zinc-700 dark:text-zinc-200">Views</span>
                </div>
                <div className="clay-inset px-3.5 py-1.5 rounded-full flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-zinc-700 dark:text-zinc-200">Unik</span>
                </div>
              </div>
            </div>

            <div className="h-68 sm:h-80 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                {days === 1 ? (
                  <AreaChart data={data?.hourlyTrend || []} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clayViewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="clayUniquesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fontWeight: 800 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 800 }} allowDecimals={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#3B82F6"
                      strokeWidth={3.5}
                      fillOpacity={1}
                      fill="url(#clayViewsGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="uniques"
                      name="Uniques"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#clayUniquesGrad)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={data?.dailyTrend || []} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 800 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 800 }} allowDecimals={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="views" name="Views" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="uniques" name="Uniques" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Breakdown Donut (1 Col) */}
          <div className="clay-surface rounded-[36px] p-6 sm:p-7 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="w-12 h-12 rounded-[20px] clay-icon-blue flex items-center justify-center text-white shadow-md">
                <Smartphone size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Tipe Perangkat
                </h2>
                <p className="text-xs text-zinc-400 font-bold mt-0.5">Proporsi smartphone vs desktop</p>
              </div>
            </div>

            <div className="h-48 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.deviceBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={5}
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

            {/* Modern Proportional Segmented Device List */}
            <div className="space-y-2 mt-2">
              {(data?.deviceBreakdown || []).map((dev: any, i: number) => (
                <div
                  key={dev.name}
                  className="clay-inset rounded-[18px] p-2.5 space-y-1.5 transition-all duration-200 hover:translate-x-1"
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-zinc-800 dark:text-zinc-200 capitalize">{dev.name}</span>
                    </div>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {dev.count} <span className="text-zinc-400 font-medium">({dev.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200/50 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dev.percentage}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
              {(!data?.deviceBreakdown || data.deviceBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-4 text-center font-bold">Belum ada data perangkat</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ 3 ULTRA-MODERN PROPORTIONAL BREAKDOWN CARDS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Referrers Source */}
          <div className="clay-surface rounded-[32px] p-6 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1.5">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-[18px] clay-icon-emerald flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Share2 size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Sumber Referrer</h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Asal klik link pengunjung</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {(data?.referrerBreakdown || []).slice(0, 5).map((ref: any) => {
                const totalRefHits = (data?.referrerBreakdown || []).reduce((acc: number, cur: any) => acc + cur.count, 0) || 1;
                const refPct = Math.round((ref.count / totalRefHits) * 100);
                return (
                  <div
                    key={ref.name}
                    className="clay-inset rounded-[20px] p-3 space-y-1.5 transition-all duration-200 hover:translate-x-1"
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] capitalize">
                        {ref.name}
                      </span>
                      <span className="font-mono clay-pill-emerald text-white text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
                        {ref.count} hits ({refPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200/50 dark:bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${refPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!data?.referrerBreakdown || data.referrerBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-6 text-center font-bold">Belum ada data referrer</p>
              )}
            </div>
          </div>

          {/* Operating System */}
          <div className="clay-surface rounded-[32px] p-6 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1.5">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-[18px] clay-icon-indigo flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Globe size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Sistem Operasi</h3>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">OS perangkat pemakai</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {(data?.osBreakdown || []).slice(0, 5).map((os: any) => (
                <div
                  key={os.name}
                  className="clay-inset rounded-[20px] p-3 space-y-1.5 transition-all duration-200 hover:translate-x-1"
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-zinc-700 dark:text-zinc-300">{os.name}</span>
                    <span className="font-mono clay-pill-violet text-white text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
                      {os.count} ({os.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200/50 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${os.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!data?.osBreakdown || data.osBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-6 text-center font-bold">Belum ada data OS</p>
              )}
            </div>
          </div>

          {/* Top URL Paths */}
          <div className="clay-surface rounded-[32px] p-6 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1.5">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-[18px] clay-icon-amber flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Layers size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Halaman Terpopuler</h3>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Rute yang paling banyak dibuka</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {(data?.pathBreakdown || []).slice(0, 5).map((p: any) => {
                const totalViewsCount = (data?.pathBreakdown || []).reduce((acc: number, cur: any) => acc + cur.count, 0) || 1;
                const pathPct = Math.round((p.count / totalViewsCount) * 100);
                return (
                  <div
                    key={p.path}
                    className="clay-inset rounded-[20px] p-3 space-y-1.5 transition-all duration-200 hover:translate-x-1"
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                        {p.path}
                      </span>
                      <span className="font-mono clay-pill-amber text-white text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
                        {p.count} views ({pathPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200/50 dark:bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${pathPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!data?.pathBreakdown || data.pathBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-6 text-center font-bold">Belum ada data rute</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ NEXT-GEN LIVE FEED STREAM CARDS ═══ */}
        <div className="clay-surface rounded-[36px] p-6 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[20px] clay-icon-emerald flex items-center justify-center text-white shadow-md">
                <Radio size={22} className="animate-pulse" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Live Stream Activity Feed
                </h3>
                <p className="text-xs text-zinc-400 font-bold mt-0.5">15 request pengunjung paling teranyar</p>
              </div>
            </div>
            <div className="clay-pill-blue text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm">
              Live Polling 8s
            </div>
          </div>

          <div className="space-y-2.5">
            {(data?.recentHits || []).map((hit: any) => (
              <div
                key={hit.id}
                className="clay-inset rounded-[22px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all duration-200 hover:translate-x-1.5 hover:border-indigo-500/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="font-mono font-black text-zinc-600 dark:text-zinc-300 clay-button px-3 py-1.5 rounded-full text-[11px] shrink-0 shadow-sm">
                    {new Date(hit.createdAt).toLocaleTimeString("id-ID")}
                  </div>
                  <div className="min-w-0">
                    <span className="font-black font-mono text-indigo-600 dark:text-indigo-400 text-[13px] block truncate">
                      {hit.path}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      IP Hash: {hit.ipHash ? `${hit.ipHash.slice(0, 8)}...` : "Anonymized"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="clay-pill-blue text-white px-3 py-1 rounded-full text-[10px] font-black shrink-0 shadow-sm flex items-center gap-1">
                    {hit.device === "mobile" ? <Smartphone size={11} strokeWidth={2.5} /> : <Laptop size={11} strokeWidth={2.5} />}
                    {hit.device === "mobile" ? "Mobile" : hit.device === "desktop" ? "Desktop" : "Tablet"}
                  </span>
                  <span className="font-black text-zinc-700 dark:text-zinc-200 clay-button px-3 py-1 rounded-full text-[10px] shrink-0 shadow-sm">
                    {hit.os} <span className="text-zinc-400 font-medium">• {hit.browser}</span>
                  </span>
                  <span className="clay-pill-emerald text-white px-3 py-1 rounded-full text-[10px] font-black capitalize shrink-0 shadow-sm">
                    {hit.referrer}
                  </span>
                </div>
              </div>
            ))}

            {(!data?.recentHits || data.recentHits.length === 0) && (
              <div className="py-14 text-center text-zinc-400 font-bold">
                Belum ada log kunjungan yang tercatat. Buka <span className="font-mono text-indigo-500 font-black">/jadwal</span> untuk mengirim hit pertama.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
