import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested for modern look
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";

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
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <AutomationRunner />
            <div className="flex h-screen bg-background overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-8 relative">
                {/* Background ambient glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/10 dark:bg-blue-900/20 blur-3xl pointer-events-none -z-10" />
                {children}
              </main>
            </div>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
