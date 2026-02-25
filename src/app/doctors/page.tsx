"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";
import { DoctorFormModal } from "@/components/schedules/DoctorFormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function DoctorsPage() {
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const [searchTerm, setSearchTerm] = useState("");

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
            console.error("Failed to delete doctor", error);
            alert("Failed to delete doctor");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Doctors Directory</h1>
                    <p className="text-muted-foreground mt-1">Manage doctor profiles and specialties.</p>
                </div>
                <button
                    onClick={() => { setEditingDoctor(undefined); setIsFormOpen(true); }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    Add Doctor
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search by name or specialty..."
                        className="w-full bg-secondary/30 border border-transparent hover:border-border focus:border-primary rounded-xl pl-10 pr-4 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10">
                {filteredDoctors.map((doc) => (
                    <div key={doc.id} className="group glass-card rounded-2xl p-5 hover:border-primary/50 transition-all border border-border/50 bg-card/40 backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-inner">
                                    {doc.queueCode || doc.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-lg leading-tight">{doc.name}</h3>
                                    <p className="text-xs font-medium text-primary uppercase tracking-wide mt-1">{doc.specialty}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(doc)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Edit">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteClick(doc.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <span className={cn(
                                "text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider",
                                doc.category === 'Bedah' ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                                {doc.category}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary",
                                    doc.status === 'TIDAK PRAKTEK' ? "text-muted-foreground" :
                                        doc.status === 'BUKA' ? "text-blue-500 bg-blue-500/10" :
                                            doc.status === 'PENUH' ? "text-orange-500 bg-orange-500/10" :
                                                doc.status === 'CUTI' ? "text-pink-500 bg-pink-500/10" :
                                                    doc.status === 'OPERASI' ? "text-red-500 bg-red-500/10" :
                                                        "text-amber-500 bg-amber-500/10"
                                )}>
                                    {doc.status || "AUTO"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
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
                title="Delete Doctor"
                description="Are you sure you want to delete this doctor? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
