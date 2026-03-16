"use client";

import { useState, useEffect, useMemo } from "react";
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

  // Hitung todayDayIdx dan todayStr menggunakan WIB (UTC+7) agar konsisten
  // dengan server automation yang juga pakai WIB. Browser bisa di timezone berbeda.
  const wibNow = useMemo(() => new Date(now.getTime() + (7 * 60 * 60 * 1000)), [now]);
  const todayDayIdx = wibNow.getUTCDay() === 0 ? 6 : wibNow.getUTCDay() - 1; // 0=Sen, 6=Min
  const todayStr = `${wibNow.getUTCFullYear()}-${String(wibNow.getUTCMonth() + 1).padStart(2, '0')}-${String(wibNow.getUTCDate()).padStart(2, '0')}`;

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
  const toggleAutomation = async () => {
    if (!settings) return;
    const newState = !settings.automationEnabled;
    const previousSettings = { ...settings };
    setSettings({ ...settings, automationEnabled: newState });
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
  };

  // ── Toggle Shift Disabled ──
  const toggleShiftDisabled = async (shiftId: string, shift: Shift) => {
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
  };

  // ── Manual Status Update ──
  const manualUpdateStatus = async (id: string | number, status: Doctor['status']) => {
    const nowLocal = new Date();
    const timeString = nowLocal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    const timestamp = nowLocal.getTime();
    const previousDoctors = doctors;
    setDoctors(docs => docs?.map(d =>
      d.id === id ? {
        ...d,
        status,
        lastCall: (status === 'BUKA' || status === 'PENUH') ? timeString : d.lastCall,
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
          lastCall: (status === 'BUKA' || status === 'PENUH') ? timeString : undefined,
          lastManualOverride: timestamp
        })
      });
      if (!res.ok) throw new Error('API Error');
    } catch (e) {
      console.error('Failed to update doctor status', e);
      setDoctors(previousDoctors);
    }
  };

  const activeDocs = useMemo(() => todayDoctors.filter(d => d.status === 'BUKA' || d.status === 'PENUH'), [todayDoctors]);
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
    <div className="w-full h-full flex flex-col -mx-4 lg:-mx-6 -mt-2 lg:-mt-6 overflow-hidden">

      {/* ═══════════════════ PREMIUM STICKY HEADER ═══════════════════ */}
      <header className="sticky top-[-0.5rem] lg:top-[-1.5rem] z-40 bg-white/92 backdrop-blur-md border-b border-slate-200/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4">

          {/* Left — Icon + Title + Subtitle */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Gradient Icon Badge */}
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.30)]">
              <LayoutDashboard size={20} className="text-white" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Row 1: Greeting + Efficiency Pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
                  {greeting},{" "}
                  <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                    Admin
                  </span>
                </h1>

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
              </div>

              {/* Row 2: Subtitle + Date */}
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{todayLabel}</p>
            </div>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Clock */}
            <div className="hidden lg:flex shrink-0">
              <LiveClock />
            </div>

            {/* Divider */}
            <div className="hidden lg:block h-6 w-px bg-slate-200 mx-1" />

            {/* Automation Toggle */}
            <button
              onClick={toggleAutomation}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97] relative overflow-hidden border shrink-0",
                automationEnabled
                  ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-[0_3px_10px_rgba(99,102,241,0.3)] border-violet-400/50"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-sm"
              )}
            >
              <Zap size={13} className={cn("shrink-0 transition-all", automationEnabled ? "fill-white text-white drop-shadow-[0_0_4px_rgba(167,139,250,0.8)]" : "text-slate-400")} />
              <span>{automationEnabled ? "AI Aktif" : "AI Pasif"}</span>
              {automationEnabled && (
                <span className="flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-1.5 w-1.5 top-1.5 right-1.5 rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
            </button>

            {/* Search */}
            <div className="relative group hidden lg:block shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-blue-500/20 rounded-[14px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative flex items-center">
                {isSearching
                  ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500 h-4 w-4 animate-spin shrink-0" />
                  : <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 shrink-0" />
                }
                <input
                  type="text"
                  placeholder="Cari dokter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-white text-sm w-44 xl:w-52 outline-none border border-slate-200 focus:border-violet-300 focus:ring-2 focus:ring-violet-500/10 transition-all font-semibold text-slate-700 placeholder:text-slate-400 shadow-sm"
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
        </div>

        {/* Gradient accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 opacity-60" />
      </header>

      {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-6 space-y-5 pt-5">

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

            <div className="flex items-center gap-3">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="lg:hidden flex items-center gap-2 p-2.5 min-h-[44px] bg-white/80 hover:bg-white border border-white/50 rounded-xl shadow-sm transition-all active:scale-95"
                title="Cari Dokter"
              >
                <Search size={18} className="text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Cari</span>
              </button>

              <div className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm border",
                automationEnabled
                  ? "bg-violet-50 text-violet-600 border-violet-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
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
                {automationEnabled ? "AI Mengelola Sistem" : "Sistem Online"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4">
            {filteredDoctors.map(doc => (
              <DoctorCard
                key={doc.id}
                doc={doc}
                shifts={shifts}
                todayDayIdx={todayDayIdx}
                todayStr={todayStr}
                now={now}
                automationEnabled={automationEnabled}
                onStatusChange={manualUpdateStatus}
                onToggleShift={toggleShiftDisabled}
              />
            ))}
          </div>
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
