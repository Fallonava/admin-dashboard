import React from "react";
import { BarChart2, CalendarDays, Activity } from "lucide-react";
import DailyRecapUploader from "@/components/DailyRecapUploader";
import HistoryDashboard from "@/components/HistoryDashboard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function RekapHarianPage() {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col w-full min-h-full bg-slate-50 relative -mx-4 lg:-mx-6 -mt-2 lg:-mt-6">

      <PageHeader
        icon={<BarChart2 size={20} className="text-white" />}
        title="Rekapitulasi Harian"
        accentWord="Harian"
        accentColor="text-indigo-600"
        subtitle={today}
        iconGradient="from-indigo-500 to-purple-600"
        accentBarGradient="from-indigo-500 via-purple-500 to-pink-400"
        badge={
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-600 uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </span>
        }
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Activity size={13} className="text-indigo-500" />
              <span className="text-xs font-bold text-slate-600">Claim Aging</span>
            </div>
            <DailyRecapUploader />
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto">
        <HistoryDashboard />
      </div>

    </div>
  );
}
