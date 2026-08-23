"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Camera,
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
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, Shift, LeaveRequest } from "@/lib/data-service";
import { getIndonesianHoliday } from "@/lib/holidays";

export default function PosterStudioPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [aspectRatio, setAspectRatio] = useState<"poster" | "story" | "feed">("poster");
  const [themeMode, setThemeMode] = useState<"sage" | "white" | "dark">("sage");
  const [poliFilter, setPoliFilter] = useState<"all" | "Bedah" | "NonBedah">("all");
  const [showLeaveCard, setShowLeaveCard] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

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
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://simed.fallonava.my.id/jadwal";
    img.onload = () => { qrImageRef.current = img; };
  }, []);

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
  }, [selectedDate, doctors, shifts, leaves, poliFilter]);

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

  // Canvas Drawing Engine (Full Schedule Apple iOS Bento Grid)
  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = aspectRatio === "story" ? 1920 : (aspectRatio === "feed" ? 1080 : 1440);
    canvas.width = width;
    canvas.height = height;

    const { specMap, leaveDoctors, holiday } = scheduleData();
    const isDark = themeMode === "dark";

    // ── 1. BACKGROUND CANVAS GRADIENTS ──
    if (themeMode === "sage") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#D0E4EB");
      bgGrad.addColorStop(0.5, "#BED8E2");
      bgGrad.addColorStop(1, "#AECED9");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft ambient light orbs
      const glow1 = ctx.createRadialGradient(240, 200, 20, 240, 200, 520);
      glow1.addColorStop(0, "rgba(255, 255, 255, 0.65)");
      glow1.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(880, 1100, 20, 880, 1100, 550);
      glow2.addColorStop(0, "rgba(75, 139, 155, 0.25)");
      glow2.addColorStop(1, "rgba(75, 139, 155, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);
    } else if (themeMode === "white") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#FFFFFF");
      bgGrad.addColorStop(0.4, "#F8FAFC");
      bgGrad.addColorStop(1, "#EEF4F8");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(200, 150, 10, 200, 150, 480);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.12)");
      glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080D1A");
      bgGrad.addColorStop(0.5, "#0F172A");
      bgGrad.addColorStop(1, "#0A101D");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(260, 200, 10, 260, 200, 520);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.2)");
      glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    const pad = 36;
    let currY = pad;

    // ── 2. HEADER BENTO BAR: HOSPITAL LOGO + KARS ACCREDITATION + DATE PIN ──
    const headerW = width - pad * 2;
    const headerH = 88;

    drawClayTile(ctx, pad, currY, headerW, headerH, 24, {
      fillTop: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
      fillBottom: isDark ? "rgba(15, 23, 42, 0.95)" : "#EEF5F8",
      shadowColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(15, 76, 92, 0.12)",
      shadowBlur: 16,
      shadowOffsetY: 6,
      borderLight: isDark ? "rgba(255, 255, 255, 0.16)" : "#FFFFFF",
    });

    // 3D Emerald Apple Health Cross Emblem (+)
    const emblemX = pad + 18;
    const emblemY = currY + 16;
    const emblemSize = 56;

    const emblemGrad = ctx.createLinearGradient(emblemX, emblemY, emblemX + emblemSize, emblemY + emblemSize);
    emblemGrad.addColorStop(0, "#10B981");
    emblemGrad.addColorStop(1, "#047857");
    ctx.fillStyle = emblemGrad;
    ctx.beginPath();
    ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 18);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", emblemX + emblemSize / 2, emblemY + emblemSize / 2);

    // Hospital Name & Subtitle
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#34D399" : "#0F766E";
    ctx.font = "900 20px sans-serif";
    ctx.fillText("RSU SIAGA MEDIKA PURBALINGGA", pad + 86, currY + 34);

    ctx.fillStyle = isDark ? "#94A3B8" : "#64748B";
    ctx.font = "800 13px sans-serif";
    ctx.fillText("JADWAL RESMI PRAKTEK POLIKLINIK & DOKTER SPESIALIS", pad + 86, currY + 60);

    // Date & KARS Badges on Right
    const dateFormatted = selectedDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).toUpperCase();

    // Right Date Pin Capsule
    const datePinW = 320;
    const datePinH = 56;
    const datePinX = width - pad - datePinW - 16;
    const datePinY = currY + 16;

    drawClayTile(ctx, datePinX, datePinY, datePinW, datePinH, 18, {
      fillTop: isDark ? "rgba(15, 23, 42, 0.9)" : "#F0F7FA",
      fillBottom: isDark ? "rgba(10, 15, 29, 0.9)" : "#E2EEF2",
      shadowColor: "rgba(0,0,0,0.08)",
      shadowBlur: 8,
      shadowOffsetY: 2,
    });

    // Red Calendar Mini Block
    const calBlockX = datePinX + 8;
    const calBlockY = datePinY + 7;
    const calBlockW = 42;
    const calBlockH = 42;

    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.roundRect(calBlockX, calBlockY, calBlockW, 14, [8, 8, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(calBlockX, calBlockY + 14, calBlockW, 28, [0, 0, 8, 8]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 8.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(selectedDate.toLocaleDateString("id-ID", { weekday: "short" }).toUpperCase(), calBlockX + 21, calBlockY + 10);

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 16px sans-serif";
    ctx.fillText(String(selectedDate.getDate()), calBlockX + 21, calBlockY + 34);

    // Date Text
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
    ctx.font = "900 13px sans-serif";
    ctx.fillText(dateFormatted, datePinX + 58, datePinY + 26);

    ctx.fillStyle = "#D97706";
    ctx.font = "900 11px sans-serif";
    ctx.fillText("⭐ AKREDITASI PARIPURNA KARS", datePinX + 58, datePinY + 44);

    currY += headerH + 20;

    // ── 3. DEDICATED LEAVE DOCTORS BENTO CARD (If Any Leaves & Enabled) ──
    if (showLeaveCard && leaveDoctors.length > 0) {
      const leaveCardH = 46 + Math.ceil(leaveDoctors.length / 2) * 30 + 8;

      drawClayTile(ctx, pad, currY, headerW, leaveCardH, 20, {
        fillTop: isDark ? "rgba(225, 29, 72, 0.2)" : "#FFF1F2",
        fillBottom: isDark ? "rgba(159, 18, 57, 0.2)" : "#FFE4E6",
        shadowColor: "rgba(225, 29, 72, 0.15)",
        shadowBlur: 12,
        shadowOffsetY: 4,
        borderLight: "rgba(255, 255, 255, 0.8)",
        borderDark: "rgba(225, 29, 72, 0.25)",
      });

      // Card Header
      ctx.fillStyle = "#E11D48";
      ctx.font = "900 13.5px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("📅 PEMBERITAHUAN DOKTER CUTI / TIDAK PRAKTEK HARI INI :", pad + 20, currY + 28);

      // Render leaves in 2 columns
      const halfLeave = Math.ceil(leaveDoctors.length / 2);
      const leaveColW = (headerW - 48) / 2;

      leaveDoctors.forEach((ld, idx) => {
        const colIdx = idx >= halfLeave ? 1 : 0;
        const rowIdx = idx >= halfLeave ? idx - halfLeave : idx;
        const itemX = pad + 20 + colIdx * (leaveColW + 24);
        const itemY = currY + 54 + rowIdx * 28;

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

    // ── 4. FULL SCHEDULE 2-COLUMN BENTO GRID ──
    const specEntries = Object.entries(specMap);
    const colW = (headerW - 20) / 2;
    const footerH = 80;
    const availableH = height - currY - footerH - pad - 12;

    // Split specialties into Left & Right Columns
    const leftSpecs: typeof specEntries = [];
    const rightSpecs: typeof specEntries = [];

    specEntries.forEach(([spec, docs], idx) => {
      if (idx % 2 === 0) leftSpecs.push([spec, docs]);
      else rightSpecs.push([spec, docs]);
    });

    const renderSpecColumn = (specs: typeof specEntries, startX: number, startY: number) => {
      let colY = startY;
      specs.forEach(([specName, docList]) => {
        const headerH = 30;
        const rowH = 28;
        const totalDocRows = docList.length;
        const totalSectionH = headerH + totalDocRows * rowH + 8;

        // Teal / Cyan 3D Clay Capsule Header
        drawClayTile(ctx, startX, colY, colW, headerH, 15, {
          fillTop: "#569DAA",
          fillBottom: "#3D7988",
          shadowColor: "rgba(61, 121, 136, 0.25)",
          shadowBlur: 8,
          shadowOffsetY: 2,
          borderLight: "rgba(255, 255, 255, 0.6)",
        });

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(specName, startX + colW / 2, colY + 19);

        // Doctor Card Container (Porcelain Clay)
        const docCardY = colY + headerH - 1;
        const docCardH = totalDocRows * rowH + 8;

        drawClayTile(ctx, startX, docCardY, colW, docCardH, 16, {
          fillTop: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
          fillBottom: isDark ? "rgba(15, 23, 42, 0.95)" : "#F6FAFC",
          shadowColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(15, 76, 92, 0.08)",
          shadowBlur: 10,
          shadowOffsetY: 3,
        });

        let rowY = docCardY + 21;
        docList.forEach((d) => {
          const isCuti = d.status === "CUTI";

          // Doctor Name on Left
          ctx.textAlign = "left";
          ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
          ctx.font = "800 13px sans-serif";
          ctx.fillText(d.doctorName.slice(0, 28), startX + 16, rowY);

          // Time or Libur on Right
          ctx.textAlign = "right";
          if (isCuti) {
            ctx.fillStyle = "#E11D48";
            ctx.font = "900 12.5px sans-serif";
            ctx.fillText("Libur 📅", startX + colW - 16, rowY);
          } else {
            ctx.fillStyle = isDark ? "#38BDF8" : "#0284C7";
            ctx.font = "800 12px monospace";
            ctx.fillText(`🕒 ${d.time}`, startX + colW - 16, rowY);
          }

          rowY += rowH;
        });

        colY += totalSectionH + 10;
      });
    };

    renderSpecColumn(leftSpecs, pad, currY);
    renderSpecColumn(rightSpecs, pad + colW + 20, currY);

    // ── 5. FULL-WIDTH APPLE iOS FOOTER BENTO HUB ──
    const footerY = height - pad - footerH;

    drawClayTile(ctx, pad, footerY, headerW, footerH, 22, {
      fillTop: isDark ? "#065F46" : "#0F766E",
      fillBottom: isDark ? "#022C22" : "#044E48",
      shadowColor: "rgba(4, 78, 72, 0.35)",
      shadowBlur: 14,
      shadowOffsetY: 5,
      borderLight: "rgba(255, 255, 255, 0.3)",
    });

    // Left Hotline Information
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 14px sans-serif";
    ctx.fillText("📱 PENDAFTARAN VIA WHATSAPP : 0823-2344-6076", pad + 24, footerY + 32);

    ctx.fillStyle = "#A7F3D0";
    ctx.font = "800 12px sans-serif";
    ctx.fillText("🌐 Cek Live Jadwal & Antrean Dokter: simed.fallonava.my.id/jadwal", pad + 24, footerY + 56);

    // Center Emergency Badge
    const igdBadgeX = pad + 560;
    const igdBadgeY = footerY + 20;
    drawClayTile(ctx, igdBadgeX, igdBadgeY, 210, 40, 14, {
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
    ctx.fillText("🚨 IGD & AMBULANS 24 JAM", igdBadgeX + 105, igdBadgeY + 24);

    // Right QR Code Tile
    if (qrImageRef.current && qrImageRef.current.complete) {
      try {
        const qrTileW = 62;
        const qrTileH = 62;
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

  }, [scheduleData, selectedDate, themeMode, showLeaveCard, aspectRatio]);

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

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-y-auto bg-[#EDF2F8] dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* ── Studio Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/60 dark:border-white/5">
        <div className="flex items-center gap-3.5">
          <Link
            href="/schedules"
            className="w-10 h-10 rounded-[14px] clay-button flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all"
            title="Kembali ke Jadwal Dokter"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Apple Claymorphic Bento Studio
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
              Studio Poster Jadwal Lengkap RS
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Layout Penuh Jadwal Dokter Seluruh Poli + Kartu Cuti & Footer Apple iOS Native
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="h-11 px-4 rounded-[16px] clay-button text-zinc-700 dark:text-zinc-200 font-black text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-500" strokeWidth={3} />
                <span className="text-emerald-500">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} strokeWidth={2.5} />
                <span>Salin Gambar</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="h-11 px-5 rounded-[16px] clay-pill-emerald text-white font-black text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <Download size={16} strokeWidth={2.5} />
            <span>Download Poster Ultra HD</span>
          </button>
        </div>
      </div>

      {/* ── Studio Workspace Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* ── LEFT CONTROL PANEL (4 Cols) ── */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Pengaturan Jadwal & Format */}
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
                Ukuran Frame:
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

            {/* Filter Poli */}
            <div>
              <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 mb-1.5 block">
                Kategori Poli:
              </label>
              <div className="grid grid-cols-3 gap-1.5 clay-inset p-1 rounded-[16px]">
                <button
                  onClick={() => setPoliFilter("all")}
                  className={cn(
                    "py-1.5 rounded-[12px] text-xs font-black transition-all",
                    poliFilter === "all" ? "clay-button text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
                  )}
                >
                  Semua
                </button>
                <button
                  onClick={() => setPoliFilter("Bedah")}
                  className={cn(
                    "py-1.5 rounded-[12px] text-xs font-black transition-all",
                    poliFilter === "Bedah" ? "clay-button text-blue-600 dark:text-blue-400" : "text-zinc-400"
                  )}
                >
                  Bedah
                </button>
                <button
                  onClick={() => setPoliFilter("NonBedah")}
                  className={cn(
                    "py-1.5 rounded-[12px] text-xs font-black transition-all",
                    poliFilter === "NonBedah" ? "clay-button text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                  )}
                >
                  Non-Bedah
                </button>
              </div>
            </div>

            {/* Theme Switcher */}
            <div>
              <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 mb-1.5 block">
                Tema Estetika Clay:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setThemeMode("sage")}
                  className={cn(
                    "py-2 px-2 rounded-[14px] text-xs font-black transition-all flex flex-col items-center gap-0.5",
                    themeMode === "sage" ? "clay-pill-blue text-white shadow-xs" : "clay-button text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  <span>🌊 Sage Clay</span>
                </button>
                <button
                  onClick={() => setThemeMode("white")}
                  className={cn(
                    "py-2 px-2 rounded-[14px] text-xs font-black transition-all flex flex-col items-center gap-0.5",
                    themeMode === "white" ? "clay-pill-blue text-white shadow-xs" : "clay-button text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  <span>☀️ Apple Light</span>
                </button>
                <button
                  onClick={() => setThemeMode("dark")}
                  className={cn(
                    "py-2 px-2 rounded-[14px] text-xs font-black transition-all flex flex-col items-center gap-0.5",
                    themeMode === "dark" ? "clay-pill-blue text-white shadow-xs" : "clay-button text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  <span>🌙 Dark Glass</span>
                </button>
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
        </div>

        {/* ── RIGHT LIVE CANVAS PREVIEW (8 Cols) ── */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center p-4 sm:p-6 rounded-[32px] clay-inset bg-black/20 relative min-h-[620px]">
          <canvas
            ref={canvasRef}
            className="rounded-[24px] shadow-2xl max-w-full max-h-[760px] object-contain border border-zinc-700/30"
          />
        </div>
      </div>
    </div>
  );
}
