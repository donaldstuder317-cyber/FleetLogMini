import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="mb-4 inline-flex min-h-11 items-center gap-1 rounded-xl pr-3 text-sm font-medium text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <ChevronLeft size={18} aria-hidden />
      {children}
    </Link>
  );
}
