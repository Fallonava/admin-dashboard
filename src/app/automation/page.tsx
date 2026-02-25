import { NeuralCore } from "@/components/automation/NeuralCore";
import { BroadcastControl } from "@/components/automation/BroadcastControl";
import { ActivityStream } from "@/components/automation/ActivityStream";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function AutomationPage() {
    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1 font-medium">
                        <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
                        <span className="text-slate-700">/</span>
                        <span className="text-white">Automation</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Automation & Broadcast</h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage scheduling engine and public display notifications</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 border-500/20 px-2.5 py-1 rounded-full">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400 tracking-wider">SYSTEM ONLINE</span>
                    </div>
                    <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500-950" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
                {/* Left Column — System Status + Activity */}
                <div className="lg:col-span-5 flex flex-col gap-5 min-h-0 overflow-y-auto">
                    <NeuralCore />
                    <div className="flex-1 min-h-[300px]">
                        <ActivityStream />
                    </div>
                </div>

                {/* Right Column — Broadcast Control */}
                <div className="lg:col-span-7 min-h-0 overflow-hidden">
                    <BroadcastControl />
                </div>
            </div>
        </div>
    );
}
