"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Download,
  Copy,
  Check,
  Calendar as CalendarIcon,
  ChevronLeft,
  Sliders,
  Palette,
  Image as ImageIcon,
  UserX,
  Layers,
  Filter,
  Sparkles,
  Share2,
  PhoneCall,
  Building2,
  Award,
  Upload,
  Search,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Doctor, Shift, LeaveRequest } from "@/lib/data-service";
import { getIndonesianHoliday } from "@/lib/holidays";

type ThemeType = "sage" | "white" | "dark" | "rose" | "emerald" | "cobalt";

export default function PosterStudioPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [aspectRatio, setAspectRatio] = useState<"poster" | "story" | "feed">("poster");
  const [themeMode, setThemeMode] = useState<ThemeType>("sage");
  const [poliFilter, setPoliFilter] = useState<"all" | "Bedah" | "NonBedah">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLeaveCard, setShowLeaveCard] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Custom Branding Settings
  const [hospitalName, setHospitalName] = useState("RSU SIAGA MEDIKA PURBALINGGA");
  const [hospitalSubtitle, setHospitalSubtitle] = useState("JADWAL RESMI PRAKTEK POLIKLINIK & DOKTER SPESIALIS");
  const [accreditationText, setAccreditationText] = useState("⭐ AKREDITASI PARIPURNA KARS");
  const [hotlinePhone, setHotlinePhone] = useState("0823-2344-6076");
  const [websiteUrl, setWebsiteUrl] = useState("simed.fallonava.my.id/jadwal");

  // Custom Logo Upload
  const [customLogoSrc, setCustomLogoSrc] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const customLogoImgRef = useRef<HTMLImageElement | null>(null);

  const { data: rawShifts } = useSWR<Shift[]>("/api/shifts");
  const { data: rawDoctors } = useSWR<Doctor[]>("/api/doctors");
  const { data: rawLeaves } = useSWR<LeaveRequest[]>("/api/leaves");

  const shifts = Array.isArray(rawShifts) ? rawShifts : [];
  const doctors = Array.isArray(rawDoctors) ? rawDoctors : [];
  const leaves = Array.isArray(rawLeaves) ? rawLeaves : [];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrImageRef = useRef<HTMLImageElement | null>(null);

  // Preload QR Code
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://${websiteUrl}`;
    img.onload = () => { qrImageRef.current = img; };
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
      };
    };
    reader.readAsDataURL(file);
  };

  // Compute doctor schedule grouped by Specialty for selected date
  const scheduleData = useCallback(() => {
    const dayIdx = (selectedDate.getDay() + 6) % 7; // 0 = Senin, 6 = Minggu
    const dateStr = selectedDate.toISOString().slice(0, 10);
    const holiday = getIndonesianHoliday(selectedDate);

    const activeShifts = shifts.filter((s) => s.dayIdx === dayIdx);
    const specMap: Record<string, Array<{ doctorName: string; time: string; status: string; category: string; replacement?: string | null }>> = {};
    const leaveDoctors: Array<{ doctorName: string; specialty: string; replacement?: string | null }> = [];

    activeShifts.forEach((s) => {
      const doc = doctors.find((d) => d.id === s.doctorId);
      if (!doc) return;

      if (poliFilter !== "all" && (doc.category || "NonBedah") !== poliFilter) {
        return;
      }

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

      const specName = (doc.specialty || "Umum").replace(/Spesialis\s*/i, "").replace(/Poli\s*/i, "").trim().toUpperCase();

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

  // Telemetry summary stats
  const stats = useMemo(() => {
    const { specMap, leaveDoctors } = scheduleData();
    let totalPracticing = 0;
    Object.values(specMap).forEach((docs) => {
      totalPracticing += docs.filter((d) => d.status !== "CUTI").length;
    });
    return {
      activeSpecs: Object.keys(specMap).length,
      practicingDoctors: totalPracticing,
      leaveDoctorsCount: leaveDoctors.length,
    };
  }, [scheduleData]);

  // Helper: Draw 3D Apple Claymorphic Tile with Inset Bevel Lighting & Diffuse Drop Shadow
  const drawClayTile = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    options: {
      fillTop?: string;
      fillBottom?: string;
      shadowColor?: string;
      shadowBlur?: number;
      shadowOffsetY?: number;
      borderLight?: string;
      borderDark?: string;
    } = {}
  ) => {
    const {
      fillTop = "#FFFFFF",
      fillBottom = "#F1F5F9",
      shadowColor = "rgba(15, 23, 42, 0.08)",
      shadowBlur = 14,
      shadowOffsetY = 5,
      borderLight = "rgba(255, 255, 255, 0.9)",
      borderDark = "rgba(0, 0, 0, 0.06)",
    } = options;

    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = shadowOffsetY;

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, fillBottom);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = borderLight;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.stroke();

    ctx.strokeStyle = borderDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  };

  // Helper: Get Doctor Avatar Initials
  const getInitials = (name: string): string => {
    const cleaned = name.replace(/\b(dr|drg|prof|sp|rr|m)\b\.?/gi, "").trim();
    const parts = cleaned.split(" ").filter((p) => p.length > 0);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return "DR";
  };

  // Canvas Drawing Engine (Ultra Aesthetic Apple iOS Bento Matrix)
  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = aspectRatio === "story" ? 1920 : (aspectRatio === "feed" ? 1080 : 1440);
    canvas.width = width;
    canvas.height = height;

    const { specMap, leaveDoctors } = scheduleData();
    const isDark = themeMode === "dark";

    // ── 1. BACKGROUND CANVAS GRADIENTS (6 Visual Modes) ──
    if (themeMode === "sage") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#D2E5EC");
      bgGrad.addColorStop(0.45, "#BED9E3");
      bgGrad.addColorStop(1, "#ACCDD8");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow1 = ctx.createRadialGradient(280, 200, 20, 280, 200, 550);
      glow1.addColorStop(0, "rgba(255, 255, 255, 0.7)");
      glow1.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);
    } else if (themeMode === "white") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#FFFFFF");
      bgGrad.addColorStop(0.4, "#F8FAFC");
      bgGrad.addColorStop(1, "#EDF4F8");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(220, 160, 10, 220, 160, 500);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.15)");
      glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else if (themeMode === "dark") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080D1A");
      bgGrad.addColorStop(0.5, "#0F172A");
      bgGrad.addColorStop(1, "#0A101D");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(260, 200, 10, 260, 200, 520);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else if (themeMode === "rose") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#FCE7F3");
      bgGrad.addColorStop(0.5, "#FBCFE8");
      bgGrad.addColorStop(1, "#F472B6");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(240, 180, 10, 240, 180, 500);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else if (themeMode === "emerald") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#D1FAE5");
      bgGrad.addColorStop(0.5, "#A7F3D0");
      bgGrad.addColorStop(1, "#6EE7B7");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(240, 180, 10, 240, 180, 500);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Cobalt Corporate Blue
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#DBEAFE");
      bgGrad.addColorStop(0.5, "#BFDBFE");
      bgGrad.addColorStop(1, "#93C5FD");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(240, 180, 10, 240, 180, 500);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    const pad = 34;
    let currY = pad;

    // ── 2. ULTRA APPLE iOS HEADER BENTO BAR ──
    const headerW = width - pad * 2;
    const headerH = 92;

    drawClayTile(ctx, pad, currY, headerW, headerH, 26, {
      fillTop: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
      fillBottom: isDark ? "rgba(15, 23, 42, 0.95)" : "#EEF5F8",
      shadowColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(15, 76, 92, 0.14)",
      shadowBlur: 18,
      shadowOffsetY: 6,
      borderLight: isDark ? "rgba(255, 255, 255, 0.16)" : "#FFFFFF",
    });

    // Custom Logo OR 3D Apple Health Emblem (+)
    const emblemX = pad + 18;
    const emblemY = currY + 17;
    const emblemSize = 58;

    if (customLogoImgRef.current && customLogoImgRef.current.complete) {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 18);
        ctx.clip();
        ctx.drawImage(customLogoImgRef.current, emblemX, emblemY, emblemSize, emblemSize);
        ctx.restore();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 18);
        ctx.stroke();
      } catch (e) {}
    } else {
      const emblemGrad = ctx.createLinearGradient(emblemX, emblemY, emblemX + emblemSize, emblemY + emblemSize);
      emblemGrad.addColorStop(0, "#10B981");
      emblemGrad.addColorStop(1, "#047857");
      ctx.fillStyle = emblemGrad;
      ctx.beginPath();
      ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 18);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 34px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", emblemX + emblemSize / 2, emblemY + emblemSize / 2);
    }

    // Hospital Typography
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#34D399" : "#0F766E";
    ctx.font = "900 20px sans-serif";
    ctx.fillText(hospitalName, pad + 90, currY + 36);

    ctx.fillStyle = isDark ? "#94A3B8" : "#64748B";
    ctx.font = "800 13px sans-serif";
    ctx.fillText(hospitalSubtitle, pad + 90, currY + 62);

    // Date & KARS Badges
    const dateFormatted = selectedDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).toUpperCase();

    const datePinW = 330;
    const datePinH = 60;
    const datePinX = width - pad - datePinW - 16;
    const datePinY = currY + 16;

    drawClayTile(ctx, datePinX, datePinY, datePinW, datePinH, 18, {
      fillTop: isDark ? "rgba(15, 23, 42, 0.9)" : "#F0F7FA",
      fillBottom: isDark ? "rgba(10, 15, 29, 0.9)" : "#E2EEF2",
      shadowColor: "rgba(0,0,0,0.08)",
      shadowBlur: 8,
      shadowOffsetY: 2,
    });

    // 3D Red Calendar Pin Block
    const calBlockX = datePinX + 9;
    const calBlockY = datePinY + 8;
    const calBlockW = 44;
    const calBlockH = 44;

    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.roundRect(calBlockX, calBlockY, calBlockW, 15, [8, 8, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(calBlockX, calBlockY + 15, calBlockW, 29, [0, 0, 8, 8]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(selectedDate.toLocaleDateString("id-ID", { weekday: "short" }).toUpperCase(), calBlockX + 22, calBlockY + 11);

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 17px sans-serif";
    ctx.fillText(String(selectedDate.getDate()), calBlockX + 22, calBlockY + 36);

    // Date Text
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
    ctx.font = "900 13.5px sans-serif";
    ctx.fillText(dateFormatted, datePinX + 62, datePinY + 28);

    ctx.fillStyle = "#D97706";
    ctx.font = "900 11px sans-serif";
    ctx.fillText(accreditationText, datePinX + 62, datePinY + 47);

    currY += headerH + 18;

    // ── 3. DEDICATED LEAVE DOCTORS BENTO CARD (Ultra Rose Velvet Clay) ──
    if (showLeaveCard && leaveDoctors.length > 0) {
      const leaveCardH = 48 + Math.ceil(leaveDoctors.length / 2) * 32 + 8;

      drawClayTile(ctx, pad, currY, headerW, leaveCardH, 22, {
        fillTop: isDark ? "rgba(225, 29, 72, 0.22)" : "#FFF1F2",
        fillBottom: isDark ? "rgba(159, 18, 57, 0.22)" : "#FFE4E6",
        shadowColor: "rgba(225, 29, 72, 0.18)",
        shadowBlur: 14,
        shadowOffsetY: 4,
        borderLight: "rgba(255, 255, 255, 0.85)",
        borderDark: "rgba(225, 29, 72, 0.28)",
      });

      ctx.fillStyle = "#E11D48";
      ctx.font = "900 13.5px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("📅 PEMBERITAHUAN DOKTER CUTI / TIDAK PRAKTEK HARI INI :", pad + 22, currY + 29);

      const halfLeave = Math.ceil(leaveDoctors.length / 2);
      const leaveColW = (headerW - 52) / 2;

      leaveDoctors.forEach((ld, idx) => {
        const colIdx = idx >= halfLeave ? 1 : 0;
        const rowIdx = idx >= halfLeave ? idx - halfLeave : idx;
        const itemX = pad + 22 + colIdx * (leaveColW + 24);
        const itemY = currY + 58 + rowIdx * 30;

        ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
        ctx.font = "800 13px sans-serif";
        ctx.fillText(`• ${ld.doctorName} (${ld.specialty})`, itemX, itemY);

        if (ld.replacement) {
          ctx.fillStyle = "#059669";
          ctx.font = "900 12px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`🔄 Digantikan: ${ld.replacement}`, itemX + leaveColW, itemY);
          ctx.textAlign = "left";
        } else {
          ctx.fillStyle = "#E11D48";
          ctx.font = "900 12px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("Libur", itemX + leaveColW, itemY);
          ctx.textAlign = "left";
        }
      });

      currY += leaveCardH + 18;
    }

    // ── 4. FULL SCHEDULE 2-COLUMN ULTRA AESTHETIC BENTO MATRIX ──
    const specEntries = Object.entries(specMap);
    const colW = (headerW - 20) / 2;
    const footerH = 82;

    const leftSpecs: typeof specEntries = [];
    const rightSpecs: typeof specEntries = [];

    specEntries.forEach(([spec, docs], idx) => {
      if (idx % 2 === 0) leftSpecs.push([spec, docs]);
      else rightSpecs.push([spec, docs]);
    });

    const renderSpecColumn = (specs: typeof specEntries, startX: number, startY: number) => {
      let colY = startY;
      specs.forEach(([specName, docList]) => {
        const headerH = 32;
        const cardH = 48;
        const cardGap = 8;
        const totalSectionH = headerH + docList.length * (cardH + cardGap);

        drawClayTile(ctx, startX, colY, colW, headerH, 16, {
          fillTop: "#569DAA",
          fillBottom: "#3A7685",
          shadowColor: "rgba(58, 118, 133, 0.28)",
          shadowBlur: 8,
          shadowOffsetY: 2,
          borderLight: "rgba(255, 255, 255, 0.65)",
        });

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(specName, startX + colW / 2, colY + 20);

        let doctorY = colY + headerH + 6;

        docList.forEach((d) => {
          const isCuti = d.status === "CUTI";
          const isBedah = d.category === "Bedah";

          drawClayTile(ctx, startX, doctorY, colW, cardH, 16, {
            fillTop: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
            fillBottom: isDark ? "rgba(15, 23, 42, 0.95)" : "#F5F9FA",
            shadowColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(15, 76, 92, 0.08)",
            shadowBlur: 8,
            shadowOffsetY: 2,
            borderLight: isDark ? "rgba(255, 255, 255, 0.12)" : "#FFFFFF",
          });

          const avatarSize = 34;
          const avatarX = startX + 8;
          const avatarY = doctorY + 7;

          const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
          if (isCuti) {
            avatarGrad.addColorStop(0, "#F43F5E");
            avatarGrad.addColorStop(1, "#BE123C");
          } else if (isBedah) {
            avatarGrad.addColorStop(0, "#3B82F6");
            avatarGrad.addColorStop(1, "#1D4ED8");
          } else {
            avatarGrad.addColorStop(0, "#10B981");
            avatarGrad.addColorStop(1, "#047857");
          }

          ctx.fillStyle = avatarGrad;
          ctx.beginPath();
          ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 11);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "900 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(getInitials(d.doctorName), avatarX + avatarSize / 2, avatarY + 22);

          ctx.textAlign = "left";
          ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
          ctx.font = "900 13px sans-serif";
          ctx.fillText(d.doctorName.slice(0, 26), startX + 48, doctorY + (d.replacement ? 21 : 28));

          if (d.replacement) {
            ctx.fillStyle = "#059669";
            ctx.font = "900 10.5px sans-serif";
            ctx.fillText(`🔄 Digantikan: ${d.replacement}`, startX + 48, doctorY + 38);
          }

          const timePillW = isCuti ? 84 : 130;
          const timePillH = 30;
          const timePillX = startX + colW - timePillW - 8;
          const timePillY = doctorY + 9;

          if (isCuti) {
            ctx.fillStyle = "rgba(225, 29, 72, 0.12)";
            ctx.beginPath();
            ctx.roundRect(timePillX, timePillY, timePillW, timePillH, 10);
            ctx.fill();

            ctx.fillStyle = "#E11D48";
            ctx.font = "900 11.5px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("LIBUR 📅", timePillX + timePillW / 2, timePillY + 19);
          } else {
            ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.1)";
            ctx.beginPath();
            ctx.roundRect(timePillX, timePillY, timePillW, timePillH, 10);
            ctx.fill();

            ctx.fillStyle = isDark ? "#38BDF8" : "#0369A1";
            ctx.font = "900 11.5px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`🕒 ${d.time}`, timePillX + timePillW / 2, timePillY + 19);
          }

          doctorY += cardH + cardGap;
        });

        colY += totalSectionH + 12;
      });
    };

    renderSpecColumn(leftSpecs, pad, currY);
    renderSpecColumn(rightSpecs, pad + colW + 20, currY);

    // ── 5. FULL-WIDTH APPLE iOS FOOTER BENTO HUB ──
    const footerY = height - pad - footerH;

    drawClayTile(ctx, pad, footerY, headerW, footerH, 24, {
      fillTop: isDark ? "#065F46" : "#0F766E",
      fillBottom: isDark ? "#022C22" : "#044E48",
      shadowColor: "rgba(4, 78, 72, 0.35)",
      shadowBlur: 16,
      shadowOffsetY: 6,
      borderLight: "rgba(255, 255, 255, 0.35)",
    });

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 14px sans-serif";
    ctx.fillText(`📱 PENDAFTARAN VIA WHATSAPP : ${hotlinePhone}`, pad + 24, footerY + 34);

    ctx.fillStyle = "#A7F3D0";
    ctx.font = "800 12px sans-serif";
    ctx.fillText(`🌐 Cek Live Jadwal & Antrean Dokter: ${websiteUrl}`, pad + 24, footerY + 58);

    // Center Emergency Badge
    const igdBadgeX = pad + 560;
    const igdBadgeY = footerY + 20;
    drawClayTile(ctx, igdBadgeX, igdBadgeY, 210, 42, 14, {
      fillTop: "rgba(225, 29, 72, 0.25)",
      fillBottom: "rgba(159, 18, 57, 0.35)",
      shadowColor: "rgba(0,0,0,0.15)",
      shadowBlur: 6,
      shadowOffsetY: 2,
      borderLight: "rgba(255, 255, 255, 0.25)",
    });

    ctx.fillStyle = "#FFE4E6";
    ctx.font = "900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🚨 IGD & AMBULANS 24 JAM", igdBadgeX + 105, igdBadgeY + 25);

    if (qrImageRef.current && qrImageRef.current.complete) {
      try {
        const qrTileW = 64;
        const qrTileH = 64;
        const qrTileX = pad + headerW - qrTileW - 12;
        const qrTileY = footerY + 9;

        drawClayTile(ctx, qrTileX, qrTileY, qrTileW, qrTileH, 16, {
          fillTop: "#FFFFFF",
          fillBottom: "#F8FAFC",
          shadowColor: "rgba(0,0,0,0.25)",
          shadowBlur: 8,
          shadowOffsetY: 2,
        });

        ctx.drawImage(qrImageRef.current, qrTileX + 4, qrTileY + 4, qrTileW - 8, qrTileH - 8);
      } catch (e) {}
    }

  }, [
    scheduleData,
    selectedDate,
    themeMode,
    showLeaveCard,
    aspectRatio,
    hospitalName,
    hospitalSubtitle,
    accreditationText,
    hotlinePhone,
    websiteUrl,
  ]);

  useEffect(() => {
    renderToCanvas();
  }, [renderToCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dateKey = selectedDate.toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.download = `jadwal-dokter-siagamedika-${dateKey}-${aspectRatio}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch (e) {
      handleDownload();
    }
  };

  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `jadwal-dokter-${selectedDate.toISOString().slice(0, 10)}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Jadwal Dokter ${hospitalName}`,
            text: `Informasi resmi jadwal dokter & poliklinik ${hospitalName} tanggal ${selectedDate.toLocaleDateString("id-ID")}`,
            files: [file],
          });
          setShared(true);
          setTimeout(() => setShared(false), 2500);
        } else {
          handleCopy();
        }
      });
    } catch (e) {
      handleCopy();
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-y-auto bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100 p-3 sm:p-6 lg:p-8">
      {/* ── Studio Standard Page Header ── */}
      <PageHeader
        icon={<Palette size={22} className="text-white" strokeWidth={2.5} />}
        title="Studio Poster Selebaran"
        accentWord="Poster"
        accentColor="text-emerald-600 dark:text-emerald-400"
        subtitle="Generator poster jadwal dokter & publikasi sosial media beresolusi tinggi"
        iconClay="clay-icon-cyan"
        accentBarGradient="from-cyan-500 via-teal-500 to-emerald-500"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/schedules"
              className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-[18px] clay-button text-zinc-600 dark:text-zinc-300 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-xs shrink-0"
              title="Kembali ke Jadwal Mingguan"
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
              <span>Jadwal Dokter</span>
            </Link>

            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[18px] clay-button text-blue-600 dark:text-blue-400 font-black text-xs sm:text-sm active:scale-95 transition-all shadow-xs shrink-0"
              title="Bagikan via WhatsApp / Medsos"
            >
              {shared ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>Dibagikan!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} strokeWidth={2.5} />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[18px] clay-button text-zinc-700 dark:text-zinc-200 font-black text-xs sm:text-sm active:scale-95 transition-all shadow-xs shrink-0"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500" strokeWidth={3} />
                  <span className="text-emerald-500">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={2.5} />
                  <span>Salin</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-[18px] clay-pill-emerald text-white font-black text-xs sm:text-sm active:scale-95 transition-all shadow-md shrink-0"
            >
              <Download size={14} strokeWidth={2.5} />
              <span>Download Ultra HD</span>
            </button>
          </div>
        }
      />

      {/* ── Studio Telemetry Stats Bar ── */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="clay-surface rounded-[18px] p-3 flex items-center gap-3 border border-zinc-200/50 dark:border-white/5">
          <div className="w-9 h-9 rounded-[12px] clay-icon-blue flex items-center justify-center text-white shrink-0">
            <Building2 size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase">Spesialisasi Aktif</div>
            <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">{stats.activeSpecs} Poliklinik</div>
          </div>
        </div>

        <div className="clay-surface rounded-[18px] p-3 flex items-center gap-3 border border-zinc-200/50 dark:border-white/5">
          <div className="w-9 h-9 rounded-[12px] clay-icon-emerald flex items-center justify-center text-white shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase">Dokter Praktek</div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{stats.practicingDoctors} Dokter</div>
          </div>
        </div>

        <div className="clay-surface rounded-[18px] p-3 flex items-center gap-3 border border-zinc-200/50 dark:border-white/5">
          <div className="w-9 h-9 rounded-[12px] clay-icon-rose flex items-center justify-center text-white shrink-0">
            <UserX size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase">Dokter Cuti / Libur</div>
            <div className="text-sm font-black text-rose-500">{stats.leaveDoctorsCount} Dokter</div>
          </div>
        </div>
      </div>

      {/* ── Studio Workspace Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT CONTROL PANEL (5 Cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Card 1: Format & Tanggal */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-5 flex flex-col gap-4 border border-zinc-200/50 dark:border-white/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Sliders size={14} />
              <span>Format & Tanggal</span>
            </h3>

            {/* Date Input */}
            <div>
              <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 mb-1.5 block">
                Pilih Tanggal Jadwal:
              </label>
              <input
                type="date"
                value={selectedDate.toISOString().slice(0, 10)}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(new Date(e.target.value));
                }}
                className="clay-inset px-3 py-2 rounded-[14px] text-xs font-black text-zinc-900 dark:text-zinc-100 outline-none w-full"
              />
            </div>

            {/* Aspect Ratio Switch */}
            <div>
              <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 mb-1.5 block">
                Ukuran Frame Output:
              </label>
              <div className="grid grid-cols-3 gap-1.5 clay-inset p-1 rounded-[16px]">
                <button
                  onClick={() => setAspectRatio("poster")}
                  className={cn(
                    "py-1.5 rounded-[12px] text-xs font-black transition-all",
                    aspectRatio === "poster" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-500"
                  )}
                >
                  Poster 4:5
                </button>
                <button
                  onClick={() => setAspectRatio("story")}
                  className={cn(
                    "py-1.5 rounded-[12px] text-xs font-black transition-all",
                    aspectRatio === "story" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-500"
                  )}
                >
                  Story 9:16
                </button>
                <button
                  onClick={() => setAspectRatio("feed")}
                  className={cn(
                    "py-1.5 rounded-[12px] text-xs font-black transition-all",
                    aspectRatio === "feed" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-500"
                  )}
                >
                  Feed 1:1
                </button>
              </div>
            </div>

            {/* 6 Theme Switcher */}
            <div>
              <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 mb-1.5 block">
                Pilihan Estetika Clay (6 Tema):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "sage", label: "🌊 Sage Mint" },
                  { id: "white", label: "☀️ Apple Light" },
                  { id: "dark", label: "🌙 Midnight Glass" },
                  { id: "rose", label: "🌸 Rose Velvet" },
                  { id: "emerald", label: "🌿 Emerald Botani" },
                  { id: "cobalt", label: "💎 Royal Cobalt" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeMode(t.id as ThemeType)}
                    className={cn(
                      "py-2 px-1.5 rounded-[14px] text-xs font-black transition-all text-center",
                      themeMode === t.id ? "clay-pill-blue text-white shadow-xs" : "clay-button text-zinc-600 dark:text-zinc-300"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Poli & Search */}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200/50 dark:border-white/5">
              <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 block">
                Filter Poli & Cari Dokter:
              </label>
              <div className="grid grid-cols-3 gap-1.5 clay-inset p-1 rounded-[16px]">
                <button
                  onClick={() => setPoliFilter("all")}
                  className={cn(
                    "py-1 rounded-[12px] text-xs font-black transition-all",
                    poliFilter === "all" ? "clay-button text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
                  )}
                >
                  Semua Poli
                </button>
                <button
                  onClick={() => setPoliFilter("Bedah")}
                  className={cn(
                    "py-1 rounded-[12px] text-xs font-black transition-all",
                    poliFilter === "Bedah" ? "clay-button text-blue-600 dark:text-blue-400" : "text-zinc-400"
                  )}
                >
                  Bedah
                </button>
                <button
                  onClick={() => setPoliFilter("NonBedah")}
                  className={cn(
                    "py-1 rounded-[12px] text-xs font-black transition-all",
                    poliFilter === "NonBedah" ? "clay-button text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                  )}
                >
                  Non-Bedah
                </button>
              </div>

              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari spesialisasi / nama dokter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clay-inset pl-8 pr-3 py-1.5 rounded-[12px] text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none w-full"
                />
              </div>
            </div>

            {/* Toggle Dokter Cuti */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-white/5">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <UserX size={14} className="text-rose-500" />
                <span>Kartu Dokter Cuti & Pengganti</span>
              </span>
              <button
                onClick={() => setShowLeaveCard(!showLeaveCard)}
                className={cn(
                  "w-11 h-6 rounded-full transition-all relative flex items-center p-0.5",
                  showLeaveCard ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-white shadow-md transition-all",
                    showLeaveCard ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Card 2: Kustomisasi Branding & Header Footer */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-5 flex flex-col gap-3.5 border border-zinc-200/50 dark:border-white/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Award size={14} />
              <span>Kustomisasi Branding & Kontak RS</span>
            </h3>

            {/* Logo Upload */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Logo Rumah Sakit:</span>
              <div className="flex items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-[12px] clay-button text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                >
                  <Upload size={12} />
                  <span>{customLogoSrc ? "Ganti Logo" : "Upload Logo"}</span>
                </button>
                {customLogoSrc && (
                  <button
                    onClick={() => {
                      setCustomLogoSrc(null);
                      customLogoImgRef.current = null;
                    }}
                    className="px-2.5 py-1.5 rounded-[12px] clay-button text-[11px] font-bold text-rose-500 active:scale-95 transition-all"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Text Inputs */}
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase">Nama Rumah Sakit:</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="clay-inset px-2.5 py-1.5 rounded-[10px] text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none w-full mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase">Teks Akreditasi / Badge:</label>
              <input
                type="text"
                value={accreditationText}
                onChange={(e) => setAccreditationText(e.target.value)}
                className="clay-inset px-2.5 py-1.5 rounded-[10px] text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none w-full mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase">WhatsApp Hotline:</label>
                <input
                  type="text"
                  value={hotlinePhone}
                  onChange={(e) => setHotlinePhone(e.target.value)}
                  className="clay-inset px-2.5 py-1.5 rounded-[10px] text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none w-full mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase">URL Web / Jadwal:</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="clay-inset px-2.5 py-1.5 rounded-[10px] text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none w-full mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT LIVE CANVAS PREVIEW (7 Cols) ── */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-6 rounded-[32px] clay-inset bg-black/20 relative min-h-[640px]">
          <canvas
            ref={canvasRef}
            className="rounded-[24px] shadow-2xl max-w-full max-h-[780px] object-contain border border-zinc-700/30"
          />
        </div>
      </div>
    </div>
  );
}
