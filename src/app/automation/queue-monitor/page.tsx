'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { AlertCircle, CheckCircle, Clock, Zap, Activity, RefreshCw } from 'lucide-react';

interface QueueMetrics {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

interface CircuitBreakerMetrics {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    successCount: number;
    lastFailureTime: string | null;
}

interface QueueResponse {
    success: boolean;
    queue: QueueMetrics;
    circuitBreaker: CircuitBreakerMetrics;
    failedJobs: any[];
    timestamp: string;
}

export default function QueueMonitorPage() {
    const [mounted, setMounted] = useState(false);

    const { data, error, isLoading, mutate } = useSWR<QueueResponse>(
        '/api/queue-metrics',
        async (url) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch queue metrics');
            return res.json();
        },
        { refreshInterval: 5000 } // Refresh every 5 seconds
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const metrics = data?.queue || { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    const cb = data?.circuitBreaker;
    const failedJobs = data?.failedJobs || [];

    return (
        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-600" />
                        Queue Monitor
                    </h1>
                    <p className="text-slate-500 mt-1">Real-time automation queue metrics & circuit breaker status</p>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200/60">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data?.success ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${data?.success ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className="font-medium text-slate-700">Live Status</span>
                    </div>
                </div>
            </div>

            {/* Top Cards: Circuit Breaker & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Circuit Breaker Status */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Zap className="w-32 h-32" />
                    </div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Circuit Breaker</h2>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                            <span className="text-sm font-medium text-slate-500">Current State</span>
                            <div className="flex items-center gap-2">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${cb?.state === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' :
                                        cb?.state === 'OPEN' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {cb?.state === 'CLOSED' && <CheckCircle className="w-4 h-4" />}
                                    {cb?.state === 'OPEN' && <AlertCircle className="w-4 h-4" />}
                                    {cb?.state === 'HALF_OPEN' && <Clock className="w-4 h-4" />}
                                    {cb?.state || 'UNKNOWN'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                                <label className="text-xs font-semibold uppercase tracking-wider text-red-500">Failures</label>
                                <p className="text-3xl font-extrabold text-red-600 mt-1">{cb?.failureCount || 0}</p>
                            </div>
                            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                <label className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Recoveries</label>
                                <p className="text-3xl font-extrabold text-emerald-600 mt-1">{cb?.successCount || 0}</p>
                            </div>
                        </div>

                        {cb?.lastFailureTime && (
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-lg">
                                <Clock className="w-4 h-4" />
                                Last failure: {new Date(cb.lastFailureTime).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status & Sync */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">System Sync</h2>
                        </div>

                        <div className="space-y-2 mb-8">
                            <label className="text-sm font-medium text-slate-500">Last Updated</label>
                            <p className="text-2xl font-bold text-slate-800 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 inline-block">
                                {data ? new Date(data.timestamp).toLocaleTimeString() : '--:--:--'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => mutate()}
                        disabled={isLoading}
                        className="w-full relative overflow-hidden group bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-3.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <div className="flex items-center justify-center gap-2 relative z-10">
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            {isLoading ? 'Synchronizing...' : 'Refresh Metrics Manual'}
                        </div>
                        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    </button>
                </div>
            </div>

            {/* Queue Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Waiting', value: metrics.waiting, color: 'blue' },
                    { label: 'Active', value: metrics.active, color: 'purple' },
                    { label: 'Completed', value: metrics.completed, color: 'emerald' },
                    { label: 'Failed', value: metrics.failed, color: 'red' },
                    { label: 'Delayed', value: metrics.delayed, color: 'yellow' },
                ].map((metric) => (
                    <div key={metric.label} className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-2 h-2 rounded-full bg-${metric.color}-500`} />
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{metric.label}</label>
                        </div>
                        <p className={`text-4xl font-black text-${metric.color}-600 tracking-tight`}>{metric.value}</p>
                    </div>
                ))}
            </div>

            {/* Failed Jobs List */}
            {failedJobs.length > 0 && (
                <div className="bg-white border mb-8 border-red-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-red-50/50 p-5 w-full border-b border-red-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Failed Jobs History
                        </h3>
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                            {failedJobs.length} records
                        </span>
                    </div>

                    <div className="p-5 max-h-[400px] overflow-y-auto space-y-3">
                        {failedJobs.map((job, idx) => (
                            <div key={job.id || idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono font-medium bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">ID: {job.id}</span>
                                            {job.timestamp && (
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {new Date(job.timestamp).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-base font-semibold text-slate-800">
                                            Doctor {job.data?.id} <span className="text-slate-400 font-normal mx-1">→</span>
                                            <span className="text-blue-600">{job.data?.status}</span>
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center justify-center text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full w-fit">
                                        Attempt {job.attempts || 0}
                                    </span>
                                </div>
                                {job.error && (
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                        <p className="text-sm text-red-600 font-medium break-all">{job.error}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Overlay / Banner */}
            {error && !data?.success && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5 shadow-sm mb-8">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-bold text-red-800">Queue Service Unavailable</h3>
                            <p className="text-sm text-red-600 mt-1">
                                The automation queue is currently down or unreachable. The system is running in direct update mode (without retry logic).
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
