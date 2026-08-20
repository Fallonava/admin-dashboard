import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested for modern look

import "./globals.css";
import { OfflineSyncer } from "@/components/OfflineSyncer";

import { SWRProvider } from "@/components/swr-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/layouts/AppShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import AiChatWidget from "@/features/assistant/components/AiChatWidget";

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
              <AiChatWidget />
            </AuthProvider>
          </SWRProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
