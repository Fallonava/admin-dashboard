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
        "relative w-full bg-white rounded-t-[32px] sm:rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isClosing ? "translate-y-full" : "translate-y-0"
      )} style={{ height: 'auto', maxHeight: '80vh' }}>
        {/* Grab Handle */}
        <div className="flex justify-center pt-4 pb-2 shrink-0 cursor-ns-resize" onClick={handleClose}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 shrink-0 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
              <Search size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">Cari Dokter</h1>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Cari berdasarkan nama atau spesialisasi</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 min-h-[44px] min-w-[44px] bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 shrink-0">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 h-5 w-5 animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            )}
            <input
              type="text"
              placeholder="Ketik nama dokter atau spesialisasi..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 transition-all text-base font-medium text-slate-700 placeholder:text-slate-400 outline-none"
              autoFocus
            />
          </div>

          {searchQuery && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                Mencari: "{searchQuery}"
              </span>
              <button
                onClick={() => onSearchChange('')}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                Hapus
              </button>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        {!searchQuery && (
          <div className="px-6 pb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Pencarian Cepat</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                'Jantung', 'Mata', 'Kulit', 'Anak', 'Bedah', 'Gigi',
                'THT', 'Saraf', 'Paru', 'Gizi', 'Jiwa', 'Orthopedi'
              ].map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => onSearchChange(specialty)}
                  className="p-3 min-h-[44px] bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-sm font-semibold text-slate-600 hover:text-blue-600 transition-all text-left"
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