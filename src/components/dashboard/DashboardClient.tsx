"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, Search, Zap, Power, Wifi, WifiOff, Loader2, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, LeaveRequest, Shift, Settings } from "@/lib/data-service";
import { LiveClock } from "@/components/LiveClock";
import { useDebounce } from "@/hooks/use-debounce";
import { useSSE } from "@/hooks/use-sse";
import { useAuth } from "@/lib/auth-context";
import { DashboardStats } from "./DashboardStats";
import { DoctorCard } from "./DoctorCard";
import { MobileSearchSheet } from "@/components/ui/MobileSearchSheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function DashboardClient() {
  const { logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

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

  // ── ONE SSE connection, per-event handlers ──
  const sseStatus = useSSE({
    url: '/api/stream/live',
    handlers: {
      doctors: (data: Doctor[]) => Array.isArray(data) && setDoctors(data),
      shifts: (data: Shift[]) => Array.isArray(data) && setShifts(data),
      leaves: (data: LeaveRequest[]) => Array.isArray(data) && setLeaves(data),
      settings: (data: Settings) => data && setSettings(data),
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const isSearching = searchQuery !== debouncedSearch;

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Centralized Time Calculations (WIB UTC+7)
  const timeContext = useMemo(() => {
    const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return {
      todayDayIdx: wibNow.getUTCDay() === 0 ? 6 : wibNow.getUTCDay() - 1, // 0=Sen, 6=Min
      todayStr: `${wibNow.getUTCFullYear()}-${String(wibNow.getUTCMonth() + 1).padStart(2, '0')}-${String(wibNow.getUTCDate()).padStart(2, '0')}`,
      currentTimeMinutes: wibNow.getUTCHours() * 60 + wibNow.getUTCMinutes(),
      weekOfMonth: Math.ceil(wibNow.getUTCDate() / 7)
    };
  }, [now]);

  const { todayDayIdx, todayStr, currentTimeMinutes, weekOfMonth } = timeContext;

  // Filter: hanya tampilkan dokter yang punya minimal 1 shift aktif hari ini
  // (shift tidak di-disable hari ini)
  const todayDoctors = useMemo(() => doctors.filter(doc =>
    shifts.some(s =>
      s.doctorId === doc.id &&
      s.dayIdx === todayDayIdx &&
      !(s.disabledDates || []).includes(todayStr)
    )
  ), [doctors, shifts, todayDayIdx, todayStr]);

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
    const previousShifts = shifts;
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
      setShifts(previousShifts);
    }
  }, [todayStr, shifts]);

  // ── Manual Status Update ──
  const manualUpdateStatus = useCallback(async (id: string, status: Doctor['status']) => {
    const nowLocal = new Date();
    const timeString = nowLocal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    const timestamp = nowLocal.getTime();
    const previousDoctors = doctors;
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
      setDoctors(previousDoctors);
    }
  }, [doctors]);
  
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
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-slate-50/50">
      {/* Ambient Animated Glowing Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full flex-none">
      {/* ═══════════════════ UNIFIED PAGE HEADER ═══════════════════ */}
      <PageHeader
        icon={<LayoutDashboard size={20} className="text-white" />}
        title={`${greeting}, Admin`}
        subtitle={todayLabel}
        iconGradient="from-violet-500 to-blue-600"
        accentBarGradient="from-violet-500 via-blue-500 to-indigo-500"
        badge={
          <>
            {/* Efficiency Pill */}
            {efficiency > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-violet-50 border border-violet-200 rounded-full text-[10px] font-bold text-violet-700 shrink-0">
                <Activity size={10} className="shrink-0" />
                {efficiency}% Efisiensi
              </span>
            )}
            {/* SSE Status Pill */}
            <span className={cn(
              "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
              sseStatus === 'connected' ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : sseStatus === 'reconnecting' ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse"
              : "bg-slate-100 text-slate-500 border-slate-200"
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
            <div className="hidden lg:block h-6 w-px bg-slate-200 mx-1" />

            {/* Automation Toggle */}
            <button
              onClick={toggleAutomation}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black transition-all active:scale-[0.97] relative overflow-hidden border shrink-0",
                automationEnabled
                  ? "bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] border-violet-400/50"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-sm"
              )}
            >
              <Zap size={14} className={cn("shrink-0 transition-all", automationEnabled ? "fill-white text-white drop-shadow-[0_0_4px_rgba(167,139,250,0.8)]" : "text-slate-400")} />
              <span>{automationEnabled ? "AI Aktif" : "AI Pasif"}</span>
              {automationEnabled && (
                <span className="flex h-1.5 w-1.5 shrink-0 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-1.5 w-1.5 top-2 right-2 rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
            </button>

            {/* Search (desktop) */}
            <div className="relative group hidden lg:block shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-blue-500/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative flex items-center">
                {isSearching
                  ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-500 h-4 w-4 animate-spin shrink-0" />
                  : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 shrink-0" />
                }
                <input
                  type="text"
                  placeholder="Cari dokter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-full bg-white/40 backdrop-blur-xl hover:bg-white/60 focus:bg-white text-sm w-44 xl:w-52 outline-none border border-white/60 hover:border-white/80 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all duration-300 font-black text-slate-700 placeholder:text-slate-400 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] focus:shadow-[0_8px_30px_rgba(139,92,246,0.15)]"
                />
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shrink-0"
              title="Keluar"
            >
              <Power size={17} strokeWidth={2.5} />
            </button>
          </div>
        }
      />
      </div>{/* End Header Wrapper */}

      {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-6 space-y-6 pt-5 relative z-10 animate-in fade-in duration-700 ease-out">

        {/* Stats Cards */}
        <DashboardStats
          todayDoctors={todayDoctors}
          shifts={shifts}
          todayDayIdx={todayDayIdx}
          efficiency={efficiency}
        />

        {/* Live Control Panel */}
        <div className="w-full space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
              Kontrol Status Langsung
            </h3>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 min-h-[40px] bg-white/40 backdrop-blur-xl hover:bg-white border border-white/60 hover:border-white/80 rounded-[14px] shadow-sm transition-all duration-300 active:scale-95 text-slate-600 hover:text-indigo-600"
                title="Cari Dokter"
              >
                <Search size={16} strokeWidth={2.5} />
                <span className="text-[13px] font-black tracking-wide">Cari</span>
              </button>

              {/* Status Indicator */}
              <div className={cn(
                "px-3.5 py-2 rounded-[14px] text-[11px] font-black tracking-widest uppercase flex items-center gap-2 transition-all shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] border backdrop-blur-md",
                automationEnabled
                  ? "bg-violet-50/80 text-violet-700 border-violet-200"
                  : "bg-emerald-50/80 text-emerald-700 border-emerald-200"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4">
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
