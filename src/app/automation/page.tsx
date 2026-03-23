import { NeuralCore } from "@/components/automation/NeuralCore";
import { BroadcastControl } from "@/components/automation/BroadcastControl";
import { ActivityStream } from "@/components/automation/ActivityStream";
import { DynamicIslandSettings } from "@/components/automation/DynamicIslandSettings";
import { Bell, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AutomationPage() {
    return (
        <div className="flex-1 w-full flex flex-col h-[calc(100vh-1rem)] overflow-hidden bg-slate-50/50 rounded-3xl relative border border-slate-200/60 shadow-sm">
            {/* Ambient Multi-Color Glows behind the scene - Light Mode version */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-[100px] pointer-events-none" />
            <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-100/30 blur-[80px] pointer-events-none" />

            {/* Header Area using Unified PageHeader */}
            <div className="flex-none relative z-50 bg-white/95 backdrop-blur-2xl border-b shadow-sm">
                <PageHeader 
                    icon={<Sparkles size={20} className="text-white" />}
                    title="Automasi "
                    accentWord="& Siaran"
                    accentColor="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                    subtitle="Pusat kontrol jadwal real-time dan TV"
                    iconGradient="from-indigo-500 to-purple-600"
                    accentBarGradient="from-indigo-500 via-purple-500 to-pink-400"
                    actions={
                        <>
                            <Link href="/automation/rules" className="hidden sm:block px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-[11px] sm:text-sm font-semibold rounded-xl shadow hover:bg-blue-500 transition whitespace-nowrap">
                                Rules
                            </Link>
                            <Link href="/automation/logs" className="hidden sm:block px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-200 text-slate-800 text-[11px] sm:text-sm font-semibold rounded-xl shadow hover:bg-slate-300 transition whitespace-nowrap">
                                Logs
                            </Link>
                            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm ml-2">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">
                                    System Online
                                </span>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 lg:pl-4 border-l border-slate-200/60 ml-2 pl-3 lg:ml-2 flex-shrink-0">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">Dr. Admin</p>
                                    <p className="text-[9px] sm:text-[10px] text-blue-600 font-semibold uppercase tracking-wider mt-0.5">Super Admin</p>
                                </div>
                                <div className="relative flex shrink-0 overflow-hidden rounded-full h-8 w-8 sm:h-9 sm:w-9 shadow-sm hover:scale-105 transition-transform duration-300 ring-2 ring-white border border-slate-100/50">
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-400 text-[10px] sm:text-xs font-bold text-white shadow-inner">
                                        AD
                                    </div>
                                </div>
                            </div>
                        </>
                    }
                />
            </div>

            {/* Main Content Grid */}
            <div className="relative z-0 flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 px-4 lg:px-8 pb-4 lg:pb-8 pt-4 overflow-y-auto custom-scrollbar">
                {/* Left Column — System Status + Activity */}
                <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-6 h-max">
                    <NeuralCore />
                    <ActivityStream />
                </div>

                {/* Right Column — Broadcast Control */}
                <div className="lg:col-span-7 h-max">
                    <BroadcastControl />
                </div>

                {/* Full Width — Dynamic Island Settings */}
                <div className="lg:col-span-12">
                    <DynamicIslandSettings />
                </div>
            </div>
        </div>
    );
}
