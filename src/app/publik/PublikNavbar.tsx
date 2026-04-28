'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Stethoscope, Building2, Users, ArrowRight, Menu, X, Sparkles, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/publik', label: 'Beranda', icon: Sparkles },
  { href: '/publik/dokter', label: 'Direktori Dokter', icon: Users },
  { href: '/publik/fasilitas', label: 'Fasilitas', icon: Building2 },
];

export default function PublikNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('publik-theme') as 'light' | 'dark' | null;
    if (saved) setTheme(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('publik-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={cn(
        "fixed top-0 w-full z-[60] transition-all duration-500",
        scrolled
          ? "bg-white/70 dark:bg-zinc-950/70 backdrop-blur-3xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border-b border-white/50 dark:border-zinc-800/50"
          : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between">

          {/* LOGO */}
          <Link href="/publik" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-white dark:bg-zinc-900 rounded-[14px] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-zinc-200/60 dark:border-zinc-700/60 overflow-hidden">
              <Stethoscope size={22} className="text-emerald-500" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-zinc-900 dark:text-white tracking-tight text-[17px]">SIAGA MEDIKA</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] tracking-widest uppercase">Purbalingga</span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-full px-2 py-2 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/publik' && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}>
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              className="w-9 h-9 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:scale-105 transition-transform shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <Link href="/login" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-900 font-bold text-[13px] rounded-full hover:scale-105 transition-all shadow-sm hover:shadow-md">
              Admin <ArrowRight size={14} />
            </Link>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <div className={cn(
        "fixed inset-0 z-[100] transition-all duration-500 md:hidden",
        mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div className={cn(
          "absolute right-0 top-0 bottom-0 w-[75vw] max-w-sm bg-white dark:bg-zinc-950 shadow-2xl flex flex-col p-6 border-l border-zinc-200 dark:border-zinc-800 transition-transform duration-500",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="flex justify-between items-center mb-10">
            <span className="font-black text-lg text-zinc-900 dark:text-white">Menu</span>
            <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <X size={16} className="text-zinc-500" />
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/publik' && pathname.startsWith(href));
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-base transition-all",
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}>
                  <Icon size={18} /> {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto">
            <Link href="/login" className="flex items-center justify-between bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-900 px-5 py-3.5 rounded-2xl font-bold shadow-lg">
              Akses Admin <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
