"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import useSWR, { mutate } from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { Plus, Search, UserRound, Activity, Users, CheckSquare, Trash2, X, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";
import { DoctorFormModal } from "@/components/schedules/DoctorFormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { DoctorCard } from "@/components/doctors/DoctorCard";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";

// Custom Dropdown Component moved outside to prevent re-definitions on parent render
const CustomDropdown = ({ value, options, onChange, icon }: any) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find((o: any) => o.value === value)?.label || value;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative z-30" ref={containerRef}>
            <button 
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "w-full sm:w-auto flex items-center justify-between gap-1.5 sm:gap-2.5 bg-white rounded-[16px] px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold text-slate-600 outline-none shadow-sm hover:text-slate-900 border border-slate-200 transition-all whitespace-nowrap",
                    open && "ring-2 ring-slate-200 border-slate-300 bg-slate-50 shadow-md text-slate-900"
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="flex items-center gap-1.5 sm:gap-2 truncate">{icon} {selectedLabel}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-300 flex-shrink-0", open && "rotate-180")} />
            </button>
            
            <div className={cn(
                "absolute top-[calc(100%+8px)] left-0 w-full min-w-[180px] bg-white/95 backdrop-blur-xl rounded-[16px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-slate-100 p-1.5 transition-all duration-200 origin-top-left z-50 overflow-y-auto max-h-[250px] custom-scrollbar",
                open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}>
                {options.map((opt: any) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => { onChange(opt.value); setOpen(false); }}
                        className={cn(
                            "w-full text-left px-3 py-2 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-between group/item",
                            value === opt.value 
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                                : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                        )}
                    >
                        <span>{opt.label}</span>
                        {value === opt.value && (
                            <CheckSquare size={12} className="text-white" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function DoctorsPage() {
    const { data } = useSWR<Doctor[]>('/api/doctors');
    const doctors = data || [];

    // Local state for doctors to handle optimistic UI during drag-and-drop
    const [localDoctors, setLocalDoctors] = useState<Doctor[]>([]);
    useEffect(() => {
        // Sync with SWR data but keep order if previously dragged (unless SWR is fresh)
        if (data) {
            setLocalDoctors(data);
        }
    }, [data]);

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 400); // 400ms delay for visual feedback

    // isSearching checks if the user is typing but the debounce hasn't caught up yet
    const isSearching = searchTerm !== debouncedSearch;
    
    // Filters & Sorting
    const [catFilter, setCatFilter] = useState<"Semua" | "Bedah" | "NonBedah">("Semua");
    const [statusFilter, setStatusFilter] = useState<string>("Semua");
    const [sortMode, setSortMode] = useState<"default" | "A-Z" | "Z-A">("default");

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);

    // Bulk Select State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // DND States
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const isReorderEnabled = catFilter === "Semua" && statusFilter === "Semua" && sortMode === "default" && debouncedSearch === "";

    // ── Computed Data ──
    const filteredDoctors = useMemo(() => {
        let result = [...localDoctors];

        if (debouncedSearch) {
            result = result.filter(d => d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || d.specialty.toLowerCase().includes(debouncedSearch.toLowerCase()));
        }
        if (catFilter !== "Semua") {
            result = result.filter(d => d.category === catFilter);
        }
        if (statusFilter !== "Semua") {
            result = result.filter(d => statusFilter === "Aktif" ? (d.status === "BUKA" || d.status === "PENUH" || d.status === "OPERASI") : d.status === statusFilter.toUpperCase());
        }

        if (sortMode === "A-Z") result.sort((a,b) => a.name.localeCompare(b.name));
        if (sortMode === "Z-A") result.sort((a,b) => b.name.localeCompare(a.name));
        
        return result;
    }, [localDoctors, debouncedSearch, catFilter, statusFilter, sortMode]);

    const { totalCuti, totalBedah, totalNonBedah } = useMemo(() => ({
        totalCuti: doctors.filter(d => d.status === 'CUTI').length,
        totalBedah: doctors.filter(d => d.category === 'Bedah').length,
        totalNonBedah: doctors.filter(d => d.category === 'NonBedah').length,
    }), [doctors]);

    // ── Event Handlers ──
    const handleEdit = (doc: Doctor) => {
        setEditingDoctor(doc);
        setIsFormOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId && selectedIds.size === 0) return;
        setIsDeleting(true);
        try {
            if (deleteId) {
                // Delete single
                await fetch(`/api/doctors?id=${deleteId}`, { method: 'DELETE' });
            } else if (selectedIds.size > 0) {
                for (const id of Array.from(selectedIds)) {
                    await fetch(`/api/doctors?id=${id}`, { method: 'DELETE' });
                }
            }
            mutate('/api/doctors');
            setDeleteId(null);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Gagal menghapus dokter", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkStatusChange = async (newStatus: string) => {
        if (selectedIds.size === 0) return;
        try {
            const updates = Array.from(selectedIds).map(id => ({ id, status: newStatus }));
            await fetch('/api/doctors?action=bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            mutate('/api/doctors');
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Gagal update massal", error);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredDoctors.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredDoctors.map(d => d.id)));
        }
    };

    // ── DND Logic ──
    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = localDoctors.findIndex(d => d.id === active.id);
            const newIndex = localDoctors.findIndex(d => d.id === over.id);

            const reordered = arrayMove(localDoctors, oldIndex, newIndex);
            setLocalDoctors(reordered); // Optimistic

            // Prepare payload
            const payload = reordered.map((doc, idx) => ({ id: doc.id, order: idx }));
            
            try {
                await fetch('/api/doctors?action=reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                mutate('/api/doctors'); // Revalidate
            } catch (err) {
                console.error("Failed to reorder", err);
            }
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative -mx-4 lg:-mx-6 -mt-2 lg:-mt-6">
            <PageHeader
              icon={<Users size={20} className="text-white" />}
              title="Direktori Dokter"
              accentWord="Dokter"
              accentColor="text-blue-600"
              subtitle="Kelola profil dan jadwal tayang dokter secara real-time"
              iconGradient="from-blue-500 to-indigo-600"
              accentBarGradient="from-blue-500 via-indigo-500 to-violet-500"
              actions={
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="lg:hidden bg-white hover:bg-slate-50 rounded-xl p-2.5 shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 transition-all active:scale-95"
                  >
                    <CheckSquare size={18} />
                  </button>
                  <button
                    onClick={() => { setEditingDoctor(undefined); setIsFormOpen(true); }}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Plus size={16} />
                    <span>Tambah Dokter</span>
                  </button>
                </>
              }
            />

            <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-5 overflow-hidden">

            <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 mb-6 xl:mb-8 relative z-10 w-full items-center">
                {/* Search Input */}
                <div className="relative group w-full xl:w-[320px] shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[20px] blur-md opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative flex items-center w-full shadow-sm rounded-[20px] bg-white border border-slate-200 hover:border-blue-200 transition-all focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/10 group-focus-within:shadow-[0_4px_20px_rgba(59,130,246,0.08)]">
                        {isSearching ? (
                            <Loader2 className="absolute left-4 text-blue-500 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="absolute left-4 text-slate-400 h-4 w-4" />
                        )}
                        <input
                            type="search"
                            placeholder="Cari nama dokter..."
                            className="w-full bg-transparent pl-11 pr-10 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 text-slate-300 hover:text-slate-500 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-0.5"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Row - Flex Wrap to avoid clipping absolute dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 px-1 -mx-1 items-center w-full">
                    <div className="flex-shrink-0">
                        <CustomDropdown 
                            value={catFilter} 
                            onChange={setCatFilter}
                            options={[
                                { value: "Semua", label: "Semua Kategori" },
                                { value: "Bedah", label: "Bedah" },
                                { value: "NonBedah", label: "Non Bedah" },
                            ]}
                        />
                    </div>

                    <div className="flex-shrink-0">
                        <CustomDropdown 
                            value={statusFilter} 
                            onChange={setStatusFilter}
                            options={[
                                { value: "Semua", label: "Semua Status" },
                                { value: "Aktif", label: "Aktif (Tayang)" },
                                { value: "Cuti", label: "Cuti" },
                                { value: "Selesai", label: "Selesai" },
                                { value: "TIDAK_PRAKTEK", label: "Tidak Praktek" },
                            ]}
                        />
                    </div>

                    <div className="flex-shrink-0">
                        <CustomDropdown 
                            value={sortMode} 
                            onChange={setSortMode}
                            options={[
                                { value: "default", label: "Urutan Default" },
                                { value: "A-Z", label: "Abjad A-Z" },
                                { value: "Z-A", label: "Abjad Z-A" },
                            ]}
                        />
                    </div>
                    
                    {/* Desktop only Select All Icon */}
                    <button
                        onClick={toggleSelectAll}
                        title={selectedIds.size === filteredDoctors.length && filteredDoctors.length > 0 ? "Batal Pilih Semua" : "Pilih Semua"}
                        className="hidden xl:flex items-center justify-center w-[40px] h-[40px] bg-white rounded-[16px] shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all active:scale-95 ml-auto focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                        <CheckSquare className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Warning if DND is disabled */}
            {!isReorderEnabled && (
                <div className="mb-4 text-xs font-semibold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl inline-flex items-center gap-2">
                    <Activity size={14} /> Drag & Drop untuk mengurutkan dokter dinonaktifkan asaat pencarian/filter aktif.
                </div>
            )}

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
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragStart={handleDragStart} 
                    onDragEnd={isReorderEnabled ? handleDragEnd : undefined}
                >
                    <div className="flex-1 w-full min-h-0 mb-2">
                        <div className="h-full overflow-y-auto custom-scrollbar px-1 min-h-full pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-6">
                                <SortableContext items={filteredDoctors.map(d => d.id)} strategy={rectSortingStrategy}>
                                    {filteredDoctors.map((doc, idx) => (
                                        <DoctorCard 
                                            key={doc.id}
                                            doctor={doc}
                                            index={idx}
                                            isSelected={selectedIds.has(doc.id)}
                                            onToggleSelect={handleToggleSelect}
                                            onEdit={handleEdit}
                                            onDelete={(id) => { setDeleteId(id); setIsDeleting(true); }}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        </div>
                    </div>
                    
                    {/* Drag Overlay smoothly floats the card while moving */}
                    <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
                    }}>
                        {activeId ? (() => {
                            const actDoc = localDoctors.find(d => d.id === activeId);
                            if (!actDoc) return null;
                            const dIndex = localDoctors.findIndex(d => d.id === activeId);
                            return (
                                <DoctorCard 
                                    doctor={actDoc} 
                                    index={dIndex} 
                                    isSelected={selectedIds.has(activeId)}
                                    onToggleSelect={() => {}}
                                    onEdit={() => {}}
                                    onDelete={() => {}}
                                    isOverlay 
                                />
                            );
                        })() : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* ═══════════════════ FLOATING ACTION BAR (BULK) ═══════════════════ */}
            <div className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 max-w-[95vw] sm:max-w-none bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-2 sm:p-2.5 flex items-center transition-all duration-500 z-50 overflow-hidden",
                selectedIds.size > 0 ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
            )}>
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto custom-scrollbar-hide px-1">
                    <div className="bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 text-white shadow-sm shadow-blue-500/20 whitespace-nowrap flex-shrink-0">
                        <CheckSquare size={14} />
                        <span>{selectedIds.size} dipilih</span>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200 flex-shrink-0" />
                    
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                        <button onClick={() => handleBulkStatusChange('CUTI')} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-nowrap">Cuti</button>
                        <button onClick={() => handleBulkStatusChange('TIDAK_PRAKTEK')} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-nowrap">Nonaktif</button>
                        <button onClick={() => handleBulkStatusChange('BUKA')} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-nowrap">Buka</button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 flex-shrink-0" />

                    <button 
                        onClick={() => setIsDeleting(true)}
                        className="flex-shrink-0 flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 font-bold transition-colors border border-rose-100"
                        title="Hapus Massal"
                    >
                        <Trash2 size={16} />
                    </button>

                    <button onClick={() => setSelectedIds(new Set())} className="flex-shrink-0 flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 ml-0 sm:ml-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* ═══════════════════ MODALS ═══════════════════ */}
            <DoctorFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingDoctor(undefined); }}
                doctor={editingDoctor || null}
                onSuccess={() => mutate('/api/doctors')}
            />

            <ConfirmDialog
                isOpen={isDeleting}
                onClose={() => { setIsDeleting(false); setDeleteId(null); }}
                onConfirm={confirmDelete}
                title={deleteId ? "Hapus Dokter" : "Hapus Massal"}
                description={`Apakah Anda yakin ingin menghapus ${deleteId ? 'dokter ini' : `${selectedIds.size} dokter yang dipilih`}? Tindakan ini tidak dapat dibatalkan.`}
                confirmText={deleteId ? "Hapus" : "Hapus Semua"}
                variant="danger"
                isLoading={isDeleting}
            />
            </div>{/* end inner content wrapper */}
        </div>
    );
}
