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
  CustomColors,
  HealthEducationTopic,
  DoctorScheduleItem,
  LeaveDoctorItem,
  AspectRatioMode,
  LayoutMode,
} from "../types";
import { THEME_PRESETS, ASPECT_RATIOS } from "../constants/themes";

export interface RenderOptions {
  selectedDate: Date;
  themeMode: ThemeType;
  visualStyle: VisualStyle;
  cardVariant: CardVariant;
  layoutMode?: LayoutMode;
  headerStyle: HeaderStyle;
  footerStyle: FooterStyle;
  emblemShape: EmblemShape;
  leaveCardStyle: LeaveCardStyle;
  avatarMode: AvatarMode;
  fontTheme: FontTheme;
  aspectRatio: AspectRatioMode;
  cardCornerRadius: number;
  headerEmblemIcon: string;
  emergencyBadgeText: string;
  watermarkText: string;
  colors: CustomColors;
  showLeaveCard: boolean;
  showFooter: boolean;
  showQrCode: boolean;
  showIgdBadge: boolean;
  showAccreditation: boolean;
  showHeaderDateBadge: boolean;
  showStatsBar: boolean;
  showAiEducation: boolean;
  aiTopic: HealthEducationTopic | null;
  hospitalName: string;
  hospitalSubtitle: string;
  accreditationText: string;
  hotlinePhone: string;
  websiteUrl: string;
  customLogoImg: HTMLImageElement | null;
  qrImage: HTMLImageElement | null;
  scaleFactor?: number;
}

const DEFAULT_ARTICLE_TOPIC: HealthEducationTopic = {
  tag: "EDUKASI KESEHATAN",
  title: "Angin Duduk",
  subtitle: "Dikira Masuk Angin, Ternyata Fatal!",
  summary:
    "Angin duduk adalah nyeri dada yang disebabkan oleh berkurangnya aliran darah ke otot jantung. Kondisi ini sering disalahartikan dan diremehkan karena mirip masuk angin biasa.",
  bullets: [
    "Nyeri dada seperti ditindih beban berat",
    "Menjalar ke leher, bahu, punggung, & rahang",
    "Disertai sesak napas & keringat dingin",
  ],
  symptoms: [
    "Nyeri dada terasa seperti tertindih atau ditekan",
    "Nyeri menjalar ke bahu, punggung, leher, atau rahang",
    "Rasa terbakar di dada mirip gejala maag/GERD",
  ],
  causes:
    "Penyempitan pembuluh darah koroner akibat penumpukan plak kolesterol yang menghambat suplai oksigen ke otot jantung.",
  whenToDoctor:
    "Segera ke IGD 24 Jam jika nyeri dada berlangsung >15 menit dan disertai keringat dingin, pusing, atau sesak napas.",
  note: "IGD RSU Siaga Medika siaga 24 jam dengan tim dokter spesialis dan fasilitas EKG terpadu.",
  sourceUrl: "Sumber: Kemenkes RI & Alodokter",
};

export function renderPoster(
  canvas: HTMLCanvasElement,
  data: {
    specMap: Record<string, DoctorScheduleItem[]>;
    leaveDoctors: LeaveDoctorItem[];
    holiday?: { name?: string; isHoliday: boolean } | null;
  },
  options: RenderOptions
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    selectedDate,
    themeMode,
    visualStyle,
    cardVariant,
    layoutMode = "heroSplit",
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
    colors: customColors,
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
    customLogoImg,
    qrImage,
    scaleFactor = 1,
  } = options;

  const { specMap, leaveDoctors, holiday } = data;
  const ratioSpec = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS.poster;
  const baseWidth = ratioSpec.width;
  const baseHeight = ratioSpec.height;

  canvas.width = baseWidth * scaleFactor;
  canvas.height = baseHeight * scaleFactor;

  ctx.save();
  ctx.scale(scaleFactor, scaleFactor);

  const preset = THEME_PRESETS[themeMode] || THEME_PRESETS.siagaOfficial;
  const c = customColors.useCustom ? customColors : preset;

  // Standardized High-Legibility Font Stacks
  const fontSans = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  const fontSerif = `"Playfair Display", "Merriweather", Georgia, serif`;
  const fontMono = `"JetBrains Mono", "SF Mono", monospace`;
  const fontRounded = `"SF Pro Rounded", "Quicksand", "Nunito", sans-serif`;
  const fontScript = `"Brush Script MT", "Caveat", "Dancing Script", cursive`;

  const baseFont =
    fontTheme === "serif"
      ? fontSerif
      : fontTheme === "mono"
      ? fontMono
      : fontTheme === "rounded"
      ? fontRounded
      : fontSans;

  // ── 1. BACKGROUND CANVAS WITH DYNAMIC EFFECTS ──
  const bgGrad = ctx.createLinearGradient(0, 0, baseWidth, baseHeight);
  bgGrad.addColorStop(0, c.bgStart);
  bgGrad.addColorStop(1, c.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // Dynamic Ambient Atmospheric Effects per Theme
  if (visualStyle === "liquidGlass") {
    ctx.save();
    const orb1 = ctx.createRadialGradient(baseWidth * 0.85, 180, 20, baseWidth * 0.85, 180, 480);
    orb1.addColorStop(0, "rgba(2, 132, 199, 0.15)");
    orb1.addColorStop(1, "transparent");
    ctx.fillStyle = orb1;
    ctx.beginPath();
    ctx.arc(baseWidth * 0.85, 180, 480, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (visualStyle === "luxuryGold") {
    ctx.save();
    // Outer Luxury Gold Border Frame
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, baseWidth - 32, baseHeight - 32);

    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 22, baseWidth - 44, baseHeight - 44);

    const goldGlow = ctx.createRadialGradient(baseWidth / 2, 80, 40, baseWidth / 2, 80, 500);
    goldGlow.addColorStop(0, "rgba(212, 175, 55, 0.18)");
    goldGlow.addColorStop(1, "transparent");
    ctx.fillStyle = goldGlow;
    ctx.fillRect(0, 0, baseWidth, 500);
    ctx.restore();
  } else if (visualStyle === "vintageBotanical") {
    ctx.save();
    ctx.fillStyle = "rgba(21, 128, 61, 0.05)";
    ctx.font = `280px ${baseFont}`;
    ctx.textAlign = "right";
    ctx.fillText("🌿", baseWidth + 40, baseHeight * 0.4);
    ctx.restore();
  } else if (visualStyle === "sakuraZen") {
    ctx.save();
    ctx.fillStyle = "rgba(190, 24, 93, 0.05)";
    ctx.font = `260px ${baseFont}`;
    ctx.textAlign = "right";
    ctx.fillText("🌸", baseWidth + 30, baseHeight * 0.38);
    ctx.restore();
  } else if (visualStyle === "siagaOfficial") {
    ctx.save();
    ctx.fillStyle = "rgba(13, 148, 136, 0.05)";
    ctx.beginPath();
    ctx.arc(baseWidth * 0.88, 80, 360, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── 2. DYNAMIC HEADER BAR ARCHITECTURE ──
  const padX = 48;
  let curY = 40;
  const contentWidth = baseWidth - padX * 2;

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayName = days[selectedDate.getDay()];
  const dateFormatted = `${dayName}, ${String(selectedDate.getDate()).padStart(2, "0")} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  if (headerStyle === "officialSplit" || visualStyle === "siagaOfficial") {
    // ── OFFICIAL SPLIT HOSPITAL HEADER (WITH PROMINENT KARS PARIPURNA PLACEMENT) ──
    const headH = 120;
    const logoSize = 64;
    const logoX = padX;
    const logoY = curY + 6;

    if (customLogoImg) {
      ctx.drawImage(customLogoImg, logoX, logoY, logoSize, logoSize);
    } else {
      ctx.save();
      ctx.fillStyle = c.specBgStart || "#0D9488";
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, 28, 52, 8);
      ctx.fill();
      ctx.fillStyle = c.footerBgStart || "#E11D48";
      ctx.beginPath();
      ctx.roundRect(logoX + 32, logoY + 12, 28, 40, 8);
      ctx.fill();
      ctx.restore();
    }

    const brandX = logoX + logoSize + 18;
    ctx.save();
    ctx.fillStyle = "#475569";
    ctx.font = `800 13px ${baseFont}`;
    ctx.fillText("RUMAH SAKIT UMUM", brandX, logoY + 16);

    ctx.fillStyle = c.headerTitle || "#0F766E";
    ctx.font = `900 24px ${baseFont}`;
    ctx.fillText(hospitalName.replace("RUMAH SAKIT UMUM ", ""), brandX, logoY + 40);

    ctx.fillStyle = c.headerSub || "#0D9488";
    ctx.font = `800 13.5px ${baseFont}`;
    ctx.fillText("PURBALINGGA", brandX, logoY + 58);

    // Prestigious Official KARS Paripurna Accreditation Box
    if (showAccreditation) {
      const akredX = brandX + 225;
      const akredW = 160;
      const akredH = 58;

      ctx.fillStyle = "rgba(225, 29, 72, 0.06)";
      ctx.beginPath();
      ctx.roundRect(akredX, logoY + 2, akredW, akredH, 10);
      ctx.fill();

      ctx.strokeStyle = "rgba(225, 29, 72, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#E11D48";
      ctx.font = `800 12px ${baseFont}`;
      ctx.fillText("⭐ ⭐ ⭐ ⭐ ⭐", akredX + 12, logoY + 18);

      ctx.font = `900 14px ${baseFont}`;
      ctx.fillText("PARIPURNA", akredX + 12, logoY + 36);

      ctx.fillStyle = "#475569";
      ctx.font = `700 9.5px ${baseFont}`;
      ctx.fillText("KARS Kemenkes RI", akredX + 12, logoY + 50);
    }

    // Right: Script "Jadwal" + "Poliklinik & Dokter Spesialis"
    const rightX = padX + contentWidth;
    ctx.textAlign = "right";

    ctx.fillStyle = c.cardText || "#1E293B";
    ctx.font = `italic 700 46px ${fontScript}, ${baseFont}`;
    ctx.fillText("Jadwal", rightX - 310, logoY + 38);

    ctx.font = `900 34px ${baseFont}`;
    ctx.fillText("Poliklinik &", rightX, logoY + 30);

    ctx.font = `900 40px ${baseFont}`;
    ctx.fillText("Dokter Spesialis", rightX, logoY + 72);
    ctx.restore();

    curY += headH;

    // Date Banner
    ctx.save();
    ctx.fillStyle = c.footerBgStart || "#E11D48";
    ctx.font = `900 36px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.fillText(dateFormatted, baseWidth / 2, curY + 16);

    ctx.fillStyle = "rgba(225, 29, 72, 0.25)";
    ctx.fillRect(baseWidth / 2 - 160, curY + 28, 320, 3);
    ctx.restore();

    curY += 50;

  } else {
    // ── MODERN DISTINCTIVE TEMPLATE HEADERS ──
    const headH = 132;
    const grad = ctx.createLinearGradient(padX, curY, padX, curY + headH);
    grad.addColorStop(0, c.headerBgStart);
    grad.addColorStop(1, c.headerBgEnd);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(padX, curY, contentWidth, headH, cardCornerRadius + 4);
    ctx.fill();

    // Distinctive Styling per Visual Theme
    if (visualStyle === "luxuryGold") {
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(padX + 6, curY + 6, contentWidth - 12, headH - 12, cardCornerRadius);
      ctx.stroke();
    } else if (visualStyle === "monochromeSwiss") {
      ctx.strokeStyle = "#09090B";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Swiss Red Accent Tab
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(padX, curY, 10, headH);
    } else if (visualStyle === "neonNoir") {
      ctx.strokeStyle = "#06B6D4";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (visualStyle === "liquidGlass") {
      ctx.strokeStyle = "rgba(2, 132, 199, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Emblem on Left
    const embSize = 66;
    const embX = padX + 24;
    const embY = curY + (headH - embSize) / 2;

    const embGrad = ctx.createLinearGradient(embX, embY, embX + embSize, embY + embSize);
    embGrad.addColorStop(0, c.specBgStart);
    embGrad.addColorStop(1, c.specBgEnd);
    ctx.fillStyle = embGrad;
    ctx.beginPath();
    ctx.roundRect(embX, embY, embSize, embSize, emblemShape === "circle" ? embSize / 2 : 16);
    ctx.fill();

    ctx.fillStyle = c.specText || "#FFFFFF";
    ctx.font = `bold 30px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(headerEmblemIcon || "🏥", embX + embSize / 2, embY + embSize / 2);

    // Title & Subtitle
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = c.headerTitle;
    ctx.font = `900 24px ${baseFont}`;
    ctx.fillText(hospitalName, embX + embSize + 20, curY + 48);

    ctx.fillStyle = c.headerSub;
    ctx.font = `700 13px ${baseFont}`;
    ctx.fillText(hospitalSubtitle, embX + embSize + 20, curY + 74);

    // Right: Date Pill or KARS Accreditation Pill
    const datePillW = 240;
    const datePillH = 44;
    const datePillX = padX + contentWidth - datePillW - 20;
    const datePillY = curY + (headH - datePillH) / 2;

    ctx.fillStyle = c.timePillBg;
    ctx.beginPath();
    ctx.roundRect(datePillX, datePillY, datePillW, datePillH, 22);
    ctx.fill();

    ctx.fillStyle = c.timePillText;
    ctx.font = `800 13px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dateFormatted, datePillX + datePillW / 2, datePillY + datePillH / 2);

    // Accreditation Badge Pill for Modern Themes
    if (showAccreditation) {
      const akredPillW = 190;
      const akredPillH = 26;
      const akredPillX = datePillX - akredPillW - 14;
      const akredPillY = curY + (headH - akredPillH) / 2;

      ctx.fillStyle = "rgba(225, 29, 72, 0.08)";
      ctx.beginPath();
      ctx.roundRect(akredPillX, akredPillY, akredPillW, akredPillH, 13);
      ctx.fill();

      ctx.strokeStyle = "rgba(225, 29, 72, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#E11D48";
      ctx.font = `800 10.5px ${baseFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⭐ ⭐ ⭐ ⭐ ⭐ PARIPURNA", akredPillX + akredPillW / 2, akredPillY + akredPillH / 2);
    }

    curY += headH + 24;
  }

  // ── 3. DISTINCTIVE SPECIALTY & DOCTOR CARD DRAWING ENGINE ──
  const gapX = 32;
  const colW = (contentWidth - gapX) / 2;
  const leftX = padX;
  const rightX = padX + colW + gapX;

  const specialties = Object.keys(specMap);
  const leftSpecs = specialties.slice(0, 4);
  const rightSpecs = specialties.slice(4);

  let specCounter = 1;

  const drawCard = (
    specName: string,
    docs: DoctorScheduleItem[],
    x: number,
    y: number,
    w: number
  ): number => {
    let groupY = y;
    const pillH = 36;
    const specNumStr = String(specCounter++).padStart(2, "0");

    ctx.save();

    // ── DISTINCT SPECIALTY PILL PER THEME ──
    if (visualStyle === "monochromeSwiss") {
      // Swiss Editorial Tabular Header
      ctx.fillStyle = "#09090B";
      ctx.fillRect(x, groupY, 32, pillH);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `900 14px ${baseFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(specNumStr, x + 16, groupY + pillH / 2);

      ctx.fillStyle = "#DC2626";
      ctx.fillRect(x + 32, groupY, 6, pillH);

      ctx.fillStyle = "#09090B";
      ctx.font = `900 14px ${baseFont}`;
      ctx.textAlign = "left";
      ctx.fillText(specName.toUpperCase(), x + 46, groupY + pillH / 2);

      ctx.fillStyle = "#DC2626";
      ctx.font = `800 12.5px ${baseFont}`;
      ctx.textAlign = "right";
      ctx.fillText("JAM PRAKTIK", x + w - 8, groupY + pillH / 2);

    } else if (visualStyle === "luxuryGold") {
      // Luxury Gold Regal Ribbon Banner
      const pillGrad = ctx.createLinearGradient(x, groupY, x + w * 0.65, groupY + pillH);
      pillGrad.addColorStop(0, "#B48B1B");
      pillGrad.addColorStop(1, "#8C6A0E");
      ctx.fillStyle = pillGrad;
      ctx.beginPath();
      ctx.roundRect(x, groupY, w * 0.65, pillH, [pillH / 2, 0, pillH / 2, 0]);
      ctx.fill();

      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `900 13px ${baseFont}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`◆ ${specName}`, x + 16, groupY + pillH / 2);

      ctx.fillStyle = "#8C6A0E";
      ctx.font = `800 12px ${baseFont}`;
      ctx.textAlign = "right";
      ctx.fillText("Waktu Praktik", x + w - 8, groupY + pillH / 2);

    } else if (visualStyle === "neonNoir") {
      // Tokyo Cyberpunk HUD Header
      ctx.strokeStyle = "#06B6D4";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, groupY, w * 0.65, pillH);

      ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
      ctx.fillRect(x, groupY, w * 0.65, pillH);

      ctx.fillStyle = "#0891B2";
      ctx.font = `900 13px ${fontMono}, ${baseFont}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`[ ${specNumStr} ] ${specName}`, x + 12, groupY + pillH / 2);

      ctx.fillStyle = "#E11D48";
      ctx.font = `800 12px ${fontMono}, ${baseFont}`;
      ctx.textAlign = "right";
      ctx.fillText("● LIVE SCHEDULE", x + w - 8, groupY + pillH / 2);

    } else {
      // Standard & Smooth Pill
      const pillGrad = ctx.createLinearGradient(x, groupY, x + w * 0.62, groupY + pillH);
      pillGrad.addColorStop(0, c.specBgStart);
      pillGrad.addColorStop(1, c.specBgEnd);
      ctx.fillStyle = pillGrad;
      ctx.beginPath();
      ctx.roundRect(x, groupY, w * 0.62, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = c.specText || "#FFFFFF";
      ctx.font = `900 13px ${baseFont}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(specName, x + 16, groupY + pillH / 2 + 1);

      ctx.fillStyle = c.specBgStart;
      ctx.font = `800 12.5px ${baseFont}`;
      ctx.textAlign = "right";
      ctx.fillText("Jam Praktik", x + w - 8, groupY + pillH / 2 + 1);
    }

    ctx.restore();
    groupY += pillH + 10;

    // ── DOCTOR ROWS DRAWING ENGINE ──
    for (const doc of docs) {
      const isCuti = doc.status === "CUTI";
      const rowH = doc.time.includes("\n") ? 48 : 30;

      ctx.save();

      // Distinct Card Treatment per Variant / Visual Style
      if (cardVariant === "glassFrost" || visualStyle === "liquidGlass") {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(x, groupY, w, rowH, 12);
        ctx.fill();

        ctx.strokeStyle = "rgba(2, 132, 199, 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (cardVariant === "minimalBorder" || visualStyle === "monochromeSwiss") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x, groupY, w, rowH);

        ctx.strokeStyle = "#E4E4E7";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, groupY, w, rowH);

        // Swiss Left Red Line
        ctx.fillStyle = "#DC2626";
        ctx.fillRect(x, groupY, 3, rowH);

      } else if (visualStyle === "clay3d") {
        // 3D Neumorphic Clay Shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(x, groupY, w, rowH, 14);
        ctx.fill();

        ctx.shadowColor = "transparent";
      } else {
        // Clean Smooth Material
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(x, groupY, w, rowH, 10);
        ctx.fill();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Doctor Name (High-Contrast Slate #0F172A)
      ctx.fillStyle = c.cardText || "#0F172A";
      ctx.font = `700 13.5px ${baseFont}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(doc.doctorName, x + 10, groupY + 5);

      // Time / Status (Right Side)
      ctx.textAlign = "right";
      if (isCuti) {
        ctx.fillStyle = c.leaveText || "#DC2626";
        ctx.font = `900 12.5px ${baseFont}`;
        ctx.fillText("LIBUR", x + w - 10, groupY + 5);
      } else {
        ctx.fillStyle = c.timePillText || c.cardText || "#0F172A";
        ctx.font = `600 13px ${baseFont}`;
        const times = doc.time.split("\n");
        times.forEach((t, tIdx) => {
          ctx.fillText(t.trim(), x + w - 10, groupY + 5 + tIdx * 18);
        });
      }
      ctx.restore();

      groupY += rowH + 6;
    }

    return groupY + 10;
  };

  // ── DRAW LEFT COLUMN (Top Specs + AI Health Education Box) ──
  let leftCurY = curY;
  for (const spec of leftSpecs) {
    leftCurY = drawCard(spec, specMap[spec] || [], leftX, leftCurY, colW);
  }

  // Draw Health Education Article Box in Left Column
  const article = aiTopic || DEFAULT_ARTICLE_TOPIC;
  const articleBoxY = leftCurY + 8;
  const articleBoxH = baseHeight - articleBoxY - (showFooter ? 130 : 50);

  if (showAiEducation && articleBoxH > 220) {
    ctx.save();
    // Container
    const artGrad = ctx.createLinearGradient(leftX, articleBoxY, leftX, articleBoxY + articleBoxH);
    artGrad.addColorStop(0, "#FFFFFF");
    artGrad.addColorStop(1, c.cardBgEnd || "#F0FDFA");
    ctx.fillStyle = artGrad;
    ctx.beginPath();
    ctx.roundRect(leftX, articleBoxY, colW, articleBoxH, cardCornerRadius + 4);
    ctx.fill();

    ctx.strokeStyle = c.specBgStart ? `${c.specBgStart}35` : "rgba(13, 148, 136, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Header Banner
    const artHeaderH = 100;
    const artHeadGrad = ctx.createLinearGradient(leftX, articleBoxY, leftX + colW, articleBoxY + artHeaderH);
    artHeadGrad.addColorStop(0, `${c.specBgStart}25`);
    artHeadGrad.addColorStop(1, `${c.footerBgStart}15`);
    ctx.fillStyle = artHeadGrad;
    ctx.beginPath();
    ctx.roundRect(leftX, articleBoxY, colW, artHeaderH, [cardCornerRadius + 4, cardCornerRadius + 4, 0, 0]);
    ctx.fill();

    // Watermark Icon
    ctx.font = `56px ${baseFont}`;
    ctx.fillStyle = `${c.specBgStart}20`;
    ctx.textAlign = "right";
    ctx.fillText("🫀", leftX + colW - 20, articleBoxY + 70);

    // Article Title & Subtitle (WCAG AAA Contrast)
    ctx.textAlign = "left";
    ctx.fillStyle = c.footerBgStart || "#E11D48";
    ctx.font = `900 32px ${baseFont}`;
    ctx.fillText(article.title, leftX + 22, articleBoxY + 48);

    ctx.fillStyle = c.specBgStart || "#0D9488";
    ctx.font = `800 15px ${baseFont}`;
    ctx.fillText(article.subtitle || "Edukasi & Pencegahan Dini Medis", leftX + 22, articleBoxY + 78);

    // Flowing Text
    let artTextY = articleBoxY + artHeaderH + 20;
    const textPadX = leftX + 22;
    const textW = colW - 44;

    const wrapText = (text: string, x: number, y: number, maxW: number, lineH: number): number => {
      const words = text.split(" ");
      let line = "";
      let currentY = y;
      for (const word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxW) {
          ctx.fillText(line.trim(), x, currentY);
          line = word + " ";
          currentY += lineH;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), x, currentY);
      return currentY + lineH;
    };

    ctx.fillStyle = "#1E293B";
    ctx.font = `500 13px ${baseFont}`;
    artTextY = wrapText(article.summary, textPadX, artTextY, textW, 18) + 6;

    // Gejala Section
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 14px ${baseFont}`;
    ctx.fillText("Gejala " + article.title, textPadX, artTextY);
    artTextY += 19;

    const symptomsList = article.symptoms || article.bullets || [];
    ctx.font = `500 12.5px ${baseFont}`;
    ctx.fillStyle = "#334155";
    for (const sym of symptomsList.slice(0, 3)) {
      ctx.fillText("• " + sym, textPadX + 6, artTextY);
      artTextY += 18;
    }
    artTextY += 6;

    // Penyebab Section
    if (article.causes && artTextY < articleBoxY + articleBoxH - 70) {
      ctx.fillStyle = "#0F172A";
      ctx.font = `800 14px ${baseFont}`;
      ctx.fillText("Penyebab " + article.title, textPadX, artTextY);
      artTextY += 19;

      ctx.font = `500 12.5px ${baseFont}`;
      artTextY = wrapText(article.causes, textPadX, artTextY, textW, 17) + 6;
    }

    // Footnote Citation
    ctx.fillStyle = c.specBgStart || "#0284C7";
    ctx.font = `italic 600 11.5px ${baseFont}`;
    ctx.fillText(article.sourceUrl || "Sumber: RSU Siaga Medika Purbalingga", textPadX, articleBoxY + articleBoxH - 16);

    ctx.restore();
  }

  // ── DRAW RIGHT COLUMN ──
  let rightCurY = curY;
  for (const spec of rightSpecs) {
    if (rightCurY > baseHeight - (showFooter ? 140 : 60)) break;
    rightCurY = drawCard(spec, specMap[spec] || [], rightX, rightCurY, colW);
  }

  // ── 4. STANDARDIZED FOOTER BAR ──
  if (showFooter) {
    const footH = 68;
    const footY = baseHeight - footH;

    ctx.save();
    const footGrad = ctx.createLinearGradient(0, footY, baseWidth, footY);
    footGrad.addColorStop(0, c.footerBgStart);
    footGrad.addColorStop(1, c.footerBgEnd);
    ctx.fillStyle = footGrad;
    ctx.fillRect(0, footY, baseWidth, footH);

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(0, footY, baseWidth, 2);

    // Left: Information Title
    ctx.fillStyle = c.footerText || "#FFFFFF";
    ctx.font = `900 19px ${baseFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Informasi Jadwal dokter dan Poliklinik:", padX, footY + footH / 2);

    // Center Hotline WhatsApp
    const waX = baseWidth * 0.58;
    ctx.font = `900 19px ${baseFont}`;
    ctx.fillText(`💬 ${hotlinePhone}`, waX, footY + footH / 2);

    // Right Instagram Handle
    const igX = baseWidth - padX;
    ctx.textAlign = "right";
    ctx.fillText(`📷 siagamedika_pbg`, igX, footY + footH / 2);

    ctx.restore();
  }

  ctx.restore();
}
