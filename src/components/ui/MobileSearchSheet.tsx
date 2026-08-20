"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
}

export function MobileSearchSheet({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  isSearching
}: MobileSearchSheetProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[150] flex flex-col justify-end">
      {/* Backdrop overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div className={cn(
        "relative w-full clay-surface rounded-t-[36px] sm:rounded-t-[44px] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isClosing ? "translate-y-full" : "translate-y-0"
      )} style={{ height: 'auto', maxHeight: '80vh' }}>
        {/* Grab Handle */}
        <div className="flex justify-center pt-4 pb-2 shrink-0 cursor-ns-resize" onClick={handleClose}>
          <div className="w-12 h-1.5 rounded-full clay-inset" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 shrink-0 flex items-center justify-between border-b border-zinc-200/60 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] clay-icon-blue flex items-center justify-center text-white shrink-0">
              <Search size={18} strokeWidth={2.5} className="relative z-10" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">Cari Dokter</h1>
              <p className="text-[11px] text-zinc-500 font-bold mt-0.5">Cari berdasarkan nama atau spesialisasi</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 min-h-[44px] min-w-[44px] clay-button rounded-full text-zinc-400 transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 shrink-0">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4 animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
            )}
            <input
              type="text"
              placeholder="Ketik nama dokter atau spesialisasi..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 clay-inset rounded-2xl text-sm font-bold text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none transition-all"
              autoFocus
            />
          </div>

          {searchQuery && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-bold">
                Mencari: &ldquo;{searchQuery}&rdquo;
              </span>
              <button
                onClick={() => onSearchChange('')}
                className="text-xs text-blue-600 dark:text-blue-400 font-black hover:underline"
              >
                Hapus
              </button>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        {!searchQuery && (
          <div className="px-6 pb-6">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Pencarian Cepat</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                'Jantung', 'Mata', 'Kulit', 'Anak', 'Bedah', 'Gigi',
                'THT', 'Saraf', 'Paru', 'Gizi', 'Jiwa', 'Orthopedi'
              ].map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => onSearchChange(specialty)}
                  className="p-2.5 min-h-[40px] clay-button rounded-xl text-xs font-black text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95 text-center"
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom spacing for safe area */}
        <div className="h-6 shrink-0" style={{ height: 'env(safe-area-inset-bottom, 24px)' }} />
      </div>
    </div>
  );
}