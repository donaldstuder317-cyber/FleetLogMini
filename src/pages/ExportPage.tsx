import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Field } from '../components/forms/Field';
import { Input } from '../components/forms/controls';
import { PageHeader } from '../components/layout/PageHeader';
import { useFleet, useToast } from '../hooks/useFleet';
import { startOfYearISO, todayISO } from '../lib/dates';
import { formatCurrency } from '../lib/format';
import {
  buildCsv,
  buildPdf,
  downloadBlob,
  selectEntries,
  toRows,
  totalPartsCost,
} from '../services/exportService';
import { validateDateRange } from '../services/validation';
import { TASK_TYPES, type TaskType } from '../types';

type Format = 'csv' | 'pdf';

const CHECK =
  'size-5 rounded border-line bg-sunken accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

export function ExportPage() {
  const { data, resetDemoData } = useFleet();
  const { showToast } = useToast();
  const [params] = useSearchParams();

  const initialIds = (params.get('assets') ?? '').split(',').filter((id) => data.assets.some((a) => a.id === id));
  const taskParam = params.get('task');
  const [task, setTask] = useState<TaskType | 'all'>(
    TASK_TYPES.includes(taskParam as TaskType) ? (taskParam as TaskType) : 'all',
  );
  const [selected, setSelected] = useState<string[]>(initialIds); // empty = all
  const [from, setFrom] = useState(startOfYearISO());
  const [to, setTo] = useState(todayISO());
  const [format, setFormat] = useState<Format>('csv');

  const rangeError = validateDateRange(from, to);
  const entries = useMemo(
    () => (rangeError ? [] : selectEntries(data, { assetIds: selected, from, to, task })),
    [data, selected, from, to, task, rangeError],
  );
  const total = totalPartsCost(entries);
  const allSelected = selected.length === 0;
  const canDownload = !rangeError && entries.length > 0;

  function toggleAsset(id: string) {
    setSelected((prev) => {
      const base = prev.length === 0 ? data.assets.map((a) => a.id) : prev;
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      return next.length === data.assets.length ? [] : next;
    });
  }

  function download() {
    const rows = toRows(data, entries);
    const stamp = `${from}_to_${to}`;
    if (format === 'csv') {
      downloadBlob(new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8' }), `fleetlog-${stamp}.csv`);
    } else {
      const label = allSelected
        ? 'All assets'
        : data.assets.filter((a) => selected.includes(a.id)).map((a) => a.name).join(', ');
      buildPdf(rows, label, from, to).save(`fleetlog-${stamp}.pdf`);
    }
    showToast(`Downloaded ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`);
  }

  return (
    <>
      <PageHeader title="Export" subtitle="Download clean service history as CSV or a printable PDF" />

      <div className="flex flex-col gap-6 md:max-w-3xl">
        <fieldset className="rounded-xl border border-line bg-surface p-4">
          <legend className="px-1 text-sm font-medium">Assets</legend>
          <div className="grid gap-1 md:grid-cols-2">
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className={CHECK} checked={allSelected} onChange={() => setSelected([])} />
              All assets
            </label>
            {data.assets.map((a) => (
              <label key={a.id} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  className={CHECK}
                  checked={allSelected || selected.includes(a.id)}
                  onChange={() => toggleAsset(a.id)}
                />
                {a.name}
              </label>
            ))}
          </div>
        </fieldset>

        {task !== 'all' && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            Filtered to task: <span className="font-medium text-ink">{task}</span>
            <button type="button" onClick={() => setTask('all')} className="min-h-11 rounded-xl px-2 text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Clear
            </button>
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <Field id="from" label="From">
            <Input id="from" type="date" value={from} invalid={!!rangeError} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field id="to" label="To" error={rangeError}>
            <Input id="to" type="date" value={to} invalid={!!rangeError} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Format</legend>
          <div className="flex gap-6">
            {(['csv', 'pdf'] as const).map((f) => (
              <label key={f} className="flex min-h-11 items-center gap-3">
                <input type="radio" name="format" className={CHECK} checked={format === f} onChange={() => setFormat(f)} />
                {f.toUpperCase()}
              </label>
            ))}
          </div>
        </fieldset>

        <div aria-live="polite" className="rounded-xl border border-line bg-surface p-4">
          {rangeError ? (
            <p className="text-muted">Fix the date range to see a preview.</p>
          ) : entries.length === 0 ? (
            <p className="text-warn">No entries in this range — widen dates</p>
          ) : (
            <p data-testid="export-preview">
              <span className="font-display text-2xl font-semibold tabular-nums">{entries.length}</span>{' '}
              {entries.length === 1 ? 'entry' : 'entries'} ·{' '}
              <span className="font-display text-2xl font-semibold tabular-nums">{formatCurrency(total)}</span>{' '}
              total parts cost
            </p>
          )}
        </div>

        <Button onClick={download} disabled={!canDownload}>
          <Download size={20} aria-hidden /> Download
        </Button>

        <p className="border-t border-line pt-4 text-sm text-muted">
          Demo data is stored in this browser only.{' '}
          <button
            type="button"
            className="min-h-11 rounded-xl px-2 text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => {
              resetDemoData();
              showToast('Demo data reset');
            }}
          >
            Reset demo data
          </button>
        </p>
      </div>
    </>
  );
}
