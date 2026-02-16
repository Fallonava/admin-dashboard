"use client";

import { useEffect, useState } from 'react';
import { Doctor, DisplayData } from '@/lib/display-data';
import { Save, RefreshCw, Plus, Trash2, MonitorPlay } from 'lucide-react';

export default function DisplayControl() {
    const [data, setData] = useState<DisplayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/display');
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const saveData = async () => {
        if (!data) return;
        try {
            setSaving(true);
            await fetch('/api/display', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Failed to save data', error);
        } finally {
            setSaving(false);
        }
    };

    const updateDoctor = (id: string, field: keyof Doctor, value: any) => {
        if (!data) return;
        const updatedDoctors = data.doctors.map(doc =>
            doc.id === id ? { ...doc, [field]: value } : doc
        );
        setData({ ...data, doctors: updatedDoctors });
    };

    const addDoctor = () => {
        if (!data) return;
        const newDoctor: Doctor = {
            id: `dr-${Date.now()}`,
            name: 'New Doctor',
            specialty: 'General',
            status: 'CUTI',
            startTime: '08:00',
            endTime: '12:00',
            queueCode: 'A-00',
            category: 'NonBedah',
        };
        setData({ ...data, doctors: [...data.doctors, newDoctor] });
    };

    const removeDoctor = (id: string) => {
        if (!data) return;
        setData({ ...data, doctors: data.doctors.filter(d => d.id !== id) });
    };

    const updateSetting = (field: string, value: any) => {
        if (!data) return;
        setData({
            ...data,
            settings: { ...data.settings, [field]: value }
        });
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;
    if (!data) return <div className="p-8 text-white">Error loading data.</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Display Control Center</h1>
                    <p className="text-slate-400">Manage doctor schedules and display messages</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw size={18} /> Refresh
                    </button>
                    <button
                        onClick={saveData}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Doctor List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Active Doctors</h2>
                            <button
                                onClick={addDoctor}
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                            >
                                <Plus size={16} /> Add Doctor
                            </button>
                        </div>

                        <div className="space-y-4">
                            {data.doctors.map((doc) => (
                                <div key={doc.id} className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    <div className="flex-1 space-y-2 w-full">
                                        <div className="flex gap-2">
                                            <input
                                                value={doc.name}
                                                onChange={(e) => updateDoctor(doc.id, 'name', e.target.value)}
                                                className="bg-transparent text-white font-medium border-b border-white/10 focus:border-blue-500 outline-none w-full"
                                                placeholder="Doctor Name"
                                            />
                                            <input
                                                value={doc.queueCode}
                                                onChange={(e) => updateDoctor(doc.id, 'queueCode', e.target.value)}
                                                className="bg-transparent text-blue-400 font-mono text-sm border-b border-white/10 focus:border-blue-500 outline-none w-16 text-center"
                                                placeholder="Code"
                                            />
                                        </div>
                                        <div className="flex gap-2 text-sm">
                                            <input
                                                value={doc.specialty}
                                                onChange={(e) => updateDoctor(doc.id, 'specialty', e.target.value)}
                                                className="bg-transparent text-slate-400 border-b border-white/10 focus:border-blue-500 outline-none flex-1"
                                                placeholder="Specialty"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-center">
                                        <select
                                            value={doc.status}
                                            onChange={(e) => updateDoctor(doc.id, 'status', e.target.value)}
                                            className="bg-slate-900 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 outline-none focus:border-blue-500"
                                        >
                                            <option value="BUKA">BUKA</option>
                                            <option value="PENUH">PENUH</option>
                                            <option value="OPERASI">OPERASI</option>
                                            <option value="CUTI">CUTI</option>
                                            <option value="SELESAI">SELESAI</option>
                                        </select>

                                        <select
                                            value={doc.category}
                                            onChange={(e) => updateDoctor(doc.id, 'category', e.target.value)}
                                            className="bg-slate-900 text-slate-300 text-sm rounded-lg px-3 py-1.5 border border-white/10 outline-none focus:border-blue-500"
                                        >
                                            <option value="Bedah">Bedah</option>
                                            <option value="NonBedah">Non-Bedah</option>
                                        </select>

                                        <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg px-2 border border-white/5">
                                            <input
                                                type="time"
                                                value={doc.startTime}
                                                onChange={(e) => updateDoctor(doc.id, 'startTime', e.target.value)}
                                                className="bg-transparent text-white text-xs py-1.5 outline-none w-16"
                                            />
                                            <span className="text-slate-500">-</span>
                                            <input
                                                type="time"
                                                value={doc.endTime}
                                                onChange={(e) => updateDoctor(doc.id, 'endTime', e.target.value)}
                                                className="bg-transparent text-white text-xs py-1.5 outline-none w-16"
                                            />
                                        </div>

                                        <button
                                            onClick={() => removeDoctor(doc.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Global Settings */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Broadcast</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Running Text</label>
                                <textarea
                                    value={data.settings.runTextMessage}
                                    onChange={(e) => updateSetting('runTextMessage', e.target.value)}
                                    className="w-full bg-slate-800/50 text-white rounded-xl p-3 border border-white/10 focus:border-blue-500 outline-none text-sm min-h-[100px]"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <input
                                    type="checkbox"
                                    checked={data.settings.emergencyMode}
                                    onChange={(e) => updateSetting('emergencyMode', e.target.checked)}
                                    className="w-5 h-5 accent-red-500"
                                />
                                <div>
                                    <div className="text-red-400 font-bold text-sm">Emergency Mode</div>
                                    <div className="text-red-400/60 text-xs">Override all screens</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-3 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl border border-white/5 transition-colors">
                                Reset Status
                            </button>
                            <button className="p-3 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl border border-white/5 transition-colors">
                                Clear Queues
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
