import { NeuralCore } from "@/features/automation/components/NeuralCore";
import { BroadcastControl } from "@/features/automation/components/BroadcastControl";
import { ActivityStream } from "@/features/automation/components/ActivityStream";
import { DynamicIslandSettings } from "@/features/automation/components/DynamicIslandSettings";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AutomationPage() {
    return (
        <div className="flex-1 w-full flex flex-col h-[calc(100vh-1rem)] overflow-hidden relative bg-slate-50/30">
            {/* 2026 Enhanced Ambient Multi-Color Glows */}
            <div className="absolute top-[-15%] left-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-200/40 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-violet-300/30 to-fuchsia-200/30 blur-[100px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }} />
            <div className="absolute top-[30%] left-[40%] h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-cyan-200/20 to-blue-200/20 blur-[80px] pointer-events-none mix-blend-multiply transition-all duration-1000 ease-in-out" />

            {/* Header Area using Unified PageHeader */}
            <PageHeader 
                icon={<Sparkles size={20} className="text-white" />}
                title="Automasi"
                accentWord="& Siaran"
                accentColor="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
                subtitle="Pusat kontrol jadwal real-time dan TV"
                iconGradient="from-indigo-500 to-violet-600"
                badge={
                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200/60 px-3 py-1.5 rounded-full shadow-sm">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-black text-emerald-700 tracking-widest uppercase">
                            System Online
                        </span>
                    </div>
                }
                actions={
                    <>
                        <Link href="/automation/rules" className="hidden sm:inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-full shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:shadow-[0_8px_25px_-6px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap border border-indigo-500/50">
                            Rules
                        </Link>
                        <Link href="/automation/logs" className="hidden sm:inline-flex items-center px-5 py-2.5 bg-white/80 backdrop-blur-md text-slate-700 text-[13px] font-bold rounded-full shadow-sm border border-slate-200/80 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all duration-300 whitespace-nowrap">
                            Logs
                        </Link>
                    </>
                }
            />

            {/* Main Content Grid with 2026 Spacing */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-8 px-4 sm:px-6 lg:px-8 pb-8 pt-4 overflow-y-auto custom-scrollbar">
                {/* Left Column — System Status + Activity */}
                <div className="lg:col-span-5 flex flex-col gap-5 lg:gap-8 h-max animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <NeuralCore />
                    <ActivityStream />
                </div>

                {/* Right Column — Broadcast Control */}
                <div className="lg:col-span-7 h-max animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both">
                    <BroadcastControl />
                </div>

                {/* Full Width — Dynamic Island Settings */}
                <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300 fill-mode-both">
                    <DynamicIslandSettings />
                </div>
            </div>
        </div>
    );
}
