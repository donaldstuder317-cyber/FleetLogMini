import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, XOctagon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { usePrevious } from '../../hooks/usePrevious';
import { STATUS_LABEL } from '../../services/status';
import type { Status } from '../../types';

const STYLE: Record<Status, string> = {
  good: 'border-good text-good',
  due: 'border-warn text-warn',
  overdue: 'border-danger text-danger',
};

const ICON = { good: CheckCircle2, due: AlertTriangle, overdue: XOctagon } as const;

/** Pill with icon + word + color — never color alone. Pulses once when flipping to Good. */
export function StatusBadge({ status }: { status: Status }) {
  const Icon = ICON[status];
  const previous = usePrevious(status);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (previous && previous !== 'good' && status === 'good') {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 450);
      return () => window.clearTimeout(t);
    }
  }, [previous, status]);

  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border bg-surface px-2.5 py-0.5 text-sm font-medium',
        STYLE[status],
        pulse && 'motion-safe:animate-badge-pulse',
      )}
    >
      <Icon size={14} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
