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
      "relative flex items-center gap-3.5 rounded-[20px] px-4 py-3.5 text-sm font-bold transition-all duration-500 group/link border",
      isActive
        ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-800 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_20px_-8px_rgba(99,102,241,0.15)] border-indigo-500/20"
        : "hover:bg-white/60 hover:text-slate-900 text-slate-500 border-transparent hover:border-white/80 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 mr-1"
    );
    const iconClassName = cn(
      "h-5 w-5 transition-all duration-300",
      isActive ? "text-indigo-600 drop-shadow-sm scale-110" : "text-slate-400 group-hover/link:text-indigo-500 group-hover/link:scale-105"
    );

    if (item.external) {
      return (
        <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {isActive && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-400 to-violet-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" />}
          <item.icon className={iconClassName} />
          {item.name}
        </a>
      );
    }

    return (
      <Link key={item.name} href={item.href} className={linkClassName}>
        {isActive && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-400 to-violet-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" />}
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
        <div className="flex items-center gap-3 px-3 mb-10 mt-2">
          <div className="h-11 w-11 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full mix-blend-multiply" />
            <svg width="44" height="44" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md relative z-10 transition-transform duration-500 hover:scale-105 hover:-rotate-3">
              <defs>
                <linearGradient id="sidebar-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
                <linearGradient id="sidebar-gold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e0e7ff" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="140" fill="url(#sidebar-bg-gradient)" />
              <circle cx="256" cy="256" r="210" stroke="#818cf8" strokeWidth={16} opacity={0.4} />
              <circle cx="256" cy="256" r="160" fill="#3730a3" fillOpacity={0.2} stroke="#818cf8" strokeWidth={6} />
              <path d="M190 220 C180 220, 160 240, 160 300 C160 340, 180 340, 190 340" stroke="url(#sidebar-gold-gradient)" strokeWidth={28} strokeLinecap="round" fill="none" />
              <path d="M322 220 C332 220, 352 240, 352 300 C352 340, 332 340, 322 340" stroke="url(#sidebar-gold-gradient)" strokeWidth={28} strokeLinecap="round" fill="none" />
              <path d="M190 220 L215 256" stroke="url(#sidebar-gold-gradient)" strokeWidth={28} strokeLinecap="round" />
              <path d="M322 220 L297 256" stroke="url(#sidebar-gold-gradient)" strokeWidth={28} strokeLinecap="round" />
              <rect x="226" y="196" width="60" height="120" rx="12" fill="white" />
              <rect x="196" y="226" width="120" height="60" rx="12" fill="white" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-slate-800">
              MedCore<span className="text-xs align-top text-indigo-500 font-black ml-0.5">26</span>
            </h1>
            <p className="text-[10px] text-indigo-600/80 font-bold uppercase tracking-widest -mt-0.5">Admin Console</p>
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

      <div className="mt-auto pt-6 border-t border-slate-100/60 pb-2">
        <div className="flex items-center justify-between p-3 rounded-[24px] bg-white/50 backdrop-blur-md border border-white/80 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:bg-white/80 transition-all duration-300">
          <div className="flex items-center gap-3 min-w-0 flex-1 px-1">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0 flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-white">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-slate-800 truncate leading-tight tracking-tight">{user?.name || "Memuat..."}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase truncate tracking-wider mt-0.5">{user?.roleName || ""}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[16px] transition-all flex-shrink-0 hover:shadow-sm" title="Logout">
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ═══ DESKTOP SIDEBAR (Floating Glass Dock 2026) ═══ */}
      <div className="hidden lg:flex h-[calc(100vh-2rem)] my-4 ml-4 w-72 flex-col justify-between bg-white/40 backdrop-blur-[40px] rounded-[40px] p-5 transition-colors duration-500 shadow-[0_8px_40px_rgba(0,0,0,0.04)] ring-1 ring-white/60 z-20 relative flex-shrink-0 hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)] hover:bg-white/50">
        {sidebarContent}
      </div>
    </>
  );
}
