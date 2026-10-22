import { formatCurrency } from '../../lib/format';
import { toggleAllFaults, toggleFault } from '../../services/fleetService';
import type { Fault } from '../../types';
import { DeadlineBadge } from '../common/DeadlineBadge';
import { Checkbox } from './controls';

interface FaultsCorrectedFieldProps {
  /** Open faults of the selected asset, newest first. */
  faults: Fault[];
  /** Picked fault ids; empty = None. */
  selected: string[];
  onChange: (ids: string[]) => void;
}

const OPTION = 'flex min-h-11 items-center gap-3';

/** "Faults corrected": None (default), All, or any mix of the asset's open faults. */
export function FaultsCorrectedField({ faults, selected, onChange }: FaultsCorrectedFieldProps) {
  return (
    <fieldset className="rounded-xl border border-line bg-surface p-4">
      <legend className="px-1 text-sm font-medium">Faults corrected</legend>
      {faults.length === 0 ? (
        <p className="text-sm text-muted">No open faults</p>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-x-6">
            <label className={OPTION}>
              {/* Ticked None can't be unticked (pick a fault instead), so it is announced as unavailable. */}
              <Checkbox checked={selected.length === 0} aria-disabled={selected.length === 0 || undefined} onChange={() => onChange([])} />
              None
            </label>
            <label className={OPTION}>
              <Checkbox checked={selected.length === faults.length} onChange={() => onChange(toggleAllFaults(selected, faults))} />
              All
            </label>
          </div>
          <ul className="flex flex-col gap-1 border-t border-line pt-1">
            {faults.map((f) => (
              <li key={f.id}>
                <label className={OPTION}>
                  <Checkbox checked={selected.includes(f.id)} onChange={() => onChange(toggleFault(selected, faults, f.id))} />
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 py-1">
                    <span className="break-words">{f.description}</span>
                    <span className="text-sm tabular-nums text-muted">{formatCurrency(f.cost)}</span>
                    {f.deadline && <DeadlineBadge />}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </fieldset>
  );
}
