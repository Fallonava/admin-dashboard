"use client";

import { useState, useMemo, useEffect, useRef, useDeferredValue } from "react";
import useSWR, { mutate } from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Plus,
  Search,
  UserRound,
  Activity,
  Users,
  CheckSquare,
  Trash2,
  X,
  ChevronDown,
  Loader2,
  LayoutGrid,
  List,
  Edit2,
  Stethoscope,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";
import { DoctorFormModal } from "@/features/schedules/components/DoctorFormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DoctorCardSkeleton } from "@/components/ui/Skeleton";
import { DoctorCard, getStatusConfig } from "@/features/doctors/components/DoctorCard";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

// Compact Dropdown Component
const CompactDropdown = ({ value, options, onChange, label, icon: Icon }: any) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o: any) => o.value === value);

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
          "flex items-center gap-1.5 clay-button rounded-[16px] px-3.5 py-2 text-xs font-black text-zinc-700 dark:text-zinc-300 transition-all active:scale-95 whitespace-nowrap",
          open && "text-blue-600 dark:text-blue-400"
        )}
      >
        {Icon && <Icon size={13} className="text-zinc-400" />}
        <span>{selectedOption?.label || label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute top-[calc(100%+6px)] left-0 min-w-[170px] clay-surface rounded-[18px] p-1.5 shadow-xl transition-all duration-150 origin-top-left z-50",
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        )}
      >
        {options.map((opt: any) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-[12px] text-xs font-black transition-all flex items-center justify-between mb-0.5 last:mb-0",
              value === opt.value
                ? "clay-pill-blue text-white"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-white/5"
            )}
          >
            <span>{opt.label}</span>
            {value === opt.value && <CheckSquare size={12} />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function DoctorsPage() {
  const { data, isLoading } = useSWR<Doctor[]>('/api/doctors');
  const doctors = data || [];

  const [localDoctors, setLocalDoctors] = useState<Doctor[]>([]);
  useEffect(() => {
    if (data) setLocalDoctors(data);
  }, [data]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const isSearching = searchTerm !== debouncedSearch;

  // Filters, Sort & View Mode
  const [catFilter, setCatFilter] = useState<"Semua" | "Bedah" | "NonBedah">("Semua");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [sortMode, setSortMode] = useState<"default" | "A-Z" | "Z-A">("default");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // DND States
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isReorderEnabled = catFilter === "Semua" && statusFilter === "Semua" && sortMode === "default" && deferredSearch === "";

  // ── Computed Data with Non-Blocking Search ──
  const filteredDoctors = useMemo(() => {
    let result = [...localDoctors];

    if (deferredSearch) {
      result = result.filter(d =>
        d.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        d.specialty.toLowerCase().includes(deferredSearch.toLowerCase())
      );
    }
    if (catFilter !== "Semua") {
      result = result.filter(d => d.category === catFilter);
    }
    if (statusFilter !== "Semua") {
      result = result.filter(d =>
        statusFilter === "Aktif"
          ? (d.status === "PRAKTEK" || d.status === "PENUH" || d.status === "OPERASI")
          : d.status === statusFilter.toUpperCase()
      );
    }

    if (sortMode === "A-Z") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === "Z-A") result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [localDoctors, deferredSearch, catFilter, statusFilter, sortMode]);

  // Status counts for pills
  const statusCounts = useMemo(() => {
    const total = localDoctors.length;
    const praktek = localDoctors.filter(d => d.status === 'PRAKTEK' || d.status === 'OPERASI').length;
    const cuti = localDoctors.filter(d => d.status === 'CUTI').length;
    const libur = localDoctors.filter(d => d.status === 'LIBUR').length;
    return { total, praktek, cuti, libur };
  }, [localDoctors]);

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
        const res = await fetch(`/api/doctors?id=${deleteId}`, { method: 'DELETE' });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal menghapus dokter');
        }
      } else if (selectedIds.size > 0) {
        for (const id of Array.from(selectedIds)) {
          const res = await fetch(`/api/doctors?id=${id}`, { method: 'DELETE' });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Gagal menghapus dokter ID ${id}`);
          }
        }
      }
      mutate('/api/doctors');
      setDeleteId(null);
      setIsDeleteModalOpen(false);
      setSelectedIds(new Set());
    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan saat menghapus data.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    try {
      const updates = Array.from(selectedIds).map(id => ({ id, status: newStatus }));
      const res = await fetch('/api/doctors?action=bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal update massal');
      }
      mutate('/api/doctors');
      setSelectedIds(new Set());
    } catch (error: any) {
      alert(error.message || "Gagal mengubah status secara massal.");
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
      setLocalDoctors(reordered);

      const payload = reordered.map((doc, idx) => ({ id: doc.id, order: idx }));
      try {
        const res = await fetch('/api/doctors?action=reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal mengurutkan');
        }
        mutate('/api/doctors');
      } catch (err: any) {
        alert(err.message || "Gagal menyimpan urutan dokter.");
        mutate('/api/doctors');
      }
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-hidden relative bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100">
      {/* ─── UNIFIED PAGE HEADER ─── */}
      <div className="relative z-10 w-full flex-none">
        <PageHeader
          icon={<Users size={22} className="text-white" strokeWidth={2.5} />}
          title="Direktori Dokter"
          accentWord="Dokter"
          accentColor="text-blue-600 dark:text-blue-400"
          subtitle={`Kelola profil ${doctors.length} dokter dan jadwal tayang real-time`}
          iconClay="clay-icon-blue"
          accentBarGradient="from-blue-500 via-indigo-500 to-violet-500"
          badge={
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 clay-pill-blue text-white rounded-full text-[10px] font-black shrink-0 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {statusCounts.praktek} Dokter Tayang
            </span>
          }
          actions={
            <button
              onClick={() => { setEditingDoctor(undefined); setIsFormOpen(true); }}
              className="flex items-center gap-2 clay-pill-blue text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-[18px] font-black text-xs sm:text-sm active:scale-95 transition-all shadow-md shrink-0"
            >
              <Plus size={17} strokeWidth={2.5} />
              <span>Tambah Dokter</span>
            </button>
          }
        />
      </div>

      {/* ─── TOOLBAR CONTROLS ─── */}
      <div className="flex-1 flex flex-col px-3 sm:px-6 lg:px-8 pt-2 overflow-hidden relative z-10">
        <div className="flex flex-col lg:flex-row gap-2.5 lg:gap-3 mb-4 items-stretch lg:items-center justify-between relative z-20">
          {/* Left: Search Bar */}
          <div className="relative flex-1 max-w-full lg:max-w-md">
            <div className="relative flex items-center w-full rounded-[18px] clay-inset overflow-hidden">
              {isSearching ? (
                <Loader2 className="absolute left-3.5 text-blue-500 h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Search className="absolute left-3.5 text-zinc-400 h-4 w-4 shrink-0" />
              )}
              <input
                type="search"
                placeholder="Cari nama dokter atau spesialisasi..."
                className="w-full bg-transparent pl-10 pr-9 py-2.5 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-600 transition-colors clay-button rounded-full p-1"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Middle/Right: Quick Filter Pills + Dropdowns + View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status Pills */}
            <div className="flex clay-inset p-1 rounded-[16px] overflow-x-auto no-scrollbar gap-1">
              {[
                { id: "Semua", label: "Semua", count: statusCounts.total },
                { id: "Aktif", label: "Praktek", count: statusCounts.praktek },
                { id: "Cuti", label: "Cuti", count: statusCounts.cuti },
                { id: "LIBUR", label: "Libur", count: statusCounts.libur },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-[12px] text-[11px] font-black transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95",
                    statusFilter === tab.id
                      ? "clay-pill-blue text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.2 rounded-full font-black",
                    statusFilter === tab.id ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Dropdowns for Category & Sort */}
            <CompactDropdown
              value={catFilter}
              onChange={setCatFilter}
              label="Kategori"
              options={[
                { value: "Semua", label: "Semua Kategori" },
                { value: "Bedah", label: "Bedah" },
                { value: "NonBedah", label: "Non Bedah" },
              ]}
            />

            <CompactDropdown
              value={sortMode}
              onChange={setSortMode}
              icon={ArrowUpDown}
              label="Urutan"
              options={[
                { value: "default", label: "Urutan Default (DND)" },
                { value: "A-Z", label: "Abjad A-Z" },
                { value: "Z-A", label: "Abjad Z-A" },
              ]}
            />

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex clay-inset p-1 rounded-[14px] items-center gap-1">
              <button
                onClick={() => setViewMode("grid")}
                title="Tampilan Grid Kartu"
                className={cn(
                  "p-1.5 rounded-[10px] transition-all",
                  viewMode === "grid" ? "clay-pill-blue text-white" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                <LayoutGrid size={15} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="Tampilan Tabel Ringkas"
                className={cn(
                  "p-1.5 rounded-[10px] transition-all",
                  viewMode === "table" ? "clay-pill-blue text-white" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                <List size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Select All Button */}
            <button
              onClick={toggleSelectAll}
              title={selectedIds.size === filteredDoctors.length && filteredDoctors.length > 0 ? "Batal Pilih Semua" : "Pilih Semua"}
              className={cn(
                "p-2 rounded-[14px] transition-all active:scale-95",
                selectedIds.size > 0 ? "clay-pill-blue text-white" : "clay-button text-zinc-600 dark:text-zinc-400"
              )}
            >
              <CheckSquare size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ─── MAIN DOCTOR LIST / GRID ─── */}
        {isLoading ? (
          <div className="flex-1 w-full min-h-0 mb-2 overflow-y-auto custom-scrollbar pb-32 lg:pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <DoctorCardSkeleton key={i} />)}
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            icon={<UserRound size={40} className="text-blue-500" />}
            title="Tidak Ada Dokter"
            description="Tidak ditemukan dokter yang sesuai dengan filter atau pencarian Anda."
          />
        ) : viewMode === "grid" ? (
          /* ── GRID MODE ── */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={isReorderEnabled ? handleDragEnd : undefined}
          >
            <div className="flex-1 w-full min-h-0 mb-2 overflow-y-auto custom-scrollbar pb-32 lg:pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                <SortableContext items={filteredDoctors.map(d => d.id)} strategy={rectSortingStrategy}>
                  {filteredDoctors.map((doc, idx) => (
                    <DoctorCard
                      key={doc.id}
                      doctor={doc}
                      index={idx}
                      isSelected={selectedIds.has(doc.id)}
                      onToggleSelect={handleToggleSelect}
                      onEdit={handleEdit}
                      onDelete={(id) => { setDeleteId(id); setIsDeleteModalOpen(true); }}
                    />
                  ))}
                </SortableContext>
              </div>
            </div>

            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
              }}
            >
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
        ) : (
          /* ── TABLE LIST MODE ── */
          <div className="flex-1 w-full min-h-0 mb-2 overflow-y-auto custom-scrollbar pb-32 lg:pb-8">
            <div className="clay-surface rounded-[26px] overflow-hidden shadow-lg border border-zinc-200/50 dark:border-white/5">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200/60 dark:border-white/5 text-zinc-500 dark:text-zinc-400 font-black uppercase text-[10px] tracking-wider bg-zinc-500/5">
                  <tr>
                    <th className="p-3.5 w-12 text-center">
                      <button
                        onClick={toggleSelectAll}
                        className="cursor-pointer"
                        aria-label="Pilih Semua"
                      >
                        <CheckSquare size={14} />
                      </button>
                    </th>
                    <th className="p-3.5">Dokter</th>
                    <th className="p-3.5">Poliklinik / Spesialisasi</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Status Tayang</th>
                    <th className="p-3.5 text-right pr-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5">
                  {filteredDoctors.map((doc) => {
                    const status = getStatusConfig(doc.status);
                    const isSelected = selectedIds.has(doc.id);
                    const isBedah = doc.category === "Bedah";
                    const initials = doc.queueCode || doc.name
                      .replace(/^dr\.\s*/i, '')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(w => w[0])
                      .join('')
                      .toUpperCase() || 'DR';

                    return (
                      <tr
                        key={doc.id}
                        onClick={() => handleToggleSelect(doc.id)}
                        className={cn(
                          "content-visibility-auto hover:bg-blue-500/5 cursor-pointer transition-colors",
                          isSelected && "bg-blue-500/10 dark:bg-blue-500/15"
                        )}
                      >
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(doc.id)}
                            className={cn(
                              "h-6 w-6 rounded-[8px] flex items-center justify-center transition-all mx-auto",
                              isSelected ? "clay-pill-blue text-white" : "clay-button text-zinc-400"
                            )}
                          >
                            {isSelected ? <CheckSquare size={12} /> : <div className="w-2.5 h-2.5 rounded-[4px] border border-zinc-400/40" />}
                          </button>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-9 h-9 rounded-[12px] flex items-center justify-center text-white font-black text-xs shrink-0",
                              isBedah ? "clay-icon-rose" : "clay-icon-blue"
                            )}>
                              <span className="relative z-10">{initials}</span>
                            </div>
                            <div>
                              <p className="font-black text-zinc-900 dark:text-zinc-100 text-[13.5px] leading-tight">
                                {doc.name}
                              </p>
                              <p className="text-[10.5px] text-zinc-400 font-bold mt-0.5">
                                Kode: {doc.queueCode || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-zinc-700 dark:text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Stethoscope size={13} className="text-zinc-400 shrink-0" />
                            <span>{doc.specialty}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={cn(
                            "px-2.5 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-wider",
                            isBedah
                              ? "clay-button text-rose-600 dark:text-rose-400"
                              : "clay-button text-blue-600 dark:text-blue-400"
                          )}>
                            {doc.category === 'NonBedah' ? 'Non Bedah' : doc.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black",
                            status.clayPill
                          )}>
                            {status.dot && <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />}
                            {status.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEdit(doc)}
                              className="p-2 rounded-[10px] clay-button text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
                              title="Edit Profil"
                            >
                              <Edit2 size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => { setDeleteId(doc.id); setIsDeleteModalOpen(true); }}
                              className="p-2 rounded-[10px] clay-button text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95"
                              title="Hapus Dokter"
                            >
                              <Trash2 size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── FLOATING BULK ACTION BAR (SAFE SPACING) ─── */}
        <div className={cn(
          "fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] lg:bottom-8 left-1/2 -translate-x-1/2 max-w-[94vw] sm:max-w-none clay-surface rounded-[28px] shadow-2xl p-2.5 sm:p-3 flex items-center transition-all duration-300 z-[105]",
          selectedIds.size > 0 ? "translate-y-0 opacity-100 scale-100" : "translate-y-24 opacity-0 scale-90 pointer-events-none"
        )}>
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar px-1">
            <div className="clay-pill-blue px-3.5 py-2 rounded-[16px] text-xs font-black flex items-center gap-1.5 text-white shadow-md shrink-0">
              <CheckSquare size={14} strokeWidth={2.5} />
              <span>{selectedIds.size} dipilih</span>
            </div>

            <div className="h-6 w-px bg-zinc-300 dark:bg-white/10 shrink-0" />

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleBulkStatusChange('PRAKTEK')}
                className="px-3 py-2 rounded-[14px] text-xs font-black clay-pill-emerald text-white shadow-sm transition-all active:scale-95"
              >
                Set Praktek
              </button>
              <button
                onClick={() => handleBulkStatusChange('CUTI')}
                className="px-3 py-2 rounded-[14px] text-xs font-black clay-button text-zinc-700 dark:text-zinc-300 transition-all active:scale-95"
              >
                Set Cuti
              </button>
              <button
                onClick={() => handleBulkStatusChange('LIBUR')}
                className="px-3 py-2 rounded-[14px] text-xs font-black clay-button text-zinc-700 dark:text-zinc-300 transition-all active:scale-95"
              >
                Set Libur
              </button>
            </div>

            <div className="h-6 w-px bg-zinc-300 dark:bg-white/10 shrink-0" />

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-2 rounded-[14px] text-xs font-black clay-pill-rose text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <Trash2 size={13} strokeWidth={2.5} />
              <span>Hapus Massal</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}
      <DoctorFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        doctor={editingDoctor}
        onSuccess={() => mutate('/api/doctors')}
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteId(null); }}
        onConfirm={confirmDelete}
        title="Hapus Data Dokter?"
        description={
          deleteId
            ? "Data dokter ini akan dihapus permanen beserta seluruh relasi jadwal dan kuotanya."
            : `Apakah Anda yakin ingin menghapus ${selectedIds.size} dokter terpilih? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText="Hapus Permanen"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
