import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';
import { createOllama } from 'ollama-ai-provider-v2';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const dynamic = 'force-dynamic';

export interface HealthEducationTopic {
  tag: string;
  title: string;
  summary: string;
  bullets: string[];
  note: string;
}

// Preset harian resmi SIMED (Senin - Minggu)
export const DAILY_TOPIC_PRESETS: Record<number, HealthEducationTopic> = {
  1: { // Senin
    tag: "LAYANAN UNGGULAN",
    title: "Apa itu USG Abdomen?",
    summary: "USG abdomen (USG perut) adalah metode diagnostik non-invasif yang memanfaatkan gelombang ultrasonik untuk melihat kondisi organ internal perut tanpa radiasi.",
    bullets: [
      "Mendeteksi Masalah Organ Hati & Empedu",
      "Mencari Penyebab Nyeri Perut Akut",
      "Evaluasi Ginjal dan Saluran Kemih",
      "Pemeriksaan Limpa dan Pankreas",
      "Diagnosis Dini Kista atau Massa Tumor",
      "Panduan Aman Tindakan Prosedur Medis"
    ],
    note: "Jika Anda memiliki keluhan nyeri perut berulang, USG Abdomen menjadi langkah awal tepat untuk diagnosis pasti."
  },
  2: { // Selasa
    tag: "KESEHATAN JANTUNG",
    title: "Pentingnya Skrining Jantung & EKG",
    summary: "Pemeriksaan Elektrokardiogram (EKG) dan Treadmill Test merekam aktivitas listrik jantung untuk mendeteksi gangguan irama dan penyumbatan pembuluh darah sedini mungkin.",
    bullets: [
      "Mendeteksi Risiko Penyakit Jantung Koroner",
      "Evaluasi Gangguan Irama Jantung (Aritmia)",
      "Pemeriksaan Pasien Nyeri Dada & Sesak",
      "Pemantauan Pasca Serangan Jantung",
      "Skrining Rutin Penderita Hipertensi"
    ],
    note: "Jangan sepelekan nyeri dada menjalar. Segera periksakan diri ke dokter spesialis jantung kami."
  },
  3: { // Rabu
    tag: "TUMBUH KEMBANG ANAK",
    title: "Pantau Tumbuh Kembang & Imunisasi",
    summary: "1000 Hari Pertama Kehidupan (HPK) adalah periode emas pembentukan otak dan daya tahan tubuh anak. Pastikan berat badan, tinggi badan, dan jadwal vaksinasi terpantau rutin.",
    bullets: [
      "Pencegahan Dini Masalah Stunting",
      "Skrining Perkembangan Motorik & Bicara",
      "Kelengkapan Vaksinasi & Imunisasi Wajib",
      "Konsultasi Nutrisi & Gizi Seimbang Anak",
      "Penanganan Dini Alergi & Infeksi Anak"
    ],
    note: "Bawa si kecil berkonsultasi secara berkala ke Poli Spesialis Anak RSU Siaga Medika."
  },
  4: { // Kamis
    tag: "KESEHATAN LAMBUNG",
    title: "Waspada Gejala GERD & Dispepsia",
    summary: "Asam lambung naik (GERD) dan luka lambung kronis membutuhkan penanganan terpadu agar tidak memicu komplikasi pada saluran kerongkongan dan lambung.",
    bullets: [
      "Meredakan Sensasi Dada Terbakar (Heartburn)",
      "Penanganan Mual, Kembung, & Begah",
      "Pemeriksaan Endoskopi Saluran Cerna",
      "Pencegahan Luka Lambung Akut",
      "Panduan Pola Makan Lambung Sehat"
    ],
    note: "Konsultasikan gangguan pencernaan Anda ke dokter spesialis penyakit dalam kami."
  },
  5: { // Jumat
    tag: "SARAF & OTAK",
    title: "Kenali Gejala Stroke Sejak Dini (FAST)",
    summary: "Stroke adalah kondisi darurat medis. Penanganan dalam periode emas (Golden Period < 4,5 jam) sangat krusial untuk mencegah kelumpuhan permanen.",
    bullets: [
      "Face Drooping (Wajah Mencong/Asimetris)",
      "Arm Weakness (Lengan/Kaki Lemah Separo)",
      "Speech Difficulty (Bicara Pelo / Tidak Jelas)",
      "Time to Call (Segera ke IGD 24 Jam)",
      "Rehabilitasi Medik & Fisioterapi Pasca Stroke"
    ],
    note: "IGD RSU Siaga Medika siaga 24 jam dengan tim dokter spesialis saraf & sarana terpadu."
  },
  6: { // Sabtu
    tag: "IBU & KANDUNGAN",
    title: "Pemeriksaan Kehamilan & USG 4D",
    summary: "USG 4 Dimensi menampilkan pergerakan janin secara real-time dan mendeteksi potensi kelainan anatomis bayi dalam kandungan secara lebih detail.",
    bullets: [
      "Melihat Wajah & Gerakan Janin Real-Time",
      "Evaluasi Anatomi Organ Vital Bayi",
      "Pemantauan Posisi & Aliran Darah Plasenta",
      "Pemeriksaan Cairan Ketuban & Tali Pusat",
      "Perencanaan Persalinan Nyaman & Aman"
    ],
    note: "Jadwalkan USG 4D Anda bersama dokter spesialis obstetri & ginekologi (Sp.OG) kami."
  },
  0: { // Minggu
    tag: "PREVENTIF & MCU",
    title: "Manfaat Medical Check Up Rutin",
    summary: "Pemeriksaan kesehatan menyeluruh mendeteksi silent killer seperti diabetes, kolesterol tinggi, asam urat, dan kelainan organ sebelum muncul gejala klinis.",
    bullets: [
      "Evaluasi Kadar Gula, Kolesterol, & Asam Urat",
      "Pemeriksaan Fungsi Ginjal & Fungsi Hati",
      "Rontgen Thorax & Skrining Paru",
      "Pemeriksaan Tekanan Darah & Jantung",
      "Paket MCU Komprehensif Sesuai Kebutuhan"
    ],
    note: "Mencegah lebih baik daripada mengobati. Lakukan Medical Check Up tahunan Anda bersama keluarga."
  }
};

export async function POST(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, 'ai-poster-tip', 15, 60000);
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'schedules', 'read');
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const customPrompt = body.prompt;
    const dayOfWeek = body.dayIdx !== undefined ? Number(body.dayIdx) : new Date().getDay();

    // Default preset fallback jika tidak ada AI provider / error
    const defaultTopic = DAILY_TOPIC_PRESETS[dayOfWeek] || DAILY_TOPIC_PRESETS[1];

    if (!customPrompt) {
      return NextResponse.json({ success: true, topic: defaultTopic });
    }

    // Ambil setting AI dari DB
    const aiConfig = await prisma.aiSettings.findUnique({ where: { id: 'singleton' } });
    if (!aiConfig || !aiConfig.aiEnabled) {
      return NextResponse.json({ success: true, topic: defaultTopic, note: "AI disabled, returning daily preset" });
    }

    let modelInstance: any = null;
    const provider = aiConfig.provider;

    if (provider === 'gemini' && (aiConfig.geminiKey || aiConfig.apiKey)) {
      const google = createGoogleGenerativeAI({ apiKey: aiConfig.geminiKey || aiConfig.apiKey });
      modelInstance = google(aiConfig.aiModel || 'gemini-1.5-flash');
    } else if (provider === 'groq' && (aiConfig.groqKey || aiConfig.apiKey)) {
      const groq = createGroq({ apiKey: aiConfig.groqKey || aiConfig.apiKey });
      modelInstance = groq(aiConfig.aiModel || 'llama-3.3-70b-versatile');
    } else if (provider === 'ollama') {
      const ollama = createOllama({ baseURL: aiConfig.ollamaUrl || 'http://localhost:11434/api' });
      modelInstance = ollama(aiConfig.aiModel || 'qwen2.5:1.5b');
    }

    if (!modelInstance) {
      return NextResponse.json({ success: true, topic: defaultTopic });
    }

    const systemPrompt = `Anda adalah Dokter Spesialis & Konsultan Edukasi Kesehatan Resmi RSU Siaga Medika Purbalingga.
Buatlah infografis edukasi kesehatan singkat, menarik, dan terstruktur dalam format JSON murni.
JSON HARUS memiliki struktur berikut:
{
  "tag": "KATEGORI SINGKAT (2-3 kata huruf kapital)",
  "title": "Judul Edukasi Menarik (contoh: Apa itu USG Abdomen? / Waspada Nyeri Sendi)",
  "summary": "Penjelasan singkat padat 1-2 kalimat (maks 35 kata)",
  "bullets": [
    "Poin manfaat/gejala 1 (5-8 kata)",
    "Poin manfaat/gejala 2",
    "Poin manfaat/gejala 3",
    "Poin manfaat/gejala 4",
    "Poin manfaat/gejala 5"
  ],
  "note": "Pesan ajakan singkat konsultasi ke dokter RSU Siaga Medika."
}
HANYA kembalikan JSON valid tanpa markdown atau teks pengantar.`;

    const { text } = await generateText({
      model: modelInstance,
      system: systemPrompt,
      prompt: `Buat materi infografis poster kesehatan bertema: "${customPrompt}".`,
      temperature: 0.4,
    });

    const cleanJsonStr = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonStr);

    return NextResponse.json({
      success: true,
      topic: {
        tag: parsed.tag || defaultTopic.tag,
        title: parsed.title || defaultTopic.title,
        summary: parsed.summary || defaultTopic.summary,
        bullets: Array.isArray(parsed.bullets) && parsed.bullets.length > 0 ? parsed.bullets.slice(0, 6) : defaultTopic.bullets,
        note: parsed.note || defaultTopic.note,
      }
    });

  } catch (err: any) {
    console.error("AI Poster Tip Error:", err);
    const dayOfWeek = new Date().getDay();
    return NextResponse.json({
      success: true,
      topic: DAILY_TOPIC_PRESETS[dayOfWeek] || DAILY_TOPIC_PRESETS[1],
      fallback: true
    });
  }
}
