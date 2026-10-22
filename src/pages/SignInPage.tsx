import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { TEXT_LINK } from '../components/common/linkStyles';
import { CAPTCHA_ENABLED, CaptchaField, type CaptchaHandle } from '../components/forms/CaptchaField';
import { Field } from '../components/forms/Field';
import { FormError } from '../components/forms/FormError';
import { Input } from '../components/forms/controls';
import { AUTH_MESSAGES, authFailureMessage, isWrongCredentials, signIn } from '../services/authService';
import { validateEmail, validatePasswordEntered } from '../services/validation';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captcha = useRef<CaptchaHandle>(null);

  const emailError = submitted ? validateEmail(email) : null;
  const passwordError = submitted ? validatePasswordEntered(password) : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (pending || validateEmail(email) || validatePasswordEntered(password)) return;
    if (CAPTCHA_ENABLED && !captchaToken) return setServerError(AUTH_MESSAGES.captchaRequired);
    setPending(true);
    try {
      await signIn(email.trim(), password, captchaToken ?? undefined);
      // GuestOnly redirects once the session arrives.
    } catch (err) {
      setServerError(authFailureMessage(err, 'signIn'));
      if (isWrongCredentials(err)) {
        setPassword('');
        setSubmitted(false); // the cleared field isn't a mistake; only the server message shows
      }
      captcha.current?.reset(); // tokens are single-use
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">Sign In</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field id="email" label="Email" error={emailError}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field id="password" label="Password" error={passwordError}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <CaptchaField ref={captcha} onToken={setCaptchaToken} />
        {serverError && <FormError>{serverError}</FormError>}
        <Button type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        No account? <Link to="/sign-up" className={TEXT_LINK}>Sign up</Link>
      </p>
    </>
  );
}
