'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import {
  Search, User, Building2, Clock, Stethoscope,
  Sun, AlertCircle, Coffee,
  Activity, Users, CalendarDays, PhoneCall, Phone,
  ChevronRight, ChevronDown, X, ArrowRight, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const STATUS_LABEL: Record<string, { label: string; color: 'emerald' | 'amber' | 'slate' | 'blue' }> = {
  PRAKTEK:    { label: 'Beroperasi Normal', color: 'emerald' },
  PENDAFTARAN:{ label: 'Pendaftaran Dibuka', color: 'emerald' },
  OPERASI:    { label: 'Tindakan Medis',    color: 'blue'  },
  PENUH:      { label: 'Operasional Padat', color: 'amber' },
  SELESAI:    { label: 'Off-Duty',          color: 'slate'  },
  LIBUR:      { label: 'Off-Duty',          color: 'slate'  },
  CUTI:       { label: 'Cuti',              color: 'amber' },
  TERJADWAL:  { label: 'Terjadwal',         color: 'blue'  },
};

const COLOR_BADGE = {
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  blue:  'bg-blue-50 text-blue-600',
  slate:  'bg-slate-100 text-slate-500',
};

type TabKey = 'semua' | 'hari_ini' | 'bertugas' | 'cuti';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.03)] animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100" />
        <div className="w-24 h-8 rounded-full bg-slate-100" />
      </div>
      <div className="h-5 bg-slate-100 rounded-lg mb-3 w-3/4" />
      <div className="h-4 bg-slate-50 rounded-lg mb-6 w-1/2" />
      <div className="h-16 bg-slate-50 rounded-2xl mb-4" />
      <div className="h-12 bg-slate-50 rounded-2xl" />
    </div>
  );
}

// ponytail: O(7) scan over fixed-size array — acceptable for ≤7 days
function nextShiftLabel(shifts: any[], todayDayIdx: number): { label: string; time: string } | null {
  if (!shifts?.length) return null;
  // sort by dayIdx, find next after today (wraps once around the week)
  const sorted = [...shifts].sort((a, b) => a.dayIdx - b.dayIdx);
  // look forward up to 7 days
  for (let d = 1; d <= 7; d++) {
    const targetDay = (todayDayIdx + d) % 7;
    const s = sorted.find((sh) => sh.dayIdx === targetDay);
    if (s) {
      const time = s.formattedTime || s.title || '';
      if (d === 1) return { label: 'Besok', time };
      if (d === 2) return { label: `Lusa, ${DAYS[targetDay]}`, time };
      if (d <= 6)  return { label: `Buka lagi ${DAYS[targetDay]}`, time };
      return { label: `Minggu depan (${DAYS[targetDay]})`, time };
    }
  }
  return null;
}

// ─── Apple iOS 2026 Doctor Card ──────────────────────────────────────────────
function DokterCard({ doc, todayDayIdx, onOpenDetail }: { doc: any; todayDayIdx: number; onOpenDetail: (doc: any) => void }) {
  const isOnLeave    = doc.isOnLeave;
  const isPracticing  = doc.isPracticing;
  const isDoneToday  = doc.isDoneToday;
  const hasAnyShift  = doc.hasAnyShift;
  const todayTime    = doc.todayShifts?.[0]?.formattedTime || doc.todayShifts?.[0]?.title;
  const activeLeave  = isOnLeave ? doc.leaveRequests?.[0] : null;
  const noSchedule   = !doc.hasTodayShift && !isOnLeave;
  const next         = nextShiftLabel(doc.shifts, todayDayIdx);

  const rawStatus = isOnLeave ? 'CUTI' : (doc.status || 'LIBUR');
  const statusInfo = STATUS_LABEL[rawStatus] ?? { label: rawStatus, color: 'slate' as const };
  const allDays = Array.from(new Set<number>(doc.shifts?.map((s: any) => s.dayIdx) ?? [])) as number[];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[32px] p-5 flex flex-col justify-between h-full',
        'border transition-all duration-500 apple-spring-hover',
        // ── Active / normal
        isPracticing && !isOnLeave
          ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_22px_55px_rgba(0,122,255,0.14)] border-slate-200/70 hover:border-[#007AFF]/40'
        // ── Cuti
        : isOnLeave
          ? 'bg-[#FFF5F5] border-[#FF3B30]/20 shadow-[0_8px_30px_rgba(255,59,48,0.05)] hover:shadow-[0_22px_55px_rgba(255,59,48,0.12)]'
        // ── Poli Selesai Hari Ini
        : isDoneToday
          ? 'bg-[#F9FAFB] border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.025)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.06)] opacity-80 hover:opacity-100'
        // ── Tidak Ada Jadwal
        : noSchedule && !hasAnyShift
          ? 'bg-[#F2F2F7]/70 border-dashed border-slate-300/60 shadow-none hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] opacity-60 hover:opacity-90'
        // ── Ada jadwal lain (tidak hari ini)
        : 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_22px_55px_rgba(0,122,255,0.10)] border-slate-200/70 hover:border-[#007AFF]/30'
      )}
    >
      {/* Overlay strip for done-today */}
      {isDoneToday && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-300 via-slate-200 to-transparent rounded-t-[32px]" />
      )}
      {/* Overlay strip for no-schedule */}
      {noSchedule && !hasAnyShift && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-transparent to-transparent rounded-t-[32px]" />
      )}

      {/* Top Header Row: iOS Squircle Avatar & Status Pill */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* iOS Squircle Avatar — dimmed for inactive states */}
          <div className={cn(
            "w-16 h-16 rounded-[22px] border p-0.5 shadow-xs overflow-hidden relative shrink-0 transition-all duration-500",
            isDoneToday || (noSchedule && !hasAnyShift)
              ? 'bg-slate-100 border-slate-200/60 grayscale group-hover:grayscale-0'
              : isOnLeave
              ? 'bg-[#FEE2E2] border-[#FF3B30]/20'
              : 'bg-[#F2F2F7] border-slate-200/80 group-hover:scale-105'
          )}>
            {doc.image ? (
              <Image src={doc.image} alt={doc.name} fill className="object-cover" sizes="64px" />
            ) : (
              <User size={28} className="text-slate-400 m-auto" />
            )}
          </div>

          {/* iOS Dynamic Status Pill */}
          <span
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border shadow-2xs',
              isOnLeave
                ? 'bg-[#FF3B30]/10 text-[#D70015] border-[#FF3B30]/25'
                : isPracticing
                ? 'bg-[#34C759]/10 text-[#248A3D] border-[#34C759]/25'
                : isDoneToday
                ? 'bg-slate-100 text-slate-500 border-slate-200'
                : noSchedule && !hasAnyShift
                ? 'bg-slate-50 text-slate-400 border-slate-200/60'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            )}
          >
            {isPracticing && !isOnLeave && (
              <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            )}
            {isDoneToday ? 'Selesai' : noSchedule && !hasAnyShift ? 'Tidak Ada Jadwal' : statusInfo.label}
          </span>
        </div>

        {/* Doctor Name & Specialty Tag */}
        <h2 className={cn(
          "font-black leading-snug text-[17px] transition-colors line-clamp-1",
          isDoneToday || (noSchedule && !hasAnyShift) ? 'text-slate-500 group-hover:text-slate-800' : 'text-slate-900 group-hover:text-[#007AFF]'
        )}>
          {doc.name}
        </h2>
        <span className={cn(
          "inline-flex items-center text-[12px] font-extrabold px-3 py-1 rounded-full mt-1.5 mb-3",
          isDoneToday || (noSchedule && !hasAnyShift)
            ? 'text-slate-400 bg-slate-100/80'
            : 'text-[#007AFF] bg-[#007AFF]/8'
        )}>
          {doc.specialty}
        </span>

        {/* Queue Code or Loket */}
        {doc.queueCode && (
          <div className="flex items-center gap-1.5 text-slate-500 text-[11.5px] font-extrabold mb-3">
            <Building2 size={13} className="text-[#007AFF]" />
            Loket Poli: <span className="text-slate-800 font-black">{doc.queueCode}</span>
          </div>
        )}
      </div>

      <div>
        {/* iOS Schedule Summary Widget (Lockscreen Live Activity Aesthetic) */}
        <div className={cn(
          "rounded-[22px] p-3.5 border mb-4",
          isDoneToday
            ? 'bg-slate-100/60 border-slate-200/50'
            : noSchedule && !hasAnyShift
            ? 'bg-slate-100/40 border-dashed border-slate-200/50'
            : isOnLeave
            ? 'bg-[#FF3B30]/5 border-[#FF3B30]/10'
            : 'bg-[#F2F2F7] border-slate-200/60'
        )}>
          {isOnLeave && activeLeave ? (
            <div className="flex items-center justify-between gap-2 text-rose-600">
              <div className="flex items-center gap-1.5 text-[11px] font-black">
                <AlertCircle size={14} className="text-[#FF3B30]" />
                Sedang Cuti
              </div>
              <span className="text-[11px] font-bold text-slate-600 truncate">
                s.d {new Date(activeLeave.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ) : isDoneToday ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-black uppercase tracking-wide">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Poli Selesai
              </div>
              <span className="text-[12px] font-bold text-slate-400">
                {next ? next.label : todayTime}
              </span>
            </div>
          ) : doc.hasTodayShift ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[#248A3D] text-[11px] font-black uppercase tracking-wide">
                <Sun size={14} className="text-[#34C759]" />
                Praktek Hari Ini
              </div>
              <span className="text-[13px] font-black text-slate-900">{todayTime}</span>
            </div>
          ) : next ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[#007AFF] text-[11px] font-black uppercase tracking-wide">
                <Clock size={14} />
                {next.label}
              </div>
              <span className="text-[13px] font-black text-slate-900">{next.time}</span>
            </div>
          ) : !hasAnyShift ? (
            <div className="flex items-center justify-center gap-2 text-[11.5px] text-slate-400 font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><line x1="10" x2="14" y1="15" y2="15"/></svg>
              Belum Ada Jadwal Poli
            </div>
          ) : (
            <div className="text-[11.5px] text-slate-400 font-bold text-center">
              Tidak Praktek Hari Ini
            </div>
          )}
        </div>

        {/* iOS Calendar Day Pills */}
        <div className="flex items-center justify-between gap-1 mb-4 px-1">
          {DAYS.map((dayName, idx) => {
            const hasShift = allDays.includes(idx);
            const isToday  = idx === todayDayIdx;
            return (
              <span
                key={dayName}
                className={cn(
                  'w-7 h-7 rounded-xl font-black text-[10px] flex items-center justify-center transition-all',
                  isToday && !isOnLeave && doc.hasTodayShift
                    ? isDoneToday
                      ? 'bg-slate-300 text-slate-500 line-through'
                      : 'bg-[#007AFF] text-white shadow-sm shadow-[#007AFF]/30 scale-105'
                    : hasShift
                    ? 'bg-slate-200/80 text-slate-800'
                    : 'text-slate-300'
                )}
                title={dayName}
              >
                {dayName.substring(0, 1)}
              </span>
            );
          })}
        </div>

        {/* Apple Primary Button — muted for inactive */}
        <button
          onClick={() => onOpenDetail(doc)}
          className={cn(
            "w-full py-3.5 px-4 rounded-[20px] font-extrabold text-[13px] active:scale-95 transition-all flex items-center justify-center gap-2",
            isPracticing && !isOnLeave
              ? 'bg-[#007AFF] hover:bg-[#0062D6] text-white shadow-[0_8px_20px_rgba(0,122,255,0.25)] hover:shadow-[0_12px_28px_rgba(0,122,255,0.35)]'
              : isOnLeave
              ? 'bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#D70015] border border-[#FF3B30]/20'
              : isDoneToday
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              : noSchedule && !hasAnyShift
              ? 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-400 border border-dashed border-slate-300'
              : 'bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/20'
          )}
        >
          <CalendarDays size={15} />
          {isDoneToday ? 'Riwayat Jadwal' : noSchedule && !hasAnyShift ? 'Info Dokter' : 'Lihat Jadwal Lengkap'}
          <ChevronRight size={15} className="ml-auto opacity-70" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PublikClient({ initialSettings = null }: { initialSettings?: any }) {
  const [mounted, setMounted]   = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch]     = useState('');
  const [activeSpec, setActiveSpec] = useState('Semua');
  const [activeTab, setActiveTab]   = useState<TabKey>('semua');
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [isNavSpecDropdownOpen, setIsNavSpecDropdownOpen] = useState(false);
  const navSpecDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 120);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navSpecDropdownRef.current && !navSpecDropdownRef.current.contains(event.target as Node)) {
        setIsNavSpecDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.remove('dark');
  }, []);

  // Data
  const { data, isLoading, mutate } = useSWR('/api/publik/dokter', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
    fallbackData: undefined,
  });

  const doctors: any[]      = data?.doctors ?? [];
  const todayDayIdx: number = data?.todayDayIdx ?? 0;
  const tomorrowDayIdx: number = data?.tomorrowDayIdx ?? 1;

  // Enrich doctors
  const enriched = useMemo(() => {
    const now = new Date();
    return doctors.map((doc: any) => {
      const activeLeaves = doc.leaveRequests?.filter((l: any) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        end.setHours(23, 59, 59, 999);
        return now >= start && now <= end;
      }) ?? [];
      const isOnLeave = activeLeaves.length > 0 || (doc.leaveRequests?.length > 0 && doc.status === 'CUTI');
      const todayShifts  = doc.shifts?.filter((s: any) => s.dayIdx === todayDayIdx) ?? [];
      const tomorrowShifts = doc.shifts?.filter((s: any) => s.dayIdx === tomorrowDayIdx) ?? [];
      const hasTodayShift = todayShifts.length > 0;
      const isPracticing = ['PRAKTEK', 'PENDAFTARAN', 'OPERASI'].includes(doc.status);
      // Detect if today's poli shift has ended (end time passed)
      const isDoneToday = hasTodayShift && !isPracticing && !isOnLeave &&
        ['SELESAI', 'LIBUR'].includes(doc.status);
      // Detect doctor with absolutely no schedule this week
      const hasAnyShift = (doc.shifts?.length ?? 0) > 0;
      return { 
        ...doc, 
        isOnLeave, 
        leaveRequests: activeLeaves.length > 0 ? activeLeaves : doc.leaveRequests,
        todayShifts, 
        tomorrowShifts, 
        hasTodayShift,
        isDoneToday,
        hasAnyShift,
        isPracticing 
      };
    });
  }, [doctors, todayDayIdx, tomorrowDayIdx]);

  // Separate list for Today's Doctors
  const todayDoctors = useMemo(() => {
    return enriched.filter(d => d.hasTodayShift && !d.isOnLeave);
  }, [enriched]);

  // Counts
  const counts = useMemo(() => ({
    all:     enriched.length,
    today:   todayDoctors.length,
    active:  enriched.filter(d => d.isPracticing && !d.isOnLeave).length,
    leave:   enriched.filter(d => d.isOnLeave).length,
  }), [enriched, todayDoctors]);

  // Specialties
  const specialties = useMemo(() => {
    // Normalize to Title Case before dedup — prevents "REHAB MEDIK" vs "Rehab Medik" duplicates
    const toTitle = (s: string) => s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
    const specs = Array.from(new Set(enriched.map(d => d.specialty ? toTitle(d.specialty) : null).filter(Boolean))).sort() as string[];
    return ['Semua', ...specs];
  }, [enriched]);

  const filteredAll = useMemo(() => enriched.filter(d => {
    const matchSpec   = activeSpec === 'Semua' || (d.specialty ?? '').toLowerCase().includes(activeSpec.toLowerCase());
    const matchSearch = !search
      || d.name.toLowerCase().includes(search.toLowerCase())
      || (d.specialty && d.specialty.toLowerCase().includes(search.toLowerCase()));
    const matchTab =
      activeTab === 'semua'    ? true :
      activeTab === 'hari_ini' ? (d.hasTodayShift && !d.isOnLeave) :
      activeTab === 'bertugas' ? (d.isPracticing && !d.isOnLeave) :
      activeTab === 'cuti'     ? d.isOnLeave : true;
    return matchSpec && matchSearch && matchTab;
  }), [enriched, search, activeSpec, activeTab]);

  const tabs: { key: TabKey; label: string; icon: any; count: number; activeClass: string; badgeClass: string }[] = [
    { key: 'semua',    label: 'Semua Dokter', icon: Users,    count: counts.all,    activeClass: 'bg-[#0F172A] text-white shadow-md shadow-slate-900/30 border border-slate-800', badgeClass: 'bg-white/20 text-white font-black' },
    { key: 'bertugas', label: 'Sedang Bertugas', icon: Activity, count: counts.active, activeClass: 'bg-[#059669] text-white shadow-md shadow-emerald-600/30 border border-emerald-600', badgeClass: 'bg-white/20 text-white font-black' },
    { key: 'hari_ini', label: 'Praktek Hari Ini', icon: Sun,   count: counts.today,  activeClass: 'bg-[#0284C7] text-white shadow-md shadow-sky-600/30 border border-sky-600', badgeClass: 'bg-white/20 text-white font-black' },
    { key: 'cuti',     label: 'Sedang Cuti', icon: Coffee,   count: counts.leave,  activeClass: 'bg-[#D97706] text-white shadow-md shadow-amber-600/30 border border-amber-600', badgeClass: 'bg-white/20 text-white font-black' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-slate-900 font-sans">

      {/* ═══════════════════════════════════════════════════════════
          INLINE NAVBAR — Has full access to filter state
          ═══════════════════════════════════════════════════════════ */}
      <>
        {/* ── FLOATING HEADER ── */}
        <header
          className={cn(
            "fixed z-[60] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/92 backdrop-blur-3xl border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)]",
            scrolled
              ? "top-3 left-1/2 -translate-x-1/2 w-[96vw] max-w-7xl rounded-[36px] px-4 py-3 sm:px-5"
              : "top-5 left-1/2 -translate-x-1/2 w-[94vw] max-w-4xl px-5 py-3 rounded-full"
          )}
        >
          {!scrolled ? (
            /* ── STATE NORMAL: Floating Pill ── */
            <div className="flex items-center justify-between gap-4">
              <Link href="/publik" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#007AFF] text-white group-hover:-translate-y-0.5 transition-transform duration-500 shadow-md shadow-[#007AFF]/25">
                  <Stethoscope size={20} />
                </div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="font-black tracking-tight text-slate-900 text-lg">
                    Siaga Medika<span className="text-[#007AFF]">.</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" /> Live 24/7
                  </span>
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 px-3 py-1 rounded-full border border-slate-200/60">
                <a href="#keseluruhan-jadwal" onClick={(e) => handleNavClick(e, '#keseluruhan-jadwal')}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-extrabold text-slate-700 hover:text-[#007AFF] hover:bg-white transition-all duration-300 cursor-pointer">
                  <Users size={14} className="text-[#007AFF]" /> Jadwal Dokter
                </a>
              </nav>
              <div className="flex items-center gap-2 shrink-0">
                <a href="tel:0281895111" className="hidden sm:inline-flex items-center gap-2 bg-[#34C759] hover:bg-[#28A745] text-white font-black rounded-full px-4.5 py-2 text-xs transition-all duration-300 shadow-md shadow-[#34C759]/30 hover:scale-105 active:scale-95">
                  <PhoneCall size={14} /> IGD 24 Jam
                </a>
                <button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 rounded-full bg-[#E5E5EA] hover:bg-[#D1D1D6] text-slate-900 shadow-xs border border-slate-300/50 flex items-center justify-center active:scale-95 transition-all">
                  <Menu size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* ── STATE SCROLLED: Full Floating Filter Panel ── */
            <div className="animate-in fade-in slide-in-from-top-3 duration-400">
              {/* Top Row: Brand + IGD */}
              <div className="flex items-center justify-between gap-4 mb-3">
                <Link href="/publik" className="flex items-center gap-2 shrink-0 group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#007AFF] text-white shadow-sm shadow-[#007AFF]/25">
                    <Stethoscope size={16} />
                  </div>
                  <span className="font-black tracking-tight text-slate-900 text-sm hidden sm:block">
                    Siaga Medika<span className="text-[#007AFF]">.</span>
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" /> Live
                  </span>
                </Link>

                {/* Compact Search Bar */}
                <div className="flex-1 max-w-2xl relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007AFF] pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    inputMode="search"
                    placeholder="Cari dokter atau spesialisasi..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#F2F2F7] border border-slate-300/60 pl-11 pr-10 py-2.5 rounded-2xl text-slate-800 placeholder:text-slate-400 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-400 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>

                <a href="tel:0281895111" className="shrink-0 inline-flex items-center gap-1.5 bg-[#34C759] hover:bg-[#28A745] text-white font-black rounded-2xl px-3 py-2 text-xs shadow-md shadow-[#34C759]/25 hover:scale-105 active:scale-95 transition-all">
                  <PhoneCall size={13} />
                  <span className="hidden sm:inline">IGD</span>
                </a>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-200/80 mb-2.5" />

              {/* Tab Filters + Specialty Row */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                {/* Status Tabs — compact scroll */}
                <div className="flex bg-[#F2F2F7] p-1 rounded-[18px] overflow-x-auto hide-scrollbar gap-0.5 shrink-0">
                  {tabs.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          'flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] font-black text-[12px] transition-all duration-300 whitespace-nowrap shrink-0',
                          isActive ? tab.activeClass : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                        )}
                      >
                        <tab.icon size={13} className={isActive ? 'opacity-100' : 'opacity-60'} />
                        <span>{tab.label}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-black",
                          isActive ? tab.badgeClass : "bg-slate-200 text-slate-500"
                        )}>{tab.count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Specialty Dropdown — compact */}
                <div className="relative shrink-0 w-full sm:w-[200px]" ref={navSpecDropdownRef}>
                  <button
                    onClick={() => setIsNavSpecDropdownOpen(!isNavSpecDropdownOpen)}
                    className="w-full flex items-center justify-between bg-[#E5E5EA] border border-slate-300/70 text-slate-900 font-extrabold text-[12px] py-2 pl-4 pr-3 rounded-2xl hover:bg-[#D1D1D6] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                  >
                    <span className="truncate">{activeSpec}</span>
                    <ChevronDown size={15} className={cn("text-slate-400 transition-transform duration-300 shrink-0", isNavSpecDropdownOpen ? "rotate-180" : "")} />
                  </button>
                  {isNavSpecDropdownOpen && (
                    <div className="absolute z-[70] top-full mt-2 w-full bg-white/95 backdrop-blur-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-[20px] overflow-hidden">
                      <div className="max-h-[220px] overflow-y-auto p-2 space-y-1 hide-scrollbar">
                        {specialties.map(spec => (
                          <button
                            key={spec}
                            onClick={() => { setActiveSpec(spec); setIsNavSpecDropdownOpen(false); }}
                            className={cn(
                              "w-full text-left px-3.5 py-2.5 rounded-[12px] font-extrabold text-[12px] transition-all",
                              activeSpec === spec ? "bg-[#007AFF] text-white" : "text-slate-700 hover:bg-slate-100"
                            )}
                          >{spec}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Mobile Drawer */}
        <div className={cn("fixed inset-0 z-[100] transition-all duration-500 md:hidden", mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
          <div className={cn("absolute right-0 top-0 bottom-0 w-[80vw] max-w-sm bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col p-8 transition-transform duration-500 rounded-l-[40px] border-l border-slate-200", mobileOpen ? "translate-x-0" : "translate-x-full")}>
            <div className="flex justify-between items-center mb-12">
              <span className="font-black text-xl text-slate-900">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="w-10 h-10 rounded-full bg-[#E5E5EA] flex items-center justify-center active:scale-95">
                <X size={18} className="text-slate-600" />
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              <a href="#keseluruhan-jadwal" onClick={(e) => { setMobileOpen(false); handleNavClick(e, '#keseluruhan-jadwal'); }}
                className="flex items-center gap-4 px-5 py-4 rounded-3xl font-extrabold text-base text-slate-700 bg-slate-100/70 hover:bg-slate-200/60 transition-all">
                <Users size={18} className="text-[#007AFF]" /> Jadwal Dokter
              </a>
            </nav>
            <div className="mt-auto">
              <a href="tel:0281895111" className="flex items-center justify-center gap-2 bg-[#34C759] text-white py-4 rounded-full font-black shadow-md w-full text-base hover:bg-[#28A745] transition-all">
                <PhoneCall size={18} /> Panggil IGD 24 Jam
              </a>
            </div>
          </div>
        </div>
      </>

      {/* ─── Main Content ─── */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-24 space-y-16">
        
        {/* ── 3D Modern Claymorphism Hospital Hero Banner ── */}
        <div className="relative rounded-[48px] bg-white/70 backdrop-blur-3xl border border-white p-8 sm:p-12 lg:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* 3D Soft Pastel Lighting Orbs */}
          <div className="absolute -top-32 -left-32 w-[450px] h-[450px] bg-[#007AFF]/10 blur-[110px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-[450px] h-[450px] bg-[#34C759]/10 blur-[110px] rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#AF52DE]/10 blur-[120px] rounded-full pointer-events-none" />
          
          {/* Subtle Clay Track Pattern Inset */}
          <div className="absolute inset-4 rounded-[48px] border border-slate-200/40 pointer-events-none shadow-[inset_0_3px_10px_rgba(0,0,0,0.02)]" />

          <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-7">
              {/* Apple iOS 2026 Pill Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,122,255,0.12)] border border-white text-xs font-black text-slate-900 transition-all hover:scale-105">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#007AFF]" />
                </span>
                <span className="text-slate-900 font-black tracking-wide">
                  RS Siaga Medika • iOS 2026 Health Ecosystem
                </span>
              </div>

              {/* Apple Headline */}
              <h1 className="text-[44px] sm:text-[58px] xl:text-[64px] font-black tracking-tight leading-[1.05] text-slate-900">
                Pusat Layanan Kesehatan <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#AF52DE]">
                  Spesialis Terpercaya & Presisi.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-500 text-base sm:text-lg font-bold max-w-xl leading-relaxed">
                Akses informasi jadwal dokter spesialis ter-update secara real-time, akurat, dan transparan dalam antarmuka Apple iOS 2026.
              </p>

              {/* Apple iOS CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#keseluruhan-jadwal"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('keseluruhan-jadwal')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-3 px-8 py-4.5 rounded-[22px] bg-[#007AFF] hover:bg-[#0062D6] text-white font-black text-sm shadow-[0_15px_30px_rgba(0,122,255,0.35)] hover:shadow-[0_20px_40px_rgba(0,122,255,0.45)] hover:-translate-y-1 active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  Temukan Dokter Spesialis
                  <ArrowRight size={18} />
                </a>

                <a
                  href="tel:0281895111"
                  className="inline-flex items-center gap-2.5 px-7 py-4.5 rounded-[22px] bg-[#E5E5EA] border border-slate-300/60 text-slate-900 font-black text-sm hover:bg-[#D1D1D6] shadow-sm hover:-translate-y-0.5 transition-all duration-300"
                >
                  <PhoneCall size={18} className="text-[#34C759]" />
                  Layanan Darurat IGD 24/7
                </a>
              </div>
            </div>

            {/* Right Column: 3D Isometric Art + Floating Clay Stats */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              {/* 3D Art Floating Podium */}
              <div className="relative w-full max-w-[500px] aspect-square rounded-[40px] bg-gradient-to-b from-white/80 to-slate-100/60 p-4 border border-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] flex items-center justify-center group apple-spring-hover animate-antigravity">
                <div className="relative w-full h-full rounded-[32px] overflow-hidden">
                  <Image
                    src="/hero-3d.png"
                    alt="RS Siaga Medika 3D Hospital"
                    fill
                    className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.12)] group-hover:scale-108 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    priority
                  />
                </div>

                {/* Floating 3D Badge 1 - Left Top (Anti-gravity floating) */}
                <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-2xl p-4 rounded-[28px] border border-white shadow-[0_15px_35px_rgba(0,0,0,0.08)] flex items-center gap-3 animate-antigravity-fast apple-spring-hover">
                  <div className="w-12 h-12 rounded-[20px] bg-[#007AFF] flex items-center justify-center text-white shadow-md shadow-[#007AFF]/30">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{isLoading ? '—' : counts.all}</p>
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Total Dokter</p>
                  </div>
                </div>

                {/* Floating 3D Badge 2 - Right Bottom (Anti-gravity floating reverse) */}
                <div className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-2xl p-4 rounded-[28px] border border-white shadow-[0_15px_35px_rgba(0,0,0,0.08)] flex items-center gap-3 animate-antigravity-reverse apple-spring-hover">
                  <div className="w-12 h-12 rounded-[20px] bg-[#34C759] flex items-center justify-center text-white shadow-md shadow-[#34C759]/30">
                    <Sun size={22} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{isLoading ? '—' : counts.today}</p>
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Praktek Hari Ini</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* ── SECTION 2: KESELURUHAN JADWAL & DIREKTORI DOKTER ── */}
        <section id="keseluruhan-jadwal" className="scroll-mt-28">

          {/* All Doctor Grid */}
          {!isLoading && filteredAll.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredAll.map((doc: any, i: number) => (
                <div
                  key={doc.id}
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                  className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                >
                  <DokterCard doc={doc} todayDayIdx={todayDayIdx} onOpenDetail={setSelectedDoctor} />
                </div>
              ))}
            </div>
          )}

          {/* Loading / Empty State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!isLoading && filteredAll.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              <div className="w-20 h-20 bg-[#F2F2F7] rounded-full flex items-center justify-center mb-5">
                <Search size={32} className="text-slate-400" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-xl mb-2 tracking-tight">Dokter tidak ditemukan</h3>
              <p className="text-slate-500 font-medium mb-6 max-w-sm text-center text-sm">
                Tidak ada dokter yang sesuai dengan pencarian atau filter spesialisasi Anda.
              </p>
              <button
                onClick={() => { setSearch(''); setActiveSpec('Semua'); setActiveTab('semua'); }}
                className="px-6 py-3.5 rounded-full bg-[#007AFF] text-white font-bold text-sm shadow-[0_15px_35px_rgba(0,122,255,0.3)] hover:-translate-y-1 hover:bg-[#0062D6] transition-all"
              >
                Reset Filter
              </button>
            </div>
          )}
        </section>

        {/* ── Apple iOS 2026 Schedule Detail Sheet Modal (Total Redesign) ── */}
        {selectedDoctor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xl animate-in fade-in duration-500" 
              onClick={() => setSelectedDoctor(null)} 
            />
            
            <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-3xl rounded-[40px] shadow-[0_50px_130px_rgba(0,0,0,0.25)] border border-white/90 z-10 my-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden">
              
              {/* iOS Sheet Grab Handle Bar */}
              <div className="w-12 h-1.5 rounded-full bg-slate-300/80 mx-auto mt-3 mb-1 relative z-30" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-200/80 backdrop-blur-md flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-all z-30 shadow-xs"
              >
                <X size={16} />
              </button>

              {/* Modal Doctor Header Card (Apple Card Aesthetic) */}
              <div className="p-6 sm:p-7 bg-gradient-to-b from-[#F2F2F7] to-white border-b border-slate-200/60 relative flex items-center gap-5">
                {/* Avatar Squircle Podium */}
                <div className="w-20 h-20 rounded-[24px] bg-white p-0.5 border border-slate-200/80 shadow-md flex items-center justify-center overflow-hidden relative shrink-0">
                  {selectedDoctor.image ? (
                    <Image src={selectedDoctor.image} alt={selectedDoctor.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <User size={32} className="text-slate-300" />
                  )}
                  {(selectedDoctor.isPracticing && !selectedDoctor.isOnLeave) && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#34C759] rounded-full border-2 border-white shadow-md flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-extrabold text-[11px] mb-1">
                    <Stethoscope size={12} />
                    {selectedDoctor.specialty}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">
                    {selectedDoctor.name}
                  </h2>
                  {selectedDoctor.queueCode && (
                    <p className="text-slate-500 text-xs font-bold mt-1">
                      Poli / Loket: <span className="text-slate-900 font-black">{selectedDoctor.queueCode}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 relative z-10">
                {/* Schedule Section Title */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#007AFF] flex items-center justify-center text-white shadow-sm shadow-[#007AFF]/30">
                      <CalendarDays size={16} />
                    </div>
                    <h3 className="font-black text-slate-900 text-base tracking-tight">
                      Jadwal Mingguan Dokter
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400">Pembaruan Real-time</span>
                </div>

                {/* Grouped Schedule Items (Apple Grouped Table View) */}
                <div className="bg-[#F2F2F7] rounded-[28px] p-2.5 border border-slate-200/60 space-y-2 max-h-[42vh] overflow-y-auto hide-scrollbar">
                  {DAYS.map((dayName, dayIdx) => {
                    const shifts = selectedDoctor.shifts?.filter((s: any) => s.dayIdx === dayIdx) ?? [];
                    const isToday = dayIdx === todayDayIdx;
                    const hasShift = shifts.length > 0;

                    return (
                      <div
                        key={dayName}
                        className={cn(
                          'p-3.5 rounded-[20px] flex items-center justify-between transition-all duration-300 border',
                          isToday 
                            ? 'bg-[#34C759]/10 border-[#34C759]/40 shadow-xs' 
                            : 'bg-white border-slate-200/50 shadow-2xs'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs',
                            isToday 
                              ? 'bg-[#34C759] text-white shadow-xs' 
                              : hasShift 
                                ? 'bg-[#007AFF] text-white shadow-xs' 
                                : 'bg-slate-200/70 text-slate-400'
                          )}>
                            {dayName.substring(0, 3)}
                          </span>
                          <div>
                            <p className={cn("font-black text-sm", hasShift ? "text-slate-900" : "text-slate-400")}>{dayName}</p>
                            {isToday && (
                              <span className="text-[10px] font-black text-[#248A3D] uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" /> Hari Ini
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col gap-1 items-end">
                          {hasShift ? (
                            shifts.map((s: any, idx: number) => (
                              <div key={idx} className="inline-flex items-center gap-1.5 font-black text-slate-800 bg-[#F2F2F7] px-3 py-1 rounded-xl text-xs">
                                <Clock size={12} className="text-[#007AFF]" />
                                {s.formattedTime || s.title}
                              </div>
                            ))
                          ) : (
                            <span className="text-[11.5px] font-bold text-slate-300 italic">
                              Tidak Ada Praktek
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="flex-1 py-3.5 rounded-[22px] bg-[#E5E5EA] hover:bg-[#D1D1D6] text-slate-900 font-black text-[14px] transition-colors"
                  >
                    Tutup
                  </button>
                  {selectedDoctor.isPracticing && !selectedDoctor.isOnLeave && (
                    <button
                      onClick={() => alert("Fitur pendaftaran online sedang dalam pengembangan.")}
                      className="flex-[2] py-3.5 rounded-[22px] bg-[#007AFF] hover:bg-[#0051A8] text-white font-black text-[14px] shadow-md shadow-[#007AFF]/30 active:scale-95 transition-all"
                    >
                      Daftar Antrean Online
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="relative z-10 border-t border-purple-100/60 bg-white/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#A7F3D0] to-[#6EE7B7] rounded-xl flex items-center justify-center shadow-sm">
              <Stethoscope size={20} className="text-emerald-900" />
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-lg leading-none block">
                Siaga Medika<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A78BFA] to-[#F472B6]">.</span>
              </span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Purbalingga</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-extrabold text-slate-600">
            <a href="tel:0281895111" className="flex items-center gap-2 hover:text-[#A78BFA] transition-colors">
              <Phone size={16} className="text-emerald-500" /> (0281) 895 111
            </a>
            <Link href="/login" className="hover:text-[#A78BFA] transition-colors">
              Admin Access
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
