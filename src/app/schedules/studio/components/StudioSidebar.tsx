"use client";

import { useRef } from "react";
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

  return (
    <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-xl z-20">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/50 p-1.5 gap-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
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
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* ── TAB 1: TEMPLATE ── */}
        {activeTab === "template" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Pilih Template Visual</h4>
              <p className="text-xs text-slate-500">Preset tema dengan tata letak warna dan gaya visual siap pakai</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
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
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 ring-2 ring-sky-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color Preview Swatch */}
                      <div
                        className="w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${t.bgStart}, ${t.bgEnd})` }}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-white/50"
                          style={{ background: t.specBgStart }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{t.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {t.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{t.description}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-500 shrink-0" />}
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
                          ? "border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 ring-2 ring-sky-500/20 font-bold text-sky-600 dark:text-sky-400"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-xs">{r.name}</span>
                    </button>
                  );
                })}
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
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
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
                <span className="text-sky-600">{cardCornerRadius}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={28}
                step={2}
                value={cardCornerRadius}
                onChange={(e) => setCardCornerRadius(Number(e.target.value))}
                className="w-full accent-sky-500"
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
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
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
                    ? "bg-sky-500 text-white border-sky-500"
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
                  { id: "islandFloating", label: "Dynamic Island (Floating)" },
                  { id: "splitBento", label: "Split Bento Box" },
                ].map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setHeaderStyle(h.id as HeaderStyle)}
                    className={`p-2.5 text-xs rounded-xl border font-bold text-left transition-all ${
                      headerStyle === h.id
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emblem Icon */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ikon Simbol Header</label>
              <div className="flex gap-2">
                {["🏥", "🩺", "❤️", "⭐", "+"].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setHeaderEmblemIcon(icon)}
                    className={`w-10 h-10 rounded-xl border text-base flex items-center justify-center transition-all ${
                      headerEmblemIcon === icon
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Badge Darurat 24 Jam</label>
                <input
                  type="checkbox"
                  checked={showIgdBadge}
                  onChange={(e) => setShowIgdBadge(e.target.checked)}
                  className="rounded accent-sky-500"
                />
              </div>
              <input
                type="text"
                value={emergencyBadgeText}
                onChange={(e) => setEmergencyBadgeText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Visibilitas Elemen</label>
              {[
                { label: "Tampilkan Footer Kontak & Web", val: showFooter, set: setShowFooter },
                { label: "Tampilkan QR Code Registrasi", val: showQrCode, set: setShowQrCode },
                { label: "Tampilkan Badge Tanggal & Libur SKB", val: showHeaderDateBadge, set: setShowHeaderDateBadge },
                { label: "Tampilkan Baris Statistik Dokter Hadir", val: showStatsBar, set: setShowStatsBar },
                { label: "Tampilkan Box Dokter Cuti Hari Ini", val: showLeaveCard, set: setShowLeaveCard },
              ].map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">{t.label}</span>
                  <input
                    type="checkbox"
                    checked={t.val}
                    onChange={(e) => t.set(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: AI HEALTH EDUCATION ── */}
        {activeTab === "aiEducation" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500" />
                AI Health Education Infobox
              </h4>
              <p className="text-xs text-slate-500">
                Tambahkan materi edukasi kesehatan harian otomatis langsung pada poster
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Tampilkan Box Edukasi di Poster</span>
              <input
                type="checkbox"
                checked={showAiEducation}
                onChange={(e) => setShowAiEducation(e.target.checked)}
                className="rounded accent-sky-500 w-4 h-4"
              />
            </div>

            <button
              onClick={onOpenAiModal}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Buka AI Topic Generator & Custom Prompt
            </button>

            {aiTopic && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500 text-white">
                  {aiTopic.tag}
                </span>
                <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">{aiTopic.title}</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{aiTopic.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 6: BRANDING RS ── */}
        {activeTab === "branding" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Kustomisasi Branding RS</h4>
              <p className="text-xs text-slate-500">Sesuaikan nama instansi, logo, dan nomor kontak resmi</p>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Logo Rumah Sakit</label>
              <div className="flex items-center gap-3">
                {customLogoSrc ? (
                  <div className="relative group">
                    <img
                      src={customLogoSrc}
                      alt="Logo RS"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                    />
                    <button
                      onClick={onRemoveLogo}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:border-sky-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-sky-500" />
                    Upload Logo Resmi (PNG/JPG)
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Hospital Name & Subtitle */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Rumah Sakit</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sub-Judul Header</label>
                <input
                  type="text"
                  value={hospitalSubtitle}
                  onChange={(e) => setHospitalSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hotline WhatsApp Pendaftaran</label>
                <input
                  type="text"
                  value={hotlinePhone}
                  onChange={(e) => setHotlinePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Website URL (Untuk QR Code)</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teks Watermark Bawah</label>
                <input
                  type="text"
                  placeholder="Opsional (contoh: DOKUMEN RESMI RS SIAGA MEDIKA)"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: PRESETS ── */}
        {activeTab === "presets" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Manajer Preset Tersimpan</h4>
              <p className="text-xs text-slate-500">Simpan konfigurasi desain poster favorit Anda</p>
            </div>

            {/* Save New Preset */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Preset Baru..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                onClick={onSavePreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-600 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan
              </button>
            </div>

            {/* Saved Presets List */}
            <div className="space-y-2 pt-2">
              {savedPresets.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                  Belum ada preset tersimpan.
                </div>
              ) : (
                savedPresets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h5>
                      <span className="text-[10px] text-slate-400">{p.date} • {p.themeMode}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onLoadPreset(p)}
                        className="px-2.5 py-1 text-xs font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg"
                      >
                        Terapkan
                      </button>
                      <button
                        onClick={() => onDeletePreset(p.id)}
                        className="p-1 text-red-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Import / Export JSON */}
            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={onExportPresets}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" /> Export JSON
              </button>
              <button
                onClick={() => fileImportRef.current?.click()}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
              >
                <FileUp className="w-3.5 h-3.5" /> Import JSON
              </button>
              <input
                ref={fileImportRef}
                type="file"
                accept=".json"
                onChange={onImportPresets}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
