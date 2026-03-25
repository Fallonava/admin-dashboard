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
          "w-full p-6 rounded-[28px] bg-red-50/50 border border-red-100 backdrop-blur-xl flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-500",
          this.props.className
        )}>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-red-900">Oops, Terjadi Kesalahan</h3>
            <p className="text-xs text-red-600/80 font-medium max-w-[240px]">
              {this.props.name ? `Komponen "${this.props.name}"` : "Bagian ini"} gagal dimuat.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-red-600 text-xs font-black shadow-sm border border-red-100 hover:bg-red-50 active:scale-95 transition-all"
          >
            <RefreshCcw size={14} />
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
