import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { describeRemaining } from '../../services/status';
import type { Asset, ScheduleStatus, Status } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ROW_LINK } from './rowStyles';

interface AssetRowProps {
  asset: Asset;
  status: Status;
  urgent?: ScheduleStatus;
}

/** Whole row is one link → /assets/:id */
export function AssetRow({ asset, status, urgent }: AssetRowProps) {
  return (
    <Link to={`/assets/${asset.id}`} className={ROW_LINK}>
      <StatusBadge status={status} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-xl font-semibold">{asset.name}</span>
        <span className="block truncate text-sm text-muted">
          {urgent ? `${urgent.schedule.task} · ${describeRemaining(urgent)}` : 'No tasks scheduled'}
        </span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
