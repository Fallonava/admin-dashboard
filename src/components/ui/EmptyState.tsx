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
    <div className={cn("flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-300", className)}>
      {icon && (
        <div className="w-20 h-20 mb-5 rounded-[28px] clay-button flex items-center justify-center shadow-md">
           {icon}
        </div>
      )}
      <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold max-w-[300px] leading-relaxed mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
