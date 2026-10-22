import type { ReactNode } from 'react';
import { describeInterval, describeRemaining } from '../../services/status';
import type { ScheduleStatus } from '../../types';
import { IntervalRing } from '../common/IntervalRing';
import { StatusBadge } from '../common/StatusBadge';
import { EditControl } from './EditControl';

interface ScheduleRowProps {
  item: ScheduleStatus;
  editing: boolean;
  onEdit: (trigger: HTMLButtonElement) => void;
  /** The interval edit form, shown below the row while editing. */
  editor: ReactNode;
}

/** Badge + countdown sit under the task name, so the name never truncates in narrow cards. */
export function ScheduleRow({ item, editing, onEdit, editor }: ScheduleRowProps) {
  const overdue = item.status === 'overdue';
  return (
    <li className="rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-3 px-4 py-3">
        <IntervalRing percent={item.percent} status={item.status} />
        <div className="min-w-0 flex-1">
          <p className="break-words font-display text-xl font-semibold">{item.schedule.task}</p>
          <p className="text-sm text-muted">{describeInterval(item.schedule)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={item.status} />
            <span className="font-display text-base font-semibold tabular-nums">
              {overdue ? `OVERDUE by ${describeRemaining(item).replace(' over', '')}` : describeRemaining(item)}
            </span>
          </div>
        </div>
        <EditControl label={`Edit ${item.schedule.task} interval`} expanded={editing} onClick={onEdit} />
      </div>
      {editing && <div className="border-t border-line p-3">{editor}</div>}
    </li>
  );
}
