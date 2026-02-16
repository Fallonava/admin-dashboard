"use client";

import { useState, useEffect } from "react";
import { Plus, Search, User, Trash2, Edit2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [formData, setFormData] = useState<Partial<Doctor>>({
        name: "",
        specialty: "",
        category: "NonBedah",
        status: "Idle",
        queueCode: "",
        startTime: "",
        endTime: "",
        registrationTime: ""
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        const res = await fetch('/api/doctors');
        const data = await res.json();
        setDoctors(data);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.specialty) return;

        const method = editingId ? 'PUT' : 'POST';
        const body = editingId ? { ...formData, id: editingId } : formData;

        await fetch('/api/doctors', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        closeModal();
        fetchDoctors();
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this doctor?")) return;
        await fetch(`/api/doctors?id=${id}`, { method: 'DELETE' });
        fetchDoctors();
    };

    const openEdit = (doc: Doctor) => {
        setFormData(doc);
        setEditingId(doc.id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: "", specialty: "", category: "NonBedah", status: "Idle", queueCode: "", startTime: "", endTime: "", registrationTime: "" });
    };

    const requestStatusChange = async (doc: Doctor, newStatus: Doctor['status']) => {
        await fetch('/api/doctors', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: doc.id, status: newStatus })
        });
        fetchDoctors();
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
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-primary/20 transition-all"
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
                    <div key={doc.id} className="group glass-card rounded-2xl p-5 hover:border-primary/50 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                                    {doc.queueCode || doc.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-lg">{doc.name}</h3>
                                    <p className="text-sm text-primary">{doc.specialty}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(doc)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(doc.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                            <span className={cn(
                                "text-xs px-2 py-1 rounded font-bold uppercase tracking-wide",
                                doc.category === 'Bedah' ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                                {doc.category}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Status:</span>
                                <span className={cn(
                                    "text-xs font-bold",
                                    doc.status === 'Idle' ? "text-muted-foreground" :
                                        doc.status === 'BUKA' ? "text-blue-500" :
                                            doc.status === 'PENUH' ? "text-orange-500" :
                                                doc.status === 'CUTI' ? "text-pink-500" : "text-amber-500"
                                )}>
                                    {doc.status || "AUTO"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm transition-all duration-300">
                    <div className="glass-panel rounded-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-foreground">{editingId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground bg-secondary/50 p-1 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Full Name</label>
                                <input
                                    className="w-full bg-secondary/30 border border-transparent hover:border-border focus:border-primary rounded-xl p-3 text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder="e.g. Dr. Sarah Johnson"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Specialty</label>
                                <input
                                    className="w-full bg-secondary/30 border border-transparent hover:border-border focus:border-primary rounded-xl p-3 text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder="e.g. Sp. Bedah"
                                    value={formData.specialty}
                                    onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Category</label>
                                <select
                                    className="w-full bg-secondary/30 border border-transparent hover:border-border focus:border-primary rounded-xl p-3 text-foreground text-sm outline-none transition-all"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                >
                                    <option value="NonBedah">Non-Bedah</option>
                                    <option value="Bedah">Bedah</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Mulai</label>
                                    <input
                                        className="w-full bg-secondary/30 border border-transparent hover:border-border focus:border-primary rounded-xl p-3 text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/50 text-center"
                                        placeholder="08:00"
                                        maxLength={5}
                                        value={formData.startTime || ""}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Selesai</label>
                                    <input
                                        className="w-full bg-secondary/30 border border-transparent hover:border-border focus:border-primary rounded-xl p-3 text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/50 text-center"
                                        placeholder="14:00"
                                        maxLength={5}
                                        value={formData.endTime || ""}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Jam Daftar</label>
                                    <input
                                        className="w-full bg-secondary/30 border border-transparent hover:border-border focus:border-primary rounded-xl p-3 text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/50 text-center"
                                        placeholder="07:30"
                                        maxLength={5}
                                        value={formData.registrationTime || ""}
                                        onChange={e => setFormData({ ...formData, registrationTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Queue Code</label>
                                <input
                                    className="w-full bg-secondary/30 border border-transparent hover:border-border focus:border-primary rounded-xl p-3 text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder="e.g. A-01"
                                    value={formData.queueCode || ""}
                                    onChange={e => setFormData({ ...formData, queueCode: e.target.value })}
                                />

                                <div className="pt-4 flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-muted">
                                        Cancel
                                    </button>
                                    <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                                        {editingId ? 'Save Changes' : 'Create Doctor'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
