import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { describeRemaining } from '../../services/status';
import type { ScheduleStatus } from '../../types';
import { DEADLINE_HIGHLIGHT, DeadlineBadge } from '../common/DeadlineBadge';
import { cn } from '../../lib/cn';
import { StatusBadge } from '../common/StatusBadge';
import { ROW_LINK } from './rowStyles';

/** Whole row is one link → /assets/:id */
export function AlertRow({ item, deadlined = false }: { item: ScheduleStatus; deadlined?: boolean }) {
  return (
    <Link to={`/assets/${item.asset.id}`} className={ROW_LINK}>
      {/* DEADLINE overrides the schedule status: only one badge per alert. */}
      {deadlined ? <DeadlineBadge /> : <StatusBadge status={item.status} />}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl font-semibold">
          <span className={deadlined ? cn(DEADLINE_HIGHLIGHT, 'truncate align-top') : 'block truncate'}>{item.asset.name}</span>
        </span>
        <span className="block truncate text-sm text-muted">{item.schedule.task}</span>
      </span>
      <span className="shrink-0 font-display text-lg font-semibold tabular-nums">
        {describeRemaining(item)}
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
