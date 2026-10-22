import { Fragment, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { formatDate } from '../../lib/dates';
import { cn } from '../../lib/cn';
import { formatCurrency, formatNumber } from '../../lib/format';
import type { ServiceEntry } from '../../types';
import { DeleteControl } from './DeleteControl';
import { EditControl } from './EditControl';

function rowLabel(e: ServiceEntry) {
  return `${e.task} entry from ${formatDate(e.date)}`;
}

interface ServiceHistoryProps {
  entries: ServiceEntry[]; // newest first
  unit: string;
  highlightId: string | null;
  onDelete: (entry: ServiceEntry) => Promise<void>;
  /** Id of the entry whose edit form is open, if any. */
  editingId: string | null;
  onEdit: (entry: ServiceEntry, trigger: HTMLButtonElement) => void;
  renderEditor: (entry: ServiceEntry) => ReactNode;
}

/** Disclosure list on mobile, semantic <table> at lg:. The edit form renders only in the visible one. */
export function ServiceHistory({ entries, unit, highlightId, onDelete, editingId, onEdit, renderEditor }: ServiceHistoryProps) {
  const wide = useMediaQuery('(min-width: 1024px)');

  function actions(e: ServiceEntry) {
    return (
      <div className="flex items-center justify-end gap-1">
        <EditControl label={`Edit ${rowLabel(e)}`} expanded={editingId === e.id} onClick={(t) => onEdit(e, t)} />
        <DeleteControl label={`Delete ${rowLabel(e)}`} question="Delete this entry?" onConfirm={() => onDelete(e)} />
      </div>
    );
  }

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
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg [&::-webkit-details-marker]:hidden">
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
              <div className="px-4 pb-3">{actions(e)}</div>
            </details>
            {!wide && editingId === e.id && <div className="border-t border-line p-3">{renderEditor(e)}</div>}
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
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <Fragment key={e.id}>
                <tr
                  data-testid="history-row"
                  className={cn(
                    'border-t border-line hover:bg-raised',
                    e.id === highlightId && 'motion-safe:animate-slide-in',
                  )}
                >
                  <td className="px-4 py-3 tabular-nums">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">{e.task}</td>
                  <td className="px-4 py-3 tabular-nums">{formatNumber(e.reading)} {unit}</td>
                  <td className="px-4 py-3 text-muted lg:min-w-36">{e.notes || '—'}</td>
                  <td className="px-4 py-3 text-right font-display font-semibold tabular-nums">
                    {formatCurrency(e.partsCost)}
                  </td>
                  <td className="px-4 py-1 text-right lg:min-w-56">{actions(e)}</td>
                </tr>
                {wide && editingId === e.id && (
                  <tr>
                    <td colSpan={6} className="px-4 pb-4">{renderEditor(e)}</td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
