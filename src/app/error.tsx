"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

/**
 * Root Error Component — Next.js 15+ App Router
 * Menangani error fatal yang terjadi di seluruh rute aplikasi.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error ke layanan monitoring (Sentry sudah terintegrasi)
    console.error("Fatal Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#EDF2F8] dark:bg-[#0B0E14] flex items-center justify-center p-6">
      <div className="max-w-md w-full clay-surface p-8 rounded-[36px] flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-3xl clay-pill-rose flex items-center justify-center text-white shadow-md">
          <AlertTriangle size={36} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">System Interruption</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">
            Maaf, sistem mengalami kendala teknis mendadak. Tenang, data Anda tetap aman.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="w-full p-4 clay-inset rounded-2xl text-[10px] text-red-500 font-mono text-left overflow-auto max-h-[100px]">
            {error.message}
          </div>
        )}

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-3.5 clay-pill-blue text-white rounded-2xl font-black transition-all active:scale-95 text-xs sm:text-sm shadow-md"
          >
            <RefreshCw size={16} />
            Coba Segarkan Halaman
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3.5 clay-button text-zinc-600 dark:text-zinc-300 rounded-2xl font-black transition-all text-xs sm:text-sm active:scale-95"
          >
            <Home size={16} />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
