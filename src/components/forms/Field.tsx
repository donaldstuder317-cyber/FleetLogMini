import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

/** Wraps every input: visible label above, control, inline error below. */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
