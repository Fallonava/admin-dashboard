"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { RefreshCw, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationLog {
  id: any;
  type: string;
  details: any;
  createdAt: string;
}

export function AutomationLogsTab() {
  const { data: logsData, mutate, isLoading } = useSWR<AutomationLog[]>('/api/automation-logs', {
    refreshInterval: 10000,
  });
  const logs = Array.isArray(logsData) ? logsData : [];
  const [filter, setFilter] = useState<string>("ALL");

  const filteredLogs = useMemo(() => {
    if (filter === "ALL") return logs;
    return logs.filter((l) => l.type === filter.toLowerCase());
  }, [logs, filter]);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 clay-inset p-1 rounded-[14px]">
          {["ALL", "RUN", "ERROR", "SYNC"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-3 py-1 rounded-[10px] text-[10.5px] font-black transition-all",
                filter === cat ? "clay-pill-blue text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => mutate()}
          className="clay-button text-zinc-600 dark:text-zinc-300 px-3 py-1.5 rounded-[12px] text-xs font-black flex items-center gap-1.5 active:scale-95 shadow-sm"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Logs Table / List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 clay-surface rounded-[24px] text-zinc-400 text-xs font-bold">
            Tidak ada catatan log automasi.
          </div>
        ) : (
          filteredLogs.map((log, i) => {
            const isError = log.type === 'error';
            const dt = new Date(log.createdAt);

            return (
              <div
                key={log.id ? String(log.id) : i}
                className="clay-surface p-3.5 rounded-[18px] flex items-center justify-between gap-3 text-xs shadow-sm border border-zinc-200/50 dark:border-white/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-[10px] flex items-center justify-center text-white shrink-0 shadow-sm",
                      isError ? "clay-pill-rose" : "clay-pill-emerald"
                    )}
                  >
                    {isError ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black uppercase text-[11px] text-zinc-900 dark:text-zinc-100">
                        {log.type}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold">
                        {dt.toLocaleTimeString('id-ID')} • {dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                      {log.details ? JSON.stringify(log.details) : "Background job executed successfully"}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                    isError ? "clay-pill-rose text-white" : "clay-inset text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {isError ? "Gagal" : "Sukses"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
