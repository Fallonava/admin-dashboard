"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut, Activity, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { menuConfig } from "@/components/layouts/Sidebar";

export function MobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, canRead, isSuperAdmin, logout } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  
  // By default, open all menus in mobile for easy access, or just let them behave as lists.
  // Actually, since mobile is vertical, accordions work well. Let's start with all open.
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const defaultOpen: Record<string, boolean> = {};
    menuConfig.forEach(m => defaultOpen[m.id] = true);
    return defaultOpen;
  });

  useEffect(() => {
    const handleOpen = () => {
      setIsClosing(false);
      setIsOpen(true);
    };
    window.addEventListener('open-mobile-menu', handleOpen);
    return () => window.removeEventListener('open-mobile-menu', handleOpen);
  }, []);

  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300); // Matches the animation duration
  };

  useEffect(() => {
    if (isOpen) {
      closeMenu();
    }
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSubItem = (item: any) => {
    if (!isSuperAdmin && item.resource && !canRead(item.resource)) return null;

    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
      
    const linkClassName = cn(
      "flex items-center justify-between gap-3 rounded-[14px] px-4 py-3 text-[13px] font-bold transition-all w-full active:scale-[0.98] min-h-[44px] border",
      isActive
        ? "bg-blue-600 text-white border-blue-500 shadow-sm"
        : "bg-zinc-50 dark:bg-[#161924] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#232736] hover:bg-zinc-100 dark:hover:bg-[#1A1E2B]"
    );

    const content = (
      <>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-[8px] flex items-center justify-center",
            isActive ? "bg-white/20 text-white" : "bg-white dark:bg-[#131620] border border-zinc-200 dark:border-[#232736] text-blue-600 dark:text-blue-400"
          )}>
            <item.icon className="h-4 w-4" />
          </div>
          <span>{item.name}</span>
        </div>
        <ChevronRight className={cn("h-4 w-4", isActive ? "text-white/70" : "text-zinc-400 dark:text-zinc-500")} />
      </>
    );

    if (item.external) {
      return (
        <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
            {content}
        </a>
      );
    }

    return (
      <Link key={item.name} href={item.href} className={linkClassName}>
          {content}
      </Link>
    );
  };

  const renderParentNode = (folder: typeof menuConfig[0]) => {
    const visibleItems = folder.items.filter(item => isSuperAdmin || !item.resource || canRead(item.resource));
    if (visibleItems.length === 0) return null;

    const isOpen = openMenus[folder.id];

    return (
      <div key={folder.id} className="mb-4">
        <button 
          onClick={() => toggleMenu(folder.id)}
          className="w-full flex items-center justify-between px-2 pb-2.5 mb-2 border-b border-zinc-200 dark:border-[#1E2230]"
        >
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <folder.icon className="h-[14px] w-[14px]" />
            <h2 className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{folder.title}</h2>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
        </button>

        <div className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden">
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {visibleItems.map(renderSubItem)}
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[150] flex flex-col justify-end">
      {/* Backdrop overlay */}
      <div 
        className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-300",
            isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={closeMenu}
      />

      {/* Bottom Sheet */}
      <div className={cn(
        "relative w-full bg-white dark:bg-[#131620] border-t border-zinc-200 dark:border-[#232736] rounded-t-[28px] shadow-2xl flex flex-col h-[85vh] transition-transform duration-300 ease-out",
        isClosing ? "translate-y-full" : "translate-y-0"
      )}>
        {/* Grab Handle */}
        <div className="flex justify-center pt-4 pb-2 shrink-0 cursor-ns-resize" onClick={closeMenu}>
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Header Title */}
        <div className="px-6 pb-4 shrink-0 flex items-center justify-between border-b border-zinc-200 dark:border-[#1E2230]">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                    <Activity size={20} />
                </div>
                <div>
                    <h1 className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">Menu Utama</h1>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">Navigasi Sistem MedCore</p>
                </div>
            </div>
            <button 
                onClick={closeMenu}
                className="p-2 bg-zinc-100 dark:bg-[#1A1E2B] border border-zinc-200 dark:border-[#2B3145] hover:bg-zinc-200 dark:hover:bg-[#23283A] rounded-full text-zinc-500 dark:text-zinc-400 transition-colors"
            >
                <X size={18} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar pb-32">
            <div className="space-y-2">
                {menuConfig.map(renderParentNode)}
            </div>
        </div>

        {/* Sticky Utility / Logout Header at bottom */}
        <div className="p-5 shrink-0 bg-white dark:bg-[#131620] border-t border-zinc-200 dark:border-[#1E2230] absolute bottom-0 left-0 right-0">
            <div className="flex bg-zinc-50 dark:bg-[#161924] border border-zinc-200 dark:border-[#2B3145] p-3 rounded-[18px] items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 px-1">
                    <div className="h-9 w-9 rounded-full bg-blue-600 dark:bg-[#23283A] border border-blue-500 dark:border-[#353C54] flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 pr-2">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{user?.name || "Memuat..."}</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider truncate mt-0.5">{user?.roleName || ""}</p>
                    </div>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl transition-all flex-shrink-0 flex items-center gap-2 pr-3 font-bold text-xs"
                >
                    <LogOut size={15} /> <span className="hidden sm:inline">Keluar</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
