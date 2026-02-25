"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Clock, Calendar, Plus, Trash2, Save, Copy, Power, CalendarOff, ChevronDown, Stethoscope } from "lucide-react";
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

const COLOR_OPTIONS = [
    { value: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-400', light: 'bg-blue-50 text-blue-600' },
    { value: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400', light: 'bg-emerald-50 text-emerald-600' },
    { value: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-400', light: 'bg-violet-50 text-violet-600' },
    { value: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-400', light: 'bg-amber-50 text-amber-600' },
    { value: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-400', light: 'bg-rose-50 text-rose-600' },
    { value: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-400', light: 'bg-cyan-50 text-cyan-600' },
];

const SHIFT_COLOR_BAR: Record<string, string> = {
    blue: 'bg-blue-500', emerald: 'bg-emerald-500', violet: 'bg-violet-500',
    amber: 'bg-amber-500', rose: 'bg-rose-500', cyan: 'bg-cyan-500',
    red: 'bg-red-500', green: 'bg-green-500', purple: 'bg-purple-500',
    orange: 'bg-orange-500', pink: 'bg-pink-500', teal: 'bg-teal-500',
};

const SHIFT_COLOR_LIGHT: Record<string, string> = {
    blue: 'bg-blue-50', emerald: 'bg-emerald-50', violet: 'bg-violet-50',
    amber: 'bg-amber-50', rose: 'bg-rose-50', cyan: 'bg-cyan-50',
    red: 'bg-red-50', green: 'bg-green-50', purple: 'bg-purple-50',
    orange: 'bg-orange-50', pink: 'bg-pink-50', teal: 'bg-teal-50',
};

const getTodayStr = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const getTodayIdx = () => (new Date().getDay() + 6) % 7; // Mon=0

const getAvatarGradient = (name: string) => {
    const g = ['from-blue-500 to-cyan-400', 'from-violet-500 to-purple-400', 'from-rose-500 to-pink-400',
        'from-amber-500 to-orange-400', 'from-emerald-500 to-teal-400', 'from-indigo-500 to-blue-400'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return g[Math.abs(hash) % g.length];
};

const DEFAULT_FORM: Partial<Shift> = { title: "Praktek", formattedTime: "08:00-12:00", registrationTime: "07:30", color: "blue" };

export function ScheduleModal({ doctor, shifts, isOpen, onClose, onUpdate }: ScheduleModalProps) {
    const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
    const [isAddingDay, setIsAddingDay] = useState<number | null>(null);
    const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Shift>>(DEFAULT_FORM);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!isOpen || !doctor || !mounted) return null;

    const todayStr = getTodayStr();
    const todayIdx = getTodayIdx();
    const docShifts = shifts.filter(s => s.doctor === doctor.name);

    const resetForm = () => { setFormData(DEFAULT_FORM); setEditingShiftId(null); setIsAddingDay(null); };

    const handleSave = async (dayIdx?: number) => {
        if (!formData.title || !formData.formattedTime) return;
        try {
            await fetch('/api/shifts', {
                method: editingShiftId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, id: editingShiftId, doctor: doctor.name, dayIdx })
            });
            onUpdate?.(); resetForm();
        } catch { }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus shift ini?")) return;
        await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
        onUpdate?.();
    };

    const handleDuplicate = (shift: Shift) => {
        setFormData({ title: shift.title, formattedTime: shift.formattedTime, registrationTime: shift.registrationTime || "", color: shift.color });
        setIsAddingDay(shift.dayIdx); setEditingShiftId(null);
    };

    const toggleDisabled = async (shift: Shift) => {
        const dates = shift.disabledDates || [];
        const newDates = dates.includes(todayStr) ? dates.filter(d => d !== todayStr) : [...dates, todayStr];
        await fetch('/api/shifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: shift.id, disabledDates: newDates }) });
        onUpdate?.();
    };

    const addDate = async (shift: Shift, d: string) => {
        if (!d || (shift.disabledDates || []).includes(d)) return;
        await fetch('/api/shifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: shift.id, disabledDates: [...(shift.disabledDates || []), d].sort() }) });
        onUpdate?.();
    };

    const removeDate = async (shift: Shift, d: string) => {
        await fetch('/api/shifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: shift.id, disabledDates: (shift.disabledDates || []).filter(x => x !== d) }) });
        onUpdate?.();
    };

    // ── Inline Form Component ──────────────────────────────────────────────────
    const ShiftForm = ({ dayIdx, isEdit = false }: { dayIdx: number; isEdit?: boolean }) => (
        <div className={cn("rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-150 border",
            isEdit ? "bg-blue-50/40 border-blue-100" : "bg-emerald-50/40 border-emerald-100"
        )}>
            <p className={cn("text-[10px] font-black uppercase tracking-widest",
                isEdit ? "text-blue-500" : "text-emerald-600"
            )}>
                {isEdit ? "✏️ Edit Shift" : `➕ Shift Baru — ${DAYS[dayIdx]}`}
            </p>
            <input
                autoFocus
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-100 placeholder:text-slate-300"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nama shift, cth: Praktek Pagi"
            />
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Jam Praktek</label>
                    <input
                        className="w-full bg-white rounded-xl px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-100 placeholder:text-slate-300"
                        value={formData.formattedTime}
                        onChange={e => setFormData({ ...formData, formattedTime: e.target.value })}
                        placeholder="08:00-12:00"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Jam Daftar</label>
                    <input
                        className="w-full bg-white rounded-xl px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-100 placeholder:text-slate-300"
                        value={formData.registrationTime}
                        onChange={e => setFormData({ ...formData, registrationTime: e.target.value })}
                        placeholder="07:30"
                    />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400">Warna</span>
                <div className="flex gap-1.5">
                    {COLOR_OPTIONS.map(c => (
                        <button key={c.value} type="button"
                            onClick={() => setFormData({ ...formData, color: c.value })}
                            className={cn("w-6 h-6 rounded-lg transition-all", c.bg,
                                formData.color === c.value ? `ring-2 ring-offset-1 ${c.ring} scale-110` : "opacity-40 hover:opacity-70"
                            )}
                        />
                    ))}
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <button onClick={resetForm} className="flex-1 py-2 rounded-xl bg-white border border-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors">Batal</button>
                <button onClick={() => handleSave(isEdit ? undefined : dayIdx)} disabled={!formData.title}
                    className={cn("flex-[2] py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors",
                        isEdit ? "bg-blue-600 hover:bg-blue-500" : "bg-emerald-600 hover:bg-emerald-500"
                    )}>
                    <Save size={11} />
                    {isEdit ? "Simpan Perubahan" : "Buat Shift"}
                </button>
            </div>
        </div>
    );

    // ── Render Shift Card ─────────────────────────────────────────────────────
    const renderShift = (shift: Shift, dayIdx: number) => {
        const isDisabledToday = (shift.disabledDates || []).includes(todayStr);
        const disabledCount = (shift.disabledDates || []).length;
        const colorBar = SHIFT_COLOR_BAR[shift.color] || 'bg-blue-500';
        const colorLight = SHIFT_COLOR_LIGHT[shift.color] || 'bg-blue-50';
        const isExpanded = expandedShiftId === shift.id;
        const isEditingThis = editingShiftId === shift.id;

        if (isEditingThis) return <ShiftForm key={shift.id} dayIdx={dayIdx} isEdit />;

        return (
            <div key={shift.id} className="space-y-1">
                <div className={cn(
                    "group flex items-center gap-2.5 p-3 rounded-2xl border transition-all cursor-default",
                    isDisabledToday ? "opacity-50 bg-slate-50 border-slate-100" : `${colorLight} border-transparent hover:border-white hover:shadow-sm`
                )}>
                    {/* Power */}
                    <button onClick={() => toggleDisabled(shift)}
                        className={cn("flex-shrink-0 p-1.5 rounded-xl transition-all",
                            isDisabledToday ? "bg-red-100 text-red-500 hover:bg-red-200" : "bg-white/60 text-emerald-600 hover:bg-white"
                        )} title={isDisabledToday ? "Aktifkan" : "Nonaktifkan hari ini"}
                    >
                        <Power size={11} />
                    </button>

                    {/* Color bar */}
                    <div className={cn("w-1 h-8 rounded-full flex-shrink-0", colorBar)} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{shift.title}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5">
                            <Clock size={9} />
                            <span>{shift.formattedTime}</span>
                            {shift.registrationTime && <span className="opacity-60">· {shift.registrationTime}</span>}
                        </div>
                    </div>

                    {/* Badges + Actions (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {disabledCount > 0 && (
                            <button onClick={() => setExpandedShiftId(isExpanded ? null : shift.id)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-red-50 text-red-500 text-[9px] font-black hover:bg-red-100 transition-colors"
                            ><CalendarOff size={8} />{disabledCount}</button>
                        )}
                        <button onClick={() => setExpandedShiftId(isExpanded ? null : shift.id)}
                            className="p-1.5 rounded-xl text-slate-300 hover:text-amber-500 hover:bg-white transition-colors" title="Tanggal nonaktif">
                            <CalendarOff size={11} />
                        </button>
                        <button onClick={() => handleDuplicate(shift)} className="p-1.5 rounded-xl text-slate-300 hover:text-emerald-500 hover:bg-white transition-colors" title="Duplikat">
                            <Copy size={11} />
                        </button>
                        <button onClick={() => { setFormData({ title: shift.title, formattedTime: shift.formattedTime, registrationTime: shift.registrationTime || "", color: shift.color }); setEditingShiftId(shift.id); setIsAddingDay(null); }}
                            className="p-1.5 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-white transition-colors" title="Edit">
                            <Save size={11} />
                        </button>
                        <button onClick={() => handleDelete(shift.id)} className="p-1.5 rounded-xl text-slate-300 hover:text-red-600 hover:bg-white transition-colors" title="Hapus">
                            <Trash2 size={11} />
                        </button>
                    </div>
                </div>

                {/* Expanded disabled dates */}
                {isExpanded && (
                    <div className="bg-slate-50 rounded-2xl p-3 space-y-2 ml-3 animate-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tanggal Nonaktif</p>
                            <input type="date" className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-[10px] text-slate-600 outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                                onChange={e => { addDate(shift, e.target.value); e.target.value = ''; }}
                            />
                        </div>
                        {(shift.disabledDates || []).length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic">Belum ada</p>
                        ) : (
                            <div className="flex flex-wrap gap-1">
                                {(shift.disabledDates || []).sort().map(d => (
                                    <div key={d} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-500 rounded-lg text-[9px] font-bold">
                                        <span>{new Date(d + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                        <button onClick={() => removeDate(shift, d)} className="hover:text-red-700"><X size={8} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setExpandedShiftId(null)} className="text-[9px] text-slate-400 font-bold hover:text-slate-600 flex items-center gap-1">
                            <ChevronDown size={9} className="rotate-180" /> Tutup
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-8 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[32px] shadow-2xl shadow-black/20 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* ══════════ HEADER ══════════ */}
                <div className="flex items-center gap-5 px-8 py-6 border-b border-slate-50 flex-shrink-0">
                    <Avatar className="h-16 w-16 rounded-[20px] shadow-md flex-shrink-0">
                        <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(doctor.name)} text-white text-xl font-black rounded-[20px]`}>
                            {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-slate-900 truncate">{doctor.name}</h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm text-slate-400 font-medium">{doctor.specialty}</span>
                            <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg",
                                doctor.category === 'Bedah' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                            )}>{doctor.category}</span>
                            {doctor.queueCode && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">{doctor.queueCode}</span>}
                            {doctor.status && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600">{doctor.status}</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                            <p className="text-2xl font-black text-slate-900">{docShifts.length}</p>
                            <p className="text-[10px] text-slate-400 font-bold -mt-0.5">Total Shift</p>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ══════════ GRID 7 HARI ══════════ */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-7 h-full divide-x divide-slate-50">
                        {DAYS.map((day, idx) => {
                            const dayShifts = docShifts.filter(s => s.dayIdx === idx);
                            const isToday = idx === todayIdx;
                            const isAddingHere = isAddingDay === idx;

                            return (
                                <div key={day} className={cn(
                                    "flex flex-col min-h-0",
                                    isToday && "bg-blue-50/30"
                                )}>
                                    {/* Day Header */}
                                    <div className={cn(
                                        "flex items-center justify-between px-3 py-3 border-b sticky top-0 z-10",
                                        isToday ? "bg-blue-50/80 backdrop-blur-sm border-blue-100" : "bg-white/90 backdrop-blur-sm border-slate-50"
                                    )}>
                                        <div>
                                            <p className={cn("text-[11px] font-black", isToday ? "text-blue-600" : "text-slate-700")}>{day}</p>
                                            {isToday && <p className="text-[8px] text-blue-400 font-bold -mt-0.5">Hari ini</p>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {dayShifts.length > 0 && (
                                                <span className="text-[9px] font-black text-slate-400 bg-slate-100 w-4 h-4 rounded-full flex items-center justify-center">
                                                    {dayShifts.length}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => { setIsAddingDay(idx); setEditingShiftId(null); setFormData(DEFAULT_FORM); }}
                                                className="p-1 text-slate-300 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Tambah shift"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Shifts + Form */}
                                    <div className="flex-1 p-2 space-y-1.5 overflow-y-auto custom-scrollbar">
                                        {/* Add form */}
                                        {isAddingHere && <ShiftForm dayIdx={idx} />}

                                        {/* Existing shifts */}
                                        {dayShifts.length > 0
                                            ? dayShifts.map(s => renderShift(s, idx))
                                            : !isAddingHere && (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center mb-2">
                                                        <Stethoscope size={13} className="text-slate-200" />
                                                    </div>
                                                    <p className="text-[9px] text-slate-300 font-bold">Tidak ada</p>
                                                    <button
                                                        onClick={() => { setIsAddingDay(idx); setEditingShiftId(null); setFormData(DEFAULT_FORM); }}
                                                        className="mt-1.5 text-[9px] text-slate-400 hover:text-blue-600 font-bold underline transition-colors"
                                                    >
                                                        + Tambah
                                                    </button>
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ══════════ FOOTER ══════════ */}
                <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            <span>Shift aktif</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-300" />
                            <span>Nonaktif hari ini</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CalendarOff size={10} className="text-amber-400" />
                            <span>Punya tanggal pengecualian</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl transition-colors">
                        Tutup
                    </button>
                </div>
            </div>

            {/* Backdrop */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>,
        document.body
    );
}
