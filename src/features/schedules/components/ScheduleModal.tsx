"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    X, Clock, Plus, Trash2, Save, Power, CalendarOff,
    ChevronLeft, ChevronRight, Calendar, Check, AlertCircle, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, Shift } from "@/lib/data-service";
import { useSocket } from "@/hooks/use-socket";
import { getRoutineLabel } from "@/lib/schedule-utils";

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
            <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{label}</p>
            <div className="flex items-center clay-inset rounded-[16px] h-11 px-3 gap-1">
                <select
                    value={h || "08"}
                    onChange={e => onChange(`${e.target.value}:${m || "00"}`)}
                    className="bg-transparent text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none w-9 text-center appearance-none cursor-pointer"
                >
                    {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                    ))}
                </select>
                <span className="text-zinc-400 font-black text-xs">:</span>
                <select
                    value={m || "00"}
                    onChange={e => onChange(`${h || "08"}:${e.target.value}`)}
                    className="bg-transparent text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none w-9 text-center appearance-none cursor-pointer"
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
            <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{label}</p>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full clay-inset rounded-[16px] h-11 px-3 text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none appearance-none cursor-pointer"
            >
                {options.map(o => <option key={o.value} value={o.value} className="bg-white dark:bg-zinc-800">{o.label}</option>)}
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

    const reset = () => { setForm(INIT_FORM); setEditId(null); setAdding(false); };

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

    const safeShifts = Array.isArray(shifts) ? shifts : [];
    const allShifts = safeShifts.filter(s => {
        if (!s || !doctor) return false;
        const matchId = s.doctorId && doctor.id && String(s.doctorId) === String(doctor.id);
        const matchName = s.doctor && doctor.name && String(s.doctor).toLowerCase() === String(doctor.name).toLowerCase();
        return matchId || matchName;
    });
    const dayShifts = allShifts.filter(s => s && Number(s.dayIdx) === Number(activeDay));

    const parseTimes = (formatted?: string | null) => {
        if (!formatted || typeof formatted !== 'string') return { start: "08:00", end: "12:00" };
        const parts = formatted.split("-").map(t => t?.trim() || "");
        return { start: parts[0] || "08:00", end: parts[1] || "12:00" };
    };

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

    const togglePenuh = async (s: Shift) => {
        setIsToggling(true);
        const isPenuh = s.statusOverride === 'PENUH';
        try {
            const payload = {
                id: s.id,
                statusOverride: isPenuh ? null : 'PENUH' // toggle behavior
            };
            const res = await fetch('/api/shifts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Gagal merubah kuota loket');
            socket?.emit('schedule_updated', { action: 'toggle_kuota' });
            onUpdate?.();
            showToast('success', isPenuh ? 'Loket kembali dibuka otomatis' : 'Loket ditutup paksa (Kuota Penuh)');
        } catch (err: any) {
            showToast('error', err.message);
        } finally {
            setIsToggling(false);
        }
    };

    const isFormOpen = adding || !!editId;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="clay-surface w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90dvh] sm:max-h-[88vh] shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* ══ HEADER ══ */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-zinc-200/60 dark:border-[#222738] flex-shrink-0">
                    <div className="h-12 w-12 rounded-[18px] clay-icon-blue flex items-center justify-center text-white text-base font-black flex-shrink-0">
                        <span className="relative z-10">{(doctor?.name || 'Dokter').replace(/^dr\.\s*/i, '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[16px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight truncate">{doctor?.name || 'Dokter'}</h2>
                        <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 font-bold truncate">{doctor?.specialty || '-'} · {allShifts.length} total shift</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-[14px] clay-button text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all flex-shrink-0 active:scale-90">
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* ══ CLAY SEGMENTED DAY SELECTOR ══ */}
                <div className="px-6 py-3 border-b border-zinc-200/60 dark:border-[#222738] flex-shrink-0">
                    <div className="clay-inset p-1.5 rounded-[22px] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {DAYS.map((day, idx) => {
                            const count = allShifts.filter(s => Number(s.dayIdx) === idx).length;
                            const isToday = idx === tIdx;
                            const isActive = idx === activeDay;
                            return (
                                <button
                                    key={day}
                                    onClick={() => { setActiveDay(idx); reset(); }}
                                    className={cn(
                                        "flex-1 flex flex-col items-center justify-center min-w-[50px] py-2 px-2 rounded-[16px] text-xs font-black transition-all relative shrink-0",
                                        isActive
                                            ? "clay-pill-blue text-white"
                                            : "clay-button text-zinc-600 dark:text-zinc-400"
                                    )}
                                >
                                    <span>{day}</span>
                                    {isToday && (
                                        <div className={cn("w-1.5 h-1.5 rounded-full mt-0.5", isActive ? "bg-white" : "bg-blue-500")} />
                                    )}
                                    {count > 0 && (
                                        <span className={cn(
                                            "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center shadow-sm",
                                            isActive ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                                        )}>{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ══ CONTENT ══ */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Toast */}
                    {toast && (
                        <div className={cn(
                            "mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-[16px] text-xs font-black transition-all",
                            toast.type === 'success' ? "clay-pill-emerald text-white" : "clay-pill-rose text-white"
                        )}>
                            {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                            {toast.msg}
                        </div>
                    )}

                    {/* Day header */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-3">
                        <div>
                            <h3 className="text-[14.5px] font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                {DAYS_FULL[activeDay]}
                                {activeDay === tIdx && <span className="text-[9.5px] font-black clay-pill-blue text-white px-2.5 py-0.5 rounded-full">HARI INI</span>}
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">{dayShifts.length} shift terjadwal</p>
                        </div>
                        {!isFormOpen && (
                            <button
                                onClick={() => { setAdding(true); setForm(INIT_FORM); }}
                                className="flex items-center gap-1.5 px-4 py-2 clay-pill-blue text-white text-xs font-black rounded-[14px] transition-all active:scale-95 shadow-sm"
                            >
                                <Plus size={14} strokeWidth={2.5} /> Tambah Shift
                            </button>
                        )}
                    </div>

                    {/* Shift List */}
                    <div className="px-6 pb-4 space-y-3">
                        {dayShifts.length === 0 && !isFormOpen && (
                            <div className="py-12 rounded-[24px] clay-inset text-center">
                                <CalendarOff size={30} className="text-zinc-400 mx-auto mb-2" />
                                <p className="text-[13px] font-bold text-zinc-500">Belum ada shift terjadwal</p>
                                <p className="text-[11px] text-zinc-400 mt-0.5">Klik "Tambah Shift" untuk menambahkan jadwal praktek</p>
                            </div>
                        )}

                        {dayShifts.map(s => {
                            const rawDisabled = s?.disabledDates;
                            const disabledList: string[] = Array.isArray(rawDisabled)
                                ? rawDisabled
                                : typeof rawDisabled === 'string'
                                    ? (() => { try { const p = JSON.parse(rawDisabled); return Array.isArray(p) ? p : [rawDisabled]; } catch { return [rawDisabled]; } })()
                                    : [];
                            const isDisabled = disabledList.includes(today);
                            const isEditing  = editId === s.id;

                            return (
                                <div key={s.id}>
                                    {/* Shift Card */}
                                    {!isEditing && (
                                        <div className={cn(
                                            "flex items-center gap-3.5 px-4 py-3.5 rounded-[22px] clay-surface transition-all",
                                            isDisabled && "opacity-60"
                                        )}>
                                            <div className="w-1.5 h-10 rounded-full bg-blue-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-[13.5px] font-black text-zinc-900 dark:text-zinc-100 truncate", isDisabled && "line-through text-zinc-400")}>
                                                    {s.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="flex items-center gap-1 text-[11px] font-black clay-inset px-2.5 py-0.5 rounded-lg text-blue-600 dark:text-blue-400">
                                                        <Clock size={10} strokeWidth={2.5} /> {s.formattedTime}
                                                    </span>
                                                    {s.registrationTime && (
                                                        <span className="text-[10px] font-bold text-zinc-500 clay-button px-2 py-0.5 rounded-md">Reg: {s.registrationTime}</span>
                                                    )}
                                                    {s.extra === 'odd_weeks' && (
                                                        <span className="text-[9.5px] font-black text-white clay-pill-violet px-2 py-0.5 rounded-md">Ganjil</span>
                                                    )}
                                                    {s.extra === 'even_weeks' && (
                                                        <span className="text-[9.5px] font-black text-white clay-pill-amber px-2 py-0.5 rounded-md">Genap</span>
                                                    )}
                                                    {s.statusOverride === 'PENUH' ? (
                                                        <span className="text-[9.5px] font-black text-white clay-pill-amber px-2 py-0.5 rounded-md flex items-center gap-1">PENUH</span>
                                                    ) : s.statusOverride && (
                                                        <span className="text-[9.5px] font-black uppercase clay-button px-2 py-0.5 rounded-md">{s.statusOverride}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {/* Toggle today */}
                                                {activeDay === tIdx && (
                                                    <>
                                                        <button
                                                            onClick={() => togglePenuh(s)}
                                                            disabled={isToggling}
                                                            title={s.statusOverride === 'PENUH' ? "Buka Kembali Loket (Hapus Override)" : "Tutup Loket Paksa (Kuota Penuh)"}
                                                            className={cn(
                                                                "p-2 rounded-[12px] transition-all",
                                                                s.statusOverride === 'PENUH'
                                                                    ? "clay-pill-amber text-white"
                                                                    : "clay-button text-zinc-400 hover:text-amber-500"
                                                            )}
                                                        >
                                                            <ShieldAlert size={14} className={isToggling ? "animate-spin" : ""} />
                                                        </button>
                                                        <button
                                                            onClick={() => toggle(s)}
                                                            disabled={isToggling}
                                                            title={isDisabled ? "Aktifkan hari ini" : "Nonaktifkan hari ini"}
                                                            className={cn(
                                                                "p-2 rounded-[12px] transition-all",
                                                                isDisabled
                                                                    ? "clay-pill-rose text-white"
                                                                    : "clay-button text-zinc-400 hover:text-emerald-600"
                                                            )}
                                                        >
                                                            <Power size={14} className={isToggling ? "animate-spin" : ""} />
                                                        </button>
                                                    </>
                                                )}
                                                {/* Edit */}
                                                <button
                                                    onClick={() => {
                                                        setForm({ title: s.title, formattedTime: s.formattedTime, registrationTime: s.registrationTime || "", color: s.color, statusOverride: s.statusOverride, extra: s.extra || undefined });
                                                        setEditId(s.id);
                                                        setAdding(false);
                                                    }}
                                                    className="p-2 rounded-[12px] text-zinc-400 hover:text-blue-600 clay-button transition-all"
                                                >
                                                    <Save size={14} />
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => del(s.id)}
                                                    className="p-2 rounded-[12px] text-zinc-400 hover:text-rose-600 clay-button transition-all"
                                                >
                                                    <Trash2 size={14} />
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
                <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-[#222738] flex items-center justify-between flex-shrink-0 bg-white/80 dark:bg-[#121620]/90 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),1rem)] shadow-lg">
                    <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-bold">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Aktif</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Nonaktif</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 clay-button text-zinc-800 dark:text-zinc-200 text-xs font-black rounded-[14px] transition-all"
                    >
                        Tutup
                    </button>
                </div>
            </div>
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
            "rounded-[24px] p-4 sm:p-5 space-y-4 clay-surface shadow-md",
            isAdd ? "border border-zinc-200/50 dark:border-white/5" : "border-2 border-blue-500/40"
        )}>
            <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isAdd ? "text-zinc-500 dark:text-zinc-400" : "text-blue-600 dark:text-blue-400")}>
                    {isAdd ? "Shift Baru" : "Edit Shift"}
                </span>
            </div>

            {/* Title */}
            <input
                autoFocus
                placeholder="Nama shift (cth: Praktek Pagi)"
                value={form.title || ""}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full clay-inset rounded-[16px] px-4 py-3 text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
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
                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Warna</span>
                <div className="flex gap-1.5">
                    {COLORS.map(c => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, color: c.value }))}
                            className={cn(
                                "w-6 h-6 rounded-[8px] transition-all",
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
                    className="flex-1 py-2.5 rounded-[14px] clay-button text-zinc-600 dark:text-zinc-400 text-xs font-black transition-all active:scale-95"
                >
                    Batal
                </button>
                <button
                    onClick={onSave}
                    disabled={!form.title?.trim() || saving}
                    className={cn(
                        "flex-[2] py-2.5 rounded-[14px] text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm",
                        form.title?.trim() && !saving
                            ? isAdd
                                ? "clay-pill-emerald text-white"
                                : "clay-pill-blue text-white"
                            : "clay-button text-zinc-400 cursor-not-allowed opacity-50"
                    )}
                >
                    <Save size={13} strokeWidth={2.5} />
                    <span>{saving ? "Menyimpan..." : isAdd ? "Buat Shift" : "Simpan"}</span>
                </button>
            </div>
        </div>
    );
}
