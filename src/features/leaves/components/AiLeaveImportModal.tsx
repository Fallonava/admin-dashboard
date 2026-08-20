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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-md shadow-emerald-500/20">
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">AI Smart Cuti Extractor</h3>
              <p className="text-xs text-slate-500 font-medium">Salin pesan chat WA dokter/staf, AI akan mendeteksi nama & tanggal otomatis</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'input' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  Paste Pesan WhatsApp / Memo:
                </label>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Contoh:&#10;Izin menginfokan dr. Budi Santoso Sp.A cuti sakit dari tanggal 21 sampai 23 Agustus 2026.&#10;Lalu drg. Siti Aminah izin cuti tahunan tgl 25 Agustus."
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-y"
                />
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  AI akan mencocokkan nama dokter dengan database RS, memecah rentang tanggal, menentukan jenis cuti, dan menyiapkan entri untuk diverifikasi sebelum disimpan.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Ditemukan {parsedItems.length} Dokter Mengajukan Cuti:
                </span>
                <button
                  onClick={() => setStep('input')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Edit Input Teks
                </button>
              </div>

              <div className="space-y-3">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3 hover:border-emerald-200 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <User size={16} className="text-slate-400 shrink-0" />
                        <select
                          value={item.matchedDoctorName || item.doctorName}
                          onChange={(e) => updateItem(idx, 'matchedDoctorName', e.target.value)}
                          className="w-full text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-emerald-400 outline-none"
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
