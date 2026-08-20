"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Check, Loader2, User, AlertCircle, Trash2 } from "lucide-react";
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
          doctorId: item.matchedDoctorId,
          matchedDoctorId: item.matchedDoctorId,
          type: item.type || 'Liburan',
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

      const savedData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(savedData?.error || 'Gagal menyimpan ke database');
      }

      if (Array.isArray(savedData) && savedData.length === 0 && payloads.length > 0) {
        throw new Error('Tidak ada dokter yang cocok di database. Mohon sesuaikan nama dokter pada daftar.');
      }

      await onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("[AiLeaveImportModal] Save Error:", err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={handleClose}>
      <div className="w-full max-w-2xl clay-surface rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 clay-icon-violet rounded-[14px] flex items-center justify-center text-white shrink-0">
              <Sparkles size={19} className="relative z-10" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">AI Smart Cuti Extractor</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">Salin chat WA dokter, sistem mendeteksi nama & tanggal otomatis</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-[12px] clay-button text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all active:scale-95"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-[16px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-xs font-black animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
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
                  className="w-full p-4 rounded-[20px] clay-inset text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none transition-all resize-y font-mono"
                />
              </div>

              <div className="p-4 rounded-[20px] clay-inset flex items-start gap-3">
                <Sparkles size={18} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-bold leading-relaxed">
                  Sistem mendukung formatwa.txt: memecah rentang tanggal (3 - 8 Agustus), tanggal terpisah (17, 24, 25), tanggal merah, dan pergantian dokter otomatis via 9Router LLM.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Ditemukan {parsedItems.length} Pengajuan Cuti:
                </span>
                <button
                  onClick={() => setStep('input')}
                  className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Edit Teks Chat
                </button>
              </div>

              <div className="space-y-3">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-[22px] clay-button space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <User size={15} className="text-zinc-400 shrink-0" />
                        <select
                          value={item.matchedDoctorId || (doctors.find(d => d.name.toLowerCase() === (item.matchedDoctorName || item.doctorName).toLowerCase())?.id) || ""}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const foundDoc = doctors.find(d => d.id === selectedId);
                            if (foundDoc) {
                              setParsedItems(prev => prev.map((it, i) => i === idx ? {
                                ...it,
                                matchedDoctorId: foundDoc.id,
                                matchedDoctorName: foundDoc.name
                              } : it));
                            } else {
                              setParsedItems(prev => prev.map((it, i) => i === idx ? {
                                ...it,
                                matchedDoctorId: undefined,
                                matchedDoctorName: undefined
                              } : it));
                            }
                          }}
                          className="w-full text-xs font-black text-zinc-900 dark:text-zinc-100 clay-inset rounded-[12px] p-2 outline-none"
                        >
                          <option value="">{item.doctorName} (Hasil Chat / Deteksi AI)</option>
                          {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 clay-button rounded-[10px] transition-all active:scale-95"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-black text-zinc-400 block mb-1">Mulai</label>
                        <input
                          type="date"
                          value={item.startDate}
                          onChange={(e) => updateItem(idx, 'startDate', e.target.value)}
                          className="w-full text-xs font-black text-zinc-800 dark:text-zinc-100 p-2 rounded-[12px] clay-inset outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-zinc-400 block mb-1">Selesai</label>
                        <input
                          type="date"
                          value={item.endDate}
                          onChange={(e) => updateItem(idx, 'endDate', e.target.value)}
                          className="w-full text-xs font-black text-zinc-800 dark:text-zinc-100 p-2 rounded-[12px] clay-inset outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-zinc-400 block mb-1">Tipe Cuti</label>
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(idx, 'type', e.target.value)}
                          className="w-full text-xs font-black text-zinc-800 dark:text-zinc-100 p-2 rounded-[12px] clay-inset outline-none"
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
                        className="w-full text-xs text-zinc-700 dark:text-zinc-300 p-2 rounded-[12px] clay-inset font-bold outline-none placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-[14px] text-xs font-black text-zinc-600 dark:text-zinc-400 clay-button transition-all active:scale-95"
          >
            Batal
          </button>

          {step === 'input' ? (
            <button
              onClick={handleProcessAi}
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[16px] clay-pill-violet text-white text-xs font-black disabled:opacity-50 transition-all active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>AI Menganalisis...</span>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-[16px] clay-pill-emerald text-white text-xs font-black disabled:opacity-50 transition-all active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Menerapkan Cuti...</span>
                </>
              ) : (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  <span>Terapkan ({parsedItems.length}) Cuti</span>
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
