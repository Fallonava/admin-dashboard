import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { generateEmbedding } from '../src/lib/vector-store';

async function repairVectors() {
  console.log("🛠️ Memulai Perbaikan Vektor Semantik...");
  
  const items = await prisma.knowledgeBase.findMany();
  console.log(`Ditemukan ${items.length} data untuk diproses.`);

  for (const item of items) {
    try {
      console.log(`🔄 Memproses: "${item.title}"...`);
      const textToEmbed = `${item.title}\n\n${item.content}\nTags: ${item.tags.join(', ')}`;
      
      // Ini sekarang akan menggunakan model asli yang sudah kita download paksa
      const embedding = await generateEmbedding(textToEmbed);
      
      await prisma.knowledgeBase.update({
        where: { id: item.id },
        data: {
          embedding: embedding
        }
      });
      console.log(`✅ Sukses: ${item.title}`);
    } catch (err: any) {
      console.error(`❌ Gagal memproses ${item.title}:`, err.message);
    }
  }
  
  console.log("\n✨ Seluruh Vektor Semantik Berhasil Diperbarui!");
}

repairVectors().finally(() => prisma.$disconnect());
