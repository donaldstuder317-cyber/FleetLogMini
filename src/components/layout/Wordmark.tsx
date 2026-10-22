import { cn } from '../../lib/cn';

/**
 * "FleetLog Mini" with the gauge mark (public/gauge-mark.svg: the favicon without its square) as the "o" in "Log".
 * Screen readers get the plain name; the styled version is decorative.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('font-display font-bold tracking-wide', className)}>
      <span className="sr-only">FleetLog Mini</span>
      <span aria-hidden="true">
        Fleet
        <span className="text-accent">
          L
          <img
            src="/gauge-mark.svg"
            alt=""
            className="mx-[0.04em] inline-block h-[0.62em] w-[0.62em] align-[-0.02em]"
          />
          g
        </span>{' '}
        <span className="text-muted">Mini</span>
      </span>
    </div>
  );
}
