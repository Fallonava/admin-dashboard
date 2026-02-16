"use client";

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
  Tv
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Schedules", href: "/schedules", icon: Calendar },
  { name: "Doctors", href: "/doctors", icon: Users },
  { name: "Leave Schedule", href: "/leaves", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const systems = [
  { name: "Automation", href: "/automation", icon: Bot },
  { name: "Infrastructure", href: "/infrastructure", icon: Server },
  { name: "Live Display", href: "/tv.html", icon: Tv, external: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col justify-between glass-panel border-r border-border p-4 transition-colors duration-300">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "hover:bg-muted hover:text-foreground text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Systems</p>
        </div>
        <nav className="space-y-1">
          {systems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "hover:bg-muted hover:text-foreground text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-border pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted border border-border"></div>
            <div>
              <p className="text-sm font-medium">Dr. Admin</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
