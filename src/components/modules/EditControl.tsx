import { Pencil } from 'lucide-react';
import { cn } from '../../lib/cn';
import { ICON_BUTTON } from './rowStyles';

interface EditControlProps {
  /** Accessible name, e.g. "Edit Oil change entry from Jan 5, 2026". */
  label: string;
  expanded: boolean;
  /** Receives the button so focus can return to it when the form closes. */
  onClick: (trigger: HTMLButtonElement) => void;
}

/** Pencil icon button that opens a row's inline edit form. */
export function EditControl({ label, expanded, onClick }: EditControlProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      className={cn(ICON_BUTTON, 'hover:text-ink')}
      onClick={(e) => onClick(e.currentTarget)}
    >
      <Pencil size={18} aria-hidden />
    </button>
  );
}
