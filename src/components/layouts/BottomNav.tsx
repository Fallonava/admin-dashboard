"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Umbrella,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const pathname = usePathname();
  const { canRead, isSuperAdmin } = useAuth();

  const navItems = [
    { name: "Beranda", href: "/",          icon: LayoutDashboard, resource: "denah_live" },
    { name: "Jadwal",  href: "/schedules",  icon: Calendar,        resource: "schedules" },
    { name: "Dokter",  href: "/doctors",    icon: Users,           resource: "doctors" },
    { name: "Cuti",    href: "/leaves",     icon: Umbrella,        resource: "leaves" },
    { name: "Menu",    href: "#",           icon: Menu,            isMenu: true, resource: null },
  ];

  const filterByPermission = (items: typeof navItems) => {
    if (isSuperAdmin) return items;
    return items.filter((item) => !item.resource || canRead(item.resource));
  };

  const visibleItems = filterByPermission(navItems);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-mobile-menu"));
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] pointer-events-none px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-1">
      <div className="relative pointer-events-auto max-w-lg mx-auto">
        {/* Floating Clay Pill Plate */}
        <nav className="relative flex items-center justify-around h-[62px] px-1.5 rounded-[26px] clay-surface shadow-xl">
          {visibleItems.map((item) => {
            const isActive =
              !item.isMenu && (
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
              );
            const Icon = item.icon;

            const content = (
              <div
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-2.5 rounded-[18px] transition-all duration-200 w-full min-h-[44px]",
                  isActive
                    ? "clay-button text-blue-600 dark:text-blue-400 font-black scale-105"
                    : "text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                  {item.name}
                </span>
              </div>
            );

            if (item.isMenu) {
              return (
                <button
                  key={item.name}
                  onClick={handleMenuClick}
                  aria-label="Buka Menu"
                  className="flex-1 flex items-center justify-center active:scale-95 transition-transform duration-150 outline-none"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex-1 flex items-center justify-center active:scale-95 transition-transform duration-150 outline-none"
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

