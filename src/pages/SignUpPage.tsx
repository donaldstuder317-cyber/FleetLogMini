import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonLink } from '../components/common/Button';
import { TEXT_LINK } from '../components/common/linkStyles';
import { Field } from '../components/forms/Field';
import { FormError } from '../components/forms/FormError';
import { Input } from '../components/forms/controls';
import { authFailureMessage, isEmailTaken, signUp } from '../services/authService';
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from '../services/validation';

export function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [pending, setPending] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirm: validatePasswordMatch(password, confirm),
  };
  const shown = (key: keyof typeof errors) => (submitted ? errors[key] : null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    setEmailTaken(false);
    if (pending || Object.values(errors).some(Boolean)) return;
    setPending(true);
    try {
      const { needsConfirmation } = await signUp(name.trim(), email.trim(), password);
      // With a session, GuestOnly redirects to the dashboard.
      if (needsConfirmation) setCheckEmail(true);
    } catch (err) {
      setServerError(authFailureMessage(err, 'signUp'));
      setEmailTaken(isEmailTaken(err));
      setPending(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-3xl font-bold">Check your email</h1>
        <p role="status">Check your email to confirm your account, then sign in.</p>
        <ButtonLink to="/sign-in">Go to Sign In</ButtonLink>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold">Sign Up</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field id="name" label="Name" error={shown('name')}>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            invalid={!!shown('name')}
            aria-describedby={shown('name') ? 'name-error' : undefined}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field id="email" label="Email" error={shown('email')}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            invalid={!!shown('email')}
            aria-describedby={shown('email') ? 'email-error' : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          hint="8+ characters with an uppercase letter, a number and a symbol."
          error={shown('password')}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            invalid={!!shown('password')}
            aria-describedby={shown('password') ? 'password-error' : undefined}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field id="confirm" label="Confirm password" error={shown('confirm')}>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            invalid={!!shown('confirm')}
            aria-describedby={shown('confirm') ? 'confirm-error' : undefined}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        {serverError && (
          <FormError>
            {emailTaken ? (
              <>
                An account with this email already exists. <Link to="/sign-in" className={TEXT_LINK}>Sign in</Link> instead.
              </>
            ) : (
              serverError
            )}
          </FormError>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating account…' : 'Sign Up'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to="/sign-in" className={TEXT_LINK}>Sign in</Link>
      </p>
    </>
  );
}
