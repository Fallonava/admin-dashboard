"use client";

import React, { useState, useCallback, useMemo } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, Loader2, Search, AlertCircle, Users, X, Save, Trophy } from "lucide-react";
import type ExcelJSType from "exceljs";
import { cn } from "@/lib/utils";
import * as Dialog from '@radix-ui/react-dialog';

// Interface for parsed row data
interface RowData {
  id: string;
  original: any;
  nomorSep?: string;
  namaPasien?: string;
  nomorRm?: string;
  poli?: string;
  jenisPasien?: string;
  petugas?: string;
  status: 'valid' | 'anomaly' | 'unknown';
  visitCount?: number;
  poliList?: string[];
  anomalyReason?: 'rawat_bersama' | 'terapi_gabung' | null;
}

export default function DailyRecapUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [fileData, setFileData] = useState<{ name: string; rows: number } | null>(null);
  
  // Data state
  const [parsedData, setParsedData] = useState<RowData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("Format file tidak didukung. Harap unggah file Excel (.xlsx atau .xls).");
      return;
    }

    setIsLoading(true);
    setProgressMsg("Membaca file Excel...");
    setFileData(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setProgressMsg("Mengekstrak baris data...");
        const buffer = e.target?.result as ArrayBuffer;

        // Dynamic import agar bundle awal tetap kecil
        const ExcelJSModule = await import('exceljs');
        const ExcelJSClass = (ExcelJSModule.default ?? ExcelJSModule) as any;
        const workbook = new ExcelJSClass.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error("Sheet tidak ditemukan dalam file.");

        // Bangun peta kolom dari baris header (baris 1)
        const colMap: Record<string, number> = {};
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell: ExcelJSType.Cell, colNumber: number) => {
          const header = String(cell.value ?? '').trim();
          if (header) colMap[header] = colNumber;
        });

        setProgressMsg("Menganalisis anomali SEP & Data Petugas...");

        const getCellText = (row: ExcelJSType.Row, header: string): string => {
          const colNum = colMap[header];
          if (!colNum) return '';
          const val = row.getCell(colNum).value;
          if (val === null || val === undefined) return '';
          if (typeof val === 'object' && val !== null && 'text' in (val as any)) return String((val as any).text);
          return String(val);
        };

        // Smart Poli header detection — coba beberapa kemungkinan nama kolom
        const poliHeaderCandidates = ['Poli', 'Nama Poli', 'Unit Pelayanan', 'Poli Klinik', 'Klinik'];
        const poliHeader = poliHeaderCandidates.find(h => colMap[h]) || '';

        const processed: RowData[] = [];
        worksheet.eachRow((row: ExcelJSType.Row, rowNumber: number) => {
          if (rowNumber === 1) return; // lewati baris header

          const namaPasien  = getCellText(row, 'Nama Rekam Medis');
          const nomorRm     = getCellText(row, 'No. Rekam Medis');
          const nomorSep    = getCellText(row, 'No SEP');
          const jenisPasien = getCellText(row, 'Asuransi');
          const petugas     = getCellText(row, 'Nama Petugas');
          const poli        = poliHeader ? getCellText(row, poliHeader) : '';

          // Hanya BPJS / JKN standar, abaikan BPJS Ketenagakerjaan
          const asuransiStr = jenisPasien.toLowerCase();
          const isBpjs = (asuransiStr.includes('bpjs') || asuransiStr.includes('jkn')) && !asuransiStr.includes('ketenagakerjaan');
          const isMissingSep = !nomorSep || nomorSep.trim() === '' || nomorSep.trim() === '-';

          let status: 'valid' | 'anomaly' | 'unknown' = 'unknown';
          if (isBpjs) {
            status = isMissingSep ? 'anomaly' : 'valid';
          } else {
            status = 'valid';
          }

          processed.push({
            id: `row-${rowNumber}`,
            original: {},
            nomorSep: nomorSep || '-',
            namaPasien: namaPasien || 'TIDAK DIKETAHUI',
            nomorRm: nomorRm || '-',
            poli: poli || '-',
            jenisPasien: jenisPasien || 'UMUM',
            petugas: petugas || 'Sistem',
            status,
            visitCount: 1,
            poliList: poli ? [poli] : [],
            anomalyReason: null,
          });
        });

        // Phase 7: Smart Deduplication (Group by RM) + Deteksi Rawat Bersama & Terapi Gabung
        const deduplicatedMap = new Map<string, RowData>();

        processed.forEach(row => {
           if (!row.nomorRm || row.nomorRm === '-') {
              deduplicatedMap.set(row.id, row);
              return;
           }

           const existing = deduplicatedMap.get(row.nomorRm);
           if (existing) {
              existing.visitCount = (existing.visitCount || 1) + 1;

              // Kumpulkan semua poli yang dikunjungi
              if (!existing.poliList) existing.poliList = existing.poli && existing.poli !== '-' ? [existing.poli] : [];
              if (row.poli && row.poli !== '-' && !existing.poliList.includes(row.poli)) {
                existing.poliList.push(row.poli);
              }

              // Jika salah satu row punya SEP, pasien valid
              if (existing.status === 'anomaly' && row.status === 'valid') {
                 existing.status = 'valid';
                 existing.nomorSep = row.nomorSep;
              }

              // --- Deteksi Pola Khusus ---
              const poliLower = (existing.poliList || []).map(p => p.toLowerCase());

              // Kondisi 2: Terapi Gabung — Rehab Medik + Fisioterapi/Terapi Wicara
              const hasRehab = poliLower.some(p => p.includes('rehab'));
              const hasFisio = poliLower.some(p => 
                p.includes('fisioterapi') || p.includes('terapi wicara') || p.includes('fisio')
              );
              if (hasRehab && hasFisio) {
                existing.anomalyReason = 'terapi_gabung';
              }
              // Kondisi 1: Rawat Bersama — 2+ poli berbeda (bukan terapi gabung)
              else if (poliLower.length >= 2) {
                existing.anomalyReason = 'rawat_bersama';
              }

              deduplicatedMap.set(row.nomorRm, existing);
           } else {
              deduplicatedMap.set(row.nomorRm, { ...row });
           }
        });

        const finalProcessed = Array.from(deduplicatedMap.values());

        setTimeout(() => {
          setParsedData(finalProcessed);
          setFileData({ name: file.name, rows: finalProcessed.length });
          setIsLoading(false);
        }, 800);

      } catch (error) {
        console.error("Gagal mengurai file Excel:", error);
        alert("Terjadi kesalahan saat menguraikan data file Excel.");
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      alert("Gagal membaca file.");
    };

    reader.readAsArrayBuffer(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSaveToDatabase = async () => {
     setIsSaving(true);
     
     try {
       // Prepare payload
       const today = new Date();
       today.setHours(0,0,0,0);

       const missingSepData = parsedData.filter(d => d.status === 'anomaly');
       
       const staffCounts: Record<string, number> = {};
       parsedData.forEach(row => {
          if (row.petugas && row.petugas !== 'Sistem') {
            staffCounts[row.petugas] = (staffCounts[row.petugas] || 0) + 1;
          }
       });
       const staffPerformance = Object.entries(staffCounts)
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total);

       const payload = {
          date: today.toISOString(),
          total_patients: parsedData.length,
          missing_sep_count: missingSepData.length,
          staff_performance: staffPerformance,
          missing_sep_details: missingSepData.map(d => ({
            no_rm: d.nomorRm || '-',
            nama: d.namaPasien || 'Unknown',
            asuransi: d.jenisPasien || '-',
            poli: (d.poliList || []).join(', ') || '-',
            anomaly_reason: d.anomalyReason || null,
          }))
       };

       const response = await fetch('/api/recaps', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       });

       const result = await response.json();
       
       if (result.success) {
         if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('refresh-history'));
         }
         // Close modal on success
         setIsOpen(false);
         // Reset state after a short delay for animation
         setTimeout(() => resetData(), 300);
       } else {
         throw new Error(result.error || 'Failed to save');
       }
     } catch (err: any) {
       console.error(err);
       alert("Gagal menyimpan data: " + err.message);
     } finally {
       setIsSaving(false);
     }
  };

  // Metrics
  const validCount = parsedData.filter(d => d.status === 'valid').length;
  const anomalyCount = parsedData.filter(d => d.status === 'anomaly').length;
  
  // Ratio BPJS vs Umum
  const bpjsCount = parsedData.filter(d => {
    const asuransiStr = d.jenisPasien?.toLowerCase() || '';
    return (asuransiStr.includes('bpjs') || asuransiStr.includes('jkn')) && !asuransiStr.includes('ketenagakerjaan');
  }).length;
  const umumCount = parsedData.length - bpjsCount;

  // Leaderboard Calculation
  const leaderboard = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedData.forEach(row => {
      const user = row.petugas || 'Sistem';
      counts[user] = (counts[user] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort desc
      .slice(0, 5); // Top 5
  }, [parsedData]);
  
  // Only show missing SEP list in the table? "A clean borderless table of missingSEPList" from Phase 3, 
  // but showing all data with search is also fine. Let's make it match Phase 3 strictly or keep the beautiful UI.
  // The UI currently shows all. Let's keep the filter search.
  const filteredData = useMemo(() => {
    let baseData = parsedData;
    // To strictly follow Phase 3 "UI logic: A clean borderless table of `missingSEPList`",
    // maybe we default to showing missing SEP if there's no search query?
    // Let's just filter based on search query.
    if (!searchQuery) return baseData.filter(d => d.status === 'anomaly');
    
    const lowerQ = searchQuery.toLowerCase();
    return baseData.filter(d => 
      (d.namaPasien && d.namaPasien.toLowerCase().includes(lowerQ)) ||
      (d.nomorSep && d.nomorSep.toLowerCase().includes(lowerQ)) ||
      (d.nomorRm && d.nomorRm.toLowerCase().includes(lowerQ))
    );
  }, [parsedData, searchQuery]);

  const resetData = () => {
    setFileData(null);
    setParsedData([]);
    setSearchQuery("");
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && !isSaving) {
        setTimeout(resetData, 300); // reset data after close animation
      }
    }}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:-translate-y-0.5" title="Upload Rekap Excel">
          <UploadCloud size={18} />
          <span className="hidden sm:inline">Upload Rekap</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in" />
        <Dialog.Content className="fixed right-0 top-0 bottom-0 w-full md:w-[800px] bg-slate-50 border-l border-slate-200/60 shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col focus:outline-none">
          
          <div className="flex flex-col w-full h-full text-slate-900 font-sans px-4 sm:px-8 py-6 rounded-none relative overflow-y-auto custom-scrollbar">
            {/* Ambient backgrounds */}
            <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[120px] pointer-events-none" />
            
            <div className="w-full mx-auto relative z-10 flex flex-col min-h-full gap-6 pb-20">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="space-y-1 sm:space-y-2">
             <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[14px] shadow-[0_4px_14px_0_rgba(99,102,241,0.3)] text-white shrink-0">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <Dialog.Title className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                    Upload Rekap Harian
                  </Dialog.Title>
                  <Dialog.Description className="text-xs font-medium text-slate-500 mt-0.5">
                    Unggah file Excel (.xlsx) untuk dianalisis sistem.
                  </Dialog.Description>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center">
            {fileData && (
              <>
                 <button onClick={resetData} disabled={isSaving} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold text-xs transition-all disabled:opacity-50">
                   Batal
                 </button>
                 <button onClick={handleSaveToDatabase} disabled={isSaving} className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm disabled:opacity-50">
                   {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                   {isSaving ? 'Menyimpan...' : 'Simpan Database'}
                 </button>
              </>
            )}
            <Dialog.Close asChild>
              <button disabled={isSaving} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors ml-2">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          
          {!fileData ? (
             // Upload View
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div 
                className={`relative border-2 border-dashed rounded-[2rem] w-full max-w-3xl p-10 sm:p-16 lg:p-20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col items-center justify-center text-center gap-5 shadow-sm overflow-hidden group
                  ${isDragging ? "border-indigo-400 bg-indigo-50/60 scale-[1.02] shadow-md" : "border-slate-300 bg-white/60 backdrop-blur-xl hover:border-slate-400 hover:bg-white"}
                `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={onFileInputChange}
                  disabled={isLoading}
                  title="Pilih file rekap Excel"
                />
                
                {isLoading ? (
                  <div className="flex flex-col items-center gap-6 text-indigo-500 animate-in fade-in zoom-in duration-300">
                    <div className="relative flex items-center justify-center w-16 h-16">
                       <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping"></span>
                       <Loader2 className="w-10 h-10 animate-spin text-indigo-600 relative z-10" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold tracking-wide text-slate-800">{progressMsg}</p>
                      <p className="text-xs font-medium text-slate-500">Menganalisis Data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-500 pointer-events-none relative z-10">
                    <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 group-hover:shadow transition-all duration-300">
                      <UploadCloud className="w-10 h-10 text-slate-600" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1 mt-2">
                      <p className="text-base sm:text-lg font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors">
                        Tarik file rekap harian (.xlsx) ke area ini
                      </p>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
                        Atau klik untuk memilih file lewat file manager
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Results Dashboard View
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
              
              {/* Main Data & Tables Section */}
              <div className="flex flex-col gap-6">
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                  {/* Card 1: Total Patients */}
                  <div className="bg-white/80 backdrop-blur border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group">
                    <div className="flex flex-col z-10 relative w-full">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Users size={16} /></div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pasien</p>
                       </div>
                       <p className="text-3xl font-black text-slate-800 mb-1">{parsedData.length}</p>
                    </div>
                  </div>
                  
                  {/* Card 2: Anomalies */}
                  <div className={cn(
                    "bg-white/80 backdrop-blur border p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden transition-all",
                    anomalyCount > 0 ? "border-amber-200/60 hover:bg-amber-50/50" : "border-slate-200/60"
                  )}>
                     <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none", anomalyCount > 0 ? "bg-amber-100/50" : "bg-slate-100")}></div>
                    <div className={cn("p-3 rounded-xl relative z-10 border", anomalyCount > 0 ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-slate-50 border-slate-200 text-slate-400")}>
                      <AlertCircle size={24} />
                    </div>
                    <div className="relative z-10">
                      <p className={cn("text-xs font-bold uppercase tracking-wider", anomalyCount > 0 ? "text-amber-700/80" : "text-slate-500")}>Pasien Tanpa SEP (BPJS)</p>
                      <div className="flex items-baseline gap-2">
                        <p className={cn("text-3xl font-black", anomalyCount > 0 ? "text-red-500" : "text-slate-800")}>{anomalyCount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Success Message */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm animate-in zoom-in-95 fade-in duration-500">
                   <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-inner relative overflow-hidden">
                     <span className="absolute inset-0 bg-white/20 animate-pulse"></span>
                     <CheckCircle2 size={24} className="relative z-10" />
                   </div>
                   <div>
                     <h3 className="text-emerald-800 font-bold text-lg">Data Berhasil Terbaca!</h3>
                     <p className="text-emerald-600/80 text-sm font-medium">Sistem sukses memproses <strong className="text-emerald-700">{parsedData.length}</strong> baris data excel.</p>
                   </div>
                </div>

                {/* Data Table Section */}
                <div className="flex flex-col bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden min-h-[400px] relative">
                  
                  {/* Table Toolbar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-slate-100 gap-4 shrink-0 bg-slate-50/50">
                    <div className="relative w-full sm:w-80 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Cari anomali..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                {/* Card List Wrapper (Scrollable) */}
                  <div className="flex-1 overflow-auto custom-scrollbar p-4 bg-slate-50/50">
                     <div className="flex flex-col gap-3">
                        {filteredData.length > 0 ? (
                          filteredData.map((row, idx) => {
                             const isAnomaly = row.status === 'anomaly';
                             return (
                               <div 
                                 key={row.id || idx} 
                                 className={cn(
                                   "flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                                   isAnomaly 
                                     ? "bg-amber-50/80 border-amber-200 hover:border-amber-300 shadow-sm" 
                                     : "bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-sm"
                                 )}
                               >
                                 {isAnomaly && <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>}
                                 
                                 <div className="flex items-center gap-4">
                                   <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 select-none",
                                      isAnomaly ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 transition-colors"
                                   )}>
                                     {idx + 1}
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                        {row.namaPasien}
                                        {isAnomaly && <AlertCircle size={14} className="text-amber-500 animate-pulse" />}
                                      </p>
                                      <p className="text-xs font-mono text-slate-500 mt-0.5">{row.nomorRm}</p>
                                      {/* Tampilkan daftar poli jika multi-visit */}
                                      {row.poliList && row.poliList.length > 0 && (
                                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]" title={row.poliList.join(' · ')}>
                                          {row.poliList.join(' · ')}
                                        </p>
                                      )}
                                   </div>
                                 </div>
                                 
                                 <div className="text-right flex flex-col items-end gap-1.5">
                                    <span className={cn(
                                       "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border",
                                       (row.jenisPasien || '').toLowerCase().includes('bpjs') 
                                         ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                         : "bg-blue-50 text-blue-700 border-blue-200"
                                    )}>
                                      {row.jenisPasien || '-'}
                                    </span>
                                    {row.visitCount && row.visitCount > 1 && (
                                       <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shadow-sm">
                                         {row.visitCount}x Kunjungan
                                       </span>
                                    )}
                                    {/* Badge Rawat Bersama */}
                                    {row.anomalyReason === 'rawat_bersama' && (
                                       <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                                         <Users size={10} /> Rawat Bersama
                                       </span>
                                    )}
                                    {/* Badge Terapi Gabung */}
                                    {row.anomalyReason === 'terapi_gabung' && (
                                       <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                                         <Users size={10} /> Terapi Gabung
                                       </span>
                                    )}
                                    {isAnomaly && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1"><AlertCircle size={10} /> Butuh SEP</span>}
                                 </div>
                               </div>
                             );
                          })
                        ) : (
                          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                             <Search size={32} className="opacity-50" />
                             <p className="text-sm font-medium">{searchQuery ? "Tidak ada pasien yang sesuai pencarian." : "Keren! Tidak ada data pasien tanpa SEP (Missing SEP)."}</p>
                          </div>
                        )}
                     </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard Panel Section */}
              <div className="w-full flex-shrink-0 flex flex-col gap-6">
                 
                 <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                         <Trophy size={16} className="text-amber-500" />
                         Kinerja Petugas (Total Pasien)
                       </h3>
                    </div>
                    
                    <div className="p-4 flex flex-col gap-3">
                       {leaderboard.length > 0 ? leaderboard.map(([user, count], idx) => (
                         <div key={user} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm",
                              idx === 0 ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white" :
                              idx === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                              idx === 2 ? "bg-gradient-to-br from-orange-300 to-amber-700 text-white" :
                              "bg-slate-100 text-slate-500"
                            )}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{user}</p>
                            </div>
                            <div className="text-right shrink-0">
                               <p className="text-lg font-black text-slate-800">{count}</p>
                            </div>
                         </div>
                       )) : (
                         <div className="py-8 text-center text-slate-400 text-sm">
                           Tidak ada data petugas.
                         </div>
                       )}
                    </div>
                 </div>
              </div>

            </div>
          )}
          </div>
          </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
