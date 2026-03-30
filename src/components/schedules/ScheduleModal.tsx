"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    X, Clock, Plus, Trash2, Save, Power, CalendarOff,
    ChevronLeft, ChevronRight, Calendar, Check, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, Shift } from "@/lib/data-service";
import { useSocket } from "@/hooks/use-socket";

interface ScheduleModalProps {
    doctor: Doctor | null;
    shifts: Shift[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAYS_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const COLORS = [
    { value: 'blue',    bg: 'bg-blue-500',    ring: 'ring-blue-400',    light: 'bg-blue-50 border-blue-200 text-blue-700' },
    { value: 'emerald', bg: 'bg-emerald-500',  ring: 'ring-emerald-400', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { value: 'violet',  bg: 'bg-violet-500',   ring: 'ring-violet-400',  light: 'bg-violet-50 border-violet-200 text-violet-700' },
    { value: 'amber',   bg: 'bg-amber-500',    ring: 'ring-amber-400',   light: 'bg-amber-50 border-amber-200 text-amber-700' },
    { value: 'rose',    bg: 'bg-rose-500',     ring: 'ring-rose-400',    light: 'bg-rose-50 border-rose-200 text-rose-700' },
    { value: 'cyan',    bg: 'bg-cyan-500',     ring: 'ring-cyan-400',    light: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
];

const COLOR_MAP: Record<string, { bar: string; light: string }> = {
    blue:    { bar: 'bg-blue-500',    light: 'bg-blue-50 text-blue-700 border-blue-200' },
    emerald: { bar: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    violet:  { bar: 'bg-violet-500',  light: 'bg-violet-50 text-violet-700 border-violet-200' },
    amber:   { bar: 'bg-amber-500',   light: 'bg-amber-50 text-amber-700 border-amber-200' },
    rose:    { bar: 'bg-rose-500',    light: 'bg-rose-50 text-rose-700 border-rose-200' },
    cyan:    { bar: 'bg-cyan-500',    light: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    red:     { bar: 'bg-red-500',     light: 'bg-red-50 text-red-700 border-red-200' },
    green:   { bar: 'bg-green-500',   light: 'bg-green-50 text-green-700 border-green-200' },
};

const getTodayWIB = () => {
    const wib = new Date(Date.now() + 7 * 3600_000);
    return `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, '0')}-${String(wib.getUTCDate()).padStart(2, '0')}`;
};

const getTodayIdx = () => (new Date().getDay() + 6) % 7;

const INIT_FORM: Partial<Shift> = {
    title: "Praktek",
    formattedTime: "08:00-12:00",
    registrationTime: "07:30",
    color: "blue",
    statusOverride: undefined,
    extra: undefined,
};

const STATUS_OVERRIDE_OPTIONS = [
    { value: '',         label: 'Standar (Praktek)' },
    { value: 'PENDAFTARAN',label: 'Pendaftaran' },
    { value: 'OPERASI',  label: 'Operasi' },
    { value: 'PENUH',    label: 'Penuh' },
];

const ROUTINE_OPTIONS = [
    { value: '',           label: 'Setiap Minggu' },
    { value: 'odd_weeks',  label: 'Minggu Ganjil (1,3,5)' },
    { value: 'even_weeks', label: 'Minggu Genap (2,4)' },
];

// ── Time Picker ────────────────────────────────────────────────────────
function TimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    const [h, m] = (value || "08:00").split(":");
    return (
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-11 px-3 gap-1 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <select
                    value={h || "08"}
                    onChange={e => onChange(`${e.target.value}:${m || "00"}`)}
                    className="bg-transparent text-sm font-bold text-slate-800 outline-none w-9 text-center appearance-none cursor-pointer"
                >
                    {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                    ))}
                </select>
                <span className="text-slate-300 font-bold text-sm">:</span>
                <select
                    value={m || "00"}
                    onChange={e => onChange(`${h || "08"}:${e.target.value}`)}
                    className="bg-transparent text-sm font-bold text-slate-800 outline-none w-9 text-center appearance-none cursor-pointer"
                >
                    {["00", "15", "30", "45"].map(min => (
                        <option key={min} value={min}>{min}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// ── Compact Select ──────────────────────────────────────────────────────
function InlineSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl h-11 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

// ── Gradient avatar util ──────────────────────────────────────────────
const gradient = (name: string) => {
    const g = ['from-blue-500 to-cyan-400','from-violet-500 to-purple-400','from-rose-500 to-pink-400','from-amber-500 to-orange-400','from-emerald-500 to-teal-400','from-indigo-500 to-blue-400'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return g[Math.abs(h) % g.length];
};

// ── Main Component ────────────────────────────────────────────────────
export function ScheduleModal({ doctor, shifts, isOpen, onClose, onUpdate }: ScheduleModalProps) {
    const [activeDay, setActiveDay] = useState(getTodayIdx());
    const [form, setForm]           = useState<Partial<Shift>>(INIT_FORM);
    const [editId, setEditId]       = useState<string | null>(null);
    const [adding, setAdding]       = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [toast, setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [saving, setSaving]       = useState(false);
    const [mounted, setMounted]     = useState(false);
    const { socket }                = useSocket();

    useEffect(() => { setMounted(true); }, []);

    const today = getTodayWIB();
    const tIdx  = getTodayIdx();

    const showToast = useCallback((type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (adding || editId) reset(); else onClose(); } };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, adding, editId, onClose]);

    useEffect(() => {
        if (isOpen) { setActiveDay(getTodayIdx()); reset(); }
    }, [isOpen]);

    if (!isOpen || !doctor || !mounted) return null;

    const allShifts = shifts.filter(s => String(s.doctorId) === String(doctor.id));
    const dayShifts = allShifts.filter(s => Number(s.dayIdx) === Number(activeDay));

    const parseTimes = (formatted: string) => {
        const [s, e] = (formatted || "08:00-12:00").split("-").map(t => t.trim());
        return { start: s || "08:00", end: e || "12:00" };
    };

    const reset = () => { setForm(INIT_FORM); setEditId(null); setAdding(false); };

    const save = async () => {
        if (!form.title?.trim() || !form.formattedTime) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                id: editId,
                doctorId: doctor.id,
                doctor: doctor.name,
                dayIdx: activeDay,
                statusOverride: form.statusOverride || null,
                extra: form.extra || null,
            };
            const res = await fetch('/api/shifts', {
                method: editId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menyimpan');
            socket?.emit('schedule_updated', { action: 'save_shift' });
            onUpdate?.();
            reset();
            showToast('success', editId ? 'Shift diperbarui' : 'Shift baru ditambahkan');
        } catch (err: any) {
            showToast('error', err.message || 'Gagal menyimpan shift');
        } finally {
            setSaving(false);
        }
    };

    const del = async (id: string) => {
        if (!confirm("Hapus shift ini secara permanen?")) return;
        try {
            const res = await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menghapus');
            socket?.emit('schedule_updated', { action: 'delete_shift' });
            onUpdate?.();
            reset();
            showToast('success', 'Shift dihapus');
        } catch (err: any) {
            showToast('error', err.message);
        }
    };

    const toggle = async (s: Shift) => {
        setIsToggling(true);
        const off = s.disabledDates || [];
        const isOff = off.includes(today);
        const newVal = isOff ? off.filter(d => d !== today) : [...off, today];
        try {
            const res = await fetch('/api/shifts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: s.id, disabledDates: newVal }),
            });
            if (!res.ok) throw new Error('Gagal mengubah status');
            socket?.emit('schedule_updated', { action: 'toggle_shift' });
            onUpdate?.();
            showToast('success', isOff ? 'Shift diaktifkan hari ini' : 'Shift dinonaktifkan hari ini');
        } catch (err: any) {
            showToast('error', err.message);
        } finally {
            setIsToggling(false);
        }
    };

    const isFormOpen = adding || !!editId;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-8"
            style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-2xl rounded-[20px] shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: '88vh', animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ══ HEADER ══ */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 flex-shrink-0">
                    <div className={cn("h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-base font-black shadow-md flex-shrink-0", gradient(doctor.name))}>
                        {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[15px] font-bold text-slate-800 truncate">{doctor.name}</h2>
                        <p className="text-[12px] text-slate-400 truncate">{doctor.specialty} · {allShifts.length} total shift</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
                        <X size={18} />
                    </button>
                </div>

                {/* ══ DAY SELECTOR ══ */}
                <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-100 flex-shrink-0 overflow-x-auto">
                    {DAYS.map((day, idx) => {
                        const count = allShifts.filter(s => Number(s.dayIdx) === idx).length;
                        const isToday = idx === tIdx;
                        const isActive = idx === activeDay;
                        return (
                            <button
                                key={day}
                                onClick={() => { setActiveDay(idx); reset(); }}
                                className={cn(
                                    "flex-shrink-0 flex flex-col items-center justify-center min-w-[52px] py-2 px-2 rounded-xl text-[11px] font-bold transition-all relative",
                                    isActive
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <span>{day}</span>
                                {isToday && (
                                    <div className={cn("w-1 h-1 rounded-full mt-0.5", isActive ? "bg-blue-400" : "bg-blue-300")} />
                                )}
                                {count > 0 && (
                                    <span className={cn(
                                        "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center",
                                        isActive ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
                                    )}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ══ CONTENT ══ */}
                <div className="flex-1 overflow-y-auto">
                    {/* Toast */}
                    {toast && (
                        <div className={cn(
                            "mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                            toast.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                        )}>
                            {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                            {toast.msg}
                        </div>
                    )}

                    {/* Day header */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-3">
                        <div>
                            <h3 className="text-[14px] font-bold text-slate-800">
                                {DAYS_FULL[activeDay]}
                                {activeDay === tIdx && <span className="ml-2 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">HARI INI</span>}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">{dayShifts.length} shift terjadwal</p>
                        </div>
                        {!isFormOpen && (
                            <button
                                onClick={() => { setAdding(true); setForm(INIT_FORM); }}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold rounded-xl transition-all active:scale-95 shadow-sm"
                            >
                                <Plus size={13} /> Tambah Shift
                            </button>
                        )}
                    </div>

                    {/* Shift List */}
                    <div className="px-6 pb-4 space-y-2">
                        {dayShifts.length === 0 && !isFormOpen && (
                            <div className="py-10 rounded-2xl border-2 border-dashed border-slate-150 text-center">
                                <CalendarOff size={28} className="text-slate-200 mx-auto mb-2" />
                                <p className="text-[13px] font-semibold text-slate-400">Belum ada shift</p>
                                <p className="text-[11px] text-slate-300 mt-0.5">Klik "Tambah Shift" untuk menambahkan jadwal</p>
                            </div>
                        )}

                        {dayShifts.map(s => {
                            const isDisabled = (s.disabledDates || []).includes(today);
                            const isEditing  = editId === s.id;
                            const col = COLOR_MAP[s.color || 'blue'] || COLOR_MAP.blue;

                            return (
                                <div key={s.id}>
                                    {/* Shift Card */}
                                    {!isEditing && (
                                        <div className={cn(
                                            "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all",
                                            isDisabled
                                                ? "bg-slate-50 border-slate-200 opacity-60"
                                                : `${col.light} border`
                                        )}>
                                            <div className={cn("w-1 h-10 rounded-full flex-shrink-0", col.bar, isDisabled && "opacity-30")} />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-[13px] font-bold truncate", isDisabled && "line-through text-slate-400")}>
                                                    {s.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="flex items-center gap-1 text-[11px] font-semibold opacity-70">
                                                        <Clock size={10} /> {s.formattedTime}
                                                    </span>
                                                    {s.registrationTime && (
                                                        <span className="text-[10px] opacity-50">Daftar: {s.registrationTime}</span>
                                                    )}
                                                    {s.statusOverride && (
                                                        <span className="text-[10px] font-bold opacity-70 uppercase">{s.statusOverride}</span>
                                                    )}
                                                    {activeDay === tIdx && isDisabled && (
                                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">Nonaktif hari ini</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {/* Toggle today */}
                                                {activeDay === tIdx && (
                                                    <button
                                                        onClick={() => toggle(s)}
                                                        disabled={isToggling}
                                                        title={isDisabled ? "Aktifkan hari ini" : "Nonaktifkan hari ini"}
                                                        className={cn(
                                                            "p-2 rounded-xl border transition-all",
                                                            isDisabled
                                                                ? "bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200"
                                                                : "bg-white/60 border-transparent text-slate-400 hover:text-red-500 hover:border-red-100"
                                                        )}
                                                    >
                                                        <Power size={13} className={isToggling ? "animate-spin" : ""} />
                                                    </button>
                                                )}
                                                {/* Edit */}
                                                <button
                                                    onClick={() => {
                                                        setForm({ title: s.title, formattedTime: s.formattedTime, registrationTime: s.registrationTime || "", color: s.color, statusOverride: s.statusOverride, extra: s.extra });
                                                        setEditId(s.id);
                                                        setAdding(false);
                                                    }}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                                >
                                                    <Save size={13} />
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => del(s.id)}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Inline Edit Form */}
                                    {isEditing && (
                                        <ShiftForm
                                            form={form}
                                            setForm={setForm}
                                            parseTimes={parseTimes}
                                            saving={saving}
                                            onSave={save}
                                            onCancel={reset}
                                            mode="edit"
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Form */}
                        {adding && !editId && (
                            <ShiftForm
                                form={form}
                                setForm={setForm}
                                parseTimes={parseTimes}
                                saving={saving}
                                onSave={save}
                                onCancel={reset}
                                mode="add"
                            />
                        )}
                    </div>
                </div>

                {/* ══ FOOTER ══ */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Aktif</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-300 inline-block" /> Nonaktif hari ini</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold rounded-xl transition-all"
                    >
                        Tutup
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0.96); opacity: 0; }
                    to   { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>,
        document.body
    );
}

// ── Shift Form Sub-component ──────────────────────────────────────────
function ShiftForm({
    form, setForm, parseTimes, saving, onSave, onCancel, mode
}: {
    form: Partial<Shift>;
    setForm: React.Dispatch<React.SetStateAction<Partial<Shift>>>;
    parseTimes: (s: string) => { start: string; end: string };
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
    mode: 'add' | 'edit';
}) {
    const times = parseTimes(form.formattedTime || "08:00-12:00");
    const isAdd = mode === 'add';

    return (
        <div className={cn(
            "rounded-2xl border p-5 space-y-4",
            isAdd ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-200"
        )}>
            <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isAdd ? "text-slate-500" : "text-blue-600")}>
                    {isAdd ? "Shift Baru" : "Edit Shift"}
                </span>
            </div>

            {/* Title */}
            <input
                autoFocus
                placeholder="Nama shift (cth: Praktek Pagi)"
                value={form.title || ""}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
            />

            {/* Times */}
            <div className="grid grid-cols-3 gap-3">
                <TimePicker
                    label="Jam Mulai"
                    value={times.start}
                    onChange={v => setForm(f => ({ ...f, formattedTime: `${v}-${parseTimes(f.formattedTime || "").end}` }))}
                />
                <TimePicker
                    label="Jam Selesai"
                    value={times.end}
                    onChange={v => setForm(f => ({ ...f, formattedTime: `${parseTimes(f.formattedTime || "").start}-${v}` }))}
                />
                <TimePicker
                    label="Jam Daftar"
                    value={form.registrationTime || "07:30"}
                    onChange={v => setForm(f => ({ ...f, registrationTime: v }))}
                />
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-2 gap-3">
                <InlineSelect
                    label="Status Bawaan"
                    value={form.statusOverride || ""}
                    onChange={v => setForm(f => ({ ...f, statusOverride: (v || undefined) as any }))}
                    options={STATUS_OVERRIDE_OPTIONS}
                />
                <InlineSelect
                    label="Pola Rutinitas"
                    value={form.extra || ""}
                    onChange={v => setForm(f => ({ ...f, extra: (v || undefined) as any }))}
                    options={ROUTINE_OPTIONS}
                />
            </div>

            {/* Color */}
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warna</span>
                <div className="flex gap-1.5">
                    {COLORS.map(c => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, color: c.value }))}
                            className={cn(
                                "w-6 h-6 rounded-lg transition-all",
                                c.bg,
                                form.color === c.value ? `ring-2 ring-offset-1 ${c.ring} scale-110 shadow-md` : "opacity-40 hover:opacity-70"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-[12px] font-bold hover:bg-slate-50 transition-all"
                >
                    Batal
                </button>
                <button
                    onClick={onSave}
                    disabled={!form.title?.trim() || saving}
                    className={cn(
                        "flex-[2] py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]",
                        form.title?.trim() && !saving
                            ? isAdd
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                >
                    <Save size={13} />
                    {saving ? "Menyimpan..." : isAdd ? "Buat Shift" : "Simpan"}
                </button>
            </div>
        </div>
    );
}
