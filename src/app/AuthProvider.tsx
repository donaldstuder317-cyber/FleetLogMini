import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { displayNameFor, onAuthChange } from '../services/authService';
import { AuthContext, type AuthContextValue } from './authContext';

/** Tracks the Supabase session, including sign-in/out in other tabs. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(
    () =>
      onAuthChange((next, ended) => {
        setSession(next);
        setSignedOut(ended);
        setLoading(false);
      }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      displayName: session ? displayNameFor(session.user) : '',
      loading,
      signedOut,
    }),
    [session, loading, signedOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
