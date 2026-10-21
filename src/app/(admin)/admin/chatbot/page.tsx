import Link from 'next/link';
import type { Route } from 'next';
import { requireAccess } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { content } from '@/lib/content';
import { getBuildState, getIndexStatus, probeOllama } from '@/lib/chatbot/ops';
import { getUsage, listRecentChats } from './actions';
import { ChatbotConsole } from './ChatbotConsole';

export const metadata = { title: 'Chatbot | Jetking Admin' };
export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  course: 'Courses', faq: 'FAQs', blog: 'Blog passages', centre: 'Centres & cities', info: 'Policies, investors, contact, custom answers',
  placement: 'Placements', about: 'About', policy: 'Legal pages', franchise: 'Franchise', explore: 'Explore', parent: 'Audience pages', student: 'Audience pages', professional: 'Audience pages',
};

function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: 'good' | 'warn' }) {
  return (
    <div className="adm-card p-4">
      <p className="text-xs font-semibold text-foreground-secondary">{label}</p>
      <p className={`mt-2 text-xl leading-tight font-extrabold ${tone === 'warn' ? 'text-[#b54708]' : tone === 'good' ? 'text-[#067647]' : 'text-foreground'}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-foreground-muted">{hint}</p> : null}
    </div>
  );
}

export default async function ChatbotOverviewPage() {
  await requireAccess('chatbot', 'view');
  const index = getIndexStatus();
  const [settings, ollama, usage, chats, knowledge] = await Promise.all([
    content.getChatbotSettings(),
    probeOllama(),
    getUsage(index.builtAt),
    listRecentChats(10),
    content.listChatbotKnowledge(),
  ]);
  const build = getBuildState();

  const grouped = new Map<string, number>();
  for (const [type, n] of Object.entries(index.byType)) {
    const label = TYPE_LABEL[type] ?? type;
    grouped.set(label, (grouped.get(label) ?? 0) + n);
  }
  const breakdown = [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]): [string, string] => [label, n.toLocaleString('en-IN')]);
  const builtLabel = index.builtAt ? new Date(index.builtAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'Never';

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Chatbot"
        title="Jetking AI"
        description="The assistant answers only from your website’s content. Here you can see what it knows, try it, rebuild its knowledge after edits, and see what visitors asked that it could not answer."
        actions={
          <>
            <Link href={'/admin/chatbot-settings' as Route} className="min-h-11 inline-flex items-center rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">
              Settings
            </Link>
            {settings.enabled ? (
              <a href="/chatbot" target="_blank" rel="noopener noreferrer" className="min-h-11 inline-flex items-center rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">
                Open chat page ↗
              </a>
            ) : (
              <Link href={'/admin/chatbot-settings' as Route} className="min-h-11 inline-flex items-center rounded-[var(--admin-radius)] border border-[#f9dbaf] bg-[#fffaeb] px-4 text-sm font-semibold text-[#b54708] hover:border-[#f79009]">
                Turn on in Settings
              </Link>
            )}
          </>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="On the website"
          value={settings.enabled ? 'Shown' : 'Hidden'}
          tone={settings.enabled ? 'good' : 'warn'}
          hint={settings.enabled ? settings.name : 'Hidden everywhere — turn on in Assistant settings'}
        />
        <Stat label="Knowledge" value={`${index.passages.toLocaleString('en-IN')} passages`} hint={`Rebuilt ${builtLabel}`} />
        <Stat label="Answers come from" value={index.generalAnswers ? 'Site + general' : 'Website only'} tone={index.generalAnswers ? 'warn' : 'good'} hint={`Match threshold ${index.answerGate}`} />
        <Stat label="Language model" value={ollama.up ? 'Connected' : 'Not running'} hint={ollama.up ? ollama.models[0] ?? 'Ollama' : 'Answers use the passages directly'} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Chats saved" value={usage.conversations} hint={`${usage.conversationsWeek} in the last 7 days`} />
        <Stat label="Leads from chat" value={usage.chatLeads} />
        <Stat label="Unanswered questions" value={usage.unanswered} tone={usage.unanswered > 0 ? 'warn' : undefined} hint="Asked, but nothing on the site answers it" />
        <Stat label="Custom answers" value={knowledge.length} hint="Published, written by your team" />
      </div>

      <ChatbotConsole
        build={build}
        needsRebuild={usage.contentChangedSinceBuild}
        builtLabel={builtLabel}
        embedModel={index.embedModel}
        breakdown={breakdown}
        chats={chats}
        canReadChats
      />

      <p className="mt-6 text-xs text-foreground-muted">
        Unanswered questions are listed under{' '}
        <Link href={'/admin/chatbot-questions' as Route} className="font-semibold text-[var(--accent-ink)] hover:underline">
          Unanswered questions
        </Link>
        ; write a Custom answer for each and rebuild.
      </p>
    </div>
  );
}
