import { formatCurrency } from '../../lib/format';

interface SparklineProps {
  points: Array<{ key: string; label: string; total: number }>;
}

/** Small vertical bar sparkline of monthly parts cost, with text values beside it. */
export function Sparkline({ points }: SparklineProps) {
  const max = Math.max(...points.map((p) => p.total), 1);
  const total = points.reduce((s, p) => s + p.total, 0);
  return (
    <div className="flex items-end gap-4">
      <div className="flex h-12 items-end gap-1.5" role="img" aria-label={`Parts cost by month, ${formatCurrency(total)} total`}>
        {points.map((p) => (
          <div key={p.key} className="flex h-full w-4 flex-col justify-end" title={`${p.label}: ${formatCurrency(p.total)}`}>
            <div
              className="rounded-sm bg-accent motion-safe:transition-[height] motion-safe:duration-200"
              style={{ height: `${Math.max(p.total > 0 ? 8 : 2, (p.total / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm text-muted">Parts cost, last {points.length} mo</p>
        <p className="font-display text-xl font-semibold tabular-nums">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}
