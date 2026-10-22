import type { ReactNode } from 'react';
import { formatDate } from '../../lib/dates';
import { formatCurrency } from '../../lib/format';
import type { Fault } from '../../types';
import { DeadlineBadge } from '../common/DeadlineBadge';
import { DeleteControl } from './DeleteControl';
import { EditControl } from './EditControl';

interface FaultListProps {
  faults: Fault[]; // newest first
  onDelete: (fault: Fault) => Promise<void>;
  /** Id of the fault whose edit form is open, if any. */
  editingId: string | null;
  onEdit: (fault: Fault, trigger: HTMLButtonElement) => void;
  renderEditor: (fault: Fault) => ReactNode;
  /** For the corrected list: the date of the service that fixed each fault. */
  correctedOn?: (fault: Fault) => string | undefined;
}

export function FaultList({ faults, onDelete, editingId, onEdit, renderEditor, correctedOn }: FaultListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {faults.map((f) => {
        const fixed = correctedOn?.(f);
        return (
          <li key={f.id} data-testid={correctedOn ? 'corrected-fault-row' : 'fault-row'} className="rounded-xl border border-line bg-surface">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-sm tabular-nums text-muted">
                  <span>{formatDate(f.date)}</span>
                  <span>· {formatCurrency(f.cost)}</span>
                  {correctedOn && <span>· Corrected{fixed ? ` ${formatDate(fixed)}` : ''}</span>}
                </p>
                <p className="break-words">{f.description}</p>
                {!correctedOn && f.deadline && <DeadlineBadge className="mt-1" />}
              </div>
              <div className="flex items-center gap-1">
                <EditControl
                  label={`Edit fault from ${formatDate(f.date)}: ${f.description}`}
                  expanded={editingId === f.id}
                  onClick={(t) => onEdit(f, t)}
                />
                <DeleteControl
                  label={`Delete fault from ${formatDate(f.date)}: ${f.description}`}
                  question="Delete this fault?"
                  onConfirm={() => onDelete(f)}
                />
              </div>
            </div>
            {editingId === f.id && <div className="border-t border-line p-3">{renderEditor(f)}</div>}
          </li>
        );
      })}
    </ul>
  );
}
