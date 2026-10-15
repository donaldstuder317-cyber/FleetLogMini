import { describeInterval, describeRemaining } from '../../services/status';
import type { ScheduleStatus } from '../../types';
import { IntervalRing } from '../common/IntervalRing';
import { StatusBadge } from '../common/StatusBadge';

export function ScheduleRow({ item }: { item: ScheduleStatus }) {
  const overdue = item.status === 'overdue';
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <IntervalRing percent={item.percent} status={item.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xl font-semibold">{item.schedule.task}</p>
        <p className="text-sm text-muted">{describeInterval(item.schedule)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={item.status} />
        <span className="font-display text-base font-semibold tabular-nums">
          {overdue ? `OVERDUE by ${describeRemaining(item).replace(' over', '')}` : describeRemaining(item)}
        </span>
      </div>
    </li>
  );
}
