// ─────────────────────────────────────────────────────
// SIMED NLP Engine v3 — Multi-Intent, Multi-Entity
// Mendukung: jadwal, poli, spesialis, cuti, rekap, broadcast, list
// ─────────────────────────────────────────────────────

export type IntentType =
  | 'jadwal'          // Cari jadwal dokter tertentu
  | 'jadwal_hari_ini' // Tampilkan SEMUA jadwal hari ini
  | 'jadwal_besok'    // Tampilkan SEMUA jadwal besok
  | 'jadwal_tanggal'  // Jadwal pada tanggal spesifik
  | 'cari_dokter'     // Cari dokter by poli/spesialis/nama
  | 'cuti_dokter'     // Info dokter yang sedang cuti
  | 'rekomendasi_keluhan' // Rekomendasi berdasarkan gejala
  | 'rekap'           // Rekap harian (admin)
  | 'broadcast'       // Status WA bot (admin)
  | 'list_doctors'    // Daftar semua dokter (tanpa filter)
  | 'general'         // Perlu RAG semantic search
  | 'unknown';        // Tidak dikenali

export interface NLPResponse {
  intent: IntentType;
  entities: {
    doctorName?: string;
    specialty?: string;
    polyclinic?: string;
    symptom?: string;      // Gejala penyakit
    day?: string;          // 'hari ini' | 'besok' | hari spesifik
    dayIdx?: number;       // 0=Minggu, 1=Senin, dst
    date?: string;         // ISO date string jika tanggal spesifik
    query?: string;        // Query generik untuk pencarian fleksibel
  };
  confidence: number;      // 0-1 keyakinan intent
  normalized: string;      // Kalimat setelah normalisasi slang
}

// ─── KAMUS GEJALA KE SPESIALISASI ──────────────────────
export const SYMPTOM_MAP: Record<string, string[]> = {
  'pusing': ['saraf', 'umum'],
  'sakit kepala': ['saraf', 'umum'],
  'demam': ['umum', 'penyakit dalam'],
  'mencret': ['penyakit dalam', 'umum'],
  'diare': ['penyakit dalam'],
  'lambung': ['penyakit dalam'],
  'maag': ['penyakit dalam'],
  'hamil': ['kandungan'],
  'kandungan': ['kandungan'],
  'janin': ['kandungan'],
  'batuk': ['penyakit dalam', 'umum', 'paru'],
  'sesak': ['paru', 'penyakit dalam'],
  'gatal': ['kulit kelamin', 'kulit'],
  'jerawat': ['kulit kelamin', 'kulit'],
  'sakit gigi': ['gigi'],
  'karies': ['gigi'],
  'katarak': ['mata'],
  'rabun': ['mata'],
  'patah': ['orthopedi', 'bedah'],
  'sendi': ['orthopedi', 'saraf'],
  'tekanan darah': ['jantung', 'penyakit dalam'],
  'nyeri dada': ['jantung', 'penyakit dalam']
};

// ─── KAMUS SINONIM & NORMALISASI SLANG INDONESIA ──────
const SLANG_MAP: Record<string, string> = {
  'kis':       'bpjs',
  'kartu is':  'bpjs',
  'jkn':       'bpjs',
  'rawat':     'opname',
  'mondok':    'rawat inap',
  'sus':       'perawat',
  'suster':    'perawat',
  'sakitnya':  'penyakit',
  'njuk':      'poli',
  'poli':      'poliklinik',
  'anak':      'pediatri',
  'gigi':      'gigi',
  'dalam':     'penyakit dalam',
  'kandungan': 'kebidanan',
  'kebidanan': 'obgyn',
  'mata':      'mata',
  'bedah':     'bedah',
  'jantung':   'jantung',
  'umum':      'umum',
  'kulit':     'kulit kelamin',
  'jiwa':      'psikiatri',
  'psikolog':  'psikiatri',
  'mau berobat': 'jadwal',
  'mau periksa': 'jadwal',
  'mau kontrol': 'jadwal',
  'libre':     'gratis',
  'gratis':    'gratis',
  'libur':     'cuti',
  'liburan':   'cuti',
  'ga praktek':'cuti',
  'tidak praktek': 'cuti',
  'nggak praktek': 'cuti',
};

// ─── DAFTAR NAMA HARI ─────────────────────────────────
const DAY_MAP: Record<string, number> = {
  'minggu': 0, 'senin': 1, 'selasa': 2, 'rabu': 3,
  'kamis': 4, 'jumat': 5, 'jum\'at': 5, 'sabtu': 6,
};

// ─── DAFTAR SPESIALISASI DAN SINONIMNYA ───────────────
const SPECIALTY_ALIASES: Record<string, string[]> = {
  'umum':         ['umum', 'dokter umum', 'gp'],
  'gigi':         ['gigi', 'dental', 'dokter gigi'],
  'anak':         ['anak', 'pediatri', 'pediatrik', 'anak-anak'],
  'kandungan':    ['kandungan', 'obgyn', 'kebidanan', 'bidan', 'hamil', 'melahirkan'],
  'penyakit dalam': ['penyakit dalam', 'interne', 'dalam', 'internal'],
  'bedah':        ['bedah', 'operasi', 'bedah umum', 'surgical', 'surgeon'],
  'jantung':      ['jantung', 'cardiologi', 'kardio'],
  'mata':         ['mata', 'opthalmologi', 'kacamata', 'minus'],
  'saraf':        ['saraf', 'neurologi', 'neurolog'],
  'kulit':        ['kulit', 'kulit kelamin', 'dermatologi'],
  'jiwa':         ['jiwa', 'psikiatri', 'psikiater', 'mental', 'psikolog'],
  'paru':         ['paru', 'pernafasan', 'pulmonologi', 'sesak'],
  'orthopedi':    ['tulang', 'orthopedi', 'sendi', 'patah'],
  'THT':          ['tht', 'telinga hidung tenggorokan', 'telinga', 'hidung'],
  'urologi':      ['urologi', 'urolgi', 'ginjal', 'kencing'],
};

// ─── DAFTAR NAMA POLI (untuk pencocokan) ─────────────
const POLI_ALIASES: string[] = [
  'poli umum', 'poli anak', 'poli gigi', 'poli kandungan', 'poli dalam',
  'poli jantung', 'poli bedah', 'poli mata', 'poli saraf', 'poli kulit',
  'poli jiwa', 'poli paru', 'poli tht', 'poli urologi', 'poli orthopedi',
  'igd', 'ugd', 'instalasi gawat darurat',
];

// ─── FUNGSI NORMALISASI SLANG ─────────────────────────
function normalizeSlang(text: string): string {
  let normalized = text.toLowerCase().trim();
  for (const [slang, formal] of Object.entries(SLANG_MAP)) {
    if (normalized.includes(slang)) {
      normalized = normalized.replace(new RegExp(slang, 'gi'), formal);
    }
  }
  return normalized;
}

// ─── PARSER TANGGAL DARI TEKS ─────────────────────────
function extractDate(text: string): { day?: string; dayIdx?: number; date?: string } {
  const now = new Date();

  if (text.includes('hari ini')) {
    return { day: 'hari ini', dayIdx: now.getDay() };
  }
  if (text.includes('besok')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { day: 'besok', dayIdx: tomorrow.getDay() };
  }
  if (text.includes('lusa')) {
    const lusa = new Date(now);
    lusa.setDate(lusa.getDate() + 2);
    return { day: 'lusa', dayIdx: lusa.getDay() };
  }

  // Hari spesifik (senin, selasa, dst)
  for (const [dayName, idx] of Object.entries(DAY_MAP)) {
    if (text.includes(dayName)) {
      return { day: dayName, dayIdx: idx };
    }
  }

  // Tanggal format: "tanggal 20", "20 april", "20/04", dll
  const tanggalMatch = text.match(/(\d{1,2})[\/\-\s](\d{1,2})(?:[\/\-\s](\d{2,4}))?/)
    || text.match(/tanggal\s+(\d{1,2})/);
  if (tanggalMatch) {
    const day = parseInt(tanggalMatch[1]);
    const month = tanggalMatch[2] ? parseInt(tanggalMatch[2]) - 1 : now.getMonth();
    const year = tanggalMatch[3] ? parseInt(tanggalMatch[3]) : now.getFullYear();
    const targetDate = new Date(year, month, day);
    return {
      date: targetDate.toISOString(),
      dayIdx: targetDate.getDay(),
      day: `tanggal ${day}`
    };
  }

  return {};
}

// ─── PARSER SPESIALISASI ──────────────────────────────
function extractSpecialty(text: string): string | undefined {
  for (const [canonical, aliases] of Object.entries(SPECIALTY_ALIASES)) {
    for (const alias of aliases) {
      if (text.includes(alias)) return canonical;
    }
  }
  return undefined;
}

// ─── PARSER NAMA POLI ─────────────────────────────────
function extractPolyclinic(text: string): string | undefined {
  for (const poli of POLI_ALIASES) {
    if (text.includes(poli)) return poli;
  }
  // Deteksi pola "poli [nama]"
  const poliMatch = text.match(/poli(?:klinik)?\s+([a-zA-Z\s]+)/i);
  if (poliMatch) return `poli ${poliMatch[1].trim()}`;
  return undefined;
}

// ─── PARSER NAMA DOKTER ───────────────────────────────
function extractDoctorName(text: string): string | undefined {
  // Pola: "dr. Nama", "dokter nama", "jadwal nama"
  const patterns = [
    /(?:dr\.|dokter|spog|sp\.|dr)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
    /(?:jadwal|praktek|cari)\s+(?:dr\.?\s+)?([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter kata-kata yang bukan nama dokter
      const stopWords = ['hari', 'ini', 'besok', 'minggu', 'depan', 'libur', 'cuti', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'umum', 'gigi', 'poli'];
      const cleanName = name.split(' ').filter(w => !stopWords.includes(w.toLowerCase())).slice(0, 3).join(' ');
      if (cleanName.length > 2) return cleanName;
    }
  }
  return undefined;
}

// ─── PARSER GEJALA PENYAKIT ───────────────────────────
function extractSymptom(text: string): string | undefined {
  for (const [symptom] of Object.entries(SYMPTOM_MAP)) {
    if (text.includes(symptom)) return symptom;
  }
  return undefined;
}

// ─── MAIN INTENT PARSER ───────────────────────────────
export function parseIntent(message: string, role: 'admin' | 'public'): NLPResponse {
  const normalized = normalizeSlang(message);
  const response: NLPResponse = {
    intent: 'general',
    entities: {},
    confidence: 0.5,
    normalized,
  };

  // 1. Ekstrak Entitas Dasar
  const { day, dayIdx, date } = extractDate(normalized);
  const specialty = extractSpecialty(normalized);
  const polyclinic = extractPolyclinic(normalized);
  const doctorName = extractDoctorName(normalized);
  const symptom = extractSymptom(normalized);

  if (day) response.entities.day = day;
  if (dayIdx !== undefined) response.entities.dayIdx = dayIdx;
  if (date) response.entities.date = date;
  if (specialty) response.entities.specialty = specialty;
  if (polyclinic) response.entities.polyclinic = polyclinic;
  if (doctorName) response.entities.doctorName = doctorName;
  if (symptom) response.entities.symptom = symptom;

  // ── 0. INTENT: Rekomendasi Keluhan Medis/Symptom ──────
  if (symptom && (normalized.includes('sakit') || normalized.includes('berobat') || normalized.includes('kemana') || normalized.includes('poli apa') || normalized.includes('nyeri') || normalized.includes('pusing') || normalized.includes('sakit perut'))) {
    response.intent = 'rekomendasi_keluhan';
    response.confidence = 0.9;
    return response;
  }

  // ── 1. INTENT: Info Cuti / Dokter Tidak Praktek ───────
  if (normalized.match(/cuti|tidak praktek|ga praktek|nggak praktek|sedang libur|off praktek/)) {
    response.intent = 'cuti_dokter';
    response.confidence = 0.9;
    response.entities.doctorName = extractDoctorName(normalized);
    return response;
  }

  // ── 2. INTENT: Jadwal Hari Ini (Semua dokter, tanpa nama) ─
  if (normalized.match(/jadwal hari ini|praktek hari ini|dokter hari ini|siapa yang praktek hari ini|ada dokter hari ini/)) {
    response.intent = 'jadwal_hari_ini';
    response.confidence = 0.95;
    return response;
  }

  // ── 3. INTENT: Jadwal Besok / Hari Tertentu (Semua dokter) ─
  if (normalized.match(/jadwal besok|praktek besok|dokter besok|jadwal (senin|selasa|rabu|kamis|jumat|sabtu|minggu)/) && !extractDoctorName(normalized)) {
    const dateInfo = extractDate(normalized);
    response.intent = 'jadwal_besok';
    response.confidence = 0.9;
    response.entities = { ...response.entities, ...dateInfo };
    if (dateInfo.dayIdx !== undefined && dateInfo.day !== 'besok') {
      response.intent = 'jadwal_tanggal';
    }
    return response;
  }

  // ── 4. INTENT: Cari Dokter by Poli / Spesialis (tanpa nama) ─
  if ((specialty || polyclinic) && !normalized.match(/jadwal .{3,} hari|jadwal .{3,} besok/)) {
    const hasDoctorName = extractDoctorName(normalized);
    if (!hasDoctorName || normalized.match(/(?:ada|ada dokter|cari|siapa|dokter apa)/)) {
      response.intent = 'cari_dokter';
      response.confidence = 0.85;
      response.entities.specialty = specialty;
      response.entities.polyclinic = polyclinic;
      response.entities.query = message;
      return response;
    }
  }

  // ── 5. INTENT: Jadwal Dokter Spesifik (ada nama + jadwal) ─
  if (normalized.match(/jadwal|praktek|jam buka|hari apa|kapan praktek/)) {
    const doctorName = extractDoctorName(normalized);
    const dateInfo = extractDate(normalized);

    response.intent = 'jadwal';
    response.confidence = 0.8;
    response.entities.doctorName = doctorName;
    response.entities.specialty = specialty;
    response.entities.polyclinic = polyclinic;
    response.entities = { ...response.entities, ...dateInfo };

    // Intent spesifik jika ada tanggal
    if (dateInfo.date) response.intent = 'jadwal_tanggal';
    return response;
  }

  // ── 6. INTENT: Rekap Harian (Admin Only) ─────────────
  if (role === 'admin' && normalized.match(/rekap|anomali|sep|kunjungan|pasien/)) {
    response.intent = 'rekap';
    response.confidence = 0.9;
    const dateInfo = extractDate(normalized);
    response.entities = { ...response.entities, ...dateInfo };
    return response;
  }

  // ── 7. INTENT: Status WA Bot (Admin Only) ────────────
  if (role === 'admin' && normalized.match(/bot|wa|whatsapp|pesan|broadcast|kirim/)) {
    response.intent = 'broadcast';
    response.confidence = 0.9;
    return response;
  }

  // ── 8. INTENT: Daftar Semua Dokter ───────────────────
  if (normalized.match(/daftar dokter|semua dokter|list dokter|ada dokter apa saja|dokter siapa saja/)) {
    response.intent = 'list_doctors';
    response.confidence = 0.85;
    return response;
  }

  // ── 9. Fallback ke general (RAG) ─────────────────────
  response.intent = 'general';
  response.confidence = 0.3;
  return response;
}
