"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bot,
  Activity,
  Tv,
  Shield,
  LogOut,
  FileSpreadsheet,
  Zap,
  CalendarDays,
  MessageSquare,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserRound,
  Umbrella,
  Cpu,
  BrainCircuit,
  Sparkles,
  MonitorPlay,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export const menuConfig = [
  {
    id: "operasional",
    title: "Operasional & Pelayanan",
    icon: Activity,
    items: [
      { name: "Denah Live", href: "/", icon: LayoutDashboard, resource: "denah_live" },
      { name: "Kontrol Status", href: "/control", icon: Zap, resource: "kontrol_status" },
      { name: "Rekap Harian", href: "/rekap-harian", icon: FileSpreadsheet, resource: "rekap_harian" },
    ]
  },
  {
    id: "sdm",
    title: "Manajemen SDM",
    icon: Users,
    items: [
      { name: "Jadwal Petugas", href: "/jadwal-petugas", icon: CalendarDays, resource: "schedules" },
      { name: "Jadwal Dokter", href: "/schedules", icon: Calendar, resource: "schedules" },
      { name: "List Dokter", href: "/doctors", icon: UserRound, resource: "doctors" },
      { name: "Jadwal Cuti", href: "/leaves", icon: Umbrella, resource: "leaves" },
    ]
  },
  {
    id: "ai",
    title: "Sistem & Otomatisasi",
    icon: Bot,
    items: [
      { name: "Otomatisasi", href: "/automation", icon: Cpu, resource: "automation" },
      { name: "FAKT-Bot", href: "/broadcast", icon: MessageSquare, resource: "automation" },
      { name: "Bot Studio", href: "/bot-studio", icon: BrainCircuit, resource: "automation" },
    ]
  },
  {
    id: "layar",
    title: "Layar & Publikasi",
    icon: Tv,
    items: [
      { name: "Portal Publik (Admin)", href: "/portal-manager", icon: Globe, resource: "settings" },
      { name: "Portal Publik (Landing)", href: "/publik", icon: Sparkles, external: true, resource: "display_tv" },
      { name: "Layar TV Lama", href: "/tv.html", icon: MonitorPlay, external: true, resource: "display_tv" },
    ]
  },
  {
    id: "admin",
    title: "Administrator",
    icon: Shield,
    items: [
      { name: "Manajemen Akses", href: "/settings/access", icon: Key, resource: "access" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, canRead, isSuperAdmin, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    operasional: true,
    sdm: true
  });

  const effectivelyCollapsed = isCollapsed && !isPeeking;

  const handleLogout = async () => {
    await logout();
  };

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLinkClick = () => {
    if (isPeeking) {
      setIsPeeking(false);
    }
  };

  const renderSubItem = (item: any) => {
    if (!isSuperAdmin && item.resource && !canRead(item.resource)) return null;

    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
      
    const linkClassName = cn(
      "relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-xs font-bold transition-all duration-300 group/sub border",
      isActive
        ? "bg-indigo-50/80 text-indigo-700 shadow-sm border-indigo-200/50"
        : "hover:bg-slate-50 hover:text-slate-900 text-slate-500 border-transparent hover:border-slate-200/60"
    );

    const iconClassName = cn(
      "h-[16px] w-[16px] transition-all duration-300",
      isActive ? "text-indigo-600 drop-shadow-sm scale-110" : "text-slate-400 group-hover/sub:text-indigo-500"
    );

    const content = (
      <>
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
        <item.icon className={iconClassName} strokeWidth={isActive ? 2.5 : 2} />
        <span className="truncate whitespace-nowrap">{item.name}</span>
      </>
    );

    if (item.external) {
      return (
        <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName} onClick={handleLinkClick}>
          {content}
        </a>
      );
    }

    return (
      <Link key={item.name} href={item.href} className={linkClassName} onClick={handleLinkClick}>
        {content}
      </Link>
    );
  };

  const renderParentNode = (folder: typeof menuConfig[0]) => {
    // Check if any child is visible based on permissions
    const visibleItems = folder.items.filter(item => isSuperAdmin || !item.resource || canRead(item.resource));
    if (visibleItems.length === 0) return null;

    // Check if any child is active
    const hasActiveChild = visibleItems.some(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
    const isOpen = openMenus[folder.id];

    if (effectivelyCollapsed) {
      return (
        <div key={folder.id} className="relative flex justify-center py-2">
          <div 
            onClick={() => {
               setIsPeeking(true);
               setOpenMenus(prev => ({...prev, [folder.id]: true}));
            }}
            className={cn(
            "w-12 h-12 flex items-center justify-center rounded-[16px] transition-all cursor-pointer border relative z-20 group/peek",
            hasActiveChild 
              ? "bg-indigo-50/80 text-indigo-700 shadow-sm border-indigo-200/50" 
              : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent hover:border-slate-200/60"
          )}>
            <folder.icon className={cn("h-5 w-5 transition-transform", hasActiveChild ? "text-indigo-600 scale-110" : "")} strokeWidth={hasActiveChild ? 2.5 : 2} />
            
            {/* Tooltip Hover Murni */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl opacity-0 invisible group-hover/peek:opacity-100 group-hover/peek:visible transition-all whitespace-nowrap shadow-xl z-50 pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:right-full before:border-[6px] before:border-transparent before:border-r-slate-800">
               {folder.title}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={folder.id} className="flex flex-col mb-1">
        <button 
          onClick={() => toggleMenu(folder.id)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] transition-colors group/parent",
            hasActiveChild && !isOpen ? "bg-indigo-50/50" : "hover:bg-slate-50"
          )}
        >
          <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
            <folder.icon className={cn("h-[18px] w-[18px] flex-shrink-0", hasActiveChild ? "text-indigo-600" : "text-slate-400 group-hover/parent:text-slate-600")} strokeWidth={hasActiveChild ? 2.5 : 2} />
            <span className={cn("text-xs font-bold truncate", hasActiveChild ? "text-indigo-700" : "text-slate-600")}>{folder.title}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
        </button>

        {/* Accordion Content */}
        <div 
          className={cn(
            "grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden flex flex-col gap-0.5 relative pl-4 ml-3 border-l-2 border-slate-100/80">
            {visibleItems.map(renderSubItem)}
          </div>
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 relative">
        <div className={cn("flex items-center mb-8 mt-2 transition-all duration-500", effectivelyCollapsed ? "justify-center px-0" : "gap-3 px-3")}>
          <div className="h-11 w-11 flex items-center justify-center relative shrink-0">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full mix-blend-multiply" />
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-lg ring-1 ring-white/50 flex items-center justify-center relative z-10 transition-transform duration-500 hover:scale-105 hover:-rotate-3">
               <Activity size={24} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          {!effectivelyCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
              <h1 className="text-lg font-black tracking-tight text-slate-800 truncate">
                MedCore<span className="text-[10px] align-top text-indigo-500 font-black ml-0.5">26</span>
              </h1>
              <p className="text-[9px] text-indigo-600/80 font-bold uppercase tracking-widest truncate">Admin Console</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {menuConfig.map(renderParentNode)}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100/60 pb-1 relative z-20">
        <div className={cn(
          "flex items-center rounded-[24px] bg-white/50 backdrop-blur-md shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] transition-all duration-500 hover:bg-white/80 border border-white/80",
          effectivelyCollapsed ? "justify-center p-2 mx-auto w-fit" : "justify-between p-3"
        )}>
          <div className={cn("flex items-center min-w-0 px-1", effectivelyCollapsed ? "gap-0" : "gap-3 flex-1")}>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0 flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-white">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {!effectivelyCollapsed && (
              <div className="min-w-0 flex-1 whitespace-nowrap overflow-hidden">
                <p className="text-[13px] font-black text-slate-800 truncate leading-tight tracking-tight">{user?.name || "Memuat..."}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate tracking-wider mt-0.5">{user?.roleName || ""}</p>
              </div>
            )}
          </div>
          {!effectivelyCollapsed && (
            <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[16px] transition-all flex-shrink-0 hover:shadow-sm" title="Logout">
              <LogOut size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {isPeeking && (
        <div className="fixed inset-0 z-[15]" onClick={() => setIsPeeking(false)} />
      )}
      
      <div className={cn(
        "hidden lg:flex h-[calc(100vh-2rem)] my-4 ml-4 flex-col justify-between bg-white/40 backdrop-blur-[40px] rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] ring-1 ring-white/60 z-20 relative flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        effectivelyCollapsed ? "w-[88px] p-4 items-center" : "w-72 p-5 hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)] hover:bg-white/50",
        isPeeking ? "shadow-[0_20px_60px_rgba(0,0,0,0.1)] ring-indigo-500/20" : ""
      )}>
        {/* Toggle Button */}
        <button 
          onClick={() => { 
            if (isPeeking) {
               setIsPeeking(false);
               setIsCollapsed(false);
            } else {
               setIsCollapsed(!isCollapsed);
            }
          }}
          className="absolute -right-3 top-20 h-7 w-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 transition-all duration-300 z-50 text-slate-400 hover:text-indigo-600 focus:outline-none"
        >
          {effectivelyCollapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
        </button>

        {sidebarContent}
      </div>
    </>
  );
}
