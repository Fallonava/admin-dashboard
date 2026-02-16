"use client";

import { useState } from "react";
import { X, Clock, Calendar, Plus, Trash2, Save, Edit2, Copy, Power, CalendarOff } from "lucide-react";
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
        registrationTime: "",
        color: "blue"
    });

    if (!doctor) return null;

    // Filter shifts for this doctor
    const docShifts = shifts.filter(s => s.doctor === doctor.name);

    const resetForm = () => {
        setFormData({ title: "", formattedTime: "", registrationTime: "", color: "blue" });
        setEditingShiftId(null);
        setIsAddingDay(null);
    };

    const handleEditClick = (shift: Shift) => {
        setFormData({
            title: shift.title,
            formattedTime: shift.formattedTime,
            registrationTime: shift.registrationTime || "",
            color: shift.color
        });
        setEditingShiftId(shift.id);
        setIsAddingDay(null);
    };

    const handleAddClick = (dayIdx: number) => {
        setFormData({ title: "Praktek", formattedTime: "08:00-12:00", registrationTime: "07:30", color: "blue" });
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

    const handleDuplicate = (shift: Shift) => {
        setFormData({
            title: shift.title,
            formattedTime: shift.formattedTime,
            registrationTime: shift.registrationTime || "",
            color: shift.color
        });
        setIsAddingDay(shift.dayIdx);
        setEditingShiftId(null);
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

    const toggleShiftDisabled = async (shift: Shift) => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const dates = shift.disabledDates || [];
        const isDisabledToday = dates.includes(todayStr);
        const newDates = isDisabledToday ? dates.filter(d => d !== todayStr) : [...dates, todayStr];
        try {
            await fetch('/api/shifts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: shift.id, disabledDates: newDates })
            });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to toggle shift", error);
        }
    };

    const addDisabledDate = async (shift: Shift, dateStr: string) => {
        if (!dateStr) return;
        const dates = shift.disabledDates || [];
        if (dates.includes(dateStr)) return;
        const newDates = [...dates, dateStr].sort();
        try {
            await fetch('/api/shifts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: shift.id, disabledDates: newDates })
            });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to add disabled date", error);
        }
    };

    const removeDisabledDate = async (shift: Shift, dateStr: string) => {
        const newDates = (shift.disabledDates || []).filter(d => d !== dateStr);
        try {
            await fetch('/api/shifts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: shift.id, disabledDates: newDates })
            });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to remove disabled date", error);
        }
    };

    const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);

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
                                                        <input
                                                            className="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white text-center"
                                                            value={formData.registrationTime}
                                                            onChange={e => setFormData({ ...formData, registrationTime: e.target.value })}
                                                            placeholder="07:30"
                                                            title="Jam Daftar"
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
                                            <div key={shift.id} className="space-y-1">
                                                <div className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-lg border group/item relative transition-all",
                                                    (shift.disabledDates || []).length > 0
                                                        ? "bg-slate-900/30 border-slate-800/50"
                                                        : "bg-slate-900/50 border-slate-800"
                                                )}>
                                                    {/* Toggle today */}
                                                    <button
                                                        onClick={() => toggleShiftDisabled(shift)}
                                                        className={cn(
                                                            "p-1 rounded-md transition-all shrink-0",
                                                            (shift.disabledDates || []).includes((() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; })())
                                                                ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                                                                : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                                        )}
                                                        title="Toggle hari ini"
                                                    >
                                                        <Power size={12} />
                                                    </button>

                                                    <div className={cn("w-1 h-8 rounded-full", `bg-${shift.color}-500`)} />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-white">{shift.title}</p>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <Clock size={10} />
                                                            {shift.formattedTime}
                                                            {shift.registrationTime && (
                                                                <span className="text-slate-500">• Daftar: {shift.registrationTime}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Disabled dates count badge */}
                                                    {(shift.disabledDates || []).length > 0 && (
                                                        <button
                                                            onClick={() => setExpandedShiftId(expandedShiftId === shift.id ? null : shift.id)}
                                                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold hover:bg-red-500/20 transition-all"
                                                        >
                                                            <CalendarOff size={9} />
                                                            {(shift.disabledDates || []).length}
                                                        </button>
                                                    )}

                                                    {/* Plan dates button */}
                                                    <button
                                                        onClick={() => setExpandedShiftId(expandedShiftId === shift.id ? null : shift.id)}
                                                        className="p-1 text-slate-500 hover:text-amber-400 rounded-md hover:bg-amber-500/10 transition-all"
                                                        title="Jadwalkan nonaktif"
                                                    >
                                                        <Calendar size={11} />
                                                    </button>

                                                    <div className="flex gap-1 list-none opacity-0 group-hover/item:opacity-100 transition-all">
                                                        <button onClick={() => handleDuplicate(shift)} className="p-1 text-slate-400 hover:text-green-400" title="Duplicate"><Copy size={10} /></button>
                                                        <button onClick={() => handleEditClick(shift)} className="p-1 text-slate-400 hover:text-white" title="Edit"><Edit2 size={10} /></button>
                                                        <button onClick={() => handleDelete(shift.id)} className="p-1 text-slate-400 hover:text-red-400" title="Delete"><Trash2 size={10} /></button>
                                                    </div>
                                                </div>

                                                {/* Expanded: Disabled dates management */}
                                                {expandedShiftId === shift.id && (
                                                    <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-2.5 space-y-2 ml-6 animation-fade-in">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Nonaktif</p>
                                                            <input
                                                                type="date"
                                                                className="bg-slate-950 border border-white/10 rounded px-2 py-0.5 text-[10px] text-white"
                                                                onChange={(e) => {
                                                                    addDisabledDate(shift, e.target.value);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                        </div>
                                                        {(shift.disabledDates || []).length === 0 ? (
                                                            <p className="text-[10px] text-slate-600 italic">Belum ada tanggal nonaktif</p>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1">
                                                                {(shift.disabledDates || []).sort().map(d => (
                                                                    <span key={d} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-mono">
                                                                        {d}
                                                                        <button onClick={() => removeDisabledDate(shift, d)} className="hover:text-white"><X size={8} /></button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                                                <input
                                                    className="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white text-center"
                                                    value={formData.registrationTime}
                                                    onChange={e => setFormData({ ...formData, registrationTime: e.target.value })}
                                                    placeholder="07:30"
                                                    title="Jam Daftar"
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
