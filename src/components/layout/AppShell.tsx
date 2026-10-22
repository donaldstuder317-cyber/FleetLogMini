import { Link, NavLink, Outlet } from 'react-router-dom';
import { Bell, Download, Gauge, PlusSquare, type LucideIcon } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';
import { UserMenu } from './UserMenu';
import { Wordmark } from './Wordmark';

const NAV: Array<{ to: string; label: string; Icon: LucideIcon; end?: boolean }> = [
  { to: '/', label: 'Dashboard', Icon: Gauge, end: true },
  { to: '/alerts', label: 'Alerts', Icon: Bell },
  { to: '/log', label: 'Log', Icon: PlusSquare },
  { to: '/export', label: 'Export', Icon: Download },
];

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

/** The wordmark as a plain link (no button styling) back to the Dashboard. */
function HomeLink({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="FleetLog Mini — Dashboard"
      className={cn('inline-flex min-h-11 items-center self-start rounded-xl', FOCUS, className)}
    >
      <Wordmark />
    </Link>
  );
}

/** Top bar (user + sign out) and bottom tab bar on mobile; persistent left sidebar at lg:. */
export function AppShell() {
  const wide = useMediaQuery('(min-width: 1024px)');
  return (
    <div className="min-h-screen bg-bg text-ink lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 flex h-screen flex-col gap-8 p-5">
          <HomeLink className="text-2xl" />
          <nav aria-label="Main" className="flex flex-col gap-1">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-medium motion-safe:transition-colors motion-safe:duration-150',
                    FOCUS,
                    isActive ? 'bg-raised text-accent' : 'text-muted hover:bg-raised hover:text-ink',
                  )
                }
              >
                <Icon size={20} aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          {wide && <UserMenu layout="stack" />}
        </div>
      </aside>

      {!wide && (
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2">
          <HomeLink className="shrink-0 text-xl" />
          <UserMenu layout="inline" />
        </header>
      )}

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 text-sm font-medium',
                    FOCUS,
                    isActive ? 'text-accent' : 'text-muted',
                  )
                }
              >
                <Icon size={22} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
