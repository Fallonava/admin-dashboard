"use client";

import { useState, useEffect } from "react";
import { CalendarCheck } from "lucide-react";

export function LiveClock() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) {
        return (
            <div className="hidden md:flex items-center gap-3 super-glass-card px-4 py-2.5 rounded-2xl shadow-sm opacity-50">
                <div className="text-right">
                    <p className="text-lg font-black text-transparent tracking-tight leading-none min-w-[70px]">...</p>
                    <p className="text-[10px] font-bold text-transparent tracking-widest min-w-[70px]">...</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <CalendarCheck size={20} className="text-slate-300" />
            </div>
        );
    }

    return (
        <div className="hidden md:flex items-center gap-3 super-glass-card px-4 py-2.5 rounded-2xl shadow-sm">
            <div className="text-right">
                <p className="text-lg font-black text-slate-800 tracking-tight leading-none">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <CalendarCheck size={20} className="text-blue-500" />
        </div>
    );
}
