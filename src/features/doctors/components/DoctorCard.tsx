"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UserRound, Edit2, Trash2, Activity, Clock, Check } from "lucide-react";
import { cn, calculateRemainingTime } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";
import { useEffect, useState } from "react";

// Palet warna avatar berdasarkan indeks
const avatarGradients = [
    "from-blue-600 to-indigo-600",
    "from-indigo-600 to-purple-600",
    "from-rose-600 to-pink-600",
    "from-emerald-600 to-teal-600",
    "from-amber-600 to-orange-600",
];

const statusConfig: Record<string, { label: string; color: string; bg: string; dot?: string; pulse?: boolean }> = {
    'PRAKTEK':     { label: 'Praktek', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50', dot: 'bg-blue-500' },
    'OPERASI':     { label: 'Operasi', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50', dot: 'bg-rose-500', pulse: true },
    'PENUH':       { label: 'Penuh', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50' },
    'CUTI':        { label: 'Cuti', color: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' },
    'SELESAI':     { label: 'Selesai', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50' },
    'TERJADWAL':   { label: 'Terjadwal', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50', dot: 'bg-sky-400' },
    'PENDAFTARAN': { label: 'Pendaftaran', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50', dot: 'bg-indigo-400' },
    'LIBUR':       { label: 'Libur', color: 'text-zinc-400 dark:text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' },
};

export function getStatusConfig(status?: string | null) {
    if (!status) return { label: 'Auto', color: 'text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-900' };
    return statusConfig[status] || { label: status, color: 'text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-900' };
}

interface DoctorCardProps {
    doctor: Doctor;
    index: number;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit: (doc: Doctor) => void;
    onDelete: (id: string) => void;
    isOverlay?: boolean;
}

export function DoctorCard({ doctor, index, isSelected, onToggleSelect, onEdit, onDelete, isOverlay }: DoctorCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: doctor.id, data: { doctor } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 1,
    };

    const gradientClass = avatarGradients[index % avatarGradients.length];
    const status = getStatusConfig(doctor.status);

    // Centralized Countdown Logic
    const [timeRemaining, setTimeRemaining] = useState<string>(() => calculateRemainingTime(doctor.endTime, doctor.status));

    useEffect(() => {
        const updateTime = () => setTimeRemaining(calculateRemainingTime(doctor.endTime, doctor.status));
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [doctor.endTime, doctor.status]);

    const cardContent = (
        <div className={cn(
            "group bg-white dark:bg-[#131620] p-5 sm:p-6 rounded-[20px] flex flex-col min-h-[175px] cursor-grab active:cursor-grabbing border transition-all duration-200 relative overflow-hidden",
            isSelected 
                ? "border-blue-500 shadow-md ring-1 ring-blue-400 scale-[1.01]" 
                : "border-zinc-200 dark:border-[#232736] shadow-sm hover:border-zinc-300 dark:hover:border-[#3A425C]",
            isOverlay && "rotate-2 shadow-2xl scale-105 bg-white dark:bg-[#131620] border-blue-500 ring-1 ring-black/5"
        )}
            {...attributes} {...listeners}
        >
            {/* Checkbox Overlay */}
            <button
                type="button" 
                onClick={(e) => { e.stopPropagation(); onToggleSelect(doctor.id); }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                    "absolute top-4 right-4 h-6 w-6 rounded-full border flex items-center justify-center transition-all duration-200 z-30 cursor-pointer shadow-sm",
                    isSelected 
                        ? "bg-blue-600 border-transparent text-white scale-110" 
                        : "border-zinc-300 dark:border-[#2B3145] bg-zinc-50 dark:bg-[#1A1E2B] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:border-blue-500"
                )}
            >
                {isSelected && <Check size={12} strokeWidth={3} />}
            </button>

            {/* Avatar & Main Info */}
            <div className="flex items-start gap-3.5 mb-4 relative z-10">
                <div className="relative flex-shrink-0">
                    <div className={cn(
                        "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-black text-lg shadow-sm border border-white/10 shrink-0",
                        gradientClass
                    )}>
                        {doctor.queueCode || doctor.name.charAt(0)}
                    </div>
                </div>

                <div className="flex-1 min-w-0 pr-6">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-[15px] sm:text-[16px] tracking-tight leading-tight line-clamp-1">
                        {doctor.name}
                    </h3>
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 tracking-wide">
                        {doctor.specialty}
                    </p>
                    {timeRemaining && (
                        <div className="flex items-center gap-1.5 mt-2 bg-zinc-100 dark:bg-[#1A1E2B] self-start px-2 py-0.5 rounded-[6px] border border-zinc-200 dark:border-[#2B3145]">
                            <Clock size={11} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                            <span className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 tracking-wide">{timeRemaining}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Category & Status */}
            <div className="mt-auto flex items-center justify-between gap-2 pt-3.5 border-t border-zinc-100 dark:border-[#1E2230]">
                <div className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[9.5px] font-bold tracking-wider uppercase border",
                    doctor.category === 'Bedah'
                      ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50"
                      : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50"
                )}>
                    <Activity size={11} strokeWidth={2.5} />
                    {doctor.category === 'NonBedah' ? 'Non Bedah' : doctor.category}
                </div>

                <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[9.5px] font-bold tracking-wider uppercase border",
                    status.color,
                    status.bg
                )}>
                    {status.dot && (
                        <span className="relative flex h-1.5 w-1.5">
                            {status.pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", status.dot)} />}
                            <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", status.dot)} />
                        </span>
                    )}
                    {status.label}
                </div>
            </div>

            {/* Action Buttons (Appears on Hover or Mobile) */}
            <div className="absolute top-4 left-4 flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(doctor); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1A1E2B] shadow-sm border border-zinc-200 dark:border-[#2B3145] text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400 transition-all active:scale-95"
                    title="Edit"
                >
                    <Edit2 size={13} strokeWidth={2.5} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(doctor.id); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-white dark:bg-[#1A1E2B] shadow-sm border border-zinc-200 dark:border-[#2B3145] text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 transition-all active:scale-95"
                    title="Hapus"
                >
                    <Trash2 size={13} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );

    if (isOverlay) return cardContent;

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            {cardContent}
        </div>
    );
}
