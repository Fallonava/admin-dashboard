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
  CheckCircle,
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
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

const COLORS = ["#007AFF", "#34C759", "#FF9500", "#AF52DE", "#FF2D55", "#5856D6"];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TrafficDashboardPage() {
  const [days, setDays] = useState<number>(7);
  const [selectedPath, setSelectedPath] = useState<string>("");

  const queryUrl = `/api/traffic/stats?days=${days}${selectedPath ? `&path=${encodeURIComponent(selectedPath)}` : ""}`;
  const { data, error, isLoading, mutate } = useSWR(queryUrl, fetcher, {
    refreshInterval: 10000, // auto refresh every 10s
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
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-y-auto bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100 pb-16">
      {/* Page Header */}
      <PageHeader
        icon={<Activity size={22} className="text-white" strokeWidth={2.5} />}
        title="Monitoring Trafik"
        accentWord="Trafik"
        subtitle="Analitik Pengunjung Realtime Jadwal & Portal Simed"
        iconClay="clay-icon-blue"
        accentBarGradient="from-blue-500 via-teal-500 to-emerald-500"
        accentColor="text-blue-600 dark:text-blue-400"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Tracking
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => mutate()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
              Refresh
            </button>
          </div>
        }
      />

      <div className="px-3 sm:px-6 space-y-5 max-w-7xl mx-auto w-full">
        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-white/60 dark:border-white/5 shadow-sm backdrop-blur-md">
          {/* Path Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedPath("")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
                selectedPath === ""
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              Semua Rute
            </button>
            <button
              onClick={() => setSelectedPath("/jadwal")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5",
                isScheduleOnly
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              <Smartphone size={13} />
              /jadwal (Pasien Mobile)
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {[
              { label: "Hari Ini", val: 1 },
              { label: "7 Hari", val: 7 },
              { label: "30 Hari", val: 30 },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => setDays(t.val)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  days === t.val
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Today Views */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Views Hari Ini</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Eye size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {overview.todayViews.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-zinc-400 ml-1.5">tayangan</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp size={12} />
              <span>{overview.todayUniques} pengunjung unik hari ini</span>
            </div>
          </div>

          {/* Card 2: Total Views */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Total Views ({days} Hari)</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Activity size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {overview.totalViews.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-zinc-400 ml-1.5">total hit</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-zinc-500">
              Rata-rata {Math.round(overview.totalViews / Math.max(days, 1))} views / hari
            </div>
          </div>

          {/* Card 3: Unique Visitors */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Pengunjung Unik</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {overview.totalUniques.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-zinc-400 ml-1.5">perangkat unik</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-zinc-500">
              {overview.totalViews > 0
                ? `${((overview.totalUniques / overview.totalViews) * 100).toFixed(0)}% rasio audiens baru`
                : "Belum ada data"}
            </div>
          </div>

          {/* Card 4: Peak Hour */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Jam Paling Ramai</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {overview.peakHour}
              </span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-zinc-500">
              Puncak kunjungan pasien
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Trend Chart (2 Cols) */}
          <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {days === 1 ? "Aktivitas Trafik Per Jam Hari Ini" : `Tren Kunjungan Harian (${days} Hari Terakhir)`}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Jumlah kunjungan (Views) dan pengunjung unik
                </p>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {days === 1 ? (
                  <AreaChart data={data?.hourlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorUniques" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34C759" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#34C759" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="views" name="Views" stroke="#007AFF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="uniques" name="Uniques" stroke="#34C759" strokeWidth={2} fillOpacity={1} fill="url(#colorUniques)" />
                  </AreaChart>
                ) : (
                  <BarChart data={data?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="views" name="Views" fill="#007AFF" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="uniques" name="Uniques" fill="#34C759" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Breakdown (1 Col) */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md flex flex-col justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Perangkat Pengunjung
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Proporsi jenis device</p>
            </div>

            <div className="h-44 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.deviceBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {(data?.deviceBreakdown || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2">
              {(data?.deviceBreakdown || []).map((dev: any, i: number) => (
                <div key={dev.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{dev.name}</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {dev.count} ({dev.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Referrers Source */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Share2 size={16} className="text-emerald-600" />
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Sumber Referrer</h3>
            </div>
            <div className="space-y-2.5">
              {(data?.referrerBreakdown || []).slice(0, 5).map((ref: any) => (
                <div key={ref.name} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[170px]">{ref.name}</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                    {ref.count} hit
                  </span>
                </div>
              ))}
              {(!data?.referrerBreakdown || data.referrerBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-3 text-center">Belum ada data referrer</p>
              )}
            </div>
          </div>

          {/* Operating System */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-blue-600" />
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Sistem Operasi (OS)</h3>
            </div>
            <div className="space-y-2.5">
              {(data?.osBreakdown || []).slice(0, 5).map((os: any) => (
                <div key={os.name} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{os.name}</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                    {os.count} ({os.percentage}%)
                  </span>
                </div>
              ))}
              {(!data?.osBreakdown || data.osBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-3 text-center">Belum ada data OS</p>
              )}
            </div>
          </div>

          {/* Top URL Paths */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-amber-600" />
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Halaman Paling Sering Dibuka</h3>
            </div>
            <div className="space-y-2.5">
              {(data?.pathBreakdown || []).slice(0, 5).map((p: any) => (
                <div key={p.path} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs">
                  <span className="font-bold font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[170px]">{p.path}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
                    {p.count} views
                  </span>
                </div>
              ))}
              {(!data?.pathBreakdown || data.pathBreakdown.length === 0) && (
                <p className="text-xs text-zinc-400 py-3 text-center">Belum ada data halaman</p>
              )}
            </div>
          </div>
        </div>

        {/* Live Feed: Recent Hits Table */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-white/60 dark:border-white/5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Log Kunjungan Terakhir (Live Feed)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">15 request pengunjung paling baru</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-2">Waktu</th>
                  <th className="pb-3 px-2">Halaman</th>
                  <th className="pb-3 px-2">Perangkat</th>
                  <th className="pb-3 px-2">OS & Browser</th>
                  <th className="pb-3 px-2">Sumber Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {(data?.recentHits || []).map((hit: any) => (
                  <tr key={hit.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2.5 px-2 font-mono text-zinc-500 whitespace-nowrap">
                      {new Date(hit.createdAt).toLocaleTimeString("id-ID")}
                    </td>
                    <td className="py-2.5 px-2 font-bold font-mono text-blue-600 dark:text-blue-400">
                      {hit.path}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {hit.device === "mobile" ? "📱 Smartphone" : hit.device === "desktop" ? "💻 Desktop" : "📟 Tablet"}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-zinc-600 dark:text-zinc-300 font-medium">
                      {hit.os} • {hit.browser}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-600 dark:text-zinc-400">
                      {hit.referrer}
                    </td>
                  </tr>
                ))}
                {(!data?.recentHits || data.recentHits.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-400">
                      Belum ada log kunjungan yang tercatat. Buka <span className="font-mono text-blue-500">/jadwal</span> untuk mengirim hit pertama.
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
