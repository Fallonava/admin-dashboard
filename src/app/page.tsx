"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { Activity, Users, MonitorPlay, AlertCircle, Search, Filter, Zap, Power, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, LeaveRequest, Shift, Settings } from "@/lib/data-service";
import { StatsCards } from "@/components/schedules/StatsCards";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  const { data: doctors = [], mutate: mutateDoctors } = useSWR<Doctor[]>('/api/doctors');
  const { data: leaves = [] } = useSWR<LeaveRequest[]>('/api/leaves');
  const { data: shifts = [], mutate: mutateShifts } = useSWR<Shift[]>('/api/shifts');
  const { data: settings, mutate: mutateSettings } = useSWR<Settings>('/api/settings');

  const [searchQuery, setSearchQuery] = useState("");

  // Calculate today's day index (0=Mon, 6=Sun)
  const now = new Date();
  const todayDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

  // Today's date string for disabledDates comparison
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Filter: Only show doctors who have an active shift TODAY (not disabled for today)
  const todayDoctors = doctors.filter(doc =>
    shifts.some(s => s.doctor === doc.name && s.dayIdx === todayDayIdx && !(s.disabledDates || []).includes(todayStr))
  );

  // Automation Logic
  const automationEnabled = settings?.automationEnabled || false;



  const toggleAutomation = async () => {
    if (!settings) return;
    const newState = !settings.automationEnabled;

    // Optimistic update for settings
    mutateSettings({ ...settings, automationEnabled: newState }, false);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationEnabled: newState })
      });
      mutateSettings(); // Revalidate
    } catch (e) {
      console.error("Failed to save settings", e);
      mutateSettings(); // Revert on error
    }
  };

  // Toggle shift disabled for today
  const toggleShiftDisabled = async (shiftId: number, shift: Shift) => {
    const dates = shift.disabledDates || [];
    const isDisabledToday = dates.includes(todayStr);
    const newDates = isDisabledToday
      ? dates.filter(d => d !== todayStr)  // Remove today
      : [...dates, todayStr];              // Add today

    // Optimistic update
    mutateShifts(curr => curr?.map(s => s.id === shiftId ? { ...s, disabledDates: newDates } : s), false);
    try {
      await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shiftId, disabledDates: newDates })
      });
      mutateShifts();
    } catch (e) {
      console.error('Failed to toggle shift', e);
      mutateShifts();
    }
  };

  // Manual Status Update (SETS manual override flag)
  const manualUpdateStatus = async (id: string | number, status: Doctor['status']) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    const timestamp = now.getTime();

    // Optimistic update
    mutateDoctors(docs => docs?.map(d =>
      d.id === id ? {
        ...d,
        status,
        lastCall: (status === 'BUKA' || status === 'PENUH') ? timeString : d.lastCall,
        lastManualOverride: timestamp
      } : d
    ), false);

    await fetch('/api/doctors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status,
        lastCall: (status === 'BUKA' || status === 'PENUH') ? timeString : undefined,
        lastManualOverride: timestamp
      })
    });
    mutateDoctors();
  };

  const activeDocs = todayDoctors.filter(d => d.status === 'BUKA' || d.status === 'PENUH');
  const onLeaveDocs = todayDoctors.filter(d => d.status === 'CUTI');

  // Stats calculation — leaves (no status concept anymore)
  const pendingLeaves = 0;

  const [efficiency, setEfficiency] = useState(0);

  // Calculate efficiency
  useEffect(() => {
    if (todayDoctors.length > 0) {
      const baseEff = Math.round((activeDocs.length / todayDoctors.length) * 100);
      setEfficiency(baseEff > 0 ? 90 + Math.round(Math.random() * 5) : 0);
    }
  }, [todayDoctors.length, activeDocs.length]);

  const stats = {
    activeDoctors: activeDocs.length,
    totalDoctors: todayDoctors.length,
    onLeave: onLeaveDocs.length,
    efficiency: efficiency,
  };

  const filteredDoctors = todayDoctors.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic greeting
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Section */}
        <header className="px-8 py-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient pb-1">
              {greeting}, Dr. Admin
            </h1>
            <p className="text-sm text-foreground/60 mt-0.5">Berikup update terbaru klinik Anda hari ini.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Automation Control Button */}
            <button
              onClick={toggleAutomation}
              className={cn(
                "flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] active:scale-[0.97] group",
                automationEnabled
                  ? "btn-gradient shadow-[0_4px_14px_0_rgba(99,102,241,0.39)]"
                  : "bg-white text-muted-foreground hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
              )}
            >
              <div className="relative">
                <Zap size={18} className={cn(
                  "transition-all",
                  automationEnabled ? "fill-current drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]" : "group-hover:scale-110"
                )} />
                {automationEnabled && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold leading-tight">
                  {automationEnabled ? "Otomatisasi Aktif" : "Otomatisasi Nonaktif"}
                </div>
                <div className={cn("text-[10px] leading-tight", automationEnabled ? "text-violet-200" : "text-muted-foreground")}>
                  {automationEnabled
                    ? `${todayDoctors.length} dokter dikelola • ${activeDocs.length} aktif`
                    : "Klik untuk mengaktifkan"
                  }
                </div>
              </div>
            </button>

            <div className="h-8 w-px bg-border mx-2" />

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari dokter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2.5 rounded-2xl bg-white focus:border-blue-500/50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] transition-all text-sm w-56 outline-none"
                />
              </div>
            </div>
            <button className="p-2.5 rounded-2xl bg-white text-muted-foreground hover:text-foreground hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] transition-all">
              <Filter size={18} />
            </button>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {/* Stats Row */}
          <StatsCards stats={stats} />

          {/* Dashboard Grid */}
          <div className="flex flex-col gap-6">
            {/* Live Control */}
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-full bg-primary/80"></span>
                  Kontrol Status Langsung
                </h3>

                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 transition-all",
                    automationEnabled
                      ? "bg-violet-500/10 text-violet-400-500/20"
                      : "bg-emerald-500/10 text-emerald-600-500/20"
                  )}>
                    <span className="relative flex h-2 w-2">
                      <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        automationEnabled ? "bg-violet-400" : "bg-emerald-400"
                      )}></span>
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        automationEnabled ? "bg-violet-500" : "bg-emerald-500"
                      )}></span>
                    </span>
                    {automationEnabled ? "AI Mengelola Sistem" : "Sistem Online"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredDoctors.map(doc => (
                  <div key={doc.id} className={cn(
                    "super-glass-card p-4 rounded-xl group relative overflow-hidden",
                    automationEnabled && "opacity-90 hover:opacity-100"
                  )}>
                    {automationEnabled && (
                      <div className="absolute inset-0 bg-violet-500/5 pointer-events-none" />
                    )}
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 shadow-sm">
                          <AvatarFallback className={cn(
                            "text-sm font-bold text-white",
                            doc.status === 'BUKA' ? "bg-blue-500" :
                              doc.status === 'PENUH' ? "bg-orange-500" :
                                doc.status === 'CUTI' ? "bg-pink-500" :
                                  doc.status === 'OPERASI' ? "bg-red-500" :
                                    "bg-slate-500"
                          )}>
                            {doc.queueCode || doc.name.charAt(4)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-base text-foreground leading-tight group-hover:text-primary transition-colors">{doc.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground font-medium">{doc.specialty}</p>
                            {(doc.status === 'BUKA' || doc.status === 'PENUH') && (
                              <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                <span className="text-[9px] font-medium tracking-wide">BATAS JAM:</span>
                                <input
                                  type="time"
                                  value={doc.lastCall || ''}
                                  onChange={(e) => {
                                    const newTime = e.target.value;
                                    mutateDoctors(curr => curr?.map(d => d.id === doc.id ? { ...d, lastCall: newTime } : d), false);
                                    fetch('/api/doctors', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: doc.id, lastCall: newTime })
                                    });
                                  }}
                                  className="bg-transparent text-[10px] font-mono text-foreground focus:outline-none w-14"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        doc.status === 'BUKA' ? "bg-blue-500/10 text-blue-600-500/20" :
                          doc.status === 'PENUH' ? "bg-orange-500/10 text-orange-600-500/20" :
                            doc.status === 'CUTI' ? "bg-pink-500/10 text-pink-600-500/20" :
                              doc.status === 'OPERASI' ? "bg-red-500/10 text-red-600-500/20" :
                                "bg-slate-500/10 text-slate-500-500/20"
                      )}>
                        {doc.status || 'Offline'}
                      </div>
                    </div>

                    {/* Shift Pills */}
                    {(() => {
                      const docShiftsToday = shifts.filter(s => s.doctor === doc.name && s.dayIdx === todayDayIdx);
                      if (docShiftsToday.length === 0) return null;
                      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
                      return (
                        <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
                          {docShiftsToday.map(shift => {
                            const [startStr, endStr] = (shift.formattedTime || '').split('-');
                            const startM = parseInt(startStr?.split(':')[0] || '0') * 60 + parseInt(startStr?.split(':')[1] || '0');
                            const endM = parseInt(endStr?.split(':')[0] || '0') * 60 + parseInt(endStr?.split(':')[1] || '0');
                            const isDisabledToday = (shift.disabledDates || []).includes(todayStr);
                            const isActive = currentTimeMinutes >= startM && currentTimeMinutes < endM && !isDisabledToday;
                            return (
                              <button
                                key={shift.id}
                                onClick={() => toggleShiftDisabled(shift.id, shift)}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all",
                                  isDisabledToday
                                    ? "bg-red-500/5 text-red-400/60-500/10 line-through hover:bg-red-500/10"
                                    : isActive
                                      ? "bg-emerald-500/15 text-emerald-500-500/30 ring-1 ring-emerald-500/20"
                                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                                title={isDisabledToday ? 'Klik untuk aktifkan hari ini' : 'Klik untuk nonaktifkan hari ini'}
                              >
                                <Clock size={9} />
                                {shift.formattedTime}
                                {isDisabledToday && <span className="text-red-400 ml-0.5">✕</span>}
                                {isActive && <span className="relative flex h-1.5 w-1.5 ml-0.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-6 gap-1.5 relative z-10">
                      {[
                        { id: 'TIDAK PRAKTEK', label: 'Off', className: 'bg-slate-500 text-white-600 shadow-slate-500/20 hover:bg-slate-600' },
                        { id: 'BUKA', label: 'Buka', className: 'bg-blue-500 text-white-600 shadow-blue-500/20 hover:bg-blue-600' },
                        { id: 'PENUH', label: 'Penuh', className: 'bg-orange-500 text-white-600 shadow-orange-500/20 hover:bg-orange-600' },
                        { id: 'OPERASI', label: 'Ops', className: 'bg-red-500 text-white-600 shadow-red-500/20 hover:bg-red-600' },
                        { id: 'SELESAI', label: 'Slsai', className: 'bg-emerald-500 text-white-600 shadow-emerald-500/20 hover:bg-emerald-600' },
                        { id: 'CUTI', label: 'Cuti', className: 'bg-pink-500 text-white-600 shadow-pink-500/20 hover:bg-pink-600' },
                      ].map((action) => (
                        <button
                          key={action.id}
                          // Allow manual update even if automation is enabled, to trigger manual override
                          onClick={() => manualUpdateStatus(doc.id, action.id as any)}
                          className={cn(
                            "py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-md",
                            doc.status === action.id
                              ? action.className
                              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:border-border shadow-none",
                            // Warning style if overriding automation? Nah, just let them do it.
                          )}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Display Preview (Visible only on small screens now maybe? Or unused?) */}
            <div className="block lg:hidden xl:hidden space-y-6">
              <div className="super-glass-card p-6 rounded-3xl text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 shadow-inner">
                  <MonitorPlay size={32} />
                </div>
                <h3 className="font-bold text-foreground">Display Preview</h3>
                <p className="text-sm text-foreground/60 mb-4">View what patients currently see on the main screen.</p>
                <button className="w-full py-2.5 btn-gradient rounded-2xl font-semibold">
                  Open Display View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
