export type ThemeType =
  | "siagaOfficial"
  | "liquidGlass"
  | "luxuryGold"
  | "swissModern"
  | "cyberEmerald"
  | "hyperViolet"
  | "oceanBlue"
  | "tokyoNeon"
  | "nordicCream"
  | "matchaZen"
  | "sunsetQuartz"
  | "mochaVelvet"
  | "deepCobalt"
  | "snowTitanium"
  | "sakuraBlush"
  | "solarAmber";

export type LayoutMode = "matrix2" | "heroSplit" | "compact3" | "singleStack";

export type VisualStyle =
  | "siagaOfficial"
  | "liquidGlass"
  | "clay3d"
  | "luxuryGold"
  | "monochromeSwiss"
  | "neonNoir"
  | "warmTerra"
  | "sakuraZen"
  | "auroraBorealis"
  | "vintageBotanical"
  | "metallicTitanium";

export type CardVariant =
  | "smooth"
  | "accentBar"
  | "neumorphic"
  | "glassFrost"
  | "retroBadge"
  | "cyberGlow"
  | "minimalBorder"
  | "floatingPill";

export type HeaderStyle = "officialSplit" | "islandFloating" | "splitBento" | "minimalHeadline" | "glassNotch";
export type FooterStyle = "officialBar" | "bentoHub" | "floatingPillBar" | "splitActionStrip" | "minimalStrip";
export type EmblemShape = "squircle" | "circle" | "hexagon";
export type LeaveCardStyle = "bentoBox" | "cautionStrip" | "minimalPill" | "glowFrame";
export type AvatarMode = "specialtyIcon" | "monogram" | "doctorAvatar";
export type FontTheme = "sans" | "serif" | "mono" | "rounded";
export type AspectRatioMode = "poster" | "story" | "feed" | "portraitFeed" | "landscape";
export type ActiveTab = "template" | "layout" | "colors" | "headerFooter" | "aiEducation" | "branding" | "presets";

export interface CustomColors {
  useCustom: boolean;
  // Canvas BG
  bgStart: string;
  bgEnd: string;
  bgGlow: string;
  // Header
  headerBgStart: string;
  headerBgEnd: string;
  headerTitle: string;
  headerSub: string;
  // Specialty Header
  specBgStart: string;
  specBgEnd: string;
  specText: string;
  // Doctor Card
  cardBgStart: string;
  cardBgEnd: string;
  cardText: string;
  timePillBg: string;
  timePillText: string;
  // Leave Box
  leaveBg: string;
  leaveText: string;
  leaveBorder: string;
  // Footer
  footerBgStart: string;
  footerBgEnd: string;
  footerText: string;
  footerSub: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  date: string;
  themeMode: ThemeType;
  visualStyle: VisualStyle;
  cardVariant: CardVariant;
  headerStyle: HeaderStyle;
  footerStyle: FooterStyle;
  leaveCardStyle: LeaveCardStyle;
  avatarMode: AvatarMode;
  fontTheme: FontTheme;
  aspectRatio: AspectRatioMode;
  cardCornerRadius: number;
  headerEmblemIcon: string;
  colors: CustomColors;
}

export interface HealthEducationTopic {
  tag: string;
  title: string;
  subtitle?: string;
  summary: string;
  bullets: string[];
  note: string;
  symptoms?: string[];
  causes?: string;
  whenToDoctor?: string;
  sourceUrl?: string;
}

export interface DoctorScheduleItem {
  doctorName: string;
  time: string;
  status: string;
  category: string;
  replacement?: string | null;
  avatarUrl?: string | null;
}

export interface LeaveDoctorItem {
  doctorName: string;
  specialty: string;
  replacement?: string | null;
}
