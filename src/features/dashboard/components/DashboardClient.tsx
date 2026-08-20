"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, Search, Zap, Wifi, WifiOff, Loader2, LayoutDashboard, LayoutGrid, StretchHorizontal } from "lucide-react";
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
      const realEff = Math.round((activeDocs.length / todayDoctors.length) * 100);
      setEfficiency(realEff);
    } else {
      setEfficiency(0);
    }
  }, [todayDoctors.length, activeDocs.length]);

  const [statusFilter, setStatusFilter] = useState<string>("SEMUA");

  const STATUS_FILTERS = useMemo(() => [
    { id: "SEMUA", label: "Semua", count: todayDoctors.length },
    { id: "PRAKTEK", label: "Praktek", count: todayDoctors.filter(d => d.status === 'PRAKTEK').length },
    { id: "OPERASI", label: "Operasi", count: todayDoctors.filter(d => d.status === 'OPERASI').length },
    { id: "PENUH", label: "Penuh", count: todayDoctors.filter(d => d.status === 'PENUH').length },
    { id: "CUTI", label: "Cuti", count: todayDoctors.filter(d => d.status === 'CUTI').length },
    { id: "SELESAI", label: "Selesai", count: todayDoctors.filter(d => d.status === 'SELESAI').length },
  ], [todayDoctors]);

  const filteredDoctors = useMemo(() => {
    return todayDoctors.filter(doc => {
      const matchSearch = doc.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchStatus = statusFilter === "SEMUA" || doc.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [todayDoctors, debouncedSearch, statusFilter]);

  // Dynamic greeting
  const hour = now.getHours();
  const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  if (!mounted) return null; // Server Component handles the skeleton

  const todayLabel = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100">
      <div className="relative z-10 w-full flex-none">
      {/* ═══════════════════ UNIFIED PAGE HEADER ═══════════════════ */}
      <PageHeader
        title="Dashboard Utama"
        subtitle="Sistem Manajemen Operasional Dokter & Antrean"
        icon={<Activity size={22} className="text-white" strokeWidth={2.5} />}
        iconClay="clay-icon-blue w-10 h-10 lg:w-12 lg:h-12"
        accentBarGradient="from-blue-500 via-indigo-500 to-cyan-400"
        accentColor="text-blue-600 dark:text-blue-400"
        badge={
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold clay-button text-blue-700 dark:text-blue-400 shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Live Monitor
            </span>
            <span className={cn(
              "hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold shrink-0",
              sseStatus === 'connected' ? "clay-pill-emerald text-white"
              : sseStatus === 'reconnecting' ? "clay-pill-amber text-white animate-pulse"
              : "clay-button text-zinc-500"
            )}>
              {sseStatus === 'connected'
                ? <><Wifi size={11} strokeWidth={2.5} className="shrink-0" /> Live</>
                : sseStatus === 'reconnecting'
                  ? <><WifiOff size={11} strokeWidth={2.5} className="shrink-0" /> Recon...</>
                  : <><WifiOff size={11} strokeWidth={2.5} className="shrink-0" /> Offline</>
              }
            </span>
          </>
        }
        actions={
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Clock */}
            <div className="hidden lg:flex shrink-0">
              <LiveClock />
            </div>
            <div className="hidden lg:block h-6 w-px bg-zinc-300 dark:bg-[#2B3145] mx-1" />

            {/* Automation Toggle */}
            <button
              onClick={toggleAutomation}
              className={cn(
                "touch-ripple flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-black transition-all active:scale-[0.97] shrink-0",
                automationEnabled
                  ? "clay-pill-violet text-white"
                  : "clay-button text-zinc-700 dark:text-zinc-300"
              )}
            >
              <Zap size={14} className={cn("shrink-0", automationEnabled ? "fill-white text-white" : "text-zinc-500")} />
              <span>{automationEnabled ? "AI Aktif" : "AI Pasif"}</span>
              {automationEnabled && (
                <span className="flex h-2 w-2 shrink-0 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
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
                  className="pl-9 pr-12 py-2 rounded-[16px] clay-inset text-zinc-900 dark:text-zinc-100 text-xs w-48 xl:w-56 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden xl:inline-flex items-center px-1.5 py-0.5 text-[9px] font-black text-zinc-500 dark:text-zinc-400 clay-button rounded-md pointer-events-none">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Density Toggle (Comfortable vs Compact) */}
            <div className="hidden sm:flex items-center clay-inset p-1 rounded-[16px] shrink-0">
              <button
                onClick={() => setDensity('comfortable')}
                className={cn(
                  "p-2 rounded-xl transition-all text-xs",
                  density === 'comfortable' ? "clay-surface text-blue-600 dark:text-blue-400 font-black shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                title="Tampilan Nyaman (Detail)"
              >
                <StretchHorizontal size={15} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={cn(
                  "p-2 rounded-xl transition-all text-xs",
                  density === 'compact' ? "clay-surface text-blue-600 dark:text-blue-400 font-black shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                title="Tampilan Kompak (Grid Padat)"
              >
                <LayoutGrid size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Theme Toggle (Light / Dark Switcher) */}
            <ThemeToggle />
          </div>
        }
      />
      </div>

      {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-32 lg:pb-8 space-y-6 pt-3 relative z-10">

        <DashboardStats
          todayDoctors={todayDoctors}
          shifts={shifts}
          todayDayIdx={todayDayIdx}
          efficiency={efficiency}
        />

        {/* Live Control Panel */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <span className="w-2.5 h-5 rounded-full clay-pill-blue" />
              Kontrol Status Langsung
            </h3>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 clay-button rounded-[16px] text-zinc-700 dark:text-zinc-300 shadow-sm"
                title="Cari Dokter"
              >
                <Search size={14} strokeWidth={2.5} />
                <span className="text-xs font-black">Cari</span>
              </button>

              {/* Status Indicator */}
              <div className={cn(
                "px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wider uppercase flex items-center gap-2",
                automationEnabled ? "clay-pill-violet text-white" : "clay-pill-emerald text-white"
              )}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                {automationEnabled ? "AI Active" : "Online"}
              </div>
            </div>
          </div>

          {/* ═══════════ CLAY SEGMENTED FILTER PILLS ═══════════ */}
          <div className="clay-inset p-1.5 rounded-[22px] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {STATUS_FILTERS.map(f => {
              const isSelected = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-[18px] text-xs font-black whitespace-nowrap transition-all duration-150 active:scale-95 shrink-0",
                    isSelected
                      ? "clay-surface text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full",
                      isSelected
                        ? "clay-pill-blue text-white"
                        : "clay-button text-zinc-500 dark:text-zinc-400"
                    )}>
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <ErrorBoundary name="Doctor Grid" className="min-h-[400px]">
            <div className={cn(
              "grid gap-4 lg:gap-5 transition-all duration-300",
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
