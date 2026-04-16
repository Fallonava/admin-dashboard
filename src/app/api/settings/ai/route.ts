import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.aiSettings.findUnique({
      where: { id: 'singleton' }
    });

    if (!settings) {
      settings = await prisma.aiSettings.create({
        data: {
          id: 'singleton',
          provider: 'local',
          aiEnabled: false,
          aiModel: 'gemini-1.5-flash',
          apiKey: '',
          systemPrompt: 'Anda adalah asisten virtual resmi Rumah Sakit MedCore bernama FAKT-Bot. Jawablah secara singkat, ramah, dan empatik. JANGAN pernah memberikan informasi medis diagnostik, arahkan pasien ke pelayanan. Gunakan bahasa Indonesia sehari-hari yang sopan.'
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

    const allowedFields = ['provider', 'apiKey', 'aiEnabled', 'aiModel', 'systemPrompt'];
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
        ...updateData
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API AiSettings PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}
