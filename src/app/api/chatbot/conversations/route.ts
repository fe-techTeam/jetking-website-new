import { NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getSessionUser } from '@/lib/chatbot/session';
import { listConversations, saveConversation } from '@/lib/chatbot/store';
import { saveConversationSchema } from '@/lib/chatbot/types';
import { isChatbotPubliclyEnabled } from '@/lib/chatbot/availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };

/** Autosave fires once per answered turn, so a normal user stays far below this; it only stops a script hammering the store. */
const saveLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

async function requireChatbotOn() {
  if (!(await isChatbotPubliclyEnabled())) {
    return NextResponse.json({ ok: false, error: 'Jetking AI is unavailable.' }, { status: 404 });
  }
  return null;
}

/** GET = the signed-in user's chats (newest first), POST = create-or-update one chat (autosave). */

export async function GET() {
  const off = await requireChatbotOn();
  if (off) return off;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Log in to see your chats.' }, { status: 401 });
  return NextResponse.json({ ok: true, conversations: await listConversations(user.id) }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const off = await requireChatbotOn();
  if (off) return off;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Log in to save chats.' }, { status: 401 });

  const limit = await saveLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many saves. Please slow down.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter || 60) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = saveConversationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid conversation.' }, { status: 400 });
  }

  const saved = await saveConversation(user.id, parsed.data);
  if (!saved) return NextResponse.json({ ok: false, error: 'Conversation not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
