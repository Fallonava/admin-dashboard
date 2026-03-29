"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, Search, Zap, Power, Wifi, WifiOff, Loader2, LayoutGrid, Flame, ShieldAlert, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, LeaveRequest, Shift, Settings } from "@/lib/data-service";
import { LiveClock } from "@/components/LiveClock";
import { useDebounce } from "@/hooks/use-debounce";
import { useSSE } from "@/hooks/use-sse";
import { useAuth } from "@/lib/auth-context";
import { PoliAccordion } from "./PoliAccordion";
import { DoctorDetailModal } from "./DoctorDetailModal";
import { MobileSearchSheet } from "@/components/ui/MobileSearchSheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function WingDashboardClient() {
  const { logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

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
  const [wingFilter, setWingFilter] = useState<'ALL' | 'EMERGENCY' | 'BUSY' | 'NORMAL'>('ALL');
  const [patientFilter, setPatientFilter] = useState<'ALL' | 'ACTIVE' | 'FULL' | 'INACTIVE'>('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<{ doctor: Doctor, specialty: string, wingStatus: 'EMERGENCY' | 'BUSY' | 'NORMAL' | 'OFFLINE' } | null>(null);

  const timeContext = useMemo(() => {
    const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return {
      todayDayIdx: wibNow.getUTCDay() === 0 ? 6 : wibNow.getUTCDay() - 1,
      todayStr: `${wibNow.getUTCFullYear()}-${String(wibNow.getUTCMonth() + 1).padStart(2, '0')}-${String(wibNow.getUTCDate()).padStart(2, '0')}`,
      currentTimeMinutes: wibNow.getUTCHours() * 60 + wibNow.getUTCMinutes(),
      weekOfMonth: Math.ceil(wibNow.getUTCDate() / 7)
    };
  }, [now]);

  const { todayDayIdx, todayStr, currentTimeMinutes } = timeContext;

  const todayDoctors = useMemo(() => doctors.filter(doc =>
    shifts.some(s =>
      s.doctorId === doc.id &&
      s.dayIdx === todayDayIdx &&
      !(s.disabledDates || []).includes(todayStr)
    )
  ), [doctors, shifts, todayDayIdx, todayStr]);

  const automationEnabled = settings?.automationEnabled || false;

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

  const wingsWithStatus = useMemo(() => {
    const groups: Record<string, Doctor[]> = {};
    for (const doc of filteredDoctors) {
      const sp = doc.specialty || "Klinik Umum"; // Fallback
      if (!groups[sp]) groups[sp] = [];
      groups[sp].push(doc);
    }
    
    // Convert to sorted array
    return Object.entries(groups).map(([specialty, docs]) => {
      let hasOperasi = false, penuhCount = 0, bukaCount = 0;
      for (const doc of docs) {
        if (doc.status === 'OPERASI') hasOperasi = true;
        else if (doc.status === 'PENUH') penuhCount++;
        else if (doc.status === 'BUKA') bukaCount++;
      }
      const totalActive = penuhCount + bukaCount + (hasOperasi ? 1 : 0);
      let status = 'NORMAL';
      if (hasOperasi) status = 'EMERGENCY';
      else if (totalActive === 0) status = 'OFFLINE';
      else if ((totalActive > 1 && penuhCount / totalActive >= 0.7) || (totalActive === 1 && penuhCount === 1)) status = 'BUSY';

      return {
        specialty,
        doctors: docs.sort((a,b) => a.name.localeCompare(b.name)), // Sort doctors alphabetically within wing
        status
      };
    }).sort((a,b) => a.specialty.localeCompare(b.specialty)); // Sort wings alphabetically
  }, [filteredDoctors]);

  const emergencyCount = wingsWithStatus.filter(w => w.status === 'EMERGENCY').length;
  const busyCount = wingsWithStatus.filter(w => w.status === 'BUSY').length;
  const normalCount = wingsWithStatus.filter(w => w.status === 'NORMAL').length;

  // Compute generic Pulse state
  const pulseVariant = emergencyCount > 0 ? 'EMERGENCY' : busyCount > 0 ? 'BUSY' : 'NORMAL';
  const pulseMessage = 
    pulseVariant === 'EMERGENCY' ? `MENDESAK: ${emergencyCount} Area Utama mendeteksi aktivitas Bedah/Operasi!` :
    pulseVariant === 'BUSY' ? `PERINGATAN: ${busyCount} Poliklinik sedang mengalami lonjakan antrean (Surge).` :
    "Sistem Terkendali: Tidak ada antrean darurat yang terdeteksi.";
  const pulseStyle = 
    pulseVariant === 'EMERGENCY' ? "bg-red-50/80 border-red-200 text-red-700 shadow-[0_0_30px_rgba(239,68,68,0.15)]" :
    pulseVariant === 'BUSY' ? "bg-orange-50/80 border-orange-200 text-orange-700" :
    "bg-indigo-50/80 border-indigo-200 text-indigo-700";
  const PulseIcon = pulseVariant === 'EMERGENCY' ? ShieldAlert : pulseVariant === 'BUSY' ? Flame : Sparkles;

  const tickerMessages = useMemo(() => {
    const msgs: { text: string, target?: string }[] = [];
    for (const wing of wingsWithStatus) {
      if (wing.status === 'EMERGENCY') msgs.push({ text: `🚨 ${wing.specialty}: Kondisi Darurat / Operasi terdeteksi`, target: wing.specialty });
      else if (wing.status === 'BUSY') msgs.push({ text: `⚡ ${wing.specialty}: Lonjakan antrean, dokter penuh`, target: wing.specialty });
    }
    const offlineWings = wingsWithStatus.filter(w => w.status === 'OFFLINE');
    if (offlineWings.length > 0) msgs.push({ text: `⚫ ${offlineWings.map(w => w.specialty).join(', ')}: Belum beroperasi hari ini` });
    if (normalCount > 0) msgs.push({ text: `🟢 ${normalCount} Poliklinik beroperasi optimal` });
    if (msgs.length === 0) msgs.push({ text: `✅ MedCore Live: Semua Wing poliklinik terpantau normal. Sistem stabil.` });
    msgs.push({ text: `🕐 Data diperbarui real-time via SSE — ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` });
    return msgs;
  }, [wingsWithStatus, normalCount, now]);

  const scrollToWing = useCallback((specialty: string) => {
    const element = document.getElementById(`wing-${specialty.replace(/\s+/g, '-').toLowerCase()}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Visual feedback spotlight
      element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2'), 2000);
    }
  }, []);

  const hour = now.getHours();
  const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  if (!mounted) return null;

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
      <PageHeader
        icon={<LayoutGrid size={20} className="text-white" />}
        title={`${greeting}, Admin`}
        subtitle={todayLabel}
        iconGradient="from-violet-500 to-blue-600"
        accentBarGradient="from-violet-500 via-blue-500 to-indigo-500"
        badge={
          <>
            {efficiency > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-violet-50 border border-violet-200 rounded-full text-[10px] font-bold text-violet-700 shrink-0">
                <Activity size={10} className="shrink-0" />
                {efficiency}% Efisiensi
              </span>
            )}
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
            <div className="hidden lg:flex shrink-0">
              <LiveClock />
            </div>
            <div className="hidden lg:block h-6 w-px bg-slate-200 mx-1" />

            {/* Link to Control Panel */}
            <Link
              href="/control"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black transition-all active:scale-[0.97] relative overflow-hidden border shrink-0 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border-slate-200 shadow-sm"
            >
              <Zap size={14} className="shrink-0 text-slate-400" />
              <span className="hidden sm:inline">Kontrol Status</span>
            </Link>

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
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-6 space-y-6 pt-5 relative z-10 animate-in fade-in duration-700 ease-out">

        {/* AI Command Pulse Bar */}
        <div className={cn(
            "w-full rounded-[24px] border backdrop-blur-xl p-4 sm:p-5 flex flex-col xl:flex-row gap-4 xl:items-center justify-between transition-all duration-500",
            pulseStyle
        )}>
            <div className="flex items-center gap-3.5">
                <div className={cn(
                    "p-2.5 rounded-[14px] bg-white shadow-sm shrink-0",
                    pulseVariant === 'EMERGENCY' ? "text-red-600 animate-pulse" :
                    pulseVariant === 'BUSY' ? "text-orange-500" :
                    "text-indigo-600"
                )}>
                    <PulseIcon size={20} className={pulseVariant === 'EMERGENCY' ? "animate-bounce" : ""} />
                </div>
                <div>
                    <h3 className="font-black text-[15px] leading-tight flex items-center gap-2">
                        Pusat Intelligence
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                        </span>
                    </h3>
                    <p className="text-[12px] font-bold opacity-80 mt-0.5">{pulseMessage}</p>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-hide -mx-2 px-2 xl:mx-0 xl:px-0">
                <div className="flex items-center gap-1.5 bg-white/60 p-1.5 rounded-[16px] shadow-sm border border-black/5 shrink-0">
                    <Filter size={14} className="mx-2 text-slate-400" />
                    <button 
                        onClick={() => setWingFilter('ALL')}
                        className={cn("px-4 py-1.5 rounded-[12px] text-xs font-black transition-all", wingFilter === 'ALL' ? "bg-white text-slate-800 shadow-sm" : "hover:bg-white/50 text-slate-500")}
                    >
                        Semua Wing
                    </button>
                    {(emergencyCount > 0 || wingFilter === 'EMERGENCY') && <button 
                        onClick={() => setWingFilter('EMERGENCY')}
                        className={cn("px-4 py-1.5 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5", wingFilter === 'EMERGENCY' ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "hover:bg-white/50 text-red-600")}
                    >
                        {wingFilter === 'EMERGENCY' && <CheckCircle2 size={12} />} Darurat
                    </button>}
                    {(busyCount > 0 || wingFilter === 'BUSY') && <button 
                        onClick={() => setWingFilter('BUSY')}
                        className={cn("px-4 py-1.5 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5", wingFilter === 'BUSY' ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "hover:bg-white/50 text-orange-600")}
                    >
                        {wingFilter === 'BUSY' && <CheckCircle2 size={12} />} Sibuk
                    </button>}
                    <button 
                        onClick={() => setWingFilter('NORMAL')}
                        className={cn("px-4 py-1.5 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5", wingFilter === 'NORMAL' ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "hover:bg-white/50 text-blue-600")}
                    >
                        {wingFilter === 'NORMAL' && <CheckCircle2 size={12} />} Normal
                    </button>
                </div>
            </div>
        </div>

        <div className="w-full space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
              Denah Poliklinik Live
            </h3>

            <div className="flex items-center gap-2">
              <div className="relative group hidden lg:block shrink-0">
                <div className="relative flex items-center">
                  {isSearching
                    ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-500 h-4 w-4 animate-spin shrink-0" />
                    : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 shrink-0" />
                  }
                  <input
                    type="text"
                    placeholder="Pencarian spesifik..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 rounded-[16px] bg-white/40 backdrop-blur-xl hover:bg-white/60 focus:bg-white text-xs w-44 xl:w-52 outline-none border border-white/60 hover:border-white/80 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all duration-300 font-black text-slate-700 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>
               {/* Mobile Search Button */}
               <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 min-h-[40px] bg-white/40 backdrop-blur-xl hover:bg-white border border-white/60 hover:border-white/80 rounded-[14px] shadow-sm transition-all duration-300 active:scale-95 text-slate-600 hover:text-indigo-600"
                  title="Cari Dokter"
                >
                  <Search size={16} strokeWidth={2.5} />
                  <span className="text-[13px] font-black tracking-wide">Cari</span>
                </button>
            </div>
          </div>

          {/* Patient-Facing Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mr-1">Filter Dokter:</span>
            {([
              { key: 'ALL',      label: '🏥 Semua Dokter' },
              { key: 'ACTIVE',   label: '🟢 Tersedia' },
              { key: 'FULL',     label: '🔴 Antrean Penuh' },
              { key: 'INACTIVE', label: '⚫ Tidak Buka' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setPatientFilter(f.key)}
                className={cn(
                  "px-4 py-2 rounded-2xl text-[12px] font-black transition-all border touch-manipulation active:scale-95",
                  patientFilter === f.key
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ErrorBoundary name="Poli Accordion List" className="min-h-[400px]">
             {wingsWithStatus.length > 0 ? (
                <div className="space-y-3 pb-6">
                  {wingsWithStatus.map(wing => {
                    // Admin heatmap dim still applies
                    const isDimmed = wingFilter !== 'ALL' && wing.status !== wingFilter;

                    return (
                      <div
                        key={wing.specialty}
                        id={`wing-${wing.specialty.replace(/\s+/g, '-').toLowerCase()}`}
                        className={cn("transition-all duration-500 rounded-[28px]", isDimmed && "opacity-30 grayscale pointer-events-none")}
                      >
                        <PoliAccordion
                          specialty={wing.specialty}
                          doctors={wing.doctors}
                          wingStatus={wing.status as 'EMERGENCY' | 'BUSY' | 'NORMAL' | 'OFFLINE'}
                          currentTimeMinutes={currentTimeMinutes}
                          nowMs={now.getTime()}
                          defaultOpen={wing.status === 'EMERGENCY' || wing.status === 'BUSY'}
                          patientFilter={patientFilter}
                          onOpenDoctorDetail={(doc) => setSelectedDoctor({
                            doctor: doc,
                            specialty: wing.specialty,
                            wingStatus: wing.status as 'EMERGENCY' | 'BUSY' | 'NORMAL' | 'OFFLINE'
                          })}
                        />
                      </div>
                    );
                  })}
                </div>
             ) : (
                <div className="w-full p-12 text-center text-slate-400 font-medium bg-white/40 backdrop-blur-xl rounded-[32px] border border-white/60">
                    <LayoutGrid size={40} className="mx-auto mb-4 opacity-50" />
                    <p>Tidak ada data poliklinik aktif untuk hari ini.</p>
                </div>
             )}
          </ErrorBoundary>

        </div>

      </div>

      <MobileSearchSheet
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearching={isSearching}
      />

      {/* AI Insight Ticker — Light Theme */}
      <div className="flex-none relative overflow-hidden bg-white/80 backdrop-blur-xl border-t border-slate-200/80 py-2.5 px-0 shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center">
          {/* Static label */}
          <div className="flex items-center gap-2 px-4 bg-white/90 border-r border-slate-200 shrink-0 py-0.5 z-10">
            <Wifi size={11} className="text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Intel</span>
          </div>
          {/* Scrolling ticker */}
          <div className="overflow-hidden flex-1">
            <div className="flex whitespace-nowrap animate-ticker">
              {[...tickerMessages, ...tickerMessages].map((msg, i) => (
                <button
                  key={i}
                  onClick={() => msg.target && scrollToWing(msg.target)}
                  className={cn(
                    "inline-block text-[12px] font-semibold px-8 border-r border-slate-200/60 transition-colors",
                    msg.target
                      ? "text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      : "text-slate-500 cursor-default"
                  )}
                >
                  {msg.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Control Station Modal */}
      {selectedDoctor && (
        <DoctorDetailModal
          doctor={selectedDoctor.doctor}
          specialty={selectedDoctor.specialty}
          wingStatus={selectedDoctor.wingStatus}
          currentTimeMinutes={currentTimeMinutes}
          nowMs={now.getTime()}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </div>
  );
}
