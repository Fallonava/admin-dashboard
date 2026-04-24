import { prisma } from '@/lib/prisma';

// ⚠️ generateEmbedding TIDAK di-import secara static di sini.
// @xenova/transformers memerlukan model download saat pertama kali digunakan.
// Import secara lazy (dynamic) di dalam POST/PATCH agar route GET tidak terpengaruh.
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const { generateEmbedding } = await import('@/lib/vector-store');
    return await generateEmbedding(text);
  } catch {
    console.warn('[KnowledgeBase] Embedding generation failed, storing empty vector.');
    return new Array(384).fill(0);
  }
}

export class KnowledgeBaseService {
  static async getAll() {
    return prisma.knowledgeBase.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, category: true, title: true, content: true,
        tags: true, isActive: true, createdAt: true, updatedAt: true
        // Sengaja tidak mengembalikan embedding (data besar, tidak perlu di UI)
      }
    });
  }

  static async create(data: { category: string, title: string, content: string, tags?: string[] }) {
    if (!data.category || !data.title || !data.content) {
      throw new Error('category, title, and content are required.');
    }

    const textToEmbed = `${data.title}. ${data.content}`;
    const embedding = await getEmbedding(textToEmbed);

    return prisma.knowledgeBase.create({
      data: {
        category: data.category,
        title: data.title,
        content: data.content,
        tags: data.tags ?? [],
        embedding
      }
    });
  }

  static async update(id: string, data: { category?: string, title?: string, content?: string, tags?: string[], isActive?: boolean }) {
    if (!id) throw new Error('id is required');

    const updateData: any = { ...data };

    if (data.title || data.content) {
      const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
      const textToEmbed = `${data.title ?? existing?.title}. ${data.content ?? existing?.content}`;
      updateData.embedding = await getEmbedding(textToEmbed);
    }

    // Hapus field yang undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    return prisma.knowledgeBase.update({ where: { id }, data: updateData });
  }

  static async delete(id: string) {
    if (!id) throw new Error('id is required');
    await prisma.knowledgeBase.delete({ where: { id } });
    return true;
  }
}
