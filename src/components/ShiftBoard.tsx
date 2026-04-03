"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Paintbrush, ArrowRightLeft, RotateCcw, Settings, X, Check, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, getDay, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

// ─── SHIFT DEFINITIONS ───────────────────────────────────
interface ShiftDef { id: string; label: string; timeSenin: string; timeSabtu: string; hours: number; colorClass: string; }

const SHIFTS: Record<string, ShiftDef> = {
  P6:  { id:'P6',  label:'P6',  timeSenin:'06.00–14.00', timeSabtu:'06.00–14.00', hours:8, colorClass:'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300' },
  P7:  { id:'P7',  label:'P7',  timeSenin:'07.00–15.00', timeSabtu:'07.00–15.00', hours:8, colorClass:'bg-sky-100 text-sky-700 border-sky-300' },
  P8:  { id:'P8',  label:'P8',  timeSenin:'08.00–16.00', timeSabtu:'10.00–18.00', hours:8, colorClass:'bg-indigo-100 text-indigo-700 border-indigo-300' },
  P9:  { id:'P9',  label:'P9',  timeSenin:'09.00–17.00', timeSabtu:'09.00–15.00', hours:8, colorClass:'bg-emerald-100 text-emerald-700 border-emerald-300' },
  P10: { id:'P10', label:'P10', timeSenin:'10.00–18.00', timeSabtu:'10.00–18.00', hours:8, colorClass:'bg-teal-100 text-teal-700 border-teal-300' },
  P12: { id:'P12', label:'P12', timeSenin:'12.00–20.00', timeSabtu:'12.00–20.00', hours:8, colorClass:'bg-amber-100 text-amber-700 border-amber-300' },
  CT:  { id:'CT',  label:'CT',  timeSenin:'Cuti Tahunan', timeSabtu:'Cuti Tahunan', hours:0, colorClass:'bg-orange-100 text-orange-600 border-orange-300' },
  L:   { id:'L',   label:'L',   timeSenin:'Libur Jatah',  timeSabtu:'Libur Jatah',  hours:0, colorClass:'bg-slate-200 text-slate-500 border-slate-300' },
};

const SHIFT_IDS_CYCLE = ['P6','P7','P8','P9','P10','P12'];
const DEFAULT_LIBUR_QUOTA = 4;
const DEFAULT_CUTI_QUOTA  = 12;

const DEFAULT_CYCLES: Record<string, string[]> = {
  s1: ['P12','P12','P10','P8','P6','P6','P8','P8','P6','P6'],
  s2: ['P10','P8','P6','P6','P8','P8','P6','P6','P12','P12'],
  s3: ['P6','P6','P8','P8','P6','P6','P12','P12','P10','P8'],
  s4: ['P8','P8','P6','P6','P12','P12','P10','P8','P6','P6'],
  s5: ['P6','P6','P12','P12','P10','P8','P6','P6','P8','P8'],
  s6: [],
};

// ─── TYPES ───────────────────────────────────────────────
interface StaffConfig { id: string; staffName: string; cycle: string[]; isSpecial: boolean; sortOrder: number; }

// ─── SCHEDULE ENGINE ─────────────────────────────────────
const MONDAY_ORIGIN = new Date(2026, 2, 30);
const REF_WD_OFFSET = 2;

function getWorkingDayIndex(date: Date): number {
  const d = differenceInDays(date, MONDAY_ORIGIN);
  const fullWeeks = Math.floor(d / 7);
  const dayInWeek = ((d % 7) + 7) % 7;
  const wdCount = fullWeeks * 6 + Math.min(dayInWeek, 5);
  return ((wdCount - REF_WD_OFFSET) % 10 + 1000) % 10;
}

function getDeterministicShift(staff: StaffConfig, date: Date): string | undefined {
  const dow = getDay(date);
  if (dow === 0) return undefined;
  if (staff.isSpecial) return (dow >= 1 && dow <= 4) ? 'P7' : 'P9';
  const cycle = Array.isArray(staff.cycle) ? staff.cycle : [];
  return cycle[getWorkingDayIndex(date)];
}

// ─── CYCLE CONFIG MODAL ───────────────────────────────────
function CycleModal({ staff, onSave, onClose }: { staff: StaffConfig; onSave: (s: StaffConfig) => void; onClose: () => void }) {
  const [cycle, setCycle] = useState<string[]>([...(staff.cycle ?? [])]);
  const [saving, setSaving] = useState(false);
  const dayLabels = ['d1','d2','d3','d4','d5','d6','d7','d8','d9','d10'];

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/jadwal/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: staff.id, cycle }),
    });
    setSaving(false);
    onSave({ ...staff, cycle });
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-6 w-full max-w-lg mx-4 animate-in zoom-in-95 slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-slate-800">Konfigurasi Siklus</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{staff.staffName} — Siklus 10 Hari Kerja</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"><X size={16}/></button>
        </div>

        {staff.isSpecial ? (
          <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 font-medium">
            <p>📌 <strong>{staff.staffName}</strong> menggunakan aturan tetap:</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              <li>• Senin–Kamis: <span className="font-bold text-sky-600">P7 (07.00–15.00)</span></li>
              <li>• Jumat–Sabtu: <span className="font-bold text-emerald-600">P9 (09.00–17.00)</span></li>
            </ul>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {dayLabels.map((label, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wider">{label}</span>
                  <select
                    value={cycle[i] ?? 'P6'}
                    onChange={e => { const c = [...cycle]; c[i] = e.target.value; setCycle(c); }}
                    className={cn("w-full text-xs font-black text-center rounded-xl py-2 border-2 cursor-pointer appearance-none focus:outline-none transition-all", SHIFTS[cycle[i]]?.colorClass ?? 'bg-slate-100 border-slate-200 text-slate-600')}
                  >
                    {SHIFT_IDS_CYCLE.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 mb-4 text-xs text-indigo-700 font-medium">
              💡 Perubahan siklus tersimpan ke database — berlaku untuk semua perangkat secara real-time.
            </div>
            <div className="flex justify-between gap-3">
              <button onClick={() => setCycle([...(DEFAULT_CYCLES[staff.id] ?? [])])}
                className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5">
                <RotateCcw size={12}/> Reset Default
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60">
                {saving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Simpan Siklus
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── INLINE NAME EDITOR ───────────────────────────────────
function InlineNameEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim().toUpperCase();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setDraft(trimmed || value);
    setEditing(false);
  };

  if (editing) return (
    <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      className="font-bold text-slate-800 text-[11px] border-b-2 border-indigo-400 bg-transparent w-full max-w-[145px] outline-none"
    />
  );

  return (
    <span className="font-bold text-slate-800 text-[11px] truncate max-w-[135px] leading-tight cursor-pointer flex items-center gap-1"
      title="Double-klik untuk ubah nama"
      onDoubleClick={() => { setDraft(value); setEditing(true); }}>
      {value}
      <Pencil size={9} className="text-slate-300 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"/>
    </span>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────
export default function ShiftBoard() {
  const [currentMonth, setCurrentMonth]   = useState<Date>(startOfMonth(new Date()));
  const [staffList, setStaffList]         = useState<StaffConfig[]>([]);
  const [overrides, setOverrides]         = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading]             = useState(true);
  const [savingCell, setSavingCell]       = useState<string | null>(null); // "staffId-dateStr"
  const [isSwapMode, setIsSwapMode]       = useState(false);
  const [selectedSwap, setSelectedSwap]   = useState<{ staffId: string; dateStr: string } | null>(null);
  const [configModal, setConfigModal]     = useState<StaffConfig | null>(null);
  const [toast, setToast]                 = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };
  const monthKey = format(currentMonth, 'yyyy-MM');

  const days = useMemo(() =>
    eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  );

  // ── Fetch staff config (sekali saat mount)
  useEffect(() => {
    fetch('/api/jadwal/staff')
      .then(r => r.json())
      .then(j => { if (j.success) setStaffList(j.data); })
      .catch(() => {});
  }, []);

  // ── Fetch overrides setiap ganti bulan
  useEffect(() => {
    if (staffList.length === 0) return;
    setLoading(true);
    fetch(`/api/jadwal/override?month=${monthKey}`)
      .then(r => r.json())
      .then(j => { if (j.success) setOverrides(j.data ?? {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monthKey, staffList.length]);

  const getEffectiveShift = useCallback((staff: StaffConfig, dateStr: string, day: Date): string | undefined => {
    const ov = overrides[staff.id]?.[dateStr];
    if (ov === 'CLEAR') return undefined;
    if (ov) return ov;
    return getDeterministicShift(staff, day);
  }, [overrides]);

  // ── Persist override ke DB
  const persistOverride = async (staffId: string, dateStr: string, shiftValue: string) => {
    const key = `${staffId}-${dateStr}`;
    setSavingCell(key);
    await fetch('/api/jadwal/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, dateStr, shiftValue }),
    }).catch(() => {});
    setSavingCell(null);
  };

  const updateOverride = (staffId: string, dateStr: string, value: string) => {
    setOverrides(prev => ({ ...prev, [staffId]: { ...prev[staffId], [dateStr]: value } }));
    persistOverride(staffId, dateStr, value);
  };

  const handleResetMonth = async () => {
    await fetch(`/api/jadwal/override?month=${monthKey}`, { method: 'DELETE' });
    setOverrides({});
    showToast('Override bulan ini dihapus.');
  };

  const handleCellClick = (staff: StaffConfig, dateStr: string, day: Date) => {
    if (getDay(day) === 0) return;

    if (isSwapMode) {
      if (!selectedSwap) { setSelectedSwap({ staffId: staff.id, dateStr }); return; }
      if (selectedSwap.staffId === staff.id && selectedSwap.dateStr === dateStr) { setSelectedSwap(null); return; }

      const { staffId: s1id, dateStr: d1 } = selectedSwap;
      const day1 = days.find(x => format(x,'yyyy-MM-dd') === d1) ?? day;
      const s1 = staffList.find(s => s.id === s1id)!;
      const val1 = getEffectiveShift(s1, d1, day1);
      const val2 = getEffectiveShift(staff, dateStr, day);

      // Optimistic update
      setOverrides(prev => ({
        ...prev,
        [s1id]:   { ...prev[s1id],   [d1]:     val2 ?? 'CLEAR' },
        [staff.id]:{ ...prev[staff.id], [dateStr]: val1 ?? 'CLEAR' },
      }));
      // Persist both
      persistOverride(s1id, d1, val2 ?? 'CLEAR');
      persistOverride(staff.id, dateStr, val1 ?? 'CLEAR');
      setSelectedSwap(null);
      showToast(`Tukar: ${s1.staffName} ⇄ ${staff.staffName} (${format(day,'dd MMM',{locale:id})})`);
      return;
    }

    // Cyclic click: normal → CT → L → normal
    const ov = overrides[staff.id]?.[dateStr];
    const next = !ov || ov === 'CLEAR' ? 'CT' : ov === 'CT' ? 'L' : 'CLEAR';
    updateOverride(staff.id, dateStr, next);
  };

  const staffSummaries = useMemo(() => {
    const s: Record<string, { hours: number; libur: number; cuti: number }> = {};
    staffList.forEach(staff => {
      let hours = 0, libur = 0, cuti = 0;
      days.forEach(day => {
        const sid = getEffectiveShift(staff, format(day,'yyyy-MM-dd'), day);
        if (!sid) return;
        if (sid === 'L') libur++;
        else if (sid === 'CT') cuti++;
        else if (SHIFTS[sid]) hours += SHIFTS[sid].hours;
      });
      s[staff.id] = { hours, libur, cuti };
    });
    return s;
  }, [days, getEffectiveShift, staffList]);

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999] bg-slate-800 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0"/>{toast}
        </div>
      )}

      {configModal && (
        <CycleModal staff={configModal}
          onSave={updated => { setStaffList(prev => prev.map(s => s.id === updated.id ? updated : s)); setConfigModal(null); showToast(`Siklus ${updated.staffName} diperbarui!`); }}
          onClose={() => setConfigModal(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 bg-white/80 p-1 border border-slate-200/50 rounded-xl shadow-sm">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth,1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"><ChevronLeft size={16}/></button>
            <div className="px-3 min-w-[155px] flex items-center justify-center gap-1.5">
              <CalendarIcon size={13} className="text-fuchsia-600"/>
              <span className="text-sm font-bold text-slate-800 capitalize">{format(currentMonth,'MMMM yyyy',{locale:id})}</span>
            </div>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth,1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"><ChevronRight size={16}/></button>
          </div>
          <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 flex items-center gap-1.5 shadow-sm">
            {loading ? <Loader2 size={10} className="animate-spin"/> : <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>}
            {loading ? 'Memuat...' : 'Tersinkron ke database'}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleResetMonth} className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 shadow-sm transition-all">
            <RotateCcw size={13}/> Reset Override
          </button>
          <button onClick={() => { setIsSwapMode(v=>!v); setSelectedSwap(null); }}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm",
              isSwapMode ? "bg-amber-100 text-amber-700 border-amber-300 animate-pulse" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
            <ArrowRightLeft size={14}/>{isSwapMode ? 'Batal Tukar' : '⇄ Tukar Jadwal'}
          </button>
          <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-2 cursor-not-allowed border border-slate-200 hidden sm:flex">
            <Download size={14}/> Cetak PDF
          </button>
        </div>
      </div>

      {isSwapMode && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"/>
          <p className="text-sm text-amber-800 font-medium">
            {selectedSwap ? <>Pilih jadwal <strong>kedua</strong> untuk ditukar.</> : <><strong>Mode Tukar:</strong> Klik shift pertama, lalu shift tujuan.</>}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
        <Pencil size={10}/><span>Double-klik nama petugas untuk ubah nama. Klik ⚙ untuk ubah pola siklus shift.</span>
      </div>

      {/* Matrix */}
      <div className={cn("w-full overflow-x-auto custom-scrollbar rounded-2xl border bg-white/50 shadow-inner transition-colors duration-300",
        isSwapMode ? "border-amber-300 ring-4 ring-amber-100/60" : "border-slate-100")}>
        <div className="min-w-max inline-block pb-2">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-left border-b border-r border-slate-200/60 w-[230px] font-bold text-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Petugas TPPRJ</th>
                {days.map(day => {
                  const isSun = getDay(day) === 0;
                  return (
                    <th key={day.toISOString()} className={cn("p-1.5 min-w-[44px] border-b border-r border-slate-100 text-center", isSun ? 'bg-rose-50/50' : 'bg-white/30')}>
                      <div className="flex flex-col items-center">
                        <span className={cn("text-[10px] uppercase font-bold leading-none", isSun ? 'text-rose-400' : 'text-slate-400')}>{format(day,'E',{locale:id}).slice(0,3)}</span>
                        <span className={cn("text-xs mt-0.5 font-bold", isSun ? 'text-rose-600' : 'text-slate-700')}>{format(day,'d')}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="sticky right-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-center border-b border-l border-slate-200/60 font-black text-indigo-700 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[78px]">Jam</th>
              </tr>
            </thead>
            <tbody>
              {loading && staffList.length === 0 ? (
                <tr><td colSpan={days.length + 2} className="py-16 text-center text-slate-400 text-sm">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2"/>Memuat jadwal dari database...
                </td></tr>
              ) : staffList.map(staff => {
                const stats = staffSummaries[staff.id] ?? { hours:0, libur:0, cuti:0 };
                return (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors group/row">
                    <td className="sticky left-0 z-20 bg-white/95 backdrop-blur-md p-2 border-b border-r border-slate-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-indigo-700 flex items-center justify-center font-black text-[10px] shrink-0 border border-indigo-200 shadow-sm">
                          {staff.staffName.substring(0,2).toUpperCase()}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <InlineNameEditor value={staff.staffName} onSave={async newName => {
                            await fetch('/api/jadwal/staff', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: staff.id, staffName: newName }) });
                            setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, staffName: newName } : s));
                            showToast(`Nama diperbarui → ${newName}`);
                          }}/>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none",
                              stats.libur > DEFAULT_LIBUR_QUOTA ? 'bg-rose-50 text-rose-600 border-rose-300' : 'bg-slate-50 text-slate-500 border-slate-200')}>
                              L:{stats.libur}/{DEFAULT_LIBUR_QUOTA}
                            </span>
                            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none",
                              stats.cuti > DEFAULT_CUTI_QUOTA ? 'bg-rose-50 text-rose-600 border-rose-300' : 'bg-orange-50 text-orange-600 border-orange-200')}>
                              C:{stats.cuti}/{DEFAULT_CUTI_QUOTA}
                            </span>
                            <button onClick={() => setConfigModal(staff)}
                              className="ml-auto p-1 rounded-md hover:bg-indigo-100 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover/row:opacity-100"
                              title="Ubah pola siklus"><Settings size={10}/></button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {days.map(day => {
                      const isSun = getDay(day) === 0;
                      const dateStr = format(day,'yyyy-MM-dd');
                      const shiftId = getEffectiveShift(staff, dateStr, day);
                      const shift = shiftId ? SHIFTS[shiftId] : null;
                      const hasOverride = !!overrides[staff.id]?.[dateStr] && overrides[staff.id]?.[dateStr] !== 'CLEAR';
                      const isSelected = selectedSwap?.staffId === staff.id && selectedSwap?.dateStr === dateStr;
                      const cellKey = `${staff.id}-${dateStr}`;
                      const isSaving = savingCell === cellKey;

                      if (isSun) return (
                        <td key={dateStr} className="p-1 border-b border-r border-slate-50 bg-rose-50/30 text-center">
                          <div className="w-full h-9 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-rose-200/70"/></div>
                        </td>
                      );

                      return (
                        <td key={dateStr} className="p-1 border-b border-r border-slate-50 text-center" onClick={() => handleCellClick(staff, dateStr, day)}>
                          <div className={cn(
                            "w-9 h-9 mx-auto rounded-lg flex items-center justify-center text-[10px] font-black tracking-tight cursor-pointer select-none border transition-all duration-200 relative",
                            shift ? shift.colorClass : "bg-slate-50/50 border-transparent hover:bg-slate-100 hover:border-slate-200",
                            !isSwapMode && shift && "hover:-translate-y-0.5 hover:scale-105 hover:shadow-md",
                            isSwapMode && "hover:border-amber-400 hover:bg-amber-50",
                            isSelected && "ring-4 ring-amber-400 scale-110 z-10 shadow-xl animate-pulse",
                            isSaving && "opacity-60"
                          )} title={shift ? `${shift.label} — ${getDay(day)===6?shift.timeSabtu:shift.timeSenin}` : 'Klik: CT → L → normal'}>
                            {isSaving ? <Loader2 size={12} className="animate-spin"/> : (shift?.label ?? '')}
                            {hasOverride && !isSaving && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border border-white shadow-sm"/>}
                          </div>
                        </td>
                      );
                    })}

                    <td className="sticky right-0 z-20 bg-white/95 backdrop-blur-md p-2 text-center border-b border-l border-slate-100/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/10 transition-colors">
                      <span className="font-black text-indigo-700 text-xs flex items-center justify-center gap-0.5">
                        {stats.hours > 0 ? stats.hours : '–'}
                        <span className="text-[9px] text-slate-400 font-semibold">Jam</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start justify-between gap-3 bg-slate-50/50 backdrop-blur-md border border-slate-200/50 p-4 rounded-2xl">
        <div className="flex items-center gap-2 shrink-0">
          <Paintbrush size={13} className="text-slate-400"/>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kamus Shift</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          {['P6','P7','P8','P9','P10','P12'].map(sid => {
            const s = SHIFTS[sid];
            return (
              <div key={sid} className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border",s.colorClass)}>{s.label}</div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-700 leading-none">{s.timeSenin}</span>
                  <span className="text-[8px] text-slate-400">Sab: {s.timeSabtu}</span>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border border-slate-100 shadow-sm">
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border",SHIFTS.CT.colorClass)}>CT</div>
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border",SHIFTS.L.colorClass)}>L</div>
            <span className="text-[9px] font-bold text-slate-500">Klik → CT → L</span>
          </div>
        </div>
      </div>
    </div>
  );
}
