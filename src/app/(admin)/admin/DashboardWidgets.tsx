import Link from 'next/link';
import type { Route } from 'next';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

/**
 * Dashboard widgets — icon-tile stat cards, a bar chart and a donut, hand-rolled
 * SVG/CSS rather than a charting dependency (two static, non-interactive charts).
 * Every number is real, computed from the CMS store / leads table. There is no
 * time-series data in this app, so a card shows a real derived figure (e.g. "3
 * drafts") or nothing — never a fabricated trend.
 *
 * `href` on a stat card or bar row makes it a shortcut to the list it summarises.
 */

function StatCardBody({
  Icon,
  label,
  value,
  badge,
  badgeClass,
  linkable,
  meter,
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  badge?: string;
  badgeClass: string;
  linkable: boolean;
  meter?: { percent: number; caption: string };
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid h-11 w-11 place-items-center rounded-[13px] bg-[var(--accent-soft)] ring-1 ring-[var(--accent-border)]/60">
          <Icon aria-hidden="true" className="h-5 w-5 text-[var(--accent)]" strokeWidth={2} />
        </div>
        {badge ? (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass}`}>{badge}</span>
        ) : linkable ? (
          <ArrowUpRight
            aria-hidden="true"
            className="h-[18px] w-[18px] text-foreground-muted/60 transition-colors group-hover:text-[var(--accent)]"
          />
        ) : null}
      </div>

      <p className="numeral mt-4 text-[1.875rem] sm:mt-5 sm:text-[2.125rem] leading-none font-extrabold tracking-[-0.035em] text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground-secondary">{label}</p>

      {meter ? (
        <div className="mt-4">
          <div
            role="img"
            aria-label={`${meter.caption}: ${meter.percent}%`}
            className="h-1.5 overflow-hidden rounded-full bg-surface"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f97066] to-[var(--accent)]"
              style={{ width: `${meter.percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-foreground-muted">{meter.caption}</p>
        </div>
      ) : null}
    </>
  );
}

export function StatCard({
  icon,
  label,
  value,
  badge,
  badgeTone = 'neutral',
  href,
  meter,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  badge?: string;
  badgeTone?: 'good' | 'warn' | 'neutral';
  /** Where clicking the card should go — omit for a purely aggregate figure
   *  (e.g. total content across every collection) with no single destination. */
  href?: Route;
  /** A real proportion to draw under the figure (e.g. share of content that is published). */
  meter?: { percent: number; caption: string };
}) {
  const badgeClass =
    badgeTone === 'good'
      ? 'bg-[var(--color-growth-50)] text-[#067647]'
      : badgeTone === 'warn'
        ? 'bg-[var(--color-signal-50)] text-[#b54708]'
        : 'bg-surface text-foreground-secondary';

  if (href) {
    return (
      <Link href={href} className="adm-card adm-card-link group block p-4 sm:p-5">
        <StatCardBody
          Icon={icon}
          label={label}
          value={value}
          badge={badge}
          badgeClass={badgeClass}
          linkable
          meter={meter}
        />
      </Link>
    );
  }

  return (
    <div className="adm-card p-4 sm:p-5">
      <StatCardBody
        Icon={icon}
        label={label}
        value={value}
        badge={badge}
        badgeClass={badgeClass}
        linkable={false}
        meter={meter}
      />
    </div>
  );
}

export function BarChartCard({
  title,
  description,
  bars,
}: {
  title: string;
  description: string;
  bars: Array<{ label: string; value: number; href?: Route }>;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <section aria-label={title} className="adm-card p-5 sm:p-6">
      <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-foreground-muted">{description}</p>
      <div className="mt-5 flex flex-col gap-0.5">
        {bars.map((bar) => {
          const row = (
            <>
              <span className="w-32 shrink-0 text-sm leading-tight font-medium text-foreground-secondary group-hover:text-foreground sm:w-40">
                {bar.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f97066] to-[var(--accent)]"
                  style={{ width: `${Math.max((bar.value / max) * 100, bar.value > 0 ? 3 : 0)}%` }}
                />
              </div>
              <span className="numeral w-9 shrink-0 text-right text-sm font-bold text-foreground">
                {bar.value}
              </span>
            </>
          );
          return bar.href ? (
            <Link
              key={bar.label}
              href={bar.href}
              className="group -mx-2 flex min-h-11 items-center gap-3 rounded-[10px] px-2 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            >
              {row}
            </Link>
          ) : (
            <div key={bar.label} className="flex min-h-11 items-center gap-3 px-2">
              {row}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DonutChartCard({
  title,
  description,
  segments,
}: {
  title: string;
  description: string;
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 60;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section aria-label={title} className="adm-card p-5 sm:p-6">
      <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-foreground-muted">{description}</p>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-40 w-40 shrink-0">
          <svg aria-hidden="true" viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--color-surface)" strokeWidth={strokeWidth} />
            {total > 0
              ? segments.map((seg) => {
                  if (seg.value === 0) return null;
                  const fraction = seg.value / total;
                  const dash = fraction * circumference;
                  const circle = (
                    <circle
                      key={seg.label}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += dash;
                  return circle;
                })
              : null}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="numeral text-[1.75rem] leading-none font-extrabold tracking-[-0.03em] text-foreground">
                {total}
              </p>
              <p className="mt-1 text-xs font-medium text-foreground-muted">records</p>
            </div>
          </div>
        </div>

        <ul className="flex w-full flex-1 flex-col gap-2">
          {segments.map((seg) => (
            <li
              key={seg.label}
              className="flex items-center gap-3 rounded-[12px] border border-border bg-surface/60 px-3.5 py-3 text-sm"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-medium text-foreground-secondary">{seg.label}</span>
              <span className="numeral ml-auto text-xs text-foreground-muted">{seg.value}</span>
              <span className="numeral w-11 text-right font-bold text-foreground">
                {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
