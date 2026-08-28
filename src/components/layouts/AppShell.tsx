"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layouts/Sidebar";
import { BottomNav } from "@/components/layouts/BottomNav";
import { MobileMenu } from "@/components/layouts/MobileMenu";
import { AutomationRunner } from "@/components/AutomationRunner";

const STANDALONE_ROUTES = ["/login", "/jadwal", "/tv", "/mobile", "/display"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_ROUTES.some((route) => pathname.startsWith(route));

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <AutomationRunner />
      <div className="flex h-screen h-[100dvh] bg-[#F4F4F6] dark:bg-[#0B0D13] text-zinc-900 dark:text-zinc-100 overflow-hidden relative selection:bg-blue-500/30">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all font-bold"
        >
          Lewati ke konten utama
        </a>
        <Sidebar />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto relative bg-[#F4F4F6] dark:bg-[#0B0D13] focus:outline-none"
          tabIndex={-1}
        >
          <div className="page-enter">{children}</div>
        </main>
        <BottomNav />
        <MobileMenu />
      </div>
    </>
  );
}
