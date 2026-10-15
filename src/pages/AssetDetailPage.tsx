import { useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Flag, Plus } from 'lucide-react';
import { Button, ButtonLink } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Field } from '../components/forms/Field';
import { Input, Textarea } from '../components/forms/controls';
import { BackLink } from '../components/layout/BackLink';
import { PageHeader } from '../components/layout/PageHeader';
import { ScheduleRow } from '../components/modules/ScheduleRow';
import { ServiceHistory } from '../components/modules/ServiceHistory';
import { Sparkline } from '../components/modules/Sparkline';
import { useFleet, useToast } from '../hooks/useFleet';
import { formatNumber } from '../lib/format';
import { entriesForAsset, monthlyPartsCost } from '../services/fleetService';
import { evaluateAsset } from '../services/status';
import { parseNumber, validateReading } from '../services/validation';

export function AssetDetailPage() {
  const { id } = useParams();
  const { data, lastAddedEntryId, setReading, reportFault } = useFleet();
  const { showToast } = useToast();
  const asset = data.assets.find((a) => a.id === id);

  const [editing, setEditing] = useState(false);
  const [readingInput, setReadingInput] = useState('');
  const [readingError, setReadingError] = useState<string | null>(null);
  const [faultOpen, setFaultOpen] = useState(false);
  const [faultText, setFaultText] = useState('');

  const schedules = useMemo(() => (asset ? evaluateAsset(data, asset) : []), [data, asset]);
  const entries = useMemo(() => (asset ? entriesForAsset(data, asset.id) : []), [data, asset]);
  const sparkline = useMemo(() => monthlyPartsCost(entries), [entries]);

  if (!asset) {
    return (
      <EmptyState
        title="Asset not found"
        action={<ButtonLink to="/">Back to Dashboard</ButtonLink>}
      />
    );
  }

  const readingLabel = asset.unit === 'mi' ? 'Odometer' : 'Engine hours';

  function startEdit() {
    setReadingInput(String(asset!.reading));
    setReadingError(null);
    setEditing(true);
  }

  function saveReading(e: FormEvent) {
    e.preventDefault();
    const error = validateReading(readingInput, asset!.reading);
    setReadingError(error);
    if (error) return;
    try {
      setReading(asset!.id, parseNumber(readingInput)!);
      setEditing(false);
      showToast(`${readingLabel} updated`);
    } catch {
      setReadingError("Couldn't save — try again");
    }
  }

  function saveFault(e: FormEvent) {
    e.preventDefault();
    if (!faultText.trim()) return;
    try {
      reportFault(asset!.id, faultText.trim());
      setFaultText('');
      setFaultOpen(false);
      showToast('Fault reported');
    } catch {
      showToast("Couldn't save — try again", 'error');
    }
  }

  return (
    <>
      <BackLink to="/">Dashboard</BackLink>
      <PageHeader
        title={asset.name}
        subtitle={`${asset.kind} · ${asset.model}`}
        actions={
          <>
            <ButtonLink to={`/log?asset=${asset.id}`}>
              <Plus size={20} aria-hidden /> Log Service
            </ButtonLink>
            <Button variant="ghost" onClick={() => setFaultOpen((o) => !o)} aria-expanded={faultOpen}>
              <Flag size={18} aria-hidden /> Report Fault
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-8">
        {faultOpen && (
          <form onSubmit={saveFault} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <Field id="fault-description" label="Describe the fault">
              <Textarea id="fault-description" rows={3} value={faultText} onChange={(e) => setFaultText(e.target.value)} />
            </Field>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button type="submit" disabled={!faultText.trim()}>Submit Fault</Button>
              <Button variant="ghost" onClick={() => setFaultOpen(false)}>Cancel</Button>
            </div>
          </form>
        )}

        <section aria-labelledby="reading-heading" className="rounded-xl border border-line bg-surface p-4">
          <h2 id="reading-heading" className="text-sm text-muted">Current {readingLabel.toLowerCase()}</h2>
          {editing ? (
            <form onSubmit={saveReading} className="mt-2 flex flex-col gap-3 md:flex-row md:items-start">
              <div className="md:w-56">
                <Field id="reading-input" label={`New ${readingLabel.toLowerCase()} (${asset.unit})`} error={readingError}>
                  <Input
                    id="reading-input"
                    inputMode="decimal"
                    value={readingInput}
                    invalid={!!readingError}
                    aria-describedby={readingError ? 'reading-input-error' : undefined}
                    onChange={(e) => setReadingInput(e.target.value)}
                    autoFocus
                  />
                </Field>
              </div>
              <div className="flex flex-col gap-3 md:mt-[1.625rem] md:flex-row">
                <Button type="submit">Save</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-display text-4xl font-bold tabular-nums">
                {formatNumber(asset.reading)} <span className="text-xl text-muted">{asset.unit}</span>
              </p>
              <Button variant="ghost" onClick={startEdit}>Update</Button>
            </div>
          )}
        </section>

        <section aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="mb-3 font-display text-xl font-semibold">Schedule</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {schedules.map((s) => (
              <ScheduleRow key={s.schedule.id} item={s} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="history-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 id="history-heading" className="font-display text-xl font-semibold">Service history</h2>
            {entries.length > 0 && <Sparkline points={sparkline} />}
          </div>
          {entries.length === 0 ? (
            <EmptyState
              title="No services logged yet — log the first one"
              action={<ButtonLink to={`/log?asset=${asset.id}`}>Log Service</ButtonLink>}
            />
          ) : (
            <ServiceHistory entries={entries} unit={asset.unit} highlightId={lastAddedEntryId} />
          )}
        </section>
      </div>
    </>
  );
}
