import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ToastContext } from '../../app/fleetContext';
import { cn } from '../../lib/cn';

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-6"
      >
        {toast && (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex min-h-11 items-center gap-2 rounded-xl border bg-raised px-4 text-sm font-medium motion-safe:animate-slide-in',
              toast.tone === 'success' ? 'border-good text-good' : 'border-danger text-danger',
            )}
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 size={18} aria-hidden />
            ) : (
              <AlertCircle size={18} aria-hidden />
            )}
            <span className="text-ink">{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
