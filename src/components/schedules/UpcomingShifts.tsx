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
        <div className="w-80 border-l border-white/[0.04] bg-slate-950/30 backdrop-blur-xl h-full ml-0 hidden xl:flex flex-col">

            {/* ── All Doctors List (Full Sidebar) ───────────── */}
            <div className="p-5 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users size={12} className="text-violet-400" />
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Semua Dokter</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] text-slate-500 font-bold">{filteredDoctors.length}</span>
                        <button
                            onClick={handleAdd}
                            className="bg-violet-600 hover:bg-violet-500 text-white p-1 rounded-md transition-colors shadow-lg shadow-violet-500/20"
                            title="Tambah Dokter"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 h-3 w-3" />
                    <input
                        type="text"
                        placeholder="Cari dokter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/[0.05] rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredDoctors.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => handleDoctorClick(doc)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group cursor-pointer relative"
                        >
                            <Avatar className="h-8 w-8">
                                {doc.image ? (
                                    <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                                ) : (
                                    <AvatarFallback className="bg-slate-800 text-[10px] font-bold text-slate-400 group-hover:text-white group-hover:bg-violet-500 transition-colors">
                                        {doc.queueCode || getInitials(doc.name)}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-slate-300 truncate group-hover:text-white transition-colors">{doc.name}</p>
                                <p className="text-[9px] text-slate-600 truncate">{doc.specialty}</p>
                            </div>

                            {/* CRUD Actions (Visible on Hover) */}
                            <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 p-0.5 rounded-md backdrop-blur-sm">
                                <button
                                    onClick={(e) => handleEdit(e, doc)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={10} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, doc.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                    title="Hapus"
                                >
                                    <Trash2 size={10} />
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
