import { NextRequest, NextResponse } from 'next/server';
import { MemoryStore } from '@/lib/memory/store';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const memory = MemoryStore.getInstance();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      const messages = memory.getMessages(sessionId);
      const session = memory.getSession(sessionId);
      return NextResponse.json({ session, messages });
    }

    const sessions = memory.getSessions();
    return NextResponse.json({ sessions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const memory = MemoryStore.getInstance();
    const body = await req.json().catch(() => ({}));

    if (body.action === 'reset') {
      memory.seedDefaultScenarios();
      return NextResponse.json({ ok: true, message: 'Reset to default evaluation state' });
    }

    const newSession = {
      id: nanoid(),
      title: body.title || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };

    memory.saveSession(newSession);
    return NextResponse.json({ session: newSession });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
