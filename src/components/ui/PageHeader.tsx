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
 * Premium enterprise page header — consistent across all admin pages.
 * Features: gradient icon badge with glow, bold title w/ accent,
 * subtle glass background, animated gradient accent bar, and action slots.
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
        <span className={cn("font-black", accentColor)}>{accentWord}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <header
      className={cn(
        "animate-in fade-in slide-in-from-top-4 duration-500 ease-out",
        "flex-none z-50",
        "m-2 sm:m-4 lg:m-6 lg:mb-2",
        "rounded-[20px] lg:rounded-[24px]",
        "bg-[#131620] border border-[#232736]",
        "shadow-sm",
        className
      )}
    >
      <div className="px-4 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4 flex flex-col gap-3 sm:flex-row sm:items-center justify-between relative z-10">

        {/* Left: Icon + Title + Subtitle */}
        <div className="flex items-center gap-3.5 lg:gap-4 min-w-0">

          {/* Solid Icon Badge */}
          <div className="relative shrink-0">
            <div
              className={cn(
                "relative w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center bg-gradient-to-br border border-white/10 shadow-sm",
                iconGradient
              )}
            >
              {icon}
            </div>
          </div>

          {/* Title block */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg lg:text-xl font-black text-zinc-100 tracking-tight leading-tight truncate">
                {renderTitle()}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-[11px] lg:text-xs text-zinc-400 font-medium mt-0.5 truncate">
                {subtitle}
              </p>
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
    </header>
  );
}
