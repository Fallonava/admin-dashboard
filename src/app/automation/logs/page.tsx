"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { RefreshCw, Filter, ShieldCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

interface AutomationLog {
    id: bigint;
    type: string;
    details: any;
    createdAt: string;
}

export default function AutomationLogsPage() {
    const { data: logsData, mutate, isLoading, error } = useSWR<AutomationLog[]>('/api/automation-logs', {
        refreshInterval: 10000
    });
    const logs = Array.isArray(logsData) ? logsData : [];
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const metrics = useMemo(() => {
        const filtered = typeFilter ? logs.filter(l => l.type === typeFilter) : logs;
        const runLogs = logs.filter(l => l.type === 'run' || l.type === 'error');
        const successLogs = runLogs.filter(l => l.type === 'run');
        const errorLogs = runLogs.filter(l => l.type === 'error');

        let totalApplied = 0, totalFailed = 0;
        runLogs.forEach(log => {
            totalApplied += (log.details?.applied || 0);
            totalFailed += (log.details?.failed || 0);
        });

        const totalRuns = runLogs.length;
        const successRate = totalRuns > 0 ? ((successLogs.length / totalRuns) * 100).toFixed(1) : 'N/A';
        const lastRun = runLogs.length > 0 ? new Date(runLogs[0].createdAt) : null;
        const avgDuration = runLogs.length > 0
            ? (runLogs.reduce((sum, l) => sum + (l.details?.durationMs || 0), 0) / runLogs.length).toFixed(0)
            : 'N/A';

        return { totalApplied, totalFailed, totalRuns, successRate, lastRun, avgDuration };
    }, [logs]);

    const filtered = typeFilter ? logs.filter(l => l.type === typeFilter) : logs;
    const types = Array.from(new Set(logs.map(l => l.type)));

    return (
        <div className="p-2 sm:p-6 lg:p-8 max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100">
            <PageHeader
                icon={<Clock size={22} className="text-white" strokeWidth={2.5} />}
                title="Log &amp; Metrik Automasi"
                accentWord="Log"
                accentColor="text-blue-600 dark:text-blue-400"
                subtitle="Audit log sinkronisasi dan eksekusi background engine"
                iconClay="clay-icon-blue"
                accentBarGradient="from-blue-500 via-indigo-500 to-cyan-400"
                actions={
                    <button
                        onClick={() => mutate()}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl clay-button text-zinc-700 dark:text-zinc-300 text-xs font-black w-full sm:w-auto active:scale-95 transition-all shadow-sm"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
                    </button>
                }
            />

            {error && (
                <div className="mb-6 p-4 clay-pill-rose text-white rounded-2xl text-xs font-bold">
                    Gagal memuat log. Pastikan Anda memiliki akses administrator.
                </div>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-5 rounded-[24px] clay-surface flex flex-col justify-between shadow-md">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider">Total Runs</div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">{metrics.totalRuns}</div>
                </div>
                <div className="p-5 rounded-[24px] clay-surface flex flex-col justify-between shadow-md">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider">Success Rate</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{metrics.successRate}%</div>
                </div>
                <div className="p-5 rounded-[24px] clay-surface flex flex-col justify-between shadow-md">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider">Applied</div>
                    <div className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-2">{metrics.totalApplied}</div>
                </div>
                <div className="p-5 rounded-[24px] clay-surface flex flex-col justify-between shadow-md">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider">Avg Latency</div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{metrics.avgDuration} <span className="text-xs font-bold text-zinc-400">ms</span></div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 clay-inset px-3 py-1.5 rounded-xl">
                    <Filter size={14} className="text-zinc-400" />
                    <select
                        value={typeFilter || ''}
                        onChange={e => setTypeFilter(e.target.value || null)}
                        className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                    >
                        <option value="" className="bg-white dark:bg-zinc-900">Semua Tipe</option>
                        {types.map(t => (
                            <option key={t} value={t} className="bg-white dark:bg-zinc-900">{t.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
                {typeFilter && (
                    <button
                        onClick={() => setTypeFilter(null)}
                        className="text-xs font-black text-blue-600 dark:text-blue-400 clay-button px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                    >Reset</button>
                )}
            </div>

            {/* Logs */}
            <div className="space-y-3">
                {filtered.map(log => {
                    const isError = log.type === 'error';
                    const isRun = log.type === 'run';
                    return (
                        <div
                            key={log.id.toString()}
                            className="p-5 clay-surface rounded-[24px] shadow-sm transition-all"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white",
                                        isError ? 'clay-pill-rose' :
                                        isRun ? 'clay-pill-emerald' :
                                        'clay-pill-blue'
                                    )}>
                                        {log.type}
                                    </span>
                                </div>
                                <div className="text-[10px] text-zinc-400 font-bold whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </div>
                            </div>
                            {isRun && log.details && (
                                <div className="grid grid-cols-3 gap-2 text-xs font-bold mb-2">
                                    <div><span className="text-zinc-400">Applied:</span> <span className="font-mono font-black text-emerald-500">{log.details.applied || 0}</span></div>
                                    <div><span className="text-zinc-400">Failed:</span> <span className="font-mono font-black text-rose-500">{log.details.failed || 0}</span></div>
                                    <div><span className="text-zinc-400">Duration:</span> <span className="font-mono text-zinc-700 dark:text-zinc-300">{log.details.durationMs || 0}ms</span></div>
                                </div>
                            )}
                            {log.details?.error && (
                                <div className="text-xs text-rose-500 font-mono font-bold mb-2 clay-inset p-2.5 rounded-xl">
                                    Error: {log.details.error}
                                </div>
                            )}
                            {log.details && Object.keys(log.details).length > 0 && (
                                <details className="text-xs mt-2">
                                    <summary className="cursor-pointer font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">Detail JSON</summary>
                                    <pre className="mt-2 max-h-32 overflow-auto clay-inset p-3 rounded-2xl font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
                                        {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="clay-surface p-12 rounded-[28px] text-center text-zinc-400 font-bold text-xs">
                        Tidak ada log {typeFilter ? `untuk tipe "${typeFilter}"` : ''}.
                    </div>
                )}
            </div>
        </div>
    );
}
