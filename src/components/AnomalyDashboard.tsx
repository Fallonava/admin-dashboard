"use client";

import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertCircle, Clock, CheckCircle2, History, Search, Info, Loader2, X, Send, Plus, Trash2, Edit2, ShieldAlert, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

interface AuditLog {
  action: string;
  note: string;
  by: string;
  timestamp: string;
  _id: string;
}

interface AnomalyData {
  no_rm: string;
  nama: string;
  asuransi: string;
  poli?: string;
  anomaly_reason?: string | null;
  status: 'OPEN' | 'RESOLVED' | 'PENDING_DOCTOR' | 'PENDING_SYSTEM' | 'REJECTED' | 'IGNORED';
  audit_logs: AuditLog[];
  resolvedAt?: string;
  _id: string;
  // Included from parent for context
  date: string;
  recapId: string;
}

interface AnomalyDashboardProps {
  data: any[]; // The raw recap data from API
  onRefresh: () => void;
}

export default function AnomalyDashboard({ data, onRefresh }: AnomalyDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isResolving, setIsResolving] = useState<string | null>(null);
  
  // Modal states
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyData | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'REJECTED'>('ALL');
  
  const [resolveNote, setResolveNote] = useState("");
  const [resolveStatus, setResolveStatus] = useState("RESOLVED");
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // CRUD Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [formData, setFormData] = useState({ date: '', no_rm: '', nama: '', asuransi: '' });

  // Flatten anomalies from all recaps
  const allAnomalies = useMemo(() => {
    let anomalies: AnomalyData[] = [];
    data.forEach(recap => {
      if (recap.missing_sep_details && recap.missing_sep_details.length > 0) {
        recap.missing_sep_details.forEach((detail: any) => {
          anomalies.push({
            ...detail,
            date: recap.date,
            recapId: recap._id
          });
        });
      }
    });
    // Sort so OPEN is top, then by date descending
    return anomalies.sort((a, b) => {
      if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
      if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [data]);

  const filteredAnomalies = useMemo(() => {
    let result = allAnomalies;
    
    // Tab filtering
    if (activeTab === 'PENDING') {
      result = result.filter(a => ['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(a.status));
    } else if (activeTab === 'RESOLVED') {
      result = result.filter(a => a.status === 'RESOLVED' || a.status === 'IGNORED');
    } else if (activeTab === 'REJECTED') {
      result = result.filter(a => a.status === 'REJECTED');
    }

    // Text filtering
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.nama.toLowerCase().includes(lowerQ) ||
        d.no_rm.toLowerCase().includes(lowerQ)
      );
    }
    
    return result;
  }, [allAnomalies, searchQuery, activeTab]);

  const openLogModal = (anomaly: AnomalyData) => {
    setSelectedAnomaly(anomaly);
    setIsLogModalOpen(true);
  };

  const openResolveModal = (anomaly: AnomalyData) => {
    setSelectedAnomaly(anomaly);
    setResolveNote("");
    setResolveStatus("RESOLVED");
    setIsResolveModalOpen(true);
  };

  const openAddModal = () => {
    // Default date to today
    setFormData({ date: new Date().toISOString().split('T')[0], no_rm: '', nama: '', asuransi: '' });
    setIsAddModalOpen(true);
  };

  const openEditModal = (anomaly: AnomalyData) => {
    setSelectedAnomaly(anomaly);
    setFormData({ date: anomaly.date.split('T')[0], no_rm: anomaly.no_rm, nama: anomaly.nama, asuransi: anomaly.asuransi });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (anomaly: AnomalyData) => {
    setSelectedAnomaly(anomaly);
    setIsDeleteModalOpen(true);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnomaly || !resolveNote.trim()) return;

    setIsResolving(selectedAnomaly._id);
    try {
      // In a real app with auth, "by" would be the actual logged-in user
      const currentUser = "System Admin";

      const res = await fetch('/api/recaps/resolve-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedAnomaly.date,
          no_rm: selectedAnomaly.no_rm,
          new_status: resolveStatus,
          note: resolveNote,
          user: currentUser
        })
      });

      const result = await res.json();
      if (result.success) {
        setIsResolveModalOpen(false);
        onRefresh();
      } else {
        alert(result.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsResolving(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResolving('add');
    try {
      const currentUser = "System Admin";
      const res = await fetch('/api/recaps/crud-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user: currentUser })
      });
      const result = await res.json();
      if (result.success) {
        setIsAddModalOpen(false);
        onRefresh();
      } else {
        alert(result.error);
      }
    } catch(err:any) {
      alert("Error: " + err.message);
    } finally {
      setIsResolving(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnomaly) return;
    setIsResolving('edit');
    try {
      const currentUser = "System Admin";
      const res = await fetch('/api/recaps/crud-anomaly', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recap_id: selectedAnomaly.recapId, 
          original_no_rm: selectedAnomaly.no_rm,
          ...formData, 
          user: currentUser 
        })
      });
      const result = await res.json();
      if (result.success) {
        setIsEditModalOpen(false);
        onRefresh();
      } else {
        alert(result.error);
      }
    } catch(err:any) {
      alert("Error: " + err.message);
    } finally {
      setIsResolving(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnomaly) return;
    setIsResolving('delete');
    try {
      const res = await fetch(`/api/recaps/crud-anomaly?recap_id=${selectedAnomaly.recapId}&no_rm=${selectedAnomaly.no_rm}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        setIsDeleteModalOpen(false);
        onRefresh();
      } else {
        alert(result.error);
      }
    } catch(err:any) {
      alert("Error: " + err.message);
    } finally {
      setIsResolving(null);
    }
  };

  const handleDeleteAll = async () => {
    if (filteredAnomalies.length === 0) return;
    setIsDeletingAll(true);
    try {
      // Delete all anomalies in the current filtered list one by one
      for (const anomaly of filteredAnomalies) {
        await fetch(`/api/recaps/crud-anomaly?recap_id=${anomaly.recapId}&no_rm=${anomaly.no_rm}`, {
          method: 'DELETE'
        });
      }
      setIsDeleteAllModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert('Terjadi kesalahan saat menghapus data: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md tracking-wider inline-flex items-center gap-1 border bg-amber-50 text-amber-700 border-amber-200"><Clock size={10} strokeWidth={3} /> Pending</span>;
      case 'RESOLVED': return <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md tracking-wider inline-flex items-center gap-1 border bg-emerald-50 border-emerald-100 text-emerald-600"><CheckCircle2 size={10} strokeWidth={3} /> Selesai</span>;
      case 'PENDING_DOCTOR': return <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md tracking-wider inline-flex items-center gap-1 border bg-blue-50 border-blue-200 text-blue-700"><Clock size={10} strokeWidth={3} /> Tunggu Dokter</span>;
      case 'PENDING_SYSTEM': return <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md tracking-wider inline-flex items-center gap-1 border bg-purple-50 border-purple-200 text-purple-700"><ShieldAlert size={10} strokeWidth={3} /> Sistem Error</span>;
      case 'REJECTED': return <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md tracking-wider inline-flex items-center gap-1 border bg-red-50 border-red-200 text-red-700"><X size={10} strokeWidth={3} /> Ditolak / Batal</span>;
      case 'IGNORED': return <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md tracking-wider inline-flex items-center gap-1 border bg-slate-100 border-slate-300 text-slate-600"><Info size={10} strokeWidth={3} /> Diabaikan</span>;
      default: return null;
    }
  };

  const openCount = allAnomalies.filter(a => ['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(a.status)).length;

  return (
    <>
    {/* Delete All Confirmation Modal */}
    {isDeleteAllModalOpen && (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsDeleteAllModalOpen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-rose-100" onClick={e => e.stopPropagation()}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0"><Trash2 size={22}/></div>
            <div>
              <h3 className="font-black text-slate-800 text-lg">Hapus Semua Anomali?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tindakan ini akan menghapus <strong className="text-rose-600">{filteredAnomalies.length} anomali</strong> yang saat ini ditampilkan{activeTab !== 'ALL' ? ` (tab: ${activeTab})` : ''}. Data anomali yang dihapus <strong>tidak dapat dikembalikan</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setIsDeleteAllModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all">Batal</button>
            <button onClick={handleDeleteAll} disabled={isDeletingAll} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isDeletingAll ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
              {isDeletingAll ? 'Menghapus...' : `Hapus ${filteredAnomalies.length} Data`}
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm flex flex-col overflow-hidden w-full">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <AlertCircle size={20} className={openCount > 0 ? "text-amber-500" : "text-emerald-500"} />
            Claim Aging & Anomali
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Pantau dan selesaikan pasien tanpa bukti SEP untuk mencegah gagal klaim.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {openCount > 0 && (
             <div className="px-3 py-1 bg-amber-100/50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
               </span>
               {openCount} Pending Selesai
             </div>
          )}
          {filteredAnomalies.length > 0 && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <Trash2 size={13} strokeWidth={2.5}/> Hapus Semua
            </button>
          )}
          <button 
             onClick={openAddModal}
             className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-100/80 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
          >
             <Plus size={14} strokeWidth={2.5}/> Tambah Manual
          </button>
        </div>
      </div>
      
      {/* Controls: Search & Premium Segmented Tabs */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        
        {/* Segmented Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto relative z-0">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'RESOLVED', label: 'Selesai' },
            { id: 'REJECTED', label: 'Ditolak' }
          ].map((tab) => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all relative",
                  activeTab === tab.id 
                    ? "text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
             >
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-white rounded-lg shadow-sm w-full h-full -z-10 animate-in fade-in duration-200" />
                )}
                {tab.label}
             </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Cari RM atau Nama Pasien..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm font-medium pl-9 pr-4 py-2 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>
      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar max-h-[500px]">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-slate-50/95 backdrop-blur z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 w-32">Tgl Rekap</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">Pasien & No RM</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 w-32">Status</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 text-right w-48">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredAnomalies.length > 0 ? (
              filteredAnomalies.map((row) => (
                <tr key={row._id + row.no_rm} className={cn("transition-colors group", ['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(row.status) ? "hover:bg-amber-50/30" : "hover:bg-slate-50 opacity-80")}>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Clock size={12} className="text-slate-400" />
                      {format(parseISO(row.date), 'dd MMM yyyy', { locale: id })}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <p className={cn("text-sm font-bold", ['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(row.status) ? "text-slate-800" : "text-slate-600")}>{row.nama}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{row.no_rm}</span>
                        <span className="text-[11px] font-medium text-slate-400 capitalize">{row.asuransi}</span>
                        {row.poli && row.poli !== '-' && (
                          <span className="text-[10px] font-medium text-slate-400" title={row.poli}>📍 {row.poli}</span>
                        )}
                      </div>
                      {row.anomaly_reason && (
                        <div className="mt-1">
                          {row.anomaly_reason === 'rawat_bersama' && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Rawat Bersama</span>
                          )}
                          {row.anomaly_reason === 'terapi_gabung' && (
                            <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">Terapi Gabung</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => openLogModal(row)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        title="Lihat Audit Log"
                      >
                        <History size={16} />
                      </button>
                      
                      <button 
                        onClick={() => openEditModal(row)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        title="Edit Data"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button 
                        onClick={() => openDeleteModal(row)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 mr-2"
                        title="Hapus Anomali"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      {['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(row.status) && (
                        <button 
                          onClick={() => openResolveModal(row)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          <Edit2 size={14} className="text-indigo-500" /> Ubah Status
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                     <CheckCircle2 size={32} className="opacity-50 text-emerald-500" />
                     <p className="text-sm font-medium">Bagus! Tidak ada antrian klaim anomali yang ditemukan.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resolve Modal via Radix UI */}
      <Dialog.Root open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Edit2 className="text-indigo-500" /> Ubah Status Anomali
              </Dialog.Title>
              <Dialog.Close className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
              <p className="text-slate-500 mb-1">Pasien</p>
              <p className="font-bold text-slate-800">{selectedAnomaly?.nama}</p>
              <p className="font-mono text-slate-500 text-xs mt-0.5">{selectedAnomaly?.no_rm}</p>
            </div>

            <form onSubmit={handleResolve}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-bold text-slate-700 mb-1.5">Pilih Status Baru</label>
                  <select
                    id="status"
                    value={resolveStatus}
                    onChange={(e) => setResolveStatus(e.target.value)}
                    className="w-full p-2.5 mb-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="RESOLVED">Selesai (SEP Terbit / Beres)</option>
                    <option value="PENDING_DOCTOR">Menunggu Dokter (Rujukan / TTD)</option>
                    <option value="PENDING_SYSTEM">Sistem Error (V-Claim Maintenance)</option>
                    <option value="REJECTED">Ditolak / Batal BPJS</option>
                    <option value="IGNORED">Abaikan (Salah Catat / Umum)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="note" className="block text-sm font-bold text-slate-700 mb-1.5">Catatan Resolusi</label>
                  <textarea 
                    id="note"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    required
                    placeholder="Contoh: SEP sudah dibuat, sistem SIMRS sempat error..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none h-24"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Dialog.Close type="button" className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    Batal
                  </Dialog.Close>
                  <button 
                    type="submit" 
                    disabled={isResolving !== null || !resolveNote.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
                  >
                    {isResolving === selectedAnomaly?._id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add / Edit Modal */}
      <Dialog.Root open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-black text-slate-800 flex items-center gap-2">
                {isAddModalOpen ? <Plus className="text-indigo-500" /> : <Edit2 className="text-blue-500" />} 
                {isAddModalOpen ? 'Tambah Anomali Manual' : 'Edit Data Pasien'}
              </Dialog.Title>
              <Dialog.Close className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            
            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit}>
              <div className="space-y-4">
                {isAddModalOpen && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal Rekap</label>
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">No. Rekam Medis</label>
                  <input 
                    type="text" 
                    required
                    value={formData.no_rm}
                    onChange={e => setFormData(p => ({...p, no_rm: e.target.value}))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Pasien</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nama}
                    onChange={e => setFormData(p => ({...p, nama: e.target.value}))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Jenis Asuransi</label>
                  <input 
                    type="text" 
                    required
                    value={formData.asuransi}
                    onChange={e => setFormData(p => ({...p, asuransi: e.target.value}))}
                    placeholder="Contoh: BPJS KESEHATAN"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Dialog.Close type="button" className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    Batal
                  </Dialog.Close>
                  <button 
                    type="submit" 
                    disabled={isResolving !== null}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {(isResolving === 'add' || isResolving === 'edit') ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 border border-slate-100 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert size={24} />
            </div>
            <Dialog.Title className="text-lg font-black text-slate-800 mb-2">
              Hapus Data Anomali?
            </Dialog.Title>
            <p className="text-sm text-slate-500 mb-6">
              Data pasien <strong>{selectedAnomaly?.nama}</strong> ({selectedAnomaly?.no_rm}) akan dihapus secara permanen dari daftar anomali. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Dialog.Close type="button" className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-1">
                Batal
              </Dialog.Close>
              <button 
                onClick={handleDelete}
                disabled={isResolving === 'delete'}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex-1"
              >
                {isResolving === 'delete' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Hapus
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Audit Log Modal */}
      <Dialog.Root open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-black text-slate-800 flex items-center gap-2">
                <History className="text-indigo-500" /> Jejak Audit (Audit Trail)
              </Dialog.Title>
              <Dialog.Close className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            
            <div className="mb-6">
              <h4 className="font-bold text-slate-800 text-sm mb-1">{selectedAnomaly?.nama}</h4>
              <p className="text-xs font-mono text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{selectedAnomaly?.no_rm}</p>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-auto custom-scrollbar pr-2 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
               
               {/* Initial Upload State */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-slate-200 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                     <Info size={12} />
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                     <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-800 text-sm">Sistem</div>
                        <time className="text-[10px] font-medium text-amber-500">{selectedAnomaly?.date && format(parseISO(selectedAnomaly.date), 'dd MMM yyyy, HH:mm')}</time>
                     </div>
                     <div className="text-slate-500 text-xs">Dicatat sebagai Anomali (Missing SEP) saat unggah Excel.</div>
                  </div>
               </div>

               {/* Logs loop */}
               {selectedAnomaly?.audit_logs?.map((log, i) => (
                 <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-indigo-100 text-indigo-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                       <CheckCircle2 size={12} />
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-slate-100 bg-slate-50 shadow-sm">
                       <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {log.by}
                            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">{log.action}</span>
                          </div>
                          <time className="text-[10px] font-medium text-slate-400">{format(new Date(log.timestamp), 'dd MMM, HH:mm')}</time>
                       </div>
                       <div className="text-slate-700 text-xs font-medium italic">"{log.note}"</div>
                    </div>
                 </div>
               ))}
               
               {(!selectedAnomaly?.audit_logs || selectedAnomaly.audit_logs.length === 0) && (
                 <div className="py-4 text-center text-xs text-slate-400 w-full z-10 relative">Belum ada tindakan lanjut.</div>
               )}

            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  </>
  );
}
