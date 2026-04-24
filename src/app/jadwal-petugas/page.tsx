"use client";

import React, { useState } from 'react';
import ShiftBoard from '@/features/schedules/components/ShiftBoard';

export default function JadwalPetugasPage() {
  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* Page Header */}
      <div className="bg-white/40 backdrop-blur-[40px] p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600">Jadwal TPPRJ</span></h1>
          <p className="text-slate-500 mt-2 font-medium max-w-2xl">
            Sistem penjadwalan cerdas dengan kalkulasi jam terbang otomatis. Gunakan mode "Sihir Otomatis" untuk menghasilkan jadwal adil yang dirotasi acak dengan porsi pembagian shift harian (Pagi, Siang, Sore) yang proporsional.
          </p>
        </div>
      </div>

      <ShiftBoard />
    </div>
  );
}
