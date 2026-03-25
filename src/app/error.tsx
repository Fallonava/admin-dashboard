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
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full super-glass-card bg-white/60 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
          <AlertTriangle size={40} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Interruption</h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Maaf, sistem mengalami kendala teknis mendadak. Tenang, data Anda tetap aman.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="w-full p-4 bg-slate-100/50 rounded-2xl text-[10px] text-red-500 font-mono text-left overflow-auto max-h-[100px] border border-slate-200">
            {error.message}
          </div>
        )}

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30"
          >
            <RefreshCw size={18} />
            Coba Segarkan Halaman
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-4 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl font-black transition-all border border-slate-200 shadow-sm"
          >
            <Home size={18} />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
