"use client";

import { useState } from "react";
import { X, Clock, Calendar, Plus, Trash2, Save, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Doctor, Shift } from "@/lib/data-service";

interface ScheduleModalProps {
    doctor: Doctor | null;
    shifts: Shift[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function ScheduleModal({ doctor, shifts, isOpen, onClose, onUpdate }: ScheduleModalProps) {
    const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
    const [isAddingDay, setIsAddingDay] = useState<number | null>(null); // dayIdx

    // Form State
    const [formData, setFormData] = useState<Partial<Shift>>({
        title: "",
        formattedTime: "",
        color: "blue"
    });

    if (!doctor) return null;

    // Filter shifts for this doctor
    const docShifts = shifts.filter(s => s.doctor === doctor.name);

    const resetForm = () => {
        setFormData({ title: "", formattedTime: "", color: "blue" });
        setEditingShiftId(null);
        setIsAddingDay(null);
    };

    const handleEditClick = (shift: Shift) => {
        setFormData({
            title: shift.title,
            formattedTime: shift.formattedTime,
            color: shift.color
        });
        setEditingShiftId(shift.id);
        setIsAddingDay(null);
    };

    const handleAddClick = (dayIdx: number) => {
        setFormData({ title: "Praktek", formattedTime: "08:00-12:00", color: "blue" });
        setIsAddingDay(dayIdx);
        setEditingShiftId(null);
    };

    const handleSave = async (dayIdx?: number) => {
        if (!formData.title || !formData.formattedTime) return;

        try {
            const method = editingShiftId ? 'PUT' : 'POST';
            const body = {
                ...formData,
                id: editingShiftId, // Only needed for PUT
                doctor: doctor.name,
                dayIdx: dayIdx !== undefined ? dayIdx : undefined
            };

            await fetch('/api/shifts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (onUpdate) onUpdate();
            resetForm();
        } catch (error) {
            console.error("Failed to save shift", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this shift?")) return;
        try {
            await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to delete shift", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950/90 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16 border-2 border-slate-700">
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-bold">
                                {doctor.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl font-bold">{doctor.name}</DialogTitle>
                            <p className="text-slate-400 font-medium">{doctor.specialty} • {doctor.category}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {DAYS.map((day, idx) => {
                        const dayShifts = docShifts.filter(s => s.dayIdx === idx);
                        const isAddingThisDay = isAddingDay === idx;

                        return (
                            <div key={day} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] group/day relative">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <Calendar size={14} className="text-violet-400" />
                                        {day}
                                    </h4>
                                    <button
                                        onClick={() => handleAddClick(idx)}
                                        className="p-1 text-slate-500 hover:text-white hover:bg-white/10 rounded-md opacity-0 group-hover/day:opacity-100 transition-all"
                                        title="Add Shift"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {/* List Shifts */}
                                <div className="space-y-2">
                                    {dayShifts.map(shift => {
                                        const isEditing = editingShiftId === shift.id;

                                        if (isEditing) {
                                            return (
                                                <div key={shift.id} className="bg-slate-900 border border-blue-500/50 p-3 rounded-lg space-y-2 animation-fade-in">
                                                    <input
                                                        className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                        value={formData.title}
                                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                        placeholder="Shift Title"
                                                    />
                                                    <div className="flex gap-2">
                                                        <input
                                                            className="flex-1 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                            value={formData.formattedTime}
                                                            onChange={e => setFormData({ ...formData, formattedTime: e.target.value })}
                                                            placeholder="08:00-14:00"
                                                        />
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleSave()} className="p-1.5 bg-blue-600 rounded hover:bg-blue-500 text-white"><Save size={12} /></button>
                                                            <button onClick={resetForm} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-slate-300"><X size={12} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={shift.id} className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 group/item relative">
                                                <div className={cn("w-1 h-8 rounded-full", `bg-${shift.color}-500`)} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-white">{shift.title}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <Clock size={10} />
                                                        {shift.formattedTime}
                                                    </div>
                                                </div>

                                                <div className="absolute right-2 flex gap-1 list-none opacity-0 group-hover/item:opacity-100 transition-all bg-slate-950/80 p-1 rounded backdrop-blur-sm">
                                                    <button onClick={() => handleEditClick(shift)} className="p-1 text-slate-400 hover:text-white"><Edit2 size={10} /></button>
                                                    <button onClick={() => handleDelete(shift.id)} className="p-1 text-slate-400 hover:text-red-400"><Trash2 size={10} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Add Form */}
                                    {isAddingThisDay && (
                                        <div className="bg-slate-900 border border-green-500/50 p-3 rounded-lg space-y-2 animation-fade-in">
                                            <input
                                                className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="Shift Title"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                    value={formData.formattedTime}
                                                    onChange={e => setFormData({ ...formData, formattedTime: e.target.value })}
                                                    placeholder="08:00-14:00"
                                                />
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleSave(idx)} className="p-1.5 bg-green-600 rounded hover:bg-green-500 text-white"><Save size={12} /></button>
                                                    <button onClick={resetForm} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-slate-300"><X size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {dayShifts.length === 0 && !isAddingThisDay && (
                                        <div className="text-xs text-slate-600 italic py-2 text-center">
                                            No schedule
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
