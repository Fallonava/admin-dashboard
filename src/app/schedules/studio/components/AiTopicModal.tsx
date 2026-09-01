"use client";

import { useState } from "react";
import { Sparkles, Wand2, X, Check, RefreshCw, BookOpen, Lightbulb } from "lucide-react";
import { HealthEducationTopic } from "../types";

interface AiTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopic: HealthEducationTopic | null;
  onApplyTopic: (topic: HealthEducationTopic) => void;
  dayIdx: number;
}

const SAMPLE_PROMPTS = [
  "USG Abdomen & Pemeriksaan Perut",
  "Pemeriksaan Jantung & EKG Rutin",
  "Pencegahan Stunting & Tumbuh Kembang Anak",
  "Asam Lambung GERD & Pola Makan Sehat",
  "Gejala Stroke & Golden Period FAST",
  "Pemeriksaan USG 4D Kehamilan",
  "Pentingnya Medical Check Up Tahunan",
  "Kesehatan Tulang, Sendi & Osteoporosis",
  "Katarak & Skrining Kesehatan Mata",
];

export function AiTopicModal({
  isOpen,
  onClose,
  currentTopic,
  onApplyTopic,
  dayIdx,
}: AiTopicModalProps) {
  const [promptInput, setPromptInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewTopic, setPreviewTopic] = useState<HealthEducationTopic | null>(currentTopic);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    setLoading(true);
    try {
      const p = customPrompt !== undefined ? customPrompt : promptInput;
      const res = await fetch("/api/schedules/ai-poster-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: p.trim() || undefined,
          dayIdx,
        }),
      });
      const data = await res.json();
      if (data.success && data.topic) {
        setPreviewTopic(data.topic);
      }
    } catch (err) {
      console.error("Failed to generate AI Topic:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (previewTopic) {
      onApplyTopic(previewTopic);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AI Health Education Studio
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">
                  Smart Copywriter
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buat materi edukasi kesehatan otomatis untuk dicantumkan pada poster jadwal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Prompt Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Pilih Topik Cepat atau Masukkan Ide Sendiri:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPromptInput(p);
                    handleGenerate(p);
                  }}
                  className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 transition-all font-medium"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: Manfaat Skrining Kanker Payudara, Vaksinasi Flu..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Generated Topic */}
          {previewTopic && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-sky-500 text-white uppercase tracking-wider">
                  {previewTopic.tag}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                  <BookOpen className="w-3 h-3" /> Preview Materi Poster
                </span>
              </div>

              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                {previewTopic.title}
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {previewTopic.summary}
              </p>

              <div className="space-y-1 pt-1">
                {previewTopic.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-sky-500 font-bold">•</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-[11px] italic text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
                💬 {previewTopic.note}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            disabled={!previewTopic}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Terapkan ke Poster
          </button>
        </div>
      </div>
    </div>
  );
}
