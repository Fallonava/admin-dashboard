"use client";

import { useState } from "react";
import useSWR from "swr";
import { Settings } from "@/lib/data-service";
import { Bell, Plus, Trash2, MessageSquare, Save, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function DynamicIslandSettings() {
    const { data: settings, mutate: mutateSettings } = useSWR<Settings>("/api/settings");
    const [saving, setSaving] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);

    const updateSetting = (field: keyof Settings, value: any) => {
        if (!settings) return;
        mutateSettings({ ...settings, [field]: value }, false);
    };

    const saveData = async () => {
        if (!settings) return;
        try {
            setSaving(true);
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            mutateSettings();
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 2500);
        } catch (error) {
            console.error("Failed to save settings", error);
        } finally {
            setSaving(false);
        }
    };

    if (!settings) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-400 bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/60">
                <RefreshCw size={24} className="animate-spin mr-3 text-violet-400" />
                <span className="text-sm font-black tracking-widest uppercase">Memuat Konfigurasi...</span>
            </div>
        );
    }

    const messages: any[] = settings.customMessages || [];

    return (
        <div className="rounded-[40px] border border-white/60 bg-white/40 backdrop-blur-2xl p-7 md:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] space-y-7 overflow-hidden relative group transition-all duration-500 hover:shadow-[0_8px_50px_rgba(0,0,0,0.08)] hover:bg-white/60">
            <div className="absolute top-0 right-0 h-80 w-80 bg-gradient-to-bl from-violet-300/30 to-fuchsia-300/30 blur-[60px] -z-10 pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-out" />
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-[20px] bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white shadow-xl shadow-violet-500/30 group-hover:scale-105 transition-all duration-500 border border-white/20">
                        <Bell size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Dynamic Island</h3>
                        <p className="text-[11px] text-violet-600 font-mono font-bold uppercase tracking-[0.2em] mt-1">Pesan Bergiliran Layar TV</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            updateSetting("customMessages", [...messages, { title: "Info", text: "Pesan Baru" }]);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-50/80 backdrop-blur-sm hover:bg-violet-100/80 text-violet-700 rounded-full text-[13px] font-black border border-violet-200/60 transition-all active:scale-95 shadow-sm"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Tambah
                    </button>
                    <button
                        onClick={saveData}
                        disabled={saving}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-black transition-all duration-300 active:scale-95 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] border",
                            savedFlash
                                ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]"
                                : "bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
                        )}
                    >
                        <Save size={16} strokeWidth={2.5} />
                        {saving ? "Menyimpan..." : savedFlash ? "✓ Tersimpan" : "Simpan Berhasil"}
                    </button>
                </div>
            </div>

            {/* Messages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className="group/msg bg-white/70 backdrop-blur-md p-5 rounded-[28px] border border-white/80 hover:border-violet-300/60 transition-all duration-300 shadow-sm hover:shadow-[0_8px_25px_-8px_rgba(139,92,246,0.3)] hover:-translate-y-0.5 relative"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-violet-100/80 text-violet-600 shrink-0 shadow-inner mt-1">
                                <MessageSquare size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2.5">
                                <input
                                    value={msg.title}
                                    onChange={(e) => {
                                        const newMsgs = [...messages];
                                        newMsgs[idx] = { ...newMsgs[idx], title: e.target.value };
                                        updateSetting("customMessages", newMsgs);
                                    }}
                                    className="bg-transparent text-[11px] font-black text-violet-500 w-full outline-none uppercase tracking-[0.2em] border-b-2 border-transparent focus:border-violet-300/50 transition-colors pb-1 placeholder:text-violet-300"
                                    placeholder="JUDUL PESAN"
                                />
                                <input
                                    value={msg.text}
                                    onChange={(e) => {
                                        const newMsgs = [...messages];
                                        newMsgs[idx] = { ...newMsgs[idx], text: e.target.value };
                                        updateSetting("customMessages", newMsgs);
                                    }}
                                    className="bg-transparent text-[15px] font-bold text-slate-700 w-full outline-none focus:text-slate-900 transition-colors placeholder:text-slate-400"
                                    placeholder="Ketik isi pesan di sini..."
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const newMsgs = messages.filter((_, i) => i !== idx);
                                    updateSetting("customMessages", newMsgs);
                                }}
                                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/msg:opacity-100 transition-all duration-300 p-2.5 hover:bg-rose-50 rounded-[14px] shrink-0"
                            >
                                <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="md:col-span-2 text-center py-16 bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-200/80 rounded-[32px] hover:bg-white/60 transition-colors duration-300">
                        <div className="w-16 h-16 bg-slate-100/80 rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <Bell size={28} className="text-slate-300" strokeWidth={2.5} />
                        </div>
                        <p className="text-[15px] text-slate-500 font-black tracking-tight">Belum ada pesan kustom</p>
                        <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Klik &quot;Tambah&quot; untuk menambahkan pesan ke layar TV.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
