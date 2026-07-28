'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Stethoscope, Users, PhoneCall, Menu, X, ArrowRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '#keseluruhan-jadwal', label: 'Jadwal Dokter', icon: Users },
];

export default function PublikNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (pathname === '/publik') {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* ── FLOATING DYNAMIC PILL & SCROLLED COMMAND DOCK NAVBAR ── */}
      <header
        className={cn(
          "fixed z-[60] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/90 backdrop-blur-3xl border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden",
          scrolled
            ? "top-3 left-1/2 -translate-x-1/2 w-[95vw] max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3 rounded-[32px]"
            : "top-5 left-1/2 -translate-x-1/2 w-[94vw] max-w-4xl px-5 py-3 rounded-full"
        )}
      >
        {!scrolled ? (
          /* ── UNSCROLLED STATE: HORIZONTAL FLOATING PILL ── */
          <div className="flex items-center justify-between gap-4">
            <Link href="/publik" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#007AFF] text-white group-hover:-translate-y-0.5 transition-transform duration-500 shadow-md shadow-[#007AFF]/25">
                <Stethoscope size={20} />
              </div>
              <div className="flex items-center gap-2 leading-none">
                <span className="font-black tracking-tight text-slate-900 text-lg">
                  Siaga Medika
                  <span className="text-[#007AFF]">.</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/30 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" /> Live 24/7
                </span>
              </div>
            </Link>

            {/* DESKTOP NAV ITEMS */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 px-3 py-1 rounded-full border border-slate-200/60 animate-in fade-in duration-300">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => handleNavClick(e, href)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-extrabold text-slate-700 hover:text-[#007AFF] hover:bg-white transition-all duration-300 cursor-pointer"
                >
                  <Icon size={14} className="text-[#007AFF]" />
                  {label}
                </a>
              ))}
            </nav>

            {/* RIGHT ACTIONS: IGD EMERGENCY BUTTON */}
            <div className="flex items-center gap-2 shrink-0 animate-in fade-in duration-300">
              <a
                href="tel:0281895111"
                className="hidden sm:inline-flex items-center gap-2 bg-[#34C759] hover:bg-[#28A745] text-white font-black rounded-full px-4.5 py-2 text-xs transition-all duration-300 shadow-md shadow-[#34C759]/30 hover:scale-105 active:scale-95"
              >
                <PhoneCall size={14} />
                IGD 24 Jam
              </a>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden w-9 h-9 rounded-full bg-[#E5E5EA] hover:bg-[#D1D1D6] text-slate-900 shadow-xs border border-slate-300/50 flex items-center justify-center active:scale-95 transition-all"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* ── SCROLLED STATE: FLOATING COMMAND CONTROL DOCK ── */
          <div className="flex items-center justify-between gap-3 sm:gap-4 animate-in fade-in duration-300">
            {/* Brand Logo & Live Badge */}
            <Link href="/publik" className="flex items-center gap-2 group shrink-0">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-[#007AFF] text-white shadow-sm">
                <Stethoscope size={18} />
              </div>
              <span className="hidden xl:inline-block font-black tracking-tight text-slate-900 text-base">
                Siaga Medika<span className="text-[#007AFF]">.</span>
              </span>
            </Link>

            {/* Compact Search & Navigation Dock Bar */}
            <a
              href="#keseluruhan-jadwal"
              onClick={(e) => handleNavClick(e, '#keseluruhan-jadwal')}
              className="flex-1 max-w-xl flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#E5E5EA]/80 hover:bg-[#E5E5EA] border border-slate-300/60 transition-all duration-300 text-slate-600 hover:text-slate-900 cursor-pointer shadow-inner"
            >
              <Users size={16} className="text-[#007AFF] shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold truncate">
                Direktori & Cari Dokter Spesialis...
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 ml-auto text-[11px] font-black bg-[#007AFF] text-white px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                Cari <ArrowRight size={11} />
              </span>
            </a>

            {/* Right Action: IGD Emergency */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="tel:0281895111"
                className="inline-flex items-center gap-1.5 bg-[#34C759] hover:bg-[#28A745] text-white font-black rounded-2xl px-3.5 py-2 text-xs transition-all duration-300 shadow-md shadow-[#34C759]/25 hover:scale-105 active:scale-95"
              >
                <PhoneCall size={13} />
                <span className="hidden sm:inline">IGD 24 Jam</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* MOBILE DRAWER */}
      <div
        className={cn(
          "fixed inset-0 z-[100] transition-all duration-500 md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-[80vw] max-w-sm bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col p-8 transition-transform duration-500 rounded-l-[40px] border-l border-purple-100",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex justify-between items-center mb-12">
            <span className="font-black text-xl text-slate-900">Menu Navigation</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          <nav className="flex flex-col gap-3">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => {
                  setMobileOpen(false);
                  handleNavClick(e, href);
                }}
                className="flex items-center gap-4 px-5 py-4 rounded-3xl font-extrabold text-base text-slate-700 bg-purple-50/50 hover:bg-purple-100/60 transition-all"
              >
                <Icon size={18} className="text-[#A78BFA]" /> {label}
              </a>
            ))}
          </nav>
          <div className="mt-auto">
            <a
              href="tel:0281895111"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-full font-black shadow-[0_10px_25px_rgba(16,185,129,0.35)] w-full text-base"
            >
              <PhoneCall size={18} /> Panggil IGD 24 Jam
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
