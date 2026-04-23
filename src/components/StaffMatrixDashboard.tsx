import React, { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, User, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface StaffPerformance {
  name: string;
  total: number;
}

interface DailyRecap {
  id: string;
  date: string;
  total_patients: number;
  missing_sep_count: number;
  staff_performance: StaffPerformance[];
}

interface StaffMatrixDashboardProps {
  data: DailyRecap[];
}

export default function StaffMatrixDashboard({ data }: StaffMatrixDashboardProps) {
  // Default to the month of the most recent data point, or current month
  const initialDate = useMemo(() => {
    if (!data || data.length === 0) return new Date();
    // sort data by date descending
    const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return new Date(sorted[0].date);
  }, [data]);

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate));

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Extract matrix data for the selected month
  const matrixData = useMemo(() => {
    if (!data) return { days: [], staffNames: [], grid: {}, staffTotals: {}, maxValue: 0 };

    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const daysInterval = eachDayOfInterval({ start: firstDay, end: lastDay });
    
    // Filter recaps to just this month
    const monthlyRecaps = data.filter(d => {
       const dDate = new Date(d.date);
       return isSameMonth(dDate, currentMonth);
    });

    // Collect all unique staff active in this month
    const staffSet = new Set<string>();
    monthlyRecaps.forEach(r => {
       r.staff_performance?.forEach(s => staffSet.add(s.name));
    });
    
    // If no staff active this month, optionally fallback to all-time active staff or leave empty
    if (staffSet.size === 0) {
      data.forEach(r => r.staff_performance?.forEach(s => staffSet.add(s.name)));
    }

    const staffNames = Array.from(staffSet);

    // Map the performance to grid[staffName][date_string]
    const grid: Record<string, Record<string, number>> = {};
    const staffTotals: Record<string, number> = {};
    
    staffNames.forEach(name => { 
       grid[name] = {}; 
       staffTotals[name] = 0;
    });

    let maxValue = 0;

    monthlyRecaps.forEach(recap => {
       const dateStr = format(new Date(recap.date), 'yyyy-MM-dd');
       recap.staff_performance?.forEach(s => {
          if (grid[s.name]) {
             const val = s.total || 0;
             grid[s.name][dateStr] = val;
             staffTotals[s.name] += val;
             if (val > maxValue) {
                maxValue = val;
             }
          }
       });
    });

    // Sort staff dynamically: Highest total performance first
    staffNames.sort((a, b) => staffTotals[b] - staffTotals[a]);

    return { days: daysInterval, staffNames, grid, staffTotals, maxValue };
  }, [data, currentMonth]);

  const { days, staffNames, grid, staffTotals, maxValue } = matrixData;

  // Helper to determine cell color based on value intensity
  const getCellColor = (value: number) => {
    if (!value || value === 0) return 'bg-slate-100/50 text-transparent'; // blank/neutral
    const ratio = value / (maxValue || 1);
    
    // Gradient mapping
    if (ratio < 0.2) return 'bg-indigo-100 text-indigo-700';
    if (ratio < 0.4) return 'bg-indigo-200 text-indigo-800';
    if (ratio < 0.6) return 'bg-indigo-400 text-white';
    if (ratio < 0.8) return 'bg-indigo-500 text-white';
    return 'bg-indigo-700 text-white shadow-sm ring-1 ring-indigo-300';
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col gap-6">
       {/* Ambient decoration */}
       <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

       {/* Toolbar Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={20} />
              Staff Performance Heatmap
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Intensitas beban kerja harian dan peringkat bulanan</p>
          </div>

          {/* Time-Travel Navigator (Floating Glassmorphism) */}
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 border border-slate-200/50 rounded-xl shadow-sm">
             <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <ChevronLeft size={16} />
             </button>
             <div className="px-3 min-w-[140px] text-center">
                <span className="text-sm font-bold text-slate-800 tracking-wide capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: id })}
                </span>
             </div>
             <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <ChevronRight size={16} />
             </button>
          </div>
       </div>

       {/* Matrix Container */}
       <div className="relative z-10 w-full overflow-x-auto custom-scrollbar rounded-2xl border border-slate-100 bg-white/50 shadow-inner">
          <div className="min-w-max inline-block align-middle pb-2">
             <table className="w-full border-collapse text-sm">
                <thead>
                   <tr>
                      {/* Sticky Row Header for Staff Names */}
                      <th className="sticky left-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-left border-b border-r border-slate-200/60 font-bold text-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[200px]">
                        Petugas
                      </th>
                      {/* Dates Columns */}
                      {days.map((day) => {
                        const isSunday = day.getDay() === 0;
                        return (
                          <th key={day.toString()} className={cn("p-2 min-w-[40px] border-b border-r border-slate-100 text-center font-bold group", isSunday ? 'bg-rose-50/40 text-rose-500' : 'text-slate-500 bg-white/30')}>
                             <div className="flex flex-col items-center">
                               <span className={cn("text-[10px] uppercase font-medium tracking-tighter", isSunday ? 'text-rose-400' : 'text-slate-400')}>
                                 {format(day, 'E', { locale: id }).slice(0, 3)}
                               </span>
                               <span className={cn("text-sm mt-0.5", isSunday ? 'text-rose-600' : 'text-slate-700')}>
                                 {format(day, 'd')}
                               </span>
                             </div>
                          </th>
                        )
                      })}
                      {/* Sticky Column Right for Total */}
                      <th className="sticky right-0 z-30 bg-slate-50/95 backdrop-blur-md p-3 text-center border-b border-l border-slate-200/60 font-black text-indigo-700 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[80px]">
                        <div className="flex flex-col items-center gap-1">
                           <Award size={14} className="text-amber-500" />
                           <span>Total</span>
                        </div>
                      </th>
                   </tr>
                </thead>
                <tbody>
                   {staffNames.length > 0 ? staffNames.map((staff, index) => (
                      <tr key={staff} className="hover:bg-slate-50/50 transition-colors group/row">
                         {/* Staff Name Sticky Left */}
                         <td className="sticky left-0 z-20 bg-white/95 backdrop-blur-md p-3 border-b border-r border-slate-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/30 transition-colors">
                           <div className="flex items-center gap-2">
                             <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 border shadow-sm",
                                index === 0 ? "bg-amber-100 text-amber-700 border-amber-200" :
                                index === 1 ? "bg-slate-200 text-slate-700 border-slate-300" :
                                index === 2 ? "bg-orange-100 text-orange-700 border-orange-200" :
                                "bg-indigo-50 text-indigo-600 border-indigo-100/50"
                             )}>
                               {index < 3 ? `#${index + 1}` : staff.substring(0,2).toUpperCase()}
                             </div>
                             <span className="font-semibold text-slate-700 text-xs truncate max-w-[140px]" title={staff}>
                               {staff}
                             </span>
                           </div>
                         </td>
                         
                         {/* Dates Grid */}
                         {days.map((day) => {
                            const isSunday = day.getDay() === 0;
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const val = grid[staff]?.[dateStr] || 0;
                            
                            if (isSunday) {
                               return (
                                  <td key={dateStr} className="p-1.5 border-b border-r border-slate-50 text-center relative bg-rose-50/30 group-hover/row:bg-rose-50/50 transition-colors" title={`Hari Libur\n${staff} - ${format(day, 'dd MMM yyyy')}`}>
                                     <div className="w-8 h-8 mx-auto flex items-center justify-center">
                                        {val > 0 ? (
                                           <div className="text-[10px] font-bold text-rose-600 bg-rose-100 w-full h-full rounded flex items-center justify-center ring-1 ring-rose-200">{val}</div>
                                        ) : (
                                           <div className="w-1.5 h-1.5 rounded-full bg-rose-200/70"></div>
                                        )}
                                     </div>
                                  </td>
                               );
                            }

                            return (
                               <td key={dateStr} className="p-1.5 border-b border-r border-slate-50 text-center relative group/cell">
                                  <div 
                                    className={cn(
                                       "w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                                       getCellColor(val),
                                       val > 0 && "cursor-pointer hover:-translate-y-1 hover:scale-110 hover:shadow-lg hover:ring-2 hover:ring-indigo-400 z-10"
                                    )}
                                    title={`${staff}\n${format(day, 'dd MMM yyyy', { locale: id })}\nJumlah: ${val} Pasien`}
                                  >
                                    {val > 0 ? val : ''}
                                  </div>
                               </td>
                            );
                         })}

                         {/* Total Sticky Right */}
                         <td className="sticky right-0 z-20 bg-white/95 backdrop-blur-md p-3 text-center border-b border-l border-slate-100/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.02)] group-hover/row:bg-indigo-50/30 transition-colors">
                            <span className="font-black text-indigo-700 text-sm">{staffTotals[staff].toLocaleString('id-ID')}</span>
                         </td>
                      </tr>
                   )) : (
                      <tr>
                         <td colSpan={days.length + 2} className="p-10 text-center text-slate-500 font-semibold bg-slate-50 border-t border-slate-100">
                            Sebuah matriks yang sepi. Tidak ada data kunjungan pada bulan ini.
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       {/* Legend */}
       {maxValue > 0 && (
         <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 px-2 mt-2">
            <div className="flex items-center gap-2 opacity-70">
               <div className="w-2 h-2 rounded-full bg-rose-300"></div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hari Libur / Minggu</span>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-xl backdrop-blur-sm border border-slate-100 shadow-sm">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level Kepadatan:</span>
               <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-slate-100/50 flex items-center justify-center text-slate-300 text-[9px] font-bold shadow-sm border border-slate-200/50">0</div>
                  <div className="w-5 h-5 rounded-md bg-indigo-100 shadow-sm"></div>
                  <div className="w-5 h-5 rounded-md bg-indigo-200 shadow-sm"></div>
                  <div className="w-5 h-5 rounded-md bg-indigo-400 shadow-sm"></div>
                  <div className="w-5 h-5 rounded-md bg-indigo-500 shadow-sm"></div>
                  <div className="w-5 h-5 rounded-md bg-indigo-700 shadow-sm border border-indigo-300"></div>
                  <span className="text-[10px] font-black text-indigo-900 ml-1 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">{maxValue}+</span>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
