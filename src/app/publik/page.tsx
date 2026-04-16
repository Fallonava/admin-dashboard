"use client";

import React from "react";
import { ArrowRight, Sparkles, Activity, ShieldCheck, Stethoscope, Clock, Zap, MessageSquare } from "lucide-react";

export default function PublikPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-200/60 overflow-hidden font-sans pb-32">
      {/* ─── BACKGROUND BLOBS (Murni CSS, Estetika 2026) ─── */}
      <div className="fixed top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-400/10 rounded-full blur-[140px] pointer-events-none mix-blend-multiply" />
      <div className="fixed bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-sky-400/10 rounded-full blur-[140px] pointer-events-none mix-blend-multiply" />

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 w-full px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-2xl px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-[14px] text-white shadow-lg shadow-indigo-200">
              <Stethoscope size={22} strokeWidth={2.5} />
            </div>
            <div>
               <h1 className="text-[17px] font-black text-slate-800 tracking-tight leading-tight">SIMED</h1>
               <p className="text-[9px] font-black text-indigo-500 tracking-[0.2em] uppercase leading-tight">Portal Pasien</p>
            </div>
          </div>
          <a href="/login" className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-all">
             Admin Akses <ArrowRight size={14} />
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-16 sm:mt-24 relative z-10">
        
        {/* ─── HERO SECTION ─── */}
        <section className="flex flex-col items-center text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-indigo-100 rounded-full shadow-sm mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-600">Sistem Rawat Aktif</span>
          </div>
          
          <h2 className="text-6xl sm:text-7xl lg:text-[88px] font-black tracking-tighter text-slate-800 leading-[1.05] mb-8">
            Kesehatan Anda, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">
              Terjadwal Sempurna.
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-slate-500 font-medium max-w-2xl leading-relaxed mb-12">
            Tidak ada lagi waktu tunggu yang membosankan. Dapatkan jadwal akurat, konsultasi mulus, dan pengingat WhatsApp instan, hanya dari sentuhan jari Anda.
          </p>
          
          {/* CTA Animasi 2026 */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-[24px] blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
            <button 
              className="relative flex items-center justify-center gap-3 px-10 py-5 bg-slate-800 text-white rounded-[20px] font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto overflow-hidden"
              onClick={() => {
                // Membuka AiChatWidget secara programmatic (karena ia global, bisa dipanggil lewat klik layar)
                // Di sini kita sekadar simulasi menarik minat pasien.
                alert("Silakan klik widget asisten (tombol bersinar) di pojok kanan bawah untuk memulai!");
              }}
            >
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
              <span>Mulai Berinteraksi dengan AI</span>
              <Sparkles size={20} className="text-indigo-300" />
            </button>
          </div>
        </section>

        {/* ─── BENTO GRID LAYOUT (The 2026 Design Paradigm) ─── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(0,_1fr)]">
          
          {/* Card 1: Penjadwalan Cerdas (Span 2 col on Desktop) */}
          <div className="md:col-span-2 group relative bg-white/60 backdrop-blur-xl border border-white/80 p-8 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.08)] transition-all overflow-hidden flex flex-col justify-end min-h-[320px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[60px] group-hover:bg-indigo-600/10 transition-colors" />
            <div className="absolute top-8 right-8 w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 rotate-12 group-hover:rotate-0 transition-all duration-500">
               <Clock size={28} strokeWidth={2.5} />
            </div>
            
            <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight z-10">Real-Time Scheduling</h3>
            <p className="text-slate-500 font-medium leading-relaxed max-w-md z-10">
              Poliklinik tutup jam 15:00? Dokter sedang operasi? Mesin kami mengatur sinkronisasi ketersediaan dokter dengan persisi milidetik.
            </p>
          </div>

          {/* Card 2: Privacy (Square) */}
          <div className="group bg-white/60 backdrop-blur-xl border border-white/80 p-8 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(14,165,233,0.08)] transition-all overflow-hidden relative flex flex-col justify-end min-h-[320px]">
             <div className="w-14 h-14 bg-sky-50 rounded-2xl text-sky-600 flex items-center justify-center mb-auto">
               <ShieldCheck size={28} strokeWidth={2.5} />
             </div>
             <div>
               <h3 className="text-xl font-black text-slate-800 mb-2 mt-8 tracking-tight">Privasi Ekstrem</h3>
               <p className="text-sm text-slate-500 font-medium leading-relaxed">
                 Data Anda dienkripsi lokal 100%. Kami menggunakan AI berbasis *Local Inference*, memastikan keluhan Anda tidak pernah bocor ke komputasi awan.
               </p>
             </div>
          </div>

          {/* Card 3: AI Assistant (Square) */}
          <div className="group bg-slate-800 p-8 rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_60px_rgba(30,30,40,0.3)] transition-all overflow-hidden relative flex flex-col justify-end min-h-[320px]">
             <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-indigo-500/30 rounded-full blur-[50px]" />
             <div className="w-14 h-14 bg-white/10 rounded-2xl text-indigo-300 flex items-center justify-center mb-auto border border-white/10">
               <Activity size={28} strokeWidth={2.5} />
             </div>
             <div className="z-10">
               <h3 className="text-xl font-black text-white mb-2 mt-8 tracking-tight flex items-center gap-2">SIMED AI <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-full uppercase tracking-widest border border-indigo-400/30">Lokal</span></h3>
               <p className="text-sm text-slate-300 font-medium leading-relaxed">
                 Tanya apapun tentang pendaftaran atau fasilitas poli. AI kami terlatih khusus membaca SOP rumah sakit.
               </p>
             </div>
          </div>

          {/* Card 4: FAKT-Bot Notifications (Span 2 col on Desktop) */}
          <div className="md:col-span-2 group relative bg-gradient-to-br from-indigo-50 to-white backdrop-blur-xl border border-indigo-100 p-8 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all overflow-hidden flex flex-col justify-end min-h-[320px]">
            <div className="flex gap-3 absolute top-8 right-8">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-500 animate-pulse">
                 <MessageSquare size={24} strokeWidth={2.5} />
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-amber-100 flex items-center justify-center text-amber-500">
                 <Zap size={24} strokeWidth={2.5} />
              </div>
            </div>
            
            <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Otomatisasi WhatsApp</h3>
            <p className="text-slate-500 font-medium leading-relaxed max-w-md">
              SIMED terkoneksi dengan protokol FAKT-Bot. Kami akan mengirimkan notifikasi tiket antrean dan pesan pengingat langsung ke aplikasi WhatsApp Anda.
            </p>
          </div>

        </section>

      </main>

    </div>
  );
}
