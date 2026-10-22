import type { ReactNode } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-ink">
      <p role="status" className="text-base text-muted">Loading…</p>
    </div>
  );
}

/**
 * App pages: signed-out visitors go to /sign-in, remembering where they were headed.
 * After a sign-out nothing is remembered, so the next sign-in (maybe another user) starts at the dashboard.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, signedOut } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (!session) return <Navigate to="/sign-in" replace state={signedOut ? null : { from: location }} />;
  return children;
}

/** Sign-in / sign-up: once signed in, continue to the page originally requested (or the dashboard). */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (session) {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/'} replace />;
  }
  return children;
}
