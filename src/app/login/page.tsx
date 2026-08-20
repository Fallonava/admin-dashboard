"use client";

import { useState } from "react";
import {
  Activity,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await login(username.trim(), password);
      if (!result.success) {
        setError(result.error || "Username atau password tidak valid.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-[#EDF2F8] via-[#F4F7FB] to-[#E2EAF4] dark:from-[#090B10] dark:via-[#0E121C] dark:to-[#0A0D15] text-zinc-900 dark:text-zinc-100 selection:bg-blue-500/25 selection:text-white transition-colors duration-300">
      
      {/* ─── Ambient Glow Mesh Orbs (Layered 3D Depth) ─── */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-96 h-96 sm:w-[540px] sm:h-[540px] rounded-full bg-blue-500/15 dark:bg-blue-600/20 blur-[100px] sm:blur-[140px] pointer-events-none animate-pulse"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-32 w-96 h-96 sm:w-[560px] sm:h-[560px] rounded-full bg-indigo-500/15 dark:bg-indigo-600/20 blur-[100px] sm:blur-[140px] pointer-events-none animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-[420px] sm:h-[420px] rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-[80px] sm:blur-[110px] pointer-events-none"
      />

      {/* ─── Subtle Geometric Grid Texture ─── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] dark:bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.07] dark:opacity-[0.09] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)] pointer-events-none"
      />

      {/* ─── Top Floating Utility Bar (Theme Switcher) ─── */}
      <header className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-3">
        <ThemeToggle className="shadow-md hover:shadow-lg transition-transform active:scale-95" />
      </header>

      {/* ─── Main Login Container ─── */}
      <main className="relative z-10 w-full max-w-[430px] my-auto">
        <div className="clay-surface rounded-[32px] sm:rounded-[36px] p-6 sm:p-9 shadow-2xl transition-all duration-300">
          
          {/* ─── Brand & Header Section ─── */}
          <div className="flex flex-col items-center text-center mb-7">
            {/* 3D Clay Icon Pill */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 clay-icon-blue rounded-2xl sm:rounded-[20px] mb-4 shadow-lg shadow-blue-500/25 flex items-center justify-center group cursor-default transition-transform duration-300 hover:scale-105">
              <Activity
                size={28}
                className="text-white drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                strokeWidth={2.4}
              />
            </div>

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-2.5">
              <Sparkles size={12} />
              <span>Portal Manajemen Medis</span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              SIMED<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">26</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px]">
              Masuk untuk mengelola operasional dan jadwal klinik secara terpadu
            </p>
          </div>

          {/* ─── Login Form ─── */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            
            {/* Username Input Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 ml-1"
              >
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-200">
                  <User size={18} strokeWidth={2.2} />
                </div>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Masukkan username akun"
                  disabled={loading}
                  autoComplete="username"
                  autoFocus
                  required
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 clay-inset rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-semibold text-xs sm:text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Input Field with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-200">
                  <Lock size={18} strokeWidth={2.2} />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Masukkan kata sandi"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-11 py-3 sm:py-3.5 clay-inset rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-semibold text-xs sm:text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 focus:outline-none transition-colors duration-200 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={2.2} className="transition-transform active:scale-90" />
                  ) : (
                    <Eye size={18} strokeWidth={2.2} className="transition-transform active:scale-90" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className={cn(
                  "w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black text-white clay-pill-blue flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 cursor-pointer transition-all duration-200",
                  "hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                )}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <LockKeyhole size={16} className="text-white/90" />
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight size={15} className="text-white/90 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ─── Security Footer Badges ─── */}
          <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              Sistem Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-blue-500 shrink-0" />
              TLS 256-Bit
            </span>
          </div>
        </div>

        {/* ─── Bottom Support & Version Footer ─── */}
        <div className="text-center mt-5 space-y-1.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Mengalami kendala login?{" "}
            <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
              Hubungi Administrator
            </span>
          </p>
          <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-600 tracking-wider">
            SIMED26 • Hospital Management System v2.6.0
          </p>
        </div>
      </main>
    </div>
  );
}
