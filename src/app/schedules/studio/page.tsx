"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  PhoneCall,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileImage,
  Printer,
  Palette,
  Sliders,
  X,
  Share2,
  Expand,
  RotateCcw,
  Sparkle,
  Layers,
  Settings2,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import type { Doctor, Shift, LeaveRequest } from "@/lib/data-service";
import { getIndonesianHoliday } from "@/lib/holidays";

import {
  ThemeType,
  VisualStyle,
  CardVariant,
  HeaderStyle,
  FooterStyle,
  EmblemShape,
  LeaveCardStyle,
  AvatarMode,
  FontTheme,
  AspectRatioMode,
  LayoutMode,
  ActiveTab,
  CustomColors,
  SavedPreset,
  HealthEducationTopic,
  DoctorScheduleItem,
  LeaveDoctorItem,
} from "./types";

import { DEFAULT_CUSTOM_COLORS, THEME_PRESETS, ASPECT_RATIOS } from "./constants/themes";
import { renderPoster } from "./engine/renderer";
import {
  downloadCanvasImage,
  copyCanvasToClipboard,
  shareDirectWhatsApp,
  renderHighResExport,
} from "./engine/exporter";

import { StudioSidebar } from "./components/StudioSidebar";
import { AiTopicModal } from "./components/AiTopicModal";

export default function PosterStudioPage() {
  // ── 1. ACTIVE STUDIO STATE ──
  const [activeTab, setActiveTab] = useState<ActiveTab>("template");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>("poster");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("heroSplit");
  const [themeMode, setThemeMode] = useState<ThemeType>("siagaOfficial");
  const [visualStyle, setVisualStyle] = useState<VisualStyle>("siagaOfficial");
  const [cardVariant, setCardVariant] = useState<CardVariant>("smooth");
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>("officialSplit");
  const [footerStyle, setFooterStyle] = useState<FooterStyle>("officialBar");
  const [emblemShape, setEmblemShape] = useState<EmblemShape>("squircle");
  const [leaveCardStyle, setLeaveCardStyle] = useState<LeaveCardStyle>("bentoBox");
  const [avatarMode, setAvatarMode] = useState<AvatarMode>("specialtyIcon");
  const [fontTheme, setFontTheme] = useState<FontTheme>("sans");
  const [cardCornerRadius, setCardCornerRadius] = useState<number>(18);
  const [headerEmblemIcon, setHeaderEmblemIcon] = useState<string>("🏥");
  const [emergencyBadgeText, setEmergencyBadgeText] = useState<string>("🚨 IGD & AMBULANS 24 JAM");
  const [watermarkText, setWatermarkText] = useState<string>("");

  // Custom Colors
  const [colors, setColors] = useState<CustomColors>(DEFAULT_CUSTOM_COLORS);

  // Element Toggles
  const [showLeaveCard, setShowLeaveCard] = useState<boolean>(true);
  const [showFooter, setShowFooter] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showIgdBadge, setShowIgdBadge] = useState<boolean>(true);
  const [showAccreditation, setShowAccreditation] = useState<boolean>(true);
  const [showHeaderDateBadge, setShowHeaderDateBadge] = useState<boolean>(true);
  const [showStatsBar, setShowStatsBar] = useState<boolean>(true);
  const [showAiEducation, setShowAiEducation] = useState<boolean>(false);

  // Filter & Search
  const [poliFilter, setPoliFilter] = useState<"all" | "Bedah" | "NonBedah">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Toast / Status states
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Zoom & Preview Viewport
  const [zoomLevel, setZoomLevel] = useState<number>(0.55);
  const [isAutoFit, setIsAutoFit] = useState(true);

  // AI Topic Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState<HealthEducationTopic | null>(null);

  // Custom Branding Settings
  const [hospitalName, setHospitalName] = useState("RSU SIAGA MEDIKA PURBALINGGA");
  const [hospitalSubtitle, setHospitalSubtitle] = useState("JADWAL RESMI PRAKTEK POLIKLINIK & DOKTER SPESIALIS");
  const [accreditationText, setAccreditationText] = useState("⭐ AKREDITASI PARIPURNA KARS");
  const [hotlinePhone, setHotlinePhone] = useState("0823-2344-6076");
  const [websiteUrl, setWebsiteUrl] = useState("simed.fallonava.my.id/jadwal");

  // Logo & Presets
  const [customLogoSrc, setCustomLogoSrc] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const qrImageRef = useRef<HTMLImageElement | null>(null);
  const customLogoImgRef = useRef<HTMLImageElement | null>(null);
  const topicImageImgRef = useRef<HTMLImageElement | null>(null);

  // SWR Data Fetching
  const { data: displayData } = useSWR<{
    doctors: Doctor[];
    shifts: Shift[];
    leaves: LeaveRequest[];
  }>("/api/display", async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal mengambil data jadwal");
    return res.json();
  }, { revalidateOnFocus: false, dedupingInterval: 30000 });

  // Compute Auto-Fit Zoom Scale dynamically
  const calculateAutoFitZoom = useCallback(() => {
    if (!previewContainerRef.current) return 0.55;
    const containerW = previewContainerRef.current.clientWidth - 32;
    const containerH = previewContainerRef.current.clientHeight - 48;
    const ratioSpec = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS.poster;
    
    const scaleW = containerW / ratioSpec.width;
    const scaleH = containerH / ratioSpec.height;
    const optimalScale = Math.min(scaleW, scaleH);
    return Math.max(0.2, Math.min(optimalScale, 1.2));
  }, [aspectRatio]);

  // Adjust zoom on mount & window resize
  useEffect(() => {
    const handleResize = () => {
      if (isAutoFit) {
        setZoomLevel(calculateAutoFitZoom());
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateAutoFitZoom, isAutoFit]);

  // Load Saved Presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nava_studio_presets");
      if (stored) setSavedPresets(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const persistPresets = (presets: SavedPreset[]) => {
    setSavedPresets(presets);
    try {
      localStorage.setItem("nava_studio_presets", JSON.stringify(presets));
    } catch {
      // ignore
    }
  };

  // Custom Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomLogoSrc(dataUrl);
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        customLogoImgRef.current = img;
        triggerCanvasRedraw();
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCustomLogoSrc(null);
    customLogoImgRef.current = null;
    triggerCanvasRedraw();
  };

  // Process Doctor Schedule Items
  const scheduleData = useCallback((): {
    specMap: Record<string, DoctorScheduleItem[]>;
    leaveDoctors: LeaveDoctorItem[];
    holiday?: { name?: string; isHoliday: boolean } | null;
  } => {
    if (!displayData) {
      return { specMap: {}, leaveDoctors: [] };
    }

    const { doctors = [], shifts = [], leaves = [] } = displayData;
    const dayIdx = (selectedDate.getDay() + 6) % 7; // SIMED DB: 0=Senin, 1=Selasa ... 6=Minggu

    const toLocalDateStr = (d: Date | string): string => {
      if (typeof d === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
        if (d.includes("T")) return d.slice(0, 10);
        const dt = new Date(d);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const selDateStr = toLocalDateStr(selectedDate);
    const activeLeaves = leaves.filter((l) => {
      const start = toLocalDateStr(l.startDate);
      const end = toLocalDateStr(l.endDate);
      return selDateStr >= start && selDateStr <= end;
    });

    const leaveDocIds = new Set(activeLeaves.map((l) => l.doctorId));
    const leaveDoctors: LeaveDoctorItem[] = [];

    const specMap: Record<string, DoctorScheduleItem[]> = {};

    for (const doc of doctors) {
      const isLeave = leaveDocIds.has(doc.id);
      const docLeave = activeLeaves.find((l) => l.doctorId === doc.id);

      if (isLeave) {
        // Exclusively add to leaveDoctors list (do NOT display in main schedule)
        leaveDoctors.push({
          doctorName: doc.name,
          specialty: doc.specialty || "Umum",
          replacement: docLeave?.replacementDoctor || null,
        });
      } else {
        // Only active practicing doctors are displayed in main schedule
        const docShifts = shifts.filter(
          (s) => s.doctorId === doc.id && s.dayIdx === dayIdx
        );

        if (docShifts.length > 0) {
          const specName = doc.specialty?.toUpperCase() || "POLIKLINIK UMUM";
          if (!specMap[specName]) specMap[specName] = [];

          const timeStr = docShifts
            .map((s) => s.formattedTime || s.extra || "09.00 sd selesai")
            .join("\n") || "09.00 sd selesai";

          specMap[specName].push({
            doctorName: doc.name,
            time: timeStr,
            status: "PRAKTEK",
            category: doc.category || "Poli",
            replacement: null,
          });
        }
      }
    }

    const holidayInfo = getIndonesianHoliday(selectedDate);

    return { specMap, leaveDoctors, holiday: holidayInfo };
  }, [displayData, selectedDate]);

  // Canvas Redraw Trigger
  const triggerCanvasRedraw = useCallback(() => {
    if (!canvasRef.current) return;
    const data = scheduleData();
    renderPoster(canvasRef.current, data, {
      selectedDate,
      themeMode,
      visualStyle,
      cardVariant,
      layoutMode,
      headerStyle,
      footerStyle,
      emblemShape,
      leaveCardStyle,
      avatarMode,
      fontTheme,
      aspectRatio,
      cardCornerRadius,
      headerEmblemIcon,
      emergencyBadgeText,
      watermarkText,
      colors,
      showLeaveCard,
      showFooter,
      showQrCode,
      showIgdBadge,
      showAccreditation,
      showHeaderDateBadge,
      showStatsBar,
      showAiEducation,
      aiTopic,
      hospitalName,
      hospitalSubtitle,
      accreditationText,
      hotlinePhone,
      websiteUrl,
      customLogoImg: customLogoImgRef.current,
      qrImage: qrImageRef.current,
      topicImageImg: topicImageImgRef.current,
      scaleFactor: 1.5,
    });
  }, [
    scheduleData,
    selectedDate,
    themeMode,
    visualStyle,
    cardVariant,
    layoutMode,
    headerStyle,
    footerStyle,
    emblemShape,
    leaveCardStyle,
    avatarMode,
    fontTheme,
    aspectRatio,
    cardCornerRadius,
    headerEmblemIcon,
    emergencyBadgeText,
    watermarkText,
    colors,
    showLeaveCard,
    showFooter,
    showQrCode,
    showIgdBadge,
    showAccreditation,
    showHeaderDateBadge,
    showStatsBar,
    showAiEducation,
    aiTopic,
    hospitalName,
    hospitalSubtitle,
    accreditationText,
    hotlinePhone,
    websiteUrl,
  ]);

  // Preload Topic Image for AI Health Education Card
  useEffect(() => {
    if (aiTopic?.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = aiTopic.imageUrl;
      img.onload = () => {
        topicImageImgRef.current = img;
        triggerCanvasRedraw();
      };
      img.onerror = () => {
        topicImageImgRef.current = null;
        triggerCanvasRedraw();
      };
    } else {
      topicImageImgRef.current = null;
      triggerCanvasRedraw();
    }
  }, [aiTopic?.imageUrl, triggerCanvasRedraw]);

  useEffect(() => {
    triggerCanvasRedraw();
  }, [triggerCanvasRedraw]);

  // Preset Handlers
  const handleSaveCurrentPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedPreset = {
      id: "preset_" + Date.now(),
      name: newPresetName.trim(),
      date: new Date().toLocaleDateString("id-ID"),
      themeMode,
      visualStyle,
      cardVariant,
      headerStyle,
      footerStyle,
      leaveCardStyle,
      avatarMode,
      fontTheme,
      aspectRatio,
      cardCornerRadius,
      headerEmblemIcon,
      colors: { ...colors },
    };
    persistPresets([newPreset, ...savedPresets]);
    setNewPresetName("");
  };

  const handleLoadPreset = (p: SavedPreset) => {
    setThemeMode(p.themeMode);
    setVisualStyle(p.visualStyle);
    setCardVariant(p.cardVariant);
    setHeaderStyle(p.headerStyle || "officialSplit");
    setFooterStyle(p.footerStyle || "officialBar");
    setLeaveCardStyle(p.leaveCardStyle || "bentoBox");
    setAvatarMode(p.avatarMode || "specialtyIcon");
    setFontTheme(p.fontTheme || "sans");
    setAspectRatio(p.aspectRatio || "poster");
    setCardCornerRadius(p.cardCornerRadius || 18);
    setHeaderEmblemIcon(p.headerEmblemIcon || "🏥");
    setColors({ ...p.colors });
  };

  const handleDeletePreset = (id: string) => {
    persistPresets(savedPresets.filter((p) => p.id !== id));
  };

  const handleExportPresetsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedPresets, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "nava-studio-presets-" + Date.now() + ".json");
    dlAnchor.click();
  };

  const handleImportPresetsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) persistPresets([...parsed, ...savedPresets]);
      } catch (err) {
        alert("Format JSON tidak valid!");
      }
    };
    reader.readAsText(file);
  };

  // Date Navigators
  const changeDateByDays = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const openTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F2F2F7] dark:bg-[#000000] font-sans select-none text-slate-900 dark:text-slate-100">
      {/* ── 1. NATIVE APPLE iOS 27 HEADER BAR ── */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/schedules"
            className="flex items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-teal-600 dark:text-teal-400 font-bold text-xs transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
                Studio Poster
              </h1>
              <span className="text-[9px] uppercase font-black tracking-wider bg-teal-500/15 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-full border border-teal-500/20">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Center Date Picker Capsule */}
        <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-full p-1 border border-black/5 dark:border-white/10 shadow-inner">
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-all active:scale-90"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="px-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
            <CalendarIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              {selectedDate.toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <button
            onClick={() => changeDateByDays(1)}
            className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-all active:scale-90"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick WhatsApp Share */}
          <button
            onClick={async () => {
              if (!canvasRef.current) return;
              const { specMap, leaveDoctors } = scheduleData();
              setShared(true);
              await shareDirectWhatsApp(canvasRef.current, {
                selectedDate,
                hospitalName,
                hotlinePhone,
                websiteUrl,
                specMap,
                leaveDoctors,
              });
              setTimeout(() => setShared(false), 2000);
            }}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Bagikan ke WhatsApp"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{shared ? "Membuka..." : "Share WA"}</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="p-2 sm:px-3.5 sm:py-1.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                <button
                  onClick={() => {
                    if (canvasRef.current) {
                      downloadCanvasImage(canvasRef.current, "poster-jadwal-" + selectedDate.toISOString().slice(0, 10), "png");
                    }
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  <FileImage className="w-4 h-4 text-teal-600" /> PNG Standar (1x Web)
                </button>
                <button
                  onClick={() => {
                    const data = scheduleData();
                    renderHighResExport(
                      renderPoster,
                      data,
                      {
                        selectedDate,
                        themeMode,
                        visualStyle,
                        cardVariant,
                        layoutMode,
                        headerStyle,
                        footerStyle,
                        emblemShape,
                        leaveCardStyle,
                        avatarMode,
                        fontTheme,
                        aspectRatio,
                        cardCornerRadius,
                        headerEmblemIcon,
                        emergencyBadgeText,
                        watermarkText,
                        colors,
                        showLeaveCard,
                        showFooter,
                        showQrCode,
                        showIgdBadge,
                        showAccreditation,
                        showHeaderDateBadge,
                        showStatsBar,
                        showAiEducation,
                        aiTopic,
                        hospitalName,
                        hospitalSubtitle,
                        accreditationText,
                        hotlinePhone,
                        websiteUrl,
                        customLogoImg: customLogoImgRef.current,
                        qrImage: qrImageRef.current,
                      },
                      2,
                      "poster-jadwal-" + selectedDate.toISOString().slice(0, 10)
                    );
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Retina HD (2x Crisp)
                </button>
                <button
                  onClick={() => {
                    const data = scheduleData();
                    renderHighResExport(
                      renderPoster,
                      data,
                      {
                        selectedDate,
                        themeMode,
                        visualStyle,
                        cardVariant,
                        layoutMode,
                        headerStyle,
                        footerStyle,
                        emblemShape,
                        leaveCardStyle,
                        avatarMode,
                        fontTheme,
                        aspectRatio,
                        cardCornerRadius,
                        headerEmblemIcon,
                        emergencyBadgeText,
                        watermarkText,
                        colors,
                        showLeaveCard,
                        showFooter,
                        showQrCode,
                        showIgdBadge,
                        showAccreditation,
                        showHeaderDateBadge,
                        showStatsBar,
                        showAiEducation,
                        aiTopic,
                        hospitalName,
                        hospitalSubtitle,
                        accreditationText,
                        hotlinePhone,
                        websiteUrl,
                        customLogoImg: customLogoImgRef.current,
                        qrImage: qrImageRef.current,
                      },
                      3,
                      "poster-jadwal-" + selectedDate.toISOString().slice(0, 10)
                    );
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  <Printer className="w-4 h-4 text-emerald-500" /> Ultra HD 300 DPI (Cetak)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. QUICK HORIZONTAL THEME PICKER PILLS ── */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0 z-20">
        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider shrink-0 pl-1">
          Tema:
        </span>
        {Object.values(THEME_PRESETS).map((t) => {
          const isSelected = themeMode === t.id && !colors.useCustom;
          return (
            <button
              key={t.id}
              onClick={() => {
                setThemeMode(t.id);
                setVisualStyle(t.visualStyle);
                setCardVariant(t.cardVariant);
                setColors((prev) => ({ ...prev, useCustom: false }));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                isSelected
                  ? "border-teal-500 bg-teal-500 text-white shadow-md shadow-teal-500/20"
                  : "border-black/5 dark:border-white/10 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
              }`}
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/80 shadow-inner"
                style={{ background: `linear-gradient(135deg, ${t.specBgStart}, ${t.specBgEnd})` }}
              />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. MAIN WORKSPACE AREA ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Desktop Sidebar */}
        {desktopSidebarOpen && (
          <div className="hidden lg:block w-[380px] xl:w-[420px] h-full shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
            <StudioSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              visualStyle={visualStyle}
              setVisualStyle={setVisualStyle}
              cardVariant={cardVariant}
              setCardVariant={setCardVariant}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              headerStyle={headerStyle}
              setHeaderStyle={setHeaderStyle}
              footerStyle={footerStyle}
              setFooterStyle={setFooterStyle}
              emblemShape={emblemShape}
              setEmblemShape={setEmblemShape}
              fontTheme={fontTheme}
              setFontTheme={setFontTheme}
              cardCornerRadius={cardCornerRadius}
              setCardCornerRadius={setCardCornerRadius}
              headerEmblemIcon={headerEmblemIcon}
              setHeaderEmblemIcon={setHeaderEmblemIcon}
              emergencyBadgeText={emergencyBadgeText}
              setEmergencyBadgeText={setEmergencyBadgeText}
              watermarkText={watermarkText}
              setWatermarkText={setWatermarkText}
              colors={colors}
              setColors={setColors}
              showLeaveCard={showLeaveCard}
              setShowLeaveCard={setShowLeaveCard}
              showFooter={showFooter}
              setShowFooter={setShowFooter}
              showQrCode={showQrCode}
              setShowQrCode={setShowQrCode}
              showIgdBadge={showIgdBadge}
              setShowIgdBadge={setShowIgdBadge}
              showAccreditation={showAccreditation}
              setShowAccreditation={setShowAccreditation}
              showHeaderDateBadge={showHeaderDateBadge}
              setShowHeaderDateBadge={setShowHeaderDateBadge}
              showStatsBar={showStatsBar}
              setShowStatsBar={setShowStatsBar}
              showAiEducation={showAiEducation}
              setShowAiEducation={setShowAiEducation}
              aiTopic={aiTopic}
              onOpenAiModal={() => setIsAiModalOpen(true)}
              hospitalName={hospitalName}
              setHospitalName={setHospitalName}
              hospitalSubtitle={hospitalSubtitle}
              setHospitalSubtitle={setHospitalSubtitle}
              hotlinePhone={hotlinePhone}
              setHotlinePhone={setHotlinePhone}
              websiteUrl={websiteUrl}
              setWebsiteUrl={setWebsiteUrl}
              customLogoSrc={customLogoSrc}
              onLogoUpload={handleLogoUpload}
              onRemoveLogo={handleRemoveLogo}
              savedPresets={savedPresets}
              newPresetName={newPresetName}
              setNewPresetName={setNewPresetName}
              onSavePreset={handleSaveCurrentPreset}
              onLoadPreset={handleLoadPreset}
              onDeletePreset={handleDeletePreset}
              onExportPresets={handleExportPresetsJson}
              onImportPresets={handleImportPresetsJson}
            />
          </div>
        )}

        {/* ── 4. LIVE INTERACTIVE CANVAS PREVIEW ── */}
        <div
          ref={previewContainerRef}
          className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-auto bg-[#E5E5EA] dark:bg-[#121214] relative"
        >
          {/* Floating Viewport Toolbar (Top Right) */}
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-1 rounded-full border border-black/5 dark:border-white/10 shadow-lg">
            <button
              onClick={() => {
                setIsAutoFit(false);
                setZoomLevel((z) => Math.max(0.2, +(z - 0.05).toFixed(2)));
              }}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-slate-600 dark:text-slate-300 active:scale-90"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsAutoFit(true);
                setZoomLevel(calculateAutoFitZoom());
              }}
              className="text-[10px] sm:text-xs font-bold px-2 text-teal-600 dark:text-teal-400"
              title="Auto Fit"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => {
                setIsAutoFit(false);
                setZoomLevel((z) => Math.min(1.5, +(z + 0.05).toFixed(2)));
              }}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-slate-600 dark:text-slate-300 active:scale-90"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsAutoFit(true);
                setZoomLevel(calculateAutoFitZoom());
              }}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-teal-600 dark:text-teal-400 border-l border-black/10 dark:border-white/10 ml-0.5"
              title="Reset Layar"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Floating AI Generator Pill (Top Left) */}
          <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-md flex items-center gap-1.5 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>AI Edukasi</span>
            </button>
          </div>

          {/* Canvas Render Element */}
          <div className="my-auto flex items-center justify-center transition-transform duration-150">
            <div
              className="shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl sm:rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 bg-white"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
              }}
            >
              <canvas ref={canvasRef} className="block max-w-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. NATIVE iOS 27 FLOATING ACTION DOCK (MOBILE ONLY) ── */}
      <div className="lg:hidden shrink-0 border-t border-black/5 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl px-3 py-2 z-30 flex items-center justify-around gap-1 pb-[calc(env(safe-area-inset-bottom,0)+8px)]">
        {[
          { id: "template", label: "Tema", icon: Palette },
          { id: "layout", label: "Format", icon: Sliders },
          { id: "colors", label: "Warna", icon: Palette },
          { id: "headerFooter", label: "Header", icon: Layers },
          { id: "branding", label: "Branding", icon: Settings2 },
          { id: "presets", label: "Preset", icon: Sparkle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && isMobileDrawerOpen;
          return (
            <button
              key={tab.id}
              onClick={() => openTab(tab.id as ActiveTab)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-2xl text-[10px] font-extrabold transition-all active:scale-90 ${
                isActive
                  ? "text-teal-600 dark:text-teal-400 bg-teal-500/15"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 6. NATIVE iOS 27 BOTTOM SHEET DRAWER (MOBILE) ── */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-[32px] max-h-[82vh] flex flex-col overflow-hidden shadow-2xl border-t border-black/10 dark:border-white/10 animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber Bar */}
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-slate-400/40 rounded-full" />
            </div>

            {/* Sheet Title */}
            <div className="px-4 py-2 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white capitalize">
                Kustomisasi ({activeTab})
              </h3>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Content Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-900">
              <StudioSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                visualStyle={visualStyle}
                setVisualStyle={setVisualStyle}
                cardVariant={cardVariant}
                setCardVariant={setCardVariant}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                headerStyle={headerStyle}
                setHeaderStyle={setHeaderStyle}
                footerStyle={footerStyle}
                setFooterStyle={setFooterStyle}
                emblemShape={emblemShape}
                setEmblemShape={setEmblemShape}
                fontTheme={fontTheme}
                setFontTheme={setFontTheme}
                cardCornerRadius={cardCornerRadius}
                setCardCornerRadius={setCardCornerRadius}
                headerEmblemIcon={headerEmblemIcon}
                setHeaderEmblemIcon={setHeaderEmblemIcon}
                emergencyBadgeText={emergencyBadgeText}
                setEmergencyBadgeText={setEmergencyBadgeText}
                watermarkText={watermarkText}
                setWatermarkText={setWatermarkText}
                colors={colors}
                setColors={setColors}
                showLeaveCard={showLeaveCard}
                setShowLeaveCard={setShowLeaveCard}
                showFooter={showFooter}
                setShowFooter={setShowFooter}
                showQrCode={showQrCode}
                setShowQrCode={setShowQrCode}
                showIgdBadge={showIgdBadge}
                setShowIgdBadge={setShowIgdBadge}
                showAccreditation={showAccreditation}
                setShowAccreditation={setShowAccreditation}
                showHeaderDateBadge={showHeaderDateBadge}
                setShowHeaderDateBadge={setShowHeaderDateBadge}
                showStatsBar={showStatsBar}
                setShowStatsBar={setShowStatsBar}
                showAiEducation={showAiEducation}
                setShowAiEducation={setShowAiEducation}
                aiTopic={aiTopic}
                onOpenAiModal={() => {
                  setIsMobileDrawerOpen(false);
                  setIsAiModalOpen(true);
                }}
                hospitalName={hospitalName}
                setHospitalName={setHospitalName}
                hospitalSubtitle={hospitalSubtitle}
                setHospitalSubtitle={setHospitalSubtitle}
                hotlinePhone={hotlinePhone}
                setHotlinePhone={setHotlinePhone}
                websiteUrl={websiteUrl}
                setWebsiteUrl={setWebsiteUrl}
                customLogoSrc={customLogoSrc}
                onLogoUpload={handleLogoUpload}
                onRemoveLogo={handleRemoveLogo}
                savedPresets={savedPresets}
                newPresetName={newPresetName}
                setNewPresetName={setNewPresetName}
                onSavePreset={handleSaveCurrentPreset}
                onLoadPreset={handleLoadPreset}
                onDeletePreset={handleDeletePreset}
                onExportPresets={handleExportPresetsJson}
                onImportPresets={handleImportPresetsJson}
              />
            </div>

            {/* Bottom Done Action */}
            <div className="p-3 border-t border-black/5 dark:border-white/10 bg-[#F2F2F7] dark:bg-[#1C1C1E] pb-[calc(env(safe-area-inset-bottom,0)+12px)]">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition-all active:scale-98"
              >
                Selesai & Lihat Poster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. AI TOPIC MODAL ── */}
      <AiTopicModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentTopic={aiTopic}
        onApplyTopic={(t) => {
          setAiTopic(t);
          setShowAiEducation(true);
        }}
        dayIdx={selectedDate.getDay()}
      />
    </div>
  );
}
