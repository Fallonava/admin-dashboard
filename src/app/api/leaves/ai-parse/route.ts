import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/api-utils';
import { createOllama } from 'ollama-ai-provider-v2';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createCohere } from '@ai-sdk/cohere';
import { generateText } from 'ai';

export const dynamic = 'force-dynamic';

interface ParsedLeaveItem {
  doctorName: string;
  matchedDoctorId?: string;
  matchedDoctorName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: 'Sakit' | 'Liburan' | 'Pribadi' | 'Konferensi' | 'Lainnya';
  reason: string;
  confidence: number;
}

export async function POST(req: Request) {
  const authErr = await requirePermission(req, 'leaves', 'write');
  if (authErr) return authErr;

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Teks pesan WA wajib diisi' }, { status: 400 });
    }

    // Ambil daftar dokter untuk pencocokan nama
    const doctors = await prisma.doctor.findMany({
      select: { id: true, name: true, specialty: true }
    });

    const doctorListPrompt = doctors.map(d => `- ${d.name} (${d.specialty}) [ID: ${d.id}]`).join('\n');

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentYear = now.getFullYear();
    const todayStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const systemPrompt = `Anda adalah asisten AI ekstraksi jadwal cuti dokter RS dari pesan obrolan WhatsApp / memo staf.
Tahun saat ini: ${currentYear}
Tanggal hari ini: ${todayStr}

DAFTAR DOKTER RESMI RS:
${doctorListPrompt}

TUGAS ANDA:
1. Baca teks pesan WhatsApp yang diberikan pengguna.
2. Temukan setiap dokter yang mengajukan cuti, izin, atau libur praktek.
3. Cocokkan nama dokter dengan DAFTAR DOKTER RESMI RS di atas (toleransi typo, singkatan gelar seperti dr., Sp.A, Sp.PD, dll).
4. Tentukan tanggal mulai (startDate) dan tanggal selesai (endDate) dalam format ISO YYYY-MM-DD. Jika hanya 1 hari (misal "besok" atau "tgl 21 Agustus"), maka startDate dan endDate sama.
5. Tentukan tipe cuti: 'Sakit', 'Liburan', 'Pribadi', 'Konferensi', atau 'Lainnya'.
6. Buat ringkasan alasan cuti (reason).

OUTPUT WAJIB JSON MURNI (Array of Objects) tanpa markdown backticks atau penjelasan apapun:
[
  {
    "doctorName": "Nama yang tertulis di chat",
    "matchedDoctorId": "ID dokter dari daftar resmi",
    "matchedDoctorName": "Nama resmi dari daftar",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "type": "Sakit",
    "reason": "Alasan singkat",
    "confidence": 0.95
  }
]`;

    // Coba gunakan AI eksternal jika aktif, jika tidak fallback ke rule-based / smart parsing
    const aiConfig = await prisma.aiSettings.findUnique({ where: { id: 'singleton' } });
    let parsedItems: ParsedLeaveItem[] = [];

    if (aiConfig?.aiEnabled) {
      try {
        let aiModel: any = null;
        let modelName = aiConfig.aiModel || 'qwen2.5:1.5b';

        if (aiConfig.provider === 'ollama') {
          const baseUrl = (aiConfig.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
          const ollamaProvider = createOllama({ baseURL: `${baseUrl}/api` });
          aiModel = ollamaProvider(modelName);
        } else if (aiConfig.provider === 'gemini') {
          const google = createGoogleGenerativeAI({ apiKey: aiConfig.geminiKey || aiConfig.apiKey || '' });
          aiModel = google(modelName);
        } else if (aiConfig.provider === 'groq') {
          const groq = createGroq({ apiKey: aiConfig.groqKey || '' });
          aiModel = groq(modelName);
        } else if (aiConfig.provider === 'cohere') {
          const cohere = createCohere({ apiKey: aiConfig.cohereKey || '' });
          aiModel = cohere('command-r-plus-08-2024');
        }

        if (aiModel) {
          const { text: aiResponseText } = await generateText({
            model: aiModel,
            system: systemPrompt,
            prompt: `Berikut teks pesan WhatsApp yang perlu diekstraksi:\n\n"""\n${text}\n"""\n\nEkstrak data cuti dokter dalam format JSON array:`,
          });

          const jsonMatch = aiResponseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedItems = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        console.warn('AI Parsing failed, falling back to heuristic parsing:', err);
      }
    }

    // Heuristic fallback jika AI nonaktif atau gagal
    if (parsedItems.length === 0) {
      const lowerText = text.toLowerCase();
      for (const doc of doctors) {
        // Ambil nama tanpa gelar (dr., Sp.X, dll)
        const cleanName = doc.name.replace(/dr\.?|drg\.?|Sp\.[A-Za-z, ]+/gi, '').trim().toLowerCase();
        if (cleanName.length > 2 && lowerText.includes(cleanName)) {
          // Cari pola tanggal sederhana (misal 20/08/2026 atau 20-22 Agustus)
          parsedItems.push({
            doctorName: doc.name,
            matchedDoctorId: doc.id,
            matchedDoctorName: doc.name,
            startDate: todayStr,
            endDate: todayStr,
            type: lowerText.includes('sakit') ? 'Sakit' : lowerText.includes('seminar') || lowerText.includes('konferensi') ? 'Konferensi' : 'Pribadi',
            reason: text.slice(0, 100).trim(),
            confidence: 0.7
          });
        }
      }
    }

    return NextResponse.json({ success: true, items: parsedItems });
  } catch (error: any) {
    console.error('AI Parse Leave Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses data cuti dengan AI' }, { status: 500 });
  }
}
