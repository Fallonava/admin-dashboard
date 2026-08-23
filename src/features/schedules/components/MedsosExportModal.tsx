"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Download, Copy, Check, Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doctor, Shift, LeaveRequest } from "@/lib/data-service";
import { getIndonesianHoliday } from "@/lib/holidays";

interface HealthEducationTopic {
  tag: string;
  title: string;
  summary: string;
  bullets: string[];
  note: string;
}

const DEFAULT_TOPICS: Record<number, HealthEducationTopic> = {
  1: {
    tag: "LAYANAN UNGGULAN",
    title: "Apa itu USG Abdomen?",
    summary: "USG abdomen (USG perut) adalah metode diagnostik non-invasif gelombang ultrasonik untuk memeriksa organ internal perut secara akurat tanpa radiasi.",
    bullets: [
      "Mendeteksi Masalah Organ Hati & Empedu",
      "Mencari Penyebab Nyeri Perut Akut",
      "Evaluasi Ginjal dan Saluran Kemih",
      "Pemeriksaan Limpa dan Pankreas",
      "Diagnosis Awal Kista atau Tumor"
    ],
    note: "Jika Anda memiliki keluhan perut berulang, USG Abdomen menjadi langkah awal tepat untuk tahu penyebabnya!"
  },
  2: {
    tag: "KESEHATAN JANTUNG",
    title: "Pentingnya Skrining Jantung & EKG",
    summary: "Pemeriksaan EKG dan Treadmill Test merekam aktivitas listrik jantung untuk mendeteksi gangguan irama dan penyumbatan pembuluh darah sedini mungkin.",
    bullets: [
      "Mendeteksi Risiko Jantung Koroner",
      "Evaluasi Gangguan Irama Jantung (Aritmia)",
      "Pemeriksaan Pasien Nyeri Dada & Sesak",
      "Pemantauan Rutin Pasien Hipertensi",
      "Pencegahan Komplikasi Jantung Berat"
    ],
    note: "Jangan sepelekan nyeri dada menjalar. Segera jadwalkan pemeriksaan bersama dokter spesialis jantung kami."
  },
  3: {
    tag: "TUMBUH KEMBANG ANAK",
    title: "Pantau Tumbuh Kembang & Imunisasi",
    summary: "1000 Hari Pertama Kehidupan (HPK) adalah periode emas anak. Pastikan berat badan, tinggi badan, dan jadwal imunisasi terpantau teratur.",
    bullets: [
      "Pencegahan Dini Masalah Stunting",
      "Skrining Perkembangan Motorik & Bicara",
      "Kelengkapan Vaksinasi & Imunisasi",
      "Konsultasi Nutrisi & Gizi Seimbang",
      "Penanganan Alergi & Infeksi Anak"
    ],
    note: "Bawa buah hati Anda berkonsultasi secara berkala ke Poli Spesialis Anak RSU Siaga Medika."
  },
  4: {
    tag: "KESEHATAN LAMBUNG",
    title: "Waspada Gejala GERD & Dispepsia",
    summary: "Asam lambung naik kronis membutuhkan penanganan terpadu dokter spesialis agar tidak memicu luka kerongkongan dan iritasi lambung berat.",
    bullets: [
      "Meredakan Dada Terbakar (Heartburn)",
      "Penanganan Mual, Kembung, & Begah",
      "Pemeriksaan Endoskopi Saluran Cerna",
      "Pencegahan Tukak Lambung Akut",
      "Panduan Pola Makan Lambung Sehat"
    ],
    note: "Konsultasikan keluhan pencernaan Anda ke dokter spesialis penyakit dalam kami."
  },
  5: {
    tag: "SARAF & OTAK",
    title: "Kenali Gejala Stroke Sejak Dini (FAST)",
    summary: "Stroke adalah kondisi darurat medis. Penanganan dalam periode emas (< 4,5 jam) sangat krusial untuk mencegah kecacatan permanen.",
    bullets: [
      "Face Drooping (Wajah Mencong/Asimetris)",
      "Arm Weakness (Lengan/Kaki Lemah Separo)",
      "Speech Difficulty (Bicara Pelo/Tidak Jelas)",
      "Time to Call (Segera ke IGD 24 Jam)",
      "Rehabilitasi Medik Pasca Stroke"
    ],
    note: "IGD RSU Siaga Medika siaga 24 jam dengan tim dokter spesialis saraf & sarana medis terpadu."
  },
  6: {
    tag: "IBU & KANDUNGAN",
    title: "Pemeriksaan Kehamilan & USG 4D",
    summary: "USG 4 Dimensi menampilkan pergerakan janin secara real-time dan mendeteksi potensi kelainan anatomis bayi dalam kandungan secara lebih detail.",
    bullets: [
      "Melihat Wajah & Gerakan Janin Real-Time",
      "Evaluasi Anatomi Organ Vital Bayi",
      "Pemantauan Posisi & Aliran Plasenta",
      "Pemeriksaan Cairan Ketuban & Tali Pusat",
      "Perencanaan Persalinan Nyaman & Aman"
    ],
    note: "Jadwalkan USG 4D Anda bersama dokter spesialis kandungan & kebidanan (Sp.OG) kami."
  },
  0: {
    tag: "PREVENTIF & MCU",
    title: "Manfaat Medical Check Up Rutin",
    summary: "Pemeriksaan kesehatan menyeluruh mendeteksi silent killer seperti diabetes, kolesterol, dan kelainan organ sebelum timbul gejala klinis berat.",
    bullets: [
      "Evaluasi Gula Darah, Kolesterol & Asam Urat",
      "Pemeriksaan Fungsi Ginjal & Hati",
      "Rontgen Thorax & Skrining Paru",
      "Pemeriksaan Tekanan Darah & Jantung",
      "Paket MCU Lengkap Sesuai Kebutuhan"
    ],
    note: "Mencegah lebih baik daripada mengobati. Lakukan Medical Check Up rutin bersama keluarga."
  }
};

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
  const [copied, setCopied] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [currentTopic, setCurrentTopic] = useState<HealthEducationTopic>(() => {
    const day = selectedDate.getDay();
    return DEFAULT_TOPICS[day] || DEFAULT_TOPICS[1];
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Preload QR Code Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://simed.fallonava.my.id/jadwal";
    img.onload = () => { qrImageRef.current = img; };
  }, []);

  // Update default topic when date changes
  useEffect(() => {
    const day = selectedDate.getDay();
    setCurrentTopic(DEFAULT_TOPICS[day] || DEFAULT_TOPICS[1]);
  }, [selectedDate]);

  // Compute active doctor schedules grouped by Specialty
  const groupedScheduleData = useCallback(() => {
    const dayIdx = (selectedDate.getDay() + 6) % 7; // 0 = Senin, 6 = Minggu
    const dateStr = selectedDate.toISOString().slice(0, 10);
    const holiday = getIndonesianHoliday(selectedDate);

    const activeShifts = shifts.filter((s) => s.dayIdx === dayIdx);
    const specMap: Record<string, Array<{ doctorName: string; time: string; status: string; replacement?: string | null }>> = {};

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

      const specName = (doc.specialty || "Umum").replace(/Spesialis\s*/i, "").replace(/Poli\s*/i, "").trim().toUpperCase();

      if (!specMap[specName]) specMap[specName] = [];
      specMap[specName].push({
        doctorName: doc.name,
        time: s.formattedTime || s.title || "Jam 08.00 sd Selesai",
        status: status.toUpperCase(),
        replacement: matchingLeave ? (matchingLeave.replacementDoctor || null) : null,
      });
    });

    return { specMap, holiday };
  }, [selectedDate, doctors, shifts, leaves]);

  // Helper text wrapper for Canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number => {
    const words = text.split(" ");
    let line = "";
    let currY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currY);
        line = words[n] + " ";
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currY);
    return currY + lineHeight;
  };

  // Canvas Drawing Engine (Exact 2-Column Split matching reference_poster.png)
  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-Resolution 1080 x 1400 Poster (Instagram Portrait 4:5 / Poster HD)
    const width = 1080;
    const height = 1380;
    canvas.width = width;
    canvas.height = height;

    const { specMap, holiday } = groupedScheduleData();

    // ── 1. BACKGROUND GRADIENT (Soft Sage/Powder Blue-Green Clay) ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#C7DDE3");
    bgGrad.addColorStop(0.5, "#B8D4DC");
    bgGrad.addColorStop(1, "#A8C7D0");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient soft lighting
    const lightGlow = ctx.createRadialGradient(260, 200, 10, 260, 200, 450);
    lightGlow.addColorStop(0, "rgba(255, 255, 255, 0.45)");
    lightGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, width, height);

    // ── 2. TWO-COLUMN GEOMETRY ──
    const pad = 36;
    const colGap = 24;
    const leftColW = 460;
    const rightColX = pad + leftColW + colGap;
    const rightColW = width - rightColX - pad;

    // ═══════════════════════════════════════════════════════════════════
    // ── LEFT COLUMN: HERO, TITLE, DATE & HEALTH EDUCATION ──
    // ═══════════════════════════════════════════════════════════════════
    let leftY = pad + 10;

    // 2.1 Hospital Brand & Accreditation Header Box (3D Clay White Capsule)
    const headerBoxW = leftColW;
    const headerBoxH = 68;
    ctx.fillStyle = "#EAF2F5";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pad, leftY, headerBoxW, headerBoxH, 18);
    ctx.fill();
    ctx.stroke();

    // Hospital Logo Emblem
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.roundRect(pad + 12, leftY + 12, 44, 44, 12);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", pad + 34, leftY + 34);

    // Hospital Text
    ctx.textAlign = "left";
    ctx.fillStyle = "#0F766E";
    ctx.font = "900 13px sans-serif";
    ctx.fillText("RSU SIAGA MEDIKA", pad + 66, leftY + 26);
    ctx.fillStyle = "#64748B";
    ctx.font = "800 10.5px sans-serif";
    ctx.fillText("PURBALINGGA", pad + 66, leftY + 44);

    // Divider Line in Header
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad + 200, leftY + 14);
    ctx.lineTo(pad + 200, leftY + headerBoxH - 14);
    ctx.stroke();

    // KARS Accreditation Badge
    ctx.fillStyle = "#D97706";
    ctx.font = "900 11px sans-serif";
    ctx.fillText("TERAKREDITASI", pad + 214, leftY + 26);
    ctx.fillStyle = "#1E293B";
    ctx.font = "900 12px sans-serif";
    ctx.fillText("PARIPURNA KARS ⭐", pad + 214, leftY + 44);

    leftY += headerBoxH + 24;

    // 2.2 Elegant Headline: "JADWAL POLIKLINIK & DOKTER SPESIALIS"
    ctx.textAlign = "center";
    ctx.fillStyle = "#164E63";
    ctx.font = "900 32px serif";
    ctx.fillText("JADWAL", pad + leftColW / 2, leftY + 10);
    leftY += 38;

    ctx.font = "900 36px serif";
    ctx.fillText("POLIKLINIK", pad + leftColW / 2, leftY + 10);
    leftY += 34;

    // Decorative separator: — & —
    ctx.strokeStyle = "#164E63";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad + 60, leftY + 4);
    ctx.lineTo(pad + 175, leftY + 4);
    ctx.moveTo(pad + leftColW - 175, leftY + 4);
    ctx.lineTo(pad + leftColW - 60, leftY + 4);
    ctx.stroke();

    ctx.font = "italic 900 24px serif";
    ctx.fillText("&", pad + leftColW / 2, leftY + 10);
    leftY += 34;

    ctx.font = "900 30px serif";
    ctx.fillText("DOKTER SPESIALIS", pad + leftColW / 2, leftY + 10);
    leftY += 38;

    // 2.3 Date Banner with 3D Calendar Pin
    const dateFormatted = selectedDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).toUpperCase();

    const dateBoxH = 50;
    ctx.fillStyle = "#EAF2F5";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pad, leftY, headerBoxW, dateBoxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#0F172A";
    ctx.font = "900 15px sans-serif";
    ctx.fillText(dateFormatted, pad + 18, leftY + 31);

    // Calendar Badge on Right Edge ("SEN 24")
    const dayShort = selectedDate.toLocaleDateString("id-ID", { weekday: "short" }).toUpperCase();
    const dateNum = selectedDate.getDate();
    const calPinX = pad + headerBoxW - 64;
    const calPinY = leftY - 8;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(calPinX, calPinY, 54, 58, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.roundRect(calPinX, calPinY, 54, 20, [12, 12, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 10.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dayShort, calPinX + 27, calPinY + 14);

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 20px sans-serif";
    ctx.fillText(String(dateNum), calPinX + 27, calPinY + 44);

    leftY += dateBoxH + 24;

    // 2.4 Health Education Infographic Card (AI Rotating Topic)
    const eduBoxH = height - leftY - pad - 12;
    ctx.fillStyle = "rgba(241, 248, 250, 0.92)";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(pad, leftY, headerBoxW, eduBoxH, 24);
    ctx.fill();
    ctx.stroke();

    let eduY = leftY + 28;

    // Tag / Category Pill
    ctx.fillStyle = "#F97316";
    ctx.font = "italic 900 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(currentTopic.tag || "EDUKASI KESEHATAN", pad + 24, eduY);
    eduY += 34;

    // Title (e.g. "Apa itu USG Abdomen?")
    ctx.fillStyle = "#E11D48";
    ctx.font = "900 28px sans-serif";
    eduY = wrapText(ctx, currentTopic.title, pad + 24, eduY, headerBoxW - 48, 34);
    eduY += 10;

    // Summary Paragraph
    ctx.fillStyle = "#334155";
    ctx.font = "600 13.5px sans-serif";
    eduY = wrapText(ctx, currentTopic.summary, pad + 24, eduY, headerBoxW - 48, 21);
    eduY += 14;

    // Subtitle: "Manfaat & Pemeriksaan:"
    const subTitleW = 260;
    ctx.fillStyle = "#EA580C";
    ctx.beginPath();
    ctx.roundRect(pad + 24, eduY - 4, subTitleW, 28, 8);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 12.5px sans-serif";
    ctx.fillText("Pemeriksaan untuk Apa Saja :", pad + 34, eduY + 15);
    eduY += 40;

    // Bullet points with checkmark icons
    currentTopic.bullets.slice(0, 5).forEach((b) => {
      // Circle checkmark badge
      ctx.fillStyle = "#EA580C";
      ctx.beginPath();
      ctx.arc(pad + 34, eduY - 4, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓", pad + 34, eduY);

      ctx.textAlign = "left";
      ctx.fillStyle = "#0F172A";
      ctx.font = "800 13px sans-serif";
      ctx.fillText(b, pad + 50, eduY);

      eduY += 26;
    });

    eduY += 10;

    // Closing CTA note
    ctx.fillStyle = "#475569";
    ctx.font = "italic 600 12px sans-serif";
    wrapText(ctx, currentTopic.note, pad + 24, eduY, headerBoxW - 48, 18);

    // Bottom Hotline & QR Container
    const qrBoxY = leftY + eduBoxH - 84;
    ctx.fillStyle = "#0F766E";
    ctx.beginPath();
    ctx.roundRect(pad + 16, qrBoxY, headerBoxW - 32, 68, 16);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 12px sans-serif";
    ctx.fillText("📱 WA PENDAFTARAN: 0823-2344-6076", pad + 30, qrBoxY + 26);
    ctx.font = "800 10.5px sans-serif";
    ctx.fillStyle = "#A7F3D0";
    ctx.fillText("🌐 Cek Live: simed.fallonava.my.id/jadwal", pad + 30, qrBoxY + 46);

    // QR Image on right of hotline
    if (qrImageRef.current && qrImageRef.current.complete) {
      try {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(pad + headerBoxW - 74, qrBoxY + 8, 52, 52, 10);
        ctx.fill();
        ctx.drawImage(qrImageRef.current, pad + headerBoxW - 71, qrBoxY + 11, 46, 46);
      } catch (e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── RIGHT COLUMN: SPECIALTY HEADERS & DOCTOR SCHEDULES ──
    // ═══════════════════════════════════════════════════════════════════
    let rightY = pad + 10;
    const specEntries = Object.entries(specMap);

    // Limit display to fit canvas cleanly
    const maxSpecs = 14;
    const displaySpecs = specEntries.slice(0, maxSpecs);

    displaySpecs.forEach(([specName, docList]) => {
      const headerH = 26;
      const rowH = 24;
      const totalDocRows = docList.length;
      const totalSectionH = headerH + totalDocRows * rowH + 6;

      // Specialty Teal Clay Capsule Header
      ctx.fillStyle = "#4B8B9B";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rightColX, rightY, rightColW, headerH, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(specName, rightColX + rightColW / 2, rightY + 17);

      // Doctor Container Card (White/Porcelain Clay)
      const docCardY = rightY + headerH - 1;
      const docCardH = totalDocRows * rowH + 6;

      ctx.fillStyle = "#F8FAFC";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(rightColX, docCardY, rightColW, docCardH, [0, 0, 14, 14]);
      ctx.fill();
      ctx.stroke();

      let rowY = docCardY + 18;
      docList.forEach((d) => {
        const isCuti = d.status === "CUTI";

        // Doctor Name on Left
        ctx.textAlign = "left";
        ctx.fillStyle = "#0F172A";
        ctx.font = "800 12px sans-serif";
        ctx.fillText(d.doctorName.slice(0, 32), rightColX + 14, rowY);

        // Time or Libur on Right
        ctx.textAlign = "right";
        if (isCuti) {
          ctx.fillStyle = "#E11D48";
          ctx.font = "900 12px sans-serif";
          ctx.fillText("Libur 📅", rightColX + rightColW - 14, rowY);
        } else {
          ctx.fillStyle = "#334155";
          ctx.font = "700 11.5px monospace";
          ctx.fillText(d.time, rightColX + rightColW - 14, rowY);
        }

        rowY += rowH;
      });

      rightY += totalSectionH + 8;
    });

  }, [groupedScheduleData, currentTopic, selectedDate]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => renderToCanvas(), 50);
    }
  }, [isOpen, renderToCanvas]);

  // AI Generator Function
  const handleGenerateAiTopic = async (customPromptText?: string) => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/schedules/ai-poster-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: customPromptText || aiCustomPrompt || undefined,
          dayIdx: selectedDate.getDay()
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.topic) {
          setCurrentTopic(data.topic);
        }
      }
    } catch (e) {
      console.error("AI Generate Error:", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dateKey = selectedDate.toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.download = `poster-jadwal-siagamedika-${dateKey}.png`;
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
        className="clay-surface rounded-[32px] p-5 sm:p-6 w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200/50 dark:border-white/5 relative overflow-hidden"
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
                Studio Poster Jadwal & Infografis RS
              </h3>
              <p className="text-[10.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">
                Desain Resmi 2-Kolom + Integrasi AI Edukasi Kesehatan
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

        {/* AI & Topic Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 p-2.5 rounded-[20px] clay-inset bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Sparkles size={16} className="text-emerald-500 shrink-0" />
            <input
              type="text"
              placeholder="Ketik topik edukasi khusus (mis: Tips Jantung / USG 4D)..."
              value={aiCustomPrompt}
              onChange={(e) => setAiCustomPrompt(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleGenerateAiTopic(aiCustomPrompt)}
              disabled={isAiLoading}
              className="px-3 py-1.5 rounded-[12px] clay-pill-emerald text-white text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {isAiLoading ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
              <span>{isAiLoading ? "Menulis..." : "Generate AI"}</span>
            </button>
            <button
              onClick={() => {
                const day = selectedDate.getDay();
                setCurrentTopic(DEFAULT_TOPICS[day] || DEFAULT_TOPICS[1]);
              }}
              className="px-2.5 py-1.5 rounded-[12px] clay-button text-zinc-600 dark:text-zinc-300 text-xs font-bold active:scale-95 transition-all"
              title="Reset ke Topik Harian"
            >
              Reset Hari
            </button>
          </div>
        </div>

        {/* Live Canvas Preview Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-3 rounded-[24px] clay-inset bg-black/20 min-h-[320px]">
          <canvas
            ref={canvasRef}
            className="rounded-[16px] shadow-2xl max-w-full max-h-[460px] object-contain border border-zinc-700/30 aspect-[4/5]"
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
            <span>Download Poster HD (.PNG)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
