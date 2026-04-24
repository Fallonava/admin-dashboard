import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ⚠️ generateEmbedding TIDAK di-import secara static di sini.
// @xenova/transformers memerlukan model download saat pertama kali digunakan.
// Import secara lazy (dynamic) di dalam POST/PATCH agar route GET tidak terpengaruh.
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const { generateEmbedding } = await import('@/lib/vector-store');
    return await generateEmbedding(text);
  } catch {
    // Jika model gagal dimuat, kembalikan array kosong sebagai fallback
    // Fitur semantic search tidak bekerja, tapi data tetap tersimpan
    console.warn('[KnowledgeBase] Embedding generation failed, storing empty vector.');
    return new Array(384).fill(0);
  }
}

// GET: Ambil semua Knowledge Base entries
export async function GET() {
  try {
    const items = await prisma.knowledgeBase.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, category: true, title: true, content: true,
        tags: true, isActive: true, createdAt: true, updatedAt: true
        // Sengaja tidak mengembalikan embedding (data besar, tidak perlu di UI)
      }
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Tambah entri baru + generate embedding otomatis
export async function POST(req: Request) {
  try {
    const { category, title, content, tags } = await req.json();

    if (!category || !title || !content) {
      return NextResponse.json({ error: 'category, title, and content are required.' }, { status: 400 });
    }

    // Generate embedding dari gabungan title + content untuk search yang lebih akurat
    const textToEmbed = `${title}. ${content}`;
    const embedding = await getEmbedding(textToEmbed);

    const item = await prisma.knowledgeBase.create({
      data: {
        category,
        title,
        content,
        tags: tags ?? [],
        embedding
      }
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: Update & re-generate embedding
export async function PATCH(req: Request) {
  try {
    const { id, category, title, content, tags, isActive } = await req.json();

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const updateData: any = { category, title, content, tags, isActive };

    // Re-generate embedding jika konten berubah
    if (title || content) {
      const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
      const textToEmbed = `${title ?? existing?.title}. ${content ?? existing?.content}`;
      updateData.embedding = await getEmbedding(textToEmbed);
    }

    // Hapus field yang undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const item = await prisma.knowledgeBase.update({ where: { id }, data: updateData });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Hapus entry
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await prisma.knowledgeBase.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
