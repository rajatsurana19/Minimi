import { NextRequest } from 'next/server';
import { AgentOrchestrator } from '@/lib/agent/orchestrator';
import { AgentStep, Message, SearchSource, VerificationDelta } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetSessionId = sessionId || 'default-session';

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (event: string, data: unknown) => {
      try {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(payload));
      } catch (e) {
        console.error('Failed to write SSE event', e);
      }
    };

    // Run orchestrator in background and pipe events to stream
    (async () => {
      try {
        await AgentOrchestrator.execute(message, targetSessionId, {
          onStepStart: (step: AgentStep) => sendEvent('step_start', step),
          onStepUpdate: (step: AgentStep) => sendEvent('step_update', step),
          onStepFinish: (step: AgentStep) => sendEvent('step_finish', step),
          onSources: (sources: SearchSource[]) => sendEvent('sources', sources),
          onDelta: (delta: VerificationDelta) => sendEvent('delta', delta),
          onToken: (token: string) => sendEvent('token', token),
          onDone: async (finalMessage: Message) => {
            await sendEvent('done', finalMessage);
            await writer.close();
          },
          onError: async (errorMsg: string) => {
            await sendEvent('error', { message: errorMsg });
            await writer.close();
          },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendEvent('error', { message });
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
