"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Menu,
  Plus,
  CalendarPlus,
  Umbrella,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { canRead, isSuperAdmin } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navItems = [
    { name: "Beranda", href: "/", icon: LayoutDashboard, resource: "denah_live" },
    { name: "Jadwal", href: "/schedules", icon: Calendar, resource: "schedules" },
    { name: "Tambah", href: "#", icon: Plus, isCenter: true, resource: null },
    { name: "Cuti", href: "/leaves", icon: Umbrella, resource: "leaves" },
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
    setSheetOpen(!sheetOpen);
  };

  const handleSheetNav = (href: string) => {
    setSheetOpen(false);
    router.push(href);
  };

  const quickAddActions = [
    {
      label: "Jadwal Shift",
      sub: "Atur jam praktek",
      href: "/schedules",
      resource: "schedules",
      gradient: "from-blue-600 to-indigo-600",
      Icon: CalendarPlus,
    },
    {
      label: "Ajukan Cuti",
      sub: "Input cuti dokter",
      href: "/leaves",
      resource: "leaves",
      gradient: "from-emerald-600 to-teal-600",
      Icon: Umbrella,
    },
    {
      label: "Data Dokter",
      sub: "Kelola profil dokter",
      href: "/doctors",
      resource: "doctors",
      gradient: "from-violet-600 to-purple-600",
      Icon: Users,
    },
  ].filter((a) => !a.resource || isSuperAdmin || canRead(a.resource));

  return (
    <>
      {/* ══════ iOS ACTION SHEET OVERLAY ══════ */}
      {sheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[110] bg-black/50 animate-in fade-in duration-200"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* ══════ iOS ACTION SHEET MODAL ══════ */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-[120] transition-transform duration-300 ease-out",
          sheetOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-white dark:bg-[#131620] rounded-t-[28px] border-t border-zinc-200 dark:border-[#232736] shadow-2xl px-5 pt-4 pb-[calc(max(env(safe-area-inset-bottom),16px)+5rem)]">
          {/* iOS Grabber Handle */}
          <div className="w-10 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-base tracking-tight">
                Menu Aksi Cepat
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                Pilih menu untuk menambahkan data baru
              </p>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-[#1A1E2B] border border-zinc-200 dark:border-[#2B3145] flex items-center justify-center text-zinc-500 dark:text-zinc-400 active:scale-95"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {quickAddActions.map((action) => (
              <button
                key={action.href}
                onClick={() => handleSheetNav(action.href)}
                className="group flex flex-col items-center justify-center gap-2 p-3.5 rounded-[18px] bg-zinc-50 dark:bg-[#161924] border border-zinc-200 dark:border-[#232736] active:scale-[0.96] transition-all duration-150"
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-[14px] bg-gradient-to-br flex items-center justify-center shadow-sm text-white",
                    action.gradient
                  )}
                >
                  <action.Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="font-black text-zinc-900 dark:text-zinc-100 text-[11.5px] leading-tight">
                    {action.label}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[9.5px] font-medium mt-0.5">
                    {action.sub}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ iOS NATIVE BOTTOM TAB BAR ══════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] pointer-events-none px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-1">
        <div className="relative pointer-events-auto max-w-md mx-auto">
          {/* iOS Floating Pill Plate */}
          <nav className="relative flex items-center justify-around h-[62px] px-2 rounded-[24px] bg-white/95 dark:bg-[#10121A]/95 border border-zinc-200/90 dark:border-[#232736] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
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
                    className="relative flex flex-col items-center justify-center -mt-6 active:scale-[0.92] transition-transform duration-150 outline-none"
                    aria-label="Aksi Cepat"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-[#10121A] transition-all duration-200",
                        sheetOpen
                          ? "bg-zinc-800 dark:bg-zinc-700 rotate-45 scale-105"
                          : "bg-blue-600 hover:bg-blue-500"
                      )}
                    >
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                    <span className="text-[9.5px] font-bold text-zinc-500 dark:text-zinc-400 mt-1">
                      {item.name}
                    </span>
                  </button>
                );
              }

              const content = (
                <div className="flex flex-col items-center justify-center py-1 px-2.5 rounded-[14px] transition-all duration-150">
                  <div
                    className={cn(
                      "p-1 rounded-lg transition-colors duration-150",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    )}
                  >
                    <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-tight transition-colors duration-150",
                      isActive
                        ? "text-blue-600 dark:text-blue-400 font-black"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              );

              if (item.isMenu) {
                return (
                  <button
                    key={item.name}
                    onClick={handleMenuClick}
                    className="flex-1 flex items-center justify-center active:scale-[0.92] transition-transform duration-150 outline-none min-h-[48px]"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex-1 flex items-center justify-center active:scale-[0.92] transition-transform duration-150 min-h-[48px]"
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
