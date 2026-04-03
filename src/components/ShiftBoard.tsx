"use client";

import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Wand2, Paintbrush, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface ShiftDef {
  id: string;
  label: string;
  time: string;
  hours: number;
  colorClass: string;
}

const DEFAULT_LIBUR_QUOTA = 4;
const DEFAULT_CUTI_QUOTA = 12;

const SHIFTS: Record<string, ShiftDef> = {
  P6: { id: 'P6', label: 'P6', time: '06.00 - 14.00', hours: 8, colorClass: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  P7: { id: 'P7', label: 'P7', time: '08.00 - 16.00', hours: 8, colorClass: 'bg-sky-100 text-sky-700 border-sky-200' },
  P8: { id: 'P8', label: 'P8', time: '08.00 - 16.00', hours: 8, colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  P9: { id: 'P9', label: 'P9', time: '09.00 - 17.00', hours: 8, colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  P10: { id: 'P10', label: 'P10', time: '10.00 - 18.00', hours: 8, colorClass: 'bg-teal-100 text-teal-700 border-teal-200' },
  P12: { id: 'P12', label: 'P12', time: '12.00 - 20.00', hours: 8, colorClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  CT: { id: 'CT', label: 'CT', time: 'Cuti Tahunan', hours: 0, colorClass: 'bg-orange-100 text-orange-600 border-orange-200 shadow-inner' },
  L: { id: 'L', label: 'L', time: 'Libur (Jatah)', hours: 0, colorClass: 'bg-slate-200 text-slate-500 border-slate-300 shadow-inner' },
};

const STAFF_LIST = [
  'IBNU ISWANTORO',
  'FAISHAL FADHLULLOH',
  'TEDI DWI C',
  'SIDIQ ARIEF P',
  'NUR SYAHID',
  'RIDHO R'
];

export default function ShiftBoard() {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [schedule, setSchedule] = useState<Record<string, Record<string, string>>>({}); // staffName -> { dateStr -> shiftId }
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Swap Mode State
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<{staff: string, dateStr: string} | null>(null);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  }, [currentMonth]);

  const handleAutoGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
        const newSchedule: Record<string, Record<string, string>> = { ...schedule };
        STAFF_LIST.forEach(s => {
          if (!newSchedule[s]) newSchedule[s] = {};
        });
        
        days.forEach(day => {
          const isSunday = day.getDay() === 0;
          const isSaturday = day.getDay() === 6;
          const dateStr = format(day, 'yyyy-MM-dd');
          
          if (isSunday) {
              // Hapus jadwal kerja, TAPI biarkan kalau sudah Cuti (CT) sebelumnya untuk arsip.
              STAFF_LIST.forEach(s => { 
                 if (newSchedule[s][dateStr] !== 'CT') { // L tidak relevan di hari minggu
                    delete newSchedule[s][dateStr]; 
                 }
              });
          } else {
              let todaysShifts = ['P6', 'P6', 'P8', 'P8', 'P10', 'P12']; 
              if (isSaturday) {
                  todaysShifts = ['P6', 'P6', 'P8', 'P9', 'P12', 'P12'];
              }

              todaysShifts.sort(() => Math.random() - 0.5);

              let shiftPointer = 0;
              STAFF_LIST.forEach((staff) => {
                  const existingShift = newSchedule[staff][dateStr];
                  // Imunitas Sihir: Jika staf sudah diset Cuti atau Libur, kita lewati dia
                  if (existingShift === 'CT' || existingShift === 'L') {
                      // Preserve (sudah terisi cuti)
                  } else {
                      // Alokasikan shift harian normal
                      newSchedule[staff][dateStr] = todaysShifts[shiftPointer] || undefined as any;
                      shiftPointer++;
                  }
              });
          }
        });
        
        setSchedule(newSchedule);
        setIsGenerating(false);
        if (isSwapMode) setIsSwapMode(false);
        setSelectedSwap(null);
    }, 600);
  };

  const handleCellClick = (staff: string, dateStr: string) => {
     // SWAP MODE LOGIC
     if (isSwapMode) {
        if (!selectedSwap) {
           setSelectedSwap({ staff, dateStr });
        } else {
           const staff1 = selectedSwap.staff;
           const date1 = selectedSwap.dateStr;
           const staff2 = staff;
           const date2 = dateStr;

           if (staff1 === staff2 && date1 === date2) {
               setSelectedSwap(null); // click self to cancel
               return;
           }

           setSchedule(prev => {
               const newSchedule = { ...prev };
               const val1 = prev[staff1]?.[date1];
               const val2 = prev[staff2]?.[date2];
               
               newSchedule[staff1] = { ...prev[staff1], [date1]: val2 as any };
               newSchedule[staff2] = { ...prev[staff2], [date2]: val1 as any };
               return newSchedule;
           });
           setSelectedSwap(null);
        }
        return;
     }

     // NORMAL CYCLIC CLICK LOGIC
     const currentShift = schedule[staff]?.[dateStr];
     const shiftIds = Object.keys(SHIFTS);
     
     let nextShiftId = undefined;
     if (!currentShift) {
        nextShiftId = shiftIds[0];
     } else {
        const currentIndex = shiftIds.indexOf(currentShift);
        if (currentIndex < shiftIds.length - 1) {
           nextShiftId = shiftIds[currentIndex + 1];
        }
     }

     setSchedule(prev => ({
        ...prev,
        [staff]: {
            ...prev[staff],
            [dateStr]: nextShiftId as any
        }
     }));
  };

  // Kalkulasi total jam kerja dan dompet jatah per staf bulan ini
  const staffSummaries = useMemo(() => {
      const summary: Record<string, { totalHours: number, usedLibur: number, usedCuti: number }> = {};
      STAFF_LIST.forEach(staff => {
         let totalHours = 0;
         let usedLibur = 0;
         let usedCuti = 0;
         days.forEach(day => {
             const dateStr = format(day, 'yyyy-MM-dd');
             const shiftId = schedule[staff]?.[dateStr];
             if (shiftId) {
                 if (shiftId === 'L') usedLibur++;
                 else if (shiftId === 'CT') usedCuti++;
                 else if (SHIFTS[shiftId]) totalHours += SHIFTS[shiftId].hours;
             }
         });
         summary[staff] = { totalHours, usedLibur, usedCuti };
      });
      return summary;
  }, [schedule, days]);

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col gap-6">
       
       {/* Toolbar Header */}
       <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 border border-slate-200/50 rounded-xl shadow-sm w-fit">
             <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <ChevronLeft size={16} />
             </button>
             <div className="px-3 min-w-[140px] text-center flex items-center justify-center gap-2">
                <CalendarIcon size={14} className="text-fuchsia-600"/>
                <span className="text-sm font-bold text-slate-800 tracking-wide capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: id })}
                </span>
             </div>
             <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <ChevronRight size={16} />
             </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
             <button 
               onClick={() => {
                  setIsSwapMode(!isSwapMode);
                  setSelectedSwap(null);
               }} 
               className={cn(
                 "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm",
                 isSwapMode 
                  ? "bg-amber-100 text-amber-700 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
               )}
             >
                <ArrowRightLeft size={14}/> {isSwapMode ? 'Batal Tukar' : '⇄ Mode Tukar Jadwal'}
             </button>
             <button disabled className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-2 cursor-not-allowed border border-slate-200 hidden sm:flex">
                <Download size={14}/> Cetak
             </button>
             <button 
               onClick={handleAutoGenerate} 
               disabled={isGenerating}
               className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-[0_4px_15px_-3px_rgba(147,51,234,0.4)] transition-all flex items-center gap-2"
             >
                <Wand2 size={14} className={cn(isGenerating && "animate-spin")} /> 
                {isGenerating ? 'Menyihir...' : 'Sihir Otomatis'}
             </button>
          </div>
       </div>

       {/* Mode Tukar Banner */}
       {isSwapMode && (
         <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-sm text-amber-800 font-medium">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
             {selectedSwap 
               ? <span>Pilih jadwal kedua untuk ditukar dengan jadwal <strong className="font-bold">{selectedSwap.staff} ({format(new Date(selectedSwap.dateStr), 'dd MMM')})</strong></span>
               : <span><strong>Mode Tukar Aktif:</strong> Klik jadwal pertama yang ingin dipindah, lalu klik jadwal tujuan.</span>
             }
           </div>
         </div>
       )}

       {/* Matrix Container */}
       <div className={cn("relative z-10 w-full overflow-x-auto custom-scrollbar rounded-2xl border bg-white/50 shadow-inner group/board transition-colors duration-500", isSwapMode ? "border-amber-300 ring-4 ring-amber-100/50" : "border-slate-100")}>
          <div className="min-w-max inline-block align-middle pb-2">
             <table className="w-full border-collapse text-sm">
                <thead>
                   <tr>
                      <th className="sticky left-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-left border-b border-r border-slate-200/60 font-bold text-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[220px]">
                        Petugas & Dompet Cuti
                      </th>
                      {days.map((day) => {
                        const isSunday = day.getDay() === 0;
                        return (
                          <th key={day.toString()} className={cn("p-1.5 min-w-[45px] border-b border-r border-slate-100 text-center font-bold", isSunday ? 'bg-rose-50/40 text-rose-500' : 'text-slate-500 bg-white/30')}>
                             <div className="flex flex-col items-center">
                               <span className={cn("text-[10px] uppercase font-medium tracking-tighter", isSunday ? 'text-rose-400' : 'text-slate-400')}>
                                 {format(day, 'E', { locale: id }).slice(0, 3)}
                               </span>
                               <span className={cn("text-xs mt-0.5", isSunday ? 'text-rose-600 font-black' : 'text-slate-700')}>
                                 {format(day, 'd')}
                               </span>
                             </div>
                          </th>
                        )
                      })}
                      <th className="sticky right-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-center border-b border-l border-slate-200/60 font-black text-indigo-700 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[80px]">
                        Jam Aktif
                      </th>
                   </tr>
                </thead>
                <tbody>
                   {STAFF_LIST.map((staff) => {
                      const stats = staffSummaries[staff];
                      return (
                      <tr key={staff} className="hover:bg-slate-50/50 transition-colors group/row">
                         {/* Staff Name Sticky Left */}
                         <td className="sticky left-0 z-20 bg-white/95 backdrop-blur-md p-2 border-b border-r border-slate-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/30 transition-colors">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200 shadow-sm">
                               {staff.substring(0,2).toUpperCase()}
                             </div>
                             <div className="flex flex-col pt-0.5">
                               <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px] leading-tight">
                                 {staff}
                               </span>
                               <div className="flex items-center gap-1.5 mt-1 opacity-90">
                                  <span title="Jatah Libur Terpakai" className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none shadow-sm", stats.usedLibur > DEFAULT_LIBUR_QUOTA ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200')}>
                                     L: {stats.usedLibur}/{DEFAULT_LIBUR_QUOTA}
                                  </span>
                                  <span title="Cuti Tahunan Terpakai" className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none shadow-sm", stats.usedCuti > DEFAULT_CUTI_QUOTA ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-orange-50 text-orange-600 border-orange-200')}>
                                     C: {stats.usedCuti}/{DEFAULT_CUTI_QUOTA}
                                  </span>
                               </div>
                             </div>
                           </div>
                         </td>
                         
                         {/* Dates Grid */}
                         {days.map((day) => {
                            const isSunday = day.getDay() === 0;
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const shiftId = schedule[staff]?.[dateStr];
                            const shift = shiftId ? SHIFTS[shiftId] : null;

                            // Swap highlighting
                            const isSelectedSwap = selectedSwap?.staff === staff && selectedSwap?.dateStr === dateStr;

                            if (isSunday && shiftId !== 'CT') {
                               return (
                                  <td key={dateStr} className={cn("p-1 border-b border-r border-slate-50 text-center relative", isSelectedSwap ? "bg-amber-100" : "bg-rose-50/30")} onClick={() => isSwapMode && handleCellClick(staff, dateStr)}>
                                     <div className={cn("w-full h-7 mx-auto flex items-center justify-center rounded", isSelectedSwap && "ring-2 ring-amber-500")}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-200/50 cursor-not-allowed"></div>
                                     </div>
                                  </td>
                               );
                            }

                            return (
                               <td key={dateStr} className="p-1 border-b border-r border-slate-50 text-center relative group/cell" onClick={() => handleCellClick(staff, dateStr)}>
                                  <div 
                                    className={cn(
                                       "w-[34px] h-[34px] mx-auto rounded-lg flex items-center justify-center text-[10px] sm:text-[11px] font-black tracking-tighter transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer select-none border",
                                       shift ? shift.colorClass : "bg-transparent text-transparent border-transparent hover:bg-slate-100 hover:border-slate-200",
                                       !isSwapMode && shift && "hover:-translate-y-0.5 hover:scale-105 hover:shadow-md z-10",
                                       isSwapMode && "hover:border-amber-400 hover:bg-amber-50",
                                       isSelectedSwap && "ring-4 ring-amber-400 scale-110 z-20 shadow-lg animate-pulse"
                                    )}
                                    title={shift ? `${shift.label}\n${shift.time} (${shift.hours} Jam)` : isSwapMode ? 'Pilih untuk tukar' : 'Klik untuk mengubah shift'}
                                   >
                                    {shift ? shift.label : ''}
                                  </div>
                               </td>
                            );
                         })}

                         {/* Total Jam Sticky Right */}
                         <td className="sticky right-0 z-20 bg-white/95 backdrop-blur-md p-2 text-center border-b border-l border-slate-100/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/30 transition-colors">
                            <span className="font-black text-indigo-700 text-xs flex items-center justify-center gap-1">
                               {stats.totalHours > 0 ? stats.totalHours : '-'}
                               <span className="text-[9px] text-slate-400 font-semibold">Jam</span>
                            </span>
                         </td>
                      </tr>
                   )})}
                </tbody>
             </table>
          </div>
       </div>

       {/* Floating Interactive Legend */}
       <div className="flex flex-col sm:flex-row flex-wrap items-start justify-between gap-3 relative z-10 bg-slate-50/50 backdrop-blur-md border border-slate-200/50 p-4 rounded-2xl w-full">
          <div className="flex items-center gap-2 mb-2 sm:mb-0 shrink-0">
             <Paintbrush size={14} className="text-slate-400" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kamus Shift<br/><span className="lowercase font-normal opacity-70">(Siklus Klik)</span></span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 justify-end">
             {Object.values(SHIFTS).map(shift => (
                <div key={shift.id} className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-xl bg-white border border-slate-100 shadow-sm">
                   <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border pointer-events-none", shift.colorClass)}>
                      {shift.label}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 leading-none">{shift.time}</span>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold uppercase">{shift.hours > 0 ? `${shift.hours} Jam` : 'Cuti/Libur'}</span>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
