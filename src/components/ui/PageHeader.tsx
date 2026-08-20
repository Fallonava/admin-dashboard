"use client";

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
  /** clay-icon-* class for the 3D icon container, e.g. "clay-icon-blue" */
  iconClay?: string;
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
 * Premium 3D Claymorphic Page Header — unified design language across SIMED.
 * Features:
 * - Dual-layer 3D tactile icon frame
 * - Bold title with vibrant typography accents
 * - Tactile recessed subtitle capsule
 * - Sleek bottom shimmer accent track
 */
export function PageHeader({
  icon,
  title,
  accentWord,
  subtitle,
  iconClay = "clay-icon-blue",
  accentBarGradient = "from-blue-500 via-indigo-500 to-violet-500",
  accentColor = "text-blue-600 dark:text-blue-400",
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
        <span className={cn("font-black", accentColor)}>{accentWord}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <header
      className={cn(
        "animate-in fade-in slide-in-from-top-3 duration-400 ease-out",
        "flex-none z-40",
        "mx-2 my-2 sm:m-4 lg:m-6 lg:mb-2",
        "rounded-[24px] lg:rounded-[30px]",
        "clay-surface",
        "shadow-lg relative overflow-hidden",
        "border-t border-white/80 dark:border-white/10",
        className
      )}
    >
      <div className="px-3.5 py-3 sm:px-5 sm:py-3.5 lg:px-6 lg:py-4 flex flex-col gap-3 sm:flex-row sm:items-center justify-between relative z-10">
        
        {/* Left: 3D Dual-Layer Icon + Titles + Subtitle Badge */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
          {/* Dual-layer 3D Clay Icon Container */}
          <div className="relative shrink-0">
            <div className="p-1 clay-inset rounded-[20px] lg:rounded-[22px] shadow-inner">
              <div
                className={cn(
                  "w-10 h-10 lg:w-11 lg:h-11 rounded-[16px] lg:rounded-[18px] flex items-center justify-center text-white shadow-md transition-transform duration-200 hover:scale-105",
                  iconClay
                )}
              >
                <span className="relative z-10 flex items-center justify-center">{icon}</span>
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[16px] sm:text-[18px] lg:text-[20px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight truncate">
                {renderTitle()}
              </h1>
              {badge}
            </div>

            {subtitle && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full clay-inset text-[10px] sm:text-[10.5px] font-extrabold text-zinc-500 dark:text-zinc-400 tracking-wide truncate max-w-[280px] sm:max-w-md">
                  {subtitle}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>

      {/* Modern Accent Progress / Shimmer Track */}
      <div className="w-full h-[2.5px] clay-inset overflow-hidden relative">
        <div className={cn("shimmer-bar h-full bg-gradient-to-r opacity-90", accentBarGradient)} />
      </div>
    </header>
  );
}

