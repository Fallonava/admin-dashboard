"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Sparkles,
  Camera,
  Download,
  Copy,
  Check,
  Upload,
  Calendar as CalendarIcon,
  RefreshCw,
  Wand2,
  ChevronLeft,
  Sliders,
  Palette,
  Image as ImageIcon,
  UserX,
  Layers,
  ArrowUpRight
} from "lucide-react";
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

export default function PosterStudioPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [themeMode, setThemeMode] = useState<"sage" | "white" | "dark">("sage");
  const [showLeaveCard, setShowLeaveCard] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  const [currentTopic, setCurrentTopic] = useState<HealthEducationTopic>(() => {
    const day = new Date().getDay();
    return DEFAULT_TOPICS[day] || DEFAULT_TOPICS[1];
  });

  const { data: rawShifts } = useSWR<Shift[]>("/api/shifts");
  const { data: rawDoctors } = useSWR<Doctor[]>("/api/doctors");
  const { data: rawLeaves } = useSWR<LeaveRequest[]>("/api/leaves");

  const shifts = Array.isArray(rawShifts) ? rawShifts : [];
  const doctors = Array.isArray(rawDoctors) ? rawDoctors : [];
  const leaves = Array.isArray(rawLeaves) ? rawLeaves : [];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrImageRef = useRef<HTMLImageElement | null>(null);
  const customImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preload QR Code
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://simed.fallonava.my.id/jadwal";
    img.onload = () => { qrImageRef.current = img; };
  }, []);

  // Handle uploaded image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImageSrc(result);
      const img = new Image();
      img.src = result;
      img.onload = () => {
        customImgRef.current = img;
      };
    };
    reader.readAsDataURL(file);
  };

  // Group doctor schedule data for selected date
  const scheduleData = useCallback(() => {
    const dayIdx = (selectedDate.getDay() + 6) % 7; // 0 = Senin, 6 = Minggu
    const dateStr = selectedDate.toISOString().slice(0, 10);
    const holiday = getIndonesianHoliday(selectedDate);

    const activeShifts = shifts.filter((s) => s.dayIdx === dayIdx);
    const specMap: Record<string, Array<{ doctorName: string; time: string; status: string; replacement?: string | null }>> = {};
    const leaveDoctors: Array<{ doctorName: string; specialty: string; replacement?: string | null }> = [];

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
        replacement: matchingLeave ? (matchingLeave.replacementDoctor || null) : null,
      });
    });

    return { specMap, leaveDoctors, holiday };
  }, [selectedDate, doctors, shifts, leaves]);

  // Helper text wrapper
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
      shadowBlur = 16,
      shadowOffsetY = 6,
      borderLight = "rgba(255, 255, 255, 0.9)",
      borderDark = "rgba(0, 0, 0, 0.06)",
    } = options;

    ctx.save();
    // 1. Soft Ambient Drop Shadow
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = shadowOffsetY;

    // 2. 3D Clay Body Fill
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, fillBottom);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.restore();

    // 3. Crisp Top-Left Inset Highlight Bevel
    ctx.save();
    ctx.strokeStyle = borderLight;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.stroke();

    // 4. Subtle Bottom Inset Shadow Edge
    ctx.strokeStyle = borderDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  };

  // Canvas Drawing Engine (Ultra Apple Claymorphic 3D Bento Grid)
  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = 1440;
    canvas.width = width;
    canvas.height = height;

    const { specMap, leaveDoctors, holiday } = scheduleData();
    const isDark = themeMode === "dark";

    // ── 1. BACKGROUND CANVAS GRADIENTS ──
    if (themeMode === "sage") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#D2E5EC");
      bgGrad.addColorStop(0.5, "#BFDAE4");
      bgGrad.addColorStop(1, "#ADCED9");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Clay Glowing Orbs
      const lightGlow1 = ctx.createRadialGradient(280, 240, 20, 280, 240, 520);
      lightGlow1.addColorStop(0, "rgba(255, 255, 255, 0.65)");
      lightGlow1.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = lightGlow1;
      ctx.fillRect(0, 0, width, height);

      const lightGlow2 = ctx.createRadialGradient(880, 1100, 20, 880, 1100, 500);
      lightGlow2.addColorStop(0, "rgba(75, 139, 155, 0.25)");
      lightGlow2.addColorStop(1, "rgba(75, 139, 155, 0)");
      ctx.fillStyle = lightGlow2;
      ctx.fillRect(0, 0, width, height);
    } else if (themeMode === "white") {
      // Apple Pristine Ceramic White
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#FFFFFF");
      bgGrad.addColorStop(0.4, "#F8FAFC");
      bgGrad.addColorStop(1, "#EEF4F8");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const lightGlow = ctx.createRadialGradient(200, 150, 10, 200, 150, 480);
      lightGlow.addColorStop(0, "rgba(16, 185, 129, 0.14)");
      lightGlow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = lightGlow;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Apple Midnight Dark Glass
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080D1A");
      bgGrad.addColorStop(0.5, "#0F172A");
      bgGrad.addColorStop(1, "#0A101D");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glowGrad = ctx.createRadialGradient(260, 200, 10, 260, 200, 520);
      glowGrad.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      glowGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);
    }

    const pad = 34;
    const colGap = 22;
    const leftColW = 468;
    const rightColX = pad + leftColW + colGap;
    const rightColW = width - rightColX - pad;

    // ═══════════════════════════════════════════════════════════════════
    // ── LEFT COLUMN BENTO TILES (HERO, TITLE, DATE & HEALTH EDU) ──
    // ═══════════════════════════════════════════════════════════════════
    let leftY = pad + 4;

    // ── BENTO TILE 1: HOSPITAL BRAND & KARS ACCREDITATION ──
    const headerBoxW = leftColW;
    const headerBoxH = 72;

    drawClayTile(ctx, pad, leftY, headerBoxW, headerBoxH, 22, {
      fillTop: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
      fillBottom: isDark ? "rgba(15, 23, 42, 0.95)" : "#EDF4F7",
      shadowColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(15, 76, 92, 0.12)",
      shadowBlur: 14,
      shadowOffsetY: 5,
      borderLight: isDark ? "rgba(255, 255, 255, 0.15)" : "#FFFFFF",
      borderDark: isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.05)",
    });

    // 3D Emerald Apple Health Cross Emblem (+)
    const emblemX = pad + 14;
    const emblemY = leftY + 13;
    const emblemSize = 46;

    const emblemGrad = ctx.createLinearGradient(emblemX, emblemY, emblemX + emblemSize, emblemY + emblemSize);
    emblemGrad.addColorStop(0, "#10B981");
    emblemGrad.addColorStop(1, "#047857");
    ctx.fillStyle = emblemGrad;
    ctx.beginPath();
    ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 14);
    ctx.fill();

    // Emblem Bevel Stroke
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", emblemX + emblemSize / 2, emblemY + emblemSize / 2);

    // Hospital Name & Subtitle
    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#34D399" : "#0F766E";
    ctx.font = "900 14px sans-serif";
    ctx.fillText("RSU SIAGA MEDIKA", pad + 72, leftY + 28);
    ctx.fillStyle = isDark ? "#94A3B8" : "#64748B";
    ctx.font = "800 10.5px sans-serif";
    ctx.fillText("PURBALINGGA", pad + 72, leftY + 47);

    // Vertical Bevel Divider
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.1)" : "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad + 208, leftY + 16);
    ctx.lineTo(pad + 208, leftY + headerBoxH - 16);
    ctx.stroke();

    // KARS Accreditation Gold Clay Pill
    ctx.fillStyle = "#D97706";
    ctx.font = "900 11px sans-serif";
    ctx.fillText("TERAKREDITASI", pad + 224, leftY + 28);
    ctx.fillStyle = isDark ? "#F8FAFC" : "#1E293B";
    ctx.font = "900 12.5px sans-serif";
    ctx.fillText("PARIPURNA KARS ⭐", pad + 224, leftY + 47);

    leftY += headerBoxH + 20;

    // ── BENTO TILE 2: ELEGANT HEADLINE BANNER ──
    ctx.textAlign = "center";
    ctx.fillStyle = isDark ? "#F8FAFC" : "#164E63";
    ctx.font = "900 32px serif";
    ctx.fillText("JADWAL", pad + leftColW / 2, leftY + 8);
    leftY += 36;

    ctx.font = "900 36px serif";
    ctx.fillText("POLIKLINIK", pad + leftColW / 2, leftY + 8);
    leftY += 32;

    ctx.strokeStyle = isDark ? "#38BDF8" : "#164E63";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad + 60, leftY + 4);
    ctx.lineTo(pad + 180, leftY + 4);
    ctx.moveTo(pad + leftColW - 180, leftY + 4);
    ctx.lineTo(pad + leftColW - 60, leftY + 4);
    ctx.stroke();

    ctx.font = "italic 900 24px serif";
    ctx.fillText("&", pad + leftColW / 2, leftY + 10);
    leftY += 32;

    ctx.font = "900 30px serif";
    ctx.fillText("DOKTER SPESIALIS", pad + leftColW / 2, leftY + 10);
    leftY += 36;

    // ── BENTO TILE 3: CERAMIC DATE BANNER + 3D CALENDAR PIN ──
    const dateFormatted = selectedDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).toUpperCase();

    const dateBoxH = 52;
    drawClayTile(ctx, pad, leftY, headerBoxW, dateBoxH, 18, {
      fillTop: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
      fillBottom: isDark ? "rgba(15, 23, 42, 0.95)" : "#EDF4F7",
      shadowColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(15, 76, 92, 0.09)",
      shadowBlur: 10,
      shadowOffsetY: 4,
    });

    ctx.textAlign = "left";
    ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
    ctx.font = "900 15px sans-serif";
    ctx.fillText(dateFormatted, pad + 18, leftY + 32);

    // 3D Calendar Pin on Right Edge
    const dayShort = selectedDate.toLocaleDateString("id-ID", { weekday: "short" }).toUpperCase();
    const dateNum = selectedDate.getDate();
    const calPinX = pad + headerBoxW - 66;
    const calPinY = leftY - 8;
    const calPinW = 56;
    const calPinH = 60;

    drawClayTile(ctx, calPinX, calPinY, calPinW, calPinH, 14, {
      fillTop: "#FFFFFF",
      fillBottom: "#F1F5F9",
      shadowColor: "rgba(0,0,0,0.15)",
      shadowBlur: 8,
      shadowOffsetY: 3,
    });

    // Calendar Red Header
    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.roundRect(calPinX, calPinY, calPinW, 22, [14, 14, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dayShort, calPinX + calPinW / 2, calPinY + 15);

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 21px sans-serif";
    ctx.fillText(String(dateNum), calPinX + calPinW / 2, calPinY + 46);

    leftY += dateBoxH + 20;

    // ── BENTO TILE 4: LARGE HERO HEALTH EDUCATION CARD ──
    const eduBoxH = height - leftY - pad - 8;

    drawClayTile(ctx, pad, leftY, headerBoxW, eduBoxH, 26, {
      fillTop: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
      fillBottom: isDark ? "rgba(15, 23, 42, 0.95)" : "#F0F6F9",
      shadowColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(15, 76, 92, 0.12)",
      shadowBlur: 18,
      shadowOffsetY: 8,
      borderLight: isDark ? "rgba(255, 255, 255, 0.16)" : "#FFFFFF",
    });

    let eduY = leftY + 24;

    // Custom Uploaded Image in Rounded Squircle Frame
    if (customImgRef.current && customImgRef.current.complete) {
      try {
        const imgH = 125;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(pad + 18, eduY, headerBoxW - 36, imgH, 18);
        ctx.clip();
        ctx.drawImage(customImgRef.current, pad + 18, eduY, headerBoxW - 36, imgH);
        ctx.restore();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(pad + 18, eduY, headerBoxW - 36, imgH, 18);
        ctx.stroke();

        eduY += imgH + 16;
      } catch (e) {}
    }

    // 3D Clay Tag Pill (e.g. "LAYANAN UNGGULAN")
    const tagText = currentTopic.tag || "EDUKASI KESEHATAN";
    ctx.fillStyle = "rgba(249, 115, 22, 0.15)";
    ctx.beginPath();
    ctx.roundRect(pad + 22, eduY - 2, 200, 26, 10);
    ctx.fill();

    ctx.fillStyle = "#EA580C";
    ctx.font = "900 12.5px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`✨ ${tagText}`, pad + 32, eduY + 15);
    eduY += 36;

    // Main Topic Headline
    ctx.fillStyle = "#E11D48";
    ctx.font = "900 26px sans-serif";
    eduY = wrapText(ctx, currentTopic.title, pad + 22, eduY, headerBoxW - 44, 32);
    eduY += 8;

    // Medical Summary
    ctx.fillStyle = isDark ? "#CBD5E1" : "#334155";
    ctx.font = "600 13px sans-serif";
    eduY = wrapText(ctx, currentTopic.summary, pad + 22, eduY, headerBoxW - 44, 20);
    eduY += 12;

    // Subtitle Capsule: "Pemeriksaan untuk Apa Saja :"
    const subTitleW = 250;
    const subTitleH = 26;
    drawClayTile(ctx, pad + 22, eduY - 2, subTitleW, subTitleH, 10, {
      fillTop: "#EA580C",
      fillBottom: "#C2410C",
      shadowColor: "rgba(234, 88, 12, 0.35)",
      shadowBlur: 8,
      shadowOffsetY: 2,
      borderLight: "rgba(255, 255, 255, 0.4)",
    });

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 12px sans-serif";
    ctx.fillText("Pemeriksaan untuk Apa Saja :", pad + 34, eduY + 15);
    eduY += 38;

    // 3D Spherical Checkmark Bullets
    currentTopic.bullets.slice(0, 5).forEach((b) => {
      // 3D Coral Sphere
      const sphereX = pad + 32;
      const sphereY = eduY - 4;
      const sphereR = 8.5;

      const sphereGrad = ctx.createRadialGradient(sphereX - 2, sphereY - 2, 1, sphereX, sphereY, sphereR);
      sphereGrad.addColorStop(0, "#FB923C");
      sphereGrad.addColorStop(0.7, "#EA580C");
      sphereGrad.addColorStop(1, "#9A3412");
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓", sphereX, sphereY + 3.5);

      ctx.textAlign = "left";
      ctx.fillStyle = isDark ? "#F8FAFC" : "#0F172A";
      ctx.font = "800 12.5px sans-serif";
      ctx.fillText(b, pad + 48, eduY);

      eduY += 24;
    });

    eduY += 6;

    // Closing CTA
    ctx.fillStyle = isDark ? "#94A3B8" : "#475569";
    ctx.font = "italic 600 11.5px sans-serif";
    wrapText(ctx, currentTopic.note, pad + 22, eduY, headerBoxW - 44, 16);

    // ── BENTO TILE 5: ULTRA APPLE iOS FOOTER HOTLINE & QR HUB ──
    const qrBoxY = leftY + eduBoxH - 88;
    const qrBoxW = headerBoxW - 28;
    const qrBoxH = 72;

    drawClayTile(ctx, pad + 14, qrBoxY, qrBoxW, qrBoxH, 20, {
      fillTop: isDark ? "#065F46" : "#0F766E",
      fillBottom: isDark ? "#022C22" : "#044E48",
      shadowColor: "rgba(4, 78, 72, 0.3)",
      shadowBlur: 10,
      shadowOffsetY: 4,
      borderLight: "rgba(255, 255, 255, 0.3)",
    });

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 12px sans-serif";
    ctx.fillText("📱 WA PENDAFTARAN: 0823-2344-6076", pad + 28, qrBoxY + 28);
    ctx.font = "800 11px sans-serif";
    ctx.fillStyle = "#A7F3D0";
    ctx.fillText("🌐 Cek Live: simed.fallonava.my.id/jadwal", pad + 28, qrBoxY + 50);

    // Right QR Code Tile
    if (qrImageRef.current && qrImageRef.current.complete) {
      try {
        const qrTileW = 56;
        const qrTileH = 56;
        const qrTileX = pad + qrBoxW - qrTileW - 4;
        const qrTileY = qrBoxY + 8;

        drawClayTile(ctx, qrTileX, qrTileY, qrTileW, qrTileH, 14, {
          fillTop: "#FFFFFF",
          fillBottom: "#F8FAFC",
          shadowColor: "rgba(0,0,0,0.2)",
          shadowBlur: 6,
          shadowOffsetY: 2,
        });

        ctx.drawImage(qrImageRef.current, qrTileX + 3, qrTileY + 3, qrTileW - 6, qrTileH - 6);
      } catch (e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── RIGHT COLUMN: DEDICATED LEAVE BENTO + SCHEDULE CLAY TILES ──
    // ═══════════════════════════════════════════════════════════════════
    let rightY = pad + 4;

    // ── BENTO TILE 6: DEDICATED "DOKTER CUTI HARI INI" ──
    if (showLeaveCard && leaveDoctors.length > 0) {
      const leaveCardH = 36 + leaveDoctors.length * 28 + 6;

      drawClayTile(ctx, rightColX, rightY, rightColW, leaveCardH, 18, {
        fillTop: isDark ? "rgba(225, 29, 72, 0.2)" : "#FFF1F2",
        fillBottom: isDark ? "rgba(159, 18, 57, 0.2)" : "#FFE4E6",
        shadowColor: "rgba(225, 29, 72, 0.15)",
        shadowBlur: 10,
        shadowOffsetY: 3,
        borderLight: "rgba(255, 255, 255, 0.6)",
        borderDark: "rgba(225, 29, 72, 0.25)",
      });

      // Header
      ctx.fillStyle = "#E11D48";
      ctx.font = "900 12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("📅 DOKTER CUTI / TIDAK PRAKTEK HARI INI", rightColX + 16, rightY + 23);

      let leaveY = rightY + 48;
      leaveDoctors.forEach((ld) => {
        ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
        ctx.font = "800 12px sans-serif";
        ctx.fillText(ld.doctorName.slice(0, 26), rightColX + 16, leaveY);

        if (ld.replacement) {
          ctx.fillStyle = "#059669";
          ctx.font = "900 11px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`🔄 Digantikan: ${ld.replacement.slice(0, 20)}`, rightColX + rightColW - 14, leaveY);
          ctx.textAlign = "left";
        } else {
          ctx.fillStyle = "#E11D48";
          ctx.font = "900 11.5px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("Libur", rightColX + rightColW - 14, leaveY);
          ctx.textAlign = "left";
        }
        leaveY += 26;
      });

      rightY += leaveCardH + 12;
    }

    // ── BENTO TILE 7: POLI HEADERS & DOCTOR SCHEDULES ──
    const specEntries = Object.entries(specMap);
    const maxSpecs = showLeaveCard && leaveDoctors.length > 0 ? 12 : 14;
    const displaySpecs = specEntries.slice(0, maxSpecs);

    displaySpecs.forEach(([specName, docList]) => {
      const headerH = 28;
      const rowH = 24;
      const totalDocRows = docList.length;
      const totalSectionH = headerH + totalDocRows * rowH + 6;

      // Marine Cyan/Teal 3D Clay Capsule Header
      drawClayTile(ctx, rightColX, rightY, rightColW, headerH, 14, {
        fillTop: "#569DAA",
        fillBottom: "#3F7C8B",
        shadowColor: "rgba(63, 124, 139, 0.25)",
        shadowBlur: 6,
        shadowOffsetY: 2,
        borderLight: "rgba(255, 255, 255, 0.5)",
      });

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 12.5px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(specName, rightColX + rightColW / 2, rightY + 18);

      // Doctor Card Container (3D White Clay)
      const docCardY = rightY + headerH - 1;
      const docCardH = totalDocRows * rowH + 6;

      drawClayTile(ctx, rightColX, docCardY, rightColW, docCardH, 14, {
        fillTop: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
        fillBottom: isDark ? "rgba(15, 23, 42, 0.95)" : "#F6FAFC",
        shadowColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(15, 76, 92, 0.08)",
        shadowBlur: 8,
        shadowOffsetY: 3,
      });

      let rowY = docCardY + 19;
      docList.forEach((d) => {
        const isCuti = d.status === "CUTI";

        ctx.textAlign = "left";
        ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
        ctx.font = "800 12px sans-serif";
        ctx.fillText(d.doctorName.slice(0, 32), rightColX + 14, rowY);

        ctx.textAlign = "right";
        if (isCuti) {
          ctx.fillStyle = "#E11D48";
          ctx.font = "900 12px sans-serif";
          ctx.fillText("Libur 📅", rightColX + rightColW - 14, rowY);
        } else {
          ctx.fillStyle = isDark ? "#38BDF8" : "#334155";
          ctx.font = "700 11.5px monospace";
          ctx.fillText(d.time, rightColX + rightColW - 14, rowY);
        }

        rowY += rowH;
      });

      rightY += totalSectionH + 8;
    });

  }, [scheduleData, currentTopic, selectedDate, themeMode, showLeaveCard]);

  useEffect(() => {
    renderToCanvas();
  }, [renderToCanvas]);

  // AI Topic Generator
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
                Apple Claymorphic 3D Studio
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
              Studio Poster Selebaran Jadwal RS
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Bento Claymorphic Grid + Integrasi AI Edukasi Medis & Upload Gambar
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
        {/* ── LEFT CONTROL PANEL (5 Cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Card 1: Tanggal & Tema */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-5 flex flex-col gap-4 border border-zinc-200/50 dark:border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Sliders size={14} />
                <span>Pengaturan Poster & Tema</span>
              </h3>
            </div>

            {/* Day Selector Bar */}
            <div>
              <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 mb-1.5 block">
                Pilih Tanggal Jadwal:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate.toISOString().slice(0, 10)}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(new Date(e.target.value));
                  }}
                  className="clay-inset px-3 py-2 rounded-[14px] text-xs font-black text-zinc-900 dark:text-zinc-100 outline-none w-full"
                />
              </div>
            </div>

            {/* Theme Mode Switch */}
            <div>
              <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 mb-1.5 block">
                Tema Gaya Visual:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setThemeMode("sage")}
                  className={cn(
                    "py-2 px-2.5 rounded-[14px] text-xs font-black transition-all flex flex-col items-center gap-1",
                    themeMode === "sage"
                      ? "clay-pill-blue text-white shadow-xs"
                      : "clay-button text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  <span>🌊 Sage Bento</span>
                  <span className="text-[9.5px] opacity-75 font-normal">Sesuai Referensi</span>
                </button>
                <button
                  onClick={() => setThemeMode("white")}
                  className={cn(
                    "py-2 px-2.5 rounded-[14px] text-xs font-black transition-all flex flex-col items-center gap-1",
                    themeMode === "white"
                      ? "clay-pill-blue text-white shadow-xs"
                      : "clay-button text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  <span>☀️ Apple Light</span>
                  <span className="text-[9.5px] opacity-75 font-normal">Pristine White</span>
                </button>
                <button
                  onClick={() => setThemeMode("dark")}
                  className={cn(
                    "py-2 px-2.5 rounded-[14px] text-xs font-black transition-all flex flex-col items-center gap-1",
                    themeMode === "dark"
                      ? "clay-pill-blue text-white shadow-xs"
                      : "clay-button text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  <span>🌙 Dark Glass</span>
                  <span className="text-[9.5px] opacity-75 font-normal">Midnight Blue</span>
                </button>
              </div>
            </div>

            {/* Toggle Dokter Cuti Card */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-white/5">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <UserX size={14} className="text-rose-500" />
                <span>Kartu Khusus Dokter Cuti</span>
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

          {/* Card 2: Upload Gambar Medis Kustom */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-5 flex flex-col gap-3.5 border border-zinc-200/50 dark:border-white/5">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <ImageIcon size={14} />
              <span>Gambar Infografis Kustom</span>
            </h3>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-[14px] clay-button text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2 active:scale-95 transition-all shadow-xs"
              >
                <Upload size={14} />
                <span>{uploadedImageSrc ? "Ganti Gambar" : "Upload Gambar Baru"}</span>
              </button>

              {uploadedImageSrc && (
                <button
                  onClick={() => {
                    setUploadedImageSrc(null);
                    customImgRef.current = null;
                  }}
                  className="px-3 py-2 rounded-[14px] clay-button text-[11px] font-bold text-rose-500 active:scale-95 transition-all"
                >
                  Hapus
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Format JPG / PNG / WebP. Otomatis disesuaikan ke dalam kartu infografis sebelah kiri poster.
            </p>
          </div>

          {/* Card 3: Konten Edukasi Medis & AI Generator */}
          <div className="clay-surface rounded-[24px] p-4 sm:p-5 flex flex-col gap-4 border border-zinc-200/50 dark:border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-500" />
                <span>AI Edukasi Kesehatan</span>
              </h3>
              <button
                onClick={() => {
                  const day = selectedDate.getDay();
                  setCurrentTopic(DEFAULT_TOPICS[day] || DEFAULT_TOPICS[1]);
                }}
                className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Reset Hari Ini
              </button>
            </div>

            {/* AI Generator Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ketik topik medis (misal: Skrining Ginjal, Katarak)..."
                value={aiCustomPrompt}
                onChange={(e) => setAiCustomPrompt(e.target.value)}
                className="clay-inset px-3 py-2 rounded-[14px] text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none w-full"
              />
              <button
                onClick={() => handleGenerateAiTopic(aiCustomPrompt)}
                disabled={isAiLoading}
                className="px-3 py-2 rounded-[14px] clay-pill-emerald text-white text-xs font-black flex items-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                {isAiLoading ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
                <span>{isAiLoading ? "..." : "AI Generate"}</span>
              </button>
            </div>

            {/* Topic Live Editor */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-200/50 dark:border-white/5">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase">Judul Topik:</label>
                <input
                  type="text"
                  value={currentTopic.title}
                  onChange={(e) => setCurrentTopic({ ...currentTopic, title: e.target.value })}
                  className="clay-inset px-2.5 py-1.5 rounded-[10px] text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none w-full mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase">Ringkasan Medis:</label>
                <textarea
                  rows={2}
                  value={currentTopic.summary}
                  onChange={(e) => setCurrentTopic({ ...currentTopic, summary: e.target.value })}
                  className="clay-inset px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none w-full mt-1 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT LIVE CANVAS PREVIEW (7 Cols) ── */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-6 rounded-[32px] clay-inset bg-black/20 relative min-h-[600px]">
          <canvas
            ref={canvasRef}
            className="rounded-[24px] shadow-2xl max-w-full max-h-[740px] object-contain border border-zinc-700/30"
          />
        </div>
      </div>
    </div>
  );
}
