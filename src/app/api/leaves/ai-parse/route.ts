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

// ─── Normalizer & Nickname Matching Helpers ─────────────────────────

function cleanWord(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(dr|drg|prof|rr|m)\b\.?/gi, ' ')
    .replace(/\bsp\.[a-z\-,\. ]+/gi, ' ')
    .replace(/\b(msi\.med|md|cips|finasim)\b\.?/gi, ' ')
    .replace(/[,\.\(\)\*\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDoctorTokens(name: string): string[] {
  const norm = normalizeName(name);
  return norm.split(' ').filter((w) => w.length >= 3);
}

const NICKNAME_ALIASES: Record<string, string[]> = {
  candra: ['chandra'],
  chandra: ['candra'],
  rifan: ['rifan', 'm. rifan', "rif'an"],
  tanji: ['ahmad tanji', 'tanji'],
  robby: ['robby', 'ramadhonie'],
  fajar: ['fajar', 'nugroho'],
  gatot: ['gatot', 'hananta'],
  hepta: ['hepta', 'lidia'],
  prita: ['pritasari', 'prita'],
  irma: ['irma', 'rosyana'],
  lita: ['lita', 'hati'],
  rahageng: ['rahageng', 'wida'],
  setyo: ['setyo', 'dirahayu'],
  sigit: ['sigit', 'purnomohadi'],
  eko: ['eko', 'subekti'],
  luthfi: ['luthfi', 'muammar'],
  wahid: ['wahid', 'heru'],
  lirans: ['lirans', 'tia'],
  endro: ['endro', 'wibowo'],
  suroso: ['suroso'],
  taufik: ['taufik', 'hidayanto'],
  nova: ['nova', 'kurniasari'],
  ajeng: ['ajeng', 'putri'],
  wati: ['wati'],
  oke: ['oke', 'viska'],
  harimurti: ['harimurti', 'swastika'],
};

const MONTHS_MAP: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5, may: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agu: 8, agt: 8,
  september: 9, sep: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  desember: 12, des: 12,
};

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

    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    let defaultYear = now.getFullYear();
    let defaultMonth = now.getMonth() + 1;

    // Deteksi Header Bulan & Tahun (misal: "REKAP JADWAL CUTI SPESIALIS BULAN *AGUSTUS* 2026")
    const headerMatch = text.match(/BULAN\s+\*?([A-Za-z]+)\*?\s*(\d{4})?/i);
    if (headerMatch) {
      const mStr = headerMatch[1].toLowerCase();
      if (MONTHS_MAP[mStr]) defaultMonth = MONTHS_MAP[mStr];
      if (headerMatch[2]) defaultYear = parseInt(headerMatch[2]);
    }

    let parsedItems: ParsedLeaveItem[] = [];

    // ─── 1. INTEGRASI 9ROUTER / CLOUD LLM (JIKA TERSEDIA) ──────────
    try {
      const routerUrl = process.env.NINEROUTER_URL || 'http://127.0.0.1:20128/v1';
      const routerKey = process.env.NINEROUTER_API_KEY || 'sk-local';

      const doctorListPrompt = doctors.map(d => `- ${d.name} (${d.specialty}) [ID: ${d.id}]`).join('\n');
      const systemPrompt = `Anda adalah spesialis ekstraksi data cuti dokter dari pesan WhatsApp.
Tahun: ${defaultYear}, Bulan default: ${defaultMonth}
DAFTAR DOKTER:
${doctorListPrompt}
TUGAS:
Ekstrak semua tanggal cuti per dokter dan cocokkan ke DAFTAR DOKTER.
Output WAJIB berupa JSON array murni:
[{"doctorName":"...","matchedDoctorId":"...","matchedDoctorName":"...","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","type":"Liburan|Sakit|Pribadi","reason":"...","confidence":0.95}]`;

      const routerRes = await fetch(`${routerUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${routerKey}`
        },
        body: JSON.stringify({
          model: process.env.NINEROUTER_MODEL || 'default',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(4000)
      }).catch(() => null);

      if (routerRes && routerRes.ok) {
        const jsonRes = await routerRes.json().catch(() => null);
        const aiContent = jsonRes?.choices?.[0]?.message?.content || '';
        const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedItems = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (_) {
      // LLM bypassed smoothly to Deterministic Engine
    }

    // ─── 2. HIGH-PRECISION MEDICAL NICKNAME & MULTI-TOKEN PARSER ──────────
    if (parsedItems.length === 0) {
      const docIndex = doctors.map((d) => ({
        doctor: d,
        tokens: getDoctorTokens(d.name),
        specialtyTokens: getDoctorTokens(d.specialty),
      }));

      const lines = text.split('\n');
      let currentDoc: any = null;
      let currentPoli: string = '';

      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i].trim();
        if (!raw) continue;

        // Check header POLI (e.g. *POLI ANAK*, *POLI OBGYN*)
        const poliMatch = raw.match(/^\*POLI\s+([^*]+)\*/i);
        if (poliMatch) {
          currentPoli = poliMatch[1].trim().toLowerCase();
          currentDoc = null;
          continue;
        }

        // Try to match doctor on this line
        let bestMatch: any = null;
        let highestScore = 0;
        const lineNorm = normalizeName(raw);
        const lineTokens = lineNorm.split(' ').filter((w) => w.length >= 2);

        for (const entry of docIndex) {
          let score = 0;
          for (const lt of lineTokens) {
            for (const dt of entry.tokens) {
              if (lt === dt || cleanWord(lt) === cleanWord(dt)) score += 10;
              else if (NICKNAME_ALIASES[lt]?.includes(dt) || NICKNAME_ALIASES[dt]?.includes(lt)) score += 9;
              else if (dt.startsWith(lt) && lt.length >= 4) score += 6;
            }
          }

          // Poli affinity boost
          if (currentPoli) {
            const spec = entry.doctor.specialty.toLowerCase();
            if (currentPoli.includes('anak') && spec.includes('anak')) score += 5;
            if (currentPoli.includes('obgyn') && (spec.includes('kandungan') || spec.includes('obgyn'))) score += 5;
            if (currentPoli.includes('dalam') && spec.includes('dalam')) score += 5;
            if (currentPoli.includes('bedah') && spec.includes('bedah')) score += 5;
            if (currentPoli.includes('saraf') && spec.includes('saraf')) score += 5;
            if (currentPoli.includes('jiwa') && spec.includes('jiwa')) score += 5;
            if (currentPoli.includes('urologi') && spec.includes('urologi')) score += 5;
            if (currentPoli.includes('tht') && spec.includes('tht')) score += 5;
            if (currentPoli.includes('paru') && spec.includes('paru')) score += 5;
            if (currentPoli.includes('mata') && spec.includes('mata')) score += 5;
            if (currentPoli.includes('jantung') && spec.includes('jantung')) score += 5;
            if (currentPoli.includes('rehab') && spec.includes('rehab')) score += 5;
            if (currentPoli.includes('ortho') && spec.includes('ortho')) score += 5;
            if (currentPoli.includes('mulut') && spec.includes('mulut')) score += 5;
          }

          if (score > highestScore && score >= 9) {
            highestScore = score;
            bestMatch = entry.doctor;
          }
        }

        if (bestMatch && (raw.toLowerCase().includes('dr') || lineTokens.length >= 1)) {
          currentDoc = bestMatch;
        }

        if (!currentDoc) continue;

        // Skip lines that are purely practice hours without leave/off indicators
        if (/^\s*(senin|selasa|rabu|kamis|jum'?at|sabtu|minggu)\s*:\s*\d{1,2}[.:]\d{2}/i.test(raw) && !/cuti|libur|ijin|izin|tutup|off|merah/i.test(raw)) {
          continue;
        }

        // Tentukan Tipe Cuti
        let leaveType: ParsedLeaveItem['type'] = 'Liburan';
        if (/sakit|ijin sakit|izin sakit/i.test(raw)) leaveType = 'Sakit';
        else if (/ijin|izin/i.test(raw)) leaveType = 'Pribadi';
        else if (/konferensi|seminar|workshop/i.test(raw)) leaveType = 'Konferensi';

        // Strip clock times (e.g. 13.30 - 15.30) to prevent date range collision
        const cleanRaw = raw.replace(/\b\d{1,2}[.:]\d{2}(?:\s*-\s*\d{1,2}[.:]\d{2})?\b/g, '');

        // 1. Date Range: e.g. "3 - 8 Agustus 2026"
        const rangeMatch = cleanRaw.match(/\b(\d{1,2})\s*-\s*(\d{1,2})(?:\s+([A-Za-z]+))?(?:\s+(\d{4}))?/);
        if (rangeMatch) {
          const sDay = parseInt(rangeMatch[1]);
          const eDay = parseInt(rangeMatch[2]);
          if (sDay >= 1 && sDay <= 31 && eDay >= 1 && eDay <= 31) {
            const mStr = rangeMatch[3]?.toLowerCase();
            const rMonth = mStr && MONTHS_MAP[mStr] ? MONTHS_MAP[mStr] : defaultMonth;
            const rYear = rangeMatch[4] ? parseInt(rangeMatch[4]) : defaultYear;

            const sDate = `${rYear}-${String(rMonth).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`;
            const eDate = `${rYear}-${String(rMonth).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`;

            parsedItems.push({
              doctorName: currentDoc.name,
              matchedDoctorId: currentDoc.id,
              matchedDoctorName: currentDoc.name,
              startDate: sDate,
              endDate: eDate,
              type: leaveType,
              reason: raw,
              confidence: 0.98,
            });
            continue;
          }
        }

        // 2. Slash dates: e.g. "08/08/2026", "15/08/2027", "17/8/2026"
        const slashMatches = Array.from(cleanRaw.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g));
        if (slashMatches.length > 0) {
          for (const sm of slashMatches) {
            const d = parseInt(sm[1]);
            const m = parseInt(sm[2]);
            const y = parseInt(sm[3]);
            if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
              const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              parsedItems.push({
                doctorName: currentDoc.name,
                matchedDoctorId: currentDoc.id,
                matchedDoctorName: currentDoc.name,
                startDate: dStr,
                endDate: dStr,
                type: leaveType,
                reason: raw,
                confidence: 0.95,
              });
            }
          }
          continue;
        }

        // 3. Multi-dates list: e.g. "17, 24, 25", "Tgl 15,17 & 29 Agustus", "17 dan 25 agustus"
        const noYear = cleanRaw.replace(/\b20\d\d\b/g, '');
        const digits = Array.from(noYear.matchAll(/\b(\d{1,2})\b/g))
          .map((m) => parseInt(m[1]))
          .filter((n) => n >= 1 && n <= 31);

        if (digits.length > 0) {
          let lineMonth = defaultMonth;
          for (const [mName, mNum] of Object.entries(MONTHS_MAP)) {
            if (new RegExp(`\\b${mName}\\b`, 'i').test(cleanRaw)) {
              lineMonth = mNum;
              break;
            }
          }

          for (const day of digits) {
            const dStr = `${defaultYear}-${String(lineMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            parsedItems.push({
              doctorName: currentDoc.name,
              matchedDoctorId: currentDoc.id,
              matchedDoctorName: currentDoc.name,
              startDate: dStr,
              endDate: dStr,
              type: leaveType,
              reason: raw,
              confidence: 0.95,
            });
          }
        }
      }
    }

    // ─── 3. IN-MEMORY DEDUPLICATION & VALIDATION ──────────
    const isValidDateFormat = (dStr: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return false;
      const d = new Date(dStr);
      return !isNaN(d.getTime());
    };

    const seenMap = new Map<string, ParsedLeaveItem>();
    for (const item of parsedItems) {
      if (!isValidDateFormat(item.startDate) || !isValidDateFormat(item.endDate)) {
        continue;
      }
      const docKey = item.matchedDoctorId || item.doctorName;
      const key = `${docKey}_${item.startDate}_${item.endDate}`;
      if (!seenMap.has(key)) {
        seenMap.set(key, item);
      } else {
        const existing = seenMap.get(key)!;
        if (item.reason && item.reason.length > (existing.reason?.length || 0)) {
          seenMap.set(key, item);
        }
      }
    }
    const deduplicatedItems = Array.from(seenMap.values());

    return NextResponse.json({ success: true, items: deduplicatedItems });
  } catch (error: any) {
    console.error('AI Parse Leave Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses data cuti' }, { status: 500 });
  }
}
