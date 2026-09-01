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
  topicImageImg?: HTMLImageElement | null;
  scaleFactor?: number;
}

const DEFAULT_ARTICLE_TOPIC: HealthEducationTopic = {
  tag: "KESEHATAN JANTUNG",
  title: "Waspada Angin Duduk",
  subtitle: "Nyeri Dada Menjalar, Jangan Disepelekan!",
  summary:
    "Angin duduk (angina) adalah nyeri dada akibat berkurangnya pasokan oksigen ke otot jantung. Kondisi ini sering disalahartikan sebagai masuk angin biasa padahal berisiko fatal.",
  bullets: [
    "Nyeri dada seperti ditindih beban berat",
    "Menjalar ke bahu, leher, punggung, & rahang",
    "Disertai sesak napas & keringat dingin",
  ],
  symptoms: [
    "Nyeri dada terasa seperti tertindih atau ditekan kuat",
    "Nyeri menjalar ke bahu, leher, atau rahang",
    "Sensasi sesak napas dan keringat dingin mendadak",
  ],
  causes:
    "Penyempitan pembuluh darah koroner akibat penumpukan plak kolesterol (aterosklerosis).",
  prevention: [
    "Kontrol tekanan darah dan kolesterol rutin",
    "Hindari merokok dan batasi konsumsi garam",
    "Olahraga aerobik teratur minimal 30 menit sehari",
  ],
  whenToDoctor:
    "Segera ke IGD 24 Jam jika nyeri dada berlangsung >15 menit dan disertai keringat dingin.",
  note: "IGD RSU Siaga Medika siaga 24 jam dengan tim dokter spesialis dan fasilitas EKG terpadu.",
  sourceUrl: "Sumber: PERKI & Kemenkes RI",
  imageUrl: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80",
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
    topicImageImg,
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

  // Standardized High-Legibility SF Pro Typography Stack
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

  // ── 2. DYNAMIC HEADER BAR ARCHITECTURE (ZERO-COLLISION GUARANTEE) ──
  const padX = 48;
  let curY = 36;
  const contentWidth = baseWidth - padX * 2;

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayName = days[selectedDate.getDay()];
  const dateFormatted = `${dayName}, ${String(selectedDate.getDate()).padStart(2, "0")} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  if (headerStyle === "officialSplit" || visualStyle === "siagaOfficial") {
    // ── OFFICIAL HOSPITAL 3-TIER HEADER (ZERO COLLISION) ──
    const logoSize = 60;
    const logoX = padX;
    const logoY = curY;

    // 1. Hospital Logo
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

    // 2. Left Identity
    const brandX = logoX + logoSize + 16;
    ctx.save();
    ctx.fillStyle = "#475569";
    ctx.font = `800 12px ${baseFont}`;
    ctx.fillText("RUMAH SAKIT UMUM", brandX, logoY + 14);

    ctx.fillStyle = c.headerTitle || "#0F766E";
    ctx.font = `900 23px ${baseFont}`;
    ctx.fillText(hospitalName.replace("RUMAH SAKIT UMUM ", ""), brandX, logoY + 36);

    ctx.fillStyle = c.headerSub || "#0D9488";
    ctx.font = `800 13px ${baseFont}`;
    ctx.fillText("PURBALINGGA", brandX, logoY + 54);
    ctx.restore();

    // 3. Right: Official KARS Paripurna Accreditation Box
    if (showAccreditation) {
      const akredW = 164;
      const akredH = 56;
      const akredX = padX + contentWidth - akredW;
      const akredY = logoY;

      ctx.save();
      ctx.fillStyle = "rgba(225, 29, 72, 0.06)";
      ctx.beginPath();
      ctx.roundRect(akredX, akredY, akredW, akredH, 10);
      ctx.fill();

      ctx.strokeStyle = "rgba(225, 29, 72, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#E11D48";
      ctx.font = `800 12px ${baseFont}`;
      ctx.fillText("⭐ ⭐ ⭐ ⭐ ⭐", akredX + 14, akredY + 18);

      ctx.font = `900 13.5px ${baseFont}`;
      ctx.fillText("PARIPURNA", akredX + 14, akredY + 35);

      ctx.fillStyle = "#64748B";
      ctx.font = `700 9px ${baseFont}`;
      ctx.fillText("KARS Kemenkes RI", akredX + 14, akredY + 48);
      ctx.restore();
    }

    // 4. Middle Tier: Modern iOS 27 Large Title "Jadwal Poliklinik & Dokter Spesialis"
    const midY = curY + 70;
    ctx.save();

    // Aesthetic Script "Jadwal"
    ctx.fillStyle = "#0F172A";
    ctx.font = `italic 700 44px ${fontScript}, ${baseFont}`;
    ctx.fillText("Jadwal", padX, midY + 36);

    // Large Title "Poliklinik & Dokter Spesialis" in Apple SF Pro 900 Black
    ctx.fillStyle = "#0F172A";
    ctx.font = `900 32px ${baseFont}`;
    ctx.fillText("Poliklinik & Dokter Spesialis", padX + 132, midY + 36);

    // Subtitle Capsule Pill
    ctx.fillStyle = "rgba(13, 148, 136, 0.1)";
    ctx.beginPath();
    ctx.roundRect(padX + 132, midY + 44, 210, 22, 11);
    ctx.fill();

    ctx.fillStyle = "#0F766E";
    ctx.font = `800 10.5px ${baseFont}`;
    ctx.fillText("🩺 PELAYANAN SPESIALIS TERPADU", padX + 142, midY + 59);

    // Right IGD 24 Jam Badge
    if (showIgdBadge) {
      const igdW = 175;
      const igdX = padX + contentWidth - igdW;
      ctx.fillStyle = "rgba(13, 148, 136, 0.08)";
      ctx.beginPath();
      ctx.roundRect(igdX, midY + 14, igdW, 32, 16);
      ctx.fill();

      ctx.strokeStyle = "rgba(13, 148, 136, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#0F766E";
      ctx.font = `800 11.5px ${baseFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🚨 IGD 24 Jam Siaga", igdX + igdW / 2, midY + 30);
    }
    ctx.restore();

    // 5. Date Banner Row
    const dateRowY = midY + 68;
    ctx.save();
    ctx.fillStyle = c.footerBgStart || "#E11D48";
    ctx.font = `900 34px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.fillText(dateFormatted, baseWidth / 2, dateRowY + 16);

    ctx.fillStyle = "rgba(225, 29, 72, 0.25)";
    ctx.fillRect(baseWidth / 2 - 160, dateRowY + 26, 320, 3);
    ctx.restore();

    curY = dateRowY + 44;

  } else {
    // ── MODERN iOS 27 FROSTED ISLAND HEADER (ZERO COLLISION) ──
    const headH = 136;
    const grad = ctx.createLinearGradient(padX, curY, padX, curY + headH);
    grad.addColorStop(0, c.headerBgStart);
    grad.addColorStop(1, c.headerBgEnd);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(padX, curY, contentWidth, headH, cardCornerRadius + 4);
    ctx.fill();

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

    // Left Emblem
    const embSize = 64;
    const embX = padX + 22;
    const embY = curY + (headH - embSize) / 2;

    const embGrad = ctx.createLinearGradient(embX, embY, embX + embSize, embY + embSize);
    embGrad.addColorStop(0, c.specBgStart);
    embGrad.addColorStop(1, c.specBgEnd);
    ctx.fillStyle = embGrad;
    ctx.beginPath();
    ctx.roundRect(embX, embY, embSize, embSize, emblemShape === "circle" ? embSize / 2 : 16);
    ctx.fill();

    ctx.fillStyle = c.specText || "#FFFFFF";
    ctx.font = `bold 28px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(headerEmblemIcon || "🏥", embX + embSize / 2, embY + embSize / 2);

    // Left Typography
    const textStartX = embX + embSize + 20;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = c.headerTitle;
    ctx.font = `900 23px ${baseFont}`;
    ctx.fillText(hospitalName, textStartX, curY + 50);

    ctx.fillStyle = c.headerSub;
    ctx.font = `700 13px ${baseFont}`;
    ctx.fillText(hospitalSubtitle, textStartX, curY + 76);

    // Right Stacked Capsule Group
    const rightBoxW = 240;
    const rightBoxX = padX + contentWidth - rightBoxW - 16;

    if (showAccreditation) {
      const akredPillH = 30;
      const akredPillY = curY + 22;

      ctx.fillStyle = "rgba(225, 29, 72, 0.08)";
      ctx.beginPath();
      ctx.roundRect(rightBoxX, akredPillY, rightBoxW, akredPillH, 15);
      ctx.fill();

      ctx.strokeStyle = "rgba(225, 29, 72, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#E11D48";
      ctx.font = `800 11px ${baseFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⭐ ⭐ ⭐ ⭐ ⭐ PARIPURNA", rightBoxX + rightBoxW / 2, akredPillY + akredPillH / 2);

      const datePillH = 40;
      const datePillY = curY + 62;

      ctx.fillStyle = c.timePillBg || "rgba(15, 23, 42, 0.08)";
      ctx.beginPath();
      ctx.roundRect(rightBoxX, datePillY, rightBoxW, datePillH, 20);
      ctx.fill();

      ctx.fillStyle = c.timePillText || "#0F172A";
      ctx.font = `800 13px ${baseFont}`;
      ctx.fillText(dateFormatted, rightBoxX + rightBoxW / 2, datePillY + datePillH / 2);
    } else {
      const datePillH = 44;
      const datePillY = curY + (headH - datePillH) / 2;

      ctx.fillStyle = c.timePillBg || "rgba(15, 23, 42, 0.08)";
      ctx.beginPath();
      ctx.roundRect(rightBoxX, datePillY, rightBoxW, datePillH, 22);
      ctx.fill();

      ctx.fillStyle = c.timePillText || "#0F172A";
      ctx.font = `800 13px ${baseFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dateFormatted, rightBoxX + rightBoxW / 2, datePillY + datePillH / 2);
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

        ctx.fillStyle = "#DC2626";
        ctx.fillRect(x, groupY, 3, rowH);

      } else if (visualStyle === "clay3d") {
        ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(x, groupY, w, rowH, 14);
        ctx.fill();

        ctx.shadowColor = "transparent";
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(x, groupY, w, rowH, 10);
        ctx.fill();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = c.cardText || "#0F172A";
      ctx.font = `700 13.5px ${baseFont}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(doc.doctorName, x + 10, groupY + 5);

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

  // ── COMPREHENSIVE AI HEALTH EDUCATION CARD WITH MEDICAL IMAGE ──
  const article = aiTopic || DEFAULT_ARTICLE_TOPIC;
  const articleBoxY = leftCurY + 8;
  const articleBoxH = baseHeight - articleBoxY - (showFooter ? 130 : 50);

  if (showAiEducation && articleBoxH > 220) {
    ctx.save();
    // Card Container
    const artGrad = ctx.createLinearGradient(leftX, articleBoxY, leftX, articleBoxY + articleBoxH);
    artGrad.addColorStop(0, "#FFFFFF");
    artGrad.addColorStop(1, c.cardBgEnd || "#F8FAFC");
    ctx.fillStyle = artGrad;
    ctx.beginPath();
    ctx.roundRect(leftX, articleBoxY, colW, articleBoxH, cardCornerRadius + 4);
    ctx.fill();

    ctx.strokeStyle = c.specBgStart ? `${c.specBgStart}35` : "rgba(13, 148, 136, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top Header with Medical Image or Gradient Scrim
    const artHeaderH = 110;
    if (topicImageImg) {
      // Draw Medical Photo
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(leftX, articleBoxY, colW, artHeaderH, [cardCornerRadius + 4, cardCornerRadius + 4, 0, 0]);
      ctx.clip();
      ctx.drawImage(topicImageImg, leftX, articleBoxY, colW, artHeaderH);

      // Dark Overlay Scrim for 100% Text Readability
      const scrim = ctx.createLinearGradient(leftX, articleBoxY, leftX, articleBoxY + artHeaderH);
      scrim.addColorStop(0, "rgba(15, 23, 42, 0.75)");
      scrim.addColorStop(1, "rgba(15, 23, 42, 0.9)");
      ctx.fillStyle = scrim;
      ctx.fillRect(leftX, articleBoxY, colW, artHeaderH);
      ctx.restore();

      // Top Tag Pill on Image
      ctx.fillStyle = c.specBgStart || "#0D9488";
      ctx.beginPath();
      ctx.roundRect(leftX + 18, articleBoxY + 12, 140, 22, 11);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `900 10.5px ${baseFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(article.tag || "EDUKASI MEDIS", leftX + 18 + 70, articleBoxY + 23);

      // Title & Subtitle on Image
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `900 24px ${baseFont}`;
      ctx.fillText(article.title, leftX + 18, articleBoxY + 62);

      ctx.fillStyle = "#38BDF8";
      ctx.font = `800 13px ${baseFont}`;
      ctx.fillText(article.subtitle || "Edukasi & Deteksi Dini Medis", leftX + 18, articleBoxY + 86);

    } else {
      // Gradient Header Fallback
      const artHeadGrad = ctx.createLinearGradient(leftX, articleBoxY, leftX + colW, articleBoxY + artHeaderH);
      artHeadGrad.addColorStop(0, `${c.specBgStart}25`);
      artHeadGrad.addColorStop(1, `${c.footerBgStart}15`);
      ctx.fillStyle = artHeadGrad;
      ctx.beginPath();
      ctx.roundRect(leftX, articleBoxY, colW, artHeaderH, [cardCornerRadius + 4, cardCornerRadius + 4, 0, 0]);
      ctx.fill();

      // Large Icon Watermark
      ctx.font = `56px ${baseFont}`;
      ctx.fillStyle = `${c.specBgStart}20`;
      ctx.textAlign = "right";
      ctx.fillText("🫀", leftX + colW - 20, articleBoxY + 70);

      // Category Tag Pill
      ctx.fillStyle = c.specBgStart || "#0D9488";
      ctx.beginPath();
      ctx.roundRect(leftX + 18, articleBoxY + 12, 130, 22, 11);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `900 10.5px ${baseFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(article.tag || "EDUKASI MEDIS", leftX + 18 + 65, articleBoxY + 23);

      // Title & Subtitle
      ctx.textAlign = "left";
      ctx.fillStyle = c.footerBgStart || "#E11D48";
      ctx.font = `900 26px ${baseFont}`;
      ctx.fillText(article.title, leftX + 18, articleBoxY + 62);

      ctx.fillStyle = c.specBgStart || "#0D9488";
      ctx.font = `800 13.5px ${baseFont}`;
      ctx.fillText(article.subtitle || "Edukasi & Deteksi Dini Medis", leftX + 18, articleBoxY + 86);
    }

    // Body Medical Flow
    let artTextY = articleBoxY + artHeaderH + 16;
    const textPadX = leftX + 20;
    const textW = colW - 40;

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

    // Summary
    ctx.fillStyle = "#1E293B";
    ctx.font = `500 12.5px ${baseFont}`;
    artTextY = wrapText(article.summary, textPadX, artTextY, textW, 17) + 6;

    // Grid: Gejala & Pencegahan
    const symptomsList = article.symptoms || article.bullets || [];
    if (symptomsList.length > 0 && artTextY < articleBoxY + articleBoxH - 80) {
      ctx.fillStyle = "#E11D48";
      ctx.font = `800 13px ${baseFont}`;
      ctx.fillText("⚠️ Gejala & Tanda Klinis:", textPadX, artTextY);
      artTextY += 17;

      ctx.font = `500 12px ${baseFont}`;
      ctx.fillStyle = "#334155";
      for (const sym of symptomsList.slice(0, 3)) {
        if (artTextY > articleBoxY + articleBoxH - 50) break;
        ctx.fillText("• " + sym, textPadX + 6, artTextY);
        artTextY += 16;
      }
      artTextY += 4;
    }

    // Pencegahan / Solusi
    const prevList = article.prevention || [];
    if (prevList.length > 0 && artTextY < articleBoxY + articleBoxH - 60) {
      ctx.fillStyle = "#0D9488";
      ctx.font = `800 13px ${baseFont}`;
      ctx.fillText("🛡️ Pencegahan & Tips Medis:", textPadX, artTextY);
      artTextY += 17;

      ctx.font = `500 12px ${baseFont}`;
      ctx.fillStyle = "#334155";
      for (const prv of prevList.slice(0, 2)) {
        if (artTextY > articleBoxY + articleBoxH - 45) break;
        ctx.fillText("✓ " + prv, textPadX + 6, artTextY);
        artTextY += 16;
      }
      artTextY += 4;
    }

    // Footnote Citation
    ctx.fillStyle = c.specBgStart || "#0284C7";
    ctx.font = `italic 600 11px ${baseFont}`;
    ctx.fillText(article.sourceUrl || "Sumber: RSU Siaga Medika Purbalingga", textPadX, articleBoxY + articleBoxH - 14);

    ctx.restore();
  }

  // ── DRAW RIGHT COLUMN ──
  let rightCurY = curY;
  for (const spec of rightSpecs) {
    if (rightCurY > baseHeight - (showFooter ? 140 : 60)) break;
    rightCurY = drawCard(spec, specMap[spec] || [], rightX, rightCurY, colW);
  }

  // ── DRAW DEDICATED DOCTOR LEAVE NOTICE CARD (SYNCED WITH THEME, AUTO-HIDES WHEN NO LEAVES) ──
  if (showLeaveCard && leaveDoctors.length > 0 && rightCurY < baseHeight - (showFooter ? 140 : 60)) {
    const leaveCardY = rightCurY + 10;
    const leaveRowH = 34;
    const leaveHeaderH = 38;
    const leaveTotalH = Math.min(leaveHeaderH + leaveDoctors.length * (leaveRowH + 6) + 14, baseHeight - leaveCardY - (showFooter ? 80 : 30));

    ctx.save();
    const leaveGrad = ctx.createLinearGradient(rightX, leaveCardY, rightX + colW, leaveCardY + leaveTotalH);
    leaveGrad.addColorStop(0, c.leaveBg || "#FEF2F2");
    leaveGrad.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = leaveGrad;
    ctx.beginPath();
    ctx.roundRect(rightX, leaveCardY, colW, leaveTotalH, cardCornerRadius);
    ctx.fill();

    ctx.strokeStyle = c.leaveBorder || "rgba(220, 38, 38, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Leave Header Banner
    ctx.fillStyle = c.leaveText || "#DC2626";
    ctx.beginPath();
    ctx.roundRect(rightX, leaveCardY, colW, leaveHeaderH, [cardCornerRadius, cardCornerRadius, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 13px ${baseFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("🚨 PEMBERITAHUAN DOKTER CUTI / LIBUR", rightX + 16, leaveCardY + leaveHeaderH / 2);

    ctx.font = `800 11.5px ${baseFont}`;
    ctx.textAlign = "right";
    ctx.fillText(`${leaveDoctors.length} Dokter`, rightX + colW - 14, leaveCardY + leaveHeaderH / 2);

    // Doctor Leave Rows
    let rowY = leaveCardY + leaveHeaderH + 10;
    ctx.textAlign = "left";

    for (const lDoc of leaveDoctors) {
      if (rowY + leaveRowH > leaveCardY + leaveTotalH) break;

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(rightX + 8, rowY, colW - 16, leaveRowH, 8);
      ctx.fill();

      ctx.strokeStyle = "rgba(220, 38, 38, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = c.leaveText || "#DC2626";
      ctx.beginPath();
      ctx.arc(rightX + 20, rowY + leaveRowH / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0F172A";
      ctx.font = `700 13px ${baseFont}`;
      ctx.textBaseline = "middle";
      ctx.fillText(lDoc.doctorName, rightX + 30, rowY + leaveRowH / 2);

      ctx.textAlign = "right";
      ctx.fillStyle = c.leaveText || "#DC2626";
      ctx.font = `800 11.5px ${baseFont}`;
      const statusLabel = lDoc.replacement ? `Diganti: ${lDoc.replacement}` : `Cuti (${lDoc.specialty})`;
      ctx.fillText(statusLabel, rightX + colW - 18, rowY + leaveRowH / 2);

      ctx.textAlign = "left";
      rowY += leaveRowH + 6;
    }

    ctx.restore();
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

    ctx.fillStyle = c.footerText || "#FFFFFF";
    ctx.font = `900 19px ${baseFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Informasi Jadwal dokter dan Poliklinik:", padX, footY + footH / 2);

    const waX = baseWidth * 0.58;
    ctx.font = `900 19px ${baseFont}`;
    ctx.fillText(`💬 ${hotlinePhone}`, waX, footY + footH / 2);

    const igX = baseWidth - padX;
    ctx.textAlign = "right";
    ctx.fillText(`📷 siagamedika_pbg`, igX, footY + footH / 2);

    ctx.restore();
  }

  ctx.restore();
}
