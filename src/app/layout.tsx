import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested for modern look

import "./globals.css";
import { OfflineSyncer } from "@/components/OfflineSyncer";

import { SWRProvider } from "@/components/swr-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/layouts/AppShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: "SIMED26 | Sistem Informasi Manajemen Medis & TV Display",
  description: "Sistem Informasi Manajemen Jadwal Dokter, Cuti, dan Integrasi Smart TV Display Rumah Sakit",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Preconnect ke domain gambar untuk mempercepat LCP */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Theme & Low-end device detection — runs before paint to avoid FOUC */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            try {
              var theme = localStorage.getItem('theme');
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
              var ua = navigator.userAgent || '';
              var isTV = /WebOS|Tizen|SMART-TV|SmartTV|NetCast|BRAVIA|Viera/i.test(ua);
              var lowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
              var lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
              var slowNet = false;
              try {
                var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (conn) slowNet = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
              } catch(e) {}
              if (isTV || (lowMem && lowCPU) || slowNet) {
                document.documentElement.classList.add('reduce-effects');
              }
            } catch(e){}
          })();
        `}} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <OfflineSyncer />
        <ErrorBoundary name="Global Application Shell">
          <SWRProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </SWRProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
