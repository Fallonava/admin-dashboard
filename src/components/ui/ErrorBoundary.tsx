"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  className?: string;
  name?: string; // Optional name to identify the boundary in logs
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — Menangkap error di level render (React 19 compatible).
 * Mencegah satu komponen rusak meruntuhkan seluruh aplikasi.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state agar render berikutnya menampilkan UI fallback
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in boundary [${this.props.name || 'Global'}]:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={cn(
          "w-full p-6 rounded-[28px] clay-surface flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-300",
          this.props.className
        )}>
          <div className="w-12 h-12 rounded-[16px] clay-icon-rose flex items-center justify-center text-white shrink-0">
            <AlertCircle size={22} className="relative z-10" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-sm">Oops, Terjadi Kesalahan</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold max-w-[240px]">
              {this.props.name ? `Komponen "${this.props.name}"` : "Bagian ini"} gagal dimuat.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-[14px] clay-pill-rose text-white text-xs font-black shadow-sm active:scale-95 transition-all"
          >
            <RefreshCcw size={13} strokeWidth={2.5} />
            <span>Coba Lagi</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
