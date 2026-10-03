'use client';

import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Cpu,
  Download,
  GraduationCap,
  Globe2,
  Headphones,
  Headset,
  HelpCircle,
  IndianRupee,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Moon,
  Newspaper,
  PanelRight,
  Send,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { JetkingShield } from '@/components/brand/jetking-shield';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTheme } from '@/components/providers/theme-provider';
import { useMounted } from '@/hooks';
import { cn } from '@/lib/utils';
import { MAX_STORED_MESSAGES } from '@/lib/chatbot/limits';
import type { ChatUser, ConversationSummary, StoredMessage } from '@/lib/chatbot/types';

import { AuthDialog } from './account/auth-dialog';
import { useChatAccount } from './account/use-chat-account';
import { useLocations } from './account/use-locations';
import { STARTERS, WHATSAPP_URL, type Chip, type IntentKey } from './conversation';
import { AnswerBody } from './answer-html';
import type { ContentBlock } from './answer-schema';
import { LeadCaptureForm, type LeadFormContext } from './lead-form';
import { JetkingLoader } from './jetking-loader';
import { EMPTY_SESSION, type CounsellingSession } from './session';
import { smallTalk } from './small-talk';

/* ------------------------------------------------------------------ */
/* Menu structure — the AI control panel                               */
/* ------------------------------------------------------------------ */

interface MenuItem {
  key: IntentKey;
  label: string;
  icon: LucideIcon;
}

const MENU_GROUPS: { heading: string | null; items: MenuItem[] }[] = [
  { heading: null, items: [{ key: 'welcome', label: 'AI Chat', icon: Bot }] },
  {
    heading: 'Explore',
    items: [
      { key: 'courses', label: 'Courses', icon: GraduationCap },
      { key: 'locations', label: 'Centers / Locations', icon: MapPin },
      { key: 'placements', label: 'Placements & Jobs', icon: Briefcase },
      { key: 'demo', label: 'Book Demo Class', icon: CalendarCheck },
      { key: 'fees', label: 'Fees & EMI', icon: Wallet },
      { key: 'studentCorner', label: 'Student Corner', icon: BookOpen },
      { key: 'blogs', label: 'Blogs & Resources', icon: Newspaper },
      { key: 'faqs', label: 'FAQs', icon: HelpCircle },
    ],
  },
  { heading: 'Get Help', items: [{ key: 'counselor', label: 'Contact Counselor', icon: Headset }] },
];

const QUICK_LINKS: { label: string; icon: LucideIcon; intent?: IntentKey; query?: string }[] = [
  {
    label: 'Download Brochure',
    icon: Download,
    query: 'How can I get the Jetking course brochure?',
  },
  { label: 'Check Fees', icon: IndianRupee, intent: 'fees' },
  { label: 'Book Free Demo Class', icon: CalendarDays, intent: 'demo' },
  { label: 'Talk to Counselor', icon: Headphones, intent: 'counselor' },
];

const WHY_JETKING: { label: string; icon: LucideIcon }[] = [
  { label: '100% Job Oriented Courses', icon: Briefcase },
  { label: 'Industry Experienced Trainers', icon: Users },
  { label: 'Practical Training & Labs', icon: Cpu },
  { label: 'Placement Assistance', icon: BarChart3 },
  { label: '80 Years of Excellence', icon: Award },
];

const POPULAR_COURSES = [
  { title: 'Hardware & Networking', duration: '6 Months', query: 'Hardware and Networking course' },
  { title: 'Network Administration', duration: '6 Months', query: 'Network Administration course' },
  { title: 'Cloud Computing', duration: '6 Months', query: 'Cloud Computing course' },
  { title: 'Cyber Security', duration: '6 Months', query: 'Cyber Security course' },
];

/* ------------------------------------------------------------------ */
/* Chat message model                                                  */
/* ------------------------------------------------------------------ */

type Message =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      kind: 'text';
      text: string;
      title?: string;
      source?: 'kb' | 'llm';
      /** The model's own structured content, when its JSON reply parsed cleanly — see answer-schema.ts. */
      blocks?: ContentBlock[];
      reasoning?: string[];
      followUps?: { label: string; query: string }[];
      chips?: Chip[];
      /** Shows an inline lead-capture form under this answer (e.g. "book a demo"). */
      leadForm?: LeadFormContext;
    }
  | { id: string; role: 'assistant'; kind: 'thinking' };

/** Shown when nothing in the local Jetking knowledge base matches — never invent. */
const GATE_TEXT =
  "I don't have verified information about that, so I'd rather not guess. A Jetking counsellor can answer it properly — and meanwhile I can help with courses, fees, eligibility, placements, or finding a centre near you. What would you like to know?";

/** Client-side UUID for a chat's saved id. `randomUUID` needs a secure context, so fall back for plain-http LAN testing. */
function newConversationId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** The transcript as it is saved: no "thinking" placeholders, text clipped to what the API accepts. */
function toStoredMessages(messages: Message[]): StoredMessage[] {
  return messages.flatMap((m): StoredMessage[] => {
    if (m.role === 'user') return [{ ...m, text: m.text.slice(0, 4000) }];
    if (m.kind === 'thinking') return [];
    return [{ ...m, text: m.text.slice(0, 20_000) }];
  });
}

/** Sidebar title for a saved chat — the visitor's first question. */
function deriveChatTitle(messages: StoredMessage[]): string {
  const first = messages.find((m) => m.role === 'user')?.text.replace(/\s+/g, ' ').trim() ?? '';
  if (!first) return 'New chat';
  return first.length > 60 ? `${first.slice(0, 57)}…` : first;
}

/** Flatten the transcript into the {role, content} history the local LLM receives. */
function toApiMessages(
  history: Message[],
  query: string,
): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of history) {
    if (m.role === 'user') out.push({ role: 'user', content: m.text });
    else if (m.kind === 'text') out.push({ role: 'assistant', content: m.text });
  }
  out.push({ role: 'user', content: query });
  while (out.length && out[0]?.role !== 'user') out.shift();
  return out;
}

/* ------------------------------------------------------------------ */
/* Brand + decorative pieces                                           */
/* ------------------------------------------------------------------ */

function BrandLockup() {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- brand asset; sized by caller */}
      <img
        src="/brand/jetking-wordmark.png"
        alt="Jetking"
        draggable={false}
        className="block h-6 max-w-full min-w-0 shrink select-none object-contain object-left min-[360px]:h-7 sm:h-9"
      />
    </div>
  );
}

function ReactorMark() {
  return (
    <div className="grid place-items-center py-1">
      <span className="block" style={{ height: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- brand asset; sized by caller */}
        <img
          src="/brand/jetking-wordmark.png"
          alt="Jetking"
          draggable={false}
          className="h-full w-auto select-none object-contain"
        />
      </span>
    </div>
  );
}

function ChatAvatar() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
      <span className="block h-[18px] w-[18px]">
        <JetkingShield id="jk-avatar" className="h-full w-full" />
      </span>
    </span>
  );
}

function UserAvatar() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-sunken text-ink-subtle ring-1 ring-black/5 dark:ring-white/10">
      <User className="size-[18px]" />
    </span>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="jk-typing-dot" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Chat pieces                                                         */
/* ------------------------------------------------------------------ */

function ChipRow({ chips, onChip }: { chips: Chip[]; onChip: (chip: Chip) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onChip(chip)}
          className="min-h-11 rounded-full border border-brand-border bg-brand-soft px-3.5 py-2 text-[12.5px] font-medium text-brand-text transition-colors hover:border-brand hover:bg-brand hover:text-white"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

function AssistantRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="jk-msg-in flex items-start gap-2.5">
      <ChatAvatar />
      <div className="w-full max-w-[min(88%,42rem)] min-w-0 rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3.5 shadow-sm">
        {children}
      </div>
    </div>
  );
}

/**
 * Conversational starters / small-talk — real <p> paragraphs, no KB article layout.
 */
function ChatProse({ text }: { text: string }) {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // If the starter is one long line, split into short readable paragraphs.
  const blocks =
    paragraphs.length === 1 && paragraphs[0]!.length > 120
      ? paragraphs[0]!
          .split(/(?<=[.!?])\s+(?=[A-Z0-9👋🎓💰💼📍📚❓📅🔴📞])/)
          .map((s) => s.trim())
          .filter(Boolean)
      : paragraphs;

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((p, i) => (
        <p key={i} className="text-[14px] leading-relaxed text-ink">
          {p}
        </p>
      ))}
    </div>
  );
}

/**
 * Knowledge answers → structured HTML. Chat starters → simple prose.
 */
function TypedAnswer({
  text,
  title,
  blocks,
  animate,
  structured,
  onDone,
}: {
  text: string;
  title?: string;
  blocks?: ContentBlock[];
  animate: boolean;
  /** True for KB / LLM answers; false for welcome / intent starters. */
  structured: boolean;
  onDone?: () => void;
}) {
  // Which answer we have finished revealing. Derived readiness rather than a
  // `setReady(false)` inside the effect: resetting state from an effect body
  // costs an extra render pass every time a new answer arrives.
  const [readyFor, setReadyFor] = useState<string | null>(animate ? null : text);
  const ready = !animate || readyFor === text;

  useEffect(() => {
    if (!animate) {
      onDone?.();
      return;
    }
    if (readyFor === text) return;

    const id = window.setTimeout(() => {
      setReadyFor(text);
      onDone?.();
      document.getElementById('jk-chat-end')?.scrollIntoView({ block: 'end' });
    }, 180);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per answer
  }, [text, animate, readyFor]);

  if (!ready) {
    return (
      <p className="text-[13px] leading-relaxed text-ink-subtle">
        {structured ? 'Preparing answer…' : '…'}
        <span className="jk-caret" />
      </p>
    );
  }

  return (
    <div className="jk-msg-in">
      {structured ? (
        <AnswerBody text={text} title={title} blocks={blocks} />
      ) : (
        <ChatProse text={text} />
      )}
    </div>
  );
}

const THINKING_STEPS = [
  'Reading your question…',
  'Searching the Jetking knowledge base…',
  'Checking how relevant the matches are…',
  'Selecting the best answer…',
];

const TYPE_MS = 18;
/** Minimum time a step stays on screen, however short its label. */
const STEP_MIN_MS = 900;
/** Pause after a label finishes typing, before advancing. */
const STEP_HOLD_MS = 420;

/** Live "thinking" — types each step, then advances. */
function ThinkingSteps() {
  // Step and typed-character count live in one state object so advancing a
  // step resets the counter in the same update. Holding them separately meant
  // clearing the old text with a setState in an effect body, which costs an
  // extra render pass on every step.
  const [{ step, count }, setProgress] = useState({ step: 0, count: 0 });

  const label = THINKING_STEPS[step] ?? '';
  const typed = label.slice(0, count);
  const done = count >= label.length;

  // A self-rescheduling timeout rather than an interval: it stops on its own
  // at the end of the label, so there is nothing to clear mid-flight.
  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setProgress((p) => ({ ...p, count: p.count + 1 })), TYPE_MS);
    return () => window.clearTimeout(id);
    // `count` must be a dependency: each tick re-runs the effect, which is what
    // schedules the next character.
  }, [count, done]);

  useEffect(() => {
    if (!done || step >= THINKING_STEPS.length - 1) return;
    const id = window.setTimeout(
      () =>
        setProgress((p) => ({ step: Math.min(p.step + 1, THINKING_STEPS.length - 1), count: 0 })),
      Math.max(STEP_HOLD_MS, STEP_MIN_MS - label.length * TYPE_MS),
    );
    return () => window.clearTimeout(id);
  }, [done, step, label.length]);

  return (
    <div className="flex flex-col gap-2.5 py-0.5" role="status" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <TypingDots />
        <span className="text-[12px] font-medium tracking-wide text-ink-subtle">
          Jetking AI is thinking
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {THINKING_STEPS.slice(0, step + 1).map((s, i) => {
          const active = i === step;
          const complete = i < step;
          return (
            <div
              key={i}
              className="jk-step-in flex items-center gap-2 text-[13px]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {complete ? (
                <Check className="size-3.5 shrink-0 text-emerald-500" />
              ) : (
                <Loader2 className="size-3.5 shrink-0 animate-spin text-brand-text" />
              )}
              <span className={complete ? 'text-ink-subtle' : 'text-ink-muted'}>
                {active ? typed : s}
                {active ? <span className="jk-caret" /> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Collapsible "thinking" panel — the actual reasoning behind an answer. */
function Thoughts({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="jk-msg-in mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-ink-subtle transition-colors hover:text-ink-muted"
      >
        <BrainCircuit className="size-3.5 text-brand-text" />
        {open ? 'Hide thinking' : 'Show thinking'}
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 border-l border-line pl-6 text-[12.5px] leading-relaxed text-ink-muted marker:text-[12px]">
          {steps.map((s, i) => (
            <li key={i} className="jk-step-in" style={{ animationDelay: `${i * 50}ms` }}>
              {s}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

type AssistantTextMsg = Extract<Message, { role: 'assistant'; kind: 'text' }>;

/** Assistant bubble with typewriter body; extras reveal after typing finishes. */
function AssistantTextBubble({
  msg,
  animate,
  onAsk,
  onChip,
  user,
}: {
  msg: AssistantTextMsg;
  animate: boolean;
  onAsk: (query: string) => void;
  onChip: (chip: Chip) => void;
  user: ChatUser | null;
}) {
  const [ready, setReady] = useState(!animate);

  return (
    <AssistantRow>
      <TypedAnswer
        text={msg.text}
        title={msg.title}
        blocks={msg.blocks}
        animate={animate}
        structured={Boolean(msg.source)}
        onDone={() => setReady(true)}
      />
      {ready && msg.source ? (
        <div className="jk-msg-in mt-3 flex items-center gap-1.5 border-t border-line pt-2.5 text-[12px] text-ink-subtle">
          <Sparkles className="size-3 text-brand-text" />
          {msg.source === 'llm'
            ? 'Jetking AI · grounded in the knowledge base'
            : 'From the Jetking knowledge base'}
        </div>
      ) : null}
      {ready && msg.reasoning?.length ? <Thoughts steps={msg.reasoning} /> : null}
      {ready && msg.leadForm ? <LeadCaptureForm context={msg.leadForm} user={user} /> : null}
      {ready && msg.followUps?.length ? (
        <div className="jk-msg-in">
          <FollowUps items={msg.followUps} onAsk={onAsk} />
        </div>
      ) : null}
      {ready && msg.chips?.length ? (
        <div className="jk-msg-in">
          <ChipRow chips={msg.chips} onChip={onChip} />
        </div>
      ) : null}
    </AssistantRow>
  );
}

/** Tappable, topic-aware next questions under an answer. */
function FollowUps({
  items,
  onAsk,
}: {
  items: { label: string; query: string }[];
  onAsk: (q: string) => void;
}) {
  return (
    <div className="mt-3.5 border-t border-line pt-3">
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-ink-subtle uppercase">
        <Sparkles className="size-3 text-brand-text" /> Continue exploring
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((f) => (
          <button
            key={f.label}
            onClick={() => onAsk(f.query)}
            className="group flex items-center gap-1 rounded-full border border-line bg-canvas px-3 py-1.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:border-jk-300 hover:bg-brand-soft hover:text-brand-text"
          >
            {f.label}
            <ChevronRight className="-ml-0.5 size-3.5 text-brand-text opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebars                                                            */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  activeKey: IntentKey;
  onIntent: (key: IntentKey) => void;
  onQuery: (query: string, label: string) => void;
}

interface SidebarAccount {
  user: ChatUser | null;
  ready: boolean;
  history: ConversationSummary[];
  activeConversationId: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

function LeftSidebar({
  activeKey,
  onIntent,
  account,
}: SidebarProps & { account: SidebarAccount }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className="flex h-full flex-col bg-rail text-ink">
      <div className="flex flex-col items-center px-6 pt-6 pb-4">
        <ReactorMark />
        <p className="mt-3 font-display text-base font-extrabold tracking-wide">JETKING AI</p>
        <p className="mt-0.5 text-[12px] text-ink-subtle">Your Learning Assistant</p>
      </div>

      <nav className="flex scrollbar-subtle flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {MENU_GROUPS.map((group) => (
          <div key={group.heading ?? 'main'} className="mb-1">
            {group.heading ? (
              <p className="px-3 pt-3 pb-1.5 text-[12px] font-semibold tracking-[0.18em] text-ink-subtle uppercase">
                {group.heading}
              </p>
            ) : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onIntent(item.key)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-brand text-white shadow-brand'
                      : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}

        {account.user ? (
          <div className="mb-1">
            <p className="px-3 pt-3 pb-1.5 text-[12px] font-semibold tracking-[0.18em] text-ink-subtle uppercase">
              Recent chats
            </p>
            {account.history.length === 0 ? (
              <p className="px-3 py-2 text-[12px] leading-snug text-ink-subtle">
                Your saved chats will show up here.
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {account.history.map((chat) => {
                  const active = chat.id === account.activeConversationId;
                  return (
                    <li key={chat.id} className="group relative">
                      <button
                        onClick={() => account.onOpenChat(chat.id)}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl py-2.5 pr-10 pl-3 text-left text-[13px] font-medium transition-colors',
                          active
                            ? 'bg-surface-active text-ink'
                            : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                        )}
                      >
                        <MessageSquare className="size-[16px] shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{chat.title}</span>
                      </button>
                      <button
                        onClick={() => account.onDeleteChat(chat.id)}
                        aria-label={`Delete chat: ${chat.title}`}
                        className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-ink-subtle opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface-active hover:text-brand-text focus-visible:opacity-100 max-md:opacity-100"
                      >
                        <Trash2 className="size-[15px]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </nav>

      <div className="flex flex-col gap-2 border-t border-line p-3">
        <button
          onClick={() => onIntent('enquire')}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-[13px] font-bold tracking-wide text-white shadow-brand transition-colors hover:bg-brand-hover"
        >
          <Zap className="size-4 fill-current" /> Enquire Now
        </button>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:border-whatsapp/60 hover:text-whatsapp"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            aria-label="Toggle dark or light mode"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>

        {account.user ? (
          <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-bold text-white"
            >
              {account.user.name.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12.5px] font-semibold text-ink">
                {account.user.name}
              </span>
              <span className="block truncate text-[12px] text-ink-subtle">{account.user.email}</span>
            </span>
            <button
              onClick={account.onLogout}
              aria-label="Log out"
              title="Log out"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-brand-text"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={account.onLogin}
            // Disabled until the first "who am I" answer, so a signed-in visitor can't open Log in by mistake.
            disabled={!account.ready}
            className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-active text-ink-muted">
              <LogIn className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[12.5px] font-semibold text-ink">Log in / Sign up</span>
              <span className="block text-[12px] text-ink-subtle">Save your chats</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      {children}
    </section>
  );
}

function CardTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-display text-[15px] font-extrabold tracking-wide text-brand-text">{title}</h3>
      {action ? (
        <button
          onClick={onAction}
          className="text-[12px] font-bold tracking-wide text-brand-text hover:underline"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

/** Right drawer — quick links & info (separate from the left nav menu). */
function RightSidebar({ onIntent, onQuery }: Omit<SidebarProps, 'activeKey'>) {
  return (
    <div className="flex flex-col gap-5">
      <InfoCard>
        <CardTitle title="QUICK LINKS" />
        <ul className="flex flex-col">
          {QUICK_LINKS.map((q, i) => (
            <li key={q.label}>
              <button
                onClick={() => (q.intent ? onIntent(q.intent) : onQuery(q.query!, q.label))}
                className="group flex w-full items-center gap-3 py-2.5 text-[13.5px] text-ink transition-colors hover:text-brand-text"
              >
                <q.icon className="size-[18px] shrink-0 text-brand-text" />
                <span className="font-medium">{q.label}</span>
                <ChevronRight className="ml-auto size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand-text" />
              </button>
              {i < QUICK_LINKS.length - 1 ? <div className="border-t border-line" /> : null}
            </li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard>
        <CardTitle title="WHY JETKING?" />
        <ul className="flex flex-col gap-3.5">
          {WHY_JETKING.map(({ label, icon: Icon }) => (
            <li key={label} className="flex items-center gap-3 text-[13.5px] text-ink">
              <Icon className="size-[18px] shrink-0 text-ink-subtle" />
              <span className="font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard>
        <CardTitle title="POPULAR COURSES" action="VIEW ALL" onAction={() => onIntent('courses')} />
        <ul className="flex flex-col gap-3.5">
          {POPULAR_COURSES.map((c) => (
            <li key={c.title}>
              <button
                onClick={() => onQuery(c.query, c.title)}
                className="group flex w-full items-center gap-3 text-left"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-linear-135 from-jk-950 to-jk-600">
                  <GraduationCap className="size-5 text-white/90" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-bold text-ink transition-colors group-hover:text-brand-text">
                    {c.title}
                  </span>
                  <span className="block text-[12px] text-ink-subtle">Duration: {c.duration}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </InfoCard>

      <section className="relative overflow-hidden rounded-2xl bg-linear-135 from-jk-600 to-jk-800 p-5 text-white shadow-brand">
        <h3 className="font-display text-[17px] leading-tight font-extrabold">
          Ready to kickstart your IT career?
        </h3>
        <p className="mt-1.5 text-[13px] text-white/85">Join Jetking and build a better life.</p>
        <button
          onClick={() => onIntent('enquire')}
          className="mt-4 min-h-10 rounded-full bg-black px-5 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          Enquire now
        </button>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function JetkingAiClient() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [activeKey, setActiveKey] = useState<IntentKey>('welcome');
  const [busy, setBusy] = useState(false);
  const [boot, setBoot] = useState<'show' | 'fade' | 'gone'>('show');

  const account = useChatAccount();

  // Personalisation from the account's saved location: resolve the home city's display name
  // (the account stores the slug), then seed each new chat with it so answers start local.
  const accountCity = account.user?.city ?? null;
  const locationTree = useLocations(Boolean(accountCity));
  const homeCityName =
    (accountCity &&
      locationTree?.states.flatMap((s) => s.cities).find((c) => c.slug === accountCity)?.name) ||
    null;
  const homeCityRef = useRef<string | null>(null);
  useEffect(() => {
    homeCityRef.current = homeCityName;
  }, [homeCityName]);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  /**
   * Id this chat is saved under. Created lazily on the first save, and replaced by
   * "new chat" / opening a saved one. The state copy only drives the sidebar highlight.
   */
  const conversationIdRef = useRef<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  /** Fingerprint of the last transcript successfully saved, so an unchanged chat is never re-saved. */
  const savedSigRef = useRef('');
  /** How many leading messages were loaded from a saved chat — those render without the typing animation. */
  const [restoredCount, setRestoredCount] = useState(0);

  const idRef = useRef(1);
  const nextId = () => `m${idRef.current++}`;
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  /** Round-tripped with /api/chat each turn — not persisted across a reload,
   *  same as the message transcript itself. */
  const sessionRef = useRef<CounsellingSession | undefined>(undefined);
  /**
   * The `locations` starter's own city chips already frame their query as
   * "Jetking centre in {city}" before calling `ask()` — that's what makes
   * the server reliably recognise it as a location question. Free-typing a
   * city instead of tapping a chip skipped that framing entirely: the raw
   * text (e.g. "vapi") went to /api/chat with no location signal and no
   * prior session (this starter never calls the API itself), so the server
   * fell through to general answer composition and invented a "Vapi Centre"
   * with a literal "[insert address]" placeholder. Tracking that we're
   * waiting on a free-typed city lets `onSubmit` apply the same framing.
   */
  const awaitingCityRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'm0',
      role: 'assistant',
      kind: 'text',
      text: STARTERS.welcome.message,
      chips: STARTERS.welcome.chips,
    },
  ]);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('jk-ai-intro') === '1';
    } catch {
      // Storage can be blocked (private mode); the intro then simply plays every time.
    }
    const fade = setTimeout(() => setBoot('fade'), seen ? 0 : 750);
    const gone = setTimeout(() => {
      setBoot('gone');
      try {
        sessionStorage.setItem('jk-ai-intro', '1');
      } catch {
        // See above.
      }
    }, seen ? 0 : 1100);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages]);

  // Autosave for signed-in visitors. Waits for the answer to land (`busy` false) and
  // debounces, so a turn is one save rather than one per state change. Logging in
  // mid-chat runs this too, which is what saves a chat that began as a guest.
  const { user, saveConversation } = account;
  useEffect(() => {
    if (!user || busy) return;
    const stored = toStoredMessages(messages).slice(-MAX_STORED_MESSAGES);
    const last = stored[stored.length - 1];
    if (!last || !stored.some((m) => m.role === 'user')) return;
    const signature = `${user.id}:${stored.length}:${last.id}:${last.text.length}`;
    if (signature === savedSigRef.current) return;

    const timer = setTimeout(() => {
      const id = (conversationIdRef.current ??= newConversationId());
      setActiveConversationId(id);
      void saveConversation({
        id,
        title: deriveChatTitle(stored),
        messages: stored,
        session: sessionRef.current ? { ...sessionRef.current } : undefined,
      }).then((ok) => {
        // Only a successful save counts, so a failed one is retried on the next change.
        if (ok && conversationIdRef.current === id) savedSigRef.current = signature;
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [messages, busy, user, saveConversation]);

  const startNewChat = useCallback(() => {
    awaitingCityRef.current = false;
    conversationIdRef.current = null;
    savedSigRef.current = '';
    sessionRef.current = undefined;
    setActiveConversationId(null);
    setRestoredCount(0);
    setMessages([
      {
        id: nextId(),
        role: 'assistant',
        kind: 'text',
        text: STARTERS.welcome.message,
        chips: STARTERS.welcome.chips,
      },
    ]);
  }, []);

  const openChat = useCallback(
    async (id: string) => {
      const chat = await account.openConversation(id);
      if (!chat) return;
      const loaded = chat.messages as Message[];
      const highest = loaded.reduce((max, m) => Math.max(max, Number(/^m(\d+)$/.exec(m.id)?.[1] ?? 0)), 0);
      // New ids must not collide with the restored ones.
      idRef.current = highest + 1;
      awaitingCityRef.current = false;
      conversationIdRef.current = chat.id;
      sessionRef.current = chat.session as CounsellingSession | undefined;
      const last = chat.messages[chat.messages.length - 1];
      savedSigRef.current = last
        ? `${account.user?.id}:${chat.messages.length}:${last.id}:${last.text.length}`
        : '';
      setActiveConversationId(chat.id);
      setRestoredCount(loaded.length);
      setActiveKey('welcome');
      setMessages(loaded);
      setDrawerOpen(false);
    },
    [account],
  );

  const confirmDeleteChat = useCallback(async () => {
    const id = pendingDeleteId;
    if (!id) return;
    const removed = await account.deleteConversation(id);
    if (removed && conversationIdRef.current === id) startNewChat();
  }, [account, pendingDeleteId, startNewChat]);

  const handleLogout = useCallback(async () => {
    await account.logout();
    // Don't leave a signed-out visitor looking at the previous account's chat.
    startNewChat();
    setDrawerOpen(false);
  }, [account, startNewChat]);

  const runLocal = useCallback(
    (query: string, prior: Message[], coords?: { lat: number; lng: number }) => {
      const thinkingId = nextId();
      setBusy(true);
      setMessages((m) => [...m, { id: thinkingId, role: 'assistant', kind: 'thinking' }]);

      const replaceWithText = (text: string) =>
        setMessages((m) =>
          m.map((msg) =>
            msg.id === thinkingId ? { id: thinkingId, role: 'assistant', kind: 'text', text } : msg,
          ),
        );

      // Persona is inferred server-side from the question — no UI path CTAs.
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: toApiMessages(prior, query),
          // A chat with no context yet is seeded with the signed-in visitor's city, so answers start local.
          session:
            sessionRef.current ??
            (homeCityRef.current
              ? { ...EMPTY_SESSION, lastCity: homeCityRef.current.toLowerCase() }
              : undefined),
          ...coords,
        }),
      })
      .then((r) => r.json())
      .then(
        (data: {
          text?: string;
          title?: string;
          source?: 'kb' | 'llm';
          blocks?: ContentBlock[];
          reasoning?: string[];
          followUps?: { label: string; query: string }[];
          session?: CounsellingSession;
          /**
           * A typed "what's my nearest centre" with no city named and no
           * shared coordinates — the server declined to guess and wants the
           * same interactive location-or-city prompt the "📍 Nearest centre"
           * chip already opens (see STARTERS.locations). Reuse it here
           * rather than rendering `data.text` as a flat, chip-less answer.
           */
          askLocation?: boolean;
          leadForm?: LeadFormContext;
        }) => {
          if (data?.session) sessionRef.current = data.session;
          if (data?.askLocation) awaitingCityRef.current = true;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === thinkingId
                ? {
                    id: thinkingId,
                    role: 'assistant',
                    kind: 'text',
                    text: data?.askLocation ? STARTERS.locations.message : (data?.text ?? GATE_TEXT),
                    title: data?.title,
                    source: data?.source,
                    blocks: data?.askLocation ? undefined : data?.blocks,
                    reasoning: data?.reasoning,
                    followUps: data?.askLocation ? undefined : data?.followUps,
                    chips: data?.askLocation ? STARTERS.locations.chips : undefined,
                    leadForm: data?.askLocation ? undefined : data?.leadForm,
                  }
                : msg,
            ),
          );
        },
      )
      .catch(() =>
        replaceWithText("I couldn't reach the Jetking assistant just now. Please try again."),
      )
      .finally(() => setBusy(false));
  }, []);

  const startIntent = useCallback(
    (key: IntentKey) => {
    // Signed in with a saved city: answer "nearest centre" for it straight away instead of asking again.
    if (key === 'locations' && homeCityRef.current) {
      awaitingCityRef.current = false;
      runLocal(`Jetking centre in ${homeCityRef.current}`, messagesRef.current);
      return;
    }
    awaitingCityRef.current = key === 'locations';
    const starter = STARTERS[key];
    setMessages((m) => [
      ...m,
      {
        id: nextId(),
        role: 'assistant',
        kind: 'text',
        text: starter.message,
        chips: starter.chips,
      },
    ]);
  },
    [runLocal],
  );

  const ask = useCallback(
    (query: string, label?: string) => {
      awaitingCityRef.current = false;
      const prior = messagesRef.current;
      setMessages((m) => [...m, { id: nextId(), role: 'user', text: label ?? query }]);
      const talk = smallTalk(query);
      if (talk) {
        setMessages((m) => [
          ...m,
          { id: nextId(), role: 'assistant', kind: 'text', text: talk.text },
        ]);
        return;
      }
      runLocal(query, prior);
    },
    [runLocal],
  );

  // `/chatbot?q=…` asks that question on arrival; the param is then dropped so a
  // reload doesn't ask it twice.
  const initialAskedRef = useRef(false);
  useEffect(() => {
    if (initialAskedRef.current) return;
    initialAskedRef.current = true;
    const url = new URL(window.location.href);
    const q = url.searchParams.get('q')?.trim().slice(0, 500);
    if (!q) return;
    url.searchParams.delete('q');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    ask(q);
  }, [ask]);

  /**
   * The "📌 Use my current location" chip — asks the browser's Geolocation
   * API for coordinates (a real permission prompt) rather than making the
   * user type a city, then sends them straight through the same runLocal
   * path resolveCentreAnswerByCoords answers server-side. Denied/unsupported/
   * timed-out geolocation falls back to the existing "which city" chips
   * rather than dead-ending the conversation.
   */
  const askMyLocation = useCallback(() => {
    awaitingCityRef.current = false;
    const prior = messagesRef.current;
    const cityChips = STARTERS.locations.chips!.filter((c) => !c.geolocate);
    const geoChip = STARTERS.locations.chips!.find((c) => c.geolocate);
    setMessages((m) => [
      ...m,
      { id: nextId(), role: 'user', text: geoChip?.label ?? 'Use my current location' },
    ]);
    const askForCityInstead = (text: string) => {
      awaitingCityRef.current = true;
      setBusy(false);
      setMessages((m) => [
        ...m,
        { id: nextId(), role: 'assistant', kind: 'text', text, chips: cityChips },
      ]);
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      askForCityInstead("This browser can't share your location. Which city are you in?");
      return;
    }

    const thinkingId = nextId();
    setBusy(true);
    setMessages((m) => [...m, { id: thinkingId, role: 'assistant', kind: 'thinking' }]);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMessages((m) => m.filter((msg) => msg.id !== thinkingId));
        runLocal('Where is my nearest Jetking centre?', prior, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setMessages((m) => m.filter((msg) => msg.id !== thinkingId));
        askForCityInstead("I couldn't access your location. Which city are you in?");
      },
      { timeout: 8000, maximumAge: 300000 },
    );
  }, [runLocal]);

  const onIntent = useCallback(
    (key: IntentKey) => {
      setActiveKey(key);
      setDrawerOpen(false);
      setInfoOpen(false);
      if (key === 'welcome') {
        startNewChat();
        return;
      }
      const item = MENU_GROUPS.flatMap((g) => g.items).find((i) => i.key === key);
      if (item) setMessages((m) => [...m, { id: nextId(), role: 'user', text: item.label }]);
      startIntent(key);
    },
    [startIntent, startNewChat],
  );

  const onQuery = useCallback(
    (query: string, label: string) => {
      setDrawerOpen(false);
      setInfoOpen(false);
      ask(query, label);
    },
    [ask],
  );

  const onChip = useCallback(
    (chip: Chip) => {
      if (chip.geolocate) {
        askMyLocation();
      } else if (chip.intent) {
        setMessages((m) => [...m, { id: nextId(), role: 'user', text: chip.label }]);
        startIntent(chip.intent);
      } else if (chip.query) {
        ask(chip.query, chip.label);
      }
    },
    [ask, startIntent, askMyLocation],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = draft.trim();
    if (!q || busy) return;
    setDraft('');
    // Free-typing a reply to "Which city are you in?" instead of tapping one
    // of its chips — frame it the same way those chips do, so the server
    // reliably reads it as a location question. See awaitingCityRef above.
    if (awaitingCityRef.current) {
      ask(`Jetking centre in ${q}`, q);
      return;
    }
    ask(q);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas text-ink">
      {boot !== 'gone' ? (
        <div
          className={cn(
            'transition-opacity duration-300',
            boot === 'fade' && 'pointer-events-none opacity-0',
          )}
        >
          <JetkingLoader />
        </div>
      ) : null}

      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-1.5 min-[360px]:h-[62px] min-[360px]:gap-2 min-[360px]:px-2.5 sm:h-[68px] sm:gap-4 sm:px-6">
        <button
          className="grid size-10 shrink-0 place-items-center rounded-lg text-ink hover:bg-surface-hover min-[360px]:size-11"
          onClick={() => {
            setInfoOpen(false);
            setDrawerOpen(true);
          }}
          aria-label="Open menu"
        >
          <Menu className="size-4 min-[360px]:size-5" />
        </button>
        <BrandLockup />
        <div className="ml-auto flex shrink-0 items-center gap-1 min-[360px]:gap-1.5 sm:gap-3">
          <Link
            href="/"
            className="inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border border-line text-ink transition-colors hover:bg-surface-hover min-[360px]:size-11 sm:w-auto sm:px-3"
            aria-label="Switch to Jetking website"
          >
            <Globe2 className="size-[15px] min-[360px]:size-4" />
            <span className="hidden text-[12px] font-bold sm:inline">Website</span>
          </Link>
          <button
            onClick={() => onIntent('enquire')}
            className="min-h-10 shrink-0 rounded-full bg-jk-600 px-3 min-[360px]:min-h-11 text-[12px] font-bold whitespace-nowrap text-white transition-colors hover:bg-jk-700 sm:px-5 sm:text-[13px]"
          >
            Enquire now
          </button>
          <button
            onClick={() => {
              if (account.user) {
                setInfoOpen(false);
                setDrawerOpen(true);
              } else {
                setAuthOpen(true);
              }
            }}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-ink hover:bg-surface-hover min-[360px]:size-11"
            aria-label={account.user ? `Account: ${account.user.name}` : 'Log in or sign up'}
            title={account.user ? account.user.name : 'Log in or sign up'}
          >
            {account.user ? (
              <span className="text-[13px] font-bold text-brand-text sm:text-[14px]">
                {account.user.name.trim().charAt(0).toUpperCase() || '?'}
              </span>
            ) : (
              <User className="size-[15px] min-[360px]:size-4 sm:size-[18px]" />
            )}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {drawerOpen ? (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(100%,300px)] [animation:jk-slide_0.24s_var(--ease-out-soft)_both] flex-col shadow-lg shadow-black/35">
              <button
                className="absolute top-4 right-3 z-10 grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-hover"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
              <LeftSidebar
                activeKey={activeKey}
                onIntent={onIntent}
                onQuery={onQuery}
                account={{
                  user: account.user,
                  ready: account.ready,
                  history: account.history,
                  activeConversationId,
                  onLogin: () => {
                    setDrawerOpen(false);
                    setAuthOpen(true);
                  },
                  onLogout: handleLogout,
                  onOpenChat: openChat,
                  onDeleteChat: setPendingDeleteId,
                }}
              />
            </div>
          </div>
        ) : null}

        {infoOpen ? (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setInfoOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 right-0 flex w-[min(100%,360px)] [animation:jk-slide-right_0.24s_var(--ease-out-soft)_both] flex-col border-line bg-surface-sunken shadow-drawer">
              <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-[15px] font-extrabold tracking-wide text-ink">
                  Quick info
                </h2>
                <button
                  className="grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-hover"
                  onClick={() => setInfoOpen(false)}
                  aria-label="Close info panel"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="scrollbar-subtle flex-1 overflow-y-auto p-5">
                <RightSidebar onIntent={onIntent} onQuery={onQuery} />
              </div>
            </div>
          </div>
        ) : null}

        {/* A div, not <main>: the root layout's <main id="main"> already wraps this page. */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-4 border-b border-line px-5 py-4 sm:px-8">
            <div className="min-w-0">
              <h1 className="font-display text-[19px] font-extrabold tracking-tight text-ink sm:text-[21px]">
                Chat with Jetking AI
              </h1>
              <p className="mt-0.5 text-[13px] text-ink-subtle">
                {account.user
                  ? `Hi ${account.user.name.trim().split(/\s+/)[0]}! How can I help you today?`
                  : 'Hi! How can I help you today?'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setInfoOpen(true);
                }}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-ink-muted transition-colors hover:border-jk-300 hover:bg-brand-soft hover:text-brand-text"
                aria-label="Open quick info"
                title="Quick info"
              >
                <PanelRight className="size-5" />
              </button>
            </div>
          </div>

          <div className="scrollbar-subtle flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
            {messages.map((msg, index) => {
              const isLatest = index === messages.length - 1;
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="jk-msg-in flex items-end justify-end gap-2.5">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-white shadow-brand">
                      <p className="text-[14px] leading-relaxed">{msg.text}</p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[12px] text-white/75">
                        {'11:30 AM'} <CheckCheck className="size-3.5" />
                      </div>
                    </div>
                    <UserAvatar />
                  </div>
                );
              }
              if (msg.kind === 'thinking') {
                return (
                  <AssistantRow key={msg.id}>
                    <ThinkingSteps />
                  </AssistantRow>
                );
              }
              return (
                <AssistantTextBubble
                  key={msg.id}
                  msg={msg}
                  animate={isLatest && index >= restoredCount}
                  onAsk={(query) => ask(query)}
                  onChip={onChip}
                  user={account.user}
                />
              );
            })}
            <div ref={bottomRef} id="jk-chat-end" />
          </div>

          <div className="border-t border-line px-3 py-3 min-[360px]:px-4 min-[360px]:py-4 sm:px-8">
            {account.ready && !account.user && !nudgeDismissed && messages.some((m) => m.role === 'user') ? (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-brand-soft py-2 pr-2 pl-3.5">
                <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-muted">
                  Log in to save this chat and pick it up later.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="min-h-11 shrink-0 rounded-lg bg-brand px-3.5 text-[12px] font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => setNudgeDismissed(true)}
                  aria-label="Dismiss"
                  className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : null}
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 shadow-sm focus-within:border-jk-300 focus-within:shadow-md focus-within:shadow-jk-500/15 min-[360px]:gap-2.5 min-[360px]:px-4 min-[360px]:py-2.5 sm:gap-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Ask Jetking AI"
                placeholder="Ask Jetking AI… English or Hinglish"
                className="h-10 min-w-0 flex-1 bg-transparent text-[12px] text-ink min-[360px]:h-11 outline-none placeholder:text-[12px] placeholder:text-ink-subtle min-[360px]:text-[13px] min-[360px]:placeholder:text-[12px] sm:text-[14.5px] sm:placeholder:text-[14.5px]"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white shadow-brand transition-colors hover:bg-brand-hover disabled:opacity-45 min-[360px]:size-11"
                aria-label={busy ? 'Thinking' : 'Send'}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin min-[360px]:size-[18px]" />
                ) : (
                  <Send className="size-4 -translate-x-px translate-y-px min-[360px]:size-[18px]" />
                )}
              </button>
            </form>
            <div className="mt-2.5 flex items-start justify-center gap-1.5 px-1 text-center text-[13.5px] leading-5 text-ink-subtle sm:items-center sm:text-[13.5px]">
              <Bot className="mt-px size-3.5 shrink-0 sm:mt-0" />
              <p className="max-w-full min-w-0 text-balance">
                Powered by <span className="font-semibold text-brand-text">Jetking AI</span> · answers
                from the Jetking knowledge base
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        account={account}
      />
      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Delete this chat?"
        description="It will be removed from your saved chats. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeleteChat}
      />
    </div>
  );
}
