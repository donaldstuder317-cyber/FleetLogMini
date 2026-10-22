import { Ban } from 'lucide-react';
import { cn } from '../../lib/cn';

/** See-through red layer behind a deadlined asset's name (sits over whatever background is under it). */
export const DEADLINE_HIGHLIGHT = 'inline-block max-w-full rounded-lg bg-danger/15 px-2';

/** Red pill with icon + DEADLINE — never color alone. */
export function DeadlineBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-danger bg-surface px-2.5 py-0.5 text-sm font-bold uppercase text-danger',
        className,
      )}
    >
      <Ban size={14} aria-hidden />
      Deadline
    </span>
  );
}
