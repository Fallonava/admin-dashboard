"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, Plus, User, Clock, Tag, Activity } from "lucide-react";
import type { Doctor } from "@/lib/data-service";
import { cn } from "@/lib/utils";

interface DoctorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctor?: Doctor | null;
    onSuccess: () => void;
}

const STATUS_OPTIONS = [
    { value: 'TIDAK PRAKTEK', label: 'Tidak Praktek', color: 'text-slate-500', bg: 'bg-slate-100', activeBg: 'bg-slate-800', activeText: 'text-white' },
    { value: 'BUKA', label: 'Buka', color: 'text-blue-600', bg: 'bg-blue-50', activeBg: 'bg-blue-600', activeText: 'text-white' },
    { value: 'PENUH', label: 'Penuh', color: 'text-amber-600', bg: 'bg-amber-50', activeBg: 'bg-amber-500', activeText: 'text-white' },
    { value: 'OPERASI', label: 'Operasi', color: 'text-red-600', bg: 'bg-red-50', activeBg: 'bg-red-600', activeText: 'text-white' },
    { value: 'CUTI', label: 'Cuti', color: 'text-purple-600', bg: 'bg-purple-50', activeBg: 'bg-purple-600', activeText: 'text-white' },
    { value: 'SELESAI', label: 'Selesai', color: 'text-emerald-600', bg: 'bg-emerald-50', activeBg: 'bg-emerald-600', activeText: 'text-white' },
];

export function DoctorFormModal({ isOpen, onClose, doctor, onSuccess }: DoctorFormModalProps) {
    const isEditing = !!doctor;
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const [formData, setFormData] = useState({
        name: "",
        specialty: "",
        category: "NonBedah" as "NonBedah" | "Bedah",
        status: "TIDAK PRAKTEK" as string,
        queueCode: "",
        startTime: "",
        endTime: "",
        lastCall: "",
    });

    useEffect(() => {
        if (isOpen) {
            if (doctor) {
                setFormData({
                    name: doctor.name ?? "",
                    specialty: doctor.specialty ?? "",
                    category: doctor.category ?? "NonBedah",
                    status: doctor.status ?? "TIDAK PRAKTEK",
                    queueCode: doctor.queueCode ?? "",
                    startTime: doctor.startTime ?? "",
                    endTime: doctor.endTime ?? "",
                    lastCall: (doctor as any).lastCall ?? "",
                });
            } else {
                setFormData({
                    name: "", specialty: "", category: "NonBedah",
                    status: "TIDAK PRAKTEK", queueCode: "",
                    startTime: "", endTime: "", lastCall: "",
                });
            }
        }
    }, [isOpen, doctor]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.specialty) return;
        setLoading(true);
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing ? { ...formData, id: doctor!.id } : formData;
            await fetch('/api/doctors', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to save doctor", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-[28px] w-full max-w-md shadow-2xl shadow-black/10 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center gap-4 p-6 pb-0">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                        isEditing ? "bg-blue-50" : "bg-slate-900"
                    )}>
                        {isEditing
                            ? <Save className="h-5 w-5 text-blue-600" />
                            : <Plus className="h-5 w-5 text-white" />
                        }
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-black text-slate-900">
                            {isEditing ? 'Edit Dokter' : 'Tambah Dokter Baru'}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {isEditing ? `Mengubah data ${doctor?.name}` : 'Isi data profil dokter di bawah ini'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Form Fields ── */}
                <div className="p-6 space-y-5">

                    {/* Nama & Spesialis */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                <User size={10} />
                                Nama Lengkap
                            </label>
                            <input
                                autoFocus={!isEditing}
                                placeholder="cth. dr. Sarah Johnson, Sp. B"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                <Tag size={10} />
                                Spesialisasi
                            </label>
                            <input
                                placeholder="cth. Bedah Umum, Penyakit Dalam..."
                                value={formData.specialty}
                                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Kategori */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Kategori</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'NonBedah', label: '🩺 Non-Bedah', selColor: 'bg-emerald-600' },
                                { value: 'Bedah', label: '🔪 Bedah', selColor: 'bg-red-600' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: opt.value as any })}
                                    className={cn(
                                        "py-3 rounded-2xl text-xs font-bold transition-all",
                                        formData.category === opt.value
                                            ? `${opt.selColor} text-white shadow-md`
                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <Activity size={10} />
                            Status
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: opt.value })}
                                    className={cn(
                                        "py-2.5 rounded-xl text-[10px] font-black transition-all",
                                        formData.status === opt.value
                                            ? `${opt.activeBg} ${opt.activeText} shadow-sm`
                                            : `${opt.bg} ${opt.color} hover:opacity-80`
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kode antrian + Waktu */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Kode Antrian
                            </label>
                            <input
                                placeholder="A-01"
                                value={formData.queueCode}
                                onChange={e => setFormData({ ...formData, queueCode: e.target.value })}
                                className="w-full bg-slate-50 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-center placeholder:text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                <Clock size={9} /> Mulai
                            </label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-slate-50 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                <Clock size={9} /> Selesai
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full bg-slate-50 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Footer Actions ── */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-sm font-bold transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name || !formData.specialty}
                        className={cn(
                            "flex-[2] py-3.5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2",
                            loading || !formData.name || !formData.specialty
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                        )}
                    >
                        {loading ? (
                            <span className="animate-pulse">Menyimpan...</span>
                        ) : (
                            <>
                                {isEditing ? <Save size={14} /> : <Plus size={14} />}
                                {isEditing ? 'Simpan Perubahan' : 'Tambah Dokter'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>,
        document.body
    );
}
