import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Field } from '../components/forms/Field';
import { Checkbox, Input, Radio } from '../components/forms/controls';
import { PageHeader } from '../components/layout/PageHeader';
import { useFleet, useToast } from '../hooks/useFleet';
import { startOfYearISO, todayISO } from '../lib/dates';
import { formatCurrency } from '../lib/format';
import {
  buildCsv,
  buildExportRows,
  buildPdf,
  downloadBlob,
  isAllSelected,
  isAssetSelected,
  isNoneSelected,
  normalizeSelection,
  selectEntries,
  selectionAssetIds,
  toggleAllSelection,
  toggleAssetSelection,
  summarizeExport,
  type AssetSelection,
} from '../services/exportService';
import { validateDateRange } from '../services/validation';
import { TASK_TYPES, type TaskType } from '../types';

type Format = 'csv' | 'pdf';

export function ExportPage() {
  const { data } = useFleet();
  const { showToast } = useToast();
  const [params] = useSearchParams();

  const assetsParam = params.get('assets');
  const initialSelection: AssetSelection =
    assetsParam === null ? 'all' : assetsParam.split(',').filter((id) => data.assets.some((a) => a.id === id));
  const taskParam = params.get('task');
  const [task, setTask] = useState<TaskType | 'all'>(
    TASK_TYPES.includes(taskParam as TaskType) ? (taskParam as TaskType) : 'all',
  );
  const [rawSelected, setSelected] = useState<AssetSelection>(initialSelection);
  const selected = useMemo(() => normalizeSelection(rawSelected, data.assets), [rawSelected, data.assets]);
  const [from, setFrom] = useState(startOfYearISO());
  const [to, setTo] = useState(todayISO());
  const [format, setFormat] = useState<Format>('csv');

  const rangeError = validateDateRange(from, to);
  const noneSelected = isNoneSelected(selected, data.assets);
  const entries = useMemo(
    () =>
      rangeError || noneSelected
        ? []
        : selectEntries(data, { assetIds: selectionAssetIds(selected, data.assets), from, to, task }),
    [data, selected, from, to, task, rangeError, noneSelected],
  );
  const rows = useMemo(
    () => (entries.length === 0 ? [] : buildExportRows(data, entries, selectionAssetIds(selected, data.assets))),
    [data, entries, selected],
  );
  const summary = summarizeExport(rows);
  const allSelected = isAllSelected(selected, data.assets);
  const canDownload = !rangeError && !noneSelected && entries.length > 0;

  function toggleAsset(id: string) {
    setSelected(toggleAssetSelection(selected, data.assets, id));
  }

  async function download() {
    const stamp = `${from}_to_${to}`;
    if (format === 'csv') {
      downloadBlob(new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8' }), `fleetlog-${stamp}.csv`);
    } else {
      const label = allSelected
        ? 'All assets'
        : data.assets.filter((a) => isAssetSelected(selected, data.assets, a.id)).map((a) => a.name).join(', ');
      try {
        (await buildPdf(rows, label, from, to)).save(`fleetlog-${stamp}.pdf`);
      } catch {
        showToast("Couldn't create the PDF — try again", 'error');
        return;
      }
    }
    showToast(`Downloaded ${summary.entries} ${summary.entries === 1 ? 'entry' : 'entries'}`);
  }

  return (
    <>
      <PageHeader title="Export" subtitle="Download clean service history as CSV or a printable PDF" />

      <div className="flex flex-col gap-6 md:max-w-3xl">
        <fieldset className="rounded-xl border border-line bg-surface p-4">
          <legend className="px-1 text-sm font-medium">Assets</legend>
          <div className="grid gap-1 md:grid-cols-2">
            <label className="flex min-h-11 items-center gap-3">
              <Checkbox checked={allSelected} onChange={() => setSelected(toggleAllSelection(selected, data.assets))} />
              All assets
            </label>
            {data.assets.map((a) => (
              <label key={a.id} className="flex min-h-11 items-center gap-3">
                <Checkbox checked={isAssetSelected(selected, data.assets, a.id)} onChange={() => toggleAsset(a.id)} />
                {a.name}
              </label>
            ))}
          </div>
        </fieldset>

        {task !== 'all' && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            Filtered to task: <span className="font-medium text-ink">{task}</span>
            <button type="button" onClick={() => setTask('all')} className="min-h-11 rounded-xl px-2 text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
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
                <Radio name="format" checked={format === f} onChange={() => setFormat(f)} />
                {f.toUpperCase()}
              </label>
            ))}
          </div>
        </fieldset>

        <div aria-live="polite" className="rounded-xl border border-line bg-surface p-4">
          {noneSelected ? (
            <p className="text-muted">Select at least one asset to export.</p>
          ) : rangeError ? (
            <p className="text-muted">Fix the date range to see a preview.</p>
          ) : entries.length === 0 ? (
            <p className="text-muted">No entries in this range — widen dates</p>
          ) : (
            <p data-testid="export-preview">
              <span className="font-display text-2xl font-semibold tabular-nums">{summary.entries}</span>{' '}
              {summary.entries === 1 ? 'entry' : 'entries'} ·{' '}
              <span className="font-display text-2xl font-semibold tabular-nums">{summary.faultsCorrected}</span>{' '}
              {summary.faultsCorrected === 1 ? 'fault' : 'faults'} corrected ·{' '}
              <span className="font-display text-2xl font-semibold tabular-nums">{formatCurrency(summary.total)}</span>{' '}
              total cost
            </p>
          )}
        </div>

        <Button onClick={download} disabled={!canDownload}>
          <Download size={20} aria-hidden /> Download
        </Button>
      </div>
    </>
  );
}
