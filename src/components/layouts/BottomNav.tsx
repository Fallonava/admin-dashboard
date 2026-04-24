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
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { canRead, isSuperAdmin } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navItems = [
    { name: "Beranda",  href: "/",        icon: LayoutDashboard, resource: "denah_live" },
    { name: "Kontrol",  href: "/control", icon: Zap,             resource: "kontrol_status" },
    { name: "Tambah",   href: "#",        icon: Plus,            isCenter: true, resource: null },
    { name: "Jadwal",   href: "/schedules", icon: Calendar,      resource: "schedules" },
    { name: "Menu",     href: "#",        icon: Menu,            isMenu: true, resource: null },
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

  // Quick add action definitions — permission-gated
  const quickAddActions = [
    {
      label: "Tambah Shift",
      sub: "Jadwal praktek dokter",
      href: "/schedules",
      resource: "schedules",
      gradient: "from-indigo-500 to-violet-600",
      bg: "from-indigo-50 to-violet-50",
      border: "border-indigo-100 hover:border-indigo-200 hover:shadow-indigo-100",
      Icon: CalendarPlus,
      shadow: "shadow-[0_6px_16px_rgba(99,102,241,0.35)] group-hover:shadow-[0_8px_20px_rgba(99,102,241,0.45)]",
    },
    {
      label: "Ajukan Cuti",
      sub: "Kelola cuti dokter",
      href: "/leaves",
      resource: "leaves",
      gradient: "from-emerald-500 to-teal-600",
      bg: "from-emerald-50 to-teal-50",
      border: "border-emerald-100 hover:border-emerald-200 hover:shadow-emerald-100",
      Icon: Palmtree,
      shadow: "shadow-[0_6px_16px_rgba(16,185,129,0.35)] group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.45)]",
    },
    {
      label: "Data Dokter",
      sub: "Kelola profil dokter",
      href: "/doctors",
      resource: "doctors",
      gradient: "from-sky-500 to-blue-600",
      bg: "from-sky-50 to-blue-50",
      border: "border-sky-100 hover:border-sky-200 hover:shadow-sky-100",
      Icon: Users,
      shadow: "shadow-[0_6px_16px_rgba(14,165,233,0.35)] group-hover:shadow-[0_8px_20px_rgba(14,165,233,0.45)]",
    },
  ].filter(a => !a.resource || isSuperAdmin || canRead(a.resource));

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

          {/* Actions — dynamic grid based on count */}
          <div className={cn(
            "grid gap-3",
            quickAddActions.length === 1 ? "grid-cols-1" :
            quickAddActions.length === 2 ? "grid-cols-2" :
            "grid-cols-3"
          )}>
            {quickAddActions.map((action) => (
              <button
                key={action.href}
                onClick={() => handleSheetNav(action.href)}
                className={cn(
                  "group flex flex-col items-center justify-center gap-2.5 p-4 rounded-[20px]",
                  `bg-gradient-to-br ${action.bg}`,
                  `border ${action.border}`,
                  "hover:shadow-md active:scale-95 transition-all duration-200"
                )}
              >
                <div className={cn(
                  "w-11 h-11 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow transition-shadow",
                  action.gradient, action.shadow
                )}>
                  <action.Icon size={20} className="text-white" strokeWidth={2} />
                </div>
                <div className="text-center">
                  <p className="font-black text-slate-800 text-[12px] leading-tight">{action.label}</p>
                  <p className="text-slate-400 text-[10px] font-semibold mt-0.5 hidden sm:block">{action.sub}</p>
                </div>
              </button>
            ))}
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
