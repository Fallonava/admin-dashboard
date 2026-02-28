import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays } from "lucide-react";
import useSWR from "swr";
import type { Doctor } from "@/lib/data-service";

const TIPE_CUTI = [
    { value: "Sakit", label: "🤒 Sakit" },
    { value: "Liburan", label: "🏖 Liburan" },
    { value: "Pribadi", label: "👤 Keperluan Pribadi" },
    { value: "Konferensi", label: "🎤 Konferensi / Seminar" },
    { value: "Lainnya", label: "📋 Lainnya" },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

export function LeaveRequestModal({ isOpen, onClose, onSubmit }: Props) {
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const [form, setForm] = useState({
        doctor: "",
        type: "Sakit",
        startDate: "",
        endDate: "",
        reason: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!isOpen || !mounted) return null;

    const isValid = form.doctor && form.startDate && form.endDate;
    const isEndBeforeStart = form.endDate && form.startDate && new Date(form.endDate) < new Date(form.startDate);

    const handleSubmit = async () => {
        if (!isValid || isEndBeforeStart) return;
        setIsSubmitting(true);
        try {
            await onSubmit({
                doctor: form.doctor,
                type: form.type,
                dates: `${form.startDate} - ${form.endDate}`,
                reason: form.reason,
                avatar: "/avatars/default.png",
            });
            setForm({ doctor: "", type: "Sakit", startDate: "", endDate: "", reason: "" });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <CalendarDays className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800">Tambah Cuti</h3>
                            <p className="text-xs text-slate-400">Catat jadwal cuti dokter</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Dokter */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Nama Dokter
                        </label>
                        <select
                            className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                            value={form.doctor}
                            onChange={e => setForm({ ...form, doctor: e.target.value })}
                        >
                            <option value="" disabled>Pilih dokter...</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.name}>{doc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tipe */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Jenis Cuti
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPE_CUTI.map((t, i) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: t.value })}
                                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${i === TIPE_CUTI.length - 1 && TIPE_CUTI.length % 2 !== 0 ? "col-span-2 text-center" : ""
                                        } ${form.type === t.value
                                            ? "bg-slate-900 text-white shadow-md"
                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tanggal */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Mulai
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                                value={form.startDate}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Selesai
                            </label>
                            <input
                                type="date"
                                className={`w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 transition-all ${isEndBeforeStart ? "ring-2 ring-red-300 bg-red-50" : "focus:ring-emerald-500/20 focus:bg-white"
                                    }`}
                                value={form.endDate}
                                min={form.startDate}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    {isEndBeforeStart && (
                        <p className="text-xs text-red-500 font-medium -mt-2">Tanggal selesai tidak boleh sebelum tanggal mulai</p>
                    )}

                    {/* Keterangan (opsional) */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Keterangan <span className="normal-case font-medium">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Tambahkan keterangan..."
                            className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || !!isEndBeforeStart || isSubmitting}
                        className="w-full py-3.5 mt-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.98]"
                    >
                        {isSubmitting ? "Menyimpan..." : "Simpan Cuti"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
