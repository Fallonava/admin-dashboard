"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Menu,
  Plus,
  CalendarPlus,
  Palmtree,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { canRead, isSuperAdmin } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navItems = [
    { name: "Beranda", href: "/", icon: LayoutDashboard, resource: "dashboard" },
    { name: "Jadwal", href: "/schedules", icon: Calendar, resource: "schedules" },
    { name: "Tambah", href: "#", icon: Plus, isCenter: true, resource: null },
    { name: "Dokter", href: "/doctors", icon: Users, resource: "doctors" },
    { name: "Menu", href: "#", icon: Menu, isMenu: true, resource: null },
  ];

  const filterByPermission = (items: any[]) => {
    if (isSuperAdmin) return items;
    return items.filter((item) => !item.resource || canRead(item.resource));
  };

  const visibleItems = filterByPermission(navItems);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-mobile-menu"));
  };

  const handleCenterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSheetOpen(true);
  };

  const handleSheetNav = (href: string) => {
    setSheetOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* ══════ BOTTOM SHEET OVERLAY ══════ */}
      {sheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[110] bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* ══════ QUICK ADD BOTTOM SHEET ══════ */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-[120] transition-transform duration-300 ease-out",
          sheetOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-white/95 backdrop-blur-3xl rounded-t-[32px] border-t border-white/60 shadow-[0_-20px_60px_rgba(0,0,0,0.12)] px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)]">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-800 text-base">Tambah Cepat</h3>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Pilih jenis data yang ingin ditambahkan</p>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSheetNav("/schedules")}
              className="group flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100 active:scale-95 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_6px_16px_rgba(99,102,241,0.35)] group-hover:shadow-[0_8px_20px_rgba(99,102,241,0.45)] transition-shadow">
                <CalendarPlus size={22} className="text-white" strokeWidth={2} />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-800 text-[13px]">Tambah Shift</p>
                <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Jadwal praktek</p>
              </div>
            </button>

            <button
              onClick={() => handleSheetNav("/leaves")}
              className="group flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100 active:scale-95 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-[0_6px_16px_rgba(16,185,129,0.35)] group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.45)] transition-shadow">
                <Palmtree size={22} className="text-white" strokeWidth={2} />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-800 text-[13px]">Ajukan Cuti</p>
                <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Kelola cuti dokter</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ══════ BOTTOM NAV BAR ══════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
        <div className="relative pointer-events-auto">
          {/* Glass plate */}
          <div className="absolute inset-x-0 bottom-0 top-0 bg-white/80 backdrop-blur-3xl border-t border-white/50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/5 rounded-t-[32px]" />

          <nav className="relative flex items-center justify-between px-6 h-20 pb-[env(safe-area-inset-bottom,16px)]">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && item.href !== "#" && pathname.startsWith(item.href));
              const Icon = item.icon;

              if (item.isCenter) {
                return (
                  <button
                    key={item.name}
                    onClick={handleCenterClick}
                    className="relative flex flex-col items-center justify-center flex-1 transition-all active:scale-90 mt-1 min-h-[44px]"
                  >
                    <div className="h-[40px] w-[40px] flex items-center justify-center">
                      <div
                        className={cn(
                          "absolute -top-6 h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl",
                          sheetOpen
                            ? "btn-gradient text-white shadow-blue-500/40 scale-110"
                            : "bg-slate-900 text-white shadow-slate-900/30 hover:scale-105"
                        )}
                      >
                        <Icon
                          size={28}
                          className={cn(
                            "transition-transform duration-300",
                            sheetOpen && "rotate-45"
                          )}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-black mt-1 uppercase tracking-tighter transition-all duration-300",
                        sheetOpen ? "text-blue-600 opacity-100" : "text-slate-400 opacity-70"
                      )}
                    >
                      {item.name}
                    </span>
                  </button>
                );
              }

              const content = (
                <>
                  <div
                    className={cn(
                      "p-2 rounded-2xl transition-all duration-300",
                      isActive ? "bg-blue-600/10 text-blue-600 scale-110" : "text-slate-400"
                    )}
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-black mt-1 uppercase tracking-tighter transition-all duration-300",
                      isActive ? "text-blue-600 opacity-100" : "text-slate-400 opacity-70"
                    )}
                  >
                    {item.name}
                  </span>
                </>
              );

              if (item.isMenu) {
                return (
                  <button
                    key={item.name}
                    onClick={handleMenuClick}
                    className="flex flex-col items-center justify-center flex-1 transition-all active:scale-90 outline-none mt-1 min-h-[44px]"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 transition-all active:scale-90 mt-1 min-h-[44px]"
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
