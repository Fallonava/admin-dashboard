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
  const [showAiEducation, setShowAiEducation] = useState<boolean>(true);

  // Filter & Search
  const [poliFilter, setPoliFilter] = useState<"all" | "Bedah" | "NonBedah">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Toast / Status states
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

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
    const containerW = previewContainerRef.current.clientWidth - 48;
    const containerH = previewContainerRef.current.clientHeight - 48;
    const ratioSpec = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS.poster;
    
    const scaleW = containerW / ratioSpec.width;
    const scaleH = containerH / ratioSpec.height;
    const optimalScale = Math.min(scaleW, scaleH, 1);
    return Math.max(0.25, Math.min(optimalScale, 1.2));
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
    const dayIdx = selectedDate.getDay();
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDayName = dayNames[dayIdx];

    const selDateStr = selectedDate.toISOString().slice(0, 10);
    const activeLeaves = leaves.filter((l) => {
      const start = new Date(l.startDate).toISOString().slice(0, 10);
      const end = new Date(l.endDate).toISOString().slice(0, 10);
      return selDateStr >= start && selDateStr <= end;
    });

    const leaveDocIds = new Set(activeLeaves.map((l) => l.doctorId));
    const leaveDoctors: LeaveDoctorItem[] = [];

    const specMap: Record<string, DoctorScheduleItem[]> = {};

    for (const doc of doctors) {
      const isLeave = leaveDocIds.has(doc.id);
      const docLeave = activeLeaves.find((l) => l.doctorId === doc.id);

      if (isLeave) {
        leaveDoctors.push({
          doctorName: doc.name,
          specialty: doc.specialty || "Umum",
          replacement: docLeave?.replacementDoctor || null,
        });
      }

      // Find shifts for today by dayIdx
      const docShifts = shifts.filter(
        (s) => s.doctorId === doc.id && s.dayIdx === dayIdx
      );

      if (docShifts.length > 0 || isLeave) {
        const specName = doc.specialty?.toUpperCase() || "POLIKLINIK UMUM";
        if (!specMap[specName]) specMap[specName] = [];

        const timeStr = isLeave
          ? "LIBUR"
          : docShifts
              .map((s) => s.formattedTime || s.extra || "09.00 sd selesai")
              .join("\n") || "09.00 sd selesai";

        specMap[specName].push({
          doctorName: doc.name,
          time: timeStr,
          status: isLeave ? "CUTI" : "PRAKTEK",
          category: doc.category || "Poli",
          replacement: docLeave?.replacementDoctor || null,
        });
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
      scaleFactor: 1.5,
    });
  }, [
    scheduleData,
    selectedDate,
    themeMode,
    visualStyle,
    cardVariant,
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

  const openMobileTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans select-none">
      {/* ── 1. ADAPTIVE TOP APP HEADER ── */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href="/schedules"
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                Studio Poster
              </h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm shrink-0">
                v3.0
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400 truncate">
              Desain poster jadwal dokter & edukasi kesehatan instan
            </p>
          </div>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Date Picker Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1 sm:p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="px-1.5 sm:px-3 flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
              <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600 dark:text-teal-400" />
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
              className="p-1 sm:p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Quick WhatsApp Share Button */}
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
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            title="Bagikan ke WhatsApp"
          >
            <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">{shared ? "Membuka..." : "Share WA"}</span>
          </button>

          {/* Quick Copy */}
          <button
            onClick={async () => {
              if (!canvasRef.current) return;
              const ok = await copyCanvasToClipboard(canvasRef.current);
              if (ok) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="hidden sm:flex p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs items-center gap-1.5 transition-all"
            title="Salin Gambar ke Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span className="hidden lg:inline">{copied ? "Tersalin!" : "Salin"}</span>
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Resolusi Export
                </div>
                <button
                  onClick={() => {
                    if (canvasRef.current) {
                      downloadCanvasImage(canvasRef.current, "poster-jadwal-" + selectedDate.toISOString().slice(0, 10), "png");
                    }
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-teal-600" /> PNG Standar (1x Web)
                  </span>
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
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" /> Retina HD (2x Crisp)
                  </span>
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
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-emerald-500" /> Ultra HD 300 DPI (Print)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. MAIN WORKSPACE ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Desktop Left Sidebar */}
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

        {/* ── 3. INTERACTIVE LIVE CANVAS PREVIEW AREA ── */}
        <div
          ref={previewContainerRef}
          className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-auto bg-slate-200/80 dark:bg-slate-950 relative"
        >
          {/* Floating Viewport Toolbar */}
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <button
              onClick={() => {
                setIsAutoFit(false);
                setZoomLevel((z) => Math.max(0.2, +(z - 0.05).toFixed(2)));
              }}
              className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => {
                setIsAutoFit(true);
                setZoomLevel(calculateAutoFitZoom());
              }}
              className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 px-1.5 sm:px-2 hover:text-teal-600 transition-colors"
              title="Klik untuk Auto Fit Layar"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => {
                setIsAutoFit(false);
                setZoomLevel((z) => Math.min(1.5, +(z + 0.05).toFixed(2)));
              }}
              className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => {
                setIsAutoFit(true);
                setZoomLevel(calculateAutoFitZoom());
              }}
              className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-teal-600 dark:text-teal-400 border-l border-slate-200 dark:border-slate-700 ml-0.5"
              title="Reset Fit Layar"
            >
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Quick Floating AI Generator Trigger on Canvas */}
          <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px] sm:text-xs shadow-md flex items-center gap-1.5 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>AI Edukasi</span>
            </button>
          </div>

          {/* Canvas Wrapper with Smooth CSS Transforms */}
          <div className="my-auto flex items-center justify-center transition-all duration-200">
            <div
              className="shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-300/80 dark:border-slate-800 bg-white"
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

      {/* ── 4. MOBILE FLOATING ACTION BAR (Hanya di Layar Mobile < lg) ── */}
      <div className="lg:hidden shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg px-2 py-1.5 z-30 flex items-center justify-around gap-1 overflow-x-auto">
        <button
          onClick={() => openMobileTab("template")}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === "template" && isMobileDrawerOpen
              ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Palette className="w-4 h-4 mb-0.5" />
          <span>Tema</span>
        </button>

        <button
          onClick={() => openMobileTab("layout")}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === "layout" && isMobileDrawerOpen
              ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Sliders className="w-4 h-4 mb-0.5" />
          <span>Format</span>
        </button>

        <button
          onClick={() => openMobileTab("colors")}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === "colors" && isMobileDrawerOpen
              ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Palette className="w-4 h-4 mb-0.5" />
          <span>Warna</span>
        </button>

        <button
          onClick={() => {
            setIsAiModalOpen(true);
          }}
          className="flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold text-teal-600 dark:text-teal-400"
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-teal-500" />
          <span>AI Edu</span>
        </button>

        <button
          onClick={() => openMobileTab("branding")}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === "branding" && isMobileDrawerOpen
              ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Sliders className="w-4 h-4 mb-0.5" />
          <span>Branding</span>
        </button>

        <button
          onClick={() => openMobileTab("presets")}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === "presets" && isMobileDrawerOpen
              ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Sparkle className="w-4 h-4 mb-0.5" />
          <span>Preset</span>
        </button>
      </div>

      {/* ── 5. MOBILE SETTINGS BOTTOM SHEET DRAWER ── */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[75vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white capitalize">
                  Pengaturan {activeTab}
                </h3>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-4">
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

            {/* Bottom Done Button */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md"
              >
                Terapkan & Lihat Poster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. AI HEALTH EDUCATION MODAL ── */}
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
