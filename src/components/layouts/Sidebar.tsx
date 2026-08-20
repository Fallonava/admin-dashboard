"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Calendar,
  Users,
  Bot,
  Tv,
  Shield,
  LogOut,
  Zap,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Umbrella,
  Cpu,
  MonitorPlay,
  Key,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export interface MenuItem {
  name: string;
  href: string;
  icon: any;
  resource: string;
  external?: boolean;
}

export interface MenuGroup {
  id: string;
  title: string;
  icon: any;
  items: MenuItem[];
}

// ── Menu config — shared with MobileMenu ──────────────────────────────────────
export const menuConfig: MenuGroup[] = [
  {
    id: "operasional",
    title: "Operasional",
    icon: Activity,
    items: [
      { name: "Kontrol Status", href: "/", icon: Zap, resource: "kontrol_status" },
    ],
  },
  {
    id: "sdm",
    title: "SDM",
    icon: Users,
    items: [
      { name: "Jadwal Dokter",  href: "/schedules", icon: Calendar,  resource: "schedules" },
      { name: "List Dokter",    href: "/doctors",   icon: UserRound, resource: "doctors"   },
      { name: "Jadwal Cuti",   href: "/leaves",    icon: Umbrella,  resource: "leaves"    },
    ],
  },
  {
    id: "ai",
    title: "Otomatisasi",
    icon: Bot,
    items: [
      { name: "Otomatisasi", href: "/automation", icon: Cpu,          resource: "automation" },
      { name: "FAKT-Bot",    href: "/broadcast",  icon: MessageSquare, resource: "automation" },
    ],
  },
  {
    id: "layar",
    title: "Publikasi",
    icon: Tv,
    items: [
      { name: "Layar Smart TV", href: "/tv.html", icon: MonitorPlay, external: true, resource: "display_tv" },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    icon: Shield,
    items: [
      { name: "Manajemen Akses", href: "/settings/access", icon: Key, resource: "access" },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname  = usePathname();
  const { user, canRead, isSuperAdmin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const canSee = (resource?: string) =>
    isSuperAdmin || !resource || canRead(resource);

  // ── Collapsed icon-only rail ───────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="hidden lg:flex h-[calc(100vh-2rem)] my-4 ml-4 w-[72px] flex-col items-center clay-surface rounded-[28px] z-20 relative flex-shrink-0 py-4 gap-2">
        {/* Expand toggle */}
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-14 h-6 w-6 clay-button rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all hover:scale-110 z-50"
        >
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>

        {/* Logo */}
        <div className="clay-icon-blue w-10 h-10 rounded-[14px] flex items-center justify-center mb-4 shrink-0">
          <Activity size={20} className="text-white relative z-10" strokeWidth={2.5} />
        </div>

        {/* Nav icons */}
        <div className="flex flex-col gap-1 flex-1 w-full px-2">
          {menuConfig.map((group) => {
            const visibleItems = group.items.filter((i) => canSee(i.resource));
            if (visibleItems.length === 0) return null;

            return visibleItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              const inner = (
                <div
                  className={cn(
                    "group/icon relative w-full flex justify-center py-2.5 rounded-[14px] transition-all",
                    active
                      ? "clay-button text-blue-600 dark:text-blue-400"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-[#181d2a]"
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {/* Tooltip */}
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 dark:bg-[#1A1E2B] text-white text-[11px] font-semibold rounded-xl opacity-0 invisible group-hover/icon:opacity-100 group-hover/icon:visible whitespace-nowrap shadow-xl pointer-events-none transition-all z-50 border border-zinc-800 dark:border-[#2B3145]">
                    {item.name}
                  </span>
                </div>
              );

              return item.external ? (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <Link key={item.href} href={item.href}>
                  {inner}
                </Link>
              );
            });
          })}
        </div>

        {/* User avatar */}
        <div className="w-10 h-10 rounded-[14px] clay-button flex items-center justify-center text-zinc-800 dark:text-zinc-100 font-black text-sm shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      </div>
    );
  }

  // ── Expanded sidebar ───────────────────────────────────────────────────────
  return (
    <div className="hidden lg:flex h-[calc(100vh-2rem)] my-4 ml-4 w-[240px] flex-col clay-surface rounded-[28px] z-20 relative flex-shrink-0 p-4">
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(true)}
        className="absolute -right-3 top-14 h-6 w-6 clay-button rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all hover:scale-110 z-50"
      >
        <ChevronLeft size={13} strokeWidth={2.5} />
      </button>

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-1 mb-6">
        <div className="clay-icon-blue w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0">
          <Activity size={20} className="text-white relative z-10" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
            MedCore<span className="text-[9px] align-top text-blue-600 dark:text-blue-400 font-black ml-0.5">26</span>
          </h1>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-widest mt-0.5">
            Admin Console
          </p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar-hide space-y-5">
        {menuConfig.map((group) => {
          const visibleItems = group.items.filter((i) => canSee(i.resource));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id}>
              {/* Section label */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 mb-1.5">
                {group.title}
              </p>

              {/* Items */}
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  const linkClass = cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[13px] transition-all duration-150 group/item",
                    active
                      ? "clay-button font-semibold text-blue-600 dark:text-blue-400"
                      : "font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-[#181d2a] dark:hover:text-zinc-100"
                  );

                  const content = (
                    <>
                      {/* Active left pill */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                      )}
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.5 : 2}
                        className={cn(
                          "shrink-0 transition-colors",
                          active
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-zinc-400 dark:text-zinc-500 group-hover/item:text-zinc-700 dark:group-hover/item:text-zinc-300"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </>
                  );

                  return item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link key={item.href} href={item.href} className={linkClass}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="pt-4 border-t border-zinc-200 dark:border-[#1E2230]">
        <div className="flex items-center gap-3 px-1">
          {/* Avatar */}
          <div className="h-9 w-9 rounded-[12px] clay-icon-blue flex items-center justify-center text-white font-black text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>

          {/* Name + role */}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
              {user?.name || "Memuat..."}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5 font-medium">
              {user?.roleName || ""}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Logout"
            className="p-2 rounded-[10px] clay-button text-zinc-400 hover:text-rose-500 transition-all shrink-0"
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
