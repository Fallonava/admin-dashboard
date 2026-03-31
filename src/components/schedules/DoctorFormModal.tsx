"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, Plus, User, Tag, Activity, Stethoscope, Hash } from "lucide-react";
import type { Doctor } from "@/lib/data-service";
import { cn } from "@/lib/utils";

interface DoctorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctor?: Doctor | null;
    onSuccess: () => void;
}

const STATUS_OPTIONS = [
    { value: 'LIBUR',       label: 'Libur',       color: 'text-slate-500',   activeBg: 'bg-slate-600' },
    { value: 'TERJADWAL',   label: 'Terjadwal',   color: 'text-sky-600',     activeBg: 'bg-sky-500' },
    { value: 'PENDAFTARAN', label: 'Pendaftaran', color: 'text-indigo-600',  activeBg: 'bg-indigo-600' },
    { value: 'PRAKTEK',     label: 'Praktek',     color: 'text-blue-600',    activeBg: 'bg-blue-600' },
    { value: 'PENUH',       label: 'Penuh',       color: 'text-amber-600',   activeBg: 'bg-amber-500' },
    { value: 'OPERASI',     label: 'Operasi',     color: 'text-red-600',     activeBg: 'bg-red-600' },
    { value: 'CUTI',        label: 'Cuti',        color: 'text-purple-600',  activeBg: 'bg-purple-600' },
    { value: 'SELESAI',     label: 'Selesai',     color: 'text-emerald-600', activeBg: 'bg-emerald-600' },
];

const CATEGORY_OPTIONS = [
    { value: 'NonBedah', label: '🩺 Non-Bedah', selColor: 'bg-emerald-600 text-white shadow-emerald-200' },
    { value: 'Bedah',    label: '🔪 Bedah',     selColor: 'bg-red-600 text-white shadow-red-200' },
];

export function DoctorFormModal({ isOpen, onClose, doctor, onSuccess }: DoctorFormModalProps) {
    const isEditing = !!doctor;
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const modalRef = React.useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        name: "",
        specialty: "",
        category: "NonBedah" as "NonBedah" | "Bedah",
        status: "LIBUR" as string,
        queueCode: "",
    });

    useEffect(() => { setMounted(true); }, []);

    // ESC to close
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Populate form on open
    useEffect(() => {
        if (!isOpen) return;
        if (doctor) {
            setFormData({
                name:      doctor.name ?? "",
                specialty: doctor.specialty ?? "",
                category:  doctor.category ?? "NonBedah",
                status:    doctor.status ?? "LIBUR",
                queueCode: doctor.queueCode ?? "",
            });
        } else {
            setFormData({ name: "", specialty: "", category: "NonBedah", status: "LIBUR", queueCode: "" });
        }
    }, [isOpen, doctor]);

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.specialty.trim()) return;
        setLoading(true);
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing
                ? { ...formData, id: doctor!.id }
                : { ...formData };

            const res = await fetch('/api/doctors', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.error || 'Terjadi kesalahan pada server');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message || "Gagal menyimpan data dokter");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const isValid = formData.name.trim() && formData.specialty.trim();

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="doctor-modal-title"
                className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
                style={{ animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
                    <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0",
                        isEditing ? "bg-blue-50" : "bg-slate-900"
                    )}>
                        {isEditing
                            ? <Stethoscope className="h-5 w-5 text-blue-600" />
                            : <Plus className="h-5 w-5 text-white" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 id="doctor-modal-title" className="text-[15px] font-black text-slate-900">
                            {isEditing ? 'Edit Dokter' : 'Tambah Dokter'}
                        </h3>
                        <p className="text-[12px] text-slate-400 mt-0.5">
                            {isEditing ? doctor?.name : 'Isi profil dokter di bawah ini'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Tutup"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* FORM */}
                <div className="p-6 space-y-5">
                    {/* Nama */}
                    <div>
                        <label htmlFor="doc-name" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <User size={10} /> Nama Lengkap
                        </label>
                        <input
                            id="doc-name"
                            autoFocus={!isEditing}
                            placeholder="dr. Ahmad Syauqi, Sp.B"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                        />
                    </div>

                    {/* Spesialisasi */}
                    <div>
                        <label htmlFor="doc-specialty" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <Tag size={10} /> Spesialisasi
                        </label>
                        <input
                            id="doc-specialty"
                            placeholder="Bedah Umum, Penyakit Dalam..."
                            value={formData.specialty}
                            onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                        />
                    </div>

                    {/* Kode Antrian */}
                    <div>
                        <label htmlFor="doc-queue" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <Hash size={10} /> Kode Antrian
                        </label>
                        <input
                            id="doc-queue"
                            placeholder="A-01"
                            value={formData.queueCode}
                            onChange={e => setFormData({ ...formData, queueCode: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-center placeholder:text-slate-300 uppercase"
                        />
                    </div>

                    {/* Kategori */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Kategori
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: opt.value as any })}
                                    className={cn(
                                        "py-3 rounded-xl text-[13px] font-bold transition-all shadow-sm",
                                        formData.category === opt.value
                                            ? `${opt.selColor} shadow-md`
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <Activity size={10} /> Status Awal
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
                                            ? `${opt.activeBg} text-white shadow-sm`
                                            : `bg-slate-100 ${opt.color} hover:bg-slate-200`
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 pb-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !isValid}
                        className={cn(
                            "flex-[2] py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                            !loading && isValid
                                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <span className="animate-pulse">Menyimpan...</span>
                        ) : (
                            <>
                                {isEditing ? <Save size={15} /> : <Plus size={15} />}
                                {isEditing ? 'Simpan Perubahan' : 'Tambah Dokter'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`@keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>,
        document.body
    );
}
