import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { describeRemaining } from '../../services/status';
import type { ScheduleStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ROW_LINK } from './rowStyles';

/** Whole row is one link → /assets/:id */
export function AlertRow({ item }: { item: ScheduleStatus }) {
  return (
    <Link to={`/assets/${item.asset.id}`} className={ROW_LINK}>
      <StatusBadge status={item.status} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-xl font-semibold">{item.asset.name}</span>
        <span className="block truncate text-sm text-muted">{item.schedule.task}</span>
      </span>
      <span className="shrink-0 font-display text-lg font-semibold tabular-nums">
        {describeRemaining(item)}
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
