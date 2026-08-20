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

    const systemPrompt = `Anda adalah spesialis ekstraksi data cuti dokter RS Siaga Medika dari format pesan WhatsApp seperti berikut:
Contoh Format WA:
"REKAP JADWAL CUTI SPESIALIS BULAN AGUSTUS 2026
*POLI ANAK*
dr. Irma Sp.A 
Tgl 17 Agustus ( merah )
Tgl 24 Agustus ( geser merah tgl 25)

dr. Rif'an Sp.A
Tgl 17, 25 Agustus ( merah)

*POLI BEDAH*
dr Endro : 3 - 8 Agustus 2026 *(CUTI di gantikan dr Oki Sp. B )*
dr Endro : 17 Agustus *(LIBUR)*"

Tahun default: ${currentYear}
Bulan jika tidak disebutkan di baris: sesuaikan dengan judul header rekap atau bulan berjalan.

DAFTAR DOKTER RESMI RS:
${doctorListPrompt}

TUGAS ANDA:
1. Ekstrak SETIAP entri cuti/libur/izin per dokter.
2. Jika 1 dokter memiliki beberapa tanggal terpisah (misal: "17, 24, 25 Agustus" atau "Tgl 15,17 & 29 Agustus"), PECAH menjadi item terpisah untuk tiap tanggal, ATAU jika berupa rentang (misal "3 - 8 Agustus"), buat startDate="YYYY-08-03" dan endDate="YYYY-08-08".
3. Cocokkan nama dokter dengan DAFTAR DOKTER RESMI RS di atas.
4. Tentukan tipe cuti: 'Sakit', 'Liburan', 'Pribadi', 'Konferensi', atau 'Lainnya'.
5. Format tanggal wajib YYYY-MM-DD.

OUTPUT HARUS BERUPA ARRAY JSON MURNI TANPA MARKDOWN / TEKS PENJELAS:
[
  {
    "doctorName": "dr Endro",
    "matchedDoctorId": "cl...",
    "matchedDoctorName": "dr. Endro Sp.B",
    "startDate": "2026-08-03",
    "endDate": "2026-08-08",
    "type": "Liburan",
    "reason": "CUTI di gantikan dr Oki Sp. B",
    "confidence": 0.95
  }
]`;

    let parsedItems: ParsedLeaveItem[] = [];

    // ─── 1. INTEGRASI 9ROUTER / CLOUD LLM / OLLAMA ──────────
    try {
      const routerUrl = process.env.NINEROUTER_URL || 'https://9router.fallonava.my.id/v1';
      const routerKey = process.env.NINEROUTER_API_KEY || 'sk-8f213104862d5a9c-7qgfds-62839505';

      if (routerUrl && routerKey) {
        const routerRes = await fetch(`${routerUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${routerKey}`
          },
          body: JSON.stringify({
            model: process.env.NINEROUTER_MODEL || 'Navadha',
            stream: false,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Teks Rekap Chat WhatsApp:\n\n"""\n${text}\n"""\n\nEkstrak seluruh entri cuti dokter dalam format JSON array murni:` }
            ],
            temperature: 0.1
          })
        });

        if (routerRes.ok) {
          const rawText = await routerRes.text();
          let aiContent = '';
          if (rawText.startsWith('data:')) {
            const lines = rawText.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const chunk = JSON.parse(line.slice(6));
                  aiContent += chunk.choices?.[0]?.delta?.content || '';
                } catch (_) {}
              }
            }
          } else {
            const jsonRes = JSON.parse(rawText);
            aiContent = jsonRes.choices?.[0]?.message?.content || '';
          }

          const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedItems = JSON.parse(jsonMatch[0]);
          }
        }
      } else {
        // Coba baca konfigurasi AI dari Settings DB (Gemini / Groq / Ollama internal)
        const aiConfig = await prisma.aiSettings.findUnique({ where: { id: 'singleton' } });
        if (aiConfig?.aiEnabled) {
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
              prompt: `Teks Rekap Chat WhatsApp:\n\n"""\n${text}\n"""\n\nEkstrak seluruh entri cuti dokter dalam format JSON array murni:`,
            });
            const jsonMatch = aiResponseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              parsedItems = JSON.parse(jsonMatch[0]);
            }
          }
        }
      }
    } catch (llmErr) {
      console.warn('LLM parsing error, falling back to rule-based parser:', llmErr);
    }

    // ─── 2. INSTANT RULE-BASED REGEX ENGINE (100% OFFLINE, CEPAT & TEPAT) ──────────
    if (parsedItems.length === 0) {
      const lines = text.split('\n');
      let currentDoc: any = null;
      let month = now.getMonth() + 1; // default current month
      
      const monthMatch = text.match(/BULAN\s+\*?([A-Za-z]+)\*?\s*(\d{4})?/i);
      if (monthMatch) {
        const mStr = monthMatch[1].toLowerCase();
        const monthsMap: Record<string, number> = {
          januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
          juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
        };
        if (monthsMap[mStr]) month = monthsMap[mStr];
      }

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('*POLI') || trimmed.startsWith('REKAP')) continue;

        // Cek apakah ada dokter di baris ini
        const matchedDoctor = doctors.find(d => {
          const cleanDoc = d.name.replace(/dr\.?|drg\.?|Sp\.[A-Za-z, ]+/gi, '').trim().toLowerCase();
          const cleanLine = trimmed.toLowerCase();
          return cleanDoc.length > 2 && cleanLine.includes(cleanDoc);
        });

        if (matchedDoctor) {
          currentDoc = matchedDoctor;
        }

        // Cek angka tanggal di baris
        if (currentDoc && trimmed.match(/\d+/)) {
          const rangeMatch = trimmed.match(/(\d{1,2})\s*-\s*(\d{1,2})/);
          if (rangeMatch) {
            const startDay = parseInt(rangeMatch[1]);
            const endDay = parseInt(rangeMatch[2]);
            const sDate = `${currentYear}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
            const eDate = `${currentYear}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
            parsedItems.push({
              doctorName: currentDoc.name,
              matchedDoctorId: currentDoc.id,
              matchedDoctorName: currentDoc.name,
              startDate: sDate,
              endDate: eDate,
              type: trimmed.toLowerCase().includes('sakit') ? 'Sakit' : 'Liburan',
              reason: trimmed,
              confidence: 0.95
            });
          } else {
            // Ambil semua angka tanggal yang dipisahkan koma / spasi / &
            const cleanDigits = trimmed.replace(/\b20\d\d\b/g, ''); // abaikan tahun (misal 2026)
            const dayNumbers = cleanDigits.match(/\b\d{1,2}\b/g);
            if (dayNumbers) {
              for (const dNum of dayNumbers) {
                const dayInt = parseInt(dNum);
                if (dayInt >= 1 && dayInt <= 31) {
                  const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(dayInt).padStart(2, '0')}`;
                  parsedItems.push({
                    doctorName: currentDoc.name,
                    matchedDoctorId: currentDoc.id,
                    matchedDoctorName: currentDoc.name,
                    startDate: dateStr,
                    endDate: dateStr,
                    type: trimmed.toLowerCase().includes('sakit') ? 'Sakit' : 'Liburan',
                    reason: trimmed,
                    confidence: 0.9
                  });
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, items: parsedItems });
  } catch (error: any) {
    console.error('AI Parse Leave Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses data cuti' }, { status: 500 });
  }
}
