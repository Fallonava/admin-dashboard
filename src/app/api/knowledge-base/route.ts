import { NextResponse } from 'next/server';
import { KnowledgeBaseService } from '@/features/knowledge-base/services/KnowledgeBaseService';

export async function GET() {
  try {
    const items = await KnowledgeBaseService.getAll();
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const item = await KnowledgeBaseService.create(data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e: any) {
    const status = e.message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...data } = await req.json();
    const item = await KnowledgeBaseService.update(id, data);
    return NextResponse.json({ item });
  } catch (e: any) {
    const status = e.message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await KnowledgeBaseService.delete(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e.message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
