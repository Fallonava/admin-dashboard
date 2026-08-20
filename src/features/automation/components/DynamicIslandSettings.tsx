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
            <div className="flex items-center justify-center h-48 text-zinc-400 clay-surface rounded-[36px]">
                <RefreshCw size={24} className="animate-spin mr-3 text-violet-500" />
                <span className="text-sm font-black tracking-widest uppercase">Memuat Konfigurasi...</span>
            </div>
        );
    }

    const messages: any[] = settings.customMessages || [];

    return (
        <div className="rounded-[36px] clay-surface p-7 md:p-8 space-y-7 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-[20px] clay-pill-violet text-white shadow-md">
                        <Bell size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Dynamic Island</h3>
                        <p className="text-[11px] text-violet-600 dark:text-violet-400 font-mono font-bold uppercase tracking-[0.2em] mt-1">Pesan Bergiliran Layar TV</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            updateSetting("customMessages", [...messages, { title: "Info", text: "Pesan Baru" }]);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 clay-button text-violet-700 dark:text-violet-300 rounded-full text-[13px] font-black transition-all active:scale-95 shadow-sm"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Tambah
                    </button>
                    <button
                        onClick={saveData}
                        disabled={saving}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-black transition-all duration-300 active:scale-95 shadow-md",
                            savedFlash
                                ? "clay-pill-emerald text-white"
                                : "clay-pill-blue text-white"
                        )}
                    >
                        <Save size={16} strokeWidth={2.5} />
                        {saving ? "Menyimpan..." : savedFlash ? "✓ Tersimpan" : "Simpan Pesan"}
                    </button>
                </div>
            </div>

            {/* Messages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className="group/msg clay-surface p-5 rounded-[26px] transition-all duration-200 shadow-sm relative"
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] clay-button text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                                <MessageSquare size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="clay-inset px-3 py-1.5 rounded-xl">
                                    <input
                                        value={msg.title}
                                        onChange={(e) => {
                                            const newMsgs = [...messages];
                                            newMsgs[idx] = { ...newMsgs[idx], title: e.target.value };
                                            updateSetting("customMessages", newMsgs);
                                        }}
                                        className="bg-transparent text-[11px] font-black text-violet-600 dark:text-violet-400 w-full outline-none uppercase tracking-[0.15em] placeholder:text-violet-300"
                                        placeholder="JUDUL PESAN"
                                    />
                                </div>
                                <div className="clay-inset px-3 py-2 rounded-xl">
                                    <input
                                        value={msg.text}
                                        onChange={(e) => {
                                            const newMsgs = [...messages];
                                            newMsgs[idx] = { ...newMsgs[idx], text: e.target.value };
                                            updateSetting("customMessages", newMsgs);
                                        }}
                                        className="bg-transparent text-[14px] font-bold text-zinc-800 dark:text-zinc-200 w-full outline-none placeholder:text-zinc-400"
                                        placeholder="Ketik isi pesan di sini..."
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const newMsgs = messages.filter((_, i) => i !== idx);
                                    updateSetting("customMessages", newMsgs);
                                }}
                                className="text-rose-500 clay-button transition-all p-2.5 rounded-[14px] shrink-0 active:scale-95"
                                title="Hapus pesan"
                            >
                                <Trash2 size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="md:col-span-2 text-center py-16 clay-inset rounded-[30px]">
                        <div className="w-16 h-16 clay-button rounded-[20px] flex items-center justify-center mx-auto mb-3 text-zinc-400">
                            <Bell size={28} strokeWidth={2.5} />
                        </div>
                        <p className="text-[15px] text-zinc-600 dark:text-zinc-300 font-black tracking-tight">Belum ada pesan kustom</p>
                        <p className="text-[11px] text-zinc-400 mt-1 font-bold uppercase tracking-widest">Klik &quot;Tambah&quot; untuk menambahkan pesan ke layar TV.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
