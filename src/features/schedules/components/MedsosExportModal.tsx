"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Download, Copy, Check, Image as ImageIcon, Filter } from "lucide-react";
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
  const [aspectRatio, setAspectRatio] = useState<"story" | "feed">("story");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [poliFilter, setPoliFilter] = useState<"all" | "Bedah" | "NonBedah">("all");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Preload QR Code
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://simed.fallonava.my.id/jadwal";
    img.onload = () => {
      qrImageRef.current = img;
    };
  }, []);

  // Compute active doctor schedules for the selected date
  const scheduleData = useCallback(() => {
    const dayIdx = (selectedDate.getDay() + 6) % 7; // 0 = Senin, 6 = Minggu
    const dateStr = selectedDate.toISOString().slice(0, 10);
    const holiday = getIndonesianHoliday(selectedDate);

    // Active shifts
    const activeShifts = shifts.filter((s) => s.dayIdx === dayIdx);

    let items: Array<{
      doctorName: string;
      specialty: string;
      category: string;
      time: string;
      status: string;
      replacement?: string | null;
    }> = [];

    activeShifts.forEach((s) => {
      const doc = doctors.find((d) => d.id === s.doctorId);
      if (!doc) return;

      const matchingLeave = leaves.find(
        (l) =>
          (l.doctorId === doc.id || (l.doctor && l.doctor === doc.name)) &&
          new Date(l.startDate) <= selectedDate &&
          new Date(l.endDate || l.startDate) >= selectedDate
      );

      const isCuti = (s.disabledDates || []).includes(dateStr) || Boolean(matchingLeave);
      let status = isCuti ? "CUTI" : (doc.status || "PRAKTEK");

      items.push({
        doctorName: doc.name,
        specialty: doc.specialty,
        category: doc.category || "NonBedah",
        time: s.formattedTime || s.title || "Sesuai Perjanjian",
        status: status.toUpperCase(),
        replacement: matchingLeave ? (matchingLeave.replacementDoctor || null) : null,
      });
    });

    // Apply Poli Filter
    if (poliFilter !== "all") {
      items = items.filter((d) => d.category === poliFilter);
    }

    // Sort: Bedah first, then NonBedah, active first, then cuti
    items.sort((a, b) => {
      if (a.status === "CUTI" && b.status !== "CUTI") return 1;
      if (a.status !== "CUTI" && b.status === "CUTI") return -1;
      if (a.category === "Bedah" && b.category !== "Bedah") return -1;
      if (a.category !== "Bedah" && b.category === "Bedah") return 1;
      return a.specialty.localeCompare(b.specialty);
    });

    return { items, holiday };
  }, [selectedDate, doctors, shifts, leaves, poliFilter]);

  // Canvas drawing engine (Clean Apple Health + Dual-Column Bento Density)
  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = aspectRatio === "story" ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;

    const { items, holiday } = scheduleData();
    const isDark = themeMode === "dark";

    // ── 1. BACKGROUND CANVAS ──
    if (isDark) {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080D1A");
      bgGrad.addColorStop(0.45, "#0F172A");
      bgGrad.addColorStop(1, "#0A101D");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient glowing orbs
      const glowGrad1 = ctx.createRadialGradient(220, 160, 20, 220, 160, 500);
      glowGrad1.addColorStop(0, "rgba(16, 185, 129, 0.18)");
      glowGrad1.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glowGrad1;
      ctx.fillRect(0, 0, width, height);

      const glowGrad2 = ctx.createRadialGradient(880, 1100, 20, 880, 1100, 600);
      glowGrad2.addColorStop(0, "rgba(59, 130, 246, 0.15)");
      glowGrad2.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = glowGrad2;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Pristine Clean Apple Health Minimalist
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#FFFFFF");
      bgGrad.addColorStop(0.4, "#F8FAFC");
      bgGrad.addColorStop(1, "#F1F5F9");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft emerald & sky blue ambient tint
      const glowGrad1 = ctx.createRadialGradient(180, 140, 20, 180, 140, 480);
      glowGrad1.addColorStop(0, "rgba(16, 185, 129, 0.08)");
      glowGrad1.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glowGrad1;
      ctx.fillRect(0, 0, width, height);

      const glowGrad2 = ctx.createRadialGradient(900, 1300, 20, 900, 1300, 550);
      glowGrad2.addColorStop(0, "rgba(14, 165, 233, 0.07)");
      glowGrad2.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.fillStyle = glowGrad2;
      ctx.fillRect(0, 0, width, height);
    }

    const padX = 56;
    let currY = 60;

    // ── 2. HEADER BRANDING (Modern Hospital Bar) ──
    // Hospital Logo Badge
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.roundRect(padX, currY, 60, 60, 18);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", padX + 30, currY + 30);

    // Hospital Name & City
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
    ctx.font = "900 30px sans-serif";
    ctx.fillText("RSU SIAGA MEDIKA", padX + 78, currY + 22);

    ctx.fillStyle = isDark ? "#34D399" : "#059669";
    ctx.font = "900 15px sans-serif";
    ctx.fillText("PURBALINGGA • MELAYANI DENGAN SEPENUH HATI", padX + 78, currY + 48);

    // KARS Accreditation Badge on Top Right
    const badgeW = 230;
    const badgeH = 46;
    const badgeX = width - padX - badgeW;
    ctx.fillStyle = isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB";
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, currY + 7, badgeW, badgeH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#D97706";
    ctx.font = "900 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⭐ AKREDITASI PARIPURNA", badgeX + badgeW / 2, currY + 30);
    ctx.textAlign = "left";

    currY += 92;

    // ── 3. DATE BANNER CONTAINER ──
    const dateFormatted = selectedDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).toUpperCase();

    ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.9)" : "#FFFFFF";
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, currY, width - padX * 2, 88, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? "#34D399" : "#059669";
    ctx.font = "900 13.5px sans-serif";
    ctx.fillText("JADWAL PRAKTEK DOKTER SPESIALIS", padX + 24, currY + 32);

    ctx.fillStyle = isDark ? "#F8FAFC" : "#0F172A";
    ctx.font = "900 24px sans-serif";
    ctx.fillText(dateFormatted, padX + 24, currY + 64);

    // Holiday Tag (SKB 3 Menteri)
    if (holiday.isTanggalMerah) {
      const tagText = holiday.name || (holiday.isSunday ? "HARI MINGGU" : "TANGGAL MERAH");
      const tagW = 240;
      ctx.fillStyle = "rgba(225, 29, 72, 0.12)";
      ctx.strokeStyle = "rgba(225, 29, 72, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(width - padX - tagW - 20, currY + 20, tagW, 48, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#E11D48";
      ctx.font = "900 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(tagText.slice(0, 24), width - padX - tagW / 2 - 20, currY + 45);
      ctx.textAlign = "left";
    }

    currY += 114;

    // ── 4. DOCTORS SCHEDULE GRID (Dual-Column Bento Layout) ──
    const isDualCol = aspectRatio === "story" && items.length > 7;
    const maxItems = aspectRatio === "story" ? (isDualCol ? 18 : 10) : 6;
    const displayItems = items.slice(0, maxItems);

    if (isDualCol) {
      // 2 Kolom Bento Grid
      const colW = (width - padX * 2 - 18) / 2;
      const cardH = 88;
      const cardGap = 12;

      displayItems.forEach((doc, idx) => {
        const colIdx = idx % 2;
        const rowIdx = Math.floor(idx / 2);
        const cardX = padX + colIdx * (colW + 18);
        const cardY = currY + rowIdx * (cardH + cardGap);
        const isCuti = doc.status === "CUTI";

        // Card Box
        ctx.fillStyle = isDark
          ? isCuti ? "rgba(225, 29, 72, 0.08)" : "rgba(30, 41, 59, 0.75)"
          : isCuti ? "rgba(225, 29, 72, 0.04)" : "#FFFFFF";
        ctx.strokeStyle = isDark
          ? isCuti ? "rgba(225, 29, 72, 0.3)" : "rgba(255, 255, 255, 0.08)"
          : isCuti ? "rgba(225, 29, 72, 0.2)" : "rgba(0, 0, 0, 0.06)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, colW, cardH, 18);
        ctx.fill();
        ctx.stroke();

        // Left Status Strip
        ctx.fillStyle = isCuti ? "#E11D48" : (doc.category === "Bedah" ? "#3B82F6" : "#10B981");
        ctx.beginPath();
        ctx.roundRect(cardX + 5, cardY + 14, 5, cardH - 28, 3);
        ctx.fill();

        // Doc Specialty
        ctx.fillStyle = isCuti ? "#E11D48" : (doc.category === "Bedah" ? "#2563EB" : "#059669");
        ctx.font = "900 11.5px sans-serif";
        ctx.fillText(doc.specialty.toUpperCase().slice(0, 28), cardX + 18, cardY + 24);

        // Doc Name
        ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
        ctx.font = "900 16px sans-serif";
        ctx.fillText(doc.doctorName.slice(0, 24), cardX + 18, cardY + 48);

        // Jam / Status Pill
        if (isCuti) {
          ctx.fillStyle = "#E11D48";
          ctx.font = "900 12px sans-serif";
          ctx.fillText("❌ CUTI DOKTER", cardX + 18, cardY + 70);
        } else {
          ctx.fillStyle = isDark ? "#94A3B8" : "#475569";
          ctx.font = "800 12.5px monospace";
          ctx.fillText(`🕒 ${doc.time}`, cardX + 18, cardY + 70);
        }
      });

      const totalRows = Math.ceil(displayItems.length / 2);
      currY += totalRows * (cardH + cardGap);
    } else {
      // 1 Kolom Stack Layout
      const cardH = aspectRatio === "story" ? 92 : 96;
      const cardGap = 12;

      displayItems.forEach((doc) => {
        const isCuti = doc.status === "CUTI";

        ctx.fillStyle = isDark
          ? isCuti ? "rgba(225, 29, 72, 0.08)" : "rgba(30, 41, 59, 0.75)"
          : isCuti ? "rgba(225, 29, 72, 0.04)" : "#FFFFFF";
        ctx.strokeStyle = isDark
          ? isCuti ? "rgba(225, 29, 72, 0.3)" : "rgba(255, 255, 255, 0.08)"
          : isCuti ? "rgba(225, 29, 72, 0.2)" : "rgba(0, 0, 0, 0.06)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(padX, currY, width - padX * 2, cardH, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isCuti ? "#E11D48" : (doc.category === "Bedah" ? "#3B82F6" : "#10B981");
        ctx.beginPath();
        ctx.roundRect(padX + 5, currY + 16, 5, cardH - 32, 4);
        ctx.fill();

        ctx.fillStyle = isCuti ? "#E11D48" : (doc.category === "Bedah" ? "#2563EB" : "#059669");
        ctx.font = "900 13px sans-serif";
        ctx.fillText(doc.specialty.toUpperCase(), padX + 24, currY + 28);

        ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
        ctx.font = "900 20px sans-serif";
        ctx.fillText(doc.doctorName, padX + 24, currY + 54);

        if (doc.replacement) {
          ctx.fillStyle = "#059669";
          ctx.font = "900 12.5px sans-serif";
          ctx.fillText(`🔄 Digantikan: ${doc.replacement}`, padX + 24, currY + 76);
        }

        const rightX = width - padX - 24;

        if (isCuti) {
          ctx.fillStyle = "rgba(225, 29, 72, 0.15)";
          ctx.beginPath();
          ctx.roundRect(rightX - 110, currY + 24, 110, 38, 12);
          ctx.fill();
          ctx.fillStyle = "#E11D48";
          ctx.font = "900 14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("CUTI", rightX - 55, currY + 46);
          ctx.textAlign = "left";
        } else {
          ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.8)" : "#F1F5F9";
          ctx.beginPath();
          ctx.roundRect(rightX - 170, currY + 24, 170, 42, 14);
          ctx.fill();

          ctx.fillStyle = isDark ? "#38BDF8" : "#0284C7";
          ctx.font = "900 15px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`🕒 ${doc.time}`, rightX - 85, currY + 48);
          ctx.textAlign = "left";
        }

        currY += cardH + cardGap;
      });
    }

    if (items.length > maxItems) {
      ctx.fillStyle = isDark ? "#94A3B8" : "#64748B";
      ctx.font = "800 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`...dan ${items.length - maxItems} dokter lainnya (Cek selengkapnya di simed.fallonava.my.id/jadwal)`, width / 2, currY + 22);
      ctx.textAlign = "left";
    }

    // ── 5. FOOTER INFO WITH DYNAMIC QR CODE ──
    const footerY = height - 140;

    // Divider Line
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, footerY - 16);
    ctx.lineTo(width - padX, footerY - 16);
    ctx.stroke();

    // Left Footer Details
    ctx.fillStyle = isDark ? "#34D399" : "#059669";
    ctx.font = "900 14px sans-serif";
    ctx.fillText("PENDAFTARAN & INFORMASI RESMI:", padX, footerY + 14);

    ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
    ctx.font = "900 20px sans-serif";
    ctx.fillText("📱 WhatsApp: 0823-2344-6076  •  🌐 simed.fallonava.my.id/jadwal", padX, footerY + 42);

    ctx.fillStyle = isDark ? "#94A3B8" : "#64748B";
    ctx.font = "800 13px sans-serif";
    ctx.fillText("IGD 24 Jam • Pelayanan Ambulans • Laboratorium & Farmasi 24 Jam", padX, footerY + 68);

    // Right QR Code Box
    const qrBoxW = 100;
    const qrBoxH = 100;
    const qrBoxX = width - padX - qrBoxW;
    const qrBoxY = footerY;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 14);
    ctx.fill();
    ctx.stroke();

    if (qrImageRef.current && qrImageRef.current.complete) {
      try {
        ctx.drawImage(qrImageRef.current, qrBoxX + 6, qrBoxY + 6, qrBoxW - 12, qrBoxH - 12);
      } catch (e) {}
    } else {
      // Fallback vector QR frame
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(qrBoxX + 12, qrBoxY + 12, 24, 24);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrBoxX + 16, qrBoxY + 16, 16, 16);
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(qrBoxX + 20, qrBoxY + 20, 8, 8);

      ctx.fillStyle = "#059669";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SCAN ME", qrBoxX + qrBoxW / 2, qrBoxY + qrBoxH - 12);
      ctx.textAlign = "left";
    }

  }, [scheduleData, aspectRatio, themeMode]);

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
        className="clay-surface rounded-[32px] p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200/50 dark:border-white/5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-zinc-200/50 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] clay-icon-blue flex items-center justify-center text-white shrink-0 shadow-sm">
              <Camera size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Export Selebaran Jadwal Medsos
              </h3>
              <p className="text-[10.5px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5">
                Desain Clean Apple Health + Dynamic QR Scanner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full clay-button text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-90"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          {/* Aspect Ratio Switch */}
          <div className="flex items-center gap-1 clay-inset p-1 rounded-[16px]">
            <button
              onClick={() => setAspectRatio("story")}
              className={cn(
                "px-3 py-1.5 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5",
                aspectRatio === "story"
                  ? "clay-pill-blue text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <ImageIcon size={13} strokeWidth={2.5} />
              <span>Story (9:16)</span>
            </button>
            <button
              onClick={() => setAspectRatio("feed")}
              className={cn(
                "px-3 py-1.5 rounded-[12px] text-xs font-black transition-all flex items-center gap-1.5",
                aspectRatio === "feed"
                  ? "clay-pill-blue text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <ImageIcon size={13} strokeWidth={2.5} />
              <span>Feed (1:1)</span>
            </button>
          </div>

          {/* Poli Category Filter */}
          <div className="flex items-center gap-1 clay-inset p-1 rounded-[16px]">
            <button
              onClick={() => setPoliFilter("all")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-[11px] font-black transition-all",
                poliFilter === "all" ? "clay-button text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
              )}
            >
              Semua
            </button>
            <button
              onClick={() => setPoliFilter("Bedah")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-[11px] font-black transition-all",
                poliFilter === "Bedah" ? "clay-button text-blue-600 dark:text-blue-400" : "text-zinc-400"
              )}
            >
              Bedah
            </button>
            <button
              onClick={() => setPoliFilter("NonBedah")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-[11px] font-black transition-all",
                poliFilter === "NonBedah" ? "clay-button text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
              )}
            >
              Non-Bedah
            </button>
          </div>

          {/* Theme Mode Switch */}
          <div className="flex items-center gap-1 clay-inset p-1 rounded-[16px]">
            <button
              onClick={() => setThemeMode("light")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                themeMode === "light"
                  ? "clay-button text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-400"
              )}
            >
              ☀️ Clean Light
            </button>
            <button
              onClick={() => setThemeMode("dark")}
              className={cn(
                "px-2.5 py-1.5 rounded-[12px] text-xs font-black transition-all",
                themeMode === "dark"
                  ? "clay-button text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-400"
              )}
            >
              🌙 Dark Navy
            </button>
          </div>
        </div>

        {/* Live Canvas Preview Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-3 rounded-[24px] clay-inset bg-black/20 min-h-[300px]">
          <canvas
            ref={canvasRef}
            className={cn(
              "rounded-[16px] shadow-2xl max-w-full max-h-[440px] object-contain border border-zinc-700/30",
              aspectRatio === "story" ? "aspect-[9/16]" : "aspect-square"
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 mt-4 pt-2">
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
            <span>Download PNG HD</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
