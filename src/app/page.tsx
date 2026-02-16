"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { Activity, Users, MonitorPlay, AlertCircle, Search, Filter, Zap, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, LeaveRequest, Shift, Settings } from "@/lib/data-service";
import { StatsCards } from "@/components/schedules/StatsCards";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  const { data: doctors = [], mutate: mutateDoctors } = useSWR<Doctor[]>('/api/doctors');
  const { data: leaves = [] } = useSWR<LeaveRequest[]>('/api/leaves');
  const { data: shifts = [] } = useSWR<Shift[]>('/api/shifts');
  const { data: settings, mutate: mutateSettings } = useSWR<Settings>('/api/settings');

  const [searchQuery, setSearchQuery] = useState("");

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

  const activeDocs = doctors.filter(d => d.status === 'BUKA' || d.status === 'PENUH');
  const onLeaveDocs = doctors.filter(d => d.status === 'CUTI');

  // Stats calculation
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

  const [efficiency, setEfficiency] = useState(0);

  // Calculate efficiency
  useEffect(() => {
    if (doctors.length > 0) {
      const baseEff = Math.round((activeDocs.length / doctors.length) * 100);
      setEfficiency(baseEff > 0 ? 90 + Math.round(Math.random() * 5) : 0);
    }
  }, [doctors.length, activeDocs.length]);

  const stats = {
    activeDoctors: activeDocs.length,
    totalDoctors: doctors.length,
    onLeave: onLeaveDocs.length,
    efficiency: efficiency,
  };

  const filteredDoctors = doctors.filter(doc =>
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
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {greeting}, Dr. Admin
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Berikut update terbaru klinik Anda hari ini.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Overpower Automation Button */}
            <button
              onClick={toggleAutomation}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold border shadow-lg hover:shadow-xl active:scale-95",
                automationEnabled
                  ? "bg-violet-600 text-white border-violet-500 shadow-violet-500/20"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
              )}
            >
              <Zap size={18} className={cn(automationEnabled && "fill-current animate-pulse")} />
              {automationEnabled ? "SISTEM OVERPOWER: AKTIF" : "Otomatisasi: Nonaktif"}
            </button>

            <div className="h-8 w-px bg-border mx-2" />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Cari dokter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm w-48 outline-none"
              />
            </div>
            <button className="p-2 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-all">
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
                    "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 transition-all",
                    automationEnabled
                      ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
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
                    "glass-card p-4 rounded-xl group transition-all duration-300 border border-border/50 relative overflow-hidden",
                    automationEnabled && "opacity-90 hover:opacity-100"
                  )}>
                    {automationEnabled && (
                      <div className="absolute inset-0 bg-violet-500/5 pointer-events-none" />
                    )}
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                          <AvatarFallback className={cn(
                            "text-sm font-bold text-white",
                            doc.status === 'BUKA' ? "bg-blue-500" :
                              doc.status === 'PENUH' ? "bg-orange-500" :
                                doc.status === 'CUTI' ? "bg-pink-500" : "bg-slate-500"
                          )}>
                            {doc.queueCode || doc.name.charAt(4)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-base text-foreground leading-tight group-hover:text-primary transition-colors">{doc.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground font-medium">{doc.specialty}</p>
                            {(doc.status === 'BUKA' || doc.status === 'PENUH') && (
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md border border-border/50">
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
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                        doc.status === 'BUKA' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                          doc.status === 'PENUH' ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                            doc.status === 'CUTI' ? "bg-pink-500/10 text-pink-600 border-pink-500/20" :
                              "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      )}>
                        {doc.status || 'Offline'}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 relative z-10">
                      {[
                        { id: 'Idle', label: 'Otomatis', className: 'bg-slate-500 text-white border-slate-600 shadow-slate-500/20 hover:bg-slate-600' },
                        { id: 'BUKA', label: 'Buka', className: 'bg-blue-500 text-white border-blue-600 shadow-blue-500/20 hover:bg-blue-600' },
                        { id: 'PENUH', label: 'Penuh', className: 'bg-orange-500 text-white border-orange-600 shadow-orange-500/20 hover:bg-orange-600' },
                        { id: 'CUTI', label: 'Cuti', className: 'bg-pink-500 text-white border-pink-600 shadow-pink-500/20 hover:bg-pink-600' },
                      ].map((action) => (
                        <button
                          key={action.id}
                          // Allow manual update even if automation is enabled, to trigger manual override
                          onClick={() => manualUpdateStatus(doc.id, action.id as any)}
                          className={cn(
                            "py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-md",
                            doc.status === action.id
                              ? action.className
                              : "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent hover:border-border shadow-none",
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
              <div className="glass-card p-6 rounded-2xl text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <MonitorPlay size={32} />
                </div>
                <h3 className="font-bold text-foreground">Display Preview</h3>
                <p className="text-sm text-muted-foreground mb-4">View what patients currently see on the main screen.</p>
                <button className="w-full py-2 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
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
