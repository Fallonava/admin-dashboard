"use client";

import { useState, useRef } from "react";
import {
  Palette,
  LayoutGrid,
  Paintbrush,
  Sparkles,
  Building2,
  Bookmark,
  Sliders,
  Upload,
  Check,
  Trash2,
  FileDown,
  FileUp,
  Columns2,
  Smartphone,
  Tv,
  Eye,
  PanelTop,
  PhoneCall,
  Save,
  RotateCcw,
  Sparkle,
  Layers,
  Settings2,
  CheckCircle2,
} from "lucide-react";
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
} from "../types";
import { THEME_PRESETS, ASPECT_RATIOS, QUICK_COLOR_PALETTES } from "../constants/themes";

interface StudioSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  themeMode: ThemeType;
  setThemeMode: (t: ThemeType) => void;
  visualStyle: VisualStyle;
  setVisualStyle: (v: VisualStyle) => void;
  cardVariant: CardVariant;
  setCardVariant: (c: CardVariant) => void;
  layoutMode?: LayoutMode;
  setLayoutMode?: (l: LayoutMode) => void;
  aspectRatio: AspectRatioMode;
  setAspectRatio: (a: AspectRatioMode) => void;
  headerStyle: HeaderStyle;
  setHeaderStyle: (h: HeaderStyle) => void;
  footerStyle: FooterStyle;
  setFooterStyle: (f: FooterStyle) => void;
  emblemShape: EmblemShape;
  setEmblemShape: (e: EmblemShape) => void;
  fontTheme: FontTheme;
  setFontTheme: (f: FontTheme) => void;
  cardCornerRadius: number;
  setCardCornerRadius: (r: number) => void;
  headerEmblemIcon: string;
  setHeaderEmblemIcon: (i: string) => void;
  emergencyBadgeText: string;
  setEmergencyBadgeText: (t: string) => void;
  watermarkText: string;
  setWatermarkText: (w: string) => void;
  colors: CustomColors;
  setColors: React.Dispatch<React.SetStateAction<CustomColors>>;
  showLeaveCard: boolean;
  setShowLeaveCard: (b: boolean) => void;
  showFooter: boolean;
  setShowFooter: (b: boolean) => void;
  showQrCode: boolean;
  setShowQrCode: (b: boolean) => void;
  showIgdBadge: boolean;
  setShowIgdBadge: (b: boolean) => void;
  showAccreditation: boolean;
  setShowAccreditation: (b: boolean) => void;
  showHeaderDateBadge: boolean;
  setShowHeaderDateBadge: (b: boolean) => void;
  showStatsBar: boolean;
  setShowStatsBar: (b: boolean) => void;
  showAiEducation: boolean;
  setShowAiEducation: (b: boolean) => void;
  aiTopic: HealthEducationTopic | null;
  onOpenAiModal: () => void;
  hospitalName: string;
  setHospitalName: (n: string) => void;
  hospitalSubtitle: string;
  setHospitalSubtitle: (s: string) => void;
  hotlinePhone: string;
  setHotlinePhone: (p: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (u: string) => void;
  customLogoSrc: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  savedPresets: SavedPreset[];
  newPresetName: string;
  setNewPresetName: (n: string) => void;
  onSavePreset: () => void;
  onLoadPreset: (p: SavedPreset) => void;
  onDeletePreset: (id: string) => void;
  onExportPresets: () => void;
  onImportPresets: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function StudioSidebar(props: StudioSidebarProps) {
  const {
    activeTab,
    setActiveTab,
    themeMode,
    setThemeMode,
    visualStyle,
    setVisualStyle,
    cardVariant,
    setCardVariant,
    layoutMode = "heroSplit",
    setLayoutMode,
    aspectRatio,
    setAspectRatio,
    headerStyle,
    setHeaderStyle,
    footerStyle,
    setFooterStyle,
    emblemShape,
    setEmblemShape,
    fontTheme,
    setFontTheme,
    cardCornerRadius,
    setCardCornerRadius,
    headerEmblemIcon,
    setHeaderEmblemIcon,
    emergencyBadgeText,
    setEmergencyBadgeText,
    watermarkText,
    setWatermarkText,
    colors,
    setColors,
    showLeaveCard,
    setShowLeaveCard,
    showFooter,
    setShowFooter,
    showQrCode,
    setShowQrCode,
    showIgdBadge,
    setShowIgdBadge,
    showAccreditation,
    setShowAccreditation,
    showHeaderDateBadge,
    setShowHeaderDateBadge,
    showStatsBar,
    setShowStatsBar,
    showAiEducation,
    setShowAiEducation,
    aiTopic,
    onOpenAiModal,
    hospitalName,
    setHospitalName,
    hospitalSubtitle,
    setHospitalSubtitle,
    hotlinePhone,
    setHotlinePhone,
    websiteUrl,
    setWebsiteUrl,
    customLogoSrc,
    onLogoUpload,
    onRemoveLogo,
    savedPresets,
    newPresetName,
    setNewPresetName,
    onSavePreset,
    onLoadPreset,
    onDeletePreset,
    onExportPresets,
    onImportPresets,
  } = props;

  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const fileImportRef = useRef<HTMLInputElement | null>(null);

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: "template", label: "Template", icon: Palette },
    { id: "layout", label: "Ukuran & Layout", icon: LayoutGrid },
    { id: "colors", label: "Warna & Efek", icon: Paintbrush },
    { id: "headerFooter", label: "Header / Footer", icon: PanelTop },
    { id: "aiEducation", label: "AI Edukasi", icon: Sparkles },
    { id: "branding", label: "Branding RS", icon: Building2 },
    { id: "presets", label: "Preset", icon: Bookmark },
  ];

  const categories = ["Semua", "Official RS", "Liquid Glass", "Luxury", "Clay 3D", "Editorial Pastel", "Modern Dark"];

  const filteredThemes = Object.values(THEME_PRESETS).filter((t) => {
    if (categoryFilter === "Semua") return true;
    return t.category === categoryFilter;
  });

  return (
    <div className="w-full bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50/70 dark:bg-slate-900/70 p-1.5 gap-1 scrollbar-none shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* ── TAB 1: TEMPLATE ── */}
        {activeTab === "template" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Pilih Template Visual</h4>
              <p className="text-xs text-slate-500">16 Tema desain modern siap pakai untuk berbagai kebutuhan</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {filteredThemes.map((t) => {
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
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/30 ring-2 ring-teal-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Color Preview Swatch */}
                      <div
                        className="w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: `linear-gradient(135deg, ${t.bgStart}, ${t.bgEnd})` }}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-white/60 shadow-inner"
                          style={{ background: t.specBgStart }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{t.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            {t.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{t.description}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: LAYOUT & RATIO ── */}
        {activeTab === "layout" && (
          <div className="space-y-5">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rasio Kanvas / Format Target</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ASPECT_RATIOS) as AspectRatioMode[]).map((rKey) => {
                  const r = ASPECT_RATIOS[rKey];
                  const isSelected = aspectRatio === rKey;
                  return (
                    <button
                      key={rKey}
                      onClick={() => setAspectRatio(rKey)}
                      className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-2 ring-teal-500/20 font-bold text-teal-700 dark:text-teal-300"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-xs">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Variant Styling */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gaya Varian Kartu Dokter</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "smooth", name: "Smooth Material" },
                  { id: "glassFrost", name: "Liquid Glass Frost" },
                  { id: "neumorphic", name: "Clay 3D Neumorphic" },
                  { id: "cyberGlow", name: "Cyber Glow Neon" },
                  { id: "minimalBorder", name: "Minimal Swiss Border" },
                  { id: "accentBar", name: "Retro Accent Bar" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setCardVariant(v.id as CardVariant)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      cardVariant === v.id
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Font Theme */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gaya Tipografi Font</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["sans", "serif", "rounded", "mono"] as FontTheme[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFontTheme(f)}
                    className={`py-2 text-xs rounded-xl border font-bold capitalize transition-all ${
                      fontTheme === f
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Corner Radius */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Sudut Kelengkungan Kartu (Border Radius)</span>
                <span className="text-teal-600">{cardCornerRadius}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={28}
                step={2}
                value={cardCornerRadius}
                onChange={(e) => setCardCornerRadius(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            {/* Emblem Shape */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bentuk Ikon / Avatar</label>
              <div className="grid grid-cols-2 gap-2">
                {(["squircle", "circle"] as EmblemShape[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEmblemShape(s)}
                    className={`py-2 text-xs rounded-xl border font-bold capitalize transition-all ${
                      emblemShape === s
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {s === "squircle" ? "Squircle (iOS)" : "Circle (Bulat)"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: COLORS & STYLING ── */}
        {activeTab === "colors" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Kustomisasi Warna Bebas</h4>
                <p className="text-[11px] text-slate-500">Atur palet warna spesifik sesuai identitas RS</p>
              </div>
              <button
                onClick={() =>
                  setColors((prev) => ({
                    ...prev,
                    useCustom: !prev.useCustom,
                  }))
                }
                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
                  colors.useCustom
                    ? "bg-teal-600 text-white border-teal-600"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {colors.useCustom ? "Mode Kustom Aktif" : "Gunakan Kustom"}
              </button>
            </div>

            {/* Quick Palette Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Palet Cepat:</label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_COLOR_PALETTES.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => {
                      setColors((prev) => ({
                        ...prev,
                        useCustom: true,
                        bgStart: hex,
                        specBgStart: hex,
                        footerBgStart: hex,
                      }));
                    }}
                    className="w-7 h-7 rounded-xl border border-white/40 shadow-sm"
                    style={{ background: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Detailed Color Pickers */}
            <div className="space-y-3 pt-2">
              {[
                { label: "Latar Kanvas (Atas)", key: "bgStart" },
                { label: "Latar Kanvas (Bawah)", key: "bgEnd" },
                { label: "Header (Atas)", key: "headerBgStart" },
                { label: "Header (Bawah)", key: "headerBgEnd" },
                { label: "Teks Judul Header", key: "headerTitle" },
                { label: "Poli Spesialis (Aksen)", key: "specBgStart" },
                { label: "Latar Kartu Dokter", key: "cardBgStart" },
                { label: "Teks Nama Dokter", key: "cardText" },
                { label: "Footer Latar", key: "footerBgStart" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(colors as any)[item.key] || "#0F172A"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setColors((prev) => ({
                          ...prev,
                          useCustom: true,
                          [item.key]: val,
                        }));
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-slate-400 w-16">
                      {(colors as any)[item.key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: HEADER / FOOTER ── */}
        {activeTab === "headerFooter" && (
          <div className="space-y-5">
            {/* Header Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gaya Header</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "officialSplit", name: "Official Split RS" },
                  { id: "islandFloating", name: "Dynamic Island" },
                  { id: "splitBento", name: "Split Bento Box" },
                  { id: "minimalHeadline", name: "Minimal Headline" },
                ].map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setHeaderStyle(h.id as HeaderStyle)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      headerStyle === h.id
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Emblem Icon */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ikon Header</label>
              <div className="flex gap-2">
                {["🏥", "🩺", "⚕️", "🚑", "❤️", "🧬"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setHeaderEmblemIcon(emoji)}
                    className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition-all ${
                      headerEmblemIcon === emoji
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 shadow-sm"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Element Visibility Toggles */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tampilkan Elemen</label>
              {[
                { label: "Badge Akreditasi Paripurna ⭐", val: showAccreditation, set: setShowAccreditation },
                { label: "Footer Informasi Kontak & Hotline", val: showFooter, set: setShowFooter },
                { label: "Banner Tanggal Merah", val: showHeaderDateBadge, set: setShowHeaderDateBadge },
                { label: "Artikel Edukasi Kesehatan AI", val: showAiEducation, set: setShowAiEducation },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.set(e.target.checked)}
                    className="w-4 h-4 rounded accent-teal-600"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: AI HEALTH EDUCATION ── */}
        {activeTab === "aiEducation" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Health Education Infobox</h4>
                <p className="text-[11px] text-slate-500">Materi edukasi medis harian langsung di poster</p>
              </div>
              <input
                type="checkbox"
                checked={showAiEducation}
                onChange={(e) => setShowAiEducation(e.target.checked)}
                className="w-4 h-4 rounded accent-teal-600"
              />
            </div>

            <button
              onClick={onOpenAiModal}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Buka AI Generator Topik Medis
            </button>

            {aiTopic && (
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600">
                    {aiTopic.tag}
                  </span>
                  <span className="text-[10px] text-slate-400">Aktif</span>
                </div>
                <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">{aiTopic.title}</h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{aiTopic.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 6: BRANDING RS ── */}
        {activeTab === "branding" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Identitas Rumah Sakit</h4>
              <p className="text-[11px] text-slate-500">Informasi nama, kontak, dan logo yang dicetak pada poster</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Nama Rumah Sakit</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={hospitalSubtitle}
                  onChange={(e) => setHospitalSubtitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hotline / WhatsApp</label>
                <input
                  type="text"
                  value={hotlinePhone}
                  onChange={(e) => setHotlinePhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              {/* Logo Upload */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Logo Rumah Sakit</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Logo PNG
                  </button>
                  {customLogoSrc && (
                    <button
                      onClick={onRemoveLogo}
                      className="text-xs text-rose-500 font-bold hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: PRESETS ── */}
        {activeTab === "presets" && (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Simpan Preset Kustom</h4>
              <p className="text-[11px] text-slate-500">Simpan kombinasi gaya dan warna favorit untuk digunakan kembali</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Preset..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
              />
              <button
                onClick={onSavePreset}
                className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0"
              >
                Simpan
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold text-slate-500">Preset Tersimpan ({savedPresets.length})</label>
              {savedPresets.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada preset kustom yang disimpan.</p>
              ) : (
                <div className="space-y-2">
                  {savedPresets.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h5>
                        <span className="text-[10px] text-slate-400">{p.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onLoadPreset(p)}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-bold text-xs"
                        >
                          Terapkan
                        </button>
                        <button
                          onClick={() => onDeletePreset(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export / Import JSON */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={onExportPresets}
                className="text-xs text-slate-600 dark:text-slate-400 font-bold hover:text-teal-600 flex items-center gap-1"
              >
                <FileDown className="w-3.5 h-3.5" /> Export JSON
              </button>
              <input
                ref={fileImportRef}
                type="file"
                accept=".json"
                onChange={onImportPresets}
                className="hidden"
              />
              <button
                onClick={() => fileImportRef.current?.click()}
                className="text-xs text-slate-600 dark:text-slate-400 font-bold hover:text-teal-600 flex items-center gap-1"
              >
                <FileUp className="w-3.5 h-3.5" /> Import JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
