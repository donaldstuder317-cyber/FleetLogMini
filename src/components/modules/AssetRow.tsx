import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { describeRemaining } from '../../services/status';
import { cn } from '../../lib/cn';
import type { Asset, ScheduleStatus, Status } from '../../types';
import { DEADLINE_HIGHLIGHT, DeadlineBadge } from '../common/DeadlineBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ROW_LINK } from './rowStyles';

interface AssetRowProps {
  asset: Asset;
  status: Status;
  urgent?: ScheduleStatus;
  /** Has an open DEADLINE fault: the DEADLINE badge replaces the status badge, red highlight behind the name. */
  deadlined?: boolean;
}

/** Whole row is one link → /assets/:id */
export function AssetRow({ asset, status, urgent, deadlined = false }: AssetRowProps) {
  return (
    <Link to={`/assets/${asset.id}`} className={ROW_LINK}>
      {/* DEADLINE overrides the schedule status: only one badge per asset. */}
      {deadlined ? <DeadlineBadge /> : <StatusBadge status={status} />}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl font-semibold">
          <span className={deadlined ? cn(DEADLINE_HIGHLIGHT, 'truncate align-top') : 'block truncate'}>{asset.name}</span>
        </span>
        <span className="block truncate text-sm text-muted">
          {urgent ? `${urgent.schedule.task} · ${describeRemaining(urgent)}` : 'No tasks scheduled'}
        </span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
