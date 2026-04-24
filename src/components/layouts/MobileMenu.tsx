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
      "flex items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-[13px] font-bold transition-all duration-300 w-full active:scale-[0.98] min-h-[44px]",
      isActive
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
        : "bg-slate-50 text-slate-700 border border-slate-100/60 hover:bg-slate-100"
    );

    const content = (
      <>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-[10px] flex items-center justify-center",
            isActive ? "bg-white/20 text-white" : "bg-white border border-slate-200 text-blue-600 shadow-sm"
          )}>
            <item.icon className="h-4 w-4" />
          </div>
          <span>{item.name}</span>
        </div>
        <ChevronRight className={cn("h-4 w-4", isActive ? "text-blue-200" : "text-slate-300")} />
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
          className="w-full flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-100"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <folder.icon className="h-[14px] w-[14px]" />
            <h2 className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{folder.title}</h2>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-slate-300 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
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
            "absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500",
            isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={closeMenu}
      />

      {/* Bottom Sheet */}
      <div className={cn(
        "relative w-full bg-white rounded-t-[32px] sm:rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col h-[85vh] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isClosing ? "translate-y-full" : "translate-y-0"
      )}>
        {/* Grab Handle */}
        <div className="flex justify-center pt-4 pb-2 shrink-0 cursor-ns-resize" onClick={closeMenu}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header Title */}
        <div className="px-6 pb-4 shrink-0 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[14px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
                    <Activity size={20} />
                </div>
                <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">Menu Utama</h1>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">Navigasi Sistem MedCore</p>
                </div>
            </div>
            <button 
                onClick={closeMenu}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar pb-32">
            <div className="space-y-2">
                {menuConfig.map(renderParentNode)}
            </div>
        </div>

        {/* Sticky Utility / Logout Header at bottom */}
        <div className="p-6 shrink-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 absolute bottom-0 left-0 right-0">
            <div className="flex bg-slate-50 border border-slate-200 p-3 rounded-[24px] items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 px-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 pr-2">
                        <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.name || "Memuat..."}</p>
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider truncate mt-0.5">{user?.roleName || ""}</p>
                    </div>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="p-3 bg-white border border-slate-200 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full shadow-sm transition-all flex-shrink-0 flex items-center gap-2 pr-4 font-bold text-xs"
                >
                    <LogOut size={16} /> <span className="hidden sm:inline">Keluar</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
