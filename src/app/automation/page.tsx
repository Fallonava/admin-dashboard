import { NeuralCore } from "@/features/automation/components/NeuralCore";
import { BroadcastControl } from "@/features/automation/components/BroadcastControl";
import { ActivityStream } from "@/features/automation/components/ActivityStream";
import { DynamicIslandSettings } from "@/features/automation/components/DynamicIslandSettings";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AutomationPage() {
    return (
        <div className="flex-1 w-full flex flex-col h-[calc(100vh-1rem)] overflow-hidden relative bg-[#F4F4F6] dark:bg-[#0B0D13] text-zinc-900 dark:text-zinc-100">
            {/* Header Area using Unified PageHeader */}
            <PageHeader 
                icon={<Sparkles size={20} className="text-white" />}
                title="Automasi"
                subtitle="Pusat kontrol jadwal real-time dan TV"
                iconGradient="from-indigo-500 to-violet-600"
                badge={
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-full shadow-sm">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-400 tracking-widest uppercase">
                            System Online
                        </span>
                    </div>
                }
                actions={
                    <>
                        <Link href="/automation/rules" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-500 active:scale-95 transition-all">
                            Rules
                        </Link>
                        <Link href="/automation/logs" className="inline-flex items-center px-4 py-2 bg-white dark:bg-[#131620] text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl shadow-sm border border-zinc-200 dark:border-[#232736] hover:bg-zinc-50 dark:hover:bg-[#1A1E2B] active:scale-95 transition-all">
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
