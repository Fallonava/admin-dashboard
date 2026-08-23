import { NextResponse } from 'next/server';
import { KnowledgeBaseService } from '@/features/knowledge-base/services/KnowledgeBaseService';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authErr = await requirePermission(req, 'settings', 'read');
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'template') {
      const buffer = await KnowledgeBaseService.getExportTemplate();
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=template_knowledge_base.xlsx'
        }
      });
    }

    if (action === 'export') {
      const buffer = await KnowledgeBaseService.exportData();
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
  const rateLimitErr = await withMutationRateLimit(req, 'settings');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'settings', 'write');
  if (authErr) return authErr;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const successCount = await KnowledgeBaseService.importData(arrayBuffer);

    return NextResponse.json({ 
      success: true, 
      message: `${successCount} data berhasil diimpor & dipelajari oleh AI.` 
    });

  } catch (e: any) {
    const status = e.message?.includes('No valid data') || e.message?.includes('Empty worksheet') ? 400 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
