import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/chatbot/session';
import { deleteConversation, getConversation } from '@/lib/chatbot/store';
import { isChatbotPubliclyEnabled } from '@/lib/chatbot/availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET = open one saved chat, DELETE = remove it. Both are scoped to the signed-in user. */

type Context = { params: Promise<{ id: string }> };

async function resolve(context: Context) {
  if (!(await isChatbotPubliclyEnabled())) {
    return { error: NextResponse.json({ ok: false, error: 'Jetking AI is unavailable.' }, { status: 404 }) };
  }
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ ok: false, error: 'Log in to see your chats.' }, { status: 401 }) };
  }
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return { error: NextResponse.json({ ok: false, error: 'Conversation not found.' }, { status: 404 }) };
  }
  return { user, id };
}

export async function GET(_request: Request, context: Context) {
  const r = await resolve(context);
  if ('error' in r) return r.error;
  const conversation = await getConversation(r.user.id, r.id);
  if (!conversation) return NextResponse.json({ ok: false, error: 'Conversation not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, conversation }, { headers: { 'cache-control': 'no-store' } });
}

export async function DELETE(_request: Request, context: Context) {
  const r = await resolve(context);
  if ('error' in r) return r.error;
  const removed = await deleteConversation(r.user.id, r.id);
  if (!removed) return NextResponse.json({ ok: false, error: 'Conversation not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
