"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Wand2,
  X,
  Check,
  RefreshCw,
  Lightbulb,
  Image as ImageIcon,
  Heart,
  Baby,
  Eye,
  Activity,
  ShieldAlert,
  Edit3,
} from "lucide-react";
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

const PRESET_GALLERY = [
  { label: "Jantung & EKG", icon: Heart, url: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80" },
  { label: "USG Kandungan", icon: Baby, url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80" },
  { label: "Saraf & Otak", icon: Activity, url: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80" },
  { label: "Lambung & GERD", icon: ShieldAlert, url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80" },
  { label: "Anak & Balita", icon: Baby, url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80" },
  { label: "Medical Check Up", icon: Sparkles, url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80" },
  { label: "Tulang & Sendi", icon: Activity, url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80" },
  { label: "Kesehatan Mata", icon: Eye, url: "https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&auto=format&fit=crop&q=80" },
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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentTopic) {
        setPreviewTopic(currentTopic);
      } else {
        handleGenerate();
      }
    }
  }, [isOpen, currentTopic]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AI Medical Education & Image Studio
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">
                  PRO Medical Copilot
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate materi edukasi kesehatan & pilih gambar ilustrasi medis untuk poster
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Prompt Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Pilih Topik Medis Cepat:
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
                placeholder="Ketik topik edukasi medis..."
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
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Visual Medical Gallery */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
              Pilih Ilustrasi Gambar Medis:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_GALLERY.map((gal, idx) => {
                const isSelected = previewTopic?.imageUrl === gal.url;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (previewTopic) {
                        setPreviewTopic({ ...previewTopic, imageUrl: gal.url });
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-500/20"
                        : "border-slate-200 dark:border-slate-700/70 hover:border-slate-300 bg-white dark:bg-slate-800/40"
                    }`}
                  >
                    <img src={gal.url} alt={gal.label} className="w-8 h-8 rounded-lg object-cover" />
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {gal.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview / Editor Card */}
          {previewTopic && (
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                  Preview & Live Edit:
                </span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                >
                  {isEditing ? "Selesai Edit" : "Edit Teks Manual"}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tag Kategori</label>
                      <input
                        type="text"
                        value={previewTopic.tag}
                        onChange={(e) => setPreviewTopic({ ...previewTopic, tag: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Image URL</label>
                      <input
                        type="text"
                        value={previewTopic.imageUrl || ""}
                        onChange={(e) => setPreviewTopic({ ...previewTopic, imageUrl: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Judul Edukasi</label>
                    <input
                      type="text"
                      value={previewTopic.title}
                      onChange={(e) => setPreviewTopic({ ...previewTopic, title: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Subjudul</label>
                    <input
                      type="text"
                      value={previewTopic.subtitle || ""}
                      onChange={(e) => setPreviewTopic({ ...previewTopic, subtitle: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Ringkasan Medis</label>
                    <textarea
                      rows={2}
                      value={previewTopic.summary}
                      onChange={(e) => setPreviewTopic({ ...previewTopic, summary: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/40 shadow-sm">
                  {previewTopic.imageUrl ? (
                    <img
                      src={previewTopic.imageUrl}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center text-2xl flex-shrink-0">
                      🩺
                    </div>
                  )}
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-500 text-white uppercase tracking-wider">
                      {previewTopic.tag}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1 truncate">
                      {previewTopic.title}
                    </h4>
                    {previewTopic.subtitle && (
                      <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 truncate">
                        {previewTopic.subtitle}
                      </p>
                    )}
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed pt-0.5">
                      {previewTopic.summary}
                    </p>
                  </div>
                </div>
              )}
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
