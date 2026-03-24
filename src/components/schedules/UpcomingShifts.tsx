"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";
import { Users, Search, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Shift, Doctor } from "@/lib/data-service";
import { ScheduleModal } from "./ScheduleModal";
import { DoctorFormModal } from "./DoctorFormModal";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";

// Color hash for doctor initials
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export function UpcomingShifts() {
    const { data: shifts = [] } = useSWR<Shift[]>('/api/shifts');
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // CRUD State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 400); // Increased delay
    const isSearching = searchQuery !== debouncedSearch;

    const parentRef = useRef<HTMLDivElement>(null);

    const fetchAll = () => {
        mutate((key: string) => typeof key === 'string' && key.startsWith('/api/shifts'));
        mutate('/api/doctors');
    };

    // WebSocket Integration
    const { socket } = useSocket('schedules');
    useEffect(() => {
        if (!socket) return;
        
        socket.on('schedule_changed', () => {
            fetchAll(); // Real-time UI refresh for all schedules
        });
        
        return () => {
            socket.off('schedule_changed');
        };
    }, [socket]);

    const filteredDoctors = useMemo(() => {
        return doctors.filter(d =>
            d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            d.specialty.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [doctors, debouncedSearch]);

    const rowVirtualizer = useVirtualizer({
        count: filteredDoctors.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 76,
        overscan: 5,
    });

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
        <div className="w-full lg:w-[320px] xl:w-[380px] bg-white/40 backdrop-blur-3xl rounded-[32px] min-h-[300px] lg:min-h-0 lg:h-full flex flex-col z-10 p-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-white/60 flex-shrink-0">

            {/* ── All Doctors List (Full Sidebar) ─────────────────── */}
            <div className="p-4 lg:p-6 flex-1 flex flex-col min-h-0 bg-white/40 rounded-[24px] border border-white/60">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/60 text-blue-600 rounded-[14px] shadow-sm border border-white/80">
                            <Users size={16} className="text-blue-600" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Semua Dokter</h3>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-[10px] text-slate-600 font-black bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-[10px] shadow-sm border border-white/80">{filteredDoctors.length}</span>
                        <button
                            onClick={handleAdd}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2 rounded-[14px] transition-all active:scale-95 shadow-[0_4px_14px_0_rgba(0,92,255,0.4)] hover:shadow-[0_8px_20px_-4px_rgba(0,92,255,0.5)] group relative overflow-hidden"
                            title="Tambah Dokter"
                        >
                            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-shimmer" />
                            <Plus size={14} className="relative z-10" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4 group">
                    <div className="absolute -inset-0.5 bg-blue-500/10 rounded-[20px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                    <div className="relative">
                        {isSearching ? (
                            <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                        )}
                        <input
                            type="text"
                            placeholder="Cari dokter..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/60 backdrop-blur-xl rounded-[18px] pl-10 pr-4 py-2.5 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none border border-white/80 focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm focus:bg-white/90"
                        />
                    </div>
                </div>

                {/* Scrollable List */}
                <div ref={parentRef} className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const doc = filteredDoctors[virtualRow.index];
                            return (
                                <div
                                    key={doc.id}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                        paddingBottom: '8px'
                                    }}
                                >
                                    <div
                                        onClick={() => handleDoctorClick(doc)}
                                        className="w-full h-full flex items-center gap-3 px-3 py-2.5 rounded-[18px] bg-white/40 hover:bg-white/80 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 text-left group cursor-pointer relative border border-white/60 hover:border-white"
                                    >
                                        <Avatar className="h-11 w-11 border-[2px] border-white/80 shadow-sm group-hover:scale-105 transition-transform duration-300 ring-1 ring-black/5">
                                            {doc.image ? (
                                                <Image src={doc.image} alt={doc.name} width={48} height={48} className="h-full w-full object-cover" />
                                            ) : (
                                                <AvatarFallback className="bg-gradient-to-br from-slate-100 to-white text-[12px] font-black text-slate-600 group-hover:text-blue-600 transition-colors">
                                                    {doc.queueCode || getInitials(doc.name)}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-black tracking-tight text-slate-800 truncate group-hover:text-blue-600 transition-colors">{doc.name}</p>
                                            <p className="text-[10.5px] text-slate-400 font-bold truncate mt-0.5 tracking-wide">{doc.specialty}</p>
                                        </div>

                                        {/* CRUD Actions (Visible on Hover) */}
                                        <div className="absolute right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 bg-white/90 backdrop-blur-xl p-1.5 rounded-[14px] shadow-sm border border-white/80">
                                            <button
                                                onClick={(e) => handleEdit(e, doc)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 rounded-[10px] transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 size={13} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, doc.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-[10px] transition-all"
                                                title="Hapus"
                                            >
                                                <Trash2 size={12} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
