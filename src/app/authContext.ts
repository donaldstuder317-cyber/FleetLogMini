import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** Profile name from sign-up, falling back to the email. Empty when signed out. */
  displayName: string;
  /** True until Supabase has restored (or ruled out) a stored session. */
  loading: boolean;
  /** The session ended by signing out (here or in another tab), not by visiting signed out. */
  signedOut: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
