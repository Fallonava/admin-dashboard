import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

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

  static async getExportTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template Knowledge Base');

    worksheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Content', key: 'content', width: 80 },
      { header: 'Tags (separate by comma)', key: 'tags', width: 40 },
      { header: 'Is Active (TRUE/FALSE)', key: 'isActive', width: 15 },
    ];

    worksheet.addRow({
      category: 'Umum',
      title: 'Cara mendaftar di rumah sakit?',
      content: 'Anda dapat mendaftar langsung di loket pendaftaran atau melalui aplikasi mobile kami.',
      tags: 'pendaftaran, rumah sakit, cara daftar',
      isActive: 'TRUE'
    });

    return workbook.xlsx.writeBuffer();
  }

  static async exportData() {
    const items = await prisma.knowledgeBase.findMany({
      orderBy: { category: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Knowledge Base Export');

    worksheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Content', key: 'content', width: 80 },
      { header: 'Tags', key: 'tags', width: 40 },
      { header: 'Is Active', key: 'isActive', width: 15 },
    ];

    items.forEach(item => {
      worksheet.addRow({
        category: item.category,
        title: item.title,
        content: item.content,
        tags: item.tags.join(', '),
        isActive: item.isActive ? 'TRUE' : 'FALSE'
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  static async importData(arrayBuffer: ArrayBuffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Empty worksheet');
    }

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const category = row.getCell(1).text?.trim();
      const title = row.getCell(2).text?.trim();
      const content = row.getCell(3).text?.trim();
      const tagsStr = row.getCell(4).text?.trim();
      const isActiveStr = row.getCell(5).text?.trim();

      if (category && title && content) {
        rows.push({
          category,
          title,
          content,
          tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
          isActive: isActiveStr ? isActiveStr.toUpperCase() === 'TRUE' : true
        });
      }
    });

    if (rows.length === 0) {
      throw new Error('No valid data rows found');
    }

    let successCount = 0;
    for (const row of rows) {
      try {
        const textToEmbed = `${row.title}. ${row.content}`;
        const embedding = await getEmbedding(textToEmbed);

        await prisma.knowledgeBase.create({
          data: {
            ...row,
            embedding
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to import row: ${row.title}`, err);
      }
    }

    return successCount;
  }
}
