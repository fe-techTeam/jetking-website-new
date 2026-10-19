import { Check, Minus } from 'lucide-react';

export interface ComparisonRow {
  criterion: string;
  us: string | boolean;
  others: string | boolean;
}

function Cell({ v, us }: { v: string | boolean; us?: boolean }) {
  if (v === true)
    return (
      <span className="inline-flex items-center gap-1.5 font-bold">
        <Check className={`h-4 w-4 ${us ? 'text-[var(--k-red)]' : 'text-[var(--k-ink-3)]'}`} aria-hidden="true" />
        <span className="sr-only">Yes</span>
      </span>
    );
  if (v === false)
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--k-ink-3)]">
        <Minus className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">No</span>
      </span>
    );
  return <span>{v}</span>;
}

/**
 * Us-versus-the-alternative table. One semantic table at every width (three columns fit a phone);
 * the "us" column is picked out with a red-wash fill, not a different colour. Only compare on facts
 * we can stand behind.
 */
export function ComparisonTable({
  caption,
  usLabel = 'Jetking',
  othersLabel = 'Typical online course',
  rows,
}: {
  caption: string;
  usLabel?: string;
  othersLabel?: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className="kit kit-card overflow-hidden">
      <table className="w-full border-collapse text-left text-[14px] sm:text-[15.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--k-line)]">
            <th scope="col" className="w-[40%] p-3.5 text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase sm:p-5">
              &nbsp;
            </th>
            <th scope="col" className="bg-[var(--k-red-wash)] p-3.5 text-[14px] font-extrabold text-[var(--k-red)] sm:p-5 sm:text-[16px]">
              {usLabel}
            </th>
            <th scope="col" className="p-3.5 text-[14px] font-bold text-[var(--k-ink-2)] sm:p-5 sm:text-[16px]">
              {othersLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.criterion} className="border-b border-[var(--k-line)] last:border-b-0">
              <th scope="row" className="p-3.5 font-semibold text-[var(--k-ink)] sm:p-5">
                {r.criterion}
              </th>
              <td className="bg-[var(--k-red-wash)] p-3.5 font-semibold text-[var(--k-ink)] sm:p-5">
                <Cell v={r.us} us />
              </td>
              <td className="p-3.5 text-[var(--k-ink-2)] sm:p-5">
                <Cell v={r.others} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
