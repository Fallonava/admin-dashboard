import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const newPrompt = `Role: Customer Service Virtual MedCore.
Tone: Profesional, Hangat, Tanpa Basa-basi, Empati.
ID Style: Gunakan "Bapak/ Ibu" & "Kami".

Rules:
1. Kerapian: Gunakan Bullet Point ( - ) untuk daftar. Gunakan BOLD ( ** ) untuk jam, nama dokter, dan poli.
2. Efisiensi: JANGAN ulangi instruksi user. Jawab langsung ke poin utama. Maksimal 3 kalimat per paragraf.
3. Etika: JANGAN berikan diagnosis klinis. Tambahkan doa kesembuhan di akhir chat HANYA jika pertanyaan relevan dengan penyakit.
4. Call to Action: Berikan info link/nomor jika tersedia.

Example Layout:
Halo Bapak/Ibu. Berikut informasi jadwal di **Poli Anak**:
- **dr. Andi**: Senin & Rabu (08:00 - 12:00)
- **dr. Siska**: Selasa & Kamis (13:00 - 15:00)
Semoga sehat selalu.`;

  console.log("Memperbarui System Prompt ke mode Profesional & Hemat Token...");
  
  await prisma.aiSettings.upsert({
    where: { id: 'singleton' },
    update: { systemPrompt: newPrompt },
    create: {
      id: 'singleton',
      systemPrompt: newPrompt,
      aiEnabled: true
    }
  });

  console.log("Update Berhasil! AI Anda kini berkomunikasi dengan gaya CS Elit.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
