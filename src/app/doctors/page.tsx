"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { Plus, Search, Edit2, Trash2, UserRound, Activity, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";
import { DoctorFormModal } from "@/components/schedules/DoctorFormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Palet warna avatar berdasarkan indeks — Apple 2026 gradient style
const avatarGradients = [
    "from-blue-500 to-cyan-400",
    "from-violet-500 to-purple-400",
    "from-rose-500 to-pink-400",
    "from-amber-500 to-orange-400",
    "from-emerald-500 to-teal-400",
    "from-indigo-500 to-blue-400",
    "from-fuchsia-500 to-pink-400",
    "from-sky-500 to-cyan-400",
];

// Map status ke konfigurasi visual
const statusConfig: Record<string, { label: string; color: string; bg: string; dot?: string; pulse?: boolean }> = {
    'BUKA': { label: 'Aktif', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    'OPERASI': { label: 'Operasi', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', pulse: true },
    'PENUH': { label: 'Penuh', color: 'text-amber-600', bg: 'bg-amber-50' },
    'CUTI': { label: 'Cuti', color: 'text-purple-600', bg: 'bg-purple-50' },
    'SELESAI': { label: 'Selesai', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'TIDAK PRAKTEK': { label: 'Tidak Aktif', color: 'text-slate-400', bg: 'bg-slate-50' },
};

export default function DoctorsPage() {
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 200);
    const [activeFilter, setActiveFilter] = useState<"Semua" | "Bedah" | "NonBedah">("Semua");

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (doc: Doctor) => {
        setEditingDoctor(doc);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingDoctor(undefined);
    };

    const handleDeleteClick = (id: string | number) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await fetch(`/api/doctors?id=${deleteId}`, { method: 'DELETE' });
            mutate('/api/doctors');
            setDeleteId(null);
        } catch (error) {
            console.error("Gagal menghapus dokter", error);
            alert("Gagal menghapus dokter");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredDoctors = useMemo(() => doctors.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            d.specialty.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesFilter = activeFilter === "Semua" ? true : d.category === activeFilter;
        return matchesSearch && matchesFilter;
    }), [doctors, debouncedSearch, activeFilter]);

    const { totalPraktik, totalOperasi, totalCuti, totalBedah, totalNonBedah } = useMemo(() => ({
        totalPraktik: doctors.filter(d => d.status === 'BUKA' || d.status === 'PENUH').length,
        totalOperasi: doctors.filter(d => d.status === 'OPERASI').length,
        totalCuti: doctors.filter(d => d.status === 'CUTI').length,
        totalBedah: doctors.filter(d => d.category === 'Bedah').length,
        totalNonBedah: doctors.filter(d => d.category === 'NonBedah').length,
    }), [doctors]);

    const getStatusConfig = (status: string | null | undefined) => {
        if (!status) return { label: 'Auto', color: 'text-slate-400', bg: 'bg-slate-50' };
        return statusConfig[status] || { label: status, color: 'text-slate-400', bg: 'bg-slate-50' };
    };

    return (
        <div className="w-full h-full flex flex-col px-2 lg:px-4">
            {/* ═══════════════════ HEADER ═══════════════════ */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4 flex-shrink-0 pl-12 lg:pl-0 relative z-10 w-full rounded-[32px] p-1">
                {/* Subtle animated background layer */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[150px] bg-blue-500/10 rounded-full blur-[60px] animate-pulse pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-[22px] shadow-[0_12px_24px_-8px_rgba(79,70,229,0.7)] text-white flex-shrink-0 relative overflow-hidden group">
                        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                        <Users size={26} className="relative z-10 drop-shadow-md" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-2">
                            <span className="text-slate-900 drop-shadow-sm">Direktori</span>
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                Dokter
                            </span>
                        </h1>
                        <p className="text-sm lg:text-base text-slate-500/90 font-medium mt-1">
                            Kelola profil dan jadwal tayang dokter secara real-time
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-5 flex-wrap relative z-10">
                    {/* Stats Mini - Ultra Premium Level */}
                    <div className="hidden lg:flex items-center gap-6 bg-white/70 backdrop-blur-2xl px-6 py-3 rounded-[24px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-white/60">
                        <div className="text-center group cursor-default">
                            <p className="text-2xl font-black text-slate-800 leading-none group-hover:scale-110 transition-transform duration-300 shadow-blue-500/10">{doctors.length}</p>
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-1.5 border-b border-transparent group-hover:border-slate-300 transition-colors">Total</p>
                        </div>
                        <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                        <div className="text-center group cursor-default">
                            <p className="text-2xl font-black text-rose-500 leading-none group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{totalBedah}</p>
                            <p className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest mt-1.5 border-b border-transparent group-hover:border-rose-200 transition-colors">Bedah</p>
                        </div>
                        <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                        <div className="text-center group cursor-default">
                            <p className="text-2xl font-black text-emerald-500 leading-none group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{totalNonBedah}</p>
                            <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest mt-1.5 border-b border-transparent group-hover:border-emerald-200 transition-colors">Non Bedah</p>
                        </div>
                    </div>

                    <button
                        onClick={() => { setEditingDoctor(undefined); setIsFormOpen(true); }}
                        className="bg-slate-900 text-white px-6 py-3.5 rounded-[24px] flex items-center gap-2.5 font-bold text-sm shadow-[0_8px_20px_-6px_rgba(15,23,42,0.6)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.8)] hover:bg-slate-800 hover:-translate-y-1 transition-all duration-400 active:scale-95 group relative overflow-hidden ring-1 ring-slate-900/5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                        <Plus size={18} className="relative z-10 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="relative z-10 tracking-wide">Tambah Dokter</span>
                    </button>
                </div>
            </header>

            {/* ═══════════════════ TOOLBAR PENCARIAN & FILTER ═══════════════════ */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8 relative z-10 w-full max-w-4xl">
                {/* Kolom Pencarian Premium */}
                <div className="relative flex-1 w-full group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[24px] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari nama dokter atau spesialisasi..."
                            className="w-full bg-white/70 backdrop-blur-xl rounded-[24px] pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_12px_-4px_rgba(0,0,0,0.05)] focus:bg-white/95 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400 border border-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Kategori - Premium Segmented Control */}
                <div className="flex items-center bg-white/60 backdrop-blur-xl rounded-[24px] p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_12px_-4px_rgba(0,0,0,0.05)] w-full md:w-auto relative border border-white overflow-hidden">
                    {/* Animated Glider Background */}
                    <div
                        className="absolute top-1 bottom-1 rounded-[20px] bg-slate-900 shadow-md transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                        style={{
                            width: activeFilter === 'Semua' ? '33.33%' : activeFilter === 'Bedah' ? '33.33%' : '33.33%',
                            left: activeFilter === 'Semua' ? '4px' : activeFilter === 'Bedah' ? 'calc(33.33% + 4px)' : 'calc(66.66% + 4px)'
                        }}
                    />

                    {([
                        { key: "Semua" as const, label: "Semua", count: doctors.length },
                        { key: "Bedah" as const, label: "Bedah", count: totalBedah },
                        { key: "NonBedah" as const, label: "Non Bedah", count: totalNonBedah },
                    ]).map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setActiveFilter(filter.key)}
                            className={cn(
                                "relative z-10 flex-1 min-w-[100px] px-4 py-3 rounded-[20px] text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2",
                                activeFilter === filter.key
                                    ? "text-white"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <span>{filter.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════════════════ GRID KARTU DOKTER ═══════════════════ */}
            {filteredDoctors.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-24 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-28 w-28 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-[32px] flex items-center justify-center mb-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_12px_24px_-8px_rgba(99,102,241,0.15)] ring-1 ring-white">
                        <UserRound size={44} className="text-blue-400/80 drop-shadow-sm" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Tidak Ada Dokter</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-sm leading-relaxed">
                        Kami tidak dapat menemukan nama dokter dengan pencarian tersebut. Coba ubah kata kunci Anda.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-6 overflow-y-auto pb-10 custom-scrollbar px-1">
                    {filteredDoctors.map((doc, idx) => {
                        const gradientClass = avatarGradients[idx % avatarGradients.length];
                        const status = getStatusConfig(doc.status);

                        return (
                            <div
                                key={doc.id}
                                className="group bg-white/70 backdrop-blur-2xl p-6 rounded-[32px] flex flex-col min-h-[190px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_-4px_rgba(0,0,0,0.03)] border border-white hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-400 relative overflow-hidden"
                            >
                                {/* Glowing ambient light inside card */}
                                <div className={cn("absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br rounded-full opacity-[0.08] blur-2xl group-hover:opacity-[0.15] transition-opacity duration-500", gradientClass)} />

                                {/* ── Baris Atas: Avatar + Info ── */}
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={cn(
                                            "h-16 w-16 rounded-[22px] bg-gradient-to-br flex items-center justify-center text-white font-black text-2xl shadow-lg ring-1 ring-white/20 group-hover:scale-[1.03] group-hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.2)] transition-all duration-400",
                                            gradientClass
                                        )}>
                                            {doc.queueCode || doc.name.charAt(0)}
                                        </div>
                                        {/* Status Dot */}
                                        {status.dot && (
                                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                                {status.pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", status.dot)} />}
                                                <span className={cn("relative inline-flex rounded-full h-4 w-4 ring-[3px] ring-white shadow-sm", status.dot)} />
                                            </span>
                                        )}
                                    </div>

                                    {/* Nama & Spesialisasi */}
                                    <div className="flex-1 min-w-0 pr-8">
                                        <h3 className="font-extrabold text-slate-800 text-lg tracking-tight leading-tight truncate group-hover:text-blue-600 transition-colors">
                                            {doc.name}
                                        </h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] truncate mt-1">
                                            {doc.specialty}
                                        </p>
                                    </div>
                                </div>

                                {/* ── Badges Kategori & Status ── */}
                                <div className="mt-auto flex items-center justify-between gap-3 relative z-10">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-[10px] px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider backdrop-blur-sm border shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]",
                                        doc.category === 'Bedah'
                                            ? "text-rose-600 bg-rose-50/80 border-rose-100/50"
                                            : "text-emerald-600 bg-emerald-50/80 border-emerald-100/50"
                                    )}>
                                        <Activity size={10} strokeWidth={2.5} />
                                        {doc.category === 'NonBedah' ? 'Non Bedah' : doc.category}
                                    </span>

                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-[10px] px-3.5 py-1.5 rounded-xl font-black uppercase tracking-wider backdrop-blur-sm border shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]",
                                        status.color, status.bg, "border-transparent text-opacity-90",
                                        status.pulse && "animate-pulse"
                                    )}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* ── Tombol Aksi Hover ── */}
                                <div className="absolute top-4 right-4 flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 z-20">
                                    <button
                                        onClick={() => handleEdit(doc)}
                                        className="h-9 w-9 flex items-center justify-center rounded-[14px] bg-white/90 backdrop-blur-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] border border-slate-100 transition-all duration-200 hover:scale-105 active:scale-95"
                                        title="Edit Dokter"
                                    >
                                        <Edit2 size={14} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(doc.id)}
                                        className="h-9 w-9 flex items-center justify-center rounded-[14px] bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] border border-slate-100 transition-all duration-200 hover:scale-105 active:scale-95"
                                        title="Hapus Dokter"
                                    >
                                        <Trash2 size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══════════════════ MODALS ═══════════════════ */}
            <DoctorFormModal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                doctor={editingDoctor || null}
                onSuccess={() => mutate('/api/doctors')}
            />

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Dokter"
                description="Apakah Anda yakin ingin menghapus dokter ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
