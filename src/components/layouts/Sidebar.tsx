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
      { name: "Kontrol Status", href: "/", icon: Zap, resource: "kontrol_status" },
    ]
  },
  {
    id: "sdm",
    title: "Manajemen SDM",
    icon: Users,
    items: [
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
    ]
  },
  {
    id: "layar",
    title: "Layar & Publikasi",
    icon: Tv,
    items: [
      { name: "Layar Smart TV", href: "/tv.html", icon: MonitorPlay, external: true, resource: "display_tv" },
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
      "relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-xs font-bold transition-all duration-200 group/sub border",
      isActive
        ? "bg-zinc-100 text-zinc-900 shadow-sm border-zinc-200 dark:bg-[#1A1E2B] dark:text-zinc-100 dark:border-[#2B3145]"
        : "hover:bg-zinc-100 hover:text-zinc-900 text-zinc-600 border-transparent dark:hover:bg-[#151822] dark:hover:text-zinc-100 dark:text-zinc-400"
    );

    const iconClassName = cn(
      "h-[16px] w-[16px] transition-all duration-200",
      isActive ? "text-blue-600 dark:text-blue-400 scale-110" : "text-zinc-400 group-hover/sub:text-blue-600 dark:text-zinc-500 dark:group-hover/sub:text-blue-400"
    );

    const content = (
      <>
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
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
    const visibleItems = folder.items.filter(item => isSuperAdmin || !item.resource || canRead(item.resource));
    if (visibleItems.length === 0) return null;

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
            "w-12 h-12 flex items-center justify-center rounded-[14px] transition-all cursor-pointer border relative z-20 group/peek",
            hasActiveChild 
              ? "bg-zinc-100 text-zinc-900 shadow-sm border-zinc-200 dark:bg-[#1A1E2B] dark:text-zinc-100 dark:border-[#2B3145]" 
              : "bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 border-transparent dark:text-zinc-400 dark:hover:bg-[#151822] dark:hover:text-zinc-100"
          )}>
            <folder.icon className={cn("h-5 w-5 transition-transform", hasActiveChild ? "text-blue-600 dark:text-blue-400 scale-110" : "")} strokeWidth={hasActiveChild ? 2.5 : 2} />
            
            {/* Tooltip Hover Murni */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 text-white border border-zinc-800 dark:bg-[#1A1E2B] dark:border-[#2B3145] dark:text-zinc-100 text-xs font-bold rounded-xl opacity-0 invisible group-hover/peek:opacity-100 group-hover/peek:visible transition-all whitespace-nowrap shadow-xl z-50 pointer-events-none">
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
            hasActiveChild && !isOpen ? "bg-zinc-100/70 dark:bg-[#1A1E2B]/50" : "hover:bg-zinc-100 dark:hover:bg-[#151822]"
          )}
        >
          <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
            <folder.icon className={cn("h-[18px] w-[18px] flex-shrink-0", hasActiveChild ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 group-hover/parent:text-zinc-700 dark:text-zinc-500 dark:group-hover/parent:text-zinc-300")} strokeWidth={hasActiveChild ? 2.5 : 2} />
            <span className={cn("text-xs font-bold truncate", hasActiveChild ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400")}>{folder.title}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
        </button>

        {/* Accordion Content */}
        <div 
          className={cn(
            "grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden flex flex-col gap-0.5 relative pl-4 ml-3 border-l border-zinc-200 dark:border-[#222738]">
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
          <div className="h-10 w-10 flex items-center justify-center relative shrink-0">
            <div className="w-full h-full bg-blue-600 rounded-xl shadow-sm border border-blue-400/30 flex items-center justify-center relative z-10">
               <Activity size={22} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          {!effectivelyCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
              <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                MedCore<span className="text-[10px] align-top text-blue-600 dark:text-blue-400 font-black ml-0.5">26</span>
              </h1>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest truncate">Admin Console</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {menuConfig.map(renderParentNode)}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-[#1E2230] pb-1 relative z-20">
        <div className={cn(
          "flex items-center rounded-[18px] bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-[#222738] shadow-sm transition-all duration-200",
          effectivelyCollapsed ? "justify-center p-2 mx-auto w-fit" : "justify-between p-3"
        )}>
          <div className={cn("flex items-center min-w-0 px-1", effectivelyCollapsed ? "gap-0" : "gap-3 flex-1")}>
            <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-[#1F2433] border border-zinc-300 dark:border-[#2E354B] flex-shrink-0 flex items-center justify-center text-zinc-800 dark:text-zinc-100 font-black text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {!effectivelyCollapsed && (
              <div className="min-w-0 flex-1 whitespace-nowrap overflow-hidden">
                <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100 truncate leading-tight tracking-tight">{user?.name || "Memuat..."}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase truncate tracking-wider mt-0.5">{user?.roleName || ""}</p>
              </div>
            )}
          </div>
          {!effectivelyCollapsed && (
            <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-[12px] transition-all flex-shrink-0" title="Logout">
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
        "hidden lg:flex h-[calc(100vh-2rem)] my-4 ml-4 flex-col justify-between bg-white dark:bg-[#10121A] rounded-[24px] border border-zinc-200 dark:border-[#1E2230] shadow-sm z-20 relative flex-shrink-0 transition-all duration-300",
        effectivelyCollapsed ? "w-[80px] p-3 items-center" : "w-68 p-4",
        isPeeking ? "shadow-2xl border-zinc-300 dark:border-[#2E354B]" : ""
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
          className="absolute -right-3 top-16 h-6 w-6 bg-white dark:bg-[#161924] border border-zinc-200 dark:border-[#2B3145] rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-all duration-200 z-50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none"
        >
          {effectivelyCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
        </button>

        {sidebarContent}
      </div>
    </>
  );
}
