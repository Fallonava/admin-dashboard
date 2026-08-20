"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Check, ArrowRight, Loader2, Calendar, User, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";

interface ParsedLeaveItem {
  doctorName: string;
  matchedDoctorId?: string;
  matchedDoctorName?: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  confidence: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onSuccess: () => void;
}

export function AiLeaveImportModal({ isOpen, onClose, doctors, onSuccess }: Props) {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedLeaveItem[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessAi = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/leaves/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses dengan AI');
      if (!data.items || data.items.length === 0) {
        throw new Error('AI tidak menemukan data pengajuan cuti dokter pada teks tersebut.');
      }
      setParsedItems(data.items);
      setStep('review');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAll = async () => {
    if (parsedItems.length === 0) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const payloads = parsedItems.map(item => {
        const docName = item.matchedDoctorName || item.doctorName;
        return {
          doctor: docName,
          type: item.type || 'Sakit',
          startDate: item.startDate,
          endDate: item.endDate,
          reason: item.reason || 'Pengajuan via WA',
          status: 'Approved'
        };
      });

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan ke database');
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan jadwal cuti.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setInputText("");
    setParsedItems([]);
    setStep('input');
    setErrorMsg(null);
    onClose();
  };

  const updateItem = (index: number, field: keyof ParsedLeaveItem, value: any) => {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
    if (parsedItems.length <= 1) {
      setStep('input');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#131620] rounded-[24px] shadow-2xl border border-zinc-200 dark:border-[#232736] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-[#1E2230] flex items-center justify-between bg-zinc-50/50 dark:bg-[#161924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-sm">
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">AI Smart Cuti Extractor</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Salin pesan chat WA dokter/staf, sistem mendeteksi nama & tanggal otomatis</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#1A1E2B] rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-xs font-bold animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'input' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                  Paste Pesan WhatsApp / Rekap Cuti:
                </label>
                <textarea
                  rows={7}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Contoh:&#10;REKAP JADWAL CUTI SPESIALIS BULAN AGUSTUS 2026&#10;*POLI ANAK*&#10;dr. Irma Sp.A&#10;Tgl 17 Agustus ( merah )&#10;Tgl 24 Agustus ( geser merah tgl 25)&#10;&#10;dr Endro : 3 - 8 Agustus 2026 *(CUTI di gantikan dr Oki Sp. B )*"
                  className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-[#161924] border border-zinc-200 dark:border-[#232736] text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-all resize-y font-mono"
                />
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                  Sistem mendukung formatwa.txt: memecah rentang tanggal (misal 3 - 8 Agustus), tanggal terpisah (misal 17, 24, 25), tanggal merah, dan pergantian dokter otomatis.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Ditemukan {parsedItems.length} Dokter Mengajukan Cuti:
                </span>
                <button
                  onClick={() => setStep('input')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Edit Input Teks
                </button>
              </div>

              <div className="space-y-3">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-[#232736] bg-white dark:bg-[#161924] shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <User size={16} className="text-zinc-400 shrink-0" />
                        <select
                          value={item.matchedDoctorName || item.doctorName}
                          onChange={(e) => updateItem(idx, 'matchedDoctorName', e.target.value)}
                          className="w-full text-xs font-black text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-[#131620] border border-zinc-200 dark:border-[#232736] rounded-lg p-2 outline-none"
                        >
                          <option value={item.doctorName}>{item.doctorName} (Hasil Chat)</option>
                          {doctors.map(d => (
                            <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Mulai</label>
                        <input
                          type="date"
                          value={item.startDate}
                          onChange={(e) => updateItem(idx, 'startDate', e.target.value)}
                          className="w-full text-xs font-bold text-slate-700 p-2 rounded-xl bg-slate-50 border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Selesai</label>
                        <input
                          type="date"
                          value={item.endDate}
                          onChange={(e) => updateItem(idx, 'endDate', e.target.value)}
                          className="w-full text-xs font-bold text-slate-700 p-2 rounded-xl bg-slate-50 border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Tipe Cuti</label>
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(idx, 'type', e.target.value)}
                          className="w-full text-xs font-bold text-slate-700 p-2 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <option value="Sakit">🤒 Sakit</option>
                          <option value="Liburan">🏖 Liburan</option>
                          <option value="Pribadi">👤 Pribadi</option>
                          <option value="Konferensi">🎤 Konferensi</option>
                          <option value="Lainnya">📋 Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateItem(idx, 'reason', e.target.value)}
                        placeholder="Alasan cuti..."
                        className="w-full text-xs text-slate-600 p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
          >
            Batal
          </button>

          {step === 'input' ? (
            <button
              onClick={handleProcessAi}
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>AI Menganalisis Pesan...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Proses dengan AI</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSaveAll}
              disabled={isSaving || parsedItems.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Menerapkan Cuti...</span>
                </>
              ) : (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  <span>Terapkan ({parsedItems.length}) Cuti ke Sistem</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
