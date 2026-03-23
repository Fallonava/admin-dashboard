"use client";

import { useState } from "react";
import {
  Activity,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Zap,
  Users,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const features = [
  {
    icon: Zap,
    title: "Real-time Monitoring",
    desc: "Pantau status dokter & antrian langsung",
  },
  {
    icon: Users,
    title: "Manajemen Dokter",
    desc: "Kelola jadwal & profil seluruh dokter",
  },
  {
    icon: BarChart2,
    title: "Rekap & Analitik",
    desc: "Laporan harian otomatis & insight kinerja",
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError("");

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || "Username atau password salah.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex overflow-hidden font-sans">

      {/* ══════════════════════════════════════
          KIRI — BRANDING PANEL (desktop only)
          ══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">

        {/* Animated mesh orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[100px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[35%] left-[55%] w-[300px] h-[300px] rounded-full bg-violet-600/15 blur-[80px] animate-[pulse_7s_ease-in-out_infinite_2s]" />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 xl:p-16">

          {/* Top: Logo */}
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <Activity size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black text-xl tracking-tight">
              MedCore<span className="text-blue-400">26</span>
            </span>
          </div>

          {/* Middle: Hero text */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-8">
              <Sparkles size={12} className="text-blue-300" />
              <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">
                Dashboard Premium
              </span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-6">
              Sistem Manajemen{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                Klinik Terpadu
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-md mb-10">
              Kendali penuh atas operasional klinik dalam satu platform — real-time, otomatis, dan presisi.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {features.map((feat, i) => (
                <div
                  key={feat.title}
                  className="flex items-start gap-4 group animate-in fade-in slide-in-from-left-4 duration-500"
                  style={{ animationDelay: `${300 + i * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/12 group-hover:border-white/20 transition-all duration-300">
                    <feat.icon size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{feat.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating glass stat cards */}
            <div className="flex gap-3 mt-10">
              {[
                { label: "Dokter Aktif", value: "24+", color: "blue" },
                { label: "Pasien/Hari", value: "200+", color: "indigo" },
                { label: "Uptime", value: "99.9%", color: "violet" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 hover:bg-white/12 hover:border-white/20 transition-all duration-300"
                >
                  <p className="text-white font-black text-xl">{stat.value}</p>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: version strip */}
          <div className="flex items-center justify-between animate-in fade-in duration-700 delay-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500 text-xs font-semibold">Sistem Online</span>
            </div>
            <span className="text-slate-600 text-xs font-bold">v2.6.0</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          KANAN — FORM PANEL
          ══════════════════════════════════════ */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-50">

        {/* Subtle background effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/8 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/8 rounded-full blur-[80px] pointer-events-none -translate-x-1/3 translate-y-1/3" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] pointer-events-none" />

        {/* Mobile logo — only on small screens */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 lg:hidden animate-in fade-in duration-500">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_8px_20px_rgba(59,130,246,0.35)]">
            <Activity size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-slate-800 font-black text-lg tracking-tight">
            MedCore<span className="text-blue-600">26</span>
          </span>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-700">

          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
              Selamat datang kembali
            </h2>
            <p className="text-slate-500 text-sm font-semibold">
              Masuk untuk mengakses dashboard klinik
            </p>
          </div>

          {/* Glass form card */}
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 p-7 sm:p-8 rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.6)_inset]">
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200">
                    <User size={17} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all duration-200 font-semibold text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200">
                    <Lock size={17} strokeWidth={2.5} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all duration-200 font-semibold text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                {/* Error Message */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    error ? "max-h-16 opacity-100 mt-2" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="flex items-start gap-2.5 text-[12px] font-bold text-rose-600 bg-rose-50 px-3.5 py-2.5 rounded-xl border border-rose-100 shadow-sm">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-black rounded-2xl text-white bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(0,0,0,0.1)] active:scale-[0.98] mt-2"
              >
                {/* Gradient hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-enabled:group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 flex items-center gap-2.5">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-slate-400 group-hover:text-blue-200 transition-colors" />
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight size={15} className="translate-x-0 group-hover:translate-x-1 opacity-50 group-hover:opacity-100 transition-all" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Footer strip */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-emerald-400" />
                Terenkripsi
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={11} />
                Khusus Internal
              </span>
            </div>
          </div>

          {/* Bottom hint */}
          <p className="text-center text-[11px] text-slate-400 font-semibold mt-5">
            Butuh akses?{" "}
            <span className="text-blue-500 font-bold cursor-pointer hover:underline">
              Hubungi administrator
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
