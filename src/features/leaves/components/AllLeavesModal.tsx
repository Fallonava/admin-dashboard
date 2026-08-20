import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays, Trash2 } from "lucide-react";
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="clay-surface rounded-[32px] p-6 sm:p-7 w-full max-w-lg max-h-[85vh] animate-in zoom-in-95 duration-200 flex flex-col relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/60 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-[18px] clay-pill-emerald flex items-center justify-center text-white">
                            <CalendarDays className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100 tracking-tight">
                                Semua Data Cuti <span className="text-zinc-400 font-bold">({leaves.length})</span>
                            </h3>
                            <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">
                                Daftar Terjadwal
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-[12px] clay-button text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all active:scale-95"
                    >
                        <X size={15} strokeWidth={2.5} />
                    </button>
                </div>

                {/* List */}
                {leaves.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center relative z-10">
                        <div className="w-16 h-16 rounded-[22px] clay-surface flex items-center justify-center mb-4 text-2xl">
                            📋
                        </div>
                        <p className="text-base font-black text-zinc-800 dark:text-zinc-100">
                            Belum ada data cuti
                        </p>
                        <p className="text-xs font-bold text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
                            Tambahkan data cuti baru dari tombol &quot;Tambah Cuti&quot; di kalender.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-1 pr-1 space-y-2">
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

                            return (
                                <div
                                    key={leave.id}
                                    className="group relative flex items-center justify-between text-xs p-3.5 rounded-[20px] clay-button transition-all duration-200"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-full clay-surface text-zinc-700 dark:text-zinc-200 flex items-center justify-center text-xs font-black uppercase shrink-0">
                                            {leave.doctor?.[0] || "D"}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-[13.5px] text-zinc-800 dark:text-zinc-100 truncate tracking-tight mb-0.5">
                                                {leave.doctor}
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 truncate">
                                                {dateLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[8px] clay-inset text-zinc-700 dark:text-zinc-300">
                                            {leave.type}
                                        </span>
                                        <button
                                            onClick={() => onDelete(leave.id)}
                                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-rose-500 clay-button rounded-[10px] opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                                            title="Hapus"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
