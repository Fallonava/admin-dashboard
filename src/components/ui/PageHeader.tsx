import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Lucide icon element, e.g. <Users size={20} className="text-white" /> */
  icon: React.ReactNode;
  /** Main title — plain string; the accentWord will be highlighted */
  title: string;
  /** Word or phrase inside the title to colorize */
  accentWord?: string;
  /** Short subtitle / description */
  subtitle?: string;
  /** Gradient class for icon badge, e.g. "from-blue-500 to-indigo-600" */
  iconGradient?: string;
  /** Gradient class for accent bar at the bottom, e.g. "from-indigo-500 via-purple-500 to-pink-400" */
  accentBarGradient?: string;
  /** Text color for the accented word, e.g. "text-indigo-600" */
  accentColor?: string;
  /** Optional right-side actions */
  actions?: React.ReactNode;
  /** Optional extra badge (e.g. "Live" pulse pill) */
  badge?: React.ReactNode;
  /** Additional className for the outer <header> wrapper */
  className?: string;
}

/**
 * Standardized page header used across all admin dashboard pages.
 * Provides a consistent look: gradient icon badge, bold title w/ accent,
 * subtitle, optional actions, and a gradient stripe at the bottom.
 */
export function PageHeader({
  icon,
  title,
  accentWord,
  subtitle,
  iconGradient = "from-indigo-500 to-purple-600",
  accentBarGradient = "from-indigo-500 via-purple-500 to-pink-400",
  accentColor = "text-indigo-600",
  actions,
  badge,
  className,
}: PageHeaderProps) {
  // Split title around accentWord for inline coloring
  const renderTitle = () => {
    if (!accentWord) return <span>{title}</span>;
    const parts = title.split(accentWord);
    return (
      <>
        {parts[0]}
        <span className={cn("font-bold", accentColor)}>{accentWord}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <header className={cn("sticky top-[-0.5rem] lg:top-[-1.5rem] z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]", className)}>
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">

        {/* Left: Icon + Title + Subtitle */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Icon Badge */}
          <div
            className={cn(
              "shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-[0_4px_12px_rgba(99,102,241,0.30)]",
              iconGradient
            )}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
                {renderTitle()}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Gradient accent stripe */}
      <div className={cn("h-[2px] bg-gradient-to-r opacity-60", accentBarGradient)} />
    </header>
  );
}
