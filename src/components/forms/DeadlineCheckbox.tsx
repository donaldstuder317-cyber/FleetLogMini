import { Ban } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Checkbox } from './controls';

interface DeadlineCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** e.g. top padding so the checkbox lines up with a labelled input beside it. */
  className?: string;
}

/** DEADLINE flag for a fault: red capitals + icon, with a plain-language hint. */
export function DeadlineCheckbox({ id, checked, onChange, className }: DeadlineCheckboxProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="flex min-h-11 items-center gap-3 self-start font-bold uppercase text-danger">
        <Checkbox id={id} checked={checked} aria-describedby={`${id}-hint`} onChange={(e) => onChange(e.target.checked)} />
        <Ban size={18} aria-hidden />
        Deadline
      </label>
      <p id={`${id}-hint`} className="text-sm text-muted">Asset is out of service until this fault is corrected</p>
    </div>
  );
}
