"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { MobileMenu } from "@/components/MobileMenu";
import { AutomationRunner } from "@/components/AutomationRunner";

const AUTH_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <AutomationRunner />
      <div className="flex h-screen bg-slate-50/50 overflow-hidden relative selection:bg-emerald-500/30">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all font-bold"
        >
          Lewati ke konten utama
        </a>
        <Sidebar />
        <main
          id="main-content"
          className="flex-1 overflow-hidden relative bg-white/5 focus:outline-none"
          tabIndex={-1}
        >
          <div className="page-enter h-full">{children}</div>
        </main>
        <BottomNav />
        <MobileMenu />
      </div>
    </>
  );
}
