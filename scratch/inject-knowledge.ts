import { prisma } from '../src/lib/prisma';
import { generateEmbedding } from '../src/lib/vector-store';

const newInputs = [
  {
    category: 'Fasilitas',
    title: 'Fasilitas Penunjang Medis dan IGD 24 Jam',
    content: 'Instalasi Gawat Darurat (IGD) RS Medcore beroperasi penuh 24 jam dengan sistem triase modern. Dilengkapi dengan ruang isolasi bertekanan negatif, resusitasi, bedah minor, dan tenaga spesialis emergensi bersertifikat ATLS/ACLS. Pasien kategori "merah" (ancaman nyawa) otomatis ditangani langsung (zero-delay) tanpa proses pendaftaran di awal.',
    tags: ['igd', 'fasilitas', 'gawat darurat', 'ugd', '24 jam', 'darurat']
  },
  {
    category: 'Farmasi',
    title: 'Alur Pengambilan Obat dan Elektronik Resep',
    content: 'RS kami sudah menggunakan sistem Electronic Medical Record (EMR). Resep dari dokter otomatis terkirim ke Instalasi Farmasi. Pasien tinggal duduk menunggu panggilan nomor antrean farmasi. Disediakan juga layanan "Jalur Prioritas (Fast Track)" bagi Pasien Lansia, anak demam tinggi, atau difabel untuk pengambilan obat tanpa antre lama.',
    tags: ['obat', 'farmasi', 'resep', 'apotek', 'prioritas', 'lansia']
  },
  {
    category: 'BPJS',
    title: 'Syarat & Alur Layanan BPJS Kesehatan / JKN KIS',
    content: 'Syarat berobat menggunakan BPJS Kesehatan: Membawa rujukan asli dari faskes tingkat 1 (Puskesmas/Klinik pratama) yang masih berlaku (kadaluarsa 3 bulan), kartu BPJS Asli / aplikasi Mobile JKN, dan e-KTP. Catatan PENTING: Penggunaan layanan IGD bagi pasien BPJS tanpa rujukan HANYA berlaku untuk kasus gawat darurat medis sesuai kriteria kemenkes.',
    tags: ['bpjs', 'gratis', 'jkn', 'kis', 'rujukan', 'syarat bpjs']
  },
  {
    category: 'Rawat Inap',
    title: 'Peraturan Besuk dan Pencegahan Infeksi Rumah Sakit',
    content: 'Demi percepatan fase pemulihan pasien dan mengendalikan Infeksi Nosokomial (HAIs), aturan jam besuk dibagi menjadi Siang (11.00 - 13.00) dan Sore (17.00 - 19.30). Aturan ketat berlaku: anak sehat dengan usia di bawah 12 tahun tidak direkomendasikan memasuki area rawat inap dewasa. Pengunjung diwajibkan cuci tangan berbasis alkohol sebelum dan sesudah kontak.',
    tags: ['besuk', 'rawat inap', 'jam besuk', 'pengunjung', 'anak', 'infeksi']
  },
  {
    category: 'Triage',
    title: 'Klasifikasi Triase IGD Berdasarkan Kedaruratan (ATS)',
    content: 'RS MedCore mengacu pada standar Australasian Triage Scale (ATS). Level 1 (Merah/Prioritas Absolut): Kasus henti jantung/napas. Level 2 (Oranye): Gawat darurat harus ditangani dalam 10 menit. Level 3 (Kuning): Mendesak dalam 30 menit. Bagi pasien Level 4 (Hijau) & 5 (Biru) yang bukan gawat darurat, tim akan menempatkan di zona tunggu atau mengarahkan ke Poliklinik.',
    tags: ['triase', 'triage', 'merah', 'kuning', 'hijau', 'igd', 'prioritas']
  },
  {
    category: 'Umum',
    title: 'Layanan Medical Check Up (MCU) Eksekutif',
    content: 'Layanan MCU dirancang secara holistik meliputi rekam jantung (Treadmill EKG), Radiologi digital X-Ray, Lab Patologi Klinik, USG Abdomen, dan Konsultasi Gizi. Proses berkonsep One Stop Service di ruangan khusus Executive Lounge, yang memisahkan peserta MCU dari keramaian pasien reguler poliklinik.',
    tags: ['mcu', 'medical check up', 'cek kesehatan', 'eksekutif', 'holistik', 'darah']
  },
  {
    category: 'Pendaftaran',
    title: 'Pendaftaran Poliklinik via WhatsApp & Real-Time Tracking',
    content: 'Mendaftar poli kini 100% online. Ketik "daftar" di WhatsApp resmi kami. Pasien tidak perlu berkerumun di ruang tunggu; sistem akan mengirim pesan peringatan "Panggilan Mendekati" via WhatsApp ketika sisa antrean menyisakan 3 pasien sebelum giliran Anda tiba.',
    tags: ['daftar', 'whatsapp', 'bot', 'antrean', 'online', 'tracking']
  },
  {
    category: 'Farmasi',
    title: 'Layanan Ekspedisi Pengiriman Obat ke Rumah',
    content: 'Bagi pasien penyakit kronis yang tidak ingin mengantre obat (polypharmacy), RS MedCore bekerja sama dengan kurir medis penyedia tas termal (mengatur suhu ruang) untuk mengirimkan resep obat langsug ke depan pintu rumah Anda di wilayah dalam kota. Estimasi sampai di hari yang sama maksimal H+1 untuk racik puyer.',
    tags: ['antar obat', 'kirim obat', 'kurir', 'expedisi', 'farmasi', 'rumah']
  }
];

async function seedKnowledge() {
  console.log("Memulai injeksi data Knowledge Base Medis...");
  for (const item of newInputs) {
    try {
      console.log(`Meng-generate vektor semantik untuk: "${item.title}"...`);
      // Vektorisasi content agar AI bisa mengerti makna semantiknya, bukan hanya mencocokkan kata
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
      console.log(`✅ Berhasil menyuntikkan: ${item.title}`);
    } catch (err) {
      console.error(`❌ Gagal injeksi: ${item.title}`, err);
    }
  }
  console.log("\nSelesai!");
}

seedKnowledge().catch(console.error).finally(() => prisma.$disconnect());
