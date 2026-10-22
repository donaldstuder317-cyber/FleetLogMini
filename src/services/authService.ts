import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AUTH_MESSAGES } from './authMessages';

/** The only code that calls `supabase.auth`. Every thrown Error carries a user-facing message. */

export { AUTH_MESSAGES };

export function authErrorMessage(error: Pick<AuthError, 'message'> & { code?: string }, context: 'signIn' | 'signUp'): string {
  const code = error.code ?? '';
  const message = error.message ?? '';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) return AUTH_MESSAGES.wrongCredentials;
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(message)) {
    return AUTH_MESSAGES.emailTaken;
  }
  if (code === 'weak_password') return AUTH_MESSAGES.weakPassword;
  if (code === 'captcha_failed' || /captcha/i.test(message)) return AUTH_MESSAGES.captchaFailed;
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || /rate limit/i.test(message)) {
    return AUTH_MESSAGES.rateLimited;
  }
  if (code === 'email_address_invalid') return AUTH_MESSAGES.invalidEmail;
  return context === 'signIn' ? AUTH_MESSAGES.signInFailed : AUTH_MESSAGES.signUpFailed;
}

export function isWrongCredentials(err: unknown): boolean {
  return err instanceof Error && err.message === AUTH_MESSAGES.wrongCredentials;
}

export function isEmailTaken(err: unknown): boolean {
  return err instanceof Error && err.message === AUTH_MESSAGES.emailTaken;
}

/** The user-facing message for an error thrown by signIn / signUp. */
export function authFailureMessage(err: unknown, context: 'signIn' | 'signUp'): string {
  if (err instanceof Error && err.message) return err.message;
  return context === 'signIn' ? AUTH_MESSAGES.signInFailed : AUTH_MESSAGES.signUpFailed;
}

export function displayNameFor(user: User): string {
  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : '';
  return name || user.email || 'Signed in';
}

/** A stored token can be revoked server-side; drop it locally so the user is asked to sign in. */
async function verifyStoredSession() {
  const { error } = await supabase.auth.getUser();
  if (error && error.name !== 'AuthRetryableFetchError') await supabase.auth.signOut({ scope: 'local' });
}

/**
 * Calls `onChange` with the current session now and on every change (incl. other tabs).
 * `signedOut` is true when the session just ended by signing out. Returns unsubscribe.
 */
export function onAuthChange(onChange: (session: Session | null, signedOut: boolean) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    onChange(session, event === 'SIGNED_OUT');
    // Never await Supabase calls inside this callback (it can deadlock the client).
    if (event === 'INITIAL_SESSION' && session) setTimeout(() => void verifyStoredSession(), 0);
  });
  return () => data.subscription.unsubscribe();
}

/** `captchaToken` is the CAPTCHA token; Supabase rejects the request without a valid one when CAPTCHA protection is on. */
export async function signIn(email: string, password: string, captchaToken?: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
  if (error) throw new Error(authErrorMessage(error, 'signIn'));
}

/** `needsConfirmation` is true when Supabase requires email confirmation (no session yet). */
export async function signUp(
  name: string,
  email: string,
  password: string,
  captchaToken?: string,
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, captchaToken } });
  if (error) throw new Error(authErrorMessage(error, 'signUp'));
  // With confirmation on, an existing email comes back as a user with no identities instead of an error.
  if (data.user && data.user.identities?.length === 0) throw new Error(AUTH_MESSAGES.emailTaken);
  return { needsConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  // Server unreachable or token already revoked: still end the session in this browser.
  if (error) await supabase.auth.signOut({ scope: 'local' });
}
