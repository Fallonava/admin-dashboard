"use client";

import { X, Clock, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Doctor, Shift } from "@/lib/data-service";

interface ScheduleModalProps {
    doctor: Doctor | null;
    shifts: Shift[];
    isOpen: boolean;
    onClose: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ScheduleModal({ doctor, shifts, isOpen, onClose }: ScheduleModalProps) {
    if (!doctor) return null;

    // Filter shifts for this doctor
    const docShifts = shifts.filter(s => s.doctor === doctor.name);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950/90 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16 border-2 border-slate-700">
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-bold">
                                {doctor.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl font-bold">{doctor.name}</DialogTitle>
                            <p className="text-slate-400 font-medium">{doctor.specialty} • {doctor.category}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {DAYS.map((day, idx) => {
                        // Adjust day index if needed (data uses 0=Mon or 0=Sun? check data-service)
                        // In data-service, 0=Mon usually. Let's assume 0=Mon based on app logic.
                        const dayShifts = docShifts.filter(s => s.dayIdx === idx);

                        return (
                            <div key={day} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
                                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <Calendar size={14} className="text-violet-400" />
                                    {day}
                                </h4>

                                {dayShifts.length > 0 ? (
                                    <div className="space-y-2">
                                        {dayShifts.map(shift => (
                                            <div key={shift.id} className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                                                <div className={cn("w-1 h-8 rounded-full", `bg-${shift.color}-500`)} />
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{shift.title}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <Clock size={10} />
                                                        {shift.formattedTime}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-600 italic py-2 text-center">
                                        No schedule
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
