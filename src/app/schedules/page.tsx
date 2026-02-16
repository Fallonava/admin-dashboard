import { StatsCards } from "@/components/schedules/StatsCards";
import { RealtimeCalendar } from "@/components/schedules/RealtimeCalendar";
import { UpcomingShifts } from "@/components/schedules/UpcomingShifts";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SchedulesPage() {
    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Schedules</h1>
                    <span className="text-slate-500 text-sm font-medium">Weekly Overview</span>
                </div>

                <div className="flex items-center gap-5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search doctor or shift..."
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 w-72 placeholder:text-slate-600"
                        />
                    </div>

                    <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 border-2 border-slate-950"></span>
                    </button>

                    <div className="flex items-center gap-3 pl-5 border-l border-white/[0.06]">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white">Dr. Admin</p>
                            <p className="text-[11px] text-blue-400 font-medium">Super Admin</p>
                        </div>
                        <Avatar className="h-9 w-9 border-2 border-white/10">
                            <AvatarImage src="/avatars/admin.png" />
                            <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-cyan-400 text-xs font-bold" />
                        </Avatar>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <StatsCards />
                    <RealtimeCalendar />
                </div>
                <UpcomingShifts />
            </div>
        </div>
    );
}
