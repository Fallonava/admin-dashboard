import { NextResponse } from 'next/server';
import { AssistantService } from '@/features/assistant/services/AssistantService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, role, conversationHistory } = body;

    const response = await AssistantService.handleChatRequest(message, role, conversationHistory);

    if (response.isStream && response.streamResult) {
      return response.streamResult.toTextStreamResponse();
    }

    return NextResponse.json({
      reply: response.reply,
      intent: response.intent,
      source: response.source,
      confidence: response.confidence,
    });

  } catch (err: any) {
    console.error('Chat Assistant Error:', err?.message || err);
    return NextResponse.json(
      { reply: 'Maaf, sistem AI sedang dalam perbaikan. Coba lagi sebentar.' },
      { status: 500 }
    );
  }
}
