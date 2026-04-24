import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays } from "lucide-react";
import type { LeaveRequest } from "@/lib/data-service";
import { cn } from "@/lib/utils";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    leaves: LeaveRequest[];
    onDelete: (id: string) => Promise<void>;
}

export function AllLeavesModal({ isOpen, onClose, leaves, onDelete }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white/95 backdrop-blur-2xl rounded-[40px] p-6 sm:p-8 w-full max-w-lg max-h-[85vh] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] border border-white/80 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Ambient Glow */}
                <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-emerald-300/30 to-teal-300/30 blur-[60px] -z-10 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100/60 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[20px] bg-gradient-to-tr from-emerald-100 to-teal-100 shadow-inner border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                            <CalendarDays className="h-6 w-6" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                Semua Data Cuti <span className="text-slate-400 font-medium">({leaves.length})</span>
                            </h3>
                            <p className="text-[13px] font-bold text-emerald-600/80 uppercase tracking-widest mt-0.5">
                                Daftar Terjadwal
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* List */}
                {leaves.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center relative z-10">
                        <div className="w-20 h-20 rounded-[28px] bg-slate-50/80 border border-slate-100 flex items-center justify-center mb-5 shadow-sm">
                            <CalendarDays className="h-10 w-10 text-slate-300" />
                        </div>
                        <p className="text-base font-black text-slate-700">
                            Belum ada data cuti.
                        </p>
                        <p className="text-sm font-medium text-slate-400 mt-2 max-w-[280px] leading-relaxed">
                            Tambahkan data cuti baru dari tombol &quot;Tambah Cuti&quot; di halaman utama.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-1 pr-1">
                        <div className="space-y-1.5">
                            {leaves.map(leave => {
                                const start = new Date(leave.startDate);
                                const end = new Date(leave.endDate);
                                const dateLabel = `${start.toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short'
                                })} - ${end.toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short'
                                })}`;

                                const typeColor = "text-slate-500";
                                const typeBg = "bg-slate-50";

                                return (
                                    <div
                                        key={leave.id}
                                        className="group relative flex items-center justify-between text-xs py-3.5 px-4 mb-2.5 rounded-[24px] bg-white/60 hover:bg-white border border-white/60 hover:border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="h-10 w-10 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-black uppercase shadow-sm ring-2 ring-white">
                                                {leave.doctor?.[0] || "D"}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-[14px] text-slate-800 truncate tracking-tight mb-0.5">
                                                    {leave.doctor}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-500 truncate bg-slate-100/80 px-2 py-0.5 rounded-md inline-block">
                                                    {dateLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                            <span
                                                className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex-shrink-0 border shadow-sm",
                                                    typeColor,
                                                    typeBg, "border-slate-200/60"
                                                )}
                                            >
                                                {leave.type}
                                            </span>
                                            <button
                                                onClick={() => onDelete(leave.id)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-100"
                                            >
                                                <X size={14} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

