import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';
import type { Status } from '../../types';

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STROKE: Record<Status, string> = {
  good: 'stroke-accent',
  due: 'stroke-warn',
  overdue: 'stroke-danger',
};

interface IntervalRingProps {
  percent: number;
  status: Status;
  size?: number;
}

/** SVG progress ring: "interval used", with the value always shown as text. */
export function IntervalRing({ percent, status, size = 56 }: IntervalRingProps) {
  const target = Math.min(100, Math.max(0, percent));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(percent)}% of interval used`}
    >
      <svg viewBox="0 0 52 52" className="-rotate-90" width={size} height={size} aria-hidden>
        <circle cx="26" cy="26" r={RADIUS} fill="none" strokeWidth="5" className="stroke-line" />
        <circle
          cx="26"
          cy="26"
          r={RADIUS}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - shown / 100)}
          className={cn(STROKE[status], 'motion-safe:transition-[stroke-dashoffset] motion-safe:duration-200')}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-semibold tabular-nums">
        {Math.round(percent)}%
      </span>
    </div>
  );
}
