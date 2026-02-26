"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Plus, Search, Edit2, Trash2, UserRound, Activity } from "lucide-react";
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

    const filteredDoctors = doctors.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === "Semua" ? true : d.category === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const totalAktif = doctors.filter(d => d.status === 'BUKA' || d.status === 'OPERASI').length;
    const totalBedah = doctors.filter(d => d.category === 'Bedah').length;
    const totalNonBedah = doctors.filter(d => d.category === 'NonBedah').length;

    const getStatusConfig = (status: string | null | undefined) => {
        if (!status) return { label: 'Auto', color: 'text-slate-400', bg: 'bg-slate-50' };
        return statusConfig[status] || { label: status, color: 'text-slate-400', bg: 'bg-slate-50' };
    };

    return (
        <div className="w-full h-full flex flex-col px-2 lg:px-4">
            {/* ═══════════════════ HEADER KOMPAK ═══════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Direktori <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Dokter</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium mt-1">Kelola profil dan jadwal tayang dokter</p>
                </div>

                <div className="flex items-center gap-5">
                    {/* Stats Mini */}
                    <div className="hidden lg:flex items-center gap-4 text-center">
                        <div>
                            <p className="text-2xl font-black text-slate-800">{doctors.length}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200/60" />
                        <div>
                            <p className="text-2xl font-black text-blue-600">{totalAktif}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aktif</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200/60" />
                        <div>
                            <p className="text-2xl font-black text-rose-500">{totalBedah}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bedah</p>
                        </div>
                    </div>

                    <button
                        onClick={() => { setEditingDoctor(undefined); setIsFormOpen(true); }}
                        className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 font-bold text-sm shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
                    >
                        <Plus size={16} />
                        <span>Tambah Dokter</span>
                    </button>
                </div>
            </div>

            {/* ═══════════════════ TOOLBAR PENCARIAN & FILTER ═══════════════════ */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                {/* Kolom Pencarian */}
                <div className="relative flex-1 w-full group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[24px] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Cari nama dokter atau spesialisasi..."
                            className="w-full bg-white/60 backdrop-blur-xl rounded-[24px] pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_10px_-3px_rgba(0,0,0,0.02)] focus:bg-white/90 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Kategori */}
                <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-xl rounded-[24px] p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_10px_-3px_rgba(0,0,0,0.02)] w-full md:w-auto">
                    {([
                        { key: "Semua" as const, label: "Semua", count: doctors.length },
                        { key: "Bedah" as const, label: "Bedah", count: totalBedah },
                        { key: "NonBedah" as const, label: "Non Bedah", count: totalNonBedah },
                    ]).map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setActiveFilter(filter.key)}
                            className={cn(
                                "px-5 py-2.5 flex-shrink-0 rounded-[20px] text-xs font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2",
                                activeFilter === filter.key
                                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/80"
                            )}
                        >
                            <span>{filter.label}</span>
                            <span className={cn(
                                "text-[10px] font-black px-1.5 py-0.5 rounded-lg min-w-[20px] text-center transition-colors",
                                activeFilter === filter.key
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-200/50 text-slate-500"
                            )}>
                                {filter.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════════════════ GRID KARTU DOKTER ═══════════════════ */}
            {filteredDoctors.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-24">
                    <div className="h-28 w-28 bg-white/60 backdrop-blur-xl rounded-[32px] flex items-center justify-center mb-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_20px_40px_-8px_rgba(0,0,0,0.05)]">
                        <UserRound size={44} className="text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3">Tidak Ada Dokter</h3>
                    <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
                        Coba sesuaikan kata kunci pencarian atau ubah filter kategori yang aktif.
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
                                className="super-glass-card group p-6 rounded-[32px] flex flex-col min-h-[180px]"
                            >
                                {/* Gradient accent bar di atas */}
                                <div className={cn("absolute top-0 left-8 right-8 h-1.5 rounded-b-full bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity duration-500", gradientClass)} />

                                {/* ── Baris Atas: Avatar + Info ── */}
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={cn(
                                            "h-16 w-16 rounded-[20px] bg-gradient-to-br flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform duration-500",
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
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-slate-800 text-lg tracking-tight leading-tight truncate group-hover:text-blue-600 transition-colors">
                                            {doc.name}
                                        </h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] truncate mt-1">
                                            {doc.specialty}
                                        </p>
                                    </div>
                                </div>

                                {/* ── Badges Kategori & Status ── */}
                                <div className="mt-auto flex items-center justify-between gap-3 relative z-10">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-wider backdrop-blur-sm shadow-sm",
                                        doc.category === 'Bedah'
                                            ? "text-rose-600 bg-rose-50 border border-rose-100/50"
                                            : "text-emerald-600 bg-emerald-50 border border-emerald-100/50"
                                    )}>
                                        <Activity size={10} />
                                        {doc.category === 'NonBedah' ? 'Non Bedah' : doc.category}
                                    </span>

                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-wider backdrop-blur-sm shadow-sm border border-transparent",
                                        status.color, status.bg,
                                        status.pulse && "animate-pulse"
                                    )}>
                                        {status.dot && <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", status.dot)} />}
                                        {status.label}
                                    </span>
                                </div>

                                {/* ── Tombol Aksi Hover ── */}
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-400 z-20">
                                    <button
                                        onClick={() => handleEdit(doc)}
                                        className="p-2.5 rounded-[14px] bg-white/80 backdrop-blur-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow-md border border-slate-100 transition-all duration-300 active:scale-95"
                                        title="Edit Dokter"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(doc.id)}
                                        className="p-2.5 rounded-[14px] bg-white/80 backdrop-blur-md text-slate-400 hover:text-red-600 hover:bg-red-50 shadow-sm hover:shadow-md border border-slate-100 transition-all duration-300 active:scale-95"
                                        title="Hapus Dokter"
                                    >
                                        <Trash2 size={16} />
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
