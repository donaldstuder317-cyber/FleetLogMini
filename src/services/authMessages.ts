/** User-facing auth messages, shared by authService and validation (no Supabase import). */

export const AUTH_MESSAGES = {
  wrongCredentials: 'Wrong email or password.',
  emailTaken: 'An account with this email already exists. Sign in instead.',
  invalidEmail: 'Enter a valid email address.',
  weakPassword:
    'Password must be at least 8 characters and include an uppercase letter, a number and a symbol.',
  captchaRequired: 'Please complete the CAPTCHA.',
  captchaFailed: 'CAPTCHA check failed. Please try again.',
  rateLimited: 'Too many attempts. Please wait a few minutes and try again.',
  signInFailed: "Couldn't sign in. Please try again.",
  signUpFailed: "Couldn't create your account. Please try again.",
} as const;
