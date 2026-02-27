import { NextResponse } from 'next/server';
import { automationBroadcaster } from '@/lib/automation-broadcaster';

// This route sets up an SSE connection and emits server events when doctors update.
// Long-lived SSE connections require the Node.js runtime (not the Edge runtime).
// Use the `nodejs` runtime variant supported by Next.js for route handlers.
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
    });

    const stream = new ReadableStream({
        start(controller) {
            const send = (data: any) => {
                controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
            };
            const listener = (updates: any) => {
                send({ type: 'doctors', updates });
            };
            automationBroadcaster.on('doctors', listener);
            // keep-alive ping
            const iv = setInterval(() => controller.enqueue('event: ping\ndata: {}\n\n'), 25000);
            (controller as any).oncancel = () => {
                clearInterval(iv);
                automationBroadcaster.off('doctors', listener);
            };
        }
    });

    return new NextResponse(stream, { headers });
}
