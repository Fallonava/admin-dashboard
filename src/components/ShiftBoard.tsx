"use client";

import React, { useMemo, useState, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Paintbrush, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, getDay, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

// ─────────────────────────────────────────────
//  SHIFT DEFINITIONS
// ─────────────────────────────────────────────
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

const DEFAULT_LIBUR_QUOTA = 4;
const DEFAULT_CUTI_QUOTA  = 12;

// ─────────────────────────────────────────────
//  STAFF LIST
// ─────────────────────────────────────────────
const STAFF_LIST = [
  'IBNU ISWANTORO',
  'FAISHAL FADHLULLOH',
  'TEDI DWI C',
  'SIDIQ ARIEF P',
  'NUR SYAHID',
  'RIDHO R',
];

// ─────────────────────────────────────────────
//  DETERMINISTIC SCHEDULE ENGINE
//
//  Pattern decoded from Excel "JADWAL TPPRJ PERIODE APRIL 2026".
//
//  Rule: count working-days (Mon–Sat, skip Sun) from the
//  reference date April 1 2026 (Wednesday = wd-index 0).
//  Apply 10-day rotating cycle per staff.
//
//  RIDHO: always P7 on weekdays, P9 on Saturdays.
//  TEDI:  alternates P6 / P8 by ISO-week parity relative to
//         ISO Week 14 2026 (= week containing Apr 1).
//
//  Reference cycles verified against full April schedule:
//    IBNU   d0–9: P12 P12 P10 P8  P6  P6  P8  P8  P6  P6
//    FAISHAL d0–9: P10 P8  P6  P6  P8  P8  P6  P6  P12 P12
//    SIDIQ  d0–9: P8  P8  P6  P6  P12 P12 P10 P8  P6  P6
//    NUR    d0–9: P6  P6  P12 P12 P10 P8  P6  P6  P8  P8
// ─────────────────────────────────────────────

const CYCLES: Record<string, string[]> = {
  'IBNU ISWANTORO':    ['P12','P12','P10','P8', 'P6', 'P6', 'P8', 'P8', 'P6', 'P6'],
  'FAISHAL FADHLULLOH':['P10','P8', 'P6', 'P6', 'P8', 'P8', 'P6', 'P6', 'P12','P12'],
  'TEDI DWI C':        ['P6', 'P6', 'P8', 'P8', 'P6', 'P6', 'P12','P12','P10','P8'],
  'SIDIQ ARIEF P':     ['P8', 'P8', 'P6', 'P6', 'P12','P12','P10','P8', 'P6', 'P6'],
  'NUR SYAHID':        ['P6', 'P6', 'P12','P12','P10','P8', 'P6', 'P6', 'P8', 'P8'],
};

// Monday before April 1 2026 = March 30 2026
const MONDAY_ORIGIN = new Date(2026, 2, 30); // month is 0-indexed
const REF_WD_OFFSET = 2; // April 1 (Wed) = 2 working days from the Monday

function getWorkingDayIndex(date: Date): number {
  const d = differenceInDays(date, MONDAY_ORIGIN);
  const fullWeeks = Math.floor(d / 7);
  const dayInWeek = ((d % 7) + 7) % 7; // 0=Mon ... 6=Sun
  const wdCount = fullWeeks * 6 + Math.min(dayInWeek, 5);
  return ((wdCount - REF_WD_OFFSET) % 10 + 1000) % 10;
}

function getDeterministicShift(staff: string, date: Date): string | undefined {
  const dow = getDay(date);
  if (dow === 0) return undefined; // Sunday off

  // RIDHO: Mon–Thu = P7 (07.00-15.00), Fri–Sat = P9
  if (staff === 'RIDHO R') return (dow >= 1 && dow <= 4) ? 'P7' : 'P9';

  const cycle = CYCLES[staff];
  if (!cycle) return undefined;
  return cycle[getWorkingDayIndex(date)];
}

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
export default function ShiftBoard() {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  // Only manual overrides (CT / L / swap) are stored; auto-schedule is computed.
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<{ staff: string; dateStr: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const days = useMemo(() =>
    eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  );

  const getEffectiveShift = useCallback((staff: string, dateStr: string, day: Date): string | undefined => {
    const ov = overrides[staff]?.[dateStr];
    if (ov === 'CLEAR') return undefined;
    if (ov) return ov;
    return getDeterministicShift(staff, day);
  }, [overrides]);

  const handleResetMonth = () => {
    const newOv = { ...overrides };
    STAFF_LIST.forEach(staff => {
      if (!newOv[staff]) return;
      const s = { ...newOv[staff] };
      days.forEach(d => { delete s[format(d, 'yyyy-MM-dd')]; });
      newOv[staff] = s;
    });
    setOverrides(newOv);
    showToast('Override bulan ini dihapus — jadwal kembali ke pola asli.');
  };

  const handleCellClick = (staff: string, dateStr: string, day: Date) => {
    if (getDay(day) === 0) return; // Minggu terkunci

    if (isSwapMode) {
      if (!selectedSwap) { setSelectedSwap({ staff, dateStr }); return; }
      if (selectedSwap.staff === staff && selectedSwap.dateStr === dateStr) { setSelectedSwap(null); return; }

      const { staff: s1, dateStr: d1 } = selectedSwap;
      const day1 = days.find(x => format(x, 'yyyy-MM-dd') === d1) ?? day;
      const val1 = getEffectiveShift(s1, d1, day1);
      const val2 = getEffectiveShift(staff, dateStr, day);

      setOverrides(prev => ({
        ...prev,
        [s1]:    { ...prev[s1],    [d1]:     val2 ?? 'CLEAR' },
        [staff]: { ...prev[staff], [dateStr]: val1 ?? 'CLEAR' },
      }));
      setSelectedSwap(null);
      showToast(`Tukar berhasil: ${s1} ⇄ ${staff} (${format(day, 'dd MMM', { locale: id })})`);
      return;
    }

    // Cyclic click: [normal] → CT → L → [kembali normal]
    const ov = overrides[staff]?.[dateStr];
    const next = !ov || ov === 'CLEAR' ? 'CT' : ov === 'CT' ? 'L' : 'CLEAR';
    setOverrides(prev => ({ ...prev, [staff]: { ...prev[staff], [dateStr]: next } }));
  };

  const staffSummaries = useMemo(() => {
    const s: Record<string, { hours: number; libur: number; cuti: number }> = {};
    STAFF_LIST.forEach(staff => {
      let hours = 0, libur = 0, cuti = 0;
      days.forEach(day => {
        const sid = getEffectiveShift(staff, format(day, 'yyyy-MM-dd'), day);
        if (!sid) return;
        if (sid === 'L') libur++;
        else if (sid === 'CT') cuti++;
        else if (SHIFTS[sid]) hours += SHIFTS[sid].hours;
      });
      s[staff] = { hours, libur, cuti };
    });
    return s;
  }, [days, getEffectiveShift]);

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999] bg-slate-800 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0" />
          {toast}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Month navigator */}
          <div className="flex items-center gap-0.5 bg-white/80 p-1 border border-slate-200/50 rounded-xl shadow-sm">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"><ChevronLeft size={16}/></button>
            <div className="px-3 min-w-[155px] flex items-center justify-center gap-1.5">
              <CalendarIcon size={13} className="text-fuchsia-600"/>
              <span className="text-sm font-bold text-slate-800 capitalize">{format(currentMonth, 'MMMM yyyy', { locale: id })}</span>
            </div>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"><ChevronRight size={16}/></button>
          </div>
          {/* Rotation badge */}
          <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 flex items-center gap-1.5 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>
            Siklus otomatis aktif
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleResetMonth} className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 shadow-sm transition-all">
            <RotateCcw size={13}/> Reset Override
          </button>
          <button
            onClick={() => { setIsSwapMode(v => !v); setSelectedSwap(null); }}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm",
              isSwapMode ? "bg-amber-100 text-amber-700 border-amber-300 shadow-amber-200/60 shadow-md animate-pulse" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <ArrowRightLeft size={14}/>{isSwapMode ? 'Batal Tukar' : '⇄ Tukar Jadwal'}
          </button>
          <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-2 cursor-not-allowed border border-slate-200 hidden sm:flex">
            <Download size={14}/> Cetak PDF
          </button>
        </div>
      </div>

      {/* Swap banner */}
      {isSwapMode && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"/>
          <p className="text-sm text-amber-800 font-medium">
            {selectedSwap
              ? <>Pilih jadwal <strong>kedua</strong> untuk ditukar dengan <strong>{selectedSwap.staff}</strong> ({format(new Date(selectedSwap.dateStr), 'dd MMM', { locale: id })})</>
              : <><strong>Mode Tukar Aktif:</strong> Klik shift pertama, lalu shift tujuan.</>}
          </p>
        </div>
      )}

      {/* ── Matrix ── */}
      <div className={cn("w-full overflow-x-auto custom-scrollbar rounded-2xl border bg-white/50 shadow-inner transition-colors duration-300",
        isSwapMode ? "border-amber-300 ring-4 ring-amber-100/60" : "border-slate-100")}>
        <div className="min-w-max inline-block pb-2">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-left border-b border-r border-slate-200/60 w-[215px] font-bold text-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Petugas TPPRJ
                </th>
                {days.map(day => {
                  const isSun = getDay(day) === 0;
                  return (
                    <th key={day.toISOString()} className={cn("p-1.5 min-w-[44px] border-b border-r border-slate-100 text-center", isSun ? 'bg-rose-50/50' : 'bg-white/30')}>
                      <div className="flex flex-col items-center">
                        <span className={cn("text-[10px] uppercase font-bold leading-none", isSun ? 'text-rose-400' : 'text-slate-400')}>
                          {format(day, 'E', { locale: id }).slice(0, 3)}
                        </span>
                        <span className={cn("text-xs mt-0.5 font-bold", isSun ? 'text-rose-600' : 'text-slate-700')}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="sticky right-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-center border-b border-l border-slate-200/60 font-black text-indigo-700 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[78px]">
                  Jam
                </th>
              </tr>
            </thead>
            <tbody>
              {STAFF_LIST.map(staff => {
                const stats = staffSummaries[staff] ?? { hours: 0, libur: 0, cuti: 0 };
                return (
                  <tr key={staff} className="hover:bg-slate-50/60 transition-colors group/row">
                    {/* Name cell */}
                    <td className="sticky left-0 z-20 bg-white/95 backdrop-blur-md p-2 border-b border-r border-slate-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-indigo-700 flex items-center justify-center font-black text-[10px] shrink-0 border border-indigo-200 shadow-sm">
                          {staff.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[11px] truncate max-w-[145px] leading-tight">{staff}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none",
                              stats.libur > DEFAULT_LIBUR_QUOTA ? 'bg-rose-50 text-rose-600 border-rose-300' : 'bg-slate-50 text-slate-500 border-slate-200')}>
                              L:{stats.libur}/{DEFAULT_LIBUR_QUOTA}
                            </span>
                            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none",
                              stats.cuti > DEFAULT_CUTI_QUOTA ? 'bg-rose-50 text-rose-600 border-rose-300' : 'bg-orange-50 text-orange-600 border-orange-200')}>
                              C:{stats.cuti}/{DEFAULT_CUTI_QUOTA}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Day cells */}
                    {days.map(day => {
                      const isSun = getDay(day) === 0;
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const shiftId = getEffectiveShift(staff, dateStr, day);
                      const shift = shiftId ? SHIFTS[shiftId] : null;
                      const hasOverride = !!overrides[staff]?.[dateStr] && overrides[staff]?.[dateStr] !== 'CLEAR';
                      const isSelected = selectedSwap?.staff === staff && selectedSwap?.dateStr === dateStr;

                      if (isSun) return (
                        <td key={dateStr} className="p-1 border-b border-r border-slate-50 bg-rose-50/30 text-center">
                          <div className="w-full h-8 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-200/70"/>
                          </div>
                        </td>
                      );

                      return (
                        <td key={dateStr} className="p-1 border-b border-r border-slate-50 text-center" onClick={() => handleCellClick(staff, dateStr, day)}>
                          <div className={cn(
                            "w-9 h-9 mx-auto rounded-lg flex items-center justify-center text-[10px] font-black tracking-tight cursor-pointer select-none border transition-all duration-200 relative",
                            shift ? shift.colorClass : "bg-slate-50/50 border-transparent hover:bg-slate-100 hover:border-slate-200",
                            !isSwapMode && shift && "hover:-translate-y-0.5 hover:scale-105 hover:shadow-md",
                            isSwapMode && "hover:border-amber-400 hover:bg-amber-50",
                            isSelected && "ring-4 ring-amber-400 scale-110 z-10 shadow-xl animate-pulse"
                          )}
                            title={shift ? `${shift.label} — ${getDay(day) === 6 ? shift.timeSabtu : shift.timeSenin}` : 'Klik: CT → L → normal'}
                          >
                            {shift?.label ?? ''}
                            {hasOverride && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border border-white shadow-sm"/>}
                          </div>
                        </td>
                      );
                    })}

                    {/* Total hours */}
                    <td className="sticky right-0 z-20 bg-white/95 backdrop-blur-md p-2 text-center border-b border-l border-slate-100/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/20 transition-colors">
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

      {/* ── Legend ── */}
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
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border", s.colorClass)}>{s.label}</div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-700 leading-none">{s.timeSenin}</span>
                  <span className="text-[8px] text-slate-400">Sab: {s.timeSabtu}</span>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border border-slate-100 shadow-sm">
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border", SHIFTS.CT.colorClass)}>CT</div>
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border", SHIFTS.L.colorClass)}>L</div>
            <span className="text-[9px] font-bold text-slate-500">Klik → CT → L</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border border-slate-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"/>
            <span className="text-[9px] font-bold text-slate-500">Override manual</span>
          </div>
        </div>
      </div>
    </div>
  );
}
