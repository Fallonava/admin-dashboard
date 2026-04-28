'use client';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, User, Building2, Clock, Stethoscope,
  CalendarDays, Bot, AlertCircle, Coffee, Sun, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const STATUS_LABEL: Record<string, string> = {
  PRAKTEK: 'Sedang Praktek',
  PENDAFTARAN: 'Pendaftaran Dibuka',
  PENUH: 'Operasional Padat',
  OPERASI: 'Tindakan Medis',
  SELESAI: 'Off-Duty',
  LIBUR: 'Off-Duty',
  CUTI: 'Cuti',
  TERJADWAL: 'Terjadwal',
};

type TabKey = 'semua' | 'hari_ini' | 'cuti';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DokterClient() {
  const [search, setSearch] = useState('');
  const [activeSpec, setActiveSpec] = useState('Semua');
  const [activeTab, setActiveTab] = useState<TabKey>('semua');

  const { data, isLoading, mutate } = useSWR('/api/publik/dokter', fetcher, {
    refreshInterval: 30_000, // auto-refresh every 30s for live status updates
    revalidateOnFocus: true,
  });

  const doctors: any[] = data?.doctors ?? [];
  const todayDayIdx: number = data?.todayDayIdx ?? 0;
  const tomorrowDayIdx: number = data?.tomorrowDayIdx ?? 1;

  const specialties = useMemo(() => {
    const specs = Array.from(new Set(doctors.map((d: any) => d.specialty))).sort() as string[];
    return ['Semua', ...specs];
  }, [doctors]);

  const enriched = useMemo(() => doctors.map((doc: any) => {
    const isOnLeave = doc.leaveRequests?.length > 0;
    const todayShifts = doc.shifts?.filter((s: any) => s.dayIdx === todayDayIdx) ?? [];
    const tomorrowShifts = doc.shifts?.filter((s: any) => s.dayIdx === tomorrowDayIdx) ?? [];
    const hasTodayShift = todayShifts.length > 0;
    const isPracticing = ['PRAKTEK', 'PENDAFTARAN', 'OPERASI'].includes(doc.status);
    return { ...doc, isOnLeave, todayShifts, tomorrowShifts, hasTodayShift, isPracticing };
  }), [doctors, todayDayIdx, tomorrowDayIdx]);

  const filtered = useMemo(() => {
    return enriched.filter((d: any) => {
      const matchSpec = activeSpec === 'Semua' || d.specialty === activeSpec;
      const matchSearch = !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase());
      const matchTab =
        activeTab === 'semua' ? true :
        activeTab === 'hari_ini' ? (d.hasTodayShift && !d.isOnLeave) :
        activeTab === 'cuti' ? d.isOnLeave : true;
      return matchSpec && matchSearch && matchTab;
    });
  }, [enriched, search, activeSpec, activeTab]);

  const counts = useMemo(() => ({
    all: enriched.length,
    today: enriched.filter((d: any) => d.hasTodayShift && !d.isOnLeave).length,
    leave: enriched.filter((d: any) => d.isOnLeave).length,
    active: enriched.filter((d: any) => d.isPracticing).length,
  }), [enriched]);

  const tabs: { key: TabKey; label: string; icon: any; count: number; activeClass: string }[] = [
    { key: 'semua', label: 'Semua Dokter', icon: Stethoscope, count: counts.all, activeClass: 'bg-emerald-500 border-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)]' },
    { key: 'hari_ini', label: 'Praktek Hari Ini', icon: Sun, count: counts.today, activeClass: 'bg-blue-500 border-blue-500 text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)]' },
    { key: 'cuti', label: 'Sedang Cuti', icon: Coffee, count: counts.leave, activeClass: 'bg-amber-500 border-amber-500 text-white shadow-[0_4px_14px_rgba(245,158,11,0.3)]' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-700">
      {/* Luminance Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/15 dark:bg-emerald-900/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 dark:bg-indigo-900/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">

        {/* PAGE HEADER */}
        <div className="mb-10">
          <div className="text-emerald-600 dark:text-emerald-400 font-bold tracking-widest text-sm mb-3 uppercase flex items-center gap-2">
            <Stethoscope size={14} /> Tim Medis Kami
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
                Direktori Dokter<span className="text-zinc-300 dark:text-zinc-700">.</span>
              </h1>
              {isLoading ? (
                <p className="text-zinc-400 font-medium mt-3 text-lg animate-pulse">Memuat data real-time...</p>
              ) : (
                <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-3 text-lg">
                  {counts.all} Pakar Medis &middot;{' '}
                  <span className="text-emerald-500 font-bold">{counts.active} Sedang Bertugas</span> &middot;{' '}
                  <span className="text-blue-500 font-bold">{counts.today} Praktek Hari Ini ({DAYS[todayDayIdx]})</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => mutate()}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs transition-all hover:scale-105 shadow-sm"
              >
                <RefreshCw size={13} /> Refresh
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">Data Real-Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border bg-white dark:bg-zinc-900",
                  isActive
                    ? tab.activeClass
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-emerald-400"
                )}
              >
                <Icon size={14} />
                {tab.label}
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-black", isActive ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SEARCH & SPECIALTY FILTER */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama dokter atau spesialisasi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-5 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map(spec => (
              <button
                key={spec}
                onClick={() => setActiveSpec(spec)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                  activeSpec === spec
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-emerald-500/50"
                )}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING SKELETON */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/80 dark:bg-zinc-900/80 rounded-[28px] p-5 border border-zinc-200/50 dark:border-zinc-800/50 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
                  <div className="w-20 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-2 w-3/4" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-4 w-1/2" />
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* GRID */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((doc: any, i: number) => (
              <DokterCard key={doc.id} doc={doc} index={i} todayDayIdx={todayDayIdx} />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-32 flex flex-col items-center gap-4 opacity-50">
            <Bot size={48} className="text-zinc-400" />
            <p className="font-bold text-zinc-500 dark:text-zinc-400">Dokter tidak ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DokterCard({ doc, index, todayDayIdx }: { doc: any; index: number; todayDayIdx: number }) {
  const { isPracticing, isOnLeave, todayShifts, tomorrowShifts, hasTodayShift } = doc;
  const todayTime = todayShifts[0]?.formattedTime || todayShifts[0]?.title;
  const tomorrowTime = tomorrowShifts[0]?.formattedTime || tomorrowShifts[0]?.title;
  const activeLeave = isOnLeave ? doc.leaveRequests[0] : null;
  const statusLabel = isOnLeave ? 'Sedang Cuti' : (STATUS_LABEL[doc.status] ?? doc.status);
  const allDays = Array.from(new Set<number>(doc.shifts?.map((s: any) => s.dayIdx) ?? [])).sort() as number[];

  return (
    <div
      style={{ animationDelay: `${index * 25}ms` }}
      className={cn(
        "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] p-5 border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 flex flex-col group",
        isOnLeave
          ? "border-amber-200/60 dark:border-amber-800/40"
          : hasTodayShift
          ? "border-blue-200/60 dark:border-blue-800/40"
          : "border-zinc-200/50 dark:border-zinc-800/50"
      )}
    >
      {/* Avatar + status badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-16 h-16 rounded-2xl overflow-hidden border-2 transition-colors duration-300 relative shrink-0",
          isOnLeave ? "border-amber-300 dark:border-amber-700" :
          (isPracticing) ? "border-emerald-400" : "border-zinc-200 dark:border-zinc-700"
        )}>
          {doc.image ? (
            <Image src={doc.image} alt={doc.name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <User size={24} className="text-zinc-400" />
            </div>
          )}
          {isPracticing && !isOnLeave && (
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
          )}
        </div>

        <span className={cn(
          "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border",
          isOnLeave
            ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50"
            : isPracticing
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50"
            : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
        )}>
          {!isOnLeave && isPracticing && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse align-middle" />
          )}
          {statusLabel}
        </span>
      </div>

      {/* Name & Specialty */}
      <div className="flex-1">
        <h2 className="font-black text-zinc-900 dark:text-white leading-tight text-[15px] mb-1">{doc.name}</h2>
        <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">{doc.specialty}</p>

        {doc.queueCode && (
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-1 rounded-lg w-fit mb-3">
            <Building2 size={12} /> {doc.queueCode}
          </div>
        )}

        {/* LEAVE INFO */}
        {isOnLeave && activeLeave && (
          <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black text-xs mb-1">
              <AlertCircle size={12} /> Sedang Cuti
            </div>
            <p className="text-amber-700 dark:text-amber-300 text-[11px] font-medium">
              {formatDate(activeLeave.startDate)} — {formatDate(activeLeave.endDate)}
            </p>
            {activeLeave.type && (
              <span className="text-[10px] text-amber-500 dark:text-amber-400 font-bold">({activeLeave.type})</span>
            )}
          </div>
        )}

        {/* TODAY SCHEDULE */}
        {!isOnLeave && (
          <div className="mb-3">
            {hasTodayShift ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-black text-xs mb-1">
                  <Sun size={12} className="shrink-0" /> Praktek Hari Ini
                </div>
                <p className="text-blue-700 dark:text-blue-300 font-bold text-sm">{todayTime}</p>
              </div>
            ) : tomorrowTime ? (
              <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-bold text-xs mb-1">
                  <Clock size={12} /> Besok ({DAYS[tomorrowShifts[0]?.dayIdx ?? -1] || '—'})
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 font-bold text-sm">{tomorrowTime}</p>
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/30 rounded-xl px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                Tidak ada jadwal hari ini
              </div>
            )}
          </div>
        )}

        {/* Weekly schedule pills */}
        {allDays.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allDays.slice(0, 5).map((dayIdx: number) => (
              <span
                key={dayIdx}
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                  dayIdx === todayDayIdx && !isOnLeave
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50"
                )}
              >
                {DAYS[dayIdx]}
              </span>
            ))}
            {allDays.length > 5 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                +{allDays.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/publik?dokter=${encodeURIComponent(doc.name)}`}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 dark:hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95"
      >
        <CalendarDays size={14} /> Konsultasi via AI
      </Link>
    </div>
  );
}
