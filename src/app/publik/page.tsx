'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { 
  ArrowRight, Search, Stethoscope, Sparkles, Send, Bot, User, Clock, 
  HeartPulse, Building2, CalendarDays, ShieldCheck, 
  Activity, Globe, PlaneTakeoff, ChevronRight, CheckCircle2,
  Sun, Moon, Languages, Users, X, Menu, Bone, Phone, Mail, MapPin, Download,
  Instagram, Linkedin, Youtube, Twitter, Tag, Bed, LifeBuoy, Play
} from 'lucide-react';
import { useStreamChat } from '@/hooks/useStreamChat';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// --- DICTIONARY ---
const DICT = {
  id: {
    nav_findDoctor: "Cari Dokter",
    nav_specialties: "Pusat Keahlian",
    nav_portal: "Portal Pasien",
    header_admin: "Akses Admin",
    
    hero_title: "Kesehatan Anda,",
    hero_highlight: "Puncak Dedikasi Kami.",
    hero_desc: "Lebih dari sekadar rumah sakit, SIMED Hub adalah destinasi medis taraf internasional dengan layanan klinis paripurna, terintegrasi 24/7 di ujung jari Anda.",
    
    er_badge: "UGD 24 Jam",
    er_title: "UGD & Trauma Center",
    er_desc: "Respons hitungan detik untuk menyelamatkan nyawa. Tim spesialis siaga di tempat dengan teknologi evakuasi udara tertaut.",
    er_btn: "Panggil Bantuan (119)",
    
    inpatient_title: "Dokter Siaga",
    inpatient_desc: "Tim pakar spesialis yang saat ini sedang melayani dan siap siaga berpraktik.",
    inpatient_room: "Dokter Praktik",
    inpatient_avail: "Live",
    
    coe_subtitle: "Keahlian Taraf Dunia",
    coe_explore: "Eksplorasi Institusi",
    coe_heart_desc: "Tindakan bedah kardiovaskular invasif minimal.",
    coe_neuro_desc: "Pusat tata laksana tumor otak dan pemulihan stroke tingkat lanjut.",
    coe_oncology_desc: "Terapi presisi genetik untuk pengobatan kanker komprehensif.",
    
    gps_title: "Layanan Pasien & Konsierge Global.",
    gps_desc: "Terbang melintasi batas negara untuk mendapatkan perawatan terbaik. Kami mengurus sepenuhnya dokumentasi medis internasional, akomodasi, transfer jet medis, hingga penerjemah pribadi.",
    gps_items: [
      "Penjemputan Prioritas & VIP Bandara", 
      "Penerjemah Medis Multi-bahasa", 
      "Klaim Asuransi Global Langsung", 
      "Pemulihan Mewah Integrasi Resor"
    ],
    gps_btn: "Pelajari Turisme Medis",
    
    footer_desc: "Rumah Sakit Internasional terakreditasi JCI. Memberikan tolok ukur standar kesehatan futuristik dengan kepedulian tulus.",
    footer_lang: "Bahasa Indonesia",
    footer_col1: "Penanganan",
    footer_col2: "Korporasi",
    footer_col3: "Sertifikasi",
    
    omni_placeholder_empty: "Tanya AI Assistant, buat janji bedah, cari pakar...",
    omni_placeholder_chat: "Tuliskan keluhan atau instruksi Anda...",
    
    sug_1: "Jadwal Bedah besok",
    sug_2: "Poliklinik tutup jam berapa?",
    sug_3: "Apakah bisa pakai asuransi global?",
    sug_4: "Panduan Turisme Medis",
    
    modal_doc_title: "Direktori Pakar Medis",
    modal_doc_search: "Cari nama dokter atau poli spesialis...",
    modal_doc_status_praktek: "Praktek",
    modal_doc_status_libur: "Libur / Rehat"
  },
  en: {
    nav_findDoctor: "Find a Doctor",
    nav_specialties: "Specialties",
    nav_portal: "Patient Portal",
    header_admin: "Admin Access",
    
    hero_title: "Your Health,",
    hero_highlight: "Our Ultimate Dedication.",
    hero_desc: "More than just a hospital, SIMED Hub is a world-class medical destination with comprehensive clinical services, integrated 24/7 at your fingertips.",
    
    er_badge: "24/7 Emergency",
    er_title: "ER & Trauma Center",
    er_desc: "Split-second response to save lives. Specialty teams on standby with linked air-evacuation technology.",
    er_btn: "Call Emergency (119)",
    
    inpatient_title: "Doctors on Duty",
    inpatient_desc: "Our expert specialist teams are currently actively practicing and on standby.",
    inpatient_room: "Practicing Doctors",
    inpatient_avail: "Live",
    
    coe_subtitle: "World-Class Expertise",
    coe_explore: "Explore Institutes",
    coe_heart_desc: "Minimally invasive cardiovascular surgical procedures.",
    coe_neuro_desc: "Advanced center for brain tumor management and stroke recovery.",
    coe_oncology_desc: "Genetic precision therapy for comprehensive cancer treatment.",
    
    gps_title: "Global Patient Concierge.",
    gps_desc: "Fly across borders for the best care. We fully handle international medical documentation, accommodation, medical jet transfer, to personal interpreters.",
    gps_items: [
      "Airport VIP Clearance & Priority Transfer", 
      "Multi-lingual Medical Interpreters", 
      "Direct Global Insurance Billing", 
      "Luxury Post-surgery Resort Integration"
    ],
    gps_btn: "Learn Medical Tourism",
    
    footer_desc: "JCI accredited International Hospital. Setting benchmarks for futuristic healthcare standards with genuine care for humanity.",
    footer_lang: "Global English",
    footer_col1: "Treatments",
    footer_col2: "Corporate",
    footer_col3: "Certification",
    
    omni_placeholder_empty: "Ask AI Assistant, book a surgery, find a specialist...",
    omni_placeholder_chat: "Write down your symptoms or instructions...",

    sug_1: "Surgery schedule tomorrow",
    sug_2: "Clinic closing time?",
    sug_3: "Can I use global insurance?",
    sug_4: "Medical Tourism Guide",
    
    modal_doc_title: "Medical Experts Directory",
    modal_doc_search: "Search doctor name or specialty...",
    modal_doc_status_praktek: "Practicing",
    modal_doc_status_libur: "Standard/Off"
  }
};


// --- ANIMATION WRAPPER ---
function FadeInView({ children, delay = 0, className }: { children: ReactNode, delay?: number, className?: string }) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    
    const { current } = domRef;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
  }, []);

  return (
    <div
      ref={domRef}
      className={cn(
        "transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PublikPage() {
  const endRef = useRef<HTMLDivElement>(null);
  const coeRef = useRef<HTMLDivElement>(null); // Anchor reference for Specialties
  
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  const [lang, setLang] = useState<'id'|'en'>('id');
  const [mounted, setMounted] = useState(false);
  
  // UI States
  const [showDocModal, setShowDocModal] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fallback to 'id' if somehow lang is undefined, for strong typing
  const t = DICT[lang] || DICT['id'];
  
  // Realtime API Data
  const { data: apiData } = useSWR('/api/display', fetcher, { refreshInterval: 10000 });

  const { messages, input, setInput, isLoading, append, handleSubmit, handleInputChange } = useStreamChat({
    api: '/api/assistant',
    body: { role: 'public' },
    initialMessages: [],
  });

  // Dynamic Theme by Time setup component mount
  useEffect(() => {
    setMounted(true);
    const hours = new Date().getHours();
    // Default to dark mode from 18:00 to 05:59
    const prefersDark = hours >= 18 || hours < 6;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  // Cinematic Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = [
    {
      title: t.hero_title,
      highlight: t.hero_highlight,
      desc: t.hero_desc,
    },
    {
      title: lang === 'id' ? "Pusat Layanan" : "Specialty Center",
      highlight: lang === 'id' ? "Trauma & Ortopedi." : "Trauma & Orthopedics.",
      desc: lang === 'id' ? "Pemulihan cedera olahraga dan bedah tulang presisi tinggi berstandar internasional dengan tim ahli bedah subspesialis." : "International standard high-precision orthopedic surgery and sports injury recovery with sub-specialist surgical teams.",
    },
    {
      title: lang === 'id' ? "Kenyamanan" : "Comfortable",
      highlight: lang === 'id' ? "Kamar Inap VVIP." : "VVIP Wards.",
      desc: lang === 'id' ? "Rasakan pengalaman masa penyembuhan dengan privasi maksimal dan fasilitas sekelas hotel bintang lima untuk Anda dan keluarga." : "Experience a healing journey with maximum privacy and five-star hotel amenities for you and your family.",
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Sync theme state → html element class (required for Tailwind v4 @variant dark)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasMessages = messages.length > 0;

  const suggestions = [
    { text: t.sug_1, icon: <Stethoscope size={14} /> },
    { text: t.sug_2, icon: <Clock size={14} /> },
    { text: t.sug_3, icon: <ShieldCheck size={14} /> },
    { text: t.sug_4, icon: <PlaneTakeoff size={14} /> },
  ];
  
  // --- DATA LOGIC ---
  const doctors = apiData?.doctors || [];
  const activeDoctorsCount = doctors.filter((d: any) => d.status === 'PRAKTEK' || d.status === 'PENDAFTARAN' || d.status === 'OPERASI').length;
  const skeletonPulse = !apiData ? "animate-pulse bg-zinc-200 dark:bg-zinc-800 text-transparent rounded" : "";
  
  // Search Filter for Modal
  const filteredDocs = doctors.filter((d: any) => {
     const matchesSearch = d.name.toLowerCase().includes(docSearch.toLowerCase()) || 
                           (d.specialty && d.specialty.toLowerCase().includes(docSearch.toLowerCase()));
     if (!matchesSearch) return false;
     if (activeFilter === "Semua") return true;
     if (activeFilter === "Praktek Sekarang") return d.status === 'PRAKTEK' || d.status === 'PENDAFTARAN' || d.status === 'OPERASI';
     return d.specialty === activeFilter;
  });
  
  // COE Logic & Flagship Orthopedi
  const specMap: Record<string, { count: number, active: number, docs: any[] }> = {};
  let flagshipOrthoDocs: any[] = [];
  let flagshipOrthoActive = 0;

  doctors.forEach((d: any) => {
     const isPracticing = d.status === 'PRAKTEK' || d.status === 'PENDAFTARAN' || d.status === 'OPERASI';
     const isOrtho = d.specialty && (d.specialty.toLowerCase().includes('ortho') || d.specialty.toLowerCase().includes('ortopedi') || d.specialty.toLowerCase().includes('sp.ot'));
     
     if (isOrtho) {
         flagshipOrthoDocs.push(d);
         if (isPracticing) flagshipOrthoActive += 1;
     }

     if (d.specialty) {
        if (!specMap[d.specialty]) specMap[d.specialty] = { count: 0, active: 0, docs: [] };
        specMap[d.specialty].count += 1;
        if (isPracticing) specMap[d.specialty].active += 1;
        specMap[d.specialty].docs.push(d);
     }
  });
  
  const topSpecialties = Object.keys(specMap)
      .filter(s => !(s.toLowerCase().includes('ortho') || s.toLowerCase().includes('ortopedi') || s.toLowerCase().includes('sp.ot')))
      .sort((a,b) => specMap[b].count - specMap[a].count)
      .slice(0, 3);
  
  const specIcons = [
      <Activity key="1" size={32} className="text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform duration-500" />,
      <Bot key="2" size={32} className="text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500" />,
      <Sparkles key="3" size={32} className="text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform duration-500" />
  ];
  const specColor = ["bg-rose-50 dark:bg-rose-950/50", "bg-indigo-50 dark:bg-indigo-950/50", "bg-amber-50 dark:bg-amber-950/50"];

  let dynamicCOE = topSpecialties.map((spec, i) => ({
      title: spec,
      count: specMap[spec].count,
      active: specMap[spec].active,
      desc: lang === 'en' ? `We have ${specMap[spec].count} medical experts, with ${specMap[spec].active} currently on duty.` : `Terdapat ${specMap[spec].count} Pakar Medis, dan ${specMap[spec].active} di antaranya sedang berpraktik saat ini.`,
      icon: specIcons[i % specIcons.length],
      color: specColor[i % specColor.length],
      avatars: specMap[spec].docs.filter((d: any) => d.image).slice(0, 4).map((d: any) => d.image)
  }));
  
  const allSpecsMapped = Object.keys(specMap).sort((a,b) => specMap[b].count - specMap[a].count).map((spec, i) => ({
      title: spec,
      count: specMap[spec].count,
      active: specMap[spec].active,
      icon: specIcons[i % specIcons.length],
      color: specColor[i % specColor.length]
  }));
  
  if (dynamicCOE.length === 0) {
      dynamicCOE = [
         { title: "Heart & Vascular", count: 0, active: 0, desc: t.coe_heart_desc, color: specColor[0], icon: specIcons[0], avatars: [] },
         { title: "Neuroscience", count: 0, active: 0, desc: t.coe_neuro_desc, color: specColor[1], icon: specIcons[1], avatars: [] },
         { title: "Oncology Center", count: 0, active: 0, desc: t.coe_oncology_desc, color: specColor[2], icon: specIcons[2], avatars: [] }
      ];
  }

  // Quick filters combining dynamic top specialties
  const quickFilters = ["Semua", "Praktek Sekarang", ...topSpecialties];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-700 relative selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100">
        
        {/* DOCTOR SEARCH MODAL (GLASSMORPHISM) */}
        {showDocModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md transition-all duration-500 animate-in fade-in zoom-in-95">
             <div className="w-full max-w-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/50 dark:border-zinc-800/50 flex flex-col max-h-[85vh] overflow-hidden relative">
                
                <div className="flex items-center justify-between p-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
                   <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                     <Search size={20} className="text-emerald-500" /> {t.modal_doc_title}
                   </h2>
                   <button onClick={() => setShowDocModal(false)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                      <X size={16} strokeWidth={3} />
                   </button>
                </div>

                <div className="p-6 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/20">
                   <input 
                      type="text" 
                      placeholder={t.modal_doc_search} 
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                   />
                   <div className="flex flex-wrap items-center gap-2 mt-4">
                      {quickFilters.map(f => (
                         <button key={f} onClick={() => setActiveFilter(f)} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all border", activeFilter === f ? "bg-emerald-500 border-emerald-500 text-white shadow-md" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-emerald-500/50")}>
                            {f === "Praktek Sekarang" && <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle", activeFilter === f ? "bg-white animate-pulse" : "bg-emerald-400")} />}
                            {f}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                   {filteredDocs.length > 0 ? filteredDocs.map((doc: any) => {
                      const isPracticing = doc.status === 'PRAKTEK' || doc.status === 'PENDAFTARAN' || doc.status === 'OPERASI';
                      return (
                      <div key={doc.id} className="p-5 rounded-[24px] border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors flex flex-col gap-4 group/card">
                         <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden border-2 border-transparent group-hover/card:border-emerald-500 transition-colors shrink-0">
                               {doc.image ? <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" /> : <User size={28} className="m-auto mt-4 text-zinc-400" />}
                            </div>
                            <div className="flex-1">
                               <div className="flex justify-between items-start">
                                  <div>
                                     <h3 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight">{doc.name}</h3>
                                     <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold mt-0.5">{doc.specialty}</p>
                                  </div>
                                  <span className={cn(
                                     "px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shrink-0",
                                     isPracticing
                                     ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                     : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                  )}>
                                     {isPracticing && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse align-middle" />}
                                     {doc.status === 'PRAKTEK' ? t.modal_doc_status_praktek : 
                                      doc.status === 'LIBUR' || doc.status === 'SELESAI' ? t.modal_doc_status_libur : doc.status}
                                  </span>
                               </div>
                               
                               <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                                  {doc.queueCode && (
                                     <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md">
                                        <Building2 size={14} /> {doc.queueCode}
                                     </div>
                                  )}
                                  {isPracticing && doc.currentRegistrationTime && (
                                     <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
                                        <Clock size={14} /> Est. Tunggu {doc.currentRegistrationTime}
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                         
                         {doc.shiftPills && doc.shiftPills.length > 0 && (
                            <div className="flex gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex-wrap">
                               {doc.shiftPills.map((s: any, idx: number) => (
                                  <span key={idx} className={cn("text-xs font-bold px-2 py-1 rounded-md border", s.disabled ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400")}>
                                     {s.time}
                                  </span>
                               ))}
                            </div>
                         )}

                         <div className="pt-2 opacity-100 sm:opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                             <button onClick={() => {
                                 setShowDocModal(false);
                                 setInput(`Buat janji dengan ${doc.name}`);
                                 setTimeout(() => append({ role: 'user', content: `Buat janji dengan ${doc.name}` }), 300);
                             }} className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm hover:bg-emerald-500 dark:hover:bg-emerald-400 dark:hover:text-zinc-900 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                 <CalendarDays size={16} /> Buat Janji via AI
                             </button>
                         </div>
                      </div>
                   )}) : (
                      <div className="py-20 text-center flex flex-col items-center opacity-50">
                         <Bot size={48} className="mb-4 text-zinc-400" />
                         <p className="font-medium text-zinc-500 dark:text-zinc-400">Pakar medis tidak ditemukan.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* ─── ALL SPECIALTIES MODAL (DIREKTORI INSTITUSI) ─── */}
        {showAllSpecs && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-xl transition-all duration-500 animate-in fade-in zoom-in-95">
             <div className="w-full max-w-5xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/50 dark:border-zinc-800/50 flex flex-col max-h-[85vh] overflow-hidden relative">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/30 gap-4">
                   <div>
                       <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                         <Activity className="text-emerald-500 w-6 h-6 sm:w-8 sm:h-8" /> Direktori Keahlian
                       </h2>
                       <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium text-sm sm:text-base">Temukan seluruh layanan medis dan poliklinik spesialis yang tersedia.</p>
                   </div>
                   <button onClick={() => setShowAllSpecs(false)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors shadow-sm absolute top-6 right-6 sm:relative sm:top-0 sm:right-0">
                      <X size={20} strokeWidth={2.5} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/10">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {allSpecsMapped.map((spec, i) => (
                         <div key={i} style={{ animationDelay: `${i * 30}ms` }} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer animate-in fade-in slide-in-from-bottom-4 flex flex-col justify-between h-full" onClick={() => { setShowAllSpecs(false); setShowDocModal(true); setActiveFilter(spec.title); }}>
                            <div className="flex justify-between items-start mb-6">
                               <div className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-110 duration-500", spec.color)}>
                                  {spec.icon}
                               </div>
                               <div className="text-right">
                                  <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white block leading-none">{spec.active}</span>
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full inline-block mt-1">Live</span>
                               </div>
                            </div>
                            <div>
                               <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-white mb-1 line-clamp-1">{spec.title}</h3>
                               <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">{spec.count} Pakar Medis</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ─── LUMINANCE BACKGROUND (Fixed) ─── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/20 dark:bg-emerald-900/30 rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen transition-all duration-700" />
           <div className="absolute top-[40%] right-[-10%] w-[40%] h-[60%] bg-indigo-500/15 dark:bg-indigo-900/20 rounded-full blur-[150px] mix-blend-multiply dark:mix-blend-screen transition-all duration-700" />
           <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-cyan-400/10 dark:bg-cyan-900/20 rounded-full blur-[130px] mix-blend-multiply dark:mix-blend-screen transition-all duration-700" />
        </div>

        {/* ─── HEADER ─── */}
        <header className="fixed top-0 w-full z-[60] bg-white/50 dark:bg-zinc-950/50 backdrop-blur-3xl border-b border-white/50 dark:border-zinc-800/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-colors duration-700">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
              <div className="w-11 h-11 bg-white rounded-[14px] flex items-center justify-center shadow-lg group-hover:scale-105 group-active:scale-95 transition-transform duration-500 border border-zinc-200/50 overflow-hidden relative">
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img src="/logo-rs.png" alt="Siaga Medika" className="w-full h-full object-contain p-1.5 drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                 <span className="font-black text-zinc-900 dark:text-white tracking-tight text-xl leading-none mt-1">SIAGA MEDIKA</span>
                 <span className="text-emerald-600 dark:text-emerald-500 font-bold text-[10px] tracking-widest uppercase">Purbalingga</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8 font-bold text-sm text-zinc-600 dark:text-zinc-400">
               <span onClick={() => setShowDocModal(true)} className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"><Search size={14} />{t.nav_findDoctor}</span>
               <span onClick={() => coeRef.current?.scrollIntoView({behavior: 'smooth'})} className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t.nav_specialties}</span>
               <span onClick={() => { setInput("Buka Portal Pasien"); setTimeout(() => append({role: 'user', content: 'Buka Portal Pasien'}), 150); }} className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-1.5 px-3 bg-zinc-100 dark:bg-zinc-900 rounded-full">{t.nav_portal} <Sparkles size={12} className="text-emerald-500" /></span>
            </nav>

            <div className="flex flex-row items-center gap-4">
               {/* Context Toggles */}
               <div className="hidden sm:flex items-center bg-white/80 dark:bg-zinc-900/80 rounded-full p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
                 <button 
                   type="button"
                   onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                   className="w-10 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-colors text-zinc-600 dark:text-zinc-300"
                 >
                   {lang === 'id' ? 'ID' : 'EN'}
                 </button>
                 <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
                 <button 
                   type="button"
                   onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                   className="w-10 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
                 >
                   {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                 </button>
               </div>

               <Link href="/login" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-emerald-500 border border-zinc-800 dark:border-emerald-400 text-white dark:text-zinc-900 font-bold text-[13px] rounded-full hover:bg-zinc-800 dark:hover:bg-emerald-400 hover:shadow-xl transition-all shadow-sm">
                  {t.header_admin} <ArrowRight size={15} />
               </Link>

               {/* Mobile Hamburger */}
               <button onClick={() => setMobileMenuOpen(true)} className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white transition-colors">
                  <Menu size={20} />
               </button>
            </div>
          </div>
        </header>

        {/* ─── MOBILE MENU DRAWER ─── */}
        <div className={cn("fixed inset-0 z-[100] bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md transition-all duration-500 md:hidden", mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
           <div className={cn("absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-white dark:bg-zinc-950 shadow-2xl transition-transform duration-500 flex flex-col p-6 border-l border-zinc-200 dark:border-zinc-800", mobileMenuOpen ? "translate-x-0" : "translate-x-full")}>
              <div className="flex justify-between items-center mb-10">
                 <span className="font-black text-xl text-zinc-900 dark:text-white">Menu</span>
                 <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500"><X size={16} /></button>
              </div>
              <div className="flex flex-col gap-6 font-bold text-lg text-zinc-700 dark:text-zinc-300">
                 <span onClick={() => { setMobileMenuOpen(false); setShowDocModal(true); }} className="flex items-center gap-3 cursor-pointer"><Search size={18} className="text-emerald-500" /> {t.nav_findDoctor}</span>
                 <span onClick={() => { setMobileMenuOpen(false); coeRef.current?.scrollIntoView({behavior: 'smooth'}); }} className="flex items-center gap-3 cursor-pointer"><Activity size={18} className="text-emerald-500" /> {t.nav_specialties}</span>
                 <span onClick={() => { setMobileMenuOpen(false); setInput("Buka Portal Pasien"); setTimeout(() => append({role: 'user', content: 'Buka Portal Pasien'}), 150); }} className="flex items-center gap-3 cursor-pointer"><User size={18} className="text-emerald-500" /> {t.nav_portal}</span>
                 
                 <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-2" />
                 
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tema Gelap</span>
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="w-12 h-6 rounded-full bg-zinc-200 dark:bg-emerald-500 relative transition-colors flex items-center px-1">
                       <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300", theme === 'dark' ? "translate-x-6" : "translate-x-0")} />
                    </button>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bahasa</span>
                    <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-md text-sm transition-colors">
                       {lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                    </button>
                 </div>

                 <Link href="/login" className="flex items-center justify-between bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-900 px-5 py-3 rounded-2xl mt-4 shadow-lg hover:-translate-y-1 transition-transform">
                    {t.header_admin} <ArrowRight size={16} />
                 </Link>
              </div>
           </div>
        </div>

        {/* ─── SCROLLING CONTENT WRAPPER ─── */}
        <div className={cn(
           "relative z-10 w-full flex flex-col transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] origin-top",
           hasMessages ? "opacity-0 scale-95 pointer-events-none h-0 overflow-hidden" : "opacity-100 scale-100 min-h-screen pb-[300px]"
        )}>
           
           {/* 1. HERO SECTION (Bento Grid) */}
           <section className="pt-36 pb-20 px-6 lg:px-8 max-w-7xl mx-auto w-full">
              <FadeInView>
                 <div className="mb-8 sm:mb-12 text-center sm:text-left max-w-4xl relative min-h-[280px] sm:min-h-[200px]">
                    {heroSlides.map((slide, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "absolute inset-0 transition-all duration-1000 ease-in-out",
                          index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                        )}
                      >
                         <h1 className="text-5xl sm:text-[72px] font-black tracking-tight text-zinc-900 dark:text-white mb-5 leading-[1.05] transition-colors">
                            {slide.title} <br className="hidden sm:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                              {slide.highlight}
                            </span>
                         </h1>
                         <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-relaxed max-w-2xl transition-colors mx-auto sm:mx-0">
                            {slide.desc}
                         </p>
                      </div>
                    ))}
                 </div>
                 {/* Slider Indicators */}
                 <div className="flex items-center gap-2 mb-10 justify-center sm:justify-start relative z-20">
                    {heroSlides.map((_, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setCurrentSlide(idx)}
                        className={cn("h-1.5 rounded-full transition-all duration-500", idx === currentSlide ? "w-8 bg-emerald-500" : "w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-emerald-300")}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                 </div>
              </FadeInView>

              <FadeInView delay={100}>
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
                    {/* Darurat */}
                    <div className="md:col-span-8 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-300 rounded-[40px] p-10 text-white dark:text-zinc-900 relative overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_60px_rgba(255,255,255,0.05)] hover:-translate-y-1 transition-all duration-700 group cursor-pointer">
                       <div className="absolute right-[-5%] top-[-20%] opacity-20 dark:opacity-10 group-hover:scale-110 transition-transform duration-700">
                          <HeartPulse size={300} strokeWidth={1} />
                       </div>
                       <div className="relative z-10">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 dark:bg-zinc-900/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-white/10 dark:border-zinc-900/10">
                             <span className="w-2 h-2 rounded-full bg-red-400 dark:bg-red-500 animate-pulse"></span> {t.er_badge}
                          </div>
                          <h2 className="text-4xl md:text-5xl font-black mb-4">{t.er_title}</h2>
                          <p className="text-zinc-300 dark:text-zinc-700 md:text-lg mb-10 max-w-md font-medium leading-relaxed">{t.er_desc}</p>
                          <button className="px-8 py-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-full font-black text-sm hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.1)]">
                             {t.er_btn}
                          </button>
                       </div>
                    </div>

                    {/* Dokter Praktik Live Data */}
                    <div className="md:col-span-4 flex flex-col gap-5">
                       <div className="flex-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl border border-white/50 dark:border-zinc-800/50 rounded-[40px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-xl transition-all group flex flex-col cursor-pointer">
                          <div className="flex justify-between items-start mb-6">
                             <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-[20px] flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-500 transition-colors duration-500">
                                <Users size={26} strokeWidth={2.5} />
                             </div>
                             <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>{t.inpatient_avail}</span>
                          </div>
                          
                          <h3 className="font-black text-2xl text-zinc-900 dark:text-white mb-2">{t.inpatient_title}</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed flex-1">{t.inpatient_desc}</p>
                          <div className="mt-4 flex items-center justify-between font-bold text-sm bg-white/80 dark:bg-zinc-950/80 p-4 rounded-2xl border border-white dark:border-zinc-800">
                             <span>{t.inpatient_room}</span>
                             <span className={cn("text-xl bg-gradient-to-br from-zinc-800 to-zinc-600 dark:from-zinc-100 dark:to-zinc-300 text-transparent bg-clip-text font-black", skeletonPulse)}>{activeDoctorsCount}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </FadeInView>
           </section>

           {/* 1.5. QUICK ACCESS ACTION GRID (International Standard) */}
           <section className="relative z-30 max-w-7xl mx-auto px-6 lg:px-8 -mt-6 sm:-mt-10 mb-20">
              <FadeInView delay={300}>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* Card 1 */}
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group cursor-pointer flex flex-col items-center text-center">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-sm">
                          <Activity size={24} strokeWidth={2.5} />
                       </div>
                       <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base mb-1">Medical Check Up</h4>
                       <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Paket MCU Eksekutif</p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group cursor-pointer flex flex-col items-center text-center">
                       <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-sm">
                          <Bed size={24} strokeWidth={2.5} />
                       </div>
                       <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base mb-1">Tarif Kamar VIP</h4>
                       <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Tur Fasilitas Inap</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group cursor-pointer flex flex-col items-center text-center">
                       <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-sm">
                          <Tag size={24} strokeWidth={2.5} />
                       </div>
                       <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base mb-1">Promo Layanan</h4>
                       <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Penawaran Eksklusif</p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group cursor-pointer flex flex-col items-center text-center">
                       <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-500 shadow-sm">
                          <LifeBuoy size={24} strokeWidth={2.5} />
                       </div>
                       <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base mb-1">Pusat Bantuan</h4>
                       <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Informasi Asuransi</p>
                    </div>

                 </div>
              </FadeInView>
           </section>

           {/* 2. CENTERS OF EXCELLENCE (BENTO GRID) */}
           <section ref={coeRef} className="py-24 relative opacity-95">
               <div className="max-w-7xl mx-auto px-6 lg:px-8">
                 <FadeInView>
                    <div className="mb-12 flex justify-between items-end border-b border-zinc-200/60 dark:border-zinc-800/60 pb-8 transition-colors">
                       <div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold tracking-widest text-sm mb-3 uppercase">{t.coe_subtitle}</div>
                          <h2 className="text-4xl md:text-[48px] font-black tracking-tight text-zinc-900 dark:text-white leading-[1.1]">Centers of Excellence<span className="text-zinc-300 dark:text-zinc-700">.</span></h2>
                       </div>
                       <button onClick={() => setShowAllSpecs(true)} className="flex items-center gap-2 font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95">
                          {t.coe_explore} <ChevronRight size={18} />
                       </button>
                    </div>
                 </FadeInView>

                 <FadeInView delay={200}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto">
                       
                       {/* FLAGSHIP ORTHOPEDICS (WIDE CARD) */}
                       <div className="md:col-span-12 lg:col-span-8 bg-gradient-to-br from-emerald-950 to-teal-900 dark:from-zinc-900 dark:to-zinc-950 rounded-[40px] p-8 sm:p-10 shadow-2xl relative overflow-hidden group cursor-pointer border border-emerald-800/30 dark:border-zinc-800 flex flex-col justify-between min-h-[340px]">
                          <div className="absolute right-[-10%] top-[-10%] opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                             <Bone size={400} strokeWidth={1} className="text-emerald-500" />
                          </div>
                          
                          <div className="relative z-10 flex justify-between items-start mb-8">
                             <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-full text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-500/30">
                                   <Sparkles size={12} /> Flagship Institute
                                </div>
                                <h3 className="font-black text-3xl sm:text-4xl text-white mb-2">Orthopaedic & Traumatology Center</h3>
                                <p className="text-emerald-100/70 font-medium max-w-md text-sm sm:text-base">Pusat unggulan bedah tulang, sendi, dan trauma sport medicine dengan kapabilitas operasi invasif minimal bertaraf internasional.</p>
                             </div>
                          </div>

                          {/* Ortho Doctors Highlight */}
                          <div className="relative z-10 bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md border border-white/10 dark:border-zinc-800/50 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                             <div className="flex -space-x-4">
                                {flagshipOrthoDocs.slice(0,3).map((doc, idx) => (
                                   <div key={idx} className="relative group/doc">
                                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-900 overflow-hidden border-2 border-emerald-500 object-cover relative">
                                         {doc.image ? <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" /> : <User size={24} className="m-auto mt-4 text-emerald-300" />}
                                      </div>
                                      {(doc.status === 'PRAKTEK' || doc.status === 'PENDAFTARAN' || doc.status === 'OPERASI') && (
                                         <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-emerald-950 rounded-full animate-pulse" />
                                      )}
                                   </div>
                                ))}
                             </div>
                             <div className="flex-1 text-left sm:pl-4">
                                <p className="text-white font-bold mb-1 line-clamp-2">
                                   {flagshipOrthoDocs.length > 0 ? flagshipOrthoDocs.map(d => d.name.replace('dr. ', '').replace(', Sp.OT', '')).join(' & ') : "Tim Pakar Orthopedi"}
                                </p>
                                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold bg-emerald-950/50 w-fit px-3 py-1 rounded-full border border-emerald-800/50">
                                   <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {flagshipOrthoActive} Pakar Sedang Praktik
                                </div>
                             </div>
                             <button onClick={(e) => {
                                 e.stopPropagation();
                                 setInput(`Buat janji Konsultasi Orthopedi / Bedah Tulang`);
                                 setTimeout(() => append({ role: 'user', content: `Buat janji Konsultasi Orthopedi / Bedah Tulang` }), 300);
                             }} className="shrink-0 px-6 py-3 w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-1">
                                Konsultasi AI
                             </button>
                          </div>
                       </div>

                       {/* OTHER COE CARDS */}
                       {dynamicCOE.map((coe, i) => (
                          <div key={i} className={cn(
                             "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-white dark:border-zinc-800 hover:shadow-2xl dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-500 relative flex flex-col justify-between cursor-pointer group min-h-[280px]",
                             i === 0 ? "md:col-span-12 lg:col-span-4" : "md:col-span-6 lg:col-span-6"
                          )}>
                             <div className="flex justify-between items-start mb-6">
                                <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 duration-500", coe.color, skeletonPulse)}>
                                   {coe.icon}
                                </div>
                                <div className="text-right">
                                   <span className="text-2xl font-black text-zinc-900 dark:text-white block leading-none">{coe.active}</span>
                                   <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full inline-block mt-1">Live</span>
                                </div>
                             </div>
                             
                             {/* Avatar Tumpuk */}
                             {coe.avatars.length > 0 && (
                                <div className="flex -space-x-3 mb-4">
                                   {coe.avatars.map((imgUrl, aIdx) => (
                                     <img key={aIdx} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm" src={imgUrl} alt="Doctor" />
                                   ))}
                                </div>
                             )}

                             <div>
                                <h3 className={cn("font-black text-xl text-zinc-900 dark:text-white mb-2", skeletonPulse)}>{coe.title}</h3>
                                <p className={cn("text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed", skeletonPulse)}>{coe.desc}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </FadeInView>
               </div>
           </section>

           {/* 3. GLOBAL PATIENT SERVICES */}
           <section className="py-32 bg-zinc-900 dark:bg-zinc-950 my-10 relative overflow-hidden rounded-[60px] mx-4 sm:mx-8 border border-zinc-800 dark:border-zinc-900 shadow-2xl transition-colors">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full opacity-[0.03] dark:opacity-[0.05] flex items-center justify-center pointer-events-none">
                  <Globe size={800} strokeWidth={1} className="text-white" />
               </div>
               
               <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10 w-full">
                 <FadeInView>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border-l-4 border-emerald-500 pl-6 md:pl-10 lg:pl-14 py-4">
                       <div>
                          <h2 className="text-5xl md:text-[60px] font-black tracking-tight text-white mb-6 leading-[1.05]">
                             {t.gps_title}
                          </h2>
                          <p className="text-zinc-400 font-medium text-lg leading-relaxed mb-10 max-w-lg">
                             {t.gps_desc}
                          </p>

                          <div className="space-y-5">
                             {t.gps_items.map((item, i) => (
                                 <div key={i} className="flex items-center gap-4">
                                    <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                                    <span className="text-white font-medium">{item}</span>
                                 </div>
                             ))}
                          </div>
                          <button className="mt-12 text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-2 group">
                               {t.gps_btn} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                       </div>
                    </div>
                 </FadeInView>
               </div>
           </section>

           {/* 2.5. PARALLAX VIRTUAL TOUR */}
           <section className="relative py-32 bg-zinc-950 overflow-hidden border-t border-zinc-800">
               {/* Parallax Background */}
               <div 
                  className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center bg-fixed" 
               />
               
               <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center flex flex-col items-center">
                  <FadeInView>
                     <div className="w-20 h-20 bg-emerald-500/20 backdrop-blur-md border-2 border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mb-8 mx-auto hover:bg-emerald-500 hover:text-white transition-all duration-500 cursor-pointer shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-110">
                        <Play size={32} strokeWidth={2.5} className="ml-1" />
                     </div>
                     
                     <div className="text-emerald-400 font-bold tracking-widest text-sm mb-3 uppercase">Jelajahi Fasilitas Kami</div>
                     <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">Experience the Excellence<span className="text-emerald-500">.</span></h2>
                     <p className="text-zinc-300 font-medium text-lg leading-relaxed max-w-2xl mx-auto mb-10">
                        Ambil kendali dan jelajahi setiap sudut kemewahan kamar inap VVIP, kebersihan lobi, hingga kecanggihan ruang operasi Hybrid kami melalui pengalaman 360° yang imersif.
                     </p>
                     
                     <button className="px-8 py-4 bg-white text-zinc-900 rounded-full font-black text-sm hover:scale-105 transition-transform active:scale-95 shadow-xl flex items-center gap-2 mx-auto">
                        Mulai Virtual Tour <ArrowRight size={16} />
                     </button>
                  </FadeInView>
               </div>
           </section>

           {/* 3. HEALTH ARTICLES & EDUCATION CENTER */}
           <section className="py-24 relative bg-zinc-50/50 dark:bg-zinc-900/20 border-y border-zinc-100 dark:border-zinc-800/50">
               <div className="max-w-7xl mx-auto px-6 lg:px-8">
                  <FadeInView>
                     <div className="mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
                        <div>
                           <div className="text-emerald-600 dark:text-emerald-400 font-bold tracking-widest text-sm mb-3 uppercase">Pusat Edukasi</div>
                           <h2 className="text-3xl md:text-[40px] font-black tracking-tight text-zinc-900 dark:text-white leading-[1.1]">Artikel Kesehatan Terkini<span className="text-emerald-500">.</span></h2>
                        </div>
                        <Link href="/publik/artikel" className="flex items-center gap-2 font-bold text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group">
                           Lihat Semua Artikel <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                     </div>
                  </FadeInView>

                  <FadeInView delay={200}>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Article 1 */}
                        <div className="group cursor-pointer">
                           <div className="w-full h-60 bg-zinc-200 dark:bg-zinc-800 rounded-[32px] mb-6 overflow-hidden relative shadow-md">
                              <img src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80" alt="Penelitian Kanker" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Onkologi</div>
                           </div>
                           <p className="text-zinc-400 text-sm font-medium mb-3">18 April 2026 • dr. Ratna Wijayanti, Sp.B(K)Onk</p>
                           <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">Revolusi Pengobatan Kanker Payudara dengan Terapi Target Genetik</h3>
                           <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium line-clamp-2 leading-relaxed">Teknologi onkologi terbaru kini memungkinkan pengobatan kanker payudara yang jauh lebih presisi dan secara signifikan meminimalisir efek samping radiasi konvensional.</p>
                        </div>

                        {/* Article 2 */}
                        <div className="group cursor-pointer">
                           <div className="w-full h-60 bg-zinc-200 dark:bg-zinc-800 rounded-[32px] mb-6 overflow-hidden relative shadow-md">
                              <img src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=800&q=80" alt="Bedah Saraf Ortopedi" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Ortopedi</div>
                           </div>
                           <p className="text-zinc-400 text-sm font-medium mb-3">15 April 2026 • dr. Hendra Cipta, Sp.OT (K) Spine</p>
                           <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">Penanganan Terkini Cedera Saraf Tulang Belakang via Endoskopi Biportal</h3>
                           <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium line-clamp-2 leading-relaxed">Metode operasi invasif minimal BESS (Biportal Endoscopic Spinal Surgery) mempercepat masa pemulihan pasien cedera tulang belakang hingga 3x lipat.</p>
                        </div>

                        {/* Article 3 */}
                        <div className="group cursor-pointer">
                           <div className="w-full h-60 bg-zinc-200 dark:bg-zinc-800 rounded-[32px] mb-6 overflow-hidden relative shadow-md">
                              <img src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80" alt="Kesehatan Mental Anak" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Psikiatri</div>
                           </div>
                           <p className="text-zinc-400 text-sm font-medium mb-3">10 April 2026 • dr. Larasati Putri, Sp.KJ</p>
                           <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">Membangun Ketahanan Mental Anak di Era Disrupsi Digital & Gadget</h3>
                           <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium line-clamp-2 leading-relaxed">Paparan layar (screen time) berlebih telah terbukti mempengaruhi perkembangan korteks prafrontal. Berikut panduan pakar menjaga keseimbangan psikologis anak.</p>
                        </div>
                     </div>
                  </FadeInView>
               </div>
           </section>

           {/* FOOTER - INTERNATIONAL AESTHETIC STANDARD */}
           <footer className="pt-24 pb-48 px-6 lg:px-8 max-w-7xl mx-auto w-full mt-10 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-zinc-200/60 dark:border-zinc-800/60">
                 
                 {/* 1. Identity & Contacts (Col-span-4) */}
                 <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.05)] border border-zinc-100 dark:border-zinc-800 overflow-hidden relative group/logo cursor-pointer">
                          <img src="/logo-rs.png" alt="Logo Siaga Medika" className="w-full h-full object-contain p-1.5 group-hover/logo:scale-110 transition-transform duration-500" />
                       </div>
                       <div className="flex flex-col">
                           <span className="font-black text-zinc-900 dark:text-white text-xl leading-none tracking-tight">SIAGA MEDIKA</span>
                           <span className="text-emerald-600 dark:text-emerald-500 font-bold text-[10px] tracking-widest uppercase mt-1">Purbalingga</span>
                       </div>
                    </div>
                    
                    <div className="space-y-4 mb-8 pr-4">
                       <p className="text-zinc-500 dark:text-zinc-400 font-medium text-[13px] leading-relaxed">
                          Jl. Letnan Sudani, Desa Karangsentul, Kec. Padamara, Kabupaten Purbalingga, Jawa Tengah 53372
                       </p>
                       <div className="flex flex-col gap-2 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300">
                          <span className="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"><Phone size={14} className="text-emerald-500"/> (0281) 65 80400</span>
                          <span className="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"><Mail size={14} className="text-emerald-500"/> siagamedika.pbg@gmail.com</span>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                       <button className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:text-white dark:hover:text-zinc-900 transition-colors active:scale-95 w-fit">
                          <Download size={14} strokeWidth={2.5} /> Antrian Online
                       </button>
                    </div>
                 </div>
                 
                 {/* 2. Company & Links (Col-span-2) */}
                 <div className="lg:col-span-2 lg:col-start-6">
                    <h4 className="font-black text-zinc-900 dark:text-white mb-6 tracking-wide text-sm uppercase">Perusahaan</h4>
                    <ul className="space-y-4 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Sejarah</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Sambutan Direktur</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Visi & Misi</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Struktur Organisasi</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Karir & Rekrutmen</li>
                    </ul>
                 </div>

                 {/* 3. Clinical Services (Col-span-2) */}
                 <div className="lg:col-span-2">
                    <h4 className="font-black text-zinc-900 dark:text-white mb-6 tracking-wide text-sm uppercase">Layanan Klinis</h4>
                    <ul className="space-y-4 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Gawat Darurat (IGD)</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Maternal & Neonatal</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Rawat Inap (IRNA)</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Rawat Jalan (IRJA)</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Pusat Bedah (IBS)</li>
                    </ul>
                 </div>

                 {/* 4. Special Units & Accreditation (Col-span-3) */}
                 <div className="lg:col-span-3">
                    <h4 className="font-black text-zinc-900 dark:text-white mb-6 tracking-wide text-sm uppercase">Unit Khusus</h4>
                    <ul className="space-y-4 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-10">
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Hemodialisis</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Intensive Care Unit (ICU)</li>
                       <li className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Klinik Gigi Spesialistik</li>
                    </ul>

                    {/* Minimalist Accreditation Badge */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-amber-500 font-black text-[10px] leading-none border-2 border-amber-500/20 rounded-full">
                            KARS
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-widest">Paripurna</p>
                            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] mt-0.5">Akreditasi Mutu Nasional</p>
                        </div>
                    </div>
                 </div>

              </div>

              {/* Sub-Footer (Copyright & Socials) */}
              <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
                 <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                   <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                     &copy; 2026 RS Siaga Medika Purbalingga. Hak Cipta Dilindungi.
                   </p>
                   <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                     <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                     <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Terms of Service</span>
                     <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors">Cookie Preferences</span>
                   </div>
                 </div>

                 {/* Social Media Links */}
                 <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500">
                    <div className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors hover:scale-110 active:scale-95"><Instagram size={18} /></div>
                    <div className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors hover:scale-110 active:scale-95"><Linkedin size={18} /></div>
                    <div className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors hover:scale-110 active:scale-95"><Youtube size={18} /></div>
                 </div>
              </div>
           </footer>
        </div>

        {/* ─── CHAT MODE (AI ASSISTANT) ─── */}
        <div className={cn(
          "fixed inset-0 z-40 bg-[#F5F7FA] dark:bg-zinc-950 overflow-y-auto pt-32 pb-48 flex flex-col items-center px-4 sm:px-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          hasMessages ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none translate-y-20 hidden"
        )}>
          <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-700">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex w-full", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "flex gap-4 max-w-[85%] sm:max-w-[75%]",
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}>
                  <div className={cn(
                    "w-10 h-10 shrink-0 rounded-[14px] flex items-center justify-center mt-1 border shadow-sm transition-transform duration-300 hover:scale-105",
                    m.role === 'user' 
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-white dark:border-zinc-800" 
                      : "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border-white/50 dark:border-zinc-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none"
                  )}>
                    {m.role === 'user' ? <User size={18} strokeWidth={2.5} /> : <Sparkles size={20} className="fill-emerald-100 dark:fill-emerald-900/50" strokeWidth={2} />}
                  </div>

                  <div className={cn(
                    "px-6 py-5 text-[15px] leading-relaxed shadow-sm transition-all duration-500 hover:shadow-md",
                    m.role === 'user' 
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[28px] rounded-tr-md shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:shadow-none" 
                      : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl text-zinc-800 dark:text-white rounded-[28px] rounded-tl-md border border-white/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none"
                  )}>
                    {/* Reuse renderText logically */}
                    {m.content.split('\n').map((line, lIdx) => (
                      <span key={lIdx} className="block min-h-[1.2rem]">
                        {line.split(/(\*\*.*?\*\*)/g).map((p, pIdx) => {
                          if (p.startsWith('**') && p.endsWith('**')) {
                            return <strong key={pIdx} className="font-bold text-zinc-900 dark:text-white">{p.slice(2, -2)}</strong>;
                          }
                          return <span key={pIdx}>{p}</span>;
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.content === '' && (
               <div className="flex w-full justify-start animate-in fade-in duration-300">
                  <div className="flex gap-4 max-w-[75%]">
                     <div className="w-10 h-10 shrink-0 rounded-[14px] flex items-center justify-center mt-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/50 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 shadow-sm">
                        <Bot size={20} className="animate-pulse" />
                     </div>
                     <div className="px-6 py-5 rounded-[28px] rounded-tl-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-white/50 dark:border-zinc-800/50 text-zinc-400 flex gap-2.5 items-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none">
                        <span className="w-2.5 h-2.5 bg-emerald-400/60 dark:bg-emerald-600/60 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                        <span className="w-2.5 h-2.5 bg-emerald-400/60 dark:bg-emerald-600/60 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                        <span className="w-2.5 h-2.5 bg-emerald-400/60 dark:bg-emerald-600/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                     </div>
                  </div>
               </div>
            )}
            <div ref={endRef} className="h-1" />
          </div>
        </div>

        {/* ─── FLOATING DYNAMIC OMNIBAR ─── */}
        <div className="fixed bottom-0 left-0 w-full z-[60] pointer-events-none flex justify-center pb-6 sm:pb-8 px-4 transition-all duration-700">
           {/* Background gradient blur at bottom */}
           <div className={cn("absolute inset-0 bg-gradient-to-t from-[#F5F7FA] dark:from-zinc-950 via-[#F5F7FA]/50 dark:via-zinc-950/50 to-transparent pointer-events-none z-0 transition-opacity duration-700", hasMessages ? "opacity-100" : "opacity-0")} />
           
           <div className={cn(
             "pointer-events-auto w-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] relative z-10 flex flex-col items-center group/omni",
             hasMessages ? "max-w-4xl translate-y-6 sm:translate-y-8" : "max-w-2xl focus-within:max-w-4xl hover:max-w-3xl"
           )}>
             
             {/* Floating Chips Suggestion (Diletakkan di atas input bar) */}
             <div className={cn(
                "flex flex-wrap items-center justify-center gap-2 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] w-full px-2",
                hasMessages || input.length > 0 
                  ? "opacity-0 pointer-events-none max-h-0 mb-0 scale-95" 
                  : "opacity-0 pointer-events-none max-h-0 mb-0 scale-95 group-focus-within/omni:opacity-100 group-focus-within/omni:pointer-events-auto group-focus-within/omni:max-h-[200px] group-focus-within/omni:mb-4 group-focus-within/omni:scale-100"
             )}>
               {suggestions.map((sug, i) => (
                 <button
                   key={i}
                   type="button"
                   onClick={() => {
                     setInput(sug.text);
                     setTimeout(() => append({ role: 'user', content: sug.text }), 150);
                   }}
                   className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-white/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-full hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm group/chip"
                 >
                   <span className="text-zinc-400 dark:text-zinc-500 group-hover/chip:text-emerald-500 transition-colors duration-300">{sug.icon}</span>
                   {sug.text}
                 </button>
               ))}
             </div>

             <form 
               onSubmit={handleSubmit} 
               className={cn(
                 "relative flex items-center overflow-hidden w-full transition-all duration-500 bg-white/40 dark:bg-black/40 backdrop-blur-[60px] border border-white/60 dark:border-white/10",
                 hasMessages 
                   ? "rounded-t-[32px] rounded-b-none border-b-0 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)]" 
                   : "rounded-[32px] py-3.5 shadow-[0_20px_40px_rgba(0,0,0,0.08),_0_1px_3px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5),_0_1px_3px_rgba(255,255,255,0.05)_inset] group-focus-within/omni:shadow-[0_30px_80px_rgba(16,185,129,0.15),_0_1px_3px_rgba(255,255,255,0.4)_inset] group-focus-within/omni:-translate-y-1"
               )}
             >
               {/* Siri / Apple Intelligence Edge Glow effect */}
               <div className="absolute inset-0 opacity-0 group-focus-within/omni:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent dark:from-emerald-500/20" />
               <div className="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-focus-within/omni:opacity-100 transition-opacity duration-700" />
               <div className="absolute inset-x-0 -top-px h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-focus-within/omni:opacity-100 transition-opacity duration-700" />
               
               <div className="absolute left-6 text-zinc-400 dark:text-zinc-500 pointer-events-none transition-transform duration-500 group-focus-within/omni:text-emerald-500 group-focus-within/omni:scale-110">
                 {hasMessages ? <Bot size={22} className="text-emerald-500" /> : <Sparkles size={24} strokeWidth={2} />}
               </div>
               
               <input
                 type="text"
                 value={input}
                 onChange={handleInputChange}
                 disabled={isLoading}
                 placeholder={hasMessages ? t.omni_placeholder_chat : t.omni_placeholder_empty}
                 className={cn(
                   "w-full bg-transparent text-zinc-900 dark:text-white font-bold placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none transition-all relative z-10",
                   hasMessages ? "pl-14 pr-16 py-1 text-[15px] sm:text-[16px]" : "pl-[64px] pr-20 py-2 text-[16px] sm:text-[18px]"
                 )}
               />
               <button
                 type="submit"
                 disabled={!input.trim() || isLoading}
                 className={cn(
                   "absolute flex items-center justify-center rounded-full transition-all duration-500 relative z-10 overflow-hidden",
                   hasMessages 
                     ? "right-4 w-10 h-10 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600" 
                     : "right-3 w-12 h-12 shadow-md " + (!input.trim() ? "bg-white dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500" : "bg-emerald-500 text-white dark:text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] rotate-0 hover:scale-105 active:scale-95")
                 )}
               >
                 <div className={cn("transition-transform duration-500", input.trim() ? "rotate-0 scale-100" : "rotate-90 scale-75 opacity-50")}>
                    <Send size={hasMessages ? 18 : 20} className={cn("-ml-0.5", input.trim() ? "translate-x-0" : "-translate-x-1")} strokeWidth={3} />
                 </div>
               </button>
             </form>
           </div>
        </div>
    </div>
  );
}
