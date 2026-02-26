import { NeuralCore } from "@/components/automation/NeuralCore";
import { BroadcastControl } from "@/components/automation/BroadcastControl";
import { ActivityStream } from "@/components/automation/ActivityStream";
import { Bell, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AutomationPage() {
    return (
        <div className="relative flex h-full flex-col rounded-3xl bg-slate-50 w-full overflow-hidden shadow-sm border border-slate-200/60">
            {/* Ambient Multi-Color Glows behind the scene - Light Mode version */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-[100px] pointer-events-none" />
            <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-100/30 blur-[80px] pointer-events-none" />

            {/* Header Area */}
            <header className="relative z-10 flex items-center justify-between px-8 pt-8 pb-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-purple-500/20">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/" className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors duration-300">
                                Dashboard
                            </Link>
                            <span className="text-[11px] text-slate-300">/</span>
                            <span className="text-[11px] font-semibold text-slate-800">
                                Automation
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Automation & Broadcast
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium max-w-md leading-relaxed">
                            Control center for real-time scheduling engine, neural processing, and dynamic public display notifications.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">
                            System Online
                        </span>
                    </div>

                    <button className="relative p-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 hover:border-slate-300 transition-all duration-300 shadow-sm backdrop-blur-md group">
                        <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                    </button>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 pt-2 overflow-hidden">
                {/* Left Column — System Status + Activity */}
                <div className="lg:col-span-5 flex flex-col gap-6 min-h-0 overflow-hidden">
                    <NeuralCore />
                    <div className="flex-1 min-h-0">
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
