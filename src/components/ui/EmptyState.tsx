import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-500", className)}>
      {icon && (
        <div className="w-20 h-20 mb-6 rounded-[24px] bg-slate-50 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_12px_24px_-8px_rgba(0,0,0,0.05)] border border-slate-100">
           {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 font-medium max-w-[280px] leading-relaxed mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
