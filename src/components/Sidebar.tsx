"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserSquare2,
  BarChart3,
  Bot,
  Server,
  Settings,
  Activity,
  Tv,
  Menu,
  X,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Jadwal", href: "/schedules", icon: Calendar },
  { name: "Dokter", href: "/doctors", icon: Users },
  { name: "Jadwal Cuti", href: "/leaves", icon: Calendar },
  { name: "Analitik", href: "/analytics", icon: BarChart3 },
];

const systems = [
  { name: "Otomatisasi", href: "/automation", icon: Bot },
  { name: "Monitor Queue", href: "/automation/queue-monitor", icon: Zap },
  { name: "Kontrol Layar", href: "/display-control", icon: Settings },
  { name: "Layar Langsung", href: "/tv.html", icon: Tv, external: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div>
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">MedCore<span className="text-xs align-top text-primary">26</span></h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Admin Console</p>
          </div>
        </div>

        <nav className="space-y-1 mb-8">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "btn-gradient text-white shadow-[0_4px_14px_0_rgba(0,92,255,0.39)]"
                    : "hover:bg-black/[0.03] hover:text-foreground text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistem</p>
        </div>
        <nav className="space-y-1">
          {systems.map((item) => {
            const isActive = pathname === item.href;
            const linkClassName = cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
              isActive
                ? "btn-gradient text-white shadow-[0_4px_14px_0_rgba(0,92,255,0.39)]"
                : "hover:bg-black/[0.03] hover:text-foreground text-muted-foreground"
            );
            const iconClassName = cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground");

            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  <item.icon className={iconClassName} />
                  {item.name}
                </a>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={linkClassName}
              >
                <item.icon className={iconClassName} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted"></div>
            <div>
              <p className="text-sm font-medium">Dr. Admin</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ═══ MOBILE HAMBURGER BUTTON ═══ */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-2xl bg-white/80 backdrop-blur-xl shadow-md border border-white/50 text-slate-600 hover:text-slate-900 transition-all active:scale-95"
        aria-label="Buka menu"
      >
        <Menu size={22} />
      </button>

      {/* ═══ MOBILE OVERLAY ═══ */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═══ MOBILE SIDEBAR DRAWER ═══ */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col justify-between super-glass p-4 shadow-2xl transition-transform duration-300 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-all"
          aria-label="Tutup menu"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </div>

      {/* ═══ DESKTOP SIDEBAR (always visible) ═══ */}
      <div className="hidden lg:flex h-screen w-64 flex-col justify-between super-glass p-4 transition-colors duration-300 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.05)] z-20 relative flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
