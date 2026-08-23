"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Camera, Download, Copy, Check, ArrowUpRight, Sliders, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, Shift, LeaveRequest } from "@/lib/data-service";
import { getIndonesianHoliday } from "@/lib/holidays";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  doctors: Doctor[];
  shifts: Shift[];
  leaves?: LeaveRequest[];
}

export function MedsosExportModal({
  isOpen,
  onClose,
  selectedDate,
  doctors,
  shifts,
  leaves = [],
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"poster" | "story" | "feed">("poster");
  const [themeMode, setThemeMode] = useState<"sage" | "white" | "dark">("sage");
  const [poliFilter, setPoliFilter] = useState<"all" | "Bedah" | "NonBedah">("all");
  const [showLeaveCard, setShowLeaveCard] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://simed.fallonava.my.id/jadwal";
    img.onload = () => { qrImageRef.current = img; };
  }, []);

  // Compute doctor schedule grouped by Specialty
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

  // Helper: Draw 3D Apple Clay Tile
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

  // Canvas Drawing Engine (Full Schedule Apple Bento Grid)
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

    // ── 1. BACKGROUND GRADIENTS ──
    if (themeMode === "sage") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#D0E4EB");
      bgGrad.addColorStop(0.5, "#BED8E2");
      bgGrad.addColorStop(1, "#AECED9");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(240, 200, 20, 240, 200, 520);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.65)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else if (themeMode === "white") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#FFFFFF");
      bgGrad.addColorStop(0.4, "#F8FAFC");
      bgGrad.addColorStop(1, "#EEF4F8");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080D1A");
      bgGrad.addColorStop(0.5, "#0F172A");
      bgGrad.addColorStop(1, "#0A101D");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    const pad = 36;
    let currY = pad;

    // ── 2. HEADER BENTO BAR ──
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

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", emblemX + emblemSize / 2, emblemY + emblemSize / 2);

    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#34D399" : "#0F766E";
    ctx.font = "900 20px sans-serif";
    ctx.fillText("RSU SIAGA MEDIKA PURBALINGGA", pad + 86, currY + 34);

    ctx.fillStyle = isDark ? "#94A3B8" : "#64748B";
    ctx.font = "800 13px sans-serif";
    ctx.fillText("JADWAL RESMI PRAKTEK POLIKLINIK & DOKTER SPESIALIS", pad + 86, currY + 60);

    const dateFormatted = selectedDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).toUpperCase();

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

    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
    ctx.font = "900 13px sans-serif";
    ctx.fillText(dateFormatted, datePinX + 58, datePinY + 26);

    ctx.fillStyle = "#D97706";
    ctx.font = "900 11px sans-serif";
    ctx.fillText("⭐ AKREDITASI PARIPURNA KARS", datePinX + 58, datePinY + 44);

    currY += headerH + 20;

    // ── 3. DEDICATED LEAVE DOCTORS BENTO CARD ──
    if (showLeaveCard && leaveDoctors.length > 0) {
      const leaveCardH = 46 + Math.ceil(leaveDoctors.length / 2) * 30 + 8;

      drawClayTile(ctx, pad, currY, headerW, leaveCardH, 20, {
        fillTop: isDark ? "rgba(225, 29, 72, 0.2)" : "#FFF1F2",
        fillBottom: isDark ? "rgba(159, 18, 57, 0.2)" : "#FFE4E6",
        shadowColor: "rgba(225, 29, 72, 0.15)",
        shadowBlur: 12,
        shadowOffsetY: 4,
        borderLight: "rgba(255, 255, 255, 0.8)",
      });

      ctx.fillStyle = "#E11D48";
      ctx.font = "900 13.5px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("📅 PEMBERITAHUAN DOKTER CUTI / TIDAK PRAKTEK HARI INI :", pad + 20, currY + 28);

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

          ctx.textAlign = "left";
          ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
          ctx.font = "800 13px sans-serif";
          ctx.fillText(d.doctorName.slice(0, 28), startX + 16, rowY);

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

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 14px sans-serif";
    ctx.fillText("📱 PENDAFTARAN VIA WHATSAPP : 0823-2344-6076", pad + 24, footerY + 32);

    ctx.fillStyle = "#A7F3D0";
    ctx.font = "800 12px sans-serif";
    ctx.fillText("🌐 Cek Live Jadwal & Antrean Dokter: simed.fallonava.my.id/jadwal", pad + 24, footerY + 56);

    const igdBadgeX = pad + 560;
    const igdBadgeY = footerY + 20;
    drawClayTile(ctx, igdBadgeX, igdBadgeY, 210, 40, 14, {
      fillTop: "rgba(225, 29, 72, 0.25)",
      fillBottom: "rgba(159, 18, 57, 0.35)",
      shadowColor: "rgba(0,0,0,0.15)",
      shadowBlur: 6,
      shadowOffsetY: 2,
    });

    ctx.fillStyle = "#FFE4E6";
    ctx.font = "900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🚨 IGD & AMBULANS 24 JAM", igdBadgeX + 105, igdBadgeY + 24);

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
    if (isOpen) {
      setTimeout(() => renderToCanvas(), 50);
    }
  }, [isOpen, renderToCanvas]);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="clay-surface rounded-[32px] p-5 sm:p-6 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200/50 dark:border-white/5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/50 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] clay-icon-emerald flex items-center justify-center text-white shrink-0 shadow-sm">
              <Camera size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Export Poster Jadwal Lengkap
              </h3>
              <p className="text-[10.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">
                Desain Bento Apple Claymorphic 2-Kolom Penuh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/schedules/studio"
              className="px-3 py-1.5 rounded-[12px] clay-button text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              <span>Layar Penuh</span>
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </Link>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full clay-button text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-90"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Options Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          {/* Aspect Ratio */}
          <div className="flex items-center gap-1 clay-inset p-1 rounded-[16px]">
            <button
              onClick={() => setAspectRatio("poster")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                aspectRatio === "poster" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-500"
              )}
            >
              Poster 4:5
            </button>
            <button
              onClick={() => setAspectRatio("story")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                aspectRatio === "story" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-500"
              )}
            >
              Story 9:16
            </button>
            <button
              onClick={() => setAspectRatio("feed")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                aspectRatio === "feed" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-500"
              )}
            >
              Feed 1:1
            </button>
          </div>

          {/* Poli Filter */}
          <div className="flex items-center gap-1 clay-inset p-1 rounded-[16px]">
            <button
              onClick={() => setPoliFilter("all")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                poliFilter === "all" ? "clay-button text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
              )}
            >
              Semua Poli
            </button>
            <button
              onClick={() => setPoliFilter("Bedah")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                poliFilter === "Bedah" ? "clay-button text-blue-600 dark:text-blue-400" : "text-zinc-400"
              )}
            >
              Bedah
            </button>
            <button
              onClick={() => setPoliFilter("NonBedah")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                poliFilter === "NonBedah" ? "clay-button text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
              )}
            >
              Non-Bedah
            </button>
          </div>

          {/* Theme Mode */}
          <div className="flex items-center gap-1 clay-inset p-1 rounded-[16px]">
            <button
              onClick={() => setThemeMode("sage")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                themeMode === "sage" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-400"
              )}
            >
              🌊 Sage Clay
            </button>
            <button
              onClick={() => setThemeMode("white")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                themeMode === "white" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-400"
              )}
            >
              ☀️ Apple Light
            </button>
            <button
              onClick={() => setThemeMode("dark")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                themeMode === "dark" ? "clay-pill-blue text-white shadow-xs" : "text-zinc-400"
              )}
            >
              🌙 Dark Glass
            </button>
          </div>
        </div>

        {/* Live Canvas Preview */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-3 rounded-[24px] clay-inset bg-black/20 min-h-[340px]">
          <canvas
            ref={canvasRef}
            className="rounded-[20px] shadow-2xl max-w-full max-h-[480px] object-contain border border-zinc-700/30"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 mt-3 pt-2 border-t border-zinc-200/50 dark:border-white/5">
          <button
            onClick={handleCopy}
            className="flex-1 h-11 rounded-[18px] clay-button text-zinc-700 dark:text-zinc-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
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
            className="flex-1 h-11 rounded-[18px] clay-pill-emerald text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <Download size={16} strokeWidth={2.5} />
            <span>Download Poster Ultra HD</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
