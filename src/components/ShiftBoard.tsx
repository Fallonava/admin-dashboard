"use client";

import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Wand2, Paintbrush, Grip } from 'lucide-react';
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

const SHIFTS: Record<string, ShiftDef> = {
  P6: { id: 'P6', label: 'P6', time: '06.00 - 14.00', hours: 8, colorClass: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  P7: { id: 'P7', label: 'P7', time: '08.00 - 16.00', hours: 8, colorClass: 'bg-sky-100 text-sky-700 border-sky-200' },
  P8: { id: 'P8', label: 'P8', time: '08.00 - 16.00', hours: 8, colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  P9: { id: 'P9', label: 'P9', time: '09.00 - 17.00', hours: 8, colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  P10: { id: 'P10', label: 'P10', time: '10.00 - 18.00', hours: 8, colorClass: 'bg-teal-100 text-teal-700 border-teal-200' },
  P12: { id: 'P12', label: 'P12', time: '12.00 - 20.00', hours: 8, colorClass: 'bg-amber-100 text-amber-700 border-amber-200' },
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
              // Hapus jadwal jika ada di hari minggu
              STAFF_LIST.forEach(s => { delete newSchedule[s][dateStr]; });
          } else {
              // Algoritma komposisi Shift TPPRJ Harian
              // Butuh minimal 6 slot untuk 6 staff
              let todaysShifts = ['P6', 'P6', 'P8', 'P8', 'P10', 'P12']; 
              if (isSaturday) {
                  // Sabtu: P6, P8, P9, P12 (sesuai excel reference)
                  todaysShifts = ['P6', 'P6', 'P8', 'P9', 'P12', 'P12'];
              }

              // Acak penempatan shift
              todaysShifts.sort(() => Math.random() - 0.5);

              STAFF_LIST.forEach((staff, index) => {
                  newSchedule[staff][dateStr] = todaysShifts[index];
              });
          }
        });
        setSchedule(newSchedule);
        setIsGenerating(false);
    }, 600); // add slight delay for premium feeling
  };

  const handleCellClick = (staff: string, dateStr: string) => {
     // Siklus klik sederhana: Kosong -> P6 -> P7 -> P8 -> P9 -> P10 -> P12 -> Kosong
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

  // Kalkulasi total jam kerja per staf bulan ini
  const staffSummaries = useMemo(() => {
      const summary: Record<string, number> = {};
      STAFF_LIST.forEach(staff => {
         let totalHours = 0;
         days.forEach(day => {
             const dateStr = format(day, 'yyyy-MM-dd');
             const shiftId = schedule[staff]?.[dateStr];
             if (shiftId && SHIFTS[shiftId]) {
                 totalHours += SHIFTS[shiftId].hours;
             }
         });
         summary[staff] = totalHours;
      });
      return summary;
  }, [schedule, days]);

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col gap-6">
       
       {/* Toolbar Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
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

          <div className="flex items-center gap-2">
             <button disabled className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-2 cursor-not-allowed border border-slate-200">
                <Download size={14}/> Cetak PDF
             </button>
             <button 
               onClick={handleAutoGenerate} 
               disabled={isGenerating}
               className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-[0_4px_15px_-3px_rgba(147,51,234,0.4)] transition-all flex items-center gap-2"
             >
                <Wand2 size={14} className={cn(isGenerating && "animate-spin")} /> 
                {isGenerating ? 'Menyihir Jadwal...' : 'Sihir Otomatis'}
             </button>
          </div>
       </div>

       {/* Matrix Container */}
       <div className="relative z-10 w-full overflow-x-auto custom-scrollbar rounded-2xl border border-slate-100 bg-white/50 shadow-inner group/board">
          <div className="min-w-max inline-block align-middle pb-2">
             <table className="w-full border-collapse text-sm">
                <thead>
                   <tr>
                      <th className="sticky left-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-left border-b border-r border-slate-200/60 font-bold text-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[200px]">
                        Petugas TPPRJ
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
                   {STAFF_LIST.map((staff, index) => (
                      <tr key={staff} className="hover:bg-slate-50/50 transition-colors group/row">
                         {/* Staff Name Sticky Left */}
                         <td className="sticky left-0 z-20 bg-white/95 backdrop-blur-md p-2 border-b border-r border-slate-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/30 transition-colors cursor-pointer">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[9px] shrink-0 border border-slate-200 shadow-sm">
                               {staff.substring(0,2).toUpperCase()}
                             </div>
                             <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[150px]">
                               {staff}
                             </span>
                           </div>
                         </td>
                         
                         {/* Dates Grid */}
                         {days.map((day) => {
                            const isSunday = day.getDay() === 0;
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const shiftId = schedule[staff]?.[dateStr];
                            const shift = shiftId ? SHIFTS[shiftId] : null;

                            if (isSunday) {
                               return (
                                  <td key={dateStr} className="p-1 border-b border-r border-slate-50 text-center relative bg-rose-50/30">
                                     <div className="w-full h-7 mx-auto flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-200/50 cursor-not-allowed"></div>
                                     </div>
                                  </td>
                               );
                            }

                            return (
                               <td key={dateStr} className="p-1 border-b border-r border-slate-50 text-center relative group/cell" onClick={() => handleCellClick(staff, dateStr)}>
                                  <div 
                                    className={cn(
                                       "w-[34px] h-[34px] mx-auto rounded-lg flex items-center justify-center text-[11px] font-black tracking-tighter transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer select-none border",
                                       shift ? shift.colorClass : "bg-transparent text-transparent border-transparent hover:bg-slate-100 hover:border-slate-200",
                                       shift && "hover:-translate-y-0.5 hover:scale-105 hover:shadow-md z-10"
                                    )}
                                    title={shift ? `${shift.name}\n${shift.time} (${shift.hours} Jam)` : 'Klik untuk mengubah shift'}
                                   >
                                    {shift ? shift.label : ''}
                                  </div>
                               </td>
                            );
                         })}

                         {/* Total Jam Sticky Right */}
                         <td className="sticky right-0 z-20 bg-white/95 backdrop-blur-md p-2 text-center border-b border-l border-slate-100/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/30 transition-colors">
                            <span className="font-black text-indigo-700 text-xs flex items-center justify-center gap-1">
                               {staffSummaries[staff] > 0 ? staffSummaries[staff] : '-'}
                               <span className="text-[9px] text-slate-400 font-semibold">Jam</span>
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>

       {/* Floating Interactive Legend */}
       <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 relative z-10 bg-slate-50/50 backdrop-blur-md border border-slate-200/50 p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 sm:mb-0 w-full sm:w-auto">
             <Paintbrush size={14} className="text-slate-400" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kamus Shift (Klik Baris Untuk Mengubah):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
             {Object.values(SHIFTS).map(shift => (
                <div key={shift.id} className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white border border-slate-100 shadow-sm">
                   <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border", shift.colorClass)}>
                      {shift.label}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-700 leading-none">{shift.time}</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">{shift.hours} Jam / Hari</span>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
