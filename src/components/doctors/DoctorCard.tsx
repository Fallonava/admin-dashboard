"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Tilt from "react-parallax-tilt";
import { UserRound, Edit2, Trash2, Activity, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/data-service";
import { useEffect, useState } from "react";

// Palet warna avatar berdasarkan indeks
// Vibrant Apple System Colors for avatars
const avatarGradients = [
    "from-blue-500 to-cyan-400",      // System Blue
    "from-indigo-500 to-purple-400",  // System Purple
    "from-rose-500 to-pink-400",      // System Pink
    "from-emerald-500 to-teal-400",   // System Green
    "from-orange-500 to-amber-400",   // System Orange
];

const statusConfig: Record<string, { label: string; color: string; bg: string; dot?: string; pulse?: boolean }> = {
    'BUKA': { label: 'Aktif', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    'OPERASI': { label: 'Operasi', color: 'text-rose-600', bg: 'bg-rose-50', dot: 'bg-rose-500', pulse: true },
    'PENUH': { label: 'Penuh', color: 'text-amber-600', bg: 'bg-amber-50' },
    'CUTI': { label: 'Cuti', color: 'text-slate-500', bg: 'bg-slate-100' },
    'SELESAI': { label: 'Selesai', color: 'text-blue-600', bg: 'bg-blue-50' },
    'TIDAK_PRAKTEK': { label: 'Tidak Aktif', color: 'text-slate-400', bg: 'bg-slate-50' },
    'AKAN_BUKA': { label: 'Akan Buka', color: 'text-cyan-600', bg: 'bg-cyan-50' },
};

export function getStatusConfig(status?: string | null) {
    if (!status) return { label: 'Auto', color: 'text-slate-400', bg: 'bg-slate-50' };
    return statusConfig[status] || { label: status, color: 'text-slate-400', bg: 'bg-slate-50' };
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

    // Deteksi mobile — nonaktifkan Tilt 3D untuk performa 60fps di perangkat low-mid
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check, { passive: true });
        return () => window.removeEventListener('resize', check);
    }, []);

    // Countdown Logic
    const [timeRemaining, setTimeRemaining] = useState<string>("Buka");

    useEffect(() => {
        if (doctor.status === "TIDAK_PRAKTEK" || doctor.status === "SELESAI" || doctor.status === "CUTI") {
            setTimeRemaining("");
            return;
        }

        const updateTime = () => {
            const now = new Date();
            const [endHour, endMin] = (doctor.endTime || "00:00").split(':').map(Number);
            
            const endDate = new Date();
            endDate.setHours(endHour, endMin, 0, 0);

            const diff = endDate.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeRemaining("Selesai");
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeRemaining(`Berakhir ${hours > 0 ? `${hours}j ` : ''}${minutes}m lagi`);
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [doctor.endTime, doctor.status]);

    const cardContent = (
        <div className={cn(
            "group bg-white/40 backdrop-blur-2xl p-5 sm:p-6 rounded-[32px] flex flex-col min-h-[180px] cursor-grab active:cursor-grabbing border transition-all duration-500 relative overflow-hidden",
            isSelected 
                ? "border-blue-400/80 shadow-[0_12px_40px_-12px_rgba(59,130,246,0.25)] ring-1 ring-blue-400/50 scale-[1.02] bg-white/60" 
                : "border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:border-white/80 hover:bg-white/60 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:-translate-y-1",
            isOverlay && "rotate-2 shadow-2xl scale-105 bg-white/80 backdrop-blur-[40px] border-white ring-1 ring-black/5"
        )}
            {...attributes} {...listeners}
        >
            {/* Checkbox Overlay */}
            <button
                type="button" 
                onClick={(e) => { e.stopPropagation(); onToggleSelect(doctor.id); }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                    "absolute top-5 right-5 h-6 w-6 rounded-full border flex items-center justify-center transition-all duration-300 z-30 cursor-pointer shadow-sm",
                    isSelected 
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-transparent text-white scale-110" 
                        : "border-white/80 bg-white/40 backdrop-blur-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:border-blue-400 hover:bg-white"
                )}
            >
                {isSelected && <Check size={12} strokeWidth={3} />}
            </button>

            {/* Avatar & Main Info */}
            <div className="flex items-start gap-4 mb-4 relative z-10">
                <div className="relative flex-shrink-0">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl shadow-md ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105",
                        gradientClass
                    )}>
                        {doctor.queueCode || doctor.name.charAt(0)}
                    </div>
                </div>

                <div className="flex-1 min-w-0 pr-6">
                    <h3 className="font-black text-slate-800 text-[16px] sm:text-[17px] tracking-tight leading-tight line-clamp-1 group-hover:text-slate-900 transition-colors">
                        {doctor.name}
                    </h3>
                    <p className="text-[11.5px] font-bold text-slate-400/90 mt-1 line-clamp-1 tracking-wide">
                        {doctor.specialty}
                    </p>
                    {timeRemaining && (
                        <div className="flex items-center gap-1.5 mt-2.5 bg-white/60 backdrop-blur-md self-start px-2.5 py-1 rounded-[12px] border border-white/80 shadow-sm">
                            <Clock size={12} className="text-blue-500" strokeWidth={2.5} />
                            <span className="text-[10px] font-black text-blue-600/90 tracking-wide">{timeRemaining}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Category & Status */}
            <div className="mt-auto flex items-center justify-between gap-2 pt-4 border-t border-slate-200/30">
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[10px] font-black tracking-wider uppercase border shadow-sm backdrop-blur-md",
                    doctor.category === 'Bedah' ? "text-rose-600 bg-white/60 border-white/80" : "text-emerald-600 bg-white/60 border-white/80"
                )}>
                    <Activity size={12} strokeWidth={2.5} />
                    {doctor.category === 'NonBedah' ? 'Non Bedah' : doctor.category}
                </div>

                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[10px] font-black tracking-wider uppercase bg-white/60 border border-white/80 shadow-sm backdrop-blur-md",
                    status.color
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

            {/* Action Buttons (Appears on Hover or Mobile) - Clean & Minimalist */}
            <div className="absolute top-5 left-5 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(doctor); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="h-9 w-9 flex items-center justify-center rounded-[12px] bg-white/80 backdrop-blur-md shadow-sm border border-white/80 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-white transition-all active:scale-95"
                    title="Edit"
                >
                    <Edit2 size={14} strokeWidth={2.5} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(doctor.id); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="h-9 w-9 flex items-center justify-center rounded-[12px] bg-white/80 backdrop-blur-md shadow-sm border border-white/80 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-white transition-all active:scale-95"
                    title="Hapus"
                >
                    <Trash2 size={14} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );

    if (isOverlay) return cardContent;

    if (isMobile) {
        return (
            <div ref={setNodeRef} style={style} className="h-full">
                {cardContent}
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style}>
            <Tilt 
                tiltMaxAngleX={isDragging ? 0 : 4} 
                tiltMaxAngleY={isDragging ? 0 : 4} 
                scale={isDragging ? 1 : 1.01} 
                transitionSpeed={2000} 
                className="h-full"
                glareEnable={false}
            >
                {cardContent}
            </Tilt>
        </div>
    );
}
