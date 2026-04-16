import { prisma } from '../src/lib/prisma';
import { generateEmbedding } from '../src/lib/vector-store';

const csInputs = [
  // ── KONTEKS UNTUK PASIEN / PUBLIK ──
  {
    category: 'Umum',
    title: 'Customer Service: Cara Berbicara dengan Staff Manusia (Live Agent)',
    content: 'RS MedCore menyediakan layanan operasional langsung (Live Agent) bagi pasien yang kebingungan dengan sistem otomatis bot. Silakan ketik "bicara dengan CS" atau "hubungi perawat". Layanan respon manusia tersedia pada jam kerja kantor: Senin-Jumat pukul 08.00 WIB hingga 16.00 WIB.',
    tags: ['cs', 'costumer service', 'manusia', 'agen', 'staf', 'bantuan']
  },
  {
    category: 'Umum',
    title: 'Customer Service: Layanan Pengaduan & Komplain Kekurangan Layanan',
    content: 'Kami sangat menghargai suara Anda demi perbaikan rumah sakit. Apabila Anda mengalami kendala pelayanan, staf kurang ramah, atau masalah tagihan, silakan ajukan komplain Anda ke Pihak Manajemen RS melalui Layanan Aduan Halo MedCore di WhatsApp (pilih menu Komplain) atau email pengaduan@medcore.com.',
    tags: ['komplain', 'marah', 'aduan', 'pengaduan', 'layanan buruk']
  },
  {
    category: 'Rawat Inap',
    title: 'Estimasi Tarif & Biaya Kamar Rawat Inap (Umum & Asuransi)',
    content: 'Informasi perkiraan tarif harian kamar tipe asuransi umum mandiri RS MedCore: Kelas 3 (Rp 200.000/hari), Kelas 2 (Rp 350.000/hari), Kelas 1 (Rp 550.000/hari), VIP (Rp 1.250.000/hari) dan VVIP (Rp 2.000.000/hari). Khusus pasien BPJS, ruangan ditentukan berdasarkan kelas jaminan yang terdaftar, tanpa ada selisih biaya selama tidak naik kelas inap.',
    tags: ['biaya', 'tarif', 'harga kamar', 'vip', 'kelas']
  },

  // ── KONTEKS UNTUK ADMIN / STAF INTERNAL ──
  {
    category: 'Umum',
    title: 'INFO ADMIN CS: Menangani Pasien Sensitif atau Marah via Bot',
    content: 'Bagi Admin, apabila mendeteksi chat di Dashboard WA dari pasien bersentimen negatif/marah. Tindakan yang harus diambil: Segera "Ambil Alih Obrolan (Takeover)". Jangan membalas dengan kalimat tempel (template). Sapa dengan nama pasien dan minta maaf atas ketidaknyamanan, kemudian selesaikan masalah secara personal.',
    tags: ['admin', 'sop cs', 'pasien marah', 'takeover bot']
  },
  {
    category: 'Pendaftaran',
    title: 'INFO ADMIN: Prosedur Pasien VIP & Fast Track Eksekutif',
    content: 'Ketika Anda bertugas sebagai Front Office/CS, jika yang datang adalah pasien prioritas (Lansia > 65 tahun, Disabilitas, MCU Eksekutif), Anda wajib mengaktifkan toggle "VIP/Prioritas" di pendaftaran. Jangan buat mereka menunggu di antrean reguler poli. Arahkan ke ruang tunggu karpet biru.',
    tags: ['admin', 'sop prioritas', 'vip', 'karyawan', 'front office']
  },
  {
    category: 'Umum',
    title: 'INFO ADMIN IT: Panduan Jika Terjadi Error / Server Down',
    content: 'Apabila sistem SIMED mengalami blank putih, tidak bisa cetak antrean printer, atau gagal respon dari Bot Server AI. Langkah pertama komandan admin: Jangan panik. Buka halaman pengaturan, cek status PM2 dari menu server log. Apabila macet, kirim laporan darurat ke tim IT Infrastruktur di ekstensi telepon 999.',
    tags: ['admin', 'error', 'server down', 'sistem rusak', 'it']
  }
];

async function seedCSKnowledge() {
  console.log("Memulai injeksi data Customer Service Profile...");
  for (const item of csInputs) {
    try {
      console.log(`Generating embedding for: "${item.title}"...`);
      const textToEmbed = `${item.title}\n\n${item.content}\nTags: ${item.tags.join(', ')}`;
      const embedding = await generateEmbedding(textToEmbed);
      
      await prisma.knowledgeBase.create({
        data: {
          title: item.title,
          content: item.content,
          tags: item.tags,
          category: item.category,
          embedding: JSON.stringify(embedding),
          isActive: true
        }
      });
      console.log(`✅ Sukses injeksi CS: ${item.title}`);
    } catch (err) {
      console.error(`❌ Gagal: ${item.title}`, err);
    }
  }
  console.log("\nSelesai Data CS Admin/Public!");
}

seedCSKnowledge().catch(console.error).finally(() => prisma.$disconnect());
