'use client';

/**
 * Lightweight bot protection for lead forms, with no third-party service.
 *
 *  - A honeypot field real visitors never see or fill, but form-scraping bots do.
 *  - A "time since first interaction" signal: scripted submissions arrive with no prior focus/pointer
 *    events, or within milliseconds of them.
 *
 * `botFields()` is spread into the request body; `/api/enquiry` quietly drops flagged submissions (it
 * answers "ok" so a bot learns nothing). Add `<BotTrap />` inside the <form>.
 */

let firstInteraction = 0;

if (typeof window !== 'undefined') {
  const mark = () => {
    if (!firstInteraction) firstInteraction = Date.now();
  };
  document.addEventListener('focusin', mark, true);
  document.addEventListener('pointerdown', mark, true);
  document.addEventListener('keydown', mark, true);
}

export const HONEYPOT_NAME = 'company_site';

/** Fields to merge into the enquiry request body. */
export function botFields(): { hp: string; ft: number } {
  const trap = typeof document !== 'undefined' ? document.querySelector<HTMLInputElement>(`input[name="${HONEYPOT_NAME}"]`) : null;
  return { hp: trap?.value ?? '', ft: firstInteraction ? Date.now() - firstInteraction : 0 };
}

export function BotTrap() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Leave this field empty
        <input type="text" name={HONEYPOT_NAME} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
