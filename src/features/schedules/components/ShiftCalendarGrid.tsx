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
            <div className="relative clay-surface mt-4 rounded-[24px] overflow-hidden">
                {HOURS.map(hour => {
                    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                    const hourShifts = shifts.filter(s => {
                        const start = s.formattedTime?.split('-')[0]?.trim();
                        if (!start) return false;
                        const startHourStr = start.split(':')[0];
                        return parseInt(startHourStr) === hour;
                    });

                    return (
                        <div key={hour} className="flex min-h-[80px] border-b border-zinc-200/60 dark:border-[#222738] group relative">
                            {/* Time Label */}
                            <div className="w-16 flex flex-col items-center justify-start py-3 border-r border-zinc-200/60 dark:border-[#222738] shrink-0 text-zinc-500 font-black text-[11px] relative z-10">
                                {hourStr}
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
                "flex-1 p-2.5 flex gap-2.5 overflow-x-auto relative transition-all duration-200 cursor-pointer",
                isOver ? "clay-inset bg-blue-50/50" : "hover:bg-zinc-200/30 dark:hover:bg-[#161924]"
            )}
        >
            {children}
            {isOver && <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-[18px] m-1 pointer-events-none" />}
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

    const bar = BAR[shift.color || 'blue'];

    return (
        <div className={cn(
            "h-full min-h-[64px] rounded-[18px] flex overflow-hidden clay-surface group transition-all duration-200",
            isOverlay && "shadow-2xl scale-[1.04] rotate-2 cursor-grabbing ring-2 ring-blue-500"
        )}>
            {/* Drag Handle */}
            <div
                {...dragHandleProps}
                className={cn("w-5 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-black/5 transition-colors", bar)}
            >
                <GripVertical size={12} className="text-white/80" />
            </div>

            <div className="p-3 flex-1 min-w-[160px] cursor-pointer">
                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 line-clamp-1">{shift.title}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-bold">
                    <Clock size={10} strokeWidth={2.5} className="text-blue-500" />
                    <span>{shift.formattedTime}</span>
                </div>
            </div>
        </div>
    );
}
