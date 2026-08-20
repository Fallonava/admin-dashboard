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
            <div className="hidden md:flex items-center gap-3 clay-surface px-4 py-2.5 rounded-[18px] opacity-50">
                <div className="text-right">
                    <p className="text-lg font-black text-transparent tracking-tight leading-none min-w-[70px]">...</p>
                    <p className="text-[10px] font-bold text-transparent tracking-widest min-w-[70px]">...</p>
                </div>
                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>
                <CalendarCheck size={20} className="text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="hidden md:flex items-center gap-3 clay-surface px-4 py-2.5 rounded-[18px]">
            <div className="text-right">
                <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
                <p className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-white/10"></div>
            <div className="clay-button p-1.5 rounded-xl text-blue-600 dark:text-blue-400">
                <CalendarCheck size={18} strokeWidth={2.5} />
            </div>
        </div>
    );
}
