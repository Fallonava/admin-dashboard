"use client";

import { useState } from "react";
import { DndContext, useDraggable, useDroppable, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { Clock, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shift } from "@/lib/data-service";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00

interface ShiftCalendarGridProps {
    shifts: Shift[];
    activeDay: number;
    onUpdateShiftTime: (id: string, newStartTime: string) => void;
    onSlotClick: (time: string) => void;
    onShiftClick: (shift: Shift) => void;
}

export function ShiftCalendarGrid({ shifts, activeDay, onUpdateShiftTime, onSlotClick, onShiftClick }: ShiftCalendarGridProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const shiftId = active.id as string;
            const dropHourStr = over.id as string; // e.g. "08:00"

            onUpdateShiftTime(shiftId, dropHourStr);
        }
    };

    const activeShift = activeId ? shifts.find(s => s.id === activeId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="relative border-t border-l border-white/40 mt-4 rounded-tl-[20px] overflow-hidden bg-white/20 backdrop-blur-md">
                {HOURS.map(hour => {
                    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                    // Determine which shifts start at this hour
                    const hourShifts = shifts.filter(s => {
                        const start = s.formattedTime?.split('-')[0]?.trim();
                        // simplistic check, matches "08:XX" or "08" to the hour block "08:00"
                        if (!start) return false;
                        const startHourStr = start.split(':')[0];
                        return parseInt(startHourStr) === hour;
                    });

                    return (
                        <div key={hour} className="flex min-h-[80px] border-b border-white/30 group relative">
                            {/* Time Label */}
                            <div className="w-16 flex flex-col items-center justify-start py-2 border-r border-white/30 bg-white/30 backdrop-blur-sm shrink-0 text-slate-500 font-black text-[11px] relative z-10">
                                {hourStr}
                                <div className="absolute right-0 top-1/2 w-2 h-px bg-slate-200/60" />
                            </div>

                            {/* Drop Zone */}
                            <DroppableSlot id={hourStr} onClick={() => onSlotClick(hourStr)}>
                                {hourShifts.map(shift => (
                                    <DraggableShift key={shift.id} shift={shift} onClick={() => onShiftClick(shift)} />
                                ))}
                            </DroppableSlot>
                        </div>
                    );
                })}
            </div>

            <DragOverlay>
                {activeShift ? <ShiftCard shift={activeShift} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function DroppableSlot({ id, children, onClick }: { id: string; children: React.ReactNode; onClick: () => void }) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClick();
            }}
            className={cn(
                "flex-1 p-2 flex gap-2 overflow-x-auto relative transition-all duration-300 cursor-pointer",
                isOver ? "bg-indigo-50/60" : "hover:bg-white/30"
            )}
        >
            {children}
            {isOver && <div className="absolute inset-0 border-2 border-dashed border-indigo-400/70 rounded-[16px] m-1 pointer-events-none backdrop-blur-sm" />}
        </div>
    );
}

function DraggableShift({ shift, onClick }: { shift: Shift; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: shift.id });

    return (
        <div
            ref={setNodeRef}
            className={cn("shrink-0", isDragging && "opacity-30")}
            onClick={onClick}
        >
            <ShiftCard shift={shift} dragHandleProps={{ ...listeners, ...attributes }} />
        </div>
    );
}

function ShiftCard({ shift, dragHandleProps, isOverlay }: { shift: Shift; dragHandleProps?: any; isOverlay?: boolean }) {
    const BAR: Record<string, string> = {
        blue: 'bg-blue-500', emerald: 'bg-emerald-500', violet: 'bg-violet-500',
        amber: 'bg-amber-500', rose: 'bg-rose-500', cyan: 'bg-cyan-500',
    };
    const LIGHT: Record<string, string> = {
        blue: 'bg-blue-50', emerald: 'bg-emerald-50', violet: 'bg-violet-50',
        amber: 'bg-amber-50', rose: 'bg-rose-50', cyan: 'bg-cyan-50',
    };

    const bar = BAR[shift.color || 'blue'];
    const light = LIGHT[shift.color || 'blue'];

    return (
        <div className={cn(
            "h-full min-h-[64px] rounded-[16px] flex overflow-hidden border shadow-sm group transition-all duration-300",
            "bg-white/60 backdrop-blur-xl border-white/80 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)] hover:bg-white/80",
            isOverlay && "shadow-2xl scale-[1.04] rotate-2 cursor-grabbing ring-2 ring-indigo-400/60 border-white"
        )}>
            {/* Drag Handle */}
            <div
                {...dragHandleProps}
                className={cn("w-5 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-black/5 transition-colors", bar)}
            >
                <GripVertical size={12} className="text-white/60" />
            </div>

            <div className="p-3 bg-white/40 flex-1 min-w-[160px] cursor-pointer hover:bg-white/60 transition-colors backdrop-blur-sm">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{shift.title}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 font-semibold">
                    <Clock size={10} className="text-slate-400" />
                    <span>{shift.formattedTime}</span>
                </div>
            </div>
        </div>
    );
}
