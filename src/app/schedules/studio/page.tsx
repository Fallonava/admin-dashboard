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

import { DEFAULT_CUSTOM_COLORS } from "./constants/themes";
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
  const [themeMode, setThemeMode] = useState<ThemeType>("liquidGlass");
  const [visualStyle, setVisualStyle] = useState<VisualStyle>("liquidGlass");
  const [cardVariant, setCardVariant] = useState<CardVariant>("glassFrost");
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>("islandFloating");
  const [footerStyle, setFooterStyle] = useState<FooterStyle>("bentoHub");
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

  // Zoom & Preview Viewport
  const [zoomLevel, setZoomLevel] = useState<number>(0.65);

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
  const qrImageRef = useRef<HTMLImageElement | null>(null);
  const customLogoImgRef = useRef<HTMLImageElement | null>(null);

  // SWR Data Fetching
  const { data: rawShifts } = useSWR<Shift[]>("/api/shifts");
  const { data: rawDoctors } = useSWR<Doctor[]>("/api/doctors");
  const { data: rawLeaves } = useSWR<LeaveRequest[]>("/api/leaves");

  const shifts = Array.isArray(rawShifts) ? rawShifts : [];
  const doctors = Array.isArray(rawDoctors) ? rawDoctors : [];
  const leaves = Array.isArray(rawLeaves) ? rawLeaves : [];

  // Load Saved Presets on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nava_studio_presets_v3");
      if (stored) setSavedPresets(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const persistPresets = (list: SavedPreset[]) => {
    setSavedPresets(list);
    try {
      localStorage.setItem("nava_studio_presets_v3", JSON.stringify(list));
    } catch (e) {}
  };

  // Preload QR Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://" + websiteUrl;
    img.onload = () => {
      qrImageRef.current = img;
      triggerCanvasRedraw();
    };
  }, [websiteUrl]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomLogoSrc(result);
      const img = new Image();
      img.src = result;
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

  // Compute Schedule Data
  const scheduleData = useCallback(() => {
    const dayIdx = (selectedDate.getDay() + 6) % 7;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    const holiday = getIndonesianHoliday(selectedDate);

    const activeShifts = shifts.filter((s) => s.dayIdx === dayIdx);
    const specMap: Record<string, DoctorScheduleItem[]> = {};
    const leaveDoctors: LeaveDoctorItem[] = [];

    activeShifts.forEach((s) => {
      const doc = doctors.find((d) => d.id === s.doctorId);
      if (!doc) return;

      if (poliFilter !== "all" && (doc.category || "NonBedah") !== poliFilter) return;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(q);
        const matchSpec = (doc.specialty || "").toLowerCase().includes(q);
        if (!matchName && !matchSpec) return;
      }

      const matchingLeave = leaves.find(
        (l) =>
          (l.doctorId === doc.id || (l.doctor && l.doctor === doc.name)) &&
          new Date(l.startDate) <= selectedDate &&
          new Date(l.endDate || l.startDate) >= selectedDate
      );

      const isCuti = (s.disabledDates || []).includes(dateStr) || Boolean(matchingLeave);
      let status = isCuti ? "CUTI" : (doc.status || "PRAKTEK");
      const specName = (doc.specialty || "Umum").replace(/Spesialis\\s*/i, "").replace(/Poli\\s*/i, "").trim().toUpperCase();

      if (isCuti) {
        leaveDoctors.push({
          doctorName: doc.name,
          specialty: specName,
          replacement: matchingLeave ? (matchingLeave.replacementDoctor || null) : null,
        });
      }

      if (!specMap[specName]) specMap[specName] = [];
      specMap[specName].push({
        doctorName: doc.name,
        time: s.formattedTime || s.title || "Jam 08.00 sd Selesai",
        status: status.toUpperCase(),
        category: doc.category || "NonBedah",
        replacement: matchingLeave ? (matchingLeave.replacementDoctor || null) : null,
      });
    });

    return { specMap, leaveDoctors, holiday };
  }, [selectedDate, doctors, shifts, leaves, poliFilter, searchQuery]);

  // Main Canvas Render trigger
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
    setHeaderStyle(p.headerStyle || "islandFloating");
    setFooterStyle(p.footerStyle || "bentoHub");
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* Top App Header */}
      <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/schedules"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Studio Poster Generator</h1>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                Pro v3.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Desain poster jadwal dokter & edukasi kesehatan instan</p>
          </div>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Date Picker Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <CalendarIcon className="w-3.5 h-3.5 text-sky-500" />
              {selectedDate.toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Direct WhatsApp Share */}
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
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            {shared ? "Membuka WA..." : "Share WhatsApp"}
          </button>

          {/* Quick Copy to Clipboard */}
          <button
            onClick={async () => {
              if (!canvasRef.current) return;
              const ok = await copyCanvasToClipboard(canvasRef.current);
              if (ok) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Tersalin!" : "Salin Gambar"}
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Export HD
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Pilihan Resolusi Export
                </div>
                <button
                  onClick={() => {
                    if (canvasRef.current) {
                      downloadCanvasImage(canvasRef.current, "poster-jadwal-" + selectedDate.toISOString().slice(0, 10), "png");
                    }
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-sky-500" /> PNG Standar (1x Web)
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
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-bold text-slate-800 dark:text-slate-200"
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
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-emerald-500" /> Ultra HD 300 DPI (A4/A3 Print)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace: Sidebar Controls + Interactive Canvas Preview */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar Controls */}
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

        {/* Right Canvas Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-between p-6 overflow-auto bg-slate-200/70 dark:bg-slate-950/80 relative">
          {/* Zoom & Viewport Bar */}
          <div className="absolute top-6 right-6 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.3, z - 0.1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2 min-w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(0.65)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 ml-1"
              title="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div className="my-auto transition-transform duration-150 flex items-center justify-center">
            <div
              className="shadow-2xl rounded-3xl overflow-hidden border border-slate-300/80 dark:border-slate-800 bg-white"
              style={{
                transform: "scale(" + zoomLevel + ")",
                transformOrigin: "center center",
              }}
            >
              <canvas ref={canvasRef} className="block max-w-none" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Health Education Modal */}
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
