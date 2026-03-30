import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const leavesData = [
  // RM
  { name: 'Wati', dateStr: '2026-03-31', reason: 'Acara Keluarga Urgent', type: 'Pribadi' },
  // Anak
  { name: 'Irma', dateStr: '2026-04-03', reason: 'Tanggal Merah', type: 'Liburan' },
  { name: 'Irma', dateStr: '2026-04-04', reason: 'Cuti', type: 'Pribadi' },
  // Obgyn
  { name: 'Ardian', dateStr: '2026-04-03', reason: 'Manasik ke Jakarta', type: 'Pribadi' },
  { name: 'Ardian', dateStr: '2026-04-28', reason: 'PIT ke Jakarta', type: 'Konferensi' },
  { name: 'Ardian', dateStr: '2026-04-29', reason: 'PIT ke Jakarta', type: 'Konferensi' },
  // Dalam
  { name: 'Sigit', dateStr: '2026-04-03', reason: 'Tanggal Merah', type: 'Liburan' },
  { name: 'Leo', dateStr: '2026-04-18', reason: 'Libur - Seminar', type: 'Konferensi' },
  // Jiwa
  { name: 'Taufik', dateStr: '2026-04-03', reason: 'Tanggal Merah', type: 'Liburan' },
  // Urologi
  { name: 'Eko', dateStr: '2026-04-03', reason: 'Tanggal Merah', type: 'Liburan' },
  // Saraf
  { name: 'Ajeng', dateStr: '2026-04-02', reason: 'Cuti', type: 'Pribadi' },
  { name: 'Ajeng', dateStr: '2026-04-03', reason: 'Tanggal Merah', type: 'Pribadi' },
  { name: 'Ajeng', dateStr: '2026-04-06', reason: 'Cuti', type: 'Pribadi' },
  { name: 'Setyo', dateStr: '2026-04-02', reason: 'Pembicara Seminar', type: 'Konferensi' },
  { name: 'Setyo', dateStr: '2026-04-28', reason: 'Pembicara Seminar', type: 'Konferensi' },
  { name: 'Setyo', dateStr: '2026-04-29', reason: 'Pembicara Seminar', type: 'Konferensi' },
  // Bedah
  { name: 'Endro', dateStr: '2026-04-03', reason: 'Libur', type: 'Liburan' },
  // Paru
  { name: 'Oke', dateStr: '2026-04-04', reason: 'Cuti', type: 'Pribadi' }
];

async function main() {
  console.log('Clearing old specific leave injections for April/March...');
  
  // Try to find the doctors
  for (const l of leavesData) {
    const doc = await prisma.doctor.findFirst({
      where: {
        name: { contains: l.name }
      }
    });

    if (!doc) {
      console.log('⚠️ Dokter dengan nama ' + l.name + ' tidak ditemukan dipencarian. Cuti dilewati.');
      continue;
    }

    const start = new Date(l.dateStr + 'T00:00:00+07:00');
    const end = new Date(l.dateStr + 'T23:59:59+07:00');

    // Hapus bentrok yang sama
    await prisma.leaveRequest.deleteMany({
      where: {
        doctorId: doc.id,
        startDate: {
           gte: new Date(l.dateStr + 'T00:00:00Z'),
           lt: new Date(l.dateStr + 'T23:59:59Z')
        }
      }
    }).catch(() => {}); // ignore error

    await prisma.leaveRequest.create({
      data: {
        doctorId: doc.id,
        specialty: doc.specialty,
        type: l.type as any,
        startDate: start,
        endDate: end,
        reason: l.reason,
        status: 'Disetujui',
      }
    });

    console.log('✅ Cuti disuntikkan: ' + doc.name + ' -> ' + l.dateStr + ' (' + l.reason + ')');
  }

  console.log('⚡ All leaves injected successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
