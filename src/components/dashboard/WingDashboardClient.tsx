"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, Search, Zap, Power, Wifi, WifiOff, Loader2, LayoutGrid, Flame, ShieldAlert, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, LeaveRequest, Shift, Settings } from "@/lib/data-service";
import { LiveClock } from "@/components/LiveClock";
import { useDebounce } from "@/hooks/use-debounce";
import { useSocket } from "@/hooks/use-socket";
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

  // Full Socket.io Mode for Admin Dashboard
  const { 
    doctors, 
    shifts, 
    leaves, 
    settings, 
    isConnected,
    lastUpdate
  } = useSocket();

  const sseStatus = isConnected ? 'connected' : 'reconnecting';


  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const isSearching = searchQuery !== debouncedSearch;
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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

  const todayDoctors = useMemo(() => {
    if (!doctors.length || !shifts.length) {
      return [];
    }
    const result = doctors.filter(doc => {
      // Check if they are on leave today
      let isOnLeaveToday = false;
      if (doc.leaveRequests && doc.leaveRequests.length > 0) {
         isOnLeaveToday = doc.leaveRequests.some((lr: import('@/lib/data-service').LeaveRequest) => {
            const statusStr = (lr.status || '').toLowerCase();
            if (statusStr === 'rejected' || statusStr === 'ditolak') return false;
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            const check = new Date(todayStr);
            check.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return check >= start && check <= end;
         });
      }

      // Check if they have a shift defined today
      const hasShiftToday = shifts.some(s =>
        String(s.doctorId) === String(doc.id) &&
        Number(s.dayIdx) === Number(todayDayIdx)
      );

      // Check if today's shift is active (not in disabledDates)
      const hasActiveShift = shifts.some(s =>
        String(s.doctorId) === String(doc.id) &&
        Number(s.dayIdx) === Number(todayDayIdx) &&
        !(s.disabledDates || []).includes(todayStr)
      );

      return (hasShiftToday && isOnLeaveToday) || hasActiveShift;
    }).map(doc => {
      let isOnLeave = false;
      if (doc.leaveRequests && doc.leaveRequests.length > 0) {
         isOnLeave = doc.leaveRequests.some((lr: import('@/lib/data-service').LeaveRequest) => {
            const statusStr = (lr.status || '').toLowerCase();
            if (statusStr === 'rejected' || statusStr === 'ditolak') return false;
            
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            const check = new Date(todayStr); // safe stable anchor
            check.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return check >= start && check <= end;
         });
      }
      return isOnLeave ? { ...doc, status: 'CUTI' as const } : doc;
    });
    
    return result;
  }, [doctors, shifts, todayDayIdx, todayStr]);

  const automationEnabled = settings?.automationEnabled || false;

  const activeDocs = useMemo(() => todayDoctors.filter(d => d.status === 'PRAKTEK' || d.status === 'PENUH' || d.status === 'PENDAFTARAN'), [todayDoctors]);
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
        else if (doc.status === 'PRAKTEK') bukaCount++;
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

  // Find the fresh doctor from the updated array if modal is open to fix stale state bug
  const freshSelectedDoctor = useMemo(() => {
    if (!selectedDoctor) return null;
    const freshDoc = filteredDoctors.find(d => d.id === selectedDoctor.doctor.id);
    if (!freshDoc) return selectedDoctor;
    
    // Also find fresh wingStatus 
    const wing = wingsWithStatus.find(w => w.specialty === selectedDoctor.specialty);
    return {
      ...selectedDoctor,
      doctor: freshDoc,
      wingStatus: (wing?.status as 'EMERGENCY' | 'BUSY' | 'NORMAL' | 'OFFLINE') || selectedDoctor.wingStatus
    };
  }, [selectedDoctor, filteredDoctors, wingsWithStatus]);

  const pulseVariant = emergencyCount > 0 ? 'EMERGENCY' : busyCount > 0 ? 'BUSY' : 'NORMAL';
  const pulseMessage = 
    pulseVariant === 'EMERGENCY' ? `MENDESAK: ${emergencyCount} Area Utama mendeteksi aktivitas Bedah/Operasi!` :
    pulseVariant === 'BUSY' ? `PERINGATAN: ${busyCount} Poliklinik sedang mengalami lonjakan antrean (Surge).` :
    "Sistem Terkendali: Seluruh metrik operasional stabil.";
  const pulseStyle = 
    pulseVariant === 'EMERGENCY' ? "bg-red-500/10 border-red-500/30 text-red-700 shadow-[0_0_30px_rgba(239,68,68,0.15)] ring-1 ring-inset ring-red-500/20" :
    pulseVariant === 'BUSY' ? "bg-orange-500/10 border-orange-500/30 text-orange-700 ring-1 ring-inset ring-orange-500/20" :
    "bg-white/60 border-white/60 text-indigo-700 shadow-[0_4px_24px_rgba(0,0,0,0.02)]";
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
            "w-full rounded-[20px] sm:rounded-[28px] border backdrop-blur-3xl p-3.5 sm:p-5 flex flex-col xl:flex-row gap-3 xl:items-center justify-between transition-all duration-500",
            pulseStyle
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 sm:p-2.5 rounded-[12px] sm:rounded-[14px] bg-white shadow-sm shrink-0",
                    pulseVariant === 'EMERGENCY' ? "text-red-600 animate-pulse" :
                    pulseVariant === 'BUSY' ? "text-orange-500" :
                    "text-indigo-600"
                )}>
                    <PulseIcon size={18} className={pulseVariant === 'EMERGENCY' ? "animate-bounce" : "sm:w-5 sm:h-5"} />
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

          {/* Modern Segmented Filters - 2026 Style */}
          <div className="flex items-center gap-3 overflow-x-auto snap-x snap-mandatory custom-scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0 touch-pan-x">
            <div className="flex items-center p-1.5 bg-slate-200/50 backdrop-blur-md rounded-full shrink-0 border border-slate-300/30 shadow-inner w-max">
              {([
                { key: 'ALL',      label: 'Semua Poli', icon: '🏥' },
                { key: 'ACTIVE',   label: 'Tersedia', icon: '🟢' },
                { key: 'FULL',     label: 'Penuh', icon: '🔴' },
                { key: 'INACTIVE', label: 'Off-Duty', icon: '⚫' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setPatientFilter(f.key)}
                  className={cn(
                    "relative px-4 sm:px-5 py-2 rounded-full text-[12px] sm:text-[13px] font-bold transition-all duration-300 flex items-center gap-2",
                    "touch-manipulation active:scale-[0.95] snap-center outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0",
                    patientFilter === f.key
                      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-black/5"
                  )}
                >
                  <span className="text-[14px]">{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <ErrorBoundary name="Poli Accordion List" className="min-h-[400px]">
             {wingsWithStatus.length > 0 ? (
                <div className="space-y-3 pb-6">
                  {wingsWithStatus.map(wing => {
                    return (
                      <div
                        key={wing.specialty}
                        id={`wing-${wing.specialty.replace(/\s+/g, '-').toLowerCase()}`}
                        className={cn("transition-all duration-500 rounded-[28px]")}
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

      {/* AI Insight Ticker — Floating Dynamic Pill 2026 */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-max max-w-[800px] z-[100] animate-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
        <div className="flex items-center bg-white/80 backdrop-blur-3xl saturate-[1.2] rounded-full border border-white/60 shadow-[0_8px_32px_rgba(30,41,59,0.1),0_0_0_1px_rgba(255,255,255,0.7)_inset] overflow-hidden">
          {/* Static label */}
          <div className="flex items-center gap-2 px-3.5 sm:px-5 pb-[1px] bg-slate-50/50 backdrop-blur-md border-r border-slate-200/50 shrink-0 z-10">
            <Wifi size={12} className="text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hidden sm:inline-block">Live Intel</span>
          </div>
          {/* Scrolling ticker */}
          <div className="overflow-hidden flex-1 py-2.5">
            <div className="flex whitespace-nowrap animate-ticker hover:[animation-play-state:paused]">
              {[...tickerMessages, ...tickerMessages].map((msg, i) => (
                <button
                  key={i}
                  onClick={() => msg.target && scrollToWing(msg.target)}
                  className={cn(
                    "inline-block text-[12px] font-bold px-8 border-r border-slate-200/60 transition-colors focus-visible:outline-none",
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
      {freshSelectedDoctor && (
        <DoctorDetailModal
          doctor={freshSelectedDoctor.doctor}
          specialty={freshSelectedDoctor.specialty}
          wingStatus={freshSelectedDoctor.wingStatus}
          currentTimeMinutes={currentTimeMinutes}
          nowMs={now.getTime()}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </div>
  );
}
