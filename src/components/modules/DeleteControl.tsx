import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../common/Button';
import { ICON_BUTTON } from './rowStyles';

interface DeleteControlProps {
  /** Accessible name of the trash button, e.g. "Delete Oil change entry from Jan 5, 2026". */
  label: string;
  /** Short question shown while confirming, e.g. "Delete this entry?". */
  question: string;
  /** Must handle its own errors (toast); resolves when finished. */
  onConfirm: () => Promise<void>;
}

/** Trash icon button that swaps to an inline "question / Delete / Cancel" confirm. */
export function DeleteControl({ label, question, onConfirm }: DeleteControlProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  function cancel() {
    setConfirming(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  async function confirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" ref={trigger} aria-label={label} className={cn(ICON_BUTTON, 'hover:text-danger')} onClick={() => setConfirming(true)}>
        <Trash2 size={18} aria-hidden />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={question}
      className="flex flex-wrap items-center justify-end gap-2 motion-safe:animate-slide-in"
      onKeyDown={(e) => e.key === 'Escape' && !pending && cancel()}
    >
      <span className="whitespace-nowrap text-sm text-ink">{question}</span>
      <Button variant="danger" className="px-4" disabled={pending} onClick={confirm}>Delete</Button>
      <Button variant="ghost" className="px-4" disabled={pending} onClick={cancel} autoFocus>Cancel</Button>
    </div>
  );
}
