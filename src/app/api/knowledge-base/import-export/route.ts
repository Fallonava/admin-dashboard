import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/vector-store';
import ExcelJS from 'exceljs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'template') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template Knowledge Base');

      worksheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Title', key: 'title', width: 40 },
        { header: 'Content', key: 'content', width: 80 },
        { header: 'Tags (separate by comma)', key: 'tags', width: 40 },
        { header: 'Is Active (TRUE/FALSE)', key: 'isActive', width: 15 },
      ];

      // Add example row
      worksheet.addRow({
        category: 'Umum',
        title: 'Cara mendaftar di rumah sakit?',
        content: 'Anda dapat mendaftar langsung di loket pendaftaran atau melalui aplikasi mobile kami.',
        tags: 'pendaftaran, rumah sakit, cara daftar',
        isActive: 'TRUE'
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=template_knowledge_base.xlsx'
        }
      });
    }

    if (action === 'export') {
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

      const buffer = await workbook.xlsx.writeBuffer();
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=knowledge_base_export.xlsx'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json({ error: 'Empty worksheet' }, { status: 400 });
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
      return NextResponse.json({ error: 'No valid data rows found' }, { status: 400 });
    }

    // Process rows: Generate embeddings and save to DB
    let successCount = 0;
    for (const row of rows) {
      try {
        const textToEmbed = `${row.title}. ${row.content}`;
        const embedding = await generateEmbedding(textToEmbed);

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

    return NextResponse.json({ 
      success: true, 
      message: `${successCount} data berhasil diimpor & dipelajari oleh AI.` 
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
