"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Shield, 
  Zap,
  Bot,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const pathname = usePathname();
  const { canRead, isSuperAdmin } = useAuth();

  const navItems = [
    { name: "Beranda", href: "/", icon: LayoutDashboard, resource: "dashboard" },
    { name: "Jadwal", href: "/schedules", icon: Calendar, resource: "schedules" },
    { name: "Otomatisasi", href: "/automation", icon: Bot, isCenter: true, resource: "automation" },
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
    window.dispatchEvent(new CustomEvent('open-mobile-menu'));
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="relative pointer-events-auto">
        {/* Background Glass Plate - Edge to Edge */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-white/80 backdrop-blur-3xl border-t border-white/50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/5 rounded-t-[32px]" />
        
        {/* Navigation Content with Safe Area support */}
        <nav className="relative flex items-center justify-between px-6 h-20 pb-[env(safe-area-inset-bottom,16px)]">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            if (item.isCenter) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative -top-8 flex flex-col items-center justify-center transition-transform duration-300 active:scale-90"
                >
                  <div className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl",
                    isActive 
                      ? "btn-gradient text-white shadow-blue-500/40" 
                      : "bg-slate-900 text-white shadow-slate-900/30"
                  )}>
                    <Icon size={28} className={cn(isActive && "animate-pulse")} />
                  </div>
                  <span className={cn(
                    "absolute -bottom-6 text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                    isActive ? "text-blue-600" : "text-slate-400"
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            }

            const content = (
              <>
                <div className={cn(
                  "p-2 rounded-2xl transition-all duration-300",
                  isActive ? "bg-blue-600/10 text-blue-600 scale-110" : "text-slate-400"
                )}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-black mt-1 uppercase tracking-tighter transition-all duration-300",
                  isActive ? "text-blue-600 opacity-100" : "text-slate-400 opacity-70"
                )}>
                  {item.name}
                </span>
              </>
            );

            if (item.isMenu) {
              return (
                <button
                  key={item.name}
                  onClick={handleMenuClick}
                  className="flex flex-col items-center justify-center flex-1 transition-all active:scale-90 outline-none mt-1"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 transition-all active:scale-90 mt-1"
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
