"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Trash2, Activity, Clock, Check, GripVertical, Stethoscope } from "lucide-react";
import { cn, calculateRemainingTime } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";
import { useEffect, useState, memo } from "react";

const statusConfig: Record<string, { label: string; clayPill: string; dot?: string; pulse?: boolean }> = {
    'PRAKTEK':     { label: 'Praktek',     clayPill: 'clay-pill-blue text-white', dot: 'bg-white' },
    'OPERASI':     { label: 'Operasi',     clayPill: 'clay-pill-rose text-white', dot: 'bg-white', pulse: true },
    'PENUH':       { label: 'Penuh',       clayPill: 'clay-pill-amber text-white' },
    'CUTI':        { label: 'Cuti',        clayPill: 'clay-pill-rose text-white' },
    'SELESAI':     { label: 'Selesai',     clayPill: 'clay-pill-emerald text-white' },
    'TERJADWAL':   { label: 'Terjadwal',   clayPill: 'clay-button text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
    'PENDAFTARAN': { label: 'Pendaftaran', clayPill: 'clay-pill-violet text-white', dot: 'bg-white' },
    'LIBUR':       { label: 'Libur',       clayPill: 'clay-button text-zinc-500 dark:text-zinc-400' },
};

export function getStatusConfig(status?: string | null) {
    if (!status) return { label: 'Standar', clayPill: 'clay-button text-zinc-400' };
    return statusConfig[status] || { label: status, clayPill: 'clay-button text-zinc-400' };
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

function DoctorCardComponent({ doctor, index, isSelected, onToggleSelect, onEdit, onDelete, isOverlay }: DoctorCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: doctor.id, data: { doctor } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 50 : 1,
    };

    const status = getStatusConfig(doctor.status);
    const isBedah = doctor.category === 'Bedah';
    const avatarClay = isBedah ? "clay-icon-rose" : "clay-icon-blue";

    // Extract initials (2 letters)
    const initials = doctor.queueCode || doctor.name
        .replace(/^dr\.\s*/i, '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase() || 'DR';

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
            "group clay-surface p-4 sm:p-5 rounded-[26px] flex flex-col min-h-[200px] transition-all duration-200 relative overflow-hidden",
            isSelected && "ring-2 ring-blue-500 scale-[1.01] shadow-lg",
            isOverlay && "rotate-2 shadow-2xl scale-105 ring-2 ring-blue-500"
        )}>
            {/* Top Bar: Drag Handle + Avatar + Identity + Checkbox */}
            <div className="flex items-start gap-3.5 relative z-10 mb-3.5">
                {/* 3D Clay Avatar with Drag Handle on Hover */}
                <div className="relative shrink-0 flex items-center">
                    <div 
                        {...attributes} {...listeners}
                        title="Geser urutan dokter"
                        className="cursor-grab active:cursor-grabbing mr-1 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors p-0.5"
                    >
                        <GripVertical size={16} />
                    </div>
                    <div className={cn(
                        "w-12 h-12 rounded-[16px] flex items-center justify-center text-white font-black text-base shrink-0 shadow-sm",
                        avatarClay
                    )}>
                        <span className="relative z-10 tracking-tight">{initials}</span>
                    </div>
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-[14.5px] sm:text-[15.5px] tracking-tight leading-snug line-clamp-1">
                        {doctor.name}
                    </h3>
                    <p className="text-[11.5px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 flex items-center gap-1">
                        <Stethoscope size={12} className="text-zinc-400 shrink-0" />
                        <span>{doctor.specialty}</span>
                    </p>

                    {/* Category pill & Countdown */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded-[8px] text-[9.5px] font-black uppercase tracking-wider",
                            isBedah
                                ? "clay-button text-rose-600 dark:text-rose-400"
                                : "clay-button text-blue-600 dark:text-blue-400"
                        )}>
                            {doctor.category === 'NonBedah' ? 'Non Bedah' : doctor.category}
                        </span>

                        {timeRemaining && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] clay-inset text-[9.5px] font-black text-blue-600 dark:text-blue-400">
                                <Clock size={10} strokeWidth={2.5} />
                                {timeRemaining}
                            </span>
                        )}
                    </div>
                </div>

                {/* Checkbox */}
                <button
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(doctor.id); }}
                    className={cn(
                        "h-8 w-8 rounded-[12px] flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer",
                        isSelected 
                            ? "clay-pill-blue text-white shadow-sm" 
                            : "clay-button text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    )}
                    aria-label="Pilih dokter"
                >
                    {isSelected ? <Check size={14} strokeWidth={3} /> : <div className="w-3.5 h-3.5 rounded-[6px] border border-zinc-400/40" />}
                </button>
            </div>

            {/* Bottom Section: Status Pill & Action Buttons */}
            <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-zinc-200/50 dark:border-white/5">
                {/* Status Badge */}
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black tracking-wide",
                    status.clayPill
                )}>
                    {status.dot && (
                        <span className="relative flex h-1.5 w-1.5">
                            {status.pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", status.dot)} />}
                            <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", status.dot)} />
                        </span>
                    )}
                    {status.label}
                </div>

                {/* Card Action Buttons in Footer */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(doctor); }}
                        className="h-8 px-2.5 flex items-center gap-1 rounded-[12px] clay-button text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-black transition-all active:scale-90"
                        title="Edit Profil"
                    >
                        <Edit2 size={13} strokeWidth={2.5} />
                        <span className="hidden sm:inline text-[11px]">Edit</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(doctor.id); }}
                        className="h-8 w-8 flex items-center justify-center rounded-[12px] clay-button text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-90"
                        title="Hapus Dokter"
                    >
                        <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                </div>
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

export const DoctorCard = memo(DoctorCardComponent);
