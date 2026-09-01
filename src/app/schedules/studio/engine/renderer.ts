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

  const fontSans = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
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

  // Dynamic Ambient Glow & Background Highlights
  if (visualStyle === "liquidGlass" || visualStyle === "neonNoir" || visualStyle === "clay3d") {
    ctx.save();
    // Ambient Orb Top Right
    const orb1 = ctx.createRadialGradient(baseWidth * 0.85, 200, 20, baseWidth * 0.85, 200, 450);
    orb1.addColorStop(0, c.bgGlow || "rgba(56, 189, 248, 0.25)");
    orb1.addColorStop(1, "transparent");
    ctx.fillStyle = orb1;
    ctx.beginPath();
    ctx.arc(baseWidth * 0.85, 200, 450, 0, Math.PI * 2);
    ctx.fill();

    // Ambient Orb Bottom Left
    const orb2 = ctx.createRadialGradient(baseWidth * 0.15, baseHeight * 0.8, 30, baseWidth * 0.15, baseHeight * 0.8, 500);
    orb2.addColorStop(0, c.bgGlow || "rgba(99, 102, 241, 0.2)");
    orb2.addColorStop(1, "transparent");
    ctx.fillStyle = orb2;
    ctx.beginPath();
    ctx.arc(baseWidth * 0.15, baseHeight * 0.8, 500, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (visualStyle === "luxuryGold") {
    // Elegant Gold Shimmer Accents
    ctx.save();
    const goldOrb = ctx.createRadialGradient(baseWidth / 2, 0, 50, baseWidth / 2, 0, 600);
    goldOrb.addColorStop(0, "rgba(212, 175, 55, 0.25)");
    goldOrb.addColorStop(1, "transparent");
    ctx.fillStyle = goldOrb;
    ctx.fillRect(0, 0, baseWidth, 600);
    ctx.restore();
  } else if (visualStyle === "siagaOfficial") {
    // Crisp Geometric Arc
    ctx.save();
    ctx.fillStyle = "rgba(13, 148, 136, 0.05)";
    ctx.beginPath();
    ctx.arc(baseWidth * 0.88, 80, 360, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── 2. DYNAMIC HEADER BAR ──
  const padX = 48;
  let curY = 40;
  const contentWidth = baseWidth - padX * 2;

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayName = days[selectedDate.getDay()];
  const dateFormatted = `${dayName}, ${String(selectedDate.getDate()).padStart(2, "0")} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  if (headerStyle === "officialSplit" || visualStyle === "siagaOfficial") {
    // ── OFFICIAL SPLIT HOSPITAL HEADER ──
    const headH = 120;

    // Left: Logo & Hospital Name
    const logoSize = 60;
    const logoX = padX;
    const logoY = curY + 8;

    if (customLogoImg) {
      ctx.drawImage(customLogoImg, logoX, logoY, logoSize, logoSize);
    } else {
      ctx.save();
      ctx.fillStyle = c.specBgStart || "#0D9488";
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, 26, 48, 6);
      ctx.fill();
      ctx.fillStyle = c.footerBgStart || "#E11D48";
      ctx.beginPath();
      ctx.roundRect(logoX + 30, logoY + 10, 26, 38, 6);
      ctx.fill();
      ctx.restore();
    }

    const brandX = logoX + logoSize + 16;
    ctx.save();
    ctx.fillStyle = "#475569";
    ctx.font = `800 12px ${baseFont}`;
    ctx.fillText("RUMAH SAKIT UMUM", brandX, logoY + 15);

    ctx.fillStyle = c.headerTitle || "#0F766E";
    ctx.font = `900 23px ${baseFont}`;
    ctx.fillText(hospitalName.replace("RUMAH SAKIT UMUM ", ""), brandX, logoY + 38);

    ctx.fillStyle = c.headerSub || "#0D9488";
    ctx.font = `800 13px ${baseFont}`;
    ctx.fillText("PURBALINGGA", brandX, logoY + 56);

    // KARS Accreditation
    if (showAccreditation) {
      const akredX = brandX + 210;
      ctx.fillStyle = "#E11D48";
      ctx.font = `800 13px ${baseFont}`;
      ctx.fillText("⭐ ⭐ ⭐ ⭐ ⭐", akredX, logoY + 16);
      ctx.font = `900 14px ${baseFont}`;
      ctx.fillText("PARIPURNA", akredX, logoY + 35);
      ctx.fillStyle = "#64748B";
      ctx.font = `600 9px ${baseFont}`;
      ctx.fillText("Komisi Akreditasi RS", akredX, logoY + 49);
    }

    // Right: Script "Jadwal" + "Poliklinik & Dokter Spesialis"
    const rightX = padX + contentWidth;
    ctx.textAlign = "right";

    ctx.fillStyle = c.cardText || "#1E293B";
    ctx.font = `italic 700 44px ${fontScript}, ${baseFont}`;
    ctx.fillText("Jadwal", rightX - 290, logoY + 36);

    ctx.font = `900 32px ${baseFont}`;
    ctx.fillText("Poliklinik &", rightX, logoY + 28);

    ctx.font = `900 38px ${baseFont}`;
    ctx.fillText("Dokter Spesialis", rightX, logoY + 68);
    ctx.restore();

    curY += headH;

    // Date Banner
    ctx.save();
    ctx.fillStyle = c.footerBgStart || "#E11D48";
    ctx.font = `900 36px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.fillText(dateFormatted, baseWidth / 2, curY + 16);

    ctx.fillStyle = "rgba(225, 29, 72, 0.25)";
    ctx.fillRect(baseWidth / 2 - 150, curY + 28, 300, 3);
    ctx.restore();

    curY += 50;

  } else {
    // ── MODERN LIQUID GLASS / BENTO / FLOATING ISLAND HEADER ──
    const headH = 130;
    const grad = ctx.createLinearGradient(padX, curY, padX, curY + headH);
    grad.addColorStop(0, c.headerBgStart);
    grad.addColorStop(1, c.headerBgEnd);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(padX, curY, contentWidth, headH, cardCornerRadius + 4);
    ctx.fill();

    // Glass Border
    ctx.strokeStyle = visualStyle === "liquidGlass" ? "rgba(255, 255, 255, 0.6)" : "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Emblem on Left
    const embSize = 64;
    const embX = padX + 24;
    const embY = curY + (headH - embSize) / 2;

    const embGrad = ctx.createLinearGradient(embX, embY, embX + embSize, embY + embSize);
    embGrad.addColorStop(0, c.specBgStart);
    embGrad.addColorStop(1, c.specBgEnd);
    ctx.fillStyle = embGrad;
    ctx.beginPath();
    ctx.roundRect(embX, embY, embSize, embSize, emblemShape === "circle" ? embSize / 2 : 16);
    ctx.fill();

    ctx.fillStyle = c.specText;
    ctx.font = `bold 28px ${baseFont}`;
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

    // Right Date Pill
    const datePillW = 240;
    const datePillH = 42;
    const datePillX = padX + contentWidth - datePillW - 20;
    const datePillY = curY + (headH - datePillH) / 2;

    ctx.fillStyle = c.timePillBg;
    ctx.beginPath();
    ctx.roundRect(datePillX, datePillY, datePillW, datePillH, 21);
    ctx.fill();

    ctx.fillStyle = c.timePillText;
    ctx.font = `800 13px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dateFormatted, datePillX + datePillW / 2, datePillY + datePillH / 2);

    curY += headH + 24;
  }

  // ── 3. DYNAMIC SPECIALTY & DOCTOR CARD DRAWING ENGINE ──
  const gapX = 32;
  const colW = (contentWidth - gapX) / 2;
  const leftX = padX;
  const rightX = padX + colW + gapX;

  const specialties = Object.keys(specMap);
  const leftSpecs = specialties.slice(0, 4);
  const rightSpecs = specialties.slice(4);

  const drawCard = (
    specName: string,
    docs: DoctorScheduleItem[],
    x: number,
    y: number,
    w: number
  ): number => {
    let groupY = y;
    const pillH = 34;

    // Specialty Pill Header
    ctx.save();
    const pillGrad = ctx.createLinearGradient(x, groupY, x + w * 0.6, groupY + pillH);
    pillGrad.addColorStop(0, c.specBgStart);
    pillGrad.addColorStop(1, c.specBgEnd);
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    ctx.roundRect(x, groupY, w * 0.62, pillH, pillH / 2);
    ctx.fill();

    // Subtle Glow/Shadow for Neon/Liquid Glass
    if (visualStyle === "neonNoir" || visualStyle === "liquidGlass") {
      ctx.strokeStyle = c.specBgStart;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Pill Text
    ctx.fillStyle = c.specText;
    ctx.font = `900 12.5px ${baseFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(specName, x + 16, groupY + pillH / 2 + 1);

    // "Jam Praktik" Right Label
    ctx.fillStyle = c.specBgStart;
    ctx.font = `800 12.5px ${baseFont}`;
    ctx.textAlign = "right";
    ctx.fillText("Jam Praktik", x + w - 8, groupY + pillH / 2 + 1);
    ctx.restore();

    groupY += pillH + 10;

    // Doctor Rows
    for (const doc of docs) {
      const isCuti = doc.status === "CUTI";
      const rowH = doc.time.includes("\n") ? 46 : 28;

      ctx.save();
      // Doctor Card Container if cardVariant is glassFrost / smooth
      if (cardVariant === "glassFrost" || cardVariant === "smooth") {
        const rowBg = ctx.createLinearGradient(x, groupY, x + w, groupY + rowH);
        rowBg.addColorStop(0, c.cardBgStart);
        rowBg.addColorStop(1, c.cardBgEnd);
        ctx.fillStyle = rowBg;
        ctx.beginPath();
        ctx.roundRect(x, groupY, w, rowH, 10);
        ctx.fill();
      }

      // Doctor Name (Left)
      ctx.fillStyle = c.cardText;
      ctx.font = `700 13px ${baseFont}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(doc.doctorName, x + 8, groupY + 4);

      // Time / Status (Right)
      ctx.textAlign = "right";
      if (isCuti) {
        ctx.fillStyle = c.leaveText || "#DC2626";
        ctx.font = `900 12px ${baseFont}`;
        ctx.fillText("LIBUR", x + w - 8, groupY + 4);
      } else {
        ctx.fillStyle = c.timePillText || c.cardText;
        ctx.font = `600 12.5px ${baseFont}`;
        const times = doc.time.split("\n");
        times.forEach((t, tIdx) => {
          ctx.fillText(t.trim(), x + w - 8, groupY + 4 + tIdx * 18);
        });
      }
      ctx.restore();

      groupY += rowH + 6;
    }

    return groupY + 8;
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
    // Glass Container
    const artGrad = ctx.createLinearGradient(leftX, articleBoxY, leftX, articleBoxY + articleBoxH);
    artGrad.addColorStop(0, c.cardBgStart || "rgba(255, 255, 255, 0.95)");
    artGrad.addColorStop(1, c.cardBgEnd || "rgba(240, 253, 250, 0.9)");
    ctx.fillStyle = artGrad;
    ctx.beginPath();
    ctx.roundRect(leftX, articleBoxY, colW, articleBoxH, cardCornerRadius + 4);
    ctx.fill();

    ctx.strokeStyle = c.specBgStart ? `${c.specBgStart}40` : "rgba(13, 148, 136, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Article Header Banner Area
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

    // Article Title & Subtitle
    ctx.textAlign = "left";
    ctx.fillStyle = c.footerBgStart || "#E11D48";
    ctx.font = `900 32px ${baseFont}`;
    ctx.fillText(article.title, leftX + 22, articleBoxY + 48);

    ctx.fillStyle = c.specBgStart || "#0D9488";
    ctx.font = `800 15px ${baseFont}`;
    ctx.fillText(article.subtitle || "Edukasi & Pencegahan Dini Medis", leftX + 22, articleBoxY + 78);

    // Article Content Flow
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

    ctx.fillStyle = c.cardText || "#334155";
    ctx.font = `500 12.5px ${baseFont}`;
    artTextY = wrapText(article.summary, textPadX, artTextY, textW, 17) + 6;

    // Gejala Section
    ctx.fillStyle = c.cardText || "#0F172A";
    ctx.font = `800 13.5px ${baseFont}`;
    ctx.fillText("Gejala " + article.title, textPadX, artTextY);
    artTextY += 18;

    const symptomsList = article.symptoms || article.bullets || [];
    ctx.font = `500 12px ${baseFont}`;
    ctx.fillStyle = c.cardText ? `${c.cardText}CC` : "#475569";
    for (const sym of symptomsList.slice(0, 3)) {
      ctx.fillText("• " + sym, textPadX + 6, artTextY);
      artTextY += 17;
    }
    artTextY += 6;

    // Penyebab Section
    if (article.causes && artTextY < articleBoxY + articleBoxH - 70) {
      ctx.fillStyle = c.cardText || "#0F172A";
      ctx.font = `800 13.5px ${baseFont}`;
      ctx.fillText("Penyebab " + article.title, textPadX, artTextY);
      artTextY += 18;

      ctx.font = `500 12px ${baseFont}`;
      artTextY = wrapText(article.causes, textPadX, artTextY, textW, 16) + 6;
    }

    // Footnote
    ctx.fillStyle = c.specBgStart || "#0284C7";
    ctx.font = `italic 11px ${baseFont}`;
    ctx.fillText(article.sourceUrl || "Sumber: RSU Siaga Medika Purbalingga", textPadX, articleBoxY + articleBoxH - 16);

    ctx.restore();
  }

  // ── DRAW RIGHT COLUMN (Dense Stack of Remaining Specialties) ──
  let rightCurY = curY;
  for (const spec of rightSpecs) {
    if (rightCurY > baseHeight - (showFooter ? 140 : 60)) break;
    rightCurY = drawCard(spec, specMap[spec] || [], rightX, rightCurY, colW);
  }

  // ── 4. DYNAMIC FOOTER BAR ──
  if (showFooter) {
    const footH = 68;
    const footY = baseHeight - footH;

    ctx.save();
    const footGrad = ctx.createLinearGradient(0, footY, baseWidth, footY);
    footGrad.addColorStop(0, c.footerBgStart);
    footGrad.addColorStop(1, c.footerBgEnd);
    ctx.fillStyle = footGrad;
    ctx.fillRect(0, footY, baseWidth, footH);

    // Accent line
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(0, footY, baseWidth, 2);

    // Footer Text Info
    ctx.fillStyle = c.footerText || "#FFFFFF";
    ctx.font = `900 19px ${baseFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Informasi Jadwal dokter dan Poliklinik:", padX, footY + footH / 2);

    // Center Phone
    const waX = baseWidth * 0.58;
    ctx.font = `900 19px ${baseFont}`;
    ctx.fillText(`💬 ${hotlinePhone}`, waX, footY + footH / 2);

    // Right Instagram
    const igX = baseWidth - padX;
    ctx.textAlign = "right";
    ctx.fillText(`📷 siagamedika_pbg`, igX, footY + footH / 2);

    ctx.restore();
  }

  ctx.restore();
}
