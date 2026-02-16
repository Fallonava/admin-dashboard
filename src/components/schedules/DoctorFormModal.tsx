"use client";

import { useEffect, useState } from "react";
import { X, Save, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Doctor } from "@/lib/data-service";
import { cn } from "@/lib/utils";

interface DoctorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctor?: Doctor | null; // If null, we are in "Add" mode
    onSuccess: () => void;
}

export function DoctorFormModal({ isOpen, onClose, doctor, onSuccess }: DoctorFormModalProps) {
    const isEditing = !!doctor;
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Doctor>>({
        name: "",
        specialty: "",
        category: "NonBedah",
        status: "Idle"
    });

    // Reset or Populate form on open
    useEffect(() => {
        if (isOpen) {
            if (doctor) {
                setFormData({
                    name: doctor.name,
                    specialty: doctor.specialty,
                    category: doctor.category,
                    status: doctor.status
                });
            } else {
                setFormData({
                    name: "",
                    specialty: "",
                    category: "NonBedah",
                    status: "Idle"
                });
            }
        }
    }, [isOpen, doctor]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.specialty) return;
        setLoading(true);

        try {
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing ? { ...formData, id: doctor.id } : formData;

            await fetch('/api/doctors', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save doctor", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm w-full mx-auto">
                <div className="glass-panel rounded-2xl p-6 w-full border border-white/[0.08] shadow-2xl bg-slate-950/80 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white tracking-wide">
                            {isEditing ? 'Edit Doctor' : 'New Doctor'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] p-1.5 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Name Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input
                                className="w-full bg-slate-900/50 border border-white/[0.1] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 rounded-xl p-3 text-white text-sm outline-none transition-all placeholder:text-slate-600"
                                placeholder="e.g. Dr. Sarah Johnson"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                autoFocus={!isEditing}
                            />
                        </div>

                        {/* Specialty Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Specialty</label>
                            <input
                                className="w-full bg-slate-900/50 border border-white/[0.1] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 rounded-xl p-3 text-white text-sm outline-none transition-all placeholder:text-slate-600"
                                placeholder="e.g. Sp. Bedah"
                                value={formData.specialty}
                                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                            />
                        </div>

                        {/* Category Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: 'NonBedah' })}
                                    className={cn(
                                        "py-2.5 rounded-xl text-xs font-bold border transition-all",
                                        formData.category === 'NonBedah'
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                            : "bg-slate-900/30 text-slate-500 border-white/[0.05] hover:bg-white/[0.02]"
                                    )}
                                >
                                    Non-Bedah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: 'Bedah' })}
                                    className={cn(
                                        "py-2.5 rounded-xl text-xs font-bold border transition-all",
                                        formData.category === 'Bedah'
                                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                                            : "bg-slate-900/30 text-slate-500 border-white/[0.05] hover:bg-white/[0.02]"
                                    )}
                                >
                                    Bedah
                                </button>
                            </div>
                        </div>

                        {/* Status Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {['Idle', 'Buka', 'Penuh', 'Cuti'].map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: status as any })}
                                        className={cn(
                                            "py-2 rounded-lg text-[10px] font-bold border transition-all truncate",
                                            formData.status === status
                                                ? status === 'Buka' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                                    status === 'Penuh' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                                                        status === 'Cuti' ? "bg-pink-500/20 text-pink-400 border-pink-500/30" :
                                                            "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                                : "bg-slate-900/30 text-slate-600 border-white/[0.05] hover:bg-white/[0.02]"
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-white/[0.1] bg-white/[0.02] text-slate-400 text-xs font-bold hover:bg-white/[0.05] hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.name}
                                className={cn(
                                    "flex-[2] py-3 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all flex items-center justify-center gap-2",
                                    loading && "opacity-70 cursor-wait"
                                )}
                            >
                                {loading ? (
                                    <span className="animate-pulse">Saving...</span>
                                ) : (
                                    <>
                                        {isEditing ? <Save size={14} /> : <Check size={14} />}
                                        {isEditing ? 'Save Changes' : 'Create Doctor'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
