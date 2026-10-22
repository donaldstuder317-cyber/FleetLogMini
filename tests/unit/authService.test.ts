import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('../../src/lib/supabase', () => ({ supabase: { auth } }));

import {
  AUTH_MESSAGES,
  authErrorMessage,
  authFailureMessage,
  displayNameFor,
  isEmailTaken,
  isWrongCredentials,
  signIn,
  signOut,
  signUp,
} from '../../src/services/authService';

beforeEach(() => {
  Object.values(auth).forEach((fn) => fn.mockReset());
});

describe('authErrorMessage', () => {
  it('maps Supabase codes and messages to page messages', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: '' }, 'signIn')).toBe(AUTH_MESSAGES.wrongCredentials);
    expect(authErrorMessage({ message: 'Invalid login credentials' }, 'signIn')).toBe(AUTH_MESSAGES.wrongCredentials);
    expect(authErrorMessage({ code: 'user_already_exists', message: '' }, 'signUp')).toBe(AUTH_MESSAGES.emailTaken);
    expect(authErrorMessage({ message: 'User already registered' }, 'signUp')).toBe(AUTH_MESSAGES.emailTaken);
    expect(authErrorMessage({ code: 'weak_password', message: '' }, 'signUp')).toBe(AUTH_MESSAGES.weakPassword);
  });

  it('falls back to a generic message per page', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' }, 'signIn')).toBe("Couldn't sign in. Please try again.");
    expect(authErrorMessage({ message: 'Failed to fetch' }, 'signUp')).toBe("Couldn't create your account. Please try again.");
  });
});

describe('failure helpers', () => {
  it('classify thrown errors for the pages', () => {
    expect(isWrongCredentials(new Error(AUTH_MESSAGES.wrongCredentials))).toBe(true);
    expect(isWrongCredentials(new Error(AUTH_MESSAGES.signInFailed))).toBe(false);
    expect(isEmailTaken(new Error(AUTH_MESSAGES.emailTaken))).toBe(true);
    expect(isEmailTaken('nope')).toBe(false);
    expect(authFailureMessage(new Error('Wrong email or password.'), 'signIn')).toBe('Wrong email or password.');
    expect(authFailureMessage(undefined, 'signUp')).toBe(AUTH_MESSAGES.signUpFailed);
  });
});

describe('displayNameFor', () => {
  it('prefers the profile name, then the email', () => {
    expect(displayNameFor({ email: 'd@x.co', user_metadata: { name: ' Dana ' } } as unknown as User)).toBe('Dana');
    expect(displayNameFor({ email: 'd@x.co', user_metadata: {} } as unknown as User)).toBe('d@x.co');
  });
});

describe('signIn / signUp / signOut', () => {
  it('signIn throws the mapped message', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
    await expect(signIn('d@x.co', 'nope')).rejects.toThrow(AUTH_MESSAGES.wrongCredentials);
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    await expect(signIn('d@x.co', 'Fleet-log1')).resolves.toBeUndefined();
  });

  it('signUp sends the name as metadata and reports whether confirmation is needed', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] }, session: { access_token: 't' } }, error: null });
    await expect(signUp('Dana', 'd@x.co', 'Fleet-log1')).resolves.toEqual({ needsConfirmation: false });
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'd@x.co', password: 'Fleet-log1', options: { data: { name: 'Dana' }, captchaToken: undefined } });

    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] }, session: null }, error: null });
    await expect(signUp('Dana', 'd@x.co', 'Fleet-log1')).resolves.toEqual({ needsConfirmation: true });
  });

  it('forwards the CAPTCHA token to Supabase on sign-up and sign-in', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] }, session: null }, error: null });
    await signUp('Dana', 'd@x.co', 'Fleet-log1', 'tok');
    expect(auth.signUp).toHaveBeenLastCalledWith({
      email: 'd@x.co', password: 'Fleet-log1', options: { data: { name: 'Dana' }, captchaToken: 'tok' },
    });
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    await signIn('d@x.co', 'Fleet-log1', 'tok');
    expect(auth.signInWithPassword).toHaveBeenLastCalledWith({
      email: 'd@x.co', password: 'Fleet-log1', options: { captchaToken: 'tok' },
    });
  });

  it('maps CAPTCHA and rate-limit failures to friendly messages', () => {
    expect(authErrorMessage({ code: 'captcha_failed', message: 'captcha verification process failed' }, 'signUp')).toBe(AUTH_MESSAGES.captchaFailed);
    expect(authErrorMessage({ code: 'over_request_rate_limit', message: '' }, 'signIn')).toBe(AUTH_MESSAGES.rateLimited);
  });

  it('signUp treats a user with no identities (confirmation on) as an existing email', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null });
    await expect(signUp('Dana', 'd@x.co', 'Fleet-log1')).rejects.toThrow(AUTH_MESSAGES.emailTaken);
  });

  it('signOut falls back to a local sign-out when the server call fails', async () => {
    auth.signOut.mockResolvedValueOnce({ error: { message: 'offline' } }).mockResolvedValueOnce({ error: null });
    await signOut();
    expect(auth.signOut).toHaveBeenNthCalledWith(2, { scope: 'local' });
  });
});
