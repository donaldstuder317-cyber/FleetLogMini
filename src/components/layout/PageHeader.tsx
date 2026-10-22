import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Extra classes on the title (e.g. the DEADLINE highlight). */
  titleClassName?: string;
  /** Shown beside the title (e.g. a badge). */
  titleAside?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, titleClassName, titleAside }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={cn('font-display text-3xl font-bold tabular-nums', titleClassName)}>{title}</h1>
          {titleAside}
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-col gap-3 md:flex-row">{actions}</div>}
    </header>
  );
}
