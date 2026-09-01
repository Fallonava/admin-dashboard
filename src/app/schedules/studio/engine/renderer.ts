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
} from "../types";
import { THEME_PRESETS, ASPECT_RATIOS } from "../constants/themes";

export interface RenderOptions {
  selectedDate: Date;
  themeMode: ThemeType;
  visualStyle: VisualStyle;
  cardVariant: CardVariant;
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

  // ── 1. BACKGROUND CANVAS ──
  const bgGrad = ctx.createLinearGradient(0, 0, baseWidth, baseHeight);
  bgGrad.addColorStop(0, c.bgStart);
  bgGrad.addColorStop(1, c.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // Decorative header curve waves for official layout
  if (visualStyle === "siagaOfficial") {
    ctx.save();
    ctx.fillStyle = "rgba(13, 148, 136, 0.04)";
    ctx.beginPath();
    ctx.arc(baseWidth * 0.85, 100, 320, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── 2. HEADER BAR ──
  const padX = 48;
  let curY = 40;
  const contentWidth = baseWidth - padX * 2;

  if (visualStyle === "siagaOfficial") {
    // ── RSU SIAGA MEDIKA OFFICIAL HEADER ──
    const headH = 130;

    // Left: Hospital Logo + Text
    const logoSize = 64;
    const logoX = padX;
    const logoY = curY + 10;

    if (customLogoImg) {
      ctx.drawImage(customLogoImg, logoX, logoY, logoSize, logoSize);
    } else {
      // Crisp SVG/Vector Emblems
      ctx.save();
      ctx.fillStyle = "#E11D48";
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, 28, 52, 6);
      ctx.fill();
      ctx.fillStyle = "#0D9488";
      ctx.beginPath();
      ctx.roundRect(logoX + 32, logoY + 12, 28, 40, 6);
      ctx.fill();
      ctx.restore();
    }

    // Hospital Name Branding
    const brandX = logoX + logoSize + 16;
    ctx.save();
    ctx.fillStyle = "#475569";
    ctx.font = `800 12px ${baseFont}`;
    ctx.fillText("RUMAH SAKIT UMUM", brandX, logoY + 16);

    ctx.fillStyle = "#E11D48";
    ctx.font = `900 24px ${baseFont}`;
    ctx.fillText("SIAGAMEDIKA", brandX, logoY + 40);

    ctx.fillStyle = "#0D9488";
    ctx.font = `800 14px ${baseFont}`;
    ctx.fillText("PURBALINGGA", brandX, logoY + 58);

    // KARS Paripurna Accreditation Badge
    if (showAccreditation) {
      const akredX = brandX + 200;
      ctx.fillStyle = "#E11D48";
      ctx.font = `800 14px ${baseFont}`;
      ctx.fillText("⭐ ⭐ ⭐ ⭐ ⭐", akredX, logoY + 18);
      ctx.font = `900 15px ${baseFont}`;
      ctx.fillText("PARIPURNA", akredX, logoY + 38);
      ctx.fillStyle = "#64748B";
      ctx.font = `600 9px ${baseFont}`;
      ctx.fillText("Komisi Akreditasi Rumah Sakit", akredX, logoY + 52);
    }

    // Right: "Jadwal Poliklinik & Dokter Spesialis"
    const rightX = padX + contentWidth;
    ctx.textAlign = "right";

    // Script "Jadwal"
    ctx.fillStyle = "#1E293B";
    ctx.font = `italic 700 48px ${fontScript}, ${baseFont}`;
    ctx.fillText("Jadwal", rightX - 300, logoY + 40);

    // Modern Sans "Poliklinik &"
    ctx.font = `900 36px ${baseFont}`;
    ctx.fillText("Poliklinik &", rightX, logoY + 30);

    // "Dokter Spesialis"
    ctx.font = `900 42px ${baseFont}`;
    ctx.fillText("Dokter Spesialis", rightX, logoY + 74);
    ctx.restore();

    curY += headH;

    // Prominent Red Date Banner
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dayName = days[selectedDate.getDay()];
    const dateFormatted = `${dayName}, ${String(selectedDate.getDate()).padStart(2, "0")} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

    ctx.save();
    ctx.fillStyle = "#E11D48";
    ctx.font = `900 38px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.fillText(dateFormatted, baseWidth / 2, curY + 20);

    // Decorative underline bar
    ctx.fillStyle = "rgba(225, 29, 72, 0.25)";
    ctx.fillRect(baseWidth / 2 - 160, curY + 32, 320, 3);
    ctx.restore();

    curY += 56;

  } else {
    // ── MODERN LIQUID GLASS / SWISS / LUXURY HEADER ──
    const headH = 140;
    const grad = ctx.createLinearGradient(padX, curY, padX, curY + headH);
    grad.addColorStop(0, c.headerBgStart);
    grad.addColorStop(1, c.headerBgEnd);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(padX, curY, contentWidth, headH, cardCornerRadius + 4);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Emblem on left
    const embSize = 64;
    ctx.fillStyle = c.specBgStart;
    ctx.beginPath();
    ctx.roundRect(padX + 24, curY + (headH - embSize) / 2, embSize, embSize, 16);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold 28px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(headerEmblemIcon || "🏥", padX + 24 + embSize / 2, curY + headH / 2);

    // Header Title
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = c.headerTitle;
    ctx.font = `900 26px ${baseFont}`;
    ctx.fillText(hospitalName, padX + embSize + 44, curY + 54);

    ctx.fillStyle = c.headerSub;
    ctx.font = `700 13px ${baseFont}`;
    ctx.fillText(hospitalSubtitle, padX + embSize + 44, curY + 80);

    curY += headH + 24;
  }

  // ── 3. 2-COLUMN SCHEDULE & HEALTH ARTICLE LAYOUT ──
  const gapX = 36;
  const colW = (contentWidth - gapX) / 2;
  const leftX = padX;
  const rightX = padX + colW + gapX;

  const specialties = Object.keys(specMap);
  // Left Column top 4 specialties, Right Column all remaining specialties
  const leftSpecs = specialties.slice(0, 4);
  const rightSpecs = specialties.slice(4);

  const drawSpecialtyGroup = (
    specName: string,
    docs: DoctorScheduleItem[],
    x: number,
    y: number,
    w: number
  ): number => {
    let groupY = y;
    const pillH = 34;

    // Header Specialty Pill
    ctx.save();
    // Pill background
    ctx.fillStyle = "#0D9488";
    ctx.beginPath();
    ctx.roundRect(x, groupY, w * 0.6, pillH, pillH / 2);
    ctx.fill();

    // Pill Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 13px ${baseFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(specName, x + 18, groupY + pillH / 2 + 1);

    // "Jam Praktik" right label
    ctx.fillStyle = "#0D9488";
    ctx.font = `800 13px ${baseFont}`;
    ctx.textAlign = "right";
    ctx.fillText("Jam Praktik", x + w - 8, groupY + pillH / 2 + 1);
    ctx.restore();

    groupY += pillH + 10;

    // Doctor Rows
    for (const doc of docs) {
      const isCuti = doc.status === "CUTI";
      const rowH = doc.time.includes("\n") ? 46 : 28;

      ctx.save();
      // Doctor Name (Left)
      ctx.fillStyle = "#1E293B";
      ctx.font = `700 13px ${baseFont}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(doc.doctorName, x + 8, groupY + 2);

      // Time (Right)
      ctx.textAlign = "right";
      if (isCuti) {
        ctx.fillStyle = "#DC2626";
        ctx.font = `900 12px ${baseFont}`;
        ctx.fillText("LIBUR", x + w - 8, groupY + 2);
      } else {
        ctx.fillStyle = "#0F172A";
        ctx.font = `600 13px ${baseFont}`;
        // Support multiple time rows
        const times = doc.time.split("\n");
        times.forEach((t, tIdx) => {
          ctx.fillText(t.trim(), x + w - 8, groupY + 2 + tIdx * 18);
        });
      }
      ctx.restore();

      groupY += rowH + 6;
    }

    return groupY + 8;
  };

  // ── DRAW LEFT COLUMN (Top Specs + Education Article Box) ──
  let leftCurY = curY;
  for (const spec of leftSpecs) {
    leftCurY = drawSpecialtyGroup(spec, specMap[spec] || [], leftX, leftCurY, colW);
  }

  // Draw Health Education Article Box in Left Column
  const article = aiTopic || DEFAULT_ARTICLE_TOPIC;
  const articleBoxY = leftCurY + 12;
  const articleBoxH = baseHeight - articleBoxY - 140;

  if (articleBoxH > 220) {
    ctx.save();
    // Soft container background with gradient
    const artGrad = ctx.createLinearGradient(leftX, articleBoxY, leftX, articleBoxY + articleBoxH);
    artGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    artGrad.addColorStop(0.2, "rgba(240, 253, 250, 0.9)");
    artGrad.addColorStop(1, "rgba(255, 255, 255, 0.95)");
    ctx.fillStyle = artGrad;
    ctx.beginPath();
    ctx.roundRect(leftX, articleBoxY, colW, articleBoxH, 24);
    ctx.fill();

    ctx.strokeStyle = "rgba(13, 148, 136, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Article Header Banner Area
    const artHeaderH = 110;
    const artHeadGrad = ctx.createLinearGradient(leftX, articleBoxY, leftX + colW, articleBoxY + artHeaderH);
    artHeadGrad.addColorStop(0, "rgba(13, 148, 136, 0.15)");
    artHeadGrad.addColorStop(1, "rgba(225, 29, 72, 0.08)");
    ctx.fillStyle = artHeadGrad;
    ctx.beginPath();
    ctx.roundRect(leftX, articleBoxY, colW, artHeaderH, [24, 24, 0, 0]);
    ctx.fill();

    // Stethoscope / Health Icon Watermark
    ctx.font = `64px ${baseFont}`;
    ctx.fillStyle = "rgba(13, 148, 136, 0.2)";
    ctx.textAlign = "right";
    ctx.fillText("🫀", leftX + colW - 20, articleBoxY + 80);

    // Article Big Red Title
    ctx.textAlign = "left";
    ctx.fillStyle = "#E11D48";
    ctx.font = `900 36px ${baseFont}`;
    ctx.fillText(article.title, leftX + 24, articleBoxY + 54);

    // Article Subtitle
    ctx.fillStyle = "#0D9488";
    ctx.font = `800 17px ${baseFont}`;
    ctx.fillText(article.subtitle || "Edukasi & Pencegahan Dini Medis", leftX + 24, articleBoxY + 88);

    // Article Body Content
    let artTextY = articleBoxY + artHeaderH + 24;
    const textPadX = leftX + 24;
    const textW = colW - 48;

    // Summary Lead
    ctx.fillStyle = "#334155";
    ctx.font = `500 13px ${baseFont}`;
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

    artTextY = wrapText(article.summary, textPadX, artTextY, textW, 18) + 6;

    // Section 1: Gejala
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 14px ${baseFont}`;
    ctx.fillText("Gejala " + article.title, textPadX, artTextY);
    artTextY += 20;

    const symptomsList = article.symptoms || article.bullets || [];
    ctx.font = `500 12.5px ${baseFont}`;
    ctx.fillStyle = "#475569";
    for (const sym of symptomsList.slice(0, 3)) {
      ctx.fillText("• " + sym, textPadX + 6, artTextY);
      artTextY += 18;
    }
    artTextY += 6;

    // Section 2: Penyebab
    if (article.causes && artTextY < articleBoxY + articleBoxH - 80) {
      ctx.fillStyle = "#0F172A";
      ctx.font = `800 14px ${baseFont}`;
      ctx.fillText("Penyebab " + article.title, textPadX, artTextY);
      artTextY += 20;

      ctx.font = `500 12.5px ${baseFont}`;
      ctx.fillStyle = "#475569";
      artTextY = wrapText(article.causes, textPadX, artTextY, textW, 17) + 6;
    }

    // Section 3: Kapan Harus ke Dokter
    if (article.whenToDoctor && artTextY < articleBoxY + articleBoxH - 50) {
      ctx.fillStyle = "#E11D48";
      ctx.font = `800 13px ${baseFont}`;
      ctx.fillText("Kapan harus ke dokter?", textPadX, artTextY);
      artTextY += 18;

      ctx.font = `500 12px ${baseFont}`;
      ctx.fillStyle = "#475569";
      artTextY = wrapText(article.whenToDoctor, textPadX, artTextY, textW, 16);
    }

    // Footnote Source Link
    ctx.fillStyle = "#0284C7";
    ctx.font = `italic 11px ${baseFont}`;
    ctx.fillText(article.sourceUrl || "Sumber: RSU Siaga Medika Purbalingga", textPadX, articleBoxY + articleBoxH - 16);

    ctx.restore();
  }

  // ── DRAW RIGHT COLUMN (Dense Stack of Remaining Specialties) ──
  let rightCurY = curY;
  for (const spec of rightSpecs) {
    if (rightCurY > baseHeight - 150) break;
    rightCurY = drawSpecialtyGroup(spec, specMap[spec] || [], rightX, rightCurY, colW);
  }

  // ── 4. FULL-WIDTH RED FOOTER STRIP ──
  if (showFooter) {
    const footH = 68;
    const footY = baseHeight - footH;

    ctx.save();
    // Vibrant Red Bar
    ctx.fillStyle = c.footerBgStart || "#E11D48";
    ctx.fillRect(0, footY, baseWidth, footH);

    // Top gold/white divider line
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillRect(0, footY, baseWidth, 2);

    // Left: "Informasi Jadwal dokter dan Poliklinik:"
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 20px ${baseFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Informasi Jadwal dokter dan Poliklinik:", padX, footY + footH / 2);

    // Center: WhatsApp Phone Hotline
    const waX = baseWidth * 0.58;
    ctx.font = `900 20px ${baseFont}`;
    ctx.fillText(`💬 ${hotlinePhone}`, waX, footY + footH / 2);

    // Right: Instagram Handle
    const igX = baseWidth - padX;
    ctx.textAlign = "right";
    ctx.fillText(`📷 siagamedika_pbg`, igX, footY + footH / 2);

    ctx.restore();
  }

  ctx.restore();
}
