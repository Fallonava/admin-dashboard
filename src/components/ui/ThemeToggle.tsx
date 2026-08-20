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
      <div className={cn("w-9 h-9 rounded-[16px] clay-button opacity-50", className)} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2.5 rounded-[16px] clay-button flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95",
        className
      )}
      title={theme === "dark" ? "Ganti ke Mode Terang (Light)" : "Ganti ke Mode Gelap (Dark)"}
    >
      {theme === "dark" ? (
        <Sun size={16} className="text-amber-400" strokeWidth={2.5} />
      ) : (
        <Moon size={16} className="text-indigo-600" strokeWidth={2.5} />
      )}
    </button>
  );
}
