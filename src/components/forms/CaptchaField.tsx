import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

/** Cloudflare Turnstile site key (public). When unset (tests, local dev without a key) no widget is shown and no token is sent. */
export const CAPTCHA_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
export const CAPTCHA_ENABLED = CAPTCHA_SITE_KEY !== '';

export type CaptchaHandle = { reset: () => void };

type Props = { onToken: (token: string | null) => void };

/** The Turnstile widget. Tokens are single-use, so the parent calls `reset()` after every attempt. */
export const CaptchaField = forwardRef<CaptchaHandle, Props>(function CaptchaField({ onToken }, ref) {
  const widget = useRef<TurnstileInstance>(null);
  useImperativeHandle(ref, () => ({
    reset: () => {
      widget.current?.reset();
      onToken(null);
    },
  }));
  if (!CAPTCHA_ENABLED) return null;
  return (
    <div className="flex justify-center">
      <Turnstile
        ref={widget}
        siteKey={CAPTCHA_SITE_KEY}
        onSuccess={(token) => onToken(token)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
    </div>
  );
});
