import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-strong text-white shadow-lip w-full md:w-auto hover:bg-accent disabled:hover:bg-accent-strong',
  secondary: 'border border-accent text-accent hover:bg-raised w-full md:w-auto',
  ghost: 'border border-line text-muted hover:bg-raised hover:text-ink',
};

export function buttonClasses(variant: ButtonVariant, extra?: string) {
  return cn(BASE, VARIANT[variant], extra);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />;
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function ButtonLink({ variant = 'primary', className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...rest} />;
}
