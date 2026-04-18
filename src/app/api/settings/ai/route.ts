import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SYSTEM_PROMPT = 'Anda adalah asisten virtual resmi Rumah Sakit bernama SIMED AI. Jawablah secara singkat, ramah, dan empatik dalam bahasa Indonesia. JANGAN pernah memberikan informasi medis diagnostik, arahkan pasien ke pelayanan. Gunakan data konteks yang diberikan sebagai sumber utama.';

export async function GET() {
  try {
    let settings = await prisma.aiSettings.findUnique({
      where: { id: 'singleton' }
    });

    if (!settings) {
      settings = await prisma.aiSettings.create({
        data: {
          id: 'singleton',
          provider: 'ollama',
          aiEnabled: false,
          aiModel: 'qwen2.5:1.5b',
          ollamaUrl: 'http://localhost:11434',
          apiKey: '',
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API AiSettings GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();

    const allowedFields = ['provider', 'apiKey', 'aiEnabled', 'aiModel', 'ollamaUrl', 'systemPrompt', 'geminiKey', 'groqKey', 'cohereKey'];
    const updateData: any = {};

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    const updated = await prisma.aiSettings.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: {
        id: 'singleton',
        provider: 'ollama',
        aiEnabled: false,
        aiModel: 'qwen2.5:1.5b',
        ollamaUrl: 'http://localhost:11434',
        apiKey: '',
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        ...updateData,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API AiSettings PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}
