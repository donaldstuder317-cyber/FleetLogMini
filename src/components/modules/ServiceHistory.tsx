import { ChevronDown } from 'lucide-react';
import { formatDate } from '../../lib/dates';
import { cn } from '../../lib/cn';
import { formatCurrency, formatNumber } from '../../lib/format';
import type { ServiceEntry } from '../../types';

interface ServiceHistoryProps {
  entries: ServiceEntry[]; // newest first
  unit: string;
  highlightId: string | null;
}

/** Disclosure list on mobile, semantic <table> at lg:. */
export function ServiceHistory({ entries, unit, highlightId }: ServiceHistoryProps) {
  return (
    <>
      <ul className="flex flex-col gap-2 lg:hidden">
        {entries.map((e) => (
          <li
            key={e.id}
            data-testid="history-row"
            className={cn(
              'rounded-xl border border-line bg-surface',
              e.id === highlightId && 'motion-safe:animate-slide-in',
            )}
          >
            <details className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{e.task}</span>
                  <span className="block text-sm tabular-nums text-muted">{formatDate(e.date)}</span>
                </span>
                <span className="font-display text-lg font-semibold tabular-nums">
                  {formatCurrency(e.partsCost)}
                </span>
                <ChevronDown
                  size={20}
                  className="text-muted motion-safe:transition-transform motion-safe:duration-150 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <dl className="grid grid-cols-2 gap-2 border-t border-line px-4 py-3 text-sm">
                <dt className="text-muted">Reading</dt>
                <dd className="tabular-nums">{formatNumber(e.reading)} {unit}</dd>
                <dt className="text-muted">Notes</dt>
                <dd>{e.notes || '—'}</dd>
              </dl>
            </details>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border border-line lg:block">
        <table className="w-full text-left text-base">
          <thead className="bg-surface text-sm text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">Task</th>
              <th scope="col" className="px-4 py-3 font-medium">Reading</th>
              <th scope="col" className="px-4 py-3 font-medium">Notes</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Parts cost</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                data-testid="history-row"
                className={cn(
                  'border-t border-line hover:bg-raised',
                  e.id === highlightId && 'motion-safe:animate-slide-in',
                )}
              >
                <td className="px-4 py-3 tabular-nums">{formatDate(e.date)}</td>
                <td className="px-4 py-3">{e.task}</td>
                <td className="px-4 py-3 tabular-nums">{formatNumber(e.reading)} {unit}</td>
                <td className="px-4 py-3 text-muted">{e.notes || '—'}</td>
                <td className="px-4 py-3 text-right font-display font-semibold tabular-nums">
                  {formatCurrency(e.partsCost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
