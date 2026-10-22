import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

/** Form-level (server) error shown above the submit button. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-1.5 text-sm text-danger">
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
