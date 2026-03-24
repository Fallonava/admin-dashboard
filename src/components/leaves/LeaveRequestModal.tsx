import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays, Search } from "lucide-react";
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
    const [doctorSearch, setDoctorSearch] = useState("");
    const [isDoctorListOpen, setIsDoctorListOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const filteredDoctors = useMemo(
        () =>
            doctors.filter(doc =>
                doc.name.toLowerCase().includes(doctorSearch.toLowerCase())
            ),
        [doctors, doctorSearch]
    );

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
                startDate: form.startDate,
                endDate: form.endDate,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white/95 backdrop-blur-2xl rounded-[40px] p-6 sm:p-8 w-full max-w-sm shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] border border-white/80 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Modal Ambient Glow */}
                <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-emerald-300/30 to-teal-300/30 blur-[60px] -z-10 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100/60 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[20px] bg-gradient-to-tr from-emerald-100 to-teal-100 shadow-inner border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                            <CalendarDays className="h-6 w-6" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Tambah Cuti</h3>
                            <p className="text-[13px] font-bold text-emerald-600/80 uppercase tracking-widest mt-0.5">Catat Jadwal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Dokter - Combobox modern */}
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2 px-1">
                            Nama Dokter
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                className="w-full bg-slate-50/50 backdrop-blur-sm rounded-[24px] px-5 py-3.5 text-sm font-bold text-slate-700 border border-slate-200/60 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-400 transition-all flex items-center justify-between group hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                                aria-haspopup="listbox"
                                aria-expanded={isDoctorListOpen}
                                onClick={() => {
                                    setIsDoctorListOpen((prev) => !prev);
                                    setTimeout(() => {
                                        setHighlightedIndex(0);
                                    }, 0);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                                        e.preventDefault();
                                        if (!isDoctorListOpen) {
                                            setIsDoctorListOpen(true);
                                            setHighlightedIndex(0);
                                        }
                                    }
                                }}
                            >
                                <span className={form.doctor ? "truncate text-slate-800" : "text-slate-400"}>
                                    {form.doctor || "Pilih dokter..."}
                                </span>
                                <Search className="h-4 w-4 text-slate-400 ml-2 flex-shrink-0 group-hover:text-emerald-500 transition-colors" />
                            </button>

                            {isDoctorListOpen && (
                                <div className="absolute z-50 mt-2 w-full rounded-[24px] bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 max-h-56 overflow-hidden py-2 flex flex-col">
                                    <div className="px-3 pb-2 pt-1 border-b border-slate-100 relative z-10 shrink-0">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Ketik nama atau spesialisasi..."
                                                className="w-full bg-slate-50/80 backdrop-blur-sm rounded-[16px] pl-9 pr-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-slate-300 border border-slate-200/50"
                                                value={doctorSearch}
                                                onChange={(e) => {
                                                    setDoctorSearch(e.target.value);
                                                    setHighlightedIndex(0);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "ArrowDown") {
                                                        e.preventDefault();
                                                        setHighlightedIndex((prev) =>
                                                            prev < filteredDoctors.length - 1 ? prev + 1 : prev
                                                        );
                                                    } else if (e.key === "ArrowUp") {
                                                        e.preventDefault();
                                                        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                                                    } else if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        const doc = filteredDoctors[highlightedIndex];
                                                        if (doc) {
                                                            setForm({ ...form, doctor: doc.name });
                                                            setIsDoctorListOpen(false);
                                                        }
                                                    } else if (e.key === "Escape") {
                                                        e.preventDefault();
                                                        setIsDoctorListOpen(false);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ul role="listbox" className="py-1">
                                        {filteredDoctors.length === 0 ? (
                                            <li className="px-4 py-2 text-[11px] text-slate-400">
                                                Tidak ada dokter ditemukan
                                            </li>
                                        ) : (
                                            filteredDoctors.map((doc, index) => (
                                                <li
                                                    key={doc.id}
                                                    role="option"
                                                    aria-selected={form.doctor === doc.name}
                                                    className={`px-4 py-2 text-xs cursor-pointer flex items-center justify-between ${
                                                        index === highlightedIndex
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "hover:bg-slate-50 text-slate-700"
                                                    }`}
                                                    onMouseEnter={() => setHighlightedIndex(index)}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setForm({ ...form, doctor: doc.name });
                                                        setIsDoctorListOpen(false);
                                                    }}
                                                >
                                                    <span className="truncate">{doc.name}</span>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tipe */}
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2 px-1">
                            Jenis Cuti
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPE_CUTI.map((t, i) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: t.value })}
                                    className={`px-3 py-3 rounded-[16px] text-xs font-bold text-left transition-all ${i === TIPE_CUTI.length - 1 && TIPE_CUTI.length % 2 !== 0 ? "col-span-2 text-center" : ""
                                        } ${form.type === t.value
                                            ? "bg-slate-800 text-white shadow-md scale-100 ring-2 ring-slate-800/20 ring-offset-1"
                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100 scale-95 hover:scale-100"
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
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2 px-1">
                                Mulai
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-50/50 backdrop-blur-sm rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 border border-slate-200/60 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-400 transition-all shadow-sm"
                                value={form.startDate}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2 px-1">
                                Selesai
                            </label>
                            <input
                                type="date"
                                className={`w-full bg-slate-50/50 backdrop-blur-sm rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 border border-slate-200/60 outline-none focus:ring-4 transition-all shadow-sm ${isEndBeforeStart ? "ring-2 ring-red-300 bg-red-50 border-red-300" : "focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-400"
                                    }`}
                                value={form.endDate}
                                min={form.startDate}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    {isEndBeforeStart && (
                        <p className="text-xs text-red-500 font-bold -mt-2 px-2">Tanggal selesai tidak valid</p>
                    )}

                    {/* Keterangan */}
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2 px-1">
                            Keterangan <span className="normal-case font-medium">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Tambahkan keterangan..."
                            className="w-full bg-slate-50/50 backdrop-blur-sm rounded-[24px] px-5 py-3.5 text-sm font-bold text-slate-700 border border-slate-200/60 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300 shadow-sm"
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || !!isEndBeforeStart || isSubmitting}
                        className="w-full h-14 mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white rounded-[24px] font-black text-sm transition-all shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] active:scale-95 group relative overflow-hidden flex items-center justify-center"
                    >
                        <div className="absolute inset-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-shimmer" />
                        <span className="relative z-10">{isSubmitting ? "Menyimpan..." : "Simpan Cuti"}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
