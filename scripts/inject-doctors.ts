import { PrismaClient, DoctorStatus, LeaveType } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DOCTORS_DATA = [
  {
    "nama_dpjp": "dr. Pritasari Dewi Damayanti, Sp. OG",
    "jadwal": [
      { "hari": "Senin", "waktu": "15.05 – 17.00 WIB" },
      { "hari": "Selasa", "waktu": "15.05 – 17.00 WIB" },
      { "hari": "Kamis", "waktu": "15.05 – 17.00 WIB" },
      { "hari": "Jum’at", "waktu": "15.05 – 17.00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Ardian Rahmasyah, Sp.OG",
    "jadwal": [
      { "hari": "Senin", "waktu": "17.00 - 23:00 WIB" },
      { "hari": "Rabu", "waktu": "17.00 - 23:00 WIB" },
      { "hari": "Jum’at", "waktu": "17.00 - 23:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Gatot Hananta Sholihin, Sp.OG",
    "jadwal": [
      { "hari": "Selasa", "waktu": "10.00 -12.00 WIB" },
      { "hari": "Kamis", "waktu": "10.00 -12.00 WIB" },
      { "hari": "Sabtu", "waktu": "10.00 -12.00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Hepta Lidia, Sp. OG",
    "jadwal": [
      { "hari": "Senin", "waktu": "10.00-12.00 WIB" },
      { "hari": "Rabu", "waktu": "10.00-12.00 WIB" },
      { "hari": "Jum’at", "waktu": "10.00-12.00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. RR. Irma Rosyana Lestyowati, Sp.A",
    "jadwal": [
      { "hari": "Senin", "waktu": "08:30 - 14:00 WIB" },
      { "hari": "Selasa", "waktu": "08:30 - 14:00 WIB" },
      { "hari": "Rabu", "waktu": "08:30 - 14:00 WIB" },
      { "hari": "Kamis", "waktu": "08:30 - 14:00 WIB" },
      { "hari": "Jum’at", "waktu": "08:30 - 14:00 WIB" },
      { "hari": "Sabtu", "waktu": "08:30 - 14:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr.Annisa Noor Anindyasari, Sp.A",
    "jadwal": [
      { "hari": "Senin", "waktu": "15:00 - 18:00 WIB" },
      { "hari": "Selasa", "waktu": "15:00 - 18:00 WIB" },
      { "hari": "Rabu", "waktu": "15:00 - 18:00 WIB" },
      { "hari": "Kamis", "waktu": "15:00 - 18:00 WIB" },
      { "hari": "Jum’at", "waktu": "15.00 - 18:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Endro RI Wibowo, Sp.B., Msi.Med",
    "jadwal": [
      { "hari": "Senin", "waktu": "06:00 - 07:30 WIB dan 14.00 – 17.00WIB" },
      { "hari": "Selasa", "waktu": "06:00 - 07:30 WIB dan 14.00 – 17.00 WIB" },
      { "hari": "Rabu", "waktu": "06:00 - 07:30 WIB dan 14.00 – 17.00 WIB" },
      { "hari": "Kamis", "waktu": "06:00 - 07:30 WIB dan 14.00 – 17.00 WIB" },
      { "hari": "Jum’at", "waktu": "06:00 - 07:30 WIB dan 13.00 – 17.00 WIB" },
      { "hari": "Sabtu", "waktu": "06:00 - 07:30 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Sigit Purnomohadi. Sp.PD",
    "jadwal": [
      { "hari": "Selasa", "waktu": "14:30 - 17:00 WIB" },
      { "hari": "Jumat", "waktu": "13:30 - 16:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Leo Chandra Wisnu Pandu Winata, Sp.PD",
    "jadwal": [
      { "hari": "Senin", "waktu": "09:00 - 14.00 WIB dan 18.00 – 20.00WIB" },
      { "hari": "Selasa", "waktu": "09:00 - 14.00 WIB dan 18.00 – 20.00WIB" },
      { "hari": "Rabu", "waktu": "09:00 - 14.00 WIB dan 18.00 – 20.00WIB" },
      { "hari": "Kamis", "waktu": "09:00 - 14.00 WIB dan 18.00 – 21.00WIB" },
      { "hari": "Jum’at", "waktu": "09:00 - 14.00 WIB" },
      { "hari": "Sabtu", "waktu": "09:00 - 14.00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Sasongko Hadipurnomo, Sp. PD (Jadwal kunjungan HD)",
    "jadwal": [
      { "hari": "Senin", "waktu": "15:30 - 17:30 WIB" },
      { "hari": "Selasa", "waktu": "15:30 - 17:30 WIB" },
      { "hari": "Rabu", "waktu": "15:30 - 17:30 WIB" },
      { "hari": "Kamis", "waktu": "13:00 - 15:00 WIB" },
      { "hari": "Jum’at", "waktu": "13:00 - 15:00 WIB" },
      { "hari": "Sabtu", "waktu": "13:00 - 15:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Setyo Dirahayu, Sp.N.,MD., CIPS",
    "jadwal": [
      { "hari": "Selasa", "waktu": "14:25 - 15:55 WIB" },
      { "hari": "Rabu", "waktu": "14:25 - 15:55 WIB" },
      { "hari": "Sabtu", "waktu": "14:25 - 16.00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Ajeng Putri Tunjungsari, Sp.N",
    "jadwal": [
      { "hari": "Senin", "waktu": "15:00 - 18:00 WIB" },
      { "hari": "Kamis", "waktu": "13.30 - 18.00 WIB" },
      { "hari": "Jum’at", "waktu": "14:00 -15:30 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Ahmad Tanji.Sp.S",
    "jadwal": [
      { "hari": "Senin", "waktu": "06.00 – 07.30 WIB" },
      { "hari": "Rabu", "waktu": "07:30 - 09:29 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Wahyu Dwi Kusdaryanto, Sp.THT-KL",
    "jadwal": [
      { "hari": "Kamis", "waktu": "16:00 - 21:00 WIB" },
      { "hari": "Sabtu", "waktu": "15:00 - 17:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr.Lirans Tia Kusuma, Sp.THT-KL",
    "jadwal": [
      { "hari": "Senin", "waktu": "14:00 - 18:00 WIB" },
      { "hari": "Selasa", "waktu": "08:00 - 12:00 WIB" },
      { "hari": "Rabu", "waktu": "14:00 - 18:00 WIB" },
      { "hari": "Kamis", "waktu": "08:00 - 12:00 WIB" },
      { "hari": "Jum’at", "waktu": "13:00 - 15:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Eko Subekti, Sp.U",
    "jadwal": [
      { "hari": "Senin", "waktu": "18:00 - 21:00 WIB" },
      { "hari": "Rabu", "waktu": "18:00 - 21:00 WIB" },
      { "hari": "Jum’at", "waktu": "18:00 - 22:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Muhammad Luthfi Muammar, Sp.OT",
    "jadwal": [
      { "hari": "Senin", "waktu": "11:00 - 14:30 WIB" },
      { "hari": "Selasa", "waktu": "11:00 - 14:30 WIB" },
      { "hari": "Rabu", "waktu": "07:00 - 08:00 WIB (Khusus operasi)" },
      { "hari": "Kamis", "waktu": "11:00 - 14:30 WIB" },
      { "hari": "Jum’at", "waktu": "11:00 -14:30 WIB" },
      { "hari": "Sabtu", "waktu": "11:00 -14:30 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Oke Viska, Sp.P",
    "jadwal": [
      { "hari": "Senin", "waktu": "13:00 - 15:00 WIB" },
      { "hari": "Selasa", "waktu": "13:00 - 15:00 WIB" },
      { "hari": "Rabu", "waktu": "13:00 - 15:00 WIB" },
      { "hari": "Kamis", "waktu": "13:00 - 15:00 WIB" },
      { "hari": "Jum’at", "waktu": "10:00 - 12:00 WIB" },
      { "hari": "Sabtu", "waktu": "13:00 - 15:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Nanda Notario Besri, Sp.OT",
    "jadwal": [
      { "hari": "Senin", "waktu": "08:00 - 10:30 WIB" },
      { "hari": "Rabu", "waktu": "08:00 - 09:30 WIB" },
      { "hari": "Sabtu", "waktu": "08:00 - 10:30 WIB" }
    ]
  },
  {
    "nama_dpjp": "drg. Robby Ramadhonie Sundaragaza, Sp.BMM",
    "jadwal": [
      { "hari": "Selasa", "waktu": "08:00 - 12:00 WIB" },
      { "hari": "Jum’at", "waktu": "14:05 - 17:00 WIB" },
      { "hari": "Sabtu", "waktu": "15:00 - 18:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Lita Hati Dwi Purnami Effendi, Sp.JP",
    "jadwal": [
      { "hari": "Selasa", "waktu": "14.30 - 18.00 WIB" },
      { "hari": "Kamis", "waktu": "14.30 - 18.00 WIB" },
      { "hari": "Sabtu", "waktu": "08.00 - 14.00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Nova Kurniasari, Sp. Kj",
    "jadwal": [
      { "hari": "Senin", "waktu": "07:30 - 09:15 WIB" },
      { "hari": "Selasa", "waktu": "07:30 - 09:15 WIB" },
      { "hari": "Rabu", "waktu": "07:30 - 09:15 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Taufik Hidayanto, Sp.KJ",
    "jadwal": [
      { "hari": "Senin", "waktu": "15:15 - 20:15 WIB" },
      { "hari": "Selasa", "waktu": "15:15 - 20:15 WIB" },
      { "hari": "Kamis", "waktu": "15:15 - 20:15 WIB" },
      { "hari": "Jum’at", "waktu": "14:45 - 19:30 WIB" }
    ]
  },
  {
    "nama_dpjp": "drg. Dyah Tri Kusumawati, Sp.KG",
    "jadwal": [
      { "hari": "Rabu", "waktu": "17:00 - 20:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Wahid Heru Widodo, Sp.M",
    "jadwal": [
      { "hari": "Senin", "waktu": "07:00 - 08:00 WIB (Khusus PACHO)" },
      { "hari": "Selasa", "waktu": "07:00 - 12:00 WIB" },
      { "hari": "Rabu", "waktu": "07:00 - 12:00 WIB" },
      { "hari": "Kamis", "waktu": "07:00 - 12:00 WIB" },
      { "hari": "Jum’at", "waktu": "07:00 - 08:00 WIB (Khusus operasi)" }
    ]
  },
  {
    "nama_dpjp": "dr. Wati, Sp.KFR",
    "jadwal": [
      { "hari": "Senin", "waktu": "11:30 - 14:00 WIB" },
      { "hari": "Selasa", "waktu": "12:15 - 14:00 WIB" },
      { "hari": "Rabu", "waktu": "11:30 - 14:00 WIB" },
      { "hari": "Kamis", "waktu": "11:30 - 14:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr.Wiharesi Putri Sukaesi, Sp.Rad",
    "jadwal": [
      { "hari": "Senin", "waktu": "08:00 - 12:00 WIB" },
      { "hari": "Selasa", "waktu": "08:00 - 12:00 WIB" },
      { "hari": "Rabu", "waktu": "08:00 - 12:00 WIB" },
      { "hari": "Kamis", "waktu": "08:00 - 12:00 WIB" },
      { "hari": "Jum’at", "waktu": "08:00 - 12:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr Ali Ashari, Sp.Rad",
    "jadwal": [
      { "hari": "Senin", "waktu": "13:00 - 17:00 WIB" },
      { "hari": "Selasa", "waktu": "13:00 - 17:00 WIB" },
      { "hari": "Rabu", "waktu": "13:00 - 17:00 WIB" },
      { "hari": "Kamis", "waktu": "13:00 - 17:00 WIB" },
      { "hari": "Jum’at", "waktu": "13:00 - 17:00 WIB" },
      { "hari": "Sabtu", "waktu": "13:00 - 17:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Ira Citra Ningrom, Sp.PA",
    "jadwal": [
      { "hari": "Senin", "waktu": "14:00 - 18:00 WIB" },
      { "hari": "Rabu", "waktu": "14:00 - 18:00 WIB" },
      { "hari": "Jum’at", "waktu": "14:00 - 18:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "dr. Inge Kusumaningdiyah, Sp.PK",
    "jadwal": [
      { "hari": "Jum’at", "waktu": "18:00 - 23:00 WIB" },
      { "hari": "Sabtu", "waktu": "08:00 - 17:00 WIB" }
    ]
  },
  {
    "nama_dpjp": "Dr. Fajar, Sp.U",
    "jadwal": [
      { "hari": "Selasa", "waktu": "19:00 - 21:00 WIB" },
      { "hari": "Kamis", "waktu": "19:00 - 21:00 WIB" },
      { "hari": "Sabtu", "waktu": "12:00 - 15:00 WIB" }
    ]
  }
];

const LEAVES_DATA = [
  {
    "nama_dpjp": "dr.Annisa Noor Anindyasari, Sp.A",
    "tanggal_libur": ["2026-03-23"],
    "keterangan": "Libur"
  },
  {
    "nama_dpjp": "dr. Pritasari Dewi Damayanti, Sp. OG",
    "tanggal_libur": ["2026-03-23"],
    "keterangan": "Cuti Lebaran"
  },
  {
    "nama_dpjp": "dr. Ardian Rahmasyah, Sp.OG",
    "tanggal_libur": ["2026-03-23"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr.Lirans Tia Kusuma, Sp.THT-KL",
    "tanggal_libur": ["2026-03-23", "2026-03-24", "2026-03-25"],
    "keterangan": "Cuti"
  },
  {
    "nama_dpjp": "dr. Taufik Hidayanto, Sp.KJ",
    "tanggal_libur": ["2026-03-23"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Nova Kurniasari, Sp. Kj",
    "tanggal_libur": ["2026-03-23", "2026-03-25"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "Dr. Fajar, Sp.U",
    "tanggal_libur": ["2026-03-23", "2026-03-24"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Ajeng Putri Tunjungsari, Sp.N",
    "tanggal_libur": ["2026-03-23"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Ahmad Tanji.Sp.S",
    "tanggal_libur": ["2026-03-23", "2026-03-24", "2026-03-25"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Endro RI Wibowo, Sp.B., Msi.Med",
    "tanggal_libur": ["2026-03-23"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Wahid Heru Widodo, Sp.M",
    "tanggal_libur": ["2026-03-23", "2026-03-24"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Nanda Notario Besri, Sp.OT",
    "tanggal_libur": ["2026-03-23", "2026-03-24"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Muhammad Luthfi Muammar, Sp.OT",
    "tanggal_libur": ["2026-03-25", "2026-03-26", "2026-03-27", "2026-03-28", "2026-03-29"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Wati, Sp.KFR",
    "tanggal_libur": ["2026-03-23", "2026-03-24", "2026-03-25"],
    "keterangan": "Libur Lebaran"
  },
  {
    "nama_dpjp": "dr. Ira Citra Ningrom, Sp.PA",
    "tanggal_libur": ["2026-03-23", "2026-03-24", "2026-03-25"],
    "keterangan": "Libur Lebaran (Pengganti dr Arlene Sp.PA)"
  },
  {
    "nama_dpjp": "Siti K (Psikologi)",
    "tanggal_libur": ["2026-03-23", "2026-03-24"],
    "keterangan": "Libur Lebaran"
  }
];

// Project Specific Mapping (0=Senin, ..., 6=Minggu)
const DAYS_MAP: { [key: string]: number } = {
  "Senin": 0,
  "Selasa": 1,
  "Rabu": 2,
  "Kamis": 3,
  "Jumat": 4,
  "Jum'at": 4,
  "Jum’at": 4,
  "Sabtu": 5,
  "Minggu": 6
};

function parseTime(timeStr: string) {
  const clean = timeStr.replace('WIB', '').trim();
  const parts = clean.split(/[–\-]/);
  if (parts.length < 2) return null;
  
  const start = parts[0].trim().replace('.', ':');
  const end = parts[1].trim().split(' ')[0].replace('.', ':');
  
  const format = (t: string) => {
    let [h, m] = t.split(':');
    if (!m) m = '00';
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const startTime = format(start);
  const endTime = format(end);

  let [h, m] = startTime.split(':').map(Number);
  h = (h - 1 + 24) % 24;
  const registrationTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return { startTime, endTime, registrationTime };
}

function getSpecialty(name: string) {
  if (name.includes('Sp. OG')) return 'Obstetri & Ginekologi';
  if (name.includes('Sp.A')) return 'Anak';
  if (name.includes('Sp.B')) return 'Bedah Umum';
  if (name.includes('Sp.PD')) return 'Penyakit Dalam';
  if (name.includes('Sp.N') || name.includes('Sp.S')) return 'Saraf';
  if (name.includes('Sp.THT-KL')) return 'THT-KL';
  if (name.includes('Sp.U')) return 'Urologi';
  if (name.includes('Sp.OT')) return 'Orthopaedi';
  if (name.includes('Sp.P')) return 'Paru';
  if (name.includes('Sp.BMM')) return 'Bedah Mulut';
  if (name.includes('Sp.JP')) return 'Jantung';
  if (name.includes('Sp.Kj') || name.includes('Sp.KJ')) return 'Jiwa';
  if (name.includes('Sp.KG')) return 'Konservasi Gigi';
  if (name.includes('Sp.M')) return 'Mata';
  if (name.includes('Sp.KFR')) return 'Rehab Medik';
  if (name.includes('Sp.Rad')) return 'Radiologi';
  if (name.includes('Sp.PA')) return 'Patologi Anatomi';
  if (name.includes('Sp.PK')) return 'Patologi Klinik';
  if (name.includes('Psikologi')) return 'Psikologi';
  return 'Umum';
}

function getCategory(name: string) {
  const specialty = getSpecialty(name);
  const bedahKeywords = ['Bedah', 'Orthopaedi', 'Urologi', 'Ginekologi', 'THT', 'Mata'];
  if (bedahKeywords.some(k => specialty.includes(k))) return 'Bedah';
  return 'NonBedah';
}

function getQueueCodePrefix(name: string) {
  if (name.includes('Sp. OG')) return 'K';
  if (name.includes('Sp.A')) return 'A';
  if (name.includes('Sp.B')) return 'B';
  if (name.includes('Sp.PD')) return 'D';
  if (name.includes('Sp.N') || name.includes('Sp.S')) return 'S';
  if (name.includes('Sp.THT-KL')) return 'T';
  if (name.includes('Sp.U')) return 'U';
  if (name.includes('Sp.OT')) return 'O';
  if (name.includes('Sp.P')) return 'P';
  if (name.includes('Sp.BMM')) return 'M';
  if (name.includes('Sp.JP')) return 'H';
  if (name.includes('Sp.Kj') || name.includes('Sp.KJ')) return 'J';
  if (name.includes('Sp.M')) return 'M';
  if (name.includes('Sp.KFR')) return 'RM';
  return 'X';
}

async function main() {
  console.log('--- CLEANING EXISTING DATA ---');
  await prisma.shift.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.doctor.deleteMany({});

  console.log('--- INJECTING DOCTORS AND SHIFTS ---');
  let doctorCount = 0;
  let shiftCount = 0;

  for (const docData of DOCTORS_DATA) {
    const timeInfo = parseTime(docData.jadwal[0].waktu);
    if (!timeInfo) continue;

    const { startTime, endTime, registrationTime } = timeInfo;
    const category = getCategory(docData.nama_dpjp);
    const specialty = getSpecialty(docData.nama_dpjp);
    const docName = docData.nama_dpjp;
    
    const doctor = await prisma.doctor.create({
      data: {
        name: docName,
        specialty: specialty,
        category: category,
        status: DoctorStatus.BUKA,
        startTime: startTime,
        endTime: endTime,
        queueCode: `${getQueueCodePrefix(docName)}P`,
        registrationTime: registrationTime,
        order: doctorCount++
      }
    });

    for (const j of docData.jadwal) {
      const dayIdx = DAYS_MAP[j.hari];
      if (dayIdx === undefined) continue;

      const parts = j.waktu.split('dan');
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        const parsed = parseTime(p);
        if (!parsed) continue;

        await prisma.shift.create({
          data: {
            dayIdx: dayIdx,
            timeIdx: i,
            title: specialty,
            color: category === 'Bedah' ? 'blue' : 'emerald',
            formattedTime: `${parsed.startTime}-${parsed.endTime}`,
            registrationTime: parsed.registrationTime,
            extra: p.includes('(') ? p.substring(p.indexOf('(')) : null,
            doctorId: doctor.id
          }
        });
        shiftCount++;
      }
    }
  }

  console.log('--- INJECTING LEAVES ---');
  let leaveCount = 0;
  for (const leave of LEAVES_DATA) {
    const doctor = await prisma.doctor.findFirst({
      where: { name: { contains: leave.nama_dpjp.split(',')[0].trim() } }
    });

    if (!doctor) continue;

    for (const dateStr of leave.tanggal_libur) {
      const date = new Date(dateStr);
      await prisma.leaveRequest.create({
        data: {
          doctorId: doctor.id,
          type: LeaveType.Liburan,
          startDate: date,
          endDate: date,
          reason: leave.keterangan,
          status: 'Approved'
        }
      });
      leaveCount++;
    }
  }

  console.log(`Successfully injected ${doctorCount} doctors, ${shiftCount} shifts, and ${leaveCount} leaves with CORRECT day mapping (Mon=0).`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
