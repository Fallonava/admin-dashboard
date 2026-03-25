import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested for modern look

import "./globals.css";
import { OfflineSyncer } from "@/components/OfflineSyncer";

import { SWRProvider } from "@/components/swr-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedCore26 Admin | Premium Hospital System",
  description: "Advanced Hospital Administration System with Real-time Monitoring and Modern UI",
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
        {/* Low-end device detection — runs before paint to avoid FOUC */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            try {
              var ua = navigator.userAgent || '';
              // Smart TV / TV Browser
              var isTV = /WebOS|Tizen|SMART-TV|SmartTV|NetCast|BRAVIA|Viera/i.test(ua);
              // Memori rendah (≤4GB mencakup sebagian besar mid-range lemah)
              var lowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
              // CPU inti sedikit (≤4 core = low-to-mid)
              var lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
              // Koneksi lambat (2G/3G — device cenderung juga GPU lemah)
              var slowNet = false;
              try {
                var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (conn) slowNet = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
              } catch(e) {}
              // Aktifkan reduce-effects jika terdeteksi mid-range lemah
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
