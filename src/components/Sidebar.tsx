"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Bot,
  Server,
  Activity,
  Tv,
  Menu,
  X,
  Shield,
  LogOut,
  FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, resource: "dashboard" },
  { name: "Jadwal", href: "/schedules", icon: Calendar, resource: "schedules" },
  { name: "Dokter", href: "/doctors", icon: Users, resource: "doctors" },
  { name: "Jadwal Cuti", href: "/leaves", icon: Calendar, resource: "leaves" },
  { name: "Rekap Harian", href: "/rekap-harian", icon: FileSpreadsheet, resource: null },
];

export const systems = [
  { name: "Otomatisasi", href: "/automation", icon: Bot, resource: "automation" },
  { name: "Layar Langsung", href: "/tv.html", icon: Tv, external: true, resource: null },
];

export const admin = [
  { name: "Manajemen Akses", href: "/settings/access", icon: Shield, resource: "access" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, canRead, isSuperAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const filterByPermission = (items: typeof navigation) => {
    if (isSuperAdmin) return items;
    return items.filter((item) => !item.resource || canRead(item.resource));
  };

  const renderLink = (item: { name: string; href: string; icon: React.ElementType; external?: boolean; resource?: string | null }) => {
    // Determine if any link in the sidebar matches the current pathname exactly
    const allLinks = [...navigation, ...systems, ...admin];
    const hasExactMatch = allLinks.some(l => l.href === pathname);
    
    // If an exact match exists, only highlight the item that matches exactly.
    // Otherwise, use prefix matching for sub-pages.
    const isActive = hasExactMatch 
      ? pathname === item.href 
      : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
      
    const linkClassName = cn(
      "relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 group/link",
      isActive
        ? "bg-gradient-to-r from-blue-600/10 to-indigo-600/5 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_4px_rgba(59,130,246,0.08)]"
        : "hover:bg-black/[0.04] hover:text-foreground text-muted-foreground"
    );
    const iconClassName = cn(
      "h-4.5 w-4.5 transition-colors",
      isActive ? "text-blue-600" : "text-muted-foreground group-hover/link:text-slate-700"
    );

    if (item.external) {
      return (
        <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-500" />}
          <item.icon className={iconClassName} />
          {item.name}
        </a>
      );
    }

    return (
      <Link key={item.name} href={item.href} className={linkClassName}>
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-500" />}
        <item.icon className={iconClassName} />
        {item.name}
      </Link>
    );
  };

  const visibleNav = filterByPermission(navigation);
  const visibleSystems = systems.filter((item) => !item.resource || isSuperAdmin || canRead(item.resource));
  const visibleAdmin = admin.filter((item) => !item.resource || isSuperAdmin || canRead(item.resource));

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="h-10 w-10 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md logo-glow">
              <defs>
                <linearGradient id="sidebar-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0E4B82" />
                  <stop offset="100%" stopColor="#082A4D" />
                </linearGradient>
                <linearGradient id="sidebar-gold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EBC44F" />
                  <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="112" fill="url(#sidebar-bg-gradient)" />
              <circle cx="256" cy="256" r="210" stroke="#1A73E8" strokeWidth={12} opacity={0.4} />
              <circle cx="256" cy="256" r="160" fill="#0D47A1" fillOpacity={0.2} stroke="#1A73E8" strokeWidth={4} />
              <path d="M190 220 C180 220, 160 240, 160 300 C160 340, 180 340, 190 340" stroke="url(#sidebar-gold-gradient)" strokeWidth={24} strokeLinecap="round" fill="none" />
              <path d="M322 220 C332 220, 352 240, 352 300 C352 340, 332 340, 322 340" stroke="url(#sidebar-gold-gradient)" strokeWidth={24} strokeLinecap="round" fill="none" />
              <path d="M190 220 L215 256" stroke="url(#sidebar-gold-gradient)" strokeWidth={24} strokeLinecap="round" />
              <path d="M322 220 L297 256" stroke="url(#sidebar-gold-gradient)" strokeWidth={24} strokeLinecap="round" />
              <rect x="226" y="196" width="60" height="120" rx="8" fill="white" />
              <rect x="196" y="226" width="120" height="60" rx="8" fill="white" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">MedCore<span className="text-xs align-top text-primary">26</span></h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Admin Console</p>
          </div>
        </div>

        <nav className="space-y-1 mb-8">
          {visibleNav.map(renderLink)}
        </nav>

        {visibleSystems.length > 0 && (
          <>
            <div className="px-3 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistem</p>
            </div>
            <nav className="space-y-1 mb-8">
              {visibleSystems.map(renderLink)}
            </nav>
          </>
        )}

        {visibleAdmin.length > 0 && (
          <>
            <div className="px-3 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
            </div>
            <nav className="space-y-1">
              {visibleAdmin.map(renderLink)}
            </nav>
          </>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-black/[0.05]">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Memuat..."}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase truncate">{user?.roleName || ""}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex-shrink-0" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ═══ DESKTOP SIDEBAR (always visible on LG+) ═══ */}
      <div className="hidden lg:flex h-screen w-64 flex-col justify-between super-glass p-4 transition-colors duration-300 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.05)] z-20 relative flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
