import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const CONTROL =
  'min-h-11 w-full rounded-xl border bg-sunken px-3 text-base text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

function border(invalid?: boolean) {
  return invalid ? 'border-danger' : 'border-line';
}

type Invalid = { invalid?: boolean };

export function Input({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & Invalid) {
  return <input aria-invalid={invalid || undefined} className={cn(CONTROL, border(invalid), className)} {...rest} />;
}

export function Select({ invalid, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & Invalid) {
  return <select aria-invalid={invalid || undefined} className={cn(CONTROL, border(invalid), className)} {...rest} />;
}

const CHOICE =
  'size-5 shrink-0 rounded border-line bg-sunken accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

export function Checkbox({ className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="checkbox" className={cn(CHOICE, className)} {...rest} />;
}

export function Radio({ className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="radio" className={cn(CHOICE, className)} {...rest} />;
}

export function Textarea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & Invalid) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'py-2', border(invalid), className)}
      {...rest}
    />
  );
}
