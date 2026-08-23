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
  date: string;
  recapId: string;
}

interface AnomalyDashboardProps {
  data: any[];
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
    return anomalies.sort((a, b) => {
      if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
      if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [data]);

  const filteredAnomalies = useMemo(() => {
    let result = allAnomalies;
    
    if (activeTab === 'PENDING') {
      result = result.filter(a => ['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(a.status));
    } else if (activeTab === 'RESOLVED') {
      result = result.filter(a => a.status === 'RESOLVED' || a.status === 'IGNORED');
    } else if (activeTab === 'REJECTED') {
      result = result.filter(a => a.status === 'REJECTED');
    }

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
      case 'OPEN': return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-flex items-center gap-1.5 clay-pill-amber text-white"><Clock size={10} strokeWidth={3} /> Pending</span>;
      case 'RESOLVED': return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-flex items-center gap-1.5 clay-pill-emerald text-white"><CheckCircle2 size={10} strokeWidth={3} /> Selesai</span>;
      case 'PENDING_DOCTOR': return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-flex items-center gap-1.5 clay-pill-blue text-white"><Clock size={10} strokeWidth={3} /> Tunggu Dokter</span>;
      case 'PENDING_SYSTEM': return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-flex items-center gap-1.5 clay-pill-violet text-white"><ShieldAlert size={10} strokeWidth={3} /> Sistem Error</span>;
      case 'REJECTED': return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-flex items-center gap-1.5 clay-pill-rose text-white"><X size={10} strokeWidth={3} /> Ditolak / Batal</span>;
      case 'IGNORED': return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider inline-flex items-center gap-1.5 clay-button text-zinc-500"><Info size={10} strokeWidth={3} /> Diabaikan</span>;
      default: return null;
    }
  };

  const openCount = allAnomalies.filter(a => ['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(a.status)).length;

  return (
    <>
    {/* Delete All Confirmation Modal */}
    {isDeleteAllModalOpen && (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsDeleteAllModalOpen(false)}>
        <div className="clay-surface rounded-[32px] p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-start gap-4">
            <div className="p-3 clay-pill-rose text-white rounded-2xl shrink-0"><Trash2 size={22}/></div>
            <div>
              <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-lg">Hapus Semua Anomali?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-bold">
                Tindakan ini akan menghapus <strong className="text-rose-500">{filteredAnomalies.length} anomali</strong> yang saat ini ditampilkan. Data anomali yang dihapus <strong>tidak dapat dikembalikan</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setIsDeleteAllModalOpen(false)} className="flex-1 px-4 py-2.5 clay-button text-zinc-700 dark:text-zinc-300 font-black rounded-xl text-sm transition-all active:scale-95">Batal</button>
            <button onClick={handleDeleteAll} disabled={isDeletingAll} className="flex-1 px-4 py-2.5 clay-pill-rose text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95">
              {isDeletingAll ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
              {isDeletingAll ? 'Menghapus...' : `Hapus (${filteredAnomalies.length})`}
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="clay-surface rounded-[36px] shadow-2xl flex flex-col overflow-hidden w-full">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-lg">
            <AlertCircle size={20} className={openCount > 0 ? "text-amber-500" : "text-emerald-500"} />
            Claim Aging & Anomali
          </h3>
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1">
            Pantau dan selesaikan pasien tanpa bukti SEP untuk mencegah gagal klaim.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          {openCount > 0 && (
             <div className="px-3.5 py-1.5 clay-pill-amber text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
               {openCount} Pending Selesai
             </div>
          )}
          {filteredAnomalies.length > 0 && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 clay-pill-rose text-white rounded-2xl text-xs font-black transition-all active:scale-95 shrink-0"
            >
              <Trash2 size={14} strokeWidth={2.5}/> Hapus Semua
            </button>
          )}
          <button 
             onClick={openAddModal}
             className="flex items-center gap-1.5 px-4 py-2 clay-button text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black transition-all active:scale-95 shrink-0"
          >
             <Plus size={14} strokeWidth={2.5}/> Tambah Manual
          </button>
        </div>
      </div>
      
      {/* Controls: Search & Tabs */}
      <div className="p-4 border-b border-zinc-200/60 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Segmented Controls */}
        <div className="flex clay-inset p-1 rounded-2xl w-full md:w-auto overflow-x-auto hide-scrollbar">
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
                  "px-4 py-2 text-xs font-black rounded-xl transition-all",
                  activeTab === tab.id 
                    ? "clay-pill-blue text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
             >
                {tab.label}
             </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={14} className="text-zinc-400" />
          </div>
          <input 
            type="text" 
            placeholder="Cari RM atau Nama Pasien..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-bold pl-9 pr-4 py-2.5 clay-inset rounded-2xl transition-all outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar max-h-[500px]">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur z-10 border-b border-zinc-200/60 dark:border-white/5">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-32">Tgl Rekap</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pasien & No RM</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-32">Status</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right w-48">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5">
            {filteredAnomalies.length > 0 ? (
              filteredAnomalies.map((row) => (
                <tr key={row._id + row.no_rm} className="transition-colors group hover:bg-zinc-500/5">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      <Clock size={12} className="text-zinc-400" />
                      {format(parseISO(row.date), 'dd MMM yyyy', { locale: id })}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{row.nama}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-zinc-500 clay-button px-2 py-0.5 rounded-lg">{row.no_rm}</span>
                        <span className="text-[11px] font-bold text-zinc-400 capitalize">{row.asuransi}</span>
                        {row.poli && row.poli !== '-' && (
                          <span className="text-[10px] font-bold text-zinc-400" title={row.poli}>📍 {row.poli}</span>
                        )}
                      </div>
                      {row.anomaly_reason && (
                        <div className="mt-1">
                          {row.anomaly_reason === 'rawat_bersama' && (
                            <span className="text-[9px] font-black text-white clay-pill-blue px-2 py-0.5 rounded-md">Rawat Bersama</span>
                          )}
                          {row.anomaly_reason === 'terapi_gabung' && (
                            <span className="text-[9px] font-black text-white clay-pill-violet px-2 py-0.5 rounded-md">Terapi Gabung</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => openLogModal(row)}
                        className="p-2 text-zinc-500 hover:text-violet-600 clay-button rounded-xl transition-colors"
                        title="Lihat Audit Log"
                      >
                        <History size={15} />
                      </button>
                      
                      <button 
                        onClick={() => openEditModal(row)}
                        className="p-2 text-zinc-500 hover:text-blue-600 clay-button rounded-xl transition-colors"
                        title="Edit Data"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button 
                        onClick={() => openDeleteModal(row)}
                        className="p-2 text-zinc-500 hover:text-rose-600 clay-button rounded-xl transition-colors mr-1"
                        title="Hapus Anomali"
                      >
                        <Trash2 size={15} />
                      </button>
                      
                      {['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(row.status) && (
                        <button 
                          onClick={() => openResolveModal(row)}
                          className="flex items-center gap-1.5 px-3 py-1.5 clay-button text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95"
                        >
                          <Edit2 size={13} className="text-blue-500" /> Ubah Status
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-zinc-400">
                     <CheckCircle2 size={32} className="text-emerald-500" />
                     <p className="text-sm font-bold">Bagus! Tidak ada antrian klaim anomali yang ditemukan.</p>
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
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md clay-surface rounded-[36px] p-6 shadow-2xl z-[200] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit2 className="text-violet-500" /> Ubah Status Anomali
              </Dialog.Title>
              <Dialog.Close className="p-2 clay-button text-zinc-500 rounded-full transition-colors active:scale-95">
                <X size={18} />
              </Dialog.Close>
            </div>
            
            <div className="mb-5 p-4 clay-inset rounded-2xl text-sm">
              <p className="text-zinc-500 font-bold mb-0.5">Pasien</p>
              <p className="font-black text-zinc-900 dark:text-zinc-100">{selectedAnomaly?.nama}</p>
              <p className="font-mono text-zinc-500 text-xs mt-0.5 font-bold">{selectedAnomaly?.no_rm}</p>
            </div>

            <form onSubmit={handleResolve}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Pilih Status Baru</label>
                  <select
                    id="status"
                    value={resolveStatus}
                    onChange={(e) => setResolveStatus(e.target.value)}
                    className="w-full p-3 clay-inset rounded-2xl text-sm font-black text-zinc-800 dark:text-zinc-200 outline-none"
                  >
                    <option value="RESOLVED" className="bg-white dark:bg-zinc-900">Selesai (SEP Terbit / Beres)</option>
                    <option value="PENDING_DOCTOR" className="bg-white dark:bg-zinc-900">Menunggu Dokter (Rujukan / TTD)</option>
                    <option value="PENDING_SYSTEM" className="bg-white dark:bg-zinc-900">Sistem Error (V-Claim Maintenance)</option>
                    <option value="REJECTED" className="bg-white dark:bg-zinc-900">Ditolak / Batal BPJS</option>
                    <option value="IGNORED" className="bg-white dark:bg-zinc-900">Abaikan (Salah Catat / Umum)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="note" className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Catatan Resolusi</label>
                  <textarea 
                    id="note"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    required
                    placeholder="Contoh: SEP sudah dibuat, sistem SIMRS sempat error..."
                    className="w-full p-3 clay-inset rounded-2xl text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none resize-none h-24"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Dialog.Close type="button" className="px-4 py-2.5 text-sm font-black clay-button text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors active:scale-95">
                    Batal
                  </Dialog.Close>
                  <button 
                    type="submit" 
                    disabled={isResolving !== null || !resolveNote.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 clay-pill-blue text-white rounded-xl text-sm font-black transition-all disabled:opacity-50 active:scale-95 shadow-md"
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
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md clay-surface rounded-[36px] p-6 shadow-2xl z-[200] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {isAddModalOpen ? <Plus className="text-blue-500" /> : <Edit2 className="text-blue-500" />} 
                {isAddModalOpen ? 'Tambah Anomali Manual' : 'Edit Data Pasien'}
              </Dialog.Title>
              <Dialog.Close className="p-2 clay-button text-zinc-500 rounded-full transition-colors active:scale-95">
                <X size={18} />
              </Dialog.Close>
            </div>
            
            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit}>
              <div className="space-y-4">
                {isAddModalOpen && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Tanggal Rekap</label>
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                      className="w-full p-2.5 clay-inset rounded-2xl text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">No. Rekam Medis</label>
                  <input 
                    type="text" 
                    required
                    value={formData.no_rm}
                    onChange={e => setFormData(p => ({...p, no_rm: e.target.value}))}
                    className="w-full p-2.5 clay-inset rounded-2xl text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Nama Pasien</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nama}
                    onChange={e => setFormData(p => ({...p, nama: e.target.value}))}
                    className="w-full p-2.5 clay-inset rounded-2xl text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Jenis Asuransi</label>
                  <input 
                    type="text" 
                    required
                    value={formData.asuransi}
                    onChange={e => setFormData(p => ({...p, asuransi: e.target.value}))}
                    placeholder="Contoh: BPJS KESEHATAN"
                    className="w-full p-2.5 clay-inset rounded-2xl text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-3">
                  <Dialog.Close type="button" className="px-4 py-2.5 text-sm font-black clay-button text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors active:scale-95">
                    Batal
                  </Dialog.Close>
                  <button 
                    type="submit" 
                    disabled={isResolving !== null}
                    className="flex items-center gap-2 px-5 py-2.5 clay-pill-blue text-white rounded-xl text-sm font-black transition-all disabled:opacity-50 active:scale-95 shadow-md"
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
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm clay-surface rounded-[36px] p-6 shadow-2xl z-[200] animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto w-12 h-12 clay-pill-rose text-white rounded-2xl flex items-center justify-center mb-4">
              <ShieldAlert size={24} />
            </div>
            <Dialog.Title className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">
              Hapus Data Anomali?
            </Dialog.Title>
            <p className="text-xs font-bold text-zinc-500 mb-6">
              Data pasien <strong>{selectedAnomaly?.nama}</strong> ({selectedAnomaly?.no_rm}) akan dihapus secara permanen dari daftar anomali.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Dialog.Close type="button" className="px-4 py-2.5 text-sm font-black clay-button text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors flex-1 active:scale-95">
                Batal
              </Dialog.Close>
              <button 
                onClick={handleDelete}
                disabled={isResolving === 'delete'}
                className="flex items-center justify-center gap-2 px-4 py-2.5 clay-pill-rose text-white rounded-xl text-sm font-black transition-all disabled:opacity-50 flex-1 active:scale-95 shadow-md"
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
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg clay-surface rounded-[36px] p-6 shadow-2xl z-[200] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <History className="text-violet-500" /> Jejak Audit (Audit Trail)
              </Dialog.Title>
              <Dialog.Close className="p-2 clay-button text-zinc-500 rounded-full transition-colors active:scale-95">
                <X size={18} />
              </Dialog.Close>
            </div>
            
            <div className="mb-5 clay-inset p-4 rounded-2xl">
              <h4 className="font-black text-zinc-900 dark:text-zinc-100 text-sm mb-1">{selectedAnomaly?.nama}</h4>
              <p className="text-xs font-mono font-bold text-zinc-500 bg-white/40 dark:bg-black/40 inline-block px-2 py-0.5 rounded-lg">{selectedAnomaly?.no_rm}</p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-auto custom-scrollbar pr-2 relative">
               <div className="p-4 rounded-2xl clay-button">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                     <div className="font-black text-zinc-900 dark:text-zinc-100 text-xs">Sistem</div>
                     <time className="text-[10px] font-black text-amber-500">{selectedAnomaly?.date && format(parseISO(selectedAnomaly.date), 'dd MMM yyyy, HH:mm')}</time>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold">Dicatat sebagai Anomali (Missing SEP) saat unggah Excel.</div>
               </div>

               {selectedAnomaly?.audit_logs?.map((log, i) => (
                 <div key={i} className="p-4 rounded-2xl clay-button">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                       <div className="font-black text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                         {log.by}
                         <span className="text-[9px] font-black uppercase tracking-wider clay-pill-violet text-white px-2 py-0.5 rounded-md">{log.action}</span>
                       </div>
                       <time className="text-[10px] font-bold text-zinc-400">{format(new Date(log.timestamp), 'dd MMM, HH:mm')}</time>
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300 text-xs font-bold italic">"{log.note}"</div>
                 </div>
               ))}
               
               {(!selectedAnomaly?.audit_logs || selectedAnomaly.audit_logs.length === 0) && (
                 <div className="py-4 text-center text-xs text-zinc-400 w-full font-bold">Belum ada tindakan lanjut.</div>
               )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  </>
  );
}
