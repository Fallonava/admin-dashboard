import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, withMutationRateLimit } from "@/lib/api-utils";
import { createOllama } from "ollama-ai-provider-v2";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

export const dynamic = "force-dynamic";

export interface HealthEducationTopic {
  tag: string;
  title: string;
  subtitle?: string;
  summary: string;
  bullets: string[];
  note: string;
  symptoms?: string[];
  causes?: string;
  prevention?: string[];
  whenToDoctor?: string;
  sourceUrl?: string;
  imageUrl?: string;
}

// Preset foto medis resolusi tinggi berlisensi bebas (Unsplash Health & Medical)
const MEDICAL_IMAGES: Record<string, string> = {
  heart: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80",
  ultrasound: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
  brain: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80",
  stomach: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80",
  child: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80",
  mcu: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80",
  bone: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80",
  eye: "https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&auto=format&fit=crop&q=80",
  dental: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80",
  general: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80",
};

// Preset harian resmi SIMED (Senin - Minggu)
export const DAILY_TOPIC_PRESETS: Record<number, HealthEducationTopic> = {
  1: { // Senin
    tag: "LAYANAN UNGGULAN",
    title: "Apa itu USG Abdomen?",
    subtitle: "Pemeriksaan Organ Dalam Tanpa Radiasi",
    summary: "USG abdomen adalah metode diagnostik non-invasif yang memanfaatkan gelombang ultrasonik untuk melihat kondisi organ internal perut secara akurat dan aman tanpa paparan radiasi.",
    bullets: [
      "Mendeteksi Masalah Organ Hati & Empedu",
      "Mencari Penyebab Nyeri Perut Akut",
      "Evaluasi Ginjal dan Saluran Kemih",
      "Diagnosis Dini Kista atau Tumor"
    ],
    symptoms: [
      "Nyeri perut berulang atau begah berkepanjangan",
      "Perubahan warna urin atau feses mencurigakan",
      "Mual muntah disertai demam tanpa sebab jelas"
    ],
    causes: "Gangguan fungsi pada hati, batu empedu, infeksi ginjal, atau peradangan organ saluran cerna.",
    prevention: [
      "Perbanyak minum air putih minimal 2 liter sehari",
      "Batasi makanan berlemak jenuh & tinggi kolesterol",
      "Lakukan USG berkala bagi yang berisiko"
    ],
    whenToDoctor: "Segera periksakan jika nyeri perut hebat tiba-tiba atau ada benjolan di area perut.",
    note: "Poli Spesialis Penyakit Dalam & Radiologi RSU Siaga Medika siap melayani pemeriksaan USG Abdomen komprehensif.",
    sourceUrl: "Sumber: Kemenkes RI & Alodokter",
    imageUrl: MEDICAL_IMAGES.ultrasound,
  },
  2: { // Selasa
    tag: "KESEHATAN JANTUNG",
    title: "Waspada Angin Duduk & EKG",
    subtitle: "Nyeri Dada Menjalar, Jangan Disepelekan!",
    summary: "Angin duduk (angina pectoris) adalah nyeri dada akibat berkurangnya pasokan oksigen ke otot jantung. Sering disalahartikan sebagai masuk angin biasa padahal berisiko fatal.",
    bullets: [
      "Nyeri dada seperti tertindih beban berat",
      "Rasa sakit menjalar ke bahu, leher, & rahang",
      "Disertai sesak napas dan keringat dingin"
    ],
    symptoms: [
      "Nyeri dada terasa diremas atau ditekan kuat",
      "Sesak napas saat beraktivitas ringan",
      "Pusing mendadak dan keluar keringat dingin"
    ],
    causes: "Penyempitan pembuluh darah koroner akibat penumpukan plak kolesterol (aterosklerosis).",
    prevention: [
      "Kontrol tekanan darah dan kolesterol rutin",
      "Hindari merokok dan batasi konsumsi garam",
      "Olahraga kardio aerobik 30 menit sehari"
    ],
    whenToDoctor: "Segera ke IGD 24 Jam jika nyeri dada berlangsung lebih dari 15 menit.",
    note: "IGD RSU Siaga Medika siaga 24 jam dengan tim dokter spesialis jantung dan fasilitas EKG terpadu.",
    sourceUrl: "Sumber: PERKI & Kemenkes RI",
    imageUrl: MEDICAL_IMAGES.heart,
  },
  3: { // Rabu
    tag: "TUMBUH KEMBANG ANAK",
    title: "Pantau Periode Emas Anak (1000 HPK)",
    subtitle: "Cegah Stunting & Optimalkan Potensi Otak",
    summary: "1000 Hari Pertama Kehidupan adalah periode emas pembentukan kecerdasan otak dan daya tahan tubuh si kecil. Pemantauan nutrisi dan imunisasi sangat menentukan masa depan anak.",
    bullets: [
      "Skrining Perkembangan Motorik & Bicara",
      "Kelengkapan Vaksinasi & Imunisasi Wajib",
      "Konsultasi Nutrisi & Gizi Seimbang",
      "Pencegahan Dini Gangguan Tumbuh Kembang"
    ],
    symptoms: [
      "Pertumbuhan tinggi badan di bawah kurva standar",
      "Keterlambatan bicara atau kontak mata kurang",
      "Anak sering sakit atau nafsu makan sangat rendah"
    ],
    causes: "Kurangnya asupan zat gizi mikro/makro kronis dan infeksi berulang pada balita.",
    prevention: [
      "Berikan ASI eksklusif 6 bulan dilanjutkan MPASI bergizi",
      "Penuhi jadwal imunisasi dasar lengkap",
      "Timbang berat badan balita rutin setiap bulan"
    ],
    whenToDoctor: "Bawa si kecil ke dokter spesialis anak jika berat badan tidak naik selama 2 bulan berturut-turut.",
    note: "Konsultasikan tumbuh kembang anak Anda ke Poli Spesialis Anak RSU Siaga Medika.",
    sourceUrl: "Sumber: IDAI & Kemenkes RI",
    imageUrl: MEDICAL_IMAGES.child,
  },
  4: { // Kamis
    tag: "KESEHATAN LAMBUNG",
    title: "Waspada GERD & Asam Lambung",
    subtitle: "Dada Terbakar & Sensasi Mengganjal di Tenggorokan",
    summary: "GERD terjadi ketika asam lambung naik kembali ke kerongkongan, menyebabkan iritasi kronis dan rasa terbakar di area ulu hati hingga dada.",
    bullets: [
      "Sensasi panas terbakar di dada (Heartburn)",
      "Mulut terasa asam atau pahit",
      "Tenggorokan mengganjal & batuk kering malam hari"
    ],
    symptoms: [
      "Nyeri ulu hati setelah makan berlebih",
      "Rasa asam naik ke kerongkongan",
      "Sulit menelan atau sering bersendawa"
    ],
    causes: "Kelemahan katup sfingter esofagus bawah dipicu stres, makanan pedas/berlemak, dan telat makan.",
    prevention: [
      "Makan dengan porsi kecil tapi sering (small frequent)",
      "Hindari tidur langsung setelah makan (tunggu 2-3 jam)",
      "Kurangi kopi, cokelat, dan makanan pedas berminyak"
    ],
    whenToDoctor: "Konsultasikan ke dokter spesialis jika gejala muncul lebih dari 2 kali seminggu.",
    note: "Poli Spesialis Penyakit Dalam RSU Siaga Medika siap melayani penanganan tuntas gangguan lambung.",
    sourceUrl: "Sumber: PGI & Kemenkes RI",
    imageUrl: MEDICAL_IMAGES.stomach,
  },
  5: { // Jumat
    tag: "SARAF & OTAK",
    title: "Kenali Gejala Stroke (Metode FAST)",
    subtitle: "Deteksi Dini Selamatkan Nyawa & Cegah Kelumpuhan",
    summary: "Stroke adalah kondisi darurat medis. Penanganan dalam periode emas (Golden Period < 4,5 jam) sangat menentukan pemulihan fungsi motorik dan meminimalkan kecacatan.",
    bullets: [
      "F - Face Drooping (Wajah Mencong/Asimetris)",
      "A - Arm Weakness (Lengan/Kaki Lemah Tiba-tiba)",
      "S - Speech Difficulty (Bicara Pelo / Tidak Jelas)",
      "T - Time to Call (Segera ke IGD RS Terdekat)"
    ],
    symptoms: [
      "Sudut bibir turun saat tersenyum",
      "Satu sisi lengan atau kaki tidak bisa diangkat",
      "Bicara tidak jelas atau tidak mengerti perkataan orang"
    ],
    causes: "Penyumbatan pembuluh darah otak (stroke iskemik) atau pecahnya pembuluh darah otak (stroke hemoragik).",
    prevention: [
      "Kontrol tekanan darah dan gula darah secara teratur",
      "Hindari konsumsi alkohol dan rokok",
      "Kelola stres dan jaga berat badan ideal"
    ],
    whenToDoctor: "Segera bawa ke IGD 24 Jam RS jika mendapati salah satu gejala FAST di atas.",
    note: "IGD RSU Siaga Medika siaga 24 jam dengan tim dokter spesialis saraf & sarana diagnostik terpadu.",
    sourceUrl: "Sumber: PERDOSSI & Kemenkes RI",
    imageUrl: MEDICAL_IMAGES.brain,
  },
  6: { // Sabtu
    tag: "IBU & KANDUNGAN",
    title: "Manfaat Pemeriksaan USG 4D",
    subtitle: "Melihat Ekspresi Wajah & Deteksi Dini Janin",
    summary: "USG 4 Dimensi menampilkan pergerakan janin secara visual real-time dan mendeteksi potensi kelainan anatomis bayi dalam kandungan secara lebih detail dan mendalam.",
    bullets: [
      "Melihat Wajah & Gerakan Janin Real-Time",
      "Evaluasi Anatomi Organ Vital Bayi",
      "Pemantauan Posisi & Aliran Darah Plasenta",
      "Perencanaan Persalinan Nyaman & Aman"
    ],
    symptoms: [
      "Ibu hamil memasuki trimester 2 atau 3",
      "Pergerakan janin dirasa berkurang",
      "Riwayat komplikasi pada kehamilan sebelumnya"
    ],
    causes: "Kebutuhan pemantauan tumbuh kembang janin dan deteksi dini kelainan kongenital.",
    prevention: [
      "Konsumsi asam folat dan zat besi sesuai anjuran dokter",
      "Hindari paparan asap rokok dan radiasi berbahaya",
      "Lakukan pemeriksaan kehamilan minimal 6 kali selama masa hamil"
    ],
    whenToDoctor: "Jadwalkan USG 4D di usia kehamilan 24-28 minggu untuk hasil visual optimal.",
    note: "Poli Spesialis Kebidanan & Kandungan (Sp.OG) RSU Siaga Medika menyediakan layanan USG 4D canggih.",
    sourceUrl: "Sumber: POGI & Kemenkes RI",
    imageUrl: MEDICAL_IMAGES.ultrasound,
  },
  0: { // Minggu
    tag: "PREVENTIF & MCU",
    title: "Pentingnya Medical Check Up Rutin",
    subtitle: "Deteksi Dini Silent Killer Sebelum Muncul Gejala",
    summary: "Pemeriksaan kesehatan berkala dapat mendeteksi berbagai penyakit kronis seperti diabetes, hipertensi, dan kelainan organ dalam sedini mungkin saat masih mudah diobati.",
    bullets: [
      "Evaluasi Kadar Gula, Kolesterol, & Asam Urat",
      "Pemeriksaan Fungsi Ginjal & Fungsi Hati",
      "Rontgen Dada & Skrining Paru",
      "Pemeriksaan Rekam Jantung EKG"
    ],
    symptoms: [
      "Mudah lelah tanpa aktivitas berat",
      "Sering haus, sering buang air kecil di malam hari",
      "Pusing atau tengkuk terasa berat di pagi hari"
    ],
    causes: "Gaya hidup sedentari, pola makan tinggi gula & garam, serta faktor genetik keturunan.",
    prevention: [
      "Lakukan MCU komprehensif minimal 1 tahun sekali",
      "Istirahat cukup 7-8 jam per malam",
      "Jaga pola makan seimbang kaya serat dan antioksidan"
    ],
    whenToDoctor: "Segera lakukan pemeriksaan MCU lengkap untuk mengetahui profil kesehatan menyeluruh Anda.",
    note: "Paket Medical Check Up lengkap tersedia di RSU Siaga Medika Purbalingga.",
    sourceUrl: "Sumber: Kemenkes RI & WHO",
    imageUrl: MEDICAL_IMAGES.mcu,
  }
};

function pickMedicalImage(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("jantung") || p.includes("cardio") || p.includes("ekg") || p.includes("tensi") || p.includes("hipertensi") || p.includes("angin duduk")) {
    return MEDICAL_IMAGES.heart;
  }
  if (p.includes("usg") || p.includes("hamil") || p.includes("kandungan") || p.includes("janin") || p.includes("rahim") || p.includes("perut")) {
    return MEDICAL_IMAGES.ultrasound;
  }
  if (p.includes("saraf") || p.includes("otak") || p.includes("stroke") || p.includes("kepala") || p.includes("fast")) {
    return MEDICAL_IMAGES.brain;
  }
  if (p.includes("lambung") || p.includes("gerd") || p.includes("maag") || p.includes("cerna") || p.includes("usus")) {
    return MEDICAL_IMAGES.stomach;
  }
  if (p.includes("anak") || p.includes("bayi") || p.includes("stunting") || p.includes("imunisasi") || p.includes("vaksin")) {
    return MEDICAL_IMAGES.child;
  }
  if (p.includes("tulang") || p.includes("sendi") || p.includes("ortopedi") || p.includes("reumatik") || p.includes("fraktur")) {
    return MEDICAL_IMAGES.bone;
  }
  if (p.includes("mata") || p.includes("katarak") || p.includes("glaukoma") || p.includes("rabun")) {
    return MEDICAL_IMAGES.eye;
  }
  if (p.includes("gigi") || p.includes("dental") || p.includes("gusi") || p.includes("behel")) {
    return MEDICAL_IMAGES.dental;
  }
  if (p.includes("mcu") || p.includes("check up") || p.includes("laboratorium") || p.includes("darah") || p.includes("kolesterol")) {
    return MEDICAL_IMAGES.mcu;
  }
  return MEDICAL_IMAGES.general;
}

export async function POST(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, "schedules");
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, "schedules", "read");
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const customPrompt = body.prompt;
    const dayOfWeek = body.dayIdx !== undefined ? Number(body.dayIdx) : new Date().getDay();

    const defaultTopic = DAILY_TOPIC_PRESETS[dayOfWeek] || DAILY_TOPIC_PRESETS[1];

    if (!customPrompt) {
      return NextResponse.json({ success: true, topic: defaultTopic });
    }

    const aiConfig = await prisma.aiSettings.findUnique({ where: { id: "singleton" } });
    if (!aiConfig || !aiConfig.aiEnabled) {
      const selectedImg = pickMedicalImage(customPrompt);
      return NextResponse.json({
        success: true,
        topic: { ...defaultTopic, imageUrl: selectedImg },
        note: "AI disabled, returning daily preset with matched image"
      });
    }

    let modelInstance: any = null;
    const provider = aiConfig.provider;
    const key = (aiConfig.geminiKey || aiConfig.groqKey || aiConfig.apiKey) || undefined;

    if (provider === "gemini" && key) {
      const google = createGoogleGenerativeAI({ apiKey: key });
      modelInstance = google(aiConfig.aiModel || "gemini-1.5-flash");
    } else if (provider === "groq" && key) {
      const groq = createGroq({ apiKey: key });
      modelInstance = groq(aiConfig.aiModel || "llama-3.3-70b-versatile");
    } else if (provider === "ollama") {
      const ollama = createOllama({ baseURL: aiConfig.ollamaUrl || "http://localhost:11434/api" });
      modelInstance = ollama(aiConfig.aiModel || "qwen2.5:1.5b");
    }

    if (!modelInstance) {
      return NextResponse.json({ success: true, topic: { ...defaultTopic, imageUrl: pickMedicalImage(customPrompt) } });
    }

    const systemPrompt = `Anda adalah Dokter Spesialis & Konsultan Edukasi Medis Resmi RSU Siaga Medika Purbalingga.
Buatlah infografis edukasi kesehatan komprehensif, menarik, berbasis bukti medis, dan terstruktur dalam format JSON murni.
JSON HARUS memiliki struktur berikut:
{
  "tag": "KATEGORI SINGKAT (2-3 kata huruf kapital)",
  "title": "Judul Edukasi Menarik & Tegas (contoh: Apa itu USG Abdomen? / Waspada Serangan Jantung)",
  "subtitle": "Subjudul Ringkas Menjelaskan Topik (3-6 kata)",
  "summary": "Penjelasan singkat padat 1-2 kalimat (maks 35 kata)",
  "bullets": [
    "Poin manfaat/gejala utama 1 (5-8 kata)",
    "Poin manfaat/gejala utama 2",
    "Poin manfaat/gejala utama 3",
    "Poin manfaat/gejala utama 4"
  ],
  "symptoms": [
    "Gejala klinis spesifik 1",
    "Gejala klinis spesifik 2",
    "Gejala klinis spesifik 3"
  ],
  "causes": "Penjelasan penyebab medis dalam 1-2 kalimat ringkas.",
  "prevention": [
    "Langkah pencegahan/solusi 1",
    "Langkah pencegahan/solusi 2",
    "Langkah pencegahan/solusi 3"
  ],
  "whenToDoctor": "Panduan kapan harus segera ke IGD atau poliklinik spesialis.",
  "note": "Pesan ajakan singkat konsultasi ke dokter RSU Siaga Medika.",
  "sourceUrl": "Sumber: Kemenkes RI / WHO / IDAI / PERKI"
}
HANYA kembalikan JSON valid tanpa markdown atau teks pengantar.`;

    const { text } = await generateText({
      model: modelInstance,
      system: systemPrompt,
      prompt: `Buat materi infografis edukasi kesehatan poster dokter bertema: "${customPrompt}".`,
      temperature: 0.3,
    });

    const cleanJsonStr = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJsonStr);

    const chosenImage = pickMedicalImage(customPrompt + " " + (parsed.title || ""));

    return NextResponse.json({
      success: true,
      topic: {
        tag: parsed.tag || defaultTopic.tag,
        title: parsed.title || defaultTopic.title,
        subtitle: parsed.subtitle || defaultTopic.subtitle,
        summary: parsed.summary || defaultTopic.summary,
        bullets: Array.isArray(parsed.bullets) && parsed.bullets.length > 0 ? parsed.bullets.slice(0, 5) : defaultTopic.bullets,
        symptoms: Array.isArray(parsed.symptoms) && parsed.symptoms.length > 0 ? parsed.symptoms.slice(0, 4) : defaultTopic.symptoms,
        causes: parsed.causes || defaultTopic.causes,
        prevention: Array.isArray(parsed.prevention) && parsed.prevention.length > 0 ? parsed.prevention.slice(0, 3) : defaultTopic.prevention,
        whenToDoctor: parsed.whenToDoctor || defaultTopic.whenToDoctor,
        note: parsed.note || defaultTopic.note,
        sourceUrl: parsed.sourceUrl || defaultTopic.sourceUrl || "Sumber: RSU Siaga Medika Purbalingga",
        imageUrl: chosenImage,
      }
    });

  } catch (err: any) {
    console.error("AI Poster Tip Error:", err);
    const dayOfWeek = new Date().getDay();
    const fallbackTopic = DAILY_TOPIC_PRESETS[dayOfWeek] || DAILY_TOPIC_PRESETS[1];
    return NextResponse.json({
      success: true,
      topic: fallbackTopic,
      fallback: true
    });
  }
}
