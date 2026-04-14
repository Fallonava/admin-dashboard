"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  MessageSquare, UploadCloud, Users, CheckCircle2, AlertCircle,
  Send, Trash2, Smartphone, Variable, Search, RefreshCw, PowerOff, QrCode, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from '@radix-ui/react-dialog';

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
  PENDING:    { label: "Menunggu", color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-400" },
  PROCESSING: { label: "Proses",   color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-400 animate-pulse" },
  SENT:       { label: "Terkirim", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-400" },
  FAILED:     { label: "Gagal",    color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200",   dot: "bg-rose-400" },
};

export default function BroadcastPage() {
  const [queues, setQueues]           = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery]   = useState("");
  const [isModalOpen, setIsModalOpen]   = useState(false);
  
  // WA Bot State
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
    } catch (e) { /* silent catch for polling */ }
    finally { setIsLoading(false); }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/broadcast/status');
      const data = await res.json();
      if(data.success && data.data) setBotState(data.data);
    } catch(e) { /* silent catch for polling */ }
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

    // --- LOGIKA HEADER ROBUST ---
    let headerRowNumber = 1;
    let colMap: Record<string, number> = {};

    // Cari baris header (mungkin bukan di baris 1 jika ada judul laporan diatasnya)
    for (let r = 1; r <= 10; r++) {
      const row = worksheet.getRow(r);
      const tempMap: Record<string, number> = {};
      let foundKeywords = 0;
      
      row.eachCell((cell: any, col: number) => {
        // Bersihkan header secara agresif (kecilkan, hapus spasi berlebih)
        const h = String(cell.value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (h) {
          tempMap[h] = col;
          // Cek kalau baris ini sepertinya baris header (ada kata kunci 'nama' atau 'hp' atau 'booking')
          if (h.includes('nama') || h.includes('hp') || h.includes('registrasi') || h.includes('rekam medis')) {
            foundKeywords++;
          }
        }
      });

      if (foundKeywords >= 2) {
        headerRowNumber = r;
        colMap = tempMap;
        console.log(`[FAKT-Bot] Header ditemukan di baris ${r}:`, Object.keys(colMap));
        break;
      }
    }

    const getCell = (row: any, keyword: string): string => {
      const q = keyword.toLowerCase().trim();
      // 1. Exact match
      let key = Object.keys(colMap).find(k => k === q);
      // 2. Includes match
      if (!key) key = Object.keys(colMap).find(k => k.includes(q));
      
      if (!key) return '';
      const val = row.getCell(colMap[key]).value;
      if (val === null || val === undefined) return '';
      if (typeof val === 'object' && 'text' in (val as any)) return String((val as any).text);
      return String(val);
    };

    const rows: any[] = [];
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber <= headerRowNumber) return; // Lewati header dan baris di atasnya
      
      const nama = getCell(row, 'nama rekam medis') || getCell(row, 'nama') || getCell(row, 'pasien');
      const dok  = getCell(row, 'dokter') || getCell(row, 'petugas');
      const poli = getCell(row, 'poliklinik') || getCell(row, 'poli');

      // Ambil dua potensi nomor HP
      const rawHp1 = getCell(row, 'no hp rekam medis');
      const rawHp2 = getCell(row, 'no hp');

      const normalizePhone = (num: string) => {
        if (!num) return null;
        // Hapus semua karakter non-digit (spasi, strip, dsb)
        let clean = num.replace(/[^0-9]/g, '');
        
        // Kasus 1: Mulai dengan '0' (0812...) -> Ubah ke 62812...
        if (clean.startsWith('0')) {
          clean = '62' + clean.substring(1);
        } 
        // Kasus 2: Mulai dengan '8' (812... - Kasus User) -> Ubah ke 62812...
        else if (clean.startsWith('8')) {
          clean = '62' + clean;
        }

        // Pastikan hasil akhirnya valid (minimal 10 digit dan mulai dengan 62)
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

    console.log(`[FAKT-Bot] Berhasil memproses ${rows.length} baris pesan.`);
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
    } catch (e) { console.error(e); alert("Error"); }
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
    <main className="p-6 sm:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">

      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500 rounded-[14px] text-white shadow-lg shadow-emerald-500/20">
              <MessageSquare size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">FAKT-Bot Broadcast</h1>
          </div>
          <p className="text-slate-500 font-medium max-w-xl text-sm">
            Pantau dan eksekusi pengiriman pesan WhatsApp massal otomatis secara real-time ke pasien.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Bot Status & QR Widget */}
          {botState.state === 'READY' || botState.state === 'CONNECTED' ? (
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200 shadow-sm mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-emerald-200" /> Bot WhatsApp Aktif
             </div>
          ) : botState.state === 'QR_READY' && botState.qr ? (
             <Dialog.Root>
                <Dialog.Trigger asChild>
                   <button className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] animate-bounce mr-2">
                      <QrCode size={16} /> WA Terputus (Scan QR!)
                   </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                   <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 animate-in fade-in" />
                   <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 p-8 w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95">
                     <Dialog.Title className="text-xl font-black text-slate-800 mb-2">Tautkan FAKT-Bot</Dialog.Title>
                     <p className="text-sm text-slate-500 mb-6">Buka WhatsApp HP &gt; Perangkat Tertaut &gt; Tautkan Perangkat. Scan baris kode ini!</p>
                     
                     <div className="bg-white p-4 border break-all border-slate-100 rounded-[20px] shadow-sm mb-6 flex items-center justify-center">
                        <QRCodeSVG value={botState.qr} size={220} />
                     </div>
                     <p className="text-[10px] text-slate-400 font-medium">QR disegarkan secara otomatis. Terakhir direfresh: {new Date(botState.timestamp).toLocaleTimeString()}</p>
                     
                     <Dialog.Close asChild className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                       <button className="p-2 bg-slate-50 hover:bg-red-50 rounded-full"><Trash2 size={16} /></button>
                     </Dialog.Close>
                   </Dialog.Content>
                </Dialog.Portal>
             </Dialog.Root>
          ) : (
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold border border-slate-200 mr-2">
                <Settings size={14} className="animate-spin-slow" /> Bot Sedang Booting...
             </div>
          )}

          {/* Action Buttons */}
          {(botState.state === 'READY' || botState.state === 'CONNECTED') && (
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-rose-50 text-rose-500 rounded-xl text-sm font-bold transition-all border border-slate-200">
              <PowerOff size={15} /> <span className="hidden sm:inline">Logout WA</span>
            </button>
          )}

          <button onClick={fetchQueues} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all border border-slate-200 shadow-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={clearQueue} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded-xl text-sm font-bold transition-all border border-slate-200 shadow-sm">
            <Trash2 size={15} /> <span className="hidden sm:inline">Bersihkan</span>
          </button>
          <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Dialog.Trigger asChild>
              <button disabled={botState.state !== 'READY' && botState.state !== 'CONNECTED'} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                <Send size={16} /><span>Masukan Antrean Massal</span>
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-[32px] shadow-2xl z-50 flex flex-col overflow-hidden max-h-[95vh] transition-all duration-500">
                <Dialog.Title className="sr-only">Buat Pesan Broadcast WhatsApp</Dialog.Title>

                {/* Top Section (Editor & Preview) */}
                <div className="flex flex-col md:flex-row min-h-[400px] flex-shrink-0">
                  {/* Left Panel */}
                  <div className="w-full md:w-5/12 bg-slate-50 p-6 md:p-8 border-r border-slate-100 flex flex-col gap-6 overflow-y-auto">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 mb-1">Upload Kontak</h2>
                      <p className="text-xs text-slate-500 mb-4">Pilih file Excel dengan kolom Nama, No HP, Dokter, Poli.</p>
                      <div className="relative group border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center text-center bg-white hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2 group-hover:text-emerald-500" />
                        <p className="text-sm font-bold text-slate-700">{fileName || "Pilih File Excel (.xlsx)"}</p>
                        <p className="text-xs text-slate-400 mt-1">{parsedRows.length > 0 ? `${parsedRows.length} baris valid` : 'Seret & lepas kesini'}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                      <h2 className="text-sm font-black text-slate-800 mb-2">Template Teks</h2>
                      <textarea
                        className="w-full flex-1 min-h-[150px] p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
                        value={template} onChange={e => setTemplate(e.target.value)}
                        placeholder="Ketik pesan Anda disini..."
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['Nama Pasien', 'Nama Dokter', 'Poli'].map(v => (
                          <button key={v} onClick={() => insertVariable(v)} className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 flex items-center gap-1 transition-colors">
                            <Variable size={10} /> {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Live Preview */}
                  <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col bg-white">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                      <Smartphone size={20} className="text-emerald-500" /> Live Preview
                    </h2>
                    <div className="flex-1 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center rounded-[24px] flex flex-col justify-end overflow-hidden border border-slate-100 shadow-inner relative min-h-[250px]">
                      <div className="absolute top-0 left-0 right-0 h-16 bg-[#075e54] flex items-center px-4 text-white shadow-md z-10 gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center shrink-0"><Users size={20} className="text-slate-500" /></div>
                        <div><p className="font-bold text-sm">Pasien Preview</p><p className="text-[10px] text-white/70">Online</p></div>
                      </div>
                      <div className="p-6 pt-20">
                        <div className="bg-white p-3 rounded-b-2xl rounded-tr-2xl rounded-tl-sm max-w-[90%] shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                          <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed font-sans">
                            {parsedRows.length > 0
                              ? template.replace(/{{Nama Pasien}}/gi, parsedRows[0].patientName).replace(/{{Nama Dokter}}/gi, parsedRows[0].doctorName || '___').replace(/{{Poli}}/gi, parsedRows[0].clinicName || '___')
                              : template.replace(/{{(.*?)}}/g, '[$1]')}
                          </p>
                          <div className="text-[9px] text-slate-400 mt-2 text-right">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons moved here for compact layout if no grid, but better to keep them fixed at bottom */}
                    {!parsedRows.length && (
                      <div className="mt-6 flex justify-end gap-3 shrink-0">
                        <Dialog.Close asChild>
                          <button className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">Batal</button>
                        </Dialog.Close>
                        <button disabled className="px-6 py-2.5 bg-slate-200 text-slate-400 rounded-xl text-sm font-bold flex items-center gap-2">
                           <UploadCloud size={16}/> Upload Dulu
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section - Data Review Grid */}
                {parsedRows.length > 0 && (
                   <div className="flex-1 bg-white border-t border-slate-100 flex flex-col p-6 animate-in slide-in-from-bottom-8 overflow-hidden min-h-[300px]">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" size={18}/> 
                            Pre-Flight Check: {parsedRows.length} Kontak Terditeksi Valid
                         </h3>
                         <div className="flex gap-3">
                            <Dialog.Close asChild>
                              <button className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">Batal</button>
                            </Dialog.Close>
                            <button onClick={handleBroadcast} disabled={isUploading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]">
                              {isUploading ? "Memproses..." : `Kirim ke ${parsedRows.length} Pasien`}
                            </button>
                         </div>
                      </div>
                      
                      <div className="flex-1 border border-slate-200 rounded-2xl overflow-y-auto custom-scrollbar shadow-sm bg-slate-50">
                         <table className="w-full text-left text-xs">
                             <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                                 <tr>
                                     <th className="px-5 py-3 w-12 text-center text-slate-300">#</th>
                                     <th className="px-5 py-3">No WhatsApp</th>
                                     <th className="px-5 py-3">Nama Pasien</th>
                                     <th className="px-5 py-3">Dokter / Poli</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                 {parsedRows.slice(0, 50).map((row, idx) => (
                                     <tr key={idx} className="hover:bg-white transition-colors">
                                         <td className="px-5 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                         <td className="px-5 py-3 font-mono text-emerald-600 font-bold border-l-4 border-transparent hover:border-emerald-400 transition-colors">{row.whatsappNumber}</td>
                                         <td className="px-5 py-3 text-slate-700 font-bold">{row.patientName}</td>
                                         <td className="px-5 py-3 text-slate-500">{row.doctorName || <span className="opacity-30">—</span>} <span className="text-slate-300 mx-1">/</span> {row.clinicName || <span className="opacity-30">—</span>}</td>
                                     </tr>
                                 ))}
                                 {parsedRows.length > 50 && (
                                     <tr>
                                         <td colSpan={4} className="px-5 py-6 text-center text-slate-500 font-medium bg-slate-100 border-t border-dashed border-slate-300">
                                             ...dan {parsedRows.length - 50} baris kontak lainnya. Data siap dieksekusi.
                                         </td>
                                     </tr>
                                 )}
                             </tbody>
                         </table>
                      </div>
                   </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </section>

      {/* ─── METRICS ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Success Rate progress card */}
        <div className="col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20 text-white flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-100 mb-1">Tingkat Keberhasilan</p>
              <p className="text-4xl font-black">{successRate}<span className="text-2xl">%</span></p>
            </div>
            <div className="bg-white/20 p-2 rounded-xl"><CheckCircle2 size={20} /></div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="h-2 bg-white rounded-full transition-all duration-1000" style={{ width: `${successRate}%` }} />
          </div>
          <p className="text-[11px] text-emerald-100">{sentCount} dari {totalCount} pesan berhasil terkirim</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" /> Menunggu
          </p>
          <p className="text-3xl font-black text-slate-800">{pendingCount + processingCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-400/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle size={10} /> Gagal
          </p>
          <p className="text-3xl font-black text-rose-600">{failedCount}</p>
        </div>
      </section>

      {/* ─── QUEUE LOG PANEL ─────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 440px)', minHeight: '400px' }}>

        {/* Sticky header + filter tabs */}
        <div className="shrink-0 px-6 pt-5 pb-0 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <h3 className="font-black text-slate-800 text-base">Riwayat &amp; Log Bot WA</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari pasien / nomor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 w-60 bg-slate-50 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-[11px] font-black transition-all border-b-2",
                  filterStatus === tab.key
                    ? "text-emerald-700 border-emerald-500 bg-emerald-50/60"
                    : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                {tab.label}
                <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-black", filterStatus === tab.key ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky column header */}
        <div className="shrink-0 bg-slate-50/80 border-b border-slate-100">
          <div className="grid grid-cols-[130px_1fr_150px_1fr_110px] gap-x-4 px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
            <span>Status</span><span>Pasien</span><span>Kontak WA</span><span>Pesan (Cuplikan)</span><span className="text-right">Waktu</span>
          </div>
        </div>

        {/* Scrollable data rows */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Memuat data log...</p>
            </div>
          ) : filteredQueues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageSquare size={32} className="opacity-30" />
              <p className="text-sm font-medium">{searchQuery || filterStatus !== "ALL" ? "Tidak ada hasil yang cocok" : "Belum ada history pesan"}</p>
              {!searchQuery && filterStatus === "ALL" && <p className="text-xs">Klik &ldquo;Buat Pesan Baru&rdquo; untuk memulai</p>}
            </div>
          ) : (
            <div className="divide-y divide-slate-50/80">
              {filteredQueues.map(q => {
                const cfg = STATUS_CONFIG[q.status];
                return (
                  <div key={q.id} className="grid grid-cols-[130px_1fr_150px_1fr_110px] gap-x-4 px-6 py-3.5 items-center hover:bg-slate-50/60 transition-colors">
                    <div>
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border", cfg.color, cfg.bg, cfg.border)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{q.patientName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{q.clinicName || "—"}</p>
                    </div>
                    <p className="font-mono text-xs text-slate-600 truncate">{q.whatsappNumber}</p>
                    <p className="text-xs text-slate-500 truncate" title={q.messageText}>{q.messageText}</p>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">{new Date(q.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[10px] text-slate-400">{new Date(q.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        {filteredQueues.length > 0 && (
          <div className="shrink-0 px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Menampilkan <span className="font-black text-slate-600">{filteredQueues.length}</span> dari <span className="font-black text-slate-600">{totalCount}</span> entri
            </p>
            <p className="text-[10px] text-slate-400">Auto-refresh setiap 5 detik</p>
          </div>
        )}
      </section>
    </main>
  );
}
