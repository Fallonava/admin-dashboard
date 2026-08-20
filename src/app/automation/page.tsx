"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Sparkles,
  Radio,
  Tv,
  Bell,
  Zap,
  Clock,
  RefreshCw,
  PowerOff,
  CheckCircle2,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { BroadcastControl } from "@/features/automation/components/BroadcastControl";
import { DynamicIslandSettings } from "@/features/automation/components/DynamicIslandSettings";
import { AutomationRulesTab } from "@/features/automation/components/AutomationRulesTab";
import { AutomationLogsTab } from "@/features/automation/components/AutomationLogsTab";
import { useSocket } from "@/hooks/use-socket";
import type { BroadcastRule, Settings } from "@/lib/data-service";

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<"broadcast" | "dynamic_island" | "rules" | "logs">("broadcast");
  const { data: broadcasts = [] } = useSWR<BroadcastRule[]>('/api/automation');
  const { data: settings } = useSWR<Settings>('/api/settings');
  const { data: rulesData = [] } = useSWR<any[]>('/api/automation-rules');
  const { lastUpdate } = useSocket();
  const [isRefreshingTV, setIsRefreshingTV] = useState(false);

  const activeBroadcastCount = broadcasts.filter((b) => b.active).length;
  const islandMessageCount = settings?.customMessages?.length || 0;
  const activeRulesCount = Array.isArray(rulesData) ? rulesData.filter((r) => r.active).length : 0;

  const handleRefreshAllTV = async () => {
    setIsRefreshingTV(true);
    try {
      await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_TV_NOW' }),
      }).catch(() => {});
      mutate('/api/automation');
      mutate('/api/settings');
    } finally {
      setTimeout(() => setIsRefreshingTV(false), 1000);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-hidden relative bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100">
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Page Header */}
        <PageHeader
          icon={<Sparkles size={22} className="text-white" strokeWidth={2.5} />}
          title="Automasi Sistem"
          accentWord="Automasi"
          accentColor="text-violet-600 dark:text-violet-400"
          subtitle="Pusat kontrol siaran darurat, pesan TV display, dan aturan otomatis"
          iconClay="clay-icon-violet"
          accentBarGradient="from-indigo-500 via-violet-500 to-purple-500"
          badge={
            <div className="flex items-center gap-2 clay-pill-emerald text-white px-3.5 py-1 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase">
                TV Engine Online
              </span>
            </div>
          }
          actions={
            <button
              onClick={handleRefreshAllTV}
              disabled={isRefreshingTV}
              className="clay-button text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-[14px] text-xs font-black flex items-center gap-2 active:scale-95 transition-all shadow-sm"
              title="Perbarui data seluruh layar TV sekarang"
            >
              <RefreshCw size={14} className={isRefreshingTV ? "animate-spin text-violet-600" : "text-zinc-400"} />
              <span>{isRefreshingTV ? "Menyinkronkan..." : "Sync Display TV"}</span>
            </button>
          }
        />

        {/* ═══ 4 TOP KPI CARDS ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-3 flex-none">
          {/* Card 1: TV Engine Status */}
          <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                Status TV Sync
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  Live Active
                </span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-emerald flex items-center justify-center text-white shrink-0 shadow-sm">
              <Radio size={17} strokeWidth={2.5} className="animate-pulse" />
            </div>
          </div>

          {/* Card 2: Siaran Darurat Aktif */}
          <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                Siaran Darurat TV
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {activeBroadcastCount}
                </span>
                <span className="text-[10px] font-bold text-zinc-400">Mengudara</span>
              </div>
            </div>
            <div className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] flex items-center justify-center text-white shrink-0 shadow-sm",
              activeBroadcastCount > 0 ? "clay-icon-rose" : "clay-icon-blue"
            )}>
              <Tv size={17} strokeWidth={2.5} />
            </div>
          </div>

          {/* Card 3: Pesan Bergilir TV */}
          <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                Pesan Bergilir TV
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {islandMessageCount}
                </span>
                <span className="text-[10px] font-bold text-zinc-400">Headline</span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-violet flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bell size={17} strokeWidth={2.5} />
            </div>
          </div>

          {/* Card 4: Aturan Automasi */}
          <div className="clay-surface rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-white/5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                Aturan Automasi
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {activeRulesCount}
                </span>
                <span className="text-[10px] font-bold text-zinc-400">Aktif</span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] clay-icon-amber flex items-center justify-center text-white shrink-0 shadow-sm">
              <Zap size={17} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* ═══ TAB CONTROL CENTER ═══ */}
        <div className="flex items-center gap-1 clay-inset p-1 rounded-[18px] mb-3 flex-none overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("broadcast")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-black transition-all whitespace-nowrap",
              activeTab === "broadcast"
                ? "clay-pill-amber text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            <Megaphone size={14} strokeWidth={2.5} />
            <span>Siaran Darurat TV ({broadcasts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("dynamic_island")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-black transition-all whitespace-nowrap",
              activeTab === "dynamic_island"
                ? "clay-pill-violet text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            <Bell size={14} strokeWidth={2.5} />
            <span>Pesan Bergilir TV ({islandMessageCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-black transition-all whitespace-nowrap",
              activeTab === "rules"
                ? "clay-pill-emerald text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            <Zap size={14} strokeWidth={2.5} />
            <span>Aturan Automasi ({rulesData.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-black transition-all whitespace-nowrap",
              activeTab === "logs"
                ? "clay-pill-blue text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            <Clock size={14} strokeWidth={2.5} />
            <span>Log Aktivitas</span>
          </button>
        </div>

        {/* ═══ TAB BODY CONTENT ═══ */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-32 lg:pb-10 pr-1">
          {activeTab === "broadcast" && <BroadcastControl />}
          {activeTab === "dynamic_island" && <DynamicIslandSettings />}
          {activeTab === "rules" && <AutomationRulesTab />}
          {activeTab === "logs" && <AutomationLogsTab />}
        </div>
      </div>
    </div>
  );
}

