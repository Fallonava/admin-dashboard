"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { menuConfig } from "@/components/layouts/Sidebar";

// Color mapping for 3D clay icons
const categoryIconClay: Record<string, string> = {
  operasional: "clay-icon-blue",
  sdm: "clay-icon-indigo",
  ai: "clay-icon-violet",
  layar: "clay-icon-cyan",
  admin: "clay-icon-rose",
};

export function MobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, canRead, isSuperAdmin, logout } = useAuth();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setIsClosing(false);
      setIsOpen(true);
    };
    window.addEventListener("open-mobile-menu", handleOpen);
    return () => window.removeEventListener("open-mobile-menu", handleOpen);
  }, []);

  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  };

  useEffect(() => {
    if (isOpen) closeMenu();
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[150] flex flex-col justify-end">
      {/* Backdrop overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={closeMenu}
      />

      {/* Bottom Sheet Modal */}
      <div
        className={cn(
          "relative w-full clay-surface rounded-t-[34px] shadow-2xl flex flex-col max-h-[82vh] transition-transform duration-250 ease-out",
          isClosing ? "translate-y-full" : "translate-y-0"
        )}
      >
        {/* Grab Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-ns-resize" onClick={closeMenu}>
          <div className="w-10 h-1.5 clay-inset rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 pt-1 shrink-0 flex items-center justify-between border-b border-zinc-200/60 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="clay-icon-blue h-9 w-9 rounded-[12px] flex items-center justify-center text-white shrink-0">
              <span className="font-black text-xs relative z-10">S26</span>
            </div>
            <div>
              <h2 className="text-[15px] font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                Menu Utama
              </h2>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-bold">
                Pilih modul navigasi SIMED
              </p>
            </div>
          </div>
          <button
            onClick={closeMenu}
            aria-label="Tutup menu"
            className="p-2 clay-button rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all active:scale-90"
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        {/* Direct Grid Navigation (No Confusing Accordions) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar pb-24">
          {menuConfig.map((group) => {
            const visibleItems = group.items.filter(
              (item) => isSuperAdmin || !item.resource || canRead(item.resource)
            );
            if (visibleItems.length === 0) return null;

            const iconClayClass = categoryIconClay[group.id] || "clay-icon-blue";

            return (
              <div key={group.id} className="space-y-1.5">
                {/* Group Title */}
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2">
                  {group.title}
                </p>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    const itemContent = (
                      <div
                        className={cn(
                          "flex items-center justify-between p-3 rounded-[18px] transition-all w-full active:scale-[0.97]",
                          isActive
                            ? "clay-pill-blue text-white shadow-md"
                            : "clay-button text-zinc-800 dark:text-zinc-200"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-[12px] flex items-center justify-center text-white shrink-0 shadow-sm",
                              isActive ? "bg-white/25" : iconClayClass
                            )}
                          >
                            <Icon size={18} strokeWidth={2.5} className="relative z-10" />
                          </div>
                          <span className="text-[13px] font-black tracking-tight truncate">
                            {item.name}
                          </span>
                        </div>

                        {item.external ? (
                          <ExternalLink
                            size={14}
                            className={cn(
                              "shrink-0 mr-1",
                              isActive ? "text-white/80" : "text-zinc-400"
                            )}
                          />
                        ) : (
                          <ChevronRight
                            size={16}
                            strokeWidth={2.5}
                            className={cn(
                              "shrink-0 mr-1",
                              isActive ? "text-white/80" : "text-zinc-400"
                            )}
                          />
                        )}
                      </div>
                    );

                    if (item.external) {
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {itemContent}
                        </a>
                      );
                    }

                    return (
                      <Link key={item.name} href={item.href} className="block">
                        {itemContent}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Status Bar & Logout */}
        <div className="p-3 shrink-0 border-t border-zinc-200/60 dark:border-white/5 bg-transparent">
          <div className="flex clay-surface p-2.5 rounded-[22px] items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5 min-w-0 px-1">
              <div className="h-9 w-9 rounded-full clay-pill-blue shrink-0 flex items-center justify-center text-white font-black text-xs shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate">
                  {user?.name || "Petugas SIMED"}
                </p>
                <p className="text-[9.5px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider truncate">
                  {user?.roleName || "User"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 clay-pill-rose text-white rounded-[14px] transition-all flex items-center gap-1.5 px-3 font-black text-xs active:scale-95 shadow-sm"
            >
              <LogOut size={13} strokeWidth={2.5} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

