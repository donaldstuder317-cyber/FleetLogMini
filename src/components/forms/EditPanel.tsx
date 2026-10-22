import type { FormEvent, ReactNode } from 'react';
import { Button } from '../common/Button';
import { FormError } from './FormError';

interface EditPanelProps {
  /** Accessible name of the form, e.g. "Edit Oil change entry". */
  label: string;
  saving: boolean;
  saveError: string | null;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}

/** Inline edit form shell: fields, save error, Save / Cancel. Escape cancels. */
export function EditPanel({ label, saving, saveError, onSubmit, onCancel, children }: EditPanelProps) {
  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      aria-label={label}
      noValidate
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && !saving && onCancel()}
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 motion-safe:animate-slide-in"
    >
      {children}
      {saveError && <FormError>{saveError}</FormError>}
      <div className="flex flex-col gap-3 md:flex-row">
        <Button type="submit" disabled={saving}>Save</Button>
        <Button variant="ghost" disabled={saving} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
