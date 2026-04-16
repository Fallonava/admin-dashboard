import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseIntent, SYMPTOM_MAP } from '@/lib/assistant/nlp';
import { generateEmbedding, findMostSimilar } from '@/lib/vector-store';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// ─── Helper: Format shift ke teks ─────────────────────
function formatShift(shift: { dayIdx: number; formattedTime?: string | null; title: string; registrationTime?: string | null }) {
  let text = `- **${DAYS[shift.dayIdx]}**: ${shift.formattedTime || shift.title}`;
  if (shift.registrationTime) text += ` _(daftar: ${shift.registrationTime})_`;
  return text;
}

// ─── Helper: Generate Context Memory ─────────────────
function buildMemoryContext(history: { sender: string; text: string }[]) {
  if (!history || history.length === 0) return '';
  return "Konteks obrolan sebelumnya:\n" + history.slice(-4).map(h => `${h.sender === 'user' ? 'Pasien' : 'Asisten'}: ${h.text}`).join('\n') + "\n\n";
}

// ─── AI SWITCH ENGINE: Panggil Gemini Jika Diaktifkan ─────────────
async function askGenerativeAI(prompt: string, contextSource: string, settings: any) {
  try {
    if (!settings.apiKey) return null;
    const genAI = new GoogleGenerativeAI(settings.apiKey);
    const model = genAI.getGenerativeModel({ model: settings.aiModel });
    
    const finalPrompt = `
${settings.systemPrompt}

PENTING: Gunakan informasi berikut sebagai 100% SUMBER KEBENARAN SATU-SATUNYA. Jangan menambah fakta fiktif. Jika informasi di sumber tidak cukup, jawab dengan sopan bahwa Anda tidak tahu jadwal/infonya.

SUMBER DATA (RAG/DATABASE):
"""
${contextSource}
"""

PERTANYAAN PASIEN:
"${prompt}"

Tuliskan balasan untuk pasien secara natural, empatik, menggunakan emoji yang pas, dan diformat menggunakan Markdown (bold, list). Jangan menyebut "Berdasarkan sumber data" dsb, bersikap seolah-olah Anda yang tahu informasinya.
`;
    const result = await model.generateContent(finalPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return null; // Fallback ke Local text
  }
}

export async function POST(req: Request) {
  try {
    const { message, role, conversationHistory } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: 'Halo! Ada yang bisa saya bantu?' });
    }

    const userRole = role === 'admin' ? 'admin' : 'public';
    
    // Memory context for NLP
    const memoryCtx = buildMemoryContext(conversationHistory || []);
    const fullQuery = memoryCtx ? memoryCtx + "Pertanyaan: " + message : message;
    
    const parsed = parseIntent(message, userRole);
    let replyText = '';
    let source = '-';
    let kbMatchId = null;

    // Ambil Settings AI
    const aiConfig = await prisma.aiSettings.findUnique({ where: { id: 'singleton' } });

    // ─── LAYER 0: SEMANTIC RAG untuk intent general/unknown ────────────────────
    if (parsed.intent === 'general' || parsed.intent === 'unknown') {
      try {
        const kbItems = await prisma.knowledgeBase.findMany({
          where: { isActive: true },
          select: { id: true, title: true, content: true, embedding: true, category: true },
        });

        if (kbItems.length > 0) {
          const queryEmbedding = await generateEmbedding(message);
          // Menggunakan HYBRID SEARCH terbaru (BM25 + RRF)
          const { match, score } = findMostSimilar(message, queryEmbedding, kbItems as any, 0.40);

          if (match) {
            replyText = `**${match.title}**\n\n${(match as any).content}\n\n_ℹ️ Kategori: ${(match as any).category}_`;
            source = 'hybrid-rag';
            kbMatchId = match.id;
          }
        }
      } catch (e) {
        console.warn('Semantic search skipped:', e);
      }
    }

    // ─── LAYER 1: JADWAL HARI INI / BESOK (semua dokter yang praktek) ──────────
    if (parsed.intent === 'jadwal_hari_ini' || parsed.intent === 'jadwal_besok') {
      const targetDayIdx = parsed.intent === 'jadwal_hari_ini' ? new Date().getDay() : (new Date().getDay() + 1) % 7;
      const dayWord = parsed.intent === 'jadwal_hari_ini' ? 'Hari ini' : 'Besok';

      const shifts = await prisma.shift.findMany({
        where: { dayIdx: targetDayIdx, doctor: { status: { not: 'CUTI' } } },
        include: { doctor: { select: { name: true, specialty: true, category: true, status: true } } },
        orderBy: { title: 'asc' }, take: 20,
      });

      if (shifts.length > 0) {
        replyText = `📅 **${dayWord} (${DAYS[targetDayIdx]}), dokter praktek:**\n`;
        const grouped: Record<string, string[]> = {};
        for (const s of shifts) {
          const key = s.doctor.specialty || 'Lainnya';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(`- **${s.doctor.name}** ${s.formattedTime || s.title}`);
        }
        for (const [spec, items] of Object.entries(grouped)) {
          replyText += `\n**${spec}**\n${items.join('\n')}\n`;
        }
      } else {
        replyText = `Tidak ada jadwal praktek terdaftar untuk **${dayWord} (${DAYS[targetDayIdx]})**.`;
      }
      source = 'db-schedule';
    }

    // ─── LAYER 2: JADWAL TANGGAL SPESIFIK ──────────────────────────────────────
    else if (parsed.intent === 'jadwal_tanggal') {
      const dayIdx = parsed.entities.dayIdx ?? new Date().getDay();
      const shifts = await prisma.shift.findMany({
        where: { dayIdx, doctor: { status: { not: 'CUTI' } } },
        include: { doctor: { select: { name: true, specialty: true } } },
        take: 15,
      });

      if (shifts.length > 0) {
        replyText = `📅 **Jadwal Praktek — ${parsed.entities.day || DAYS[dayIdx]} (${DAYS[dayIdx]}):**\n`;
        for (const s of shifts) replyText += `- **${s.doctor.name}** _(${s.doctor.specialty})_ — ${s.formattedTime || s.title}\n`;
      } else {
        replyText = `Tidak ada jadwal terdaftar untuk **${parsed.entities.day || DAYS[dayIdx]}**.`;
      }
      source = 'db-schedule';
    }

    // ─── LAYER 3: CARI DOKTER BY POLI / SPESIALISASI ───────────────────────────
    else if (parsed.intent === 'cari_dokter') {
      const { specialty, polyclinic } = parsed.entities;
      const whereClause: any = { status: { not: 'CUTI' } };
      if (specialty) whereClause.specialty = { contains: specialty, mode: 'insensitive' };
      if (polyclinic && !specialty) whereClause.category = { contains: polyclinic.replace('poli ', ''), mode: 'insensitive' };

      const doctors = await prisma.doctor.findMany({
        where: whereClause,
        include: { shifts: { select: { dayIdx: true, formattedTime: true, title: true } } },
        take: 10,
      });

      if (doctors.length > 0) {
        replyText = `🔍 Dokter spesialis terkait yang tersedia:\n\n`;
        for (const doc of doctors) {
          replyText += `- **${doc.name}** _(${doc.specialty})_\n`;
        }
      } else {
        replyText = `Maaf, dokter dengan spesialisasi/poli tersebut tidak ditemukan.`;
      }
      source = 'db-doctors';
    }

    // ─── LAYER 4: INFO DOKTER CUTI MASA DEPAN (FORECASTING) ────────────────────
    else if (parsed.intent === 'cuti_dokter') {
      const now = new Date();
      // Cari cuti yang sedang berjalan atau di masa depan
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          endDate: { gte: now },
          status: 'APPROVED',
          doctor: parsed.entities.doctorName ? { name: { contains: parsed.entities.doctorName, mode: 'insensitive' } } : undefined
        },
        include: { doctor: { select: { name: true, specialty: true } } },
        orderBy: { startDate: 'asc' },
        take: 15,
      });

      if (leaveRequests.length > 0) {
        replyText = `📋 **Jadwal Cuti Dokter Terkonfirmasi:**\n`;
        for (const leave of leaveRequests) {
          const start = leave.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          const end = leave.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          replyText += `- **${leave.doctor.name}** _(${leave.doctor.specialty})_\n  Libur dari **${start}** s/d **${end}**.\n`;
        }
      } else {
        replyText = `✅ Semua jadwal dokter aman. Tidak ada pengajuan cuti yang terdaftar dalam waktu dekat ini.`;
      }
      source = 'db-leaves';
    }

    // ─── LAYER 4.5: REKOMENDASI BERDASARKAN KELUHAN MEDIS ───────────────────
    else if (parsed.intent === 'rekomendasi_keluhan') {
      const symptom = parsed.entities.symptom;
      if (!symptom || !SYMPTOM_MAP[symptom]) {
        replyText = `Gejala Anda dicatat, namun saya kesulitan menemukan spesialis yang pas secara spesifik. Silakan hubungi Poli Umum terlebih dahulu.`;
      } else {
        const specs = SYMPTOM_MAP[symptom]; // Array ['saraf', 'umum'] dll
        const todayIdx = new Date().getDay();

        // Cari dokter yang punya shift HARI INI dengan spesialisasi tersebut
        const recommendedDoctors = await prisma.doctor.findMany({
          where: { 
            status: { not: 'CUTI' },
            specialty: { in: specs, mode: 'insensitive' },
            shifts: { some: { dayIdx: todayIdx } }
          },
          include: { shifts: { where: { dayIdx: todayIdx } } },
          take: 5
        });

        if (recommendedDoctors.length > 0) {
          replyText = `💡 Untuk keluhan **"${symptom}"**, Anda disarankan periksa ke spesialis **${specs.join(' / ')}**.\n\nSangat kebetulan, berikut dokter yang **PRAKTEK HARI INI** dan bisa Anda temui:\n`;
          for (const doc of recommendedDoctors) {
            replyText += `- **${doc.name}** _(${doc.specialty})_ — ${doc.shifts[0]?.formattedTime || doc.shifts[0]?.title}\n`;
          }
        } else {
          replyText = `💡 Untuk keluhan **"${symptom}"**, Anda disarankan periksa ke poli spesialis **${specs.join(' / ')}**.\nSayangnya belum ada spesialis tersebut yang terjadwal praktek hari ini.`;
        }
      }
      source = 'db-recommendation';
    }

    // ─── LAYER 5: JADWAL DOKTER SPESIFIK (by nama) ─────────────────────────────
    else if (parsed.intent === 'jadwal') {
      if (parsed.entities.doctorName) {
        let doctors = await prisma.doctor.findMany({
          where: { name: { contains: parsed.entities.doctorName, mode: 'insensitive' } },
          include: { shifts: { orderBy: { dayIdx: 'asc' } } },
          take: 3,
        });

        if (doctors.length > 0) {
          const doc = doctors[0];
          if ((doc as any).status === 'CUTI') {
            replyText = `😔 **${doc.name}** sedang **cuti** (tidak praktek).`;
          } else if (doc.shifts.length > 0) {
            replyText = `📅 Jadwal **${doc.name}** _(${(doc as any).specialty})_:\n` + doc.shifts.map(s => formatShift(s)).join('\n');
          } else {
            replyText = `**${doc.name}** terdaftar tapi belum ada data jam praktek.`;
          }
        }
      } else {
         replyText = `Mohon sebutkan nama dokter atau polisinya.`;
      }
      source = 'db-schedule';
    }

    // ─── FALLBACK FINAL ────────────────────────────────────────────────────────
    if (!replyText) {
      replyText = `Halo! Saya tidak menemukan jawaban yang tepat. Coba ketik "jadwal hari ini" atau "poli gigi".`;
    }

    // ─── AI ASSIST SWITCH (Jahit kalimat dengan AI Eksternal) ──────────────────
    if (aiConfig?.aiEnabled && aiConfig.provider === 'gemini') {
      const aiResponse = await askGenerativeAI(message, replyText, aiConfig);
      if (aiResponse) {
        replyText = aiResponse;
        source = 'ai-generative';
      }
    }

    // ─── HIT COUNT UPDATE UNTUK KNOWLEDGE BASE ─────────────────────────────────
    if (kbMatchId) {
       // Fire and forget, update statistic score for bot studio analytics
       prisma.knowledgeBase.update({ where: { id: kbMatchId }, data: { hitCount: { increment: 1 } } }).catch(()=>null);
    }

    return NextResponse.json({ reply: replyText, intent: parsed.intent, source, confidence: parsed.confidence });

  } catch (err: any) {
    console.error('Chat Assistant Error:', err);
    return NextResponse.json({ reply: 'Maaf, sistem AI sedang pulih dari gangguan.' }, { status: 500 });
  }
}
