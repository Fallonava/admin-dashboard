"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/ui/PageHeader";
import { 
  Globe, 
  Images, 
  LayoutTemplate, 
  FileText, 
  Settings2, 
  Save, 
  Plus, 
  Trash2,
  Image as ImageIcon,
  Loader2,
  Activity,
  Bed,
  Tag,
  LifeBuoy,
  HeartPulse,
  Stethoscope,
  CalendarDays,
  ShieldCheck,
  Phone,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Katalog Ikon dan Warna untuk Quick Access
export const AVAILABLE_ICONS = [
  "Activity", "Bed", "Tag", "LifeBuoy", "HeartPulse", "Stethoscope", "CalendarDays", "ShieldCheck", "Phone", "Clock"
];

export const AVAILABLE_COLORS = [
  { id: "indigo", name: "Indigo / Nila" },
  { id: "amber", name: "Amber / Emas" },
  { id: "rose", name: "Rose / Merah Muda" },
  { id: "teal", name: "Teal / Toska" },
  { id: "emerald", name: "Emerald / Zamrud" },
  { id: "blue", name: "Blue / Biru" },
  { id: "purple", name: "Purple / Ungu" }
];

const DEFAULT_PORTAL_SETTINGS = {
  heroSlides: [
    { title: "Kesehatan Anda", highlight: "Dedikasi Kami.", desc: "Rumah Sakit Siaga Medika Purbalingga hadir dengan standar pelayanan internasional dan teknologi medis terkini untuk Anda.", imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80" },
    { title: "Pusat Layanan", highlight: "Trauma & Ortopedi.", desc: "Pemulihan cedera olahraga dan bedah tulang presisi tinggi berstandar internasional dengan tim ahli bedah subspesialis.", imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1920&q=80" },
    { title: "Kenyamanan", highlight: "Kamar Inap VVIP.", desc: "Rasakan pengalaman masa penyembuhan dengan privasi maksimal dan fasilitas sekelas hotel bintang lima untuk Anda dan keluarga.", imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1920&q=80" }
  ],
  quickAccess: [
    { title: "Medical Check Up", desc: "Paket MCU Eksekutif", icon: "Activity", color: "indigo" },
    { title: "Tarif Kamar VIP", desc: "Tur Fasilitas Inap", icon: "Bed", color: "amber" },
    { title: "Promo Layanan", desc: "Penawaran Eksklusif", icon: "Tag", color: "rose" },
    { title: "Pusat Bantuan", desc: "Informasi Asuransi", icon: "LifeBuoy", color: "teal" }
  ],
  articles: [
    { title: "Mengenal Teknologi Robotic Surgery dalam Penanganan Kanker", category: "Onkologi", author: "dr. Ratna Wijayanti, Sp.B(K)Onk", desc: "Pembedahan robotik minimal invasif kini memungkinkan pengangkatan tumor dengan tingkat presisi mikroskopis...", imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80" },
    { title: "Pentingnya Rehabilitasi Medik Pasca Cedera Olahraga", category: "Fisioterapi", author: "dr. Hendra Cipta, Sp.OT", desc: "Masa pemulihan sama pentingnya dengan operasi. Program fisioterapi yang tepat dapat mengembalikan 100% fungsi gerak pasien...", imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80" },
    { title: "Nutrisi Tepat untuk Pemulihan Cepat Pasca Operasi", category: "Gizi Klinis", author: "dr. Siska Amelia, Sp.GK", desc: "Asupan tinggi protein dan mikronutrien spesifik terbukti mempercepat regenerasi sel tulang dan jaringan ikat setelah prosedur bedah...", imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80" }
  ],
  centersOfExcellence: {
    title: "Pusat Trauma & Ortopedi Terpadu",
    desc: "Penanganan komprehensif mulai dari kegawatdaruratan trauma, bedah tulang presisi tinggi, hingga rehabilitasi medik pasca-operasi.",
    imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=800&q=80",
    features: [
      "Layanan UGD Trauma 24 Jam dengan Alur Prioritas",
      "Tim Subspesialis Bedah Ortopedi & Konsultan Spine",
      "Fasilitas MRI 3 Tesla & CT-Scan 128 Slices",
      "Gymnasium Rehabilitasi Medik Terpadu"
    ]
  },
  general: {
    virtualTourUrl: "",
    emergencyPhone: "",
    address: "Jl. Letnan Jenderal S. Parman No.1, Purbalingga",
    email: "info@siagamedika.id",
    phone: "(0281) 895 111",
    workingHours: "UGD 24 Jam | Poliklinik: 07:00 - 21:00",
    socials: {
      instagram: "https://instagram.com/siagamedika",
      youtube: "",
      facebook: ""
    }
  }
};

export function PortalManagerClient() {
  const [activeTab, setActiveTab] = useState("hero");
  const { data, error, mutate } = useSWR('/api/settings', fetcher);
  
  const [settings, setSettings] = useState(DEFAULT_PORTAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.portalSettings) {
      // Merge defaults to ensure new fields (icon, color, imageUrl) exist for old data
      setSettings({ ...DEFAULT_PORTAL_SETTINGS, ...data.portalSettings });
    }
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalSettings: settings })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Server error");
      }
      mutate();
      alert("Pengaturan portal berhasil disimpan!");
    } catch (e: any) {
      console.error("Save error:", e);
      alert(`Gagal menyimpan pengaturan: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "hero", label: "Hero Slider", icon: Images },
    { id: "quick-access", label: "Akses Cepat", icon: LayoutTemplate },
    { id: "coe", label: "Layanan Unggulan", icon: HeartPulse },
    { id: "articles", label: "Artikel Edukasi", icon: FileText },
    { id: "general", label: "Pengaturan Umum", icon: Settings2 },
  ];

  if (!data && !error) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-slate-50/50 dark:bg-zinc-950/50">
      <div className="relative z-10 w-full flex-none">
        <PageHeader
          icon={<Globe size={20} className="text-white" />}
          title="Portal Manager"
          subtitle="Kelola konten dan tampilan portal publik rumah sakit"
          iconGradient="from-emerald-500 to-teal-600"
          accentBarGradient="from-emerald-500 via-teal-500 to-cyan-500"
          accentColor="text-emerald-600"
          actions={
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-bold text-sm hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] transition-all active:scale-95 shrink-0 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span className="hidden sm:inline">{isSaving ? "Menyimpan..." : "Simpan Semua"}</span>
            </button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-10 space-y-6 pt-6 custom-scrollbar">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm" 
                    : "text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          {activeTab === "hero" && <HeroSliderManager settings={settings} setSettings={setSettings} />}
          {activeTab === "quick-access" && <QuickAccessManager settings={settings} setSettings={setSettings} />}
          {activeTab === "coe" && <CentersOfExcellenceManager settings={settings} setSettings={setSettings} />}
          {activeTab === "articles" && <ArticlesManager settings={settings} setSettings={setSettings} />}
          {activeTab === "general" && <GeneralSettingsManager settings={settings} setSettings={setSettings} />}
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function HeroSliderManager({ settings, setSettings }: any) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRefs = [React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null)];

  const updateSlide = (idx: number, field: string, value: string) => {
    const newSlides = [...settings.heroSlides];
    newSlides[idx] = { ...newSlides[idx], [field]: value };
    setSettings({ ...settings, heroSlides: newSlides });
  };

  const handleFileUpload = async (idx: number, file: File) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        updateSlide(idx, 'imageUrl', data.url);
      } else {
        alert(data.error || 'Gagal mengunggah gambar');
      }
    } catch (e) {
      alert('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleDrop = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIdx(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(idx, file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Pengaturan Hero Slider</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Atur slide promosi di halaman utama — Upload gambar atau masukkan URL secara langsung.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settings.heroSlides.map((slide: any, i: number) => (
          <div key={i} className="group relative border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-950/50 flex flex-col">
            
            {/* === IMAGE UPLOAD ZONE === */}
            <div
              className={cn(
                "relative h-48 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden",
                dragOverIdx === i
                  ? "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "hover:ring-1 hover:ring-emerald-400/50"
              )}
              onClick={() => fileInputRefs[i]?.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={(e) => handleDrop(i, e)}
            >
              {/* Background preview */}
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900" />
              )}

              {/* Overlay */}
              <div className={cn(
                "absolute inset-0 transition-opacity duration-300",
                slide.imageUrl ? "bg-black/40 opacity-0 group-hover:opacity-100" : "bg-transparent"
              )} />

              {/* Upload state overlay */}
              {uploadingIdx === i ? (
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-white font-bold text-sm drop-shadow-lg">Mengunggah...</span>
                </div>
              ) : slide.imageUrl ? (
                <div className="relative z-10 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                    <ImageIcon size={18} className="text-white" />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow-lg">Ganti Gambar</span>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                    dragOverIdx === i ? "bg-emerald-500 scale-110" : "bg-slate-200 dark:bg-zinc-700"
                  )}>
                    <ImageIcon size={22} className={dragOverIdx === i ? "text-white" : "text-slate-400 dark:text-zinc-400"} />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-600 dark:text-zinc-400 font-bold text-sm">
                      {dragOverIdx === i ? "Lepaskan di sini" : "Upload Gambar"}
                    </p>
                    <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">Drag & drop atau klik • JPG, PNG, WebP (maks 5MB)</p>
                  </div>
                </div>
              )}

              {/* Slide badge */}
              <div className="absolute top-3 left-3 z-20 bg-black/50 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                Slide {i + 1}
              </div>

              {/* Clear button */}
              {slide.imageUrl && !uploadingIdx && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateSlide(i, 'imageUrl', ''); }}
                  className="absolute top-3 right-3 z-20 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                >
                  <Trash2 size={12} className="text-white" />
                </button>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRefs[i]}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(i, file);
                  e.target.value = '';
                }}
              />
            </div>

            {/* === FORM FIELDS === */}
            <div className="p-4 space-y-3 flex-1">
              {/* URL manual sebagai alternatif */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  atau masukkan URL
                </label>
                <input
                  type="text"
                  value={slide.imageUrl || ""}
                  onChange={e => updateSlide(i, 'imageUrl', e.target.value)}
                  placeholder="https://example.com/foto.jpg"
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Judul Utama</label>
                <input type="text" value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Teks Sorotan (Gradasi)</label>
                <input type="text" value={slide.highlight} onChange={e => updateSlide(i, 'highlight', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Deskripsi</label>
                <textarea value={slide.desc} onChange={e => updateSlide(i, 'desc', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAccessManager({ settings, setSettings }: any) {
  const updateQuickAccess = (idx: number, field: string, value: string) => {
    const newItems = [...(settings.quickAccess || DEFAULT_PORTAL_SETTINGS.quickAccess)];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setSettings({ ...settings, quickAccess: newItems });
  };

  const currentItems = settings.quickAccess || DEFAULT_PORTAL_SETTINGS.quickAccess;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Akses Cepat (Quick Access)</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Kelola 4 kartu menu utama di bawah Hero Section termasuk Warna Tema dan Ikon.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentItems.map((item: any, i: number) => (
          <div key={i} className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-950/50 space-y-4">
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Ikon</label>
                <select value={item.icon || "Activity"} onChange={e => updateQuickAccess(i, 'icon', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none">
                  {AVAILABLE_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Warna Tema</label>
                <select value={item.color || "indigo"} onChange={e => updateQuickAccess(i, 'color', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none">
                  {AVAILABLE_COLORS.map(color => <option key={color.id} value={color.id}>{color.name}</option>)}
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Judul Menu</label>
                <input type="text" value={item.title} onChange={e => updateQuickAccess(i, 'title', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Deskripsi Singkat</label>
                <input type="text" value={item.desc} onChange={e => updateQuickAccess(i, 'desc', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticlesManager({ settings, setSettings }: any) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRefs = [React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null)];

  const updateArticle = (idx: number, field: string, value: string) => {
    const newArticles = [...settings.articles];
    newArticles[idx] = { ...newArticles[idx], [field]: value };
    setSettings({ ...settings, articles: newArticles });
  };

  const handleFileUpload = async (idx: number, file: File) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        updateArticle(idx, 'imageUrl', data.url);
      } else {
        alert(data.error || 'Gagal mengunggah gambar');
      }
    } catch (e) {
      alert('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleDrop = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIdx(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(idx, file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Manajemen Artikel</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Kelola artikel edukasi medis (dukung upload gambar drag & drop).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settings.articles.map((art: any, i: number) => (
          <div key={i} className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-950/50 space-y-4 flex flex-col group relative">
             
             {/* === IMAGE UPLOAD ZONE === */}
             <div
              className={cn(
                "w-full h-32 rounded-lg relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden shrink-0 border-2 border-dashed",
                dragOverIdx === i
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : art.imageUrl ? "border-transparent" : "border-slate-300 dark:border-zinc-700 hover:border-emerald-400"
              )}
              onClick={() => fileInputRefs[i]?.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={(e) => handleDrop(i, e)}
            >
              {art.imageUrl ? (
                <img src={art.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="absolute inset-0 bg-slate-100 dark:bg-zinc-800/50" />
              )}

              <div className={cn(
                "absolute inset-0 transition-opacity duration-300 flex items-center justify-center",
                art.imageUrl ? "bg-black/50 opacity-0 group-hover:opacity-100" : "bg-transparent"
              )}>
                {uploadingIdx === i ? (
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className={cn("flex flex-col items-center gap-1", art.imageUrl ? "text-white" : "text-slate-500 dark:text-zinc-400")}>
                    <ImageIcon size={20} className={dragOverIdx === i ? "scale-110 text-emerald-500 transition-transform" : ""} />
                    <span className="text-xs font-bold">{art.imageUrl ? "Ubah Gambar" : (dragOverIdx === i ? "Lepaskan!" : "Upload Gambar")}</span>
                  </div>
                )}
              </div>

              {art.imageUrl && !uploadingIdx && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateArticle(i, 'imageUrl', ''); }}
                  className="absolute top-2 right-2 z-20 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={10} className="text-white" />
                </button>
              )}

              <input
                ref={fileInputRefs[i]}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(i, file);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="space-y-1.5 flex-1">
               <label className="text-xs font-bold text-slate-500 uppercase">atau URL (opsional)</label>
               <input type="text" value={art.imageUrl || ""} onChange={e => updateArticle(i, 'imageUrl', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500" placeholder="https://..." />
            </div>

             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Judul</label>
                <input type="text" value={art.title} onChange={e => updateArticle(i, 'title', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
                  <input type="text" value={art.category} onChange={e => updateArticle(i, 'category', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Penulis</label>
                  <input type="text" value={art.author} onChange={e => updateArticle(i, 'author', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
               </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Ringkasan</label>
                <textarea value={art.desc} onChange={e => updateArticle(i, 'desc', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm h-20 resize-none outline-none focus:border-emerald-500" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CentersOfExcellenceManager({ settings, setSettings }: any) {
  const coe = settings.centersOfExcellence || DEFAULT_PORTAL_SETTINGS.centersOfExcellence;

  const updateField = (field: string, value: any) => {
    setSettings({
      ...settings,
      centersOfExcellence: { ...coe, [field]: value }
    });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...coe.features];
    newFeatures[index] = value;
    updateField('features', newFeatures);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Layanan Unggulan (Centers of Excellence)</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Atur presentasi layanan prioritas rumah sakit Anda di beranda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Judul Layanan Unggulan</label>
            <input type="text" value={coe.title} onChange={e => updateField('title', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Deskripsi Singkat</label>
            <textarea value={coe.desc} onChange={e => updateField('desc', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 h-24 resize-none focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Image URL Fasilitas</label>
            <input type="text" value={coe.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm" placeholder="https://..." />
            {coe.imageUrl && (
              <div className="mt-2 w-full h-32 rounded-lg overflow-hidden">
                <img src={coe.imageUrl} alt="CoE Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4 bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <label className="text-sm font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Daftar Keunggulan (Features)
          </label>
          <p className="text-xs text-slate-500">Sebutkan 4 keunggulan utama layanan ini.</p>
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                type="text"
                value={coe.features?.[i] || ""}
                onChange={e => handleFeatureChange(i, e.target.value)}
                placeholder={`Keunggulan ${i + 1}`}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettingsManager({ settings, setSettings }: any) {
  const gen = settings.general || DEFAULT_PORTAL_SETTINGS.general;
  
  const updateGeneral = (field: string, value: string) => {
    setSettings({
      ...settings,
      general: { ...gen, [field]: value }
    });
  };

  const updateSocial = (network: string, value: string) => {
    setSettings({
      ...settings,
      general: { 
        ...gen, 
        socials: { ...(gen.socials || DEFAULT_PORTAL_SETTINGS.general.socials), [network]: value } 
      }
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Pengaturan Umum & Footer</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Konfigurasi dasar, kontak, dan tautan sosial media untuk bagian bawah portal publik.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800 pb-6 md:pb-0 md:pr-8">
          <h3 className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" /> Modul Layanan
          </h3>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">URL Virtual Tour 360°</label>
            <input type="text" value={gen.virtualTourUrl || ""} onChange={e => updateGeneral('virtualTourUrl', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="https://my.matterport.com/show/?m=..." />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Nomor Telepon Darurat (IGD)</label>
            <input type="text" value={gen.emergencyPhone || ""} onChange={e => updateGeneral('emergencyPhone', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="0281-..." />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Globe size={18} className="text-indigo-500" /> Footer / Identitas Kontak
          </h3>
          <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-500">Alamat Rumah Sakit</label>
               <textarea value={gen.address || ""} onChange={e => updateGeneral('address', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 h-16 resize-none text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">No. Telepon Registrasi</label>
                  <input type="text" value={gen.phone || ""} onChange={e => updateGeneral('phone', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Email Utama</label>
                  <input type="email" value={gen.email || ""} onChange={e => updateGeneral('email', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
             </div>
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-500">Jam Operasional (Ditampilkan)</label>
               <input type="text" value={gen.workingHours || ""} onChange={e => updateGeneral('workingHours', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="UGD 24 Jam | Poliklinik 07:00 - 21:00" />
             </div>

             <div className="pt-2">
               <label className="text-xs font-bold text-slate-500 block mb-2">Tautan Media Sosial (Opsional)</label>
               <div className="space-y-2">
                 <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                   <div className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 flex items-center border-r border-slate-200 dark:border-zinc-700 text-slate-500 text-xs w-24">Instagram</div>
                   <input type="text" value={gen.socials?.instagram || ""} onChange={e => updateSocial('instagram', e.target.value)} className="flex-1 px-3 py-2 text-sm bg-transparent outline-none focus:bg-emerald-50/50 dark:focus:bg-emerald-900/10" placeholder="https://instagram.com/..." />
                 </div>
                 <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                   <div className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 flex items-center border-r border-slate-200 dark:border-zinc-700 text-slate-500 text-xs w-24">YouTube</div>
                   <input type="text" value={gen.socials?.youtube || ""} onChange={e => updateSocial('youtube', e.target.value)} className="flex-1 px-3 py-2 text-sm bg-transparent outline-none focus:bg-emerald-50/50 dark:focus:bg-emerald-900/10" placeholder="https://youtube.com/c/..." />
                 </div>
                 <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                   <div className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 flex items-center border-r border-slate-200 dark:border-zinc-700 text-slate-500 text-xs w-24">Facebook</div>
                   <input type="text" value={gen.socials?.facebook || ""} onChange={e => updateSocial('facebook', e.target.value)} className="flex-1 px-3 py-2 text-sm bg-transparent outline-none focus:bg-emerald-50/50 dark:focus:bg-emerald-900/10" placeholder="https://facebook.com/..." />
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
