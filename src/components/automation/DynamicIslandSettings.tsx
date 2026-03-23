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
            <div className="flex items-center justify-center h-40 text-slate-400">
                <RefreshCw size={18} className="animate-spin mr-2" />
                <span className="text-sm font-medium">Memuat...</span>
            </div>
        );
    }

    const messages: any[] = settings.customMessages || [];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-100 text-violet-600 border border-violet-200">
                        <Bell size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Dynamic Island Messages</h3>
                        <p className="text-[11px] text-slate-400">Pesan notifikasi bergiliran di layar TV</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            updateSetting("customMessages", [...messages, { title: "Info", text: "Pesan Baru" }]);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-xs font-bold border border-violet-200 transition-all active:scale-95"
                    >
                        <Plus size={13} /> Tambah
                    </button>
                    <button
                        onClick={saveData}
                        disabled={saving}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border",
                            savedFlash
                                ? "bg-emerald-500 text-white border-emerald-400"
                                : "bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                        )}
                    >
                        <Save size={13} />
                        {saving ? "Menyimpan..." : savedFlash ? "✓ Tersimpan" : "Simpan"}
                    </button>
                </div>
            </div>

            {/* Messages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className="group/msg bg-slate-50 hover:bg-white p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-200 hover:shadow-sm relative"
                    >
                        <div className="flex items-start gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 shrink-0 mt-0.5">
                                <MessageSquare size={13} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <input
                                    value={msg.title}
                                    onChange={(e) => {
                                        const newMsgs = [...messages];
                                        newMsgs[idx] = { ...newMsgs[idx], title: e.target.value };
                                        updateSetting("customMessages", newMsgs);
                                    }}
                                    className="bg-transparent text-[10px] font-bold text-slate-400 w-full outline-none uppercase tracking-wider border-b border-transparent focus:border-violet-300 transition-colors pb-0.5"
                                    placeholder="JUDUL"
                                />
                                <input
                                    value={msg.text}
                                    onChange={(e) => {
                                        const newMsgs = [...messages];
                                        newMsgs[idx] = { ...newMsgs[idx], text: e.target.value };
                                        updateSetting("customMessages", newMsgs);
                                    }}
                                    className="bg-transparent text-sm text-slate-700 w-full outline-none focus:text-slate-900 transition-colors"
                                    placeholder="Isi pesan..."
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const newMsgs = messages.filter((_, i) => i !== idx);
                                    updateSetting("customMessages", newMsgs);
                                }}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover/msg:opacity-100 transition-all p-1 hover:bg-red-50 rounded-lg shrink-0"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="md:col-span-2 text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <Bell size={22} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-400 font-medium">Belum ada pesan kustom</p>
                        <p className="text-xs text-slate-400 mt-0.5">Klik &quot;Tambah&quot; untuk menambahkan pesan Dynamic Island.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
