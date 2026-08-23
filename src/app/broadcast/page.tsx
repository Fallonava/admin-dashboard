"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  MessageSquare, UploadCloud, Users, CheckCircle2, AlertCircle,
  Send, Trash2, Smartphone, Variable, Search, RefreshCw, PowerOff, QrCode, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from '@radix-ui/react-dialog';
import { PageHeader } from "@/components/ui/PageHeader";

interface QueueItem {
  id: string;
  patientName: string;
  whatsappNumber: string;
  doctorName?: string;
  clinicName?: string;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  messageText: string;
  log?: string;
  createdAt: string;
}

type FilterStatus = "ALL" | "PENDING" | "PROCESSING" | "SENT" | "FAILED";

const STATUS_CONFIG = {
  PENDING:    { label: "Menunggu", pill: "clay-pill-amber text-white" },
  PROCESSING: { label: "Proses",   pill: "clay-pill-blue text-white" },
  SENT:       { label: "Terkirim", pill: "clay-pill-emerald text-white" },
  FAILED:     { label: "Gagal",    pill: "clay-pill-rose text-white" },
};

export default function BroadcastPage() {
  const [queues, setQueues]           = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery]   = useState("");
  const [isModalOpen, setIsModalOpen]   = useState(false);
  
  const [botState, setBotState] = useState<{state: string, qr: string|null, timestamp: number}>({ state: "DISCONNECTED", qr: null, timestamp: 0 });

  const [template, setTemplate] = useState(
    "Halo {{Nama Pasien}},\n\nIni adalah pengingat jadwal kunjungan Anda dengan dokter {{Nama Dokter}} di {{Poli}}.\n\nMohon hadir tepat waktu."
  );
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName]     = useState("");

  const fetchQueues = async () => {
    try {
      const res = await fetch('/api/broadcast?limit=500');
      const data = await res.json();
      if (data.success) setQueues(data.data);
    } catch (e) { }
    finally { setIsLoading(false); }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/broadcast/status');
      const data = await res.json();
      if(data.success && data.data) setBotState(data.data);
    } catch(e) { }
  };

  useEffect(() => {
    fetchQueues();
    fetchStatus();
    const interval = setInterval(() => { fetchQueues(); fetchStatus(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if(!confirm("Yakin ingin mencabut akses WhatsApp saat ini? Bot akan diminta scan QR ulang.")) return;
    await fetch('/api/broadcast/status', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "LOGOUT" }) });
    setBotState({ state: "DISCONNECTED", qr: null, timestamp: 0 });
    alert("Perintah logout dikirim! Bot sedang restart...");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const ExcelJSModule = await import('exceljs');
    const ExcelJSClass = (ExcelJSModule.default ?? ExcelJSModule) as any;
    const workbook = new ExcelJSClass.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return;

    let headerRowNumber = 1;
    let colMap: Record<string, number> = {};

    for (let r = 1; r <= 10; r++) {
      const row = worksheet.getRow(r);
      const tempMap: Record<string, number> = {};
      let foundKeywords = 0;
      
      row.eachCell((cell: any, col: number) => {
        const h = String(cell.value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (h) {
          tempMap[h] = col;
          if (h.includes('nama') || h.includes('hp') || h.includes('registrasi') || h.includes('rekam medis')) {
            foundKeywords++;
          }
        }
      });

      if (foundKeywords >= 2) {
        headerRowNumber = r;
        colMap = tempMap;
        break;
      }
    }

    const getCell = (row: any, keyword: string): string => {
      const q = keyword.toLowerCase().trim();
      let key = Object.keys(colMap).find(k => k === q);
      if (!key) key = Object.keys(colMap).find(k => k.includes(q));
      
      if (!key) return '';
      const val = row.getCell(colMap[key]).value;
      if (val === null || val === undefined) return '';
      if (typeof val === 'object' && 'text' in (val as any)) return String((val as any).text);
      return String(val);
    };

    const rows: any[] = [];
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber <= headerRowNumber) return;
      
      const nama = getCell(row, 'nama rekam medis') || getCell(row, 'nama') || getCell(row, 'pasien');
      const dok  = getCell(row, 'dokter') || getCell(row, 'petugas');
      const poli = getCell(row, 'poliklinik') || getCell(row, 'poli');

      const rawHp1 = getCell(row, 'no hp rekam medis');
      const rawHp2 = getCell(row, 'no hp');

      const normalizePhone = (num: string) => {
        if (!num) return null;
        let clean = num.replace(/[^0-9]/g, '');
        if (clean.startsWith('0')) {
          clean = '62' + clean.substring(1);
        } else if (clean.startsWith('8')) {
          clean = '62' + clean;
        }
        if (clean.length >= 10 && clean.startsWith('62')) {
          return clean;
        }
        return null;
      };

      const validHp1 = normalizePhone(rawHp1);
      const validHp2 = normalizePhone(rawHp2);

      const uniqueNumbers = new Set<string>();
      if (validHp1) uniqueNumbers.add(validHp1);
      if (validHp2) uniqueNumbers.add(validHp2);

      uniqueNumbers.forEach((hp) => {
        if (nama && hp) {
          rows.push({ whatsappNumber: hp, patientName: nama, doctorName: dok, clinicName: poli });
        }
      });
    });

    setParsedRows(rows);
  };

  const handleBroadcast = async () => {
    if (!parsedRows.length) return;
    setIsUploading(true);
    const messages = parsedRows.map(r => ({
      patientName: r.patientName, whatsappNumber: r.whatsappNumber,
      doctorName: r.doctorName, clinicName: r.clinicName,
      messageText: template
        .replace(/{{Nama Pasien}}/gi, r.patientName || '')
        .replace(/{{Nama Dokter}}/gi, r.doctorName || '')
        .replace(/{{Poli}}/gi, r.clinicName || ''),
      status: "PENDING"
    }));
    try {
      const res = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
      const data = await res.json();
      if (data.success) { setParsedRows([]); setIsModalOpen(false); fetchQueues(); }
      else alert("Gagal: " + data.error);
    } catch (e) { alert("Error"); }
    finally { setIsUploading(false); }
  };

  const insertVariable = (v: string) => setTemplate(prev => prev + ` {{${v}}}`);

  const clearQueue = async () => {
    if (!confirm("Yakin ingin menghapus seluruh log? PENDING akan ikut terhapus.")) return;
    await fetch('/api/broadcast?type=all', { method: 'DELETE' });
    fetchQueues();
  };

  const pendingCount    = queues.filter(q => q.status === "PENDING").length;
  const processingCount = queues.filter(q => q.status === "PROCESSING").length;
  const sentCount       = queues.filter(q => q.status === "SENT").length;
  const failedCount     = queues.filter(q => q.status === "FAILED").length;
  const totalCount      = queues.length;
  const successRate     = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  const filteredQueues = queues.filter(q => {
    const matchStatus = filterStatus === "ALL" || q.status === filterStatus;
    const sl = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      q.patientName.toLowerCase().includes(sl) ||
      q.whatsappNumber.includes(searchQuery) ||
      (q.clinicName || '').toLowerCase().includes(sl);
    return matchStatus && matchSearch;
  });

  const FILTER_TABS: { key: FilterStatus; label: string; count: number }[] = [
    { key: "ALL",     label: "Semua",    count: totalCount },
    { key: "PENDING", label: "Menunggu", count: pendingCount + processingCount },
    { key: "SENT",    label: "Terkirim", count: sentCount },
    { key: "FAILED",  label: "Gagal",    count: failedCount },
  ];

  return (
    <div className="p-2 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-32 lg:pb-8 text-zinc-900 dark:text-zinc-100">

      {/* ─── UNIFIED PAGE HEADER ─── */}
      <PageHeader
        icon={<MessageSquare size={22} className="text-white" strokeWidth={2.5} />}
        title="FAKT-Bot Broadcast"
        accentWord="Broadcast"
        accentColor="text-emerald-600 dark:text-emerald-400"
        subtitle="Pantau dan eksekusi pengiriman pesan WhatsApp massal otomatis secara real-time"
        iconClay="clay-icon-emerald"
        accentBarGradient="from-emerald-500 via-teal-500 to-cyan-400"
        badge={
          botState.state === 'READY' || botState.state === 'CONNECTED' ? (
            <span className="flex items-center gap-2 px-3.5 py-1 clay-pill-emerald text-white rounded-full text-[10.5px] font-black shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Bot WA Aktif
            </span>
          ) : botState.state === 'QR_READY' && botState.qr ? (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1 clay-pill-amber text-white rounded-full text-[10.5px] font-black shadow-md animate-bounce">
                  <QrCode size={13} /> Scan QR WA
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] animate-in fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 clay-surface rounded-[36px] shadow-2xl z-[200] p-8 w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95">
                  <Dialog.Title className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Tautkan FAKT-Bot</Dialog.Title>
                  <p className="text-xs text-zinc-500 font-bold mb-6">Buka WhatsApp HP &gt; Perangkat Tertaut &gt; Tautkan Perangkat. Scan kode ini:</p>
                  
                  <div className="bg-white p-4 rounded-[24px] clay-inset shadow-inner mb-5 flex items-center justify-center">
                    <QRCodeSVG value={botState.qr} size={200} />
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold">QR disegarkan secara otomatis: {new Date(botState.timestamp).toLocaleTimeString()}</p>
                  
                  <Dialog.Close asChild className="absolute top-5 right-5 text-zinc-400 hover:text-rose-500 transition-colors">
                    <button className="p-2 clay-button rounded-full active:scale-95"><Trash2 size={16} /></button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 clay-button text-zinc-500 rounded-full text-[10.5px] font-black">
              <Settings size={12} className="animate-spin" /> Booting...
            </span>
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {(botState.state === 'READY' || botState.state === 'CONNECTED') && (
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3.5 py-2 clay-button text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-black transition-all active:scale-95">
                <PowerOff size={14} /> <span className="hidden sm:inline">Logout WA</span>
              </button>
            )}
            <button onClick={fetchQueues} className="flex items-center gap-1.5 px-3.5 py-2 clay-button text-zinc-700 dark:text-zinc-300 rounded-2xl text-xs font-black transition-all active:scale-95">
              <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={clearQueue} className="flex items-center gap-1.5 px-3.5 py-2 clay-button text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-black transition-all active:scale-95">
              <Trash2 size={14} /> <span className="hidden sm:inline">Bersihkan</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={botState.state !== 'READY' && botState.state !== 'CONNECTED'}
              className="flex items-center gap-2 px-4 py-2 clay-pill-emerald text-white rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send size={14} strokeWidth={2.5} /><span>Antrean Massal</span>
            </button>
          </div>
        }
      />
          
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl clay-surface rounded-[36px] shadow-2xl z-[200] flex flex-col overflow-hidden max-h-[92vh] transition-all">
                <Dialog.Title className="sr-only">Buat Pesan Broadcast WhatsApp</Dialog.Title>

                {/* Top Section (Editor & Preview) */}
                <div className="flex flex-col md:flex-row min-h-[380px] flex-shrink-0">
                  {/* Left Panel */}
                  <div className="w-full md:w-5/12 p-6 md:p-8 border-r border-zinc-200/60 dark:border-white/5 flex flex-col gap-5 overflow-y-auto">
                    <div>
                      <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-1">Upload Kontak</h2>
                      <p className="text-xs text-zinc-500 font-bold mb-3">Pilih file Excel dengan kolom Nama, No HP, Dokter, Poli.</p>
                      <div className="relative group clay-inset rounded-2xl p-5 flex flex-col items-center text-center cursor-pointer">
                        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <UploadCloud className="w-8 h-8 text-zinc-400 mb-2 group-hover:text-emerald-500 transition-colors" />
                        <p className="text-xs font-black text-zinc-700 dark:text-zinc-200">{fileName || "Pilih File Excel (.xlsx)"}</p>
                        <p className="text-[11px] text-zinc-400 mt-1 font-bold">{parsedRows.length > 0 ? `${parsedRows.length} baris valid` : 'Seret & lepas kesini'}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                      <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">Template Teks</h2>
                      <textarea
                        className="w-full flex-1 min-h-[130px] p-3.5 rounded-2xl clay-inset text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none resize-none"
                        value={template} onChange={e => setTemplate(e.target.value)}
                        placeholder="Ketik pesan Anda disini..."
                      />
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {['Nama Pasien', 'Nama Dokter', 'Poli'].map(v => (
                          <button key={v} onClick={() => insertVariable(v)} className="text-[10px] font-black clay-button text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95">
                            <Variable size={10} /> {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Live Preview */}
                  <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col">
                    <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                      <Smartphone size={18} className="text-emerald-500" /> Live Preview
                    </h2>
                    <div className="flex-1 bg-slate-900 rounded-[28px] flex flex-col justify-end overflow-hidden shadow-inner relative min-h-[240px] clay-inset p-4">
                      <div className="absolute top-0 left-0 right-0 h-12 bg-emerald-700 flex items-center px-4 text-white shadow-md z-10 gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Users size={16} className="text-white" /></div>
                        <div><p className="font-black text-xs">Pasien Preview</p><p className="text-[9px] text-white/80 font-bold">Online</p></div>
                      </div>
                      <div className="p-2 pt-14">
                        <div className="bg-emerald-950/80 border border-emerald-500/30 p-3.5 rounded-2xl rounded-tl-sm max-w-[90%] shadow-md">
                          <p className="text-xs text-white whitespace-pre-wrap break-words leading-relaxed font-sans font-bold">
                            {parsedRows.length > 0
                              ? template.replace(/{{Nama Pasien}}/gi, parsedRows[0].patientName).replace(/{{Nama Dokter}}/gi, parsedRows[0].doctorName || '___').replace(/{{Poli}}/gi, parsedRows[0].clinicName || '___')
                              : template.replace(/{{(.*?)}}/g, '[$1]')}
                          </p>
                          <div className="text-[9px] text-emerald-300/60 mt-1.5 text-right font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                    
                    {!parsedRows.length && (
                      <div className="mt-5 flex justify-end gap-2.5 shrink-0">
                        <Dialog.Close asChild>
                          <button className="px-4 py-2 clay-button text-zinc-600 dark:text-zinc-300 rounded-xl font-black text-xs active:scale-95">Batal</button>
                        </Dialog.Close>
                        <button disabled className="px-5 py-2 clay-button opacity-50 rounded-xl text-xs font-black flex items-center gap-2">
                           <UploadCloud size={14}/> Upload Dulu
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section - Data Review Grid */}
                {parsedRows.length > 0 && (
                   <div className="flex-1 border-t border-zinc-200/60 dark:border-white/5 flex flex-col p-6 overflow-hidden min-h-[280px]">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" size={16}/> 
                            Pre-Flight: {parsedRows.length} Kontak Valid
                         </h3>
                         <div className="flex gap-2.5">
                            <Dialog.Close asChild>
                              <button className="px-4 py-2 clay-button text-zinc-600 dark:text-zinc-300 rounded-xl font-black text-xs active:scale-95">Batal</button>
                            </Dialog.Close>
                            <button onClick={handleBroadcast} disabled={isUploading} className="flex items-center gap-2 px-5 py-2 clay-pill-emerald text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95">
                              {isUploading ? "Memproses..." : `Kirim ke ${parsedRows.length} Pasien`}
                            </button>
                         </div>
                      </div>
                      
                      <div className="flex-1 clay-inset rounded-2xl overflow-y-auto custom-scrollbar p-1">
                         <table className="w-full text-left text-xs">
                             <thead className="text-zinc-500 font-black uppercase tracking-wider sticky top-0 z-10 border-b border-zinc-200/60 dark:border-white/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
                                 <tr>
                                     <th className="px-4 py-2.5 w-12 text-center text-zinc-400">#</th>
                                     <th className="px-4 py-2.5">No WhatsApp</th>
                                     <th className="px-4 py-2.5">Nama Pasien</th>
                                     <th className="px-4 py-2.5">Dokter / Poli</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5">
                                 {parsedRows.slice(0, 50).map((row, idx) => (
                                     <tr key={idx} className="hover:bg-zinc-500/5 transition-colors">
                                         <td className="px-4 py-2.5 text-center text-zinc-400 font-mono">{idx + 1}</td>
                                         <td className="px-4 py-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-black">{row.whatsappNumber}</td>
                                         <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100 font-black">{row.patientName}</td>
                                         <td className="px-4 py-2.5 text-zinc-500 font-bold">{row.doctorName || "—"} / {row.clinicName || "—"}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                      </div>
                   </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

      {/* ─── METRICS ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 clay-pill-emerald p-5 sm:p-6 rounded-[28px] text-white flex flex-col gap-3 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10.5px] font-black uppercase tracking-[0.15em] text-emerald-100 mb-1">Tingkat Keberhasilan</p>
              <p className="text-4xl font-black">{successRate}<span className="text-2xl">%</span></p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-[16px]"><CheckCircle2 size={22} /></div>
          </div>
          <div className="w-full bg-black/15 rounded-full h-2.5 p-0.5">
            <div className="h-full bg-white rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${successRate}%` }} />
          </div>
          <p className="text-[11px] font-black text-emerald-100">{sentCount} dari {totalCount} pesan berhasil terkirim</p>
        </div>

        <div className="clay-surface p-5 sm:p-6 rounded-[28px] flex flex-col justify-between shadow-md">
          <p className="text-[10.5px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" /> Menunggu
          </p>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-2">{pendingCount + processingCount}</p>
        </div>

        <div className="clay-surface p-5 sm:p-6 rounded-[28px] flex flex-col justify-between shadow-md">
          <p className="text-[10.5px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle size={14} /> Gagal
          </p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">{failedCount}</p>
        </div>
      </section>

      {/* ─── QUEUE LOG PANEL ─────────────────────────────────────────── */}
      <section className="clay-surface rounded-[32px] flex flex-col overflow-hidden shadow-2xl" style={{ height: 'calc(100vh - 440px)', minHeight: '400px' }}>

        {/* Sticky header + filter tabs */}
        <div className="shrink-0 px-6 pt-5 pb-0 border-b border-zinc-200/60 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-base">Riwayat &amp; Log Bot WA</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari pasien / nomor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs font-bold rounded-2xl clay-inset w-60 text-zinc-800 dark:text-zinc-200 outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>
          <div className="flex gap-1.5">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-t-2xl text-[11px] font-black transition-all",
                  filterStatus === tab.key
                    ? "clay-pill-emerald text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {tab.label}
                <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black", filterStatus === tab.key ? "bg-white/20 text-white" : "clay-inset text-zinc-500")}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky column header */}
        <div className="shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-white/5">
          <div className="grid grid-cols-[130px_1fr_150px_1fr_110px] gap-x-4 px-6 py-3 text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em]">
            <span>Status</span><span>Pasien</span><span>Kontak WA</span><span>Pesan (Cuplikan)</span><span className="text-right">Waktu</span>
          </div>
        </div>

        {/* Scrollable data rows */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold">Memuat data log...</p>
            </div>
          ) : filteredQueues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2">
              <MessageSquare size={32} className="opacity-30" />
              <p className="text-sm font-bold">{searchQuery || filterStatus !== "ALL" ? "Tidak ada hasil yang cocok" : "Belum ada history pesan"}</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200/40 dark:divide-white/5">
              {filteredQueues.map(q => {
                const cfg = STATUS_CONFIG[q.status];
                return (
                  <div key={q.id} className="grid grid-cols-[130px_1fr_150px_1fr_110px] gap-x-4 px-6 py-3.5 items-center hover:bg-zinc-500/5 transition-colors">
                    <div>
                      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black shadow-sm", cfg.pill)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-zinc-900 dark:text-zinc-100 text-sm truncate">{q.patientName}</p>
                      <p className="text-[10px] text-zinc-400 truncate font-bold">{q.clinicName || "—"}</p>
                    </div>
                    <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300 font-bold truncate">{q.whatsappNumber}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate" title={q.messageText}>{q.messageText}</p>
                    <div className="text-right">
                      <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">{new Date(q.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[10px] text-zinc-400 font-bold">{new Date(q.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        {filteredQueues.length > 0 && (
          <div className="shrink-0 px-6 py-3 border-t border-zinc-200/60 dark:border-white/5 flex items-center justify-between">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">
              Menampilkan <span className="font-black text-zinc-900 dark:text-zinc-100">{filteredQueues.length}</span> dari <span className="font-black text-zinc-900 dark:text-zinc-100">{totalCount}</span> entri
            </p>
            <p className="text-[10px] text-zinc-400 font-bold">Auto-refresh setiap 5 detik</p>
          </div>
        )}
      </section>
    </div>
  );
}
