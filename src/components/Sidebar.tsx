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
  FileSpreadsheet,
  Zap,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export const navigation = [
  { name: "Denah Live", href: "/", icon: LayoutDashboard, resource: "denah_live", category: "Pelayanan" },
  { name: "Kontrol Status", href: "/control", icon: Zap, resource: "kontrol_status", category: "Pelayanan" },
  { name: "Rekap Harian", href: "/rekap-harian", icon: FileSpreadsheet, resource: "rekap_harian", category: "Pelayanan" },
  { name: "Jadwal Petugas", href: "/jadwal-petugas", icon: CalendarDays, resource: "schedules", category: "Manajemen Staf" },
  { name: "Jadwal Dokter", href: "/schedules", icon: Calendar, resource: "schedules", category: "Manajemen Staf" },
  { name: "List Dokter", href: "/doctors", icon: Users, resource: "doctors", category: "Manajemen Staf" },
  { name: "Jadwal Cuti", href: "/leaves", icon: Calendar, resource: "leaves", category: "Manajemen Staf" },
];

export const systems = [
  { name: "Otomatisasi", href: "/automation", icon: Bot, resource: "automation" },
  { name: "Layar Langsung", href: "/tv.html", icon: Tv, external: true, resource: "display_tv" },
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
      "relative flex items-center gap-3.5 rounded-[16px] px-4 py-3 text-sm font-bold transition-all duration-300 group/link border",
      isActive
        ? "bg-indigo-50/80 text-indigo-700 shadow-sm border-indigo-200/50"
        : "hover:bg-slate-50 hover:text-slate-900 text-slate-500 border-transparent hover:border-slate-200/60"
    );
    const iconClassName = cn(
      "h-[18px] w-[18px] transition-all duration-300",
      isActive ? "text-indigo-600 drop-shadow-sm scale-110" : "text-slate-400 group-hover/link:text-indigo-500 group-hover/link:scale-110"
    );

    if (item.external) {
      return (
        <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
          <item.icon className={iconClassName} strokeWidth={isActive ? 2.5 : 2} />
          {item.name}
        </a>
      );
    }

    return (
      <Link key={item.name} href={item.href} className={linkClassName}>
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
        <item.icon className={iconClassName} strokeWidth={isActive ? 2.5 : 2} />
        {item.name}
      </Link>
    );
  };

  const visibleNav = filterByPermission(navigation);
  const visibleSystems = systems.filter((item) => !item.resource || isSuperAdmin || canRead(item.resource));
  const visibleAdmin = admin.filter((item) => !item.resource || isSuperAdmin || canRead(item.resource));

  // Group visibleNav by category
  const navByCategory = visibleNav.reduce((acc, item) => {
     const cat = item.category || "Umum";
     if (!acc[cat]) acc[cat] = [];
     acc[cat].push(item);
     return acc;
  }, {} as Record<string, typeof visibleNav>);

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="flex items-center gap-3 px-3 mb-8 mt-2">
          <div className="h-11 w-11 flex items-center justify-center relative shrink-0">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full mix-blend-multiply" />
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-lg ring-1 ring-white/50 flex items-center justify-center relative z-10 transition-transform duration-500 hover:scale-105 hover:-rotate-3">
               <Activity size={24} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-black tracking-tight text-slate-800 truncate">
              MedCore<span className="text-[10px] align-top text-indigo-500 font-black ml-0.5">26</span>
            </h1>
            <p className="text-[9px] text-indigo-600/80 font-bold uppercase tracking-widest truncate">Admin Console</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {Object.entries(navByCategory).map(([category, items]) => (
             <div key={category} className="flex flex-col gap-1">
                <div className="px-4 mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{category}</p>
                </div>
                <nav className="space-y-0.5">
                  {items.map(renderLink)}
                </nav>
             </div>
          ))}

          {visibleSystems.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="px-4 mb-1 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Sistem & Otomatisasi</p>
              </div>
              <nav className="space-y-0.5">
                {visibleSystems.map(renderLink)}
              </nav>
            </div>
          )}

          {visibleAdmin.length > 0 && (
            <div className="flex flex-col gap-1">
               <div className="px-4 mb-1 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Administrator</p>
              </div>
              <nav className="space-y-0.5">
                {visibleAdmin.map(renderLink)}
              </nav>
            </div>
          )}
        </div>
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
