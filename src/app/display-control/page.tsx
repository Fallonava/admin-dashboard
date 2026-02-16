"use client";

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Doctor, Settings } from '@/lib/data-service';
import { Save, RefreshCw, Plus, Trash2, MonitorPlay } from 'lucide-react';

interface DisplayData {
    doctors: Doctor[];
    settings: Settings;
}

export default function DisplayControl() {
    const { data: doctors = [], mutate: mutateDoctors } = useSWR<Doctor[]>('/api/doctors');
    const { data: settings, mutate: mutateSettings } = useSWR<Settings>('/api/settings');
    const [saving, setSaving] = useState(false);

    const isLoading = !doctors || !settings;

    const saveData = async () => {
        if (!settings || !doctors) return;
        try {
            setSaving(true);

            // In a real SWR setup, we might not need a global "save all" if we save incrementally, 
            // but preserving the existing 'Save Changes' button logic for now which presumably saves everything 
            // - though the API seems separated. The original page fetched /api/display which returned {doctors, settings}.
            // I'll stick to saving what we have using the /api/display endpoint if that's preferred, 
            // or save individually. The original code used /api/display for BOTH read and write.
            // Let's stick to the /api/display for getting the "snapshot" but wait...
            // I switched to individual SWR hooks above (/api/doctors, /api/settings) for better granularity in other parts of the app.
            // But checking the original code: 
            // const res = await fetch('/api/display'); const json = await res.json(); setData(json);
            // It seems /api/display aggregates them.
            // For consistency with the new Dashboard, let's try to stick to granular updates if possible, 
            // OR re-implement the generic save if the backend expects it.
            // Assuming /api/display can handle the POST with { doctors, settings } as before.

            await fetch('/api/display', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctors, settings }),
            });
            mutate('/api/doctors');
            mutate('/api/settings');
        } catch (error) {
            console.error('Failed to save data', error);
        } finally {
            setSaving(false);
        }
    };

    const updateDoctor = (id: string | number, field: keyof Doctor, value: any) => {
        if (!doctors) return;
        const updatedDoctors = doctors.map(doc =>
            doc.id === id ? { ...doc, [field]: value } : doc
        );
        mutateDoctors(updatedDoctors, false); // Optimistic
    };

    const updateSetting = (field: keyof Settings, value: any) => {
        if (!settings) return;
        mutateSettings({ ...settings, [field]: value }, false);
    };

    if (isLoading) return <div className="p-8 text-white">Loading...</div>;
    if (!settings) return <div className="p-8 text-white">Error loading data.</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Pusat Kontrol Layar</h1>
                    <p className="text-slate-400">Kelola jadwal dokter dan pesan tampilan</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => { mutate('/api/doctors'); mutate('/api/settings'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw size={18} /> Refresh
                    </button>
                    <button
                        onClick={saveData}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </header>

            {/* Content: Global Settings */}
            <div className="lg:col-span-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Siaran (Broadcast)</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Teks Berjalan (Running Text)</label>
                                <textarea
                                    value={settings.runTextMessage || ''}
                                    onChange={(e) => updateSetting('runTextMessage', e.target.value)}
                                    className="w-full bg-slate-800/50 text-white rounded-xl p-3 border border-white/10 focus:border-blue-500 outline-none text-sm min-h-[100px]"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <input
                                    type="checkbox"
                                    checked={settings.emergencyMode || false}
                                    onChange={(e) => updateSetting('emergencyMode', e.target.checked)}
                                    className="w-5 h-5 accent-red-500"
                                />
                                <div>
                                    <div className="text-red-400 font-bold text-sm">Mode Darurat</div>
                                    <div className="text-red-400/60 text-xs">Ambil alih semua layar</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Aksi Cepat</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-3 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl border border-white/5 transition-colors">
                                    Reset Status
                                </button>
                                <button className="p-3 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl border border-white/5 transition-colors">
                                    Hapus Antrian
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Island Custom Messages */}
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Dynamic Island</h2>
                                <button
                                    onClick={() => {
                                        const msgs = settings.customMessages || [];
                                        updateSetting('customMessages', [...msgs, { title: 'Info', text: 'Pesan Baru' }]);
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <Plus size={14} /> Tambah Pesan
                                </button>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {(settings.customMessages || []).map((msg, idx) => (
                                    <div key={idx} className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex gap-2 items-start group">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                value={msg.title}
                                                onChange={(e) => {
                                                    const newMsgs = [...(settings.customMessages || [])];
                                                    newMsgs[idx].title = e.target.value;
                                                    updateSetting('customMessages', newMsgs);
                                                }}
                                                className="bg-transparent text-xs font-bold text-slate-400 w-full outline-none uppercase tracking-wider"
                                                placeholder="JUDUL"
                                            />
                                            <input
                                                value={msg.text}
                                                onChange={(e) => {
                                                    const newMsgs = [...(settings.customMessages || [])];
                                                    newMsgs[idx].text = e.target.value;
                                                    updateSetting('customMessages', newMsgs);
                                                }}
                                                className="bg-transparent text-sm text-white w-full outline-none"
                                                placeholder="Isi pesan..."
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newMsgs = (settings.customMessages || []).filter((_, i) => i !== idx);
                                                updateSetting('customMessages', newMsgs);
                                            }}
                                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(!settings.customMessages || settings.customMessages.length === 0) && (
                                    <div className="text-center py-4 text-slate-500 text-sm">
                                        Tidak ada pesan kustom. Pesan default akan digunakan.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
