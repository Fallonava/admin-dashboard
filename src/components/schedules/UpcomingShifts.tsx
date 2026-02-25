"use client";

import { useEffect, useState } from "react";
import { Users, Search, Plus, Edit2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Shift, Doctor } from "@/lib/data-service";
import { ScheduleModal } from "./ScheduleModal";
import { DoctorFormModal } from "./DoctorFormModal";

export function UpcomingShifts() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // CRUD State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchAll = async () => {
        try {
            const [sRes, dRes] = await Promise.all([
                fetch('/api/shifts'),
                fetch('/api/doctors')
            ]);
            setShifts(await sRes.json());
            setDoctors(await dRes.json());
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchAll();
        const iv = setInterval(fetchAll, 10000);
        return () => clearInterval(iv);
    }, []);

    // Filter doctors for list
    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Color hash for doctor initials
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const handleDoctorClick = (doc: Doctor) => {
        setSelectedDoctor(doc);
        setIsScheduleModalOpen(true);
    };

    const handleAdd = () => {
        setEditingDoctor(null);
        setIsFormOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, doc: Doctor) => {
        e.stopPropagation(); // Prevent opening schedule modal
        setEditingDoctor(doc);
        setIsFormOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string | number) => {
        e.stopPropagation();
        if (!confirm("Apakah Anda yakin ingin menghapus dokter ini?")) return;

        try {
            await fetch(`/api/doctors?id=${id}`, { method: 'DELETE' });
            fetchAll();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="w-[340px] super-glass h-full ml-0 hidden xl:flex flex-col z-10">

            {/* ── All Doctors List (Full Sidebar) ───────────── */}
            <div className="p-6 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Semua Dokter</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-md">{filteredDoctors.length}</span>
                        <button
                            onClick={handleAdd}
                            className="bg-primary hover:bg-primary/90 text-white p-1.5 rounded-lg transition-transform active:scale-95 shadow-sm shadow-primary/20"
                            title="Tambah Dokter"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-5 group">
                    <div className="absolute -inset-0.5 bg-primary/10 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Cari dokter..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/40 backdrop-blur-md rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_10px_-3px_rgba(0,0,0,0.02)] focus:bg-white/60"
                        />
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {filteredDoctors.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => handleDoctorClick(doc)}
                            className="w-full flex items-center gap-4 p-2.5 rounded-2xl hover:bg-white/40 hover:shadow-[0_4px_14px_-2px_rgba(0,0,0,0.05)] hover:border-white/50 transition-all text-left group cursor-pointer relative"
                        >
                            <Avatar className="h-10 w-10 border-200/50 shadow-sm group-hover:scale-105 transition-transform">
                                {doc.image ? (
                                    <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                                ) : (
                                    <AvatarFallback className="bg-slate-100 text-[11px] font-extrabold text-slate-500 group-hover:text-primary transition-colors">
                                        {doc.queueCode || getInitials(doc.name)}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{doc.name}</p>
                                <p className="text-[10px] text-muted-foreground font-medium truncate">{doc.specialty}</p>
                            </div>

                            {/* CRUD Actions (Visible on Hover) */}
                            <div className="absolute right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 bg-white/60 p-1.5 rounded-xl shadow-sm backdrop-blur-xl">
                                <button
                                    onClick={(e) => handleEdit(e, doc)}
                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, doc.id)}
                                    className="p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    title="Hapus"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ScheduleModal
                doctor={selectedDoctor}
                shifts={shifts}
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onUpdate={fetchAll}
            />

            <DoctorFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                doctor={editingDoctor}
                onSuccess={fetchAll}
            />
        </div>
    );
}
