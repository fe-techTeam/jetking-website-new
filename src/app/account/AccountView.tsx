'use client';

import { useEffect, useState } from 'react';
import type { Route } from 'next';
import { Bot, MessageSquare } from 'lucide-react';
import { useAccount } from '@/components/account/AccountProvider';
import { useChatbotEnabled } from '@/components/providers/chatbot-enabled';
import { Button, ButtonLink } from '@/components/ui';
import { useLocations } from '@/features/jetking-ai/account/use-locations';
import type { ConversationSummary } from '@/lib/chatbot/types';

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * The signed-in visitor's page: their details and the Jetking AI chats saved to the
 * account. Guests get a prompt to log in instead of a redirect — this route is
 * `noindex` and holds nothing until someone signs in.
 */
export function AccountView() {
  const { user, ready, openAuth, logout } = useAccount();
  const chatbotEnabled = useChatbotEnabled();
  const [chats, setChats] = useState<ConversationSummary[] | null>(null);
  const userId = user?.id;
  const tree = useLocations(Boolean(user?.city));
  // The account stores slugs; show the names people know.
  const cityNode = tree?.states.flatMap((s) => s.cities).find((c) => c.slug === user?.city);
  const centreName = cityNode?.centres.find((c) => c.slug === user?.centre)?.name;

  useEffect(() => {
    if (!userId || !chatbotEnabled) return;
    let cancelled = false;
    fetch('/api/chatbot/conversations')
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((data: { conversations?: ConversationSummary[] }) => {
        if (!cancelled) setChats(data.conversations ?? []);
      })
      .catch(() => {
        if (!cancelled) setChats([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, chatbotEnabled]);

  if (!ready) {
    return <p className="mt-6 text-foreground-muted">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mt-6 max-w-xl rounded-[20px] border border-border bg-surface p-6 sm:p-8">
        <p className="text-[17px] font-bold text-foreground">Log in to see your account</p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-secondary">
          One Jetking account for the website and Jetking AI. New here? Creating one takes under a minute.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => openAuth('login')}>Log in</Button>
          <Button tone="secondary" onClick={() => openAuth('signup')}>
            Sign up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section aria-labelledby="account-details" className="rounded-[20px] border border-border bg-surface p-6 sm:p-8">
        <h2 id="account-details" className="font-display text-xl font-extrabold text-foreground">
          Your details
        </h2>
        <dl className="mt-5 space-y-4 text-[15px]">
          {(
            [
              ['Name', user.name],
              ['Email', user.email],
              ['Mobile', user.phone],
              ['State', user.state ?? '—'],
              ['City', cityNode?.name ?? (user.city ? '…' : '—')],
              ['Preferred centre', centreName ?? (user.centre ? '…' : 'No preference')],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm font-semibold text-foreground-muted">{label}</dt>
              <dd className="mt-0.5 break-words font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <Button tone="secondary" className="mt-6" onClick={() => void logout()}>
          Log out
        </Button>
      </section>

      {chatbotEnabled ? (
        <section aria-labelledby="account-chats" className="rounded-[20px] border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="account-chats" className="font-display text-xl font-extrabold text-foreground">
              Saved Jetking AI chats
            </h2>
            <ButtonLink href={'/chatbot' as Route} size="sm">
              <Bot className="h-4 w-4" aria-hidden="true" />
              Open Jetking AI
            </ButtonLink>
          </div>

          {chats === null ? (
            <p className="mt-5 text-foreground-muted">Loading your chats…</p>
          ) : chats.length === 0 ? (
            <p className="mt-5 text-[15px] leading-relaxed text-foreground-secondary">
              No saved chats yet. Chats you have while logged in show up here, and you can pick them up again
              in Jetking AI.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {chats.map((chat) => (
                <li key={chat.id} className="flex items-center gap-3 py-3">
                  <MessageSquare className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">{chat.title}</span>
                  <time dateTime={chat.updatedAt} className="shrink-0 text-sm text-foreground-muted">
                    {dateFormat.format(new Date(chat.updatedAt))}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
