'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { AdminConfirmDialog } from './AdminConfirmDialog';

/**
 * "Reset CMS from fixtures" replaces every CMS record with the in-repo fixture set — a one-click
 * wipe of all editorial work. It now goes through the same confirm dialog as record deletes
 * instead of submitting straight from the button. The server action is passed in as a prop so
 * the dashboard (a Server Component) keeps owning the role check that decides whether this
 * card renders at all.
 */
export function ResetFixturesCard({ action }: { action: () => Promise<void> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirmReset() {
    start(async () => {
      setError(null);
      try {
        await action();
        setDone(true);
        setOpen(false);
        router.refresh();
      } catch {
        setError('The reset did not complete. Nothing was confirmed as changed — check the CMS store and try again.');
        setOpen(false);
      }
    });
  }

  return (
    <section
      aria-labelledby="reset-fixtures-heading"
      className="mt-4 flex flex-col gap-5 rounded-[var(--radius-card)] border border-[var(--color-error-200)] bg-[var(--color-error-50)]/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex min-w-0 gap-4">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-white text-[var(--color-error-600)] ring-1 ring-[var(--color-error-200)]"
        >
          <TriangleAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 id="reset-fixtures-heading" className="text-base font-bold tracking-tight text-foreground">
            Reset from fixtures
          </h2>
          <p className="mt-1 max-w-prose text-sm text-foreground-secondary">
            Replaces every CMS record with the in-repo fixture set. Use on staging when seeding a fresh
            environment — it discards unsaved editorial work.
          </p>
          {done ? (
            <p aria-live="polite" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#067647]">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              CMS reset from fixtures.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-2 text-sm font-semibold text-[#b42318]">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setDone(false);
          setError(null);
          setOpen(true);
        }}
        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--admin-radius)] border border-[var(--color-error-600)]/40 bg-white px-5 text-sm font-bold text-[#b42318] transition-colors hover:border-[var(--color-error-600)] hover:bg-[var(--color-error-600)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--color-error-600)]"
      >
        Reset CMS from fixtures
      </button>

      <AdminConfirmDialog
        open={open}
        onOpenChange={(next) => !pending && setOpen(next)}
        title="Reset all CMS content?"
        description={
          <>
            This replaces <span className="font-semibold text-foreground">every record in every collection</span>{' '}
            with the in-repo fixtures and republishes the site. Any edits saved in the CMS will be lost,
            and this cannot be undone.
          </>
        }
        confirmLabel="Reset everything"
        pendingLabel="Resetting…"
        pending={pending}
        onConfirm={confirmReset}
      />
    </section>
  );
}
