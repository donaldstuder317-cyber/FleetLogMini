import type { Status } from '../../types';
import { cn } from '../../lib/cn';
import { STATUS_LABEL } from '../../services/status';

const TONE: Record<Status, string> = {
  overdue: 'text-danger',
  due: 'text-warn',
  good: 'text-good',
};

/** Counts of Overdue / Due Soon / Good assets. */
export function SummaryStrip({ counts }: { counts: Record<Status, number> }) {
  const order: Status[] = ['overdue', 'due', 'good'];
  return (
    <dl className="grid grid-cols-3 gap-3" aria-label="Fleet summary">
      {order.map((s) => (
        <div key={s} className="rounded-xl border border-line bg-surface p-3 md:p-4">
          <dt className="text-sm text-muted">{STATUS_LABEL[s]}</dt>
          <dd className={cn('font-display text-3xl font-bold tabular-nums', TONE[s])}>{counts[s]}</dd>
        </div>
      ))}
    </dl>
  );
}
