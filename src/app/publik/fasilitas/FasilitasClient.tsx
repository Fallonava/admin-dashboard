'use client';
import { useState } from 'react';
import { 
  HeartPulse, Bed, ShieldCheck, Activity, Clock, Users, Stethoscope, 
  Building2, Star, CheckCircle2, ChevronRight, ArrowRight, Phone 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const facilities = [
  {
    id: 'icu',
    category: 'Critical Care',
    name: 'ICU & ICCU Premium',
    desc: 'Unit Perawatan Intensif kami dilengkapi dengan monitor pasien generasi terbaru dan ventilator berteknologi tinggi, siap menangani kondisi kritis 24 jam.',
    icon: HeartPulse,
    color: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/40',
    stats: [{ label: 'Kapasitas Tempat Tidur', val: '24' }, { label: 'Rasio Perawat:Pasien', val: '1:1' }, { label: 'Uptime Monitor', val: '99.9%' }],
    features: ['Monitor Multi-Parameter', 'Ventilator ICU High-End', 'Sistem Alarm Terpadu', 'Tim Dokter On-Call 24 Jam'],
    size: 'large',
  },
  {
    id: 'ok',
    category: 'Bedah & Intervensi',
    name: 'Kamar Operasi Canggih',
    desc: 'Dilengkapi laminar airflow, sistem navigasi bedah presisi, dan peralatan laparoskopi terkini untuk prosedur minimal invasif.',
    icon: Activity,
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800/40',
    stats: [{ label: 'Total Ruang Operasi', val: '6' }, { label: 'Operasi / Bulan', val: '200+' }],
    features: ['Laminar Airflow Class 100', 'Laparoskopi Canggih', 'Anestesi Modern'],
    size: 'medium',
  },
  {
    id: 'rawatinap',
    category: 'Rawat Inap',
    name: 'Kamar VIP & VVIP',
    desc: 'Ruangan premium dengan interior bertaraf hotel bintang lima. Dilengkapi sofa keluarga, TV pintar, dan akses Wi-Fi berkecepatan tinggi.',
    icon: Bed,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/40',
    stats: [{ label: 'Kamar Tersedia', val: '120' }, { label: 'Kamar VIP/VVIP', val: '30' }],
    features: ['Interior Premium', 'Sofa Keluarga', 'Wi-Fi Kecepatan Tinggi', 'Makan Disubsidi Canggih'],
    size: 'medium',
  },
  {
    id: 'radiologi',
    category: 'Diagnostik Imejing',
    name: 'Radiologi & MRI',
    desc: 'Teknologi MRI 3 Tesla dan CT-Scan 128-slice untuk diagnosis yang presisi dengan waktu tunggu hasil yang singkat.',
    icon: Stethoscope,
    color: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/40',
    stats: [{ label: 'MRI Tesla', val: '3.0T' }, { label: 'CT-Scan Slice', val: '128' }],
    features: ['MRI 3 Tesla', 'CT-Scan 128-Slice', 'USG 4D', 'Hasil < 2 Jam'],
    size: 'medium',
  },
  {
    id: 'laboratorium',
    category: 'Laboratorium',
    name: 'Lab Klinik 24 Jam',
    desc: 'Laboratorium terakreditasi internasional yang beroperasi penuh 24/7 dengan hasil analisis darah, patologi, dan mikrobiologi.',
    icon: ShieldCheck,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800/40',
    stats: [{ label: 'Jenis Pemeriksaan', val: '500+' }, { label: 'Waktu Hasil', val: '< 1 Jam' }],
    features: ['Hematologi Otomatis', 'Kultur Mikrobiologi', 'Patologi Anatomik', 'Operasi 24/7'],
    size: 'small',
  },
  {
    id: 'ugd',
    category: 'Gawat Darurat',
    name: 'Unit Gawat Darurat',
    desc: 'UGD kami siaga 24 jam dengan tim dokter emergency berpengalaman dan ambulans yang berstandar ACLS/BTLS.',
    icon: Clock,
    color: 'from-red-500 to-rose-700',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800/40',
    stats: [{ label: 'Response Time', val: '< 5 Min' }, { label: 'Unit Ambulans', val: '5' }],
    features: ['Tim Dokter 24 Jam', 'Ambulans Standar ACLS', 'Resusitasi Jantung', 'Triase Modern'],
    size: 'small',
  },
];

const stats = [
  { val: '28+', label: 'Dokter Spesialis' },
  { val: '200+', label: 'Operasi / Bulan' },
  { val: '500+', label: 'Jenis Pemeriksaan Lab' },
  { val: '24/7', label: 'Layanan Aktif' },
];

export default function FasilitasClient() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-700">
      {/* Luminance background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/15 dark:bg-teal-900/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/10 dark:bg-indigo-900/15 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">

        {/* HERO */}
        <div className="mb-16">
          <div className="text-emerald-600 dark:text-emerald-400 font-bold tracking-widest text-sm mb-3 uppercase flex items-center gap-2">
            <Building2 size={14} /> Infrastruktur Medis
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black tracking-tight leading-[1.05] mb-6 text-zinc-900 dark:text-white">
            Fasilitas Bertaraf<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Internasional.</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium max-w-2xl leading-relaxed">
            Infrastruktur medis kami dirancang untuk memberikan diagnosis yang presisi dan pemulihan yang optimal, didukung teknologi terkini dan tim klinis berpengalaman.
          </p>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {stats.map((s, i) => (
            <div key={i} className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-[24px] p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm text-center">
              <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1">{s.val}</div>
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto">
          {facilities.map((f, i) => {
            const Icon = f.icon;
            const isActive = activeId === f.id;
            const isLarge = f.size === 'large';
            return (
              <div
                key={f.id}
                style={{ animationDelay: `${i * 50}ms` }}
                className={cn(
                  "rounded-[32px] p-7 border transition-all duration-500 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden",
                  f.bg, f.border,
                  isLarge ? "lg:col-span-2 lg:row-span-1" : "",
                  isActive ? "shadow-2xl -translate-y-1" : "shadow-sm hover:shadow-xl hover:-translate-y-1"
                )}
                onClick={() => setActiveId(isActive ? null : f.id)}
              >
                {/* Gradient orb */}
                <div className={cn(
                  "absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-all duration-700 group-hover:opacity-30 group-hover:scale-125",
                  f.color
                )} />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg", f.color)}>
                      <Icon size={26} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-current opacity-60">
                      {f.category}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2 leading-tight">{f.name}</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium leading-relaxed">{f.desc}</p>

                  {/* Stats row */}
                  <div className="flex gap-4 mt-5 flex-wrap">
                    {f.stats.map((st, si) => (
                      <div key={si} className="bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/50 dark:border-white/10">
                        <div className="text-lg font-black text-zinc-900 dark:text-white leading-none">{st.val}</div>
                        <div className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">{st.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Expandable features */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-500",
                    isActive ? "max-h-40 mt-5 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="grid grid-cols-1 gap-2">
                      {f.features.map((feat, fi) => (
                        <div key={fi} className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          {feat}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-4 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                    <ChevronRight size={14} className={cn("transition-transform duration-300", isActive ? "rotate-90" : "")} />
                    {isActive ? "Tutup detail" : "Lihat detail"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* EMERGENCY CTA */}
        <div className="mt-16 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-900 dark:to-zinc-950 rounded-[40px] p-10 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl border border-zinc-700/50">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/20 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest mb-4 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Layanan Darurat
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">Butuh Pertolongan <br />Segera?</h3>
            <p className="text-zinc-400 font-medium mt-2">UGD kami siaga 24/7 untuk kondisi medis darurat.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <a href="tel:119" className="flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-400 text-white rounded-full font-black text-sm transition-all hover:scale-105 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <Phone size={18} /> Hubungi 119
            </a>
            <a href="/publik" className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-black text-sm transition-all hover:scale-105 border border-white/20 backdrop-blur-sm">
              Konsultasi AI <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
