import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  /** The one action — usually a <Button> or <ButtonLink>. */
  action?: ReactNode;
}

export function EmptyState({ title, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line px-4 py-10 text-center">
      <p className="text-base text-muted">{title}</p>
      {action}
    </div>
  );
}
