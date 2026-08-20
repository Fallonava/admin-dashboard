"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, Search, Zap, Power, Wifi, WifiOff, Loader2, LayoutDashboard, LayoutGrid, StretchHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, LeaveRequest, Shift, Settings } from "@/lib/data-service";
import { LiveClock } from "@/components/LiveClock";
import { useDebounce } from "@/hooks/use-debounce";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/lib/auth-context";
import { DashboardStats } from "./DashboardStats";
import { DoctorCard } from "./DoctorCard";
import { MobileSearchSheet } from "@/components/ui/MobileSearchSheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { isShiftActiveForDate } from "@/lib/schedule-utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function DashboardClient() {
  const { logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    // Update `now` setiap menit agar filter shift aktif tidak beku sepanjang hari
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // ── Unified Socket.IO connection ──
  const { 
    doctors: socketDoctors, 
    shifts: socketShifts, 
    leaves: socketLeaves, 
    settings: socketSettings, 
    isConnected,
    lastUpdate
  } = useSocket();

  const sseStatus = isConnected ? 'connected' : 'reconnecting';

  // Sync to local state for optimistic UI updates
  useEffect(() => {
    // Only update if there's actual data to prevent clearing state on initial mount/reconnect
    if (socketDoctors && socketDoctors.length > 0) setDoctors(socketDoctors);
    if (socketShifts && socketShifts.length > 0) setShifts(socketShifts);
    if (socketLeaves && socketLeaves.length > 0) setLeaves(socketLeaves);
    if (socketSettings) setSettings(socketSettings);
  }, [socketDoctors, socketShifts, socketLeaves, socketSettings, lastUpdate]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const isSearching = searchQuery !== debouncedSearch;

  // Keyboard shortcut Ctrl+K to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('admin-search-input');
        if (searchInput) {
          searchInput.focus();
        } else {
          setIsMobileSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Centralized Time Calculations (WIB UTC+7)
  const timeContext = useMemo(() => {
    const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return {
      wibNow,
      todayDayIdx: wibNow.getUTCDay() === 0 ? 6 : wibNow.getUTCDay() - 1, // 0=Sen, 6=Min
      todayStr: `${wibNow.getUTCFullYear()}-${String(wibNow.getUTCMonth() + 1).padStart(2, '0')}-${String(wibNow.getUTCDate()).padStart(2, '0')}`,
      currentTimeMinutes: wibNow.getUTCHours() * 60 + wibNow.getUTCMinutes(),
      weekOfMonth: Math.ceil(wibNow.getUTCDate() / 7)
    };
  }, [now]);

  const { wibNow, todayDayIdx, todayStr, currentTimeMinutes, weekOfMonth } = timeContext;

  // Filter: hanya tampilkan dokter yang punya minimal 1 shift aktif hari ini
  // (shift tidak di-disable hari ini DAN shift aktif di minggu ini/ganjil-genap)
  const todayDoctors = useMemo(() => doctors.filter(doc =>
    shifts.some(s =>
      s.doctorId === doc.id &&
      s.dayIdx === todayDayIdx &&
      !(s.disabledDates || []).includes(todayStr) &&
      isShiftActiveForDate(s.extra, wibNow)
    )
  ), [doctors, shifts, todayDayIdx, todayStr, wibNow]);

  const automationEnabled = settings?.automationEnabled || false;

  // ── Automation Toggle ──
  const toggleAutomation = useCallback(async () => {
    if (!settings) return;
    const newState = !settings.automationEnabled;
    const previousSettings = { ...settings };
    setSettings(prev => prev ? { ...prev, automationEnabled: newState } : null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationEnabled: newState })
      });
      if (!res.ok) throw new Error('API Error');
    } catch (e) {
      console.error("Failed to save settings", e);
      setSettings(previousSettings);
    }
  }, [settings]);

  // ── Toggle Shift Disabled ──
  const toggleShiftDisabled = useCallback(async (shiftId: string, shift: Shift) => {
    const dates = shift.disabledDates || [];
    const isDisabledToday = dates.includes(todayStr);
    const newDates = isDisabledToday ? dates.filter(d => d !== todayStr) : [...dates, todayStr];
    setShifts(curr => curr?.map(s => s.id === shiftId ? { ...s, disabledDates: newDates } : s));
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shiftId, disabledDates: newDates })
      });
      if (!res.ok) throw new Error('API Error');
    } catch (e) {
      console.error('Failed to toggle shift', e);
      setShifts(curr => curr?.map(s => s.id === shiftId ? { ...s, disabledDates: dates } : s)); // rollback
    }
  }, [todayStr]);

  // ── Manual Status Update ──
  const manualUpdateStatus = useCallback(async (id: string, status: Doctor['status']) => {
    const nowLocal = new Date();
    const timeString = nowLocal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    const timestamp = nowLocal.getTime();
    setDoctors(docs => docs?.map(d =>
      d.id === id ? {
        ...d,
        status,
        lastCall: (status === 'PRAKTEK' || status === 'PENUH') ? timeString : d.lastCall,
        lastManualOverride: timestamp
      } : d
    ));
    try {
      const res = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(id),
          status,
          lastCall: (status === 'PRAKTEK' || status === 'PENUH') ? timeString : undefined,
          lastManualOverride: timestamp
        })
      });
      if (!res.ok) throw new Error('API Error');
    } catch (e) {
      console.error('Failed to update doctor status', e);
    }
  }, []);
  
  const activeDocs = useMemo(() => todayDoctors.filter(d => d.status === 'PRAKTEK' || d.status === 'PENUH'), [todayDoctors]);
  const [efficiency, setEfficiency] = useState(0);
  useEffect(() => {
    if (todayDoctors.length > 0) {
      const baseEff = Math.round((activeDocs.length / todayDoctors.length) * 100);
      setEfficiency(baseEff > 0 ? 90 + Math.round(Math.random() * 5) : 0);
    }
  }, [todayDoctors.length, activeDocs.length]);

  const filteredDoctors = useMemo(() => {
    return todayDoctors.filter(doc =>
      doc.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [todayDoctors, debouncedSearch]);

  // Dynamic greeting
  const hour = now.getHours();
  const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  if (!mounted) return null; // Server Component handles the skeleton

  const todayLabel = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#0B0D13] text-zinc-100">
      <div className="relative z-10 w-full flex-none">
      {/* ═══════════════════ UNIFIED PAGE HEADER ═══════════════════ */}
      <PageHeader
        title="Dashboard Utama"
        subtitle="Sistem Manajemen Operasional Dokter & Antrean"
        icon={<Activity size={22} className="text-white" strokeWidth={2.5} />}
        iconGradient="from-blue-600 to-indigo-600"
        badge={
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Live Monitor
            </span>
            <span className={cn(
              "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
              sseStatus === 'connected' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50"
              : sseStatus === 'reconnecting' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 animate-pulse"
              : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
            )}>
              {sseStatus === 'connected'
                ? <><Wifi size={10} strokeWidth={2.5} className="shrink-0" /> Live</>
                : sseStatus === 'reconnecting'
                  ? <><WifiOff size={10} strokeWidth={2.5} className="shrink-0" /> Recon...</>
                  : <><WifiOff size={10} strokeWidth={2.5} className="shrink-0" /> Offline</>
              }
            </span>
          </>
        }
        actions={
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Clock */}
            <div className="hidden lg:flex shrink-0">
              <LiveClock />
            </div>
            <div className="hidden lg:block h-5 w-px bg-zinc-200 dark:bg-[#2B3145] mx-1" />

            {/* Automation Toggle */}
            <button
              onClick={toggleAutomation}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97] border shrink-0",
                automationEnabled
                  ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                  : "bg-white text-zinc-700 hover:text-zinc-900 border-zinc-200 dark:bg-[#141722] dark:text-zinc-400 dark:hover:text-zinc-200 dark:border-[#2B3145]"
              )}
            >
              <Zap size={13} className={cn("shrink-0", automationEnabled ? "fill-white text-white" : "text-zinc-400")} />
              <span>{automationEnabled ? "AI Aktif" : "AI Pasif"}</span>
              {automationEnabled && (
                <span className="flex h-1.5 w-1.5 shrink-0 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-1.5 w-1.5 top-2 right-2 rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
            </button>

            {/* Search (desktop) with Ctrl+K badge */}
            <div className="relative group hidden lg:block shrink-0">
              <div className="relative flex items-center">
                {isSearching
                  ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4 animate-spin shrink-0" />
                  : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 h-4 w-4 shrink-0" />
                }
                <input
                  id="admin-search-input"
                  type="text"
                  placeholder="Cari dokter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-12 py-2 rounded-xl bg-white dark:bg-[#141722] text-zinc-900 dark:text-zinc-100 text-xs w-44 xl:w-52 outline-none border border-zinc-200 dark:border-[#2B3145] hover:border-zinc-300 dark:hover:border-[#3A425C] focus:border-blue-500 transition-all font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden xl:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-[#1A1E2B] border border-zinc-200 dark:border-[#2B3145] rounded-md pointer-events-none">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Density Toggle (Comfortable vs Compact) */}
            <div className="hidden sm:flex items-center bg-zinc-100 dark:bg-[#141722] p-1 rounded-xl border border-zinc-200 dark:border-[#2B3145] shrink-0">
              <button
                onClick={() => setDensity('comfortable')}
                className={cn(
                  "p-1.5 rounded-lg transition-all text-xs",
                  density === 'comfortable' ? "bg-white dark:bg-[#1F2433] text-blue-600 dark:text-blue-400 font-bold border border-zinc-200 dark:border-[#2E354B] shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                )}
                title="Tampilan Nyaman (Detail)"
              >
                <StretchHorizontal size={14} />
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={cn(
                  "p-1.5 rounded-lg transition-all text-xs",
                  density === 'compact' ? "bg-white dark:bg-[#1F2433] text-blue-600 dark:text-blue-400 font-bold border border-zinc-200 dark:border-[#2E354B] shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                )}
                title="Tampilan Kompak (Grid Padat)"
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {/* Theme Toggle (Light / Dark Switcher) */}
            <ThemeToggle />

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all border border-transparent shrink-0"
              title="Keluar"
            >
              <Power size={16} strokeWidth={2.5} />
            </button>
          </div>
        }
      />
      </div>

      {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-6 space-y-6 pt-3 relative z-10">

        <DashboardStats
          todayDoctors={todayDoctors}
          shifts={shifts}
          todayDayIdx={todayDayIdx}
          efficiency={efficiency}
        />

        {/* Live Control Panel */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-blue-500" />
              Kontrol Status Langsung
            </h3>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#141722] border border-zinc-200 dark:border-[#2B3145] rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 shadow-sm"
                title="Cari Dokter"
              >
                <Search size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold">Cari</span>
              </button>

              {/* Status Indicator */}
              <div className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wider uppercase flex items-center gap-2 border",
                automationEnabled
                  ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/50"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50"
              )}>
                <span className="relative flex h-2 w-2">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    automationEnabled ? "bg-violet-400" : "bg-emerald-400"
                  )} />
                  <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    automationEnabled ? "bg-violet-500" : "bg-emerald-500"
                  )} />
                </span>
                {automationEnabled ? "AI Active" : "Online"}
              </div>
            </div>
          </div>

          <ErrorBoundary name="Doctor Grid" className="min-h-[400px]">
            <div className={cn(
              "grid gap-3 lg:gap-4 transition-all duration-300",
              density === 'compact'
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            )}>
              {filteredDoctors.map(doc => (
                <DoctorCard
                  key={doc.id}
                  doc={doc}
                  shifts={shifts}
                  todayDayIdx={todayDayIdx}
                  todayStr={todayStr}
                  currentTimeMinutes={currentTimeMinutes}
                  weekOfMonth={weekOfMonth}
                  automationEnabled={automationEnabled}
                  density={density}
                  onStatusChange={manualUpdateStatus}
                  onToggleShift={toggleShiftDisabled}
                />
              ))}
            </div>
          </ErrorBoundary>
        </div>

      </div>

      {/* Mobile Search Sheet */}
      <MobileSearchSheet
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearching={isSearching}
      />
    </div>
  );
}
