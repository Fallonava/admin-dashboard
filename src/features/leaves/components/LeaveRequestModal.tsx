import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays, Search } from "lucide-react";
import useSWR from "swr";
import type { Doctor } from "@/lib/data-service";
import { cn } from "@/lib/utils";

const TIPE_CUTI = [
    { value: "Sakit", label: "🤒 Sakit" },
    { value: "Liburan", label: "🏖 Liburan" },
    { value: "Pribadi", label: "👤 Pribadi" },
    { value: "Konferensi", label: "🎤 Seminar" },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
            <div className="clay-surface rounded-[32px] p-6 sm:p-7 w-full max-w-sm animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/60 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-[18px] clay-pill-emerald flex items-center justify-center text-white">
                            <CalendarDays className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100 tracking-tight">Tambah Cuti</h3>
                            <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">Catat Jadwal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-[12px] clay-button text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all active:scale-95"
                    >
                        <X size={15} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="space-y-3.5">
                    {/* Dokter - Combobox */}
                    <div>
                        <label className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5 px-1">
                            Nama Dokter
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                className="w-full clay-inset rounded-[18px] px-4 py-3 text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-100 outline-none flex items-center justify-between transition-all"
                                aria-haspopup="listbox"
                                aria-expanded={isDoctorListOpen}
                                onClick={() => {
                                    setIsDoctorListOpen((prev) => !prev);
                                    setTimeout(() => { setHighlightedIndex(0); }, 0);
                                }}
                            >
                                <span className={form.doctor ? "truncate text-zinc-800 dark:text-zinc-100" : "text-zinc-400"}>
                                    {form.doctor || "Pilih dokter..."}
                                </span>
                                <Search className="h-4 w-4 text-zinc-400 ml-2 shrink-0" />
                            </button>

                            {isDoctorListOpen && (
                                <div className="absolute z-50 mt-2 w-full rounded-[22px] clay-surface max-h-52 overflow-hidden py-2 flex flex-col">
                                    <div className="px-3 pb-2 pt-1 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Cari dokter..."
                                                className="w-full clay-inset rounded-[14px] pl-8 pr-3 py-1.5 text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
                                                value={doctorSearch}
                                                onChange={(e) => {
                                                    setDoctorSearch(e.target.value);
                                                    setHighlightedIndex(0);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ul role="listbox" className="py-1 overflow-y-auto custom-scrollbar">
                                        {filteredDoctors.length === 0 ? (
                                            <li className="px-4 py-2 text-[11px] font-bold text-zinc-400">
                                                Tidak ada dokter ditemukan
                                            </li>
                                        ) : (
                                            filteredDoctors.map((doc, index) => (
                                                <li
                                                    key={doc.id}
                                                    role="option"
                                                    aria-selected={form.doctor === doc.name}
                                                    className={cn(
                                                        "px-4 py-2 text-xs font-black cursor-pointer flex items-center justify-between transition-colors",
                                                        index === highlightedIndex
                                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                                    )}
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

                    {/* Tipe Cuti */}
                    <div>
                        <label className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5 px-1">
                            Jenis Cuti
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {TIPE_CUTI.map((t, i) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: t.value })}
                                    className={cn(
                                        "px-3 py-2.5 rounded-[14px] text-xs font-black text-left transition-all active:scale-95",
                                        i === TIPE_CUTI.length - 1 && TIPE_CUTI.length % 2 !== 0 ? "col-span-2 text-center" : "",
                                        form.type === t.value
                                            ? "clay-pill-emerald text-white"
                                            : "clay-button text-zinc-600 dark:text-zinc-400"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tanggal */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <label className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5 px-1">
                                Mulai
                            </label>
                            <input
                                type="date"
                                className="w-full clay-inset rounded-[16px] px-3 py-2.5 text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-100 outline-none"
                                value={form.startDate}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5 px-1">
                                Selesai
                            </label>
                            <input
                                type="date"
                                className={cn(
                                    "w-full clay-inset rounded-[16px] px-3 py-2.5 text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-100 outline-none",
                                    isEndBeforeStart && "ring-2 ring-rose-500"
                                )}
                                value={form.endDate}
                                min={form.startDate}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    {isEndBeforeStart && (
                        <p className="text-[11px] text-rose-500 font-black -mt-1 px-1">Tanggal selesai tidak valid</p>
                    )}

                    {/* Keterangan */}
                    <div>
                        <label className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5 px-1">
                            Keterangan <span className="normal-case font-medium text-zinc-400">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Tambahkan keterangan..."
                            className="w-full clay-inset rounded-[18px] px-4 py-2.5 text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || !!isEndBeforeStart || isSubmitting}
                        className="w-full h-12 mt-2 clay-pill-emerald text-white rounded-[20px] font-black text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
                    >
                        <span>{isSubmitting ? "Menyimpan..." : "Simpan Cuti"}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
