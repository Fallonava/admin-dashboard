"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus, Users, AlertCircle, Trophy, Calendar, Trash2, Star, Flame, Zap, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import AnomalyDashboard from '@/components/AnomalyDashboard';

interface StaffPerformance {
  name: string;
  total: number;
  _id?: string;
}

interface DailyRecap {
  _id: string;
  date: string;
  total_patients: number;
  missing_sep_count: number;
  staff_performance: StaffPerformance[];
}

export default function HistoryDashboard() {
  const [data, setData] = useState<DailyRecap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardMode, setLeaderboardMode] = useState<'alltime' | 'monthly'>('alltime');
  const [leaderboardView, setLeaderboardView] = useState<'score' | 'daily'>('score');
  const [deleteConfirm, setDeleteConfirm] = useState<DailyRecap | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/recaps');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Listen for a custom event if we want to refresh from the uploader without lifting state
    const handleRefresh = () => fetchData();
    window.addEventListener('refresh-history', handleRefresh);
    return () => window.removeEventListener('refresh-history', handleRefresh);
  }, []);

  // Prepare chart data format
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      formattedDate: format(parseISO(d.date), 'dd MMM', { locale: id }),
    }));
  }, [data]);

  // --- Enhanced Staff Stats Computation ---
  const computeStaffStats = (sourceData: DailyRecap[]) => {
    const allDays = sourceData.length;
    const staffMap: Record<string, {
      total: number;
      daysActive: number;
      sparkline: number[]; // last 7 data points
      prevTotal: number; // for trend — last period
    }> = {};

    // Sorted ascending by date
    const sorted = [...sourceData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const prevHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const currentHalf = sorted.slice(Math.floor(sorted.length / 2));
    const last7Days = sorted.slice(-7);

    // Prev period totals
    const prevCounts: Record<string, number> = {};
    prevHalf.forEach(day => day.staff_performance.forEach(s => {
      prevCounts[s.name] = (prevCounts[s.name] || 0) + s.total;
    }));

    // Sparkline (last 7 days per staff)
    const sparkMap: Record<string, number[]> = {};
    last7Days.forEach(day => {
      day.staff_performance.forEach(s => {
        if (!sparkMap[s.name]) sparkMap[s.name] = [];
        sparkMap[s.name].push(s.total);
      });
    });

    // Main aggregation
    sourceData.forEach(day => {
      day.staff_performance.forEach(s => {
        if (!staffMap[s.name]) {
          staffMap[s.name] = { total: 0, daysActive: 0, sparkline: [], prevTotal: prevCounts[s.name] || 0 };
        }
        staffMap[s.name].total += s.total;
        staffMap[s.name].daysActive += 1;
      });
    });

    // Assign sparklines
    Object.keys(staffMap).forEach(name => {
      staffMap[name].sparkline = sparkMap[name] || [];
    });

    // Compute scores & badges
    const entries = Object.entries(staffMap).map(([name, s]) => ({
      name, ...s,
      sparkline: s.sparkline,
    }));

    const maxTotal = Math.max(...entries.map(e => e.total), 1);
    const maxPatients = Math.max(...entries.map(e => e.total), 1);
    const dailyTarget = Math.round(maxTotal / allDays * 0.8); // 80% of top's daily avg as target

    const withScore = entries.map(e => {
      const volumeScore = (e.total / maxTotal) * 70;
      const consistencyScore = (e.daysActive / allDays) * 30;
      const score = Math.round(volumeScore + consistencyScore);

      // Trend: compare prev half to current half
      const prevRanks = [...entries].sort((a,b) => b.prevTotal - a.prevTotal).map(e => e.name);
      const currRanks = [...entries].sort((a,b) => b.total - a.total).map(e => e.name);
      const prevRank = prevRanks.indexOf(e.name);
      const currRank = currRanks.indexOf(e.name);
      const rankDelta = prevRank - currRank; // positive = improved

      // Badges
      const badges: string[] = [];
      if (currRank === 0) badges.push('top');
      if (e.daysActive === allDays && allDays >= 3) badges.push('streak');
      if (e.total > maxTotal * 0.9) badges.push('volume');
      if (score >= 85) badges.push('star');

      const avgPerDay = allDays > 0 ? Math.round(e.total / allDays) : 0;

      return { name: e.name, total: e.total, score, rankDelta, badges, sparkline: e.sparkline, daysActive: e.daysActive, avgPerDay, dailyTarget };
    });

    return withScore.sort((a, b) => b.score - a.score).slice(0, 10);
  };

  const aggregatedLeaderboard = useMemo(() => computeStaffStats(data), [data]);

  const monthlyLeaderboard = useMemo(() => {
    const now = new Date();
    const monthly = data.filter(d => {
      const parsed = parseISO(d.date);
      return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
    });
    return computeStaffStats(monthly);
  }, [data]);

  const activeLeaderboard = leaderboardMode === 'monthly' ? monthlyLeaderboard : aggregatedLeaderboard;

  // Daily scores for today & yesterday (for daily view)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const todayData = data.find(d => d.date.startsWith(todayStr));
  const yesterdayData = data.find(d => d.date.startsWith(yesterdayStr));
  // Top 2 rivalry
  const top2 = activeLeaderboard.slice(0, 2);
  const isRivalry = top2.length === 2 && Math.abs(top2[0].total - top2[1].total) <= top2[0].total * 0.07;


  const handleDeleteRecap = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/recaps?date=${deleteConfirm.date}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirm(null);
        await fetchData();
      } else {
        alert('Gagal menghapus: ' + json.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus data.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPatientsAllTime = data.reduce((sum, d) => sum + d.total_patients, 0);
  const totalMissingSepAllTime = data.reduce((sum, d) => sum + d.missing_sep_count, 0);

  // Helper for dynamic avatars
  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
  const getAvatarGradient = (name: string) => {
    const gradients = [
      "from-rose-400 to-red-500",
      "from-fuchsia-400 to-purple-600",
      "from-violet-400 to-indigo-500",
      "from-teal-400 to-emerald-500",
      "from-cyan-400 to-blue-500",
      "from-amber-400 to-orange-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-slate-50 border border-slate-200/60 rounded-[2rem]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500 font-medium">Memuat data riwayat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8 bg-red-50 border border-red-200 rounded-[2rem] text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-800 mb-1">Gagal Memuat Data</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">
          Coba Lagi
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-12 bg-slate-50 border border-slate-200/60 rounded-[2rem] text-center flex flex-col items-center justify-center">
        <Calendar className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Belum Ada Riwayat</h3>
        <p className="text-slate-500 mt-1 max-w-sm">Unggah rekap harian pertama Anda untuk melihat statistik dan grafik perjalanan pendaftaran rumah sakit.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-rose-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0"><Trash2 size={22}/></div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Hapus Data Rekap?</h3>
                <p className="text-sm text-slate-500 mt-1">Data rekap harian tanggal <strong className="text-slate-700">{format(parseISO(deleteConfirm.date), 'dd MMMM yyyy', { locale: id })}</strong> akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all">Batal</button>
              <button onClick={handleDeleteRecap} disabled={isDeleting} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isDeleting ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50/30 p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl relative z-10"><Users size={24} /></div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pasien Kunjungan</p>
            <div className="flex items-baseline gap-2">
               <p className="text-3xl font-black text-slate-800">{totalPatientsAllTime.toLocaleString('id-ID')}</p>
               <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">All Time</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-amber-50/30 p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl relative z-10"><TrendingUp size={24} /></div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tanpa SEP (Anomali)</p>
            <div className="flex items-baseline gap-2">
               <p className="text-3xl font-black text-amber-600">{totalMissingSepAllTime.toLocaleString('id-ID')}</p>
               <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full z-10">Klaim Berisiko</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Total Patients Chart */}
          <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col h-[350px]">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500"/>
              Tren Kunjungan Pasien
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="formattedDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '15px' }}/>
                  <Line 
                    type="natural" 
                    dataKey="total_patients" 
                    name="Total Pasien" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' }} 
                    activeDot={{ r: 6, fill: '#4f46e5', stroke: '#c7d2fe', strokeWidth: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Missing SEP Chart */}
          <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col h-[300px]">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500"/>
              Tren Pasien Tanpa SEP
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} maxBarSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="formattedDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }}/>
                  <Bar 
                    dataKey="missing_sep_count" 
                    name="Tanpa SEP" 
                    fill="url(#colorBar)" 
                    radius={[6, 6, 0, 0]} 
                  />
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Leaderboard Column */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden max-h-[800px]">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                Leaderboard Petugas
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Period toggle */}
                <div className="flex items-center bg-slate-200/60 p-0.5 rounded-xl gap-0.5">
                  <button onClick={() => setLeaderboardMode('alltime')} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all", leaderboardMode === 'alltime' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>All Time</button>
                  <button onClick={() => setLeaderboardMode('monthly')} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all", leaderboardMode === 'monthly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Bulan Ini</button>
                </div>
                {/* View toggle */}
                <div className="flex items-center bg-slate-200/60 p-0.5 rounded-xl gap-0.5">
                  <button onClick={() => setLeaderboardView('score')} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all", leaderboardView === 'score' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}><Award size={10} className="inline mr-1"/>Skor</button>
                  <button onClick={() => setLeaderboardView('daily')} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all", leaderboardView === 'daily' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}><Target size={10} className="inline mr-1"/>Harian</button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{leaderboardMode === 'monthly' ? 'Kinerja bulan berjalan' : 'Akumulasi kinerja dari seluruh data harian'} · Skor komposit 0–100</p>
          </div>

          {/* Rivalry Banner */}
          {isRivalry && leaderboardView === 'score' && (
            <div className="mx-4 mt-4 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center gap-2">
              <Flame size={16} className="text-orange-500 shrink-0" />
              <p className="text-xs font-bold text-amber-800">
                Persaingan Sengit! <span className="text-orange-600">{top2[0].name.split('.')[0]}</span> vs <span className="text-orange-600">{top2[1].name.split('.')[0]}</span> — hanya <strong>{Math.abs(top2[0].total - top2[1].total)} pasien</strong> beda! 🔥
              </p>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="p-4 flex-1 overflow-auto custom-scrollbar flex flex-col gap-2.5">
            {/* Score View */}
            {leaderboardView === 'score' && (
              activeLeaderboard.length > 0 ? activeLeaderboard.map((staff, idx) => (
                <div key={staff.name} className={cn("flex flex-col gap-2 p-3.5 rounded-2xl border transition-all duration-300 relative group/row hover:z-10 hover:shadow-lg hover:scale-[1.02]",
                  idx === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50/50 border-amber-200 hover:border-amber-300' :
                  idx === 1 ? 'bg-gradient-to-r from-slate-50 to-slate-50/50 border-slate-200 hover:border-slate-300' :
                  idx === 2 ? 'bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-orange-200 hover:border-orange-300' :
                  'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                )}>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-indigo-500 rounded-r-md transition-all duration-300 group-hover/row:h-1/2 opacity-0 group-hover/row:opacity-100" />
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shrink-0",
                      idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'
                    )}>{idx + 1}</div>

                    {/* Avatar */}
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm bg-gradient-to-br", getAvatarGradient(staff.name))}>
                      {getAvatarInitials(staff.name)}
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-sm font-bold text-slate-800 truncate">{staff.name}</p>
                        {staff.badges.includes('top') && <span title="Top Performer"><Trophy size={12} className="text-amber-500" /></span>}
                        {staff.badges.includes('streak') && <span title="Hot Streak"><Flame size={12} className="text-orange-500" /></span>}
                        {staff.badges.includes('volume') && <span title="High Volume"><Zap size={12} className="text-violet-500" /></span>}
                        {staff.badges.includes('star') && <span title="Star Performer"><Star size={12} className="text-blue-500" /></span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-400">{staff.daysActive} hari aktif</p>
                        {/* Trend Arrow */}
                        {staff.rankDelta > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5"><TrendingUp size={10}/>+{staff.rankDelta}</span>
                        ) : staff.rankDelta < 0 ? (
                          <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5"><TrendingDown size={10}/>{staff.rankDelta}</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Minus size={10}/>stabil</span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-slate-800">{staff.score}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">skor</p>
                    </div>
                  </div>

                  {/* Mini sparkline + progress bar */}
                  <div className="flex flex-col gap-1.5">
                    {/* Patients count & target */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{staff.total.toLocaleString('id-ID')} pasien · avg {staff.avgPerDay}/hari</span>
                      <span className="text-[10px] font-bold text-indigo-500">target ~{staff.dailyTarget}/hari</span>
                    </div>
                    {/* Target Progress Bar */}
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", staff.avgPerDay >= staff.dailyTarget ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-400 to-indigo-500')}
                        style={{ width: `${Math.min((staff.avgPerDay / (staff.dailyTarget || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    {/* Mini Sparkline (last 7 pts) */}
                    {staff.sparkline.length > 1 && (
                      <div className="h-6 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={staff.sparkline.map((v, i) => ({ v, i }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Line type="natural" dataKey="v" stroke={idx === 0 ? '#f59e0b' : '#6366f1'} strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-slate-400 text-sm">Tidak ada data leaderboard.</div>
              )
            )}

            {/* Daily View */}
            {leaderboardView === 'daily' && (() => {
              const dayData = todayData || yesterdayData;
              const dayLabel = todayData ? 'Hari Ini' : 'Kemarin';
              if (!dayData) return <div className="py-10 text-center text-slate-400 text-sm">Belum ada data rekap hari ini atau kemarin.</div>;
              return (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">{dayLabel} · {format(parseISO(dayData.date), 'EEEE, dd MMMM', { locale: id })}</p>
                  {[...dayData.staff_performance].sort((a,b) => b.total - a.total).map((s, i) => (
                    <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shrink-0", i===0?'bg-amber-400 text-white':i===1?'bg-slate-400 text-white':'bg-slate-100 text-slate-500')}>{i+1}</div>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br shrink-0", getAvatarGradient(s.name))}>{getAvatarInitials(s.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                        <div className="h-1.5 mt-1 rounded-full bg-slate-200 overflow-hidden">
                          <div className={cn("h-full rounded-full", i===0?'bg-amber-400':i===1?'bg-slate-400':'bg-indigo-400')} style={{ width: `${Math.round((s.total / ([...dayData.staff_performance].sort((a,b)=>b.total-a.total)[0]?.total||1))*100)}%` }}/>
                        </div>
                      </div>
                      <p className="text-lg font-black text-slate-800 shrink-0">{s.total}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

      </div>
      
      {/* Actionable Anomaly Dashboard */}
      <AnomalyDashboard data={data} onRefresh={fetchData} />

      {/* Riwayat Rekap Harian - Data Management */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-500" />
              Manajemen Data Rekap
            </h3>
            <p className="text-xs text-slate-500 mt-1">Daftar semua rekap harian yang tersimpan di database</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{data.length} rekap</span>
        </div>
        <div className="divide-y divide-slate-100">
          {[...data].reverse().map((recap) => (
            <div key={recap._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="text-center bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 shrink-0">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{format(parseISO(recap.date), 'MMM', { locale: id })}</p>
                  <p className="text-xl font-black text-indigo-700 leading-none">{format(parseISO(recap.date), 'dd')}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{format(parseISO(recap.date), 'EEEE, dd MMMM yyyy', { locale: id })}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Users size={11}/> {recap.total_patients.toLocaleString('id-ID')} pasien</span>
                    {recap.missing_sep_count > 0 && <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><AlertCircle size={11}/> {recap.missing_sep_count} anomali</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirm(recap)}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold shrink-0"
              >
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
