import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested for modern look
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

import { SWRProvider } from "@/components/swr-provider";
import { AutomationRunner } from "@/components/AutomationRunner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedCore26 Admin",
  description: "Advanced Hospital Administration System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Low-end device detection — runs before paint to avoid FOUC */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            try {
              var ua = navigator.userAgent || '';
              var isTV = /WebOS|Tizen|SMART-TV|SmartTV|NetCast|BRAVIA|Viera/i.test(ua);
              var lowMem = navigator.deviceMemory && navigator.deviceMemory <= 2;
              var lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
              if (isTV || lowMem || (lowCPU && lowMem !== false)) {
                document.documentElement.classList.add('reduce-effects');
              }
            } catch(e){}
          })();
        `}} />
      </head>
      <body className={inter.className}>
        <SWRProvider>
          <AutomationRunner />
          <div className="flex h-screen bg-background overflow-hidden relative">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-2 lg:pt-8 relative bg-white/50">
              {children}
            </main>
          </div>
        </SWRProvider>
      </body>
    </html>
  );
}
