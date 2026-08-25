import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, withMutationRateLimit } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const DEFAULT_SYSTEM_PROMPT = 'Anda adalah asisten virtual resmi Rumah Sakit bernama SIMED AI. Jawablah secara singkat, ramah, dan empatik dalam bahasa Indonesia. JANGAN pernah memberikan informasi medis diagnostik, arahkan pasien ke pelayanan. Gunakan data konteks yang diberikan sebagai sumber utama.';

export async function GET(req: Request) {
  const authErr = await requirePermission(req, 'settings', 'read');
  if (authErr) return authErr;

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

    const safeSettings = {
      id: settings.id,
      provider: settings.provider,
      aiEnabled: settings.aiEnabled,
      aiModel: settings.aiModel,
      ollamaUrl: settings.ollamaUrl,
      systemPrompt: settings.systemPrompt,
      apiKey: settings.apiKey ? settings.apiKey.slice(0, 4) + '...' : '',
      geminiKey: settings.geminiKey ? settings.geminiKey.slice(0, 4) + '...' : '',
      groqKey: settings.groqKey ? settings.groqKey.slice(0, 4) + '...' : '',
      cohereKey: settings.cohereKey ? settings.cohereKey.slice(0, 4) + '...' : '',
    };

    return NextResponse.json(safeSettings);
  } catch (error: any) {
    console.error('API AiSettings GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const rateLimitErr = await withMutationRateLimit(req, 'settings');
  if (rateLimitErr) return rateLimitErr;

  const authErr = await requirePermission(req, 'settings', 'write');
  if (authErr) return authErr;

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
