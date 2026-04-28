import { prisma } from '@/lib/prisma';
import { parseIntent } from '@/lib/assistant/nlp';
import { generateEmbedding, findMostSimilar } from '@/lib/vector-store';
import { createOllama } from 'ollama-ai-provider-v2';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createCohere } from '@ai-sdk/cohere';
import { streamText } from 'ai';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function formatShift(shift: { dayIdx: number; formattedTime?: string | null; title: string; registrationTime?: string | null }) {
  let text = `- **${DAYS[shift.dayIdx]}**: ${shift.formattedTime || shift.title}`;
  if (shift.registrationTime) text += ` _(daftar: ${shift.registrationTime})_`;
  return text;
}

function buildMemoryContext(history: { sender: string; text: string }[]) {
  if (!history || history.length === 0) return '';
  return "Riwayat percakapan:\n" + history.slice(-4).map(h =>
    `${h.sender === 'user' ? 'Pasien' : 'Asisten'}: ${h.text}`
  ).join('\n') + "\n\n";
}

export class AssistantService {
  static async handleChatRequest(message: string, role: string, conversationHistory: any[]) {
    if (!message || typeof message !== 'string') {
      return { reply: 'Halo! Ada yang bisa saya bantu?', isStream: false };
    }

    const userRole = role === 'admin' ? 'admin' : 'public';
    const aiConfig = await prisma.aiSettings.findUnique({ where: { id: 'singleton' } });
    const parsed = parseIntent(message, userRole);
    
    let contextText = '';
    let source = 'local-nlp';
    let kbMatchId: string | null = null;

    // ─── LAYER 0: SEMANTIC RAG ──────────
    if (parsed.intent === 'general' || parsed.intent === 'unknown') {
      try {
        const kbItems = await prisma.knowledgeBase.findMany({
          where: { isActive: true },
          select: { id: true, title: true, content: true, embedding: true, category: true },
        });

        if (kbItems.length > 0) {
          const queryEmbedding = await generateEmbedding(message);
          const { match } = findMostSimilar(message, queryEmbedding, kbItems as any, 0.40);
          if (match) {
            contextText = `Informasi dari Basis Pengetahuan RS:\n**${match.title}**\n${(match as any).content}`;
            source = 'hybrid-rag';
            kbMatchId = match.id;
          }
        }
      } catch (e) {
        console.warn('Semantic search skipped:', e);
      }
    }

    // ─── AI OMNISCIENCE 2.0 ───────────────────
    try {
      const wibDate = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
      const todayDayIdx = (wibDate.getDay() + 6) % 7;
      const tomorrowDayIdx = (todayDayIdx + 1) % 7;
      const todayDateStr = wibDate.toISOString().split('T')[0];

      const [shifts, leaves, stats, settings, allDoctors] = await Promise.all([
        prisma.shift.findMany({
          include: { doctor: { select: { name: true, specialty: true } } },
          orderBy: [{ dayIdx: 'asc' }, { timeIdx: 'asc' }]
        }),
        prisma.leaveRequest.findMany({
          where: { endDate: { gte: new Date() }, status: 'APPROVED' },
          include: { doctor: { select: { name: true } } }
        }),
        prisma.dailyRecap.findUnique({
          where: { date: new Date(todayDateStr) }
        }).catch(() => null),
        prisma.settings.findUnique({ where: { id: "1" } }).catch(() => null),
        prisma.doctor.findMany({ select: { name: true, specialty: true } })
      ]);

      const todayFullString = wibDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      let omniscienceDigest = `[DATA OMNISCIENCE RS MEDCORE]\nINFO WAKTU SAAT INI: HARI INI ADALAH ${todayFullString.toUpperCase()}\n`;
      omniscienceDigest += `Status Otomasi: ${settings?.automationEnabled ? 'AKTIF' : 'NON-AKTIF'} | Mode Darurat: ${settings?.emergencyMode ? 'AKTIF 🚨' : 'Mati'}\n\n`;

      if (stats) {
        omniscienceDigest += `> RINGKASAN OPERASIONAL HARI INI:\n`;
        omniscienceDigest += `- Total Pasien Terdaftar: ${stats.total_patients}\n`;
        omniscienceDigest += `- Kendala SEP (BPJS): ${stats.missing_sep_count} kasus\n\n`;
      }

      const leaveMap = new Map();
      leaves.forEach(l => {
        leaveMap.set(l.doctor.name, l);
      });

      if (leaves.length > 0) {
        omniscienceDigest += `> STATUS DOKTER CUTI (PENTING!):\n`;
        leaves.forEach(l => {
           omniscienceDigest += `- ${l.doctor.name} SEDANG CUTI dari tanggal ${l.startDate.toLocaleDateString('id-ID')} sampai ${l.endDate.toLocaleDateString('id-ID')}.\n  INSTRUKSI AI: Jangan sebutkan jam praktek dokter ini selama masa cuti. Langsung beritahu pasien bahwa dokter sedang cuti dan arahkan ke dokter spesialis yang sama jika ada.\n`;
        });
        omniscienceDigest += `\n`;
      }

      const allDocsStr = allDoctors.map(d => `${d.name} (${d.specialty})`).join(', ');
      omniscienceDigest += `> DIREKTORI SELURUH DOKTER RS: ${allDocsStr}\n`;
      omniscienceDigest += `INSTRUKSI: Jika pasien menyebut nama tidak lengkap/typo (misal "dr ardian"), cocokkan dengan direktori ini. Jika dokter tidak ada di jadwal hari ini/besok dan tidak ada di daftar cuti, sampaikan bahwa dokter tersebut belum ada jadwal praktek terdaftar.\n\n`;

      omniscienceDigest += `> JADWAL PRAKTEK DOKTER REGULER (7 HARI):\nCatatan PENTING untuk AI: Jika pasien meminta jadwal hari ini/besok, Anda WAJIB mengelompokkan daftar nama dokter berdasarkan Poliklinik/Spesialisasinya menggunakan Markdown bullet points berlapis (nested list) agar mudah dibaca, BUKAN daftar rata satu level. Jika dokter pada hari tersebut sedang cuti (lihat STATUS DOKTER CUTI di atas), maka BATALKAN jadwalnya dan beritahu pasien.\n`;
      
      DAYS.forEach((dayName, idx) => {
         const dayShifts = shifts.filter(s => s.dayIdx === idx);
         omniscienceDigest += `\n[HARI ${dayName.toUpperCase()}]\n`;
         if (dayShifts.length > 0) {
            dayShifts.forEach(s => {
               omniscienceDigest += `- ${s.doctor.name} (${s.doctor.specialty}): ${s.formattedTime || s.title}\n`;
            });
         } else {
            omniscienceDigest += `- Belum ada jadwal praktek dokter yang terdaftar.\n`;
         }
      });
      omniscienceDigest += `\n`;

      if (contextText && contextText.length > 0) {
        omniscienceDigest += `\n> PENGETAHUAN TAMBAHAN (WEB/FAQ):\n${contextText}\n`;
      }

      contextText = omniscienceDigest;
      source = 'omniscience-2.0';

    } catch (e) {
      console.error('Omniscience fetch error:', e);
    }

    if (kbMatchId) {
      prisma.knowledgeBase.update({ where: { id: kbMatchId }, data: { hitCount: { increment: 1 } } }).catch(() => null);
    }

    // ─── CLOUD / LOCAL AI STREAMING ──────────────────
    if (aiConfig?.aiEnabled) {
      try {
        let aiModelOptions: any = null;
        let modelName = aiConfig.aiModel || 'qwen2.5:1.5b';

        if (aiConfig.provider === 'ollama') {
          const baseUrl = (aiConfig.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
          const ollamaProvider = createOllama({ baseURL: `${baseUrl}/api` });
          if (modelName.includes('gemini')) modelName = 'qwen2.5:1.5b'; 
          aiModelOptions = ollamaProvider(modelName);
        } 
        else if (aiConfig.provider === 'gemini') {
          const google = createGoogleGenerativeAI({ apiKey: aiConfig.geminiKey || aiConfig.apiKey || '' });
          aiModelOptions = google(modelName);
        }
        else if (aiConfig.provider === 'groq') {
          const groq = createGroq({ apiKey: aiConfig.groqKey || '' });
          aiModelOptions = groq(modelName);
        }
        else if (aiConfig.provider === 'cohere') {
          const cohere = createCohere({ apiKey: aiConfig.cohereKey || '' });
          let cohereModel = modelName;
          if (cohereModel === 'command-r' || cohereModel === 'command-r-plus') cohereModel = 'command-r-plus-08-2024';
          aiModelOptions = cohere(cohereModel);
        }

        if (!aiModelOptions) throw new Error("Provider tidak valid");

        const shortHistory = (conversationHistory || []).slice(-2);
        const memoryCtx = buildMemoryContext(shortHistory);

        let finalSystemPrompt = aiConfig.systemPrompt || 'Anda adalah asisten virtual resmi RS.';
        finalSystemPrompt += '\n\nPERINGATAN KRITIKAL (ANTI-HALLUCINATION): DILARANG KERAS mengarang atau menciptakan jadwal/nama dokter palsu. JAWAB HANYA BERDASARKAN DATA OMNISCIENCE DI BAWAH INI. Jika data jadwal kosong, sampaikan dengan sopan bahwa jadwal belum tersedia.';
        
        if (userRole === 'admin') {
          finalSystemPrompt += '\n\nINSTRUKSI KHUSUS MODE ADMIN:\nAnda berbicara dengan staf atau manajemen RS. Bersikaplah profesional, analitis, dan to-the-point sebagai asisten operasional RS. Berikan jawaban yang ringkas dan informatif tanpa basa-basi berlebihan.';
        } else {
          finalSystemPrompt += '\n\nINSTRUKSI KHUSUS MODE PUBLIK:\nAnda berbicara dengan pasien atau keluarga pasien. Bersikaplah sebagai Customer Service RS yang sangat hangat, ramah, suportif, dan empati. Gunakan panggilan "Bapak/Ibu" mendoakan kesembuhan. JANGAN berikan diagnosis medis.';
        }

        const result = streamText({
          model: aiModelOptions,
          system: finalSystemPrompt,
          prompt: `${memoryCtx}KONTEKS DATA RUMAH SAKIT:\n${contextText}\n\nPERTANYAAN: ${message}\n\nJawablah berdasarkan konteks di atas dengan gaya bahasa sesuai peran Anda.`,
        });

        return { isStream: true, streamResult: result };
      } catch (err) {
        console.error('LLM stream error, falling back to local:', err);
      }
    }

    return {
      isStream: false,
      reply: contextText,
      intent: parsed.intent,
      source,
      confidence: parsed.confidence,
    };
  }
}
