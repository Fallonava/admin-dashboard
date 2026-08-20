"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Default to dark
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div className={cn("w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#141722] border border-zinc-200 dark:border-[#2B3145]", className)} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shrink-0",
        "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200",
        "dark:bg-[#141722] dark:hover:bg-[#1C2130] dark:text-zinc-300 dark:border-[#2B3145] dark:hover:border-[#3A425C]",
        className
      )}
      title={theme === "dark" ? "Ganti ke Mode Terang (Light)" : "Ganti ke Mode Gelap (Dark)"}
    >
      {theme === "dark" ? (
        <Sun size={15} className="text-amber-400" strokeWidth={2.5} />
      ) : (
        <Moon size={15} className="text-indigo-600" strokeWidth={2.5} />
      )}
    </button>
  );
}
