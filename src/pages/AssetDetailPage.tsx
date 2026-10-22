import { useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '../components/common/Button';
import { DEADLINE_HIGHLIGHT, DeadlineBadge } from '../components/common/DeadlineBadge';
import { EmptyState } from '../components/common/EmptyState';
import { DeadlineCheckbox } from '../components/forms/DeadlineCheckbox';
import { EditAssetForm } from '../components/forms/EditAssetForm';
import { EditEntryForm } from '../components/forms/EditEntryForm';
import { EditFaultForm } from '../components/forms/EditFaultForm';
import { EditIntervalForm } from '../components/forms/EditIntervalForm';
import { Field } from '../components/forms/Field';
import { Input, Textarea } from '../components/forms/controls';
import { BackLink } from '../components/layout/BackLink';
import { PageHeader } from '../components/layout/PageHeader';
import { FaultList } from '../components/modules/FaultList';
import { ScheduleRow } from '../components/modules/ScheduleRow';
import { ServiceHistory } from '../components/modules/ServiceHistory';
import { Sparkline } from '../components/modules/Sparkline';
import { useFleet, useToast } from '../hooks/useFleet';
import { formatNumber } from '../lib/format';
import {
  correctedFaultsForAsset,
  correctedOn,
  entriesForAsset,
  faultsForAsset,
  isAssetDeadlined,
  maxEntryReading,
  monthlyPartsCost,
  openFaultsForAsset,
} from '../services/fleetService';
import { evaluateAsset } from '../services/status';
import { parseNumber, validateAssetReading, validateCost } from '../services/validation';
import type { Fault } from '../types';

export function AssetDetailPage() {
  const { id } = useParams();
  const {
    data, lastAddedEntryId, setReading, reportFault, deleteAsset, deleteEntry, deleteFault,
    updateAsset, updateEntry, updateFault, updateInterval,
  } = useFleet();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const asset = data.assets.find((a) => a.id === id);

  /** The one open edit form: 'reading' | 'asset' | 'entry:<id>' | 'fault:<id>' | 'schedule:<id>'. */
  const [editor, setEditor] = useState<string | null>(null);
  const editorTrigger = useRef<HTMLElement | null>(null);
  const [readingInput, setReadingInput] = useState('');
  const [readingError, setReadingError] = useState<string | null>(null);
  const [faultOpen, setFaultOpen] = useState(false);
  const [faultText, setFaultText] = useState('');
  const [faultCost, setFaultCost] = useState('');
  const [faultDeadline, setFaultDeadline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const historyHeading = useRef<HTMLHeadingElement>(null);
  const faultsHeading = useRef<HTMLHeadingElement>(null);

  const schedules = useMemo(() => (asset ? evaluateAsset(data, asset) : []), [data, asset]);
  const entries = useMemo(() => (asset ? entriesForAsset(data, asset.id) : []), [data, asset]);
  const faults = useMemo(() => (asset ? faultsForAsset(data, asset.id) : []), [data, asset]);
  const openFaults = useMemo(() => (asset ? openFaultsForAsset(data, asset.id) : []), [data, asset]);
  const correctedFaults = useMemo(() => (asset ? correctedFaultsForAsset(data, asset.id) : []), [data, asset]);
  const deadlined = asset ? isAssetDeadlined(data, asset.id) : false;
  const sparkline = useMemo(() => monthlyPartsCost(entries), [entries]);
  const readingFloor = useMemo(() => (asset ? maxEntryReading(data, asset.id) : null), [data, asset]);

  if (!asset) {
    return (
      <EmptyState
        title="Asset not found"
        action={<ButtonLink to="/">Back to Dashboard</ButtonLink>}
      />
    );
  }

  const readingLabel = asset.unit === 'mi' ? 'Odometer' : 'Engine hours';
  const faultCostError = validateCost(faultCost);

  function openEditor(key: string, trigger: HTMLElement) {
    editorTrigger.current = trigger;
    setEditor(key);
  }

  /** Closes the open edit form and returns focus to the button that opened it. */
  function closeEditor() {
    setEditor(null);
    const trigger = editorTrigger.current;
    requestAnimationFrame(() => trigger?.isConnected && trigger.focus());
  }

  /** Errors propagate to the form, which stays open with "Couldn't save". */
  async function saveEdit(action: () => Promise<void>, success: string) {
    await action();
    showToast(success);
    closeEditor();
  }

  function toggleEditor(key: string, trigger: HTMLElement) {
    if (editor === key) closeEditor();
    else openEditor(key, trigger);
  }

  function startEdit(trigger: HTMLElement) {
    setReadingInput(String(asset!.reading));
    setReadingError(null);
    openEditor('reading', trigger);
  }

  async function saveReading(e: FormEvent) {
    e.preventDefault();
    const error = validateAssetReading(readingInput, readingFloor);
    setReadingError(error);
    if (error || saving) return;
    setSaving(true);
    try {
      await setReading(asset!.id, parseNumber(readingInput)!);
      showToast(`${readingLabel} updated`);
      closeEditor();
    } catch {
      setReadingError("Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  }

  async function saveFault(e: FormEvent) {
    e.preventDefault();
    if (saving || !faultText.trim() || faultCostError) return;
    setSaving(true);
    try {
      await reportFault(asset!.id, {
        description: faultText.trim(),
        deadline: faultDeadline,
        cost: parseNumber(faultCost) ?? 0,
      });
      setFaultText('');
      setFaultCost('');
      setFaultDeadline(false);
      setFaultOpen(false);
      showToast('Fault reported');
    } catch {
      showToast("Couldn't save — try again", 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeAsset() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAsset(asset!.id, () => {
        showToast('Asset deleted');
        navigate('/');
      });
    } catch {
      showToast("Couldn't delete — try again", 'error');
      setDeleting(false);
    }
  }

  function cancelDeleteAsset() {
    setDeleteOpen(false);
    requestAnimationFrame(() => deleteTrigger.current?.focus());
  }

  /** Wraps a delete so failures show the error toast and never reach the row control. */
  async function runDelete(action: () => Promise<void>, success: string, heading: RefObject<HTMLHeadingElement | null>) {
    try {
      await action();
      showToast(success);
      // The deleted row (and its focused control) is gone; park focus on the section heading.
      requestAnimationFrame(() => heading.current?.focus());
    } catch {
      showToast("Couldn't delete — try again", 'error');
    }
  }

  /** Shared by the open and corrected fault lists. */
  const faultListProps = {
    onDelete: (f: Fault) => runDelete(() => deleteFault(f.id), 'Fault deleted', faultsHeading),
    editingId: editor?.startsWith('fault:') ? editor.slice(6) : null,
    onEdit: (f: Fault, t: HTMLButtonElement) => toggleEditor(`fault:${f.id}`, t),
    renderEditor: (f: Fault) => (
      <EditFaultForm
        fault={f}
        onCancel={closeEditor}
        onSave={(input) => saveEdit(() => updateFault(f.id, input), 'Fault updated')}
      />
    ),
  };

  return (
    <>
      <BackLink to="/">Dashboard</BackLink>
      <PageHeader
        title={asset.name}
        subtitle={`${asset.kind} · ${asset.model}`}
        titleClassName={deadlined ? DEADLINE_HIGHLIGHT : undefined}
        titleAside={deadlined && <DeadlineBadge />}
        actions={
          <>
            <ButtonLink to={`/log?asset=${asset.id}`}>
              <Plus size={20} aria-hidden /> Log Service
            </ButtonLink>
            <Button variant="ghost" onClick={() => setFaultOpen((o) => !o)} aria-expanded={faultOpen}>
              <Flag size={18} aria-hidden /> Report Fault
            </Button>
            <Button variant="ghost" onClick={(e) => toggleEditor('asset', e.currentTarget)} aria-expanded={editor === 'asset'}>
              <Pencil size={18} aria-hidden /> Edit Asset
            </Button>
            <Button ref={deleteTrigger} variant="danger-ghost" onClick={() => setDeleteOpen((o) => !o)} aria-expanded={deleteOpen}>
              <Trash2 size={18} aria-hidden /> Delete Asset
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
            <div className="grid gap-3 md:grid-cols-2">
              <Field id="fault-cost" label="Cost ($)" error={faultCostError}>
                <Input
                  id="fault-cost"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={faultCost}
                  invalid={!!faultCostError}
                  aria-describedby={faultCostError ? 'fault-cost-error' : undefined}
                  onChange={(e) => setFaultCost(e.target.value)}
                />
              </Field>
              <DeadlineCheckbox id="fault-deadline" checked={faultDeadline} onChange={setFaultDeadline} className="md:pt-[1.625rem]" />
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button type="submit" disabled={!faultText.trim() || !!faultCostError || saving}>Submit Fault</Button>
              <Button variant="ghost" onClick={() => setFaultOpen(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {editor === 'asset' && (
          <EditAssetForm
            asset={asset}
            floor={readingFloor}
            onCancel={closeEditor}
            onSave={(input) => saveEdit(() => updateAsset(asset.id, input), 'Asset updated')}
          />
        )}

        {deleteOpen && (
          <div
            role="group"
            aria-label="Confirm delete asset"
            className="flex flex-col gap-3 rounded-xl border border-danger bg-surface p-4 motion-safe:animate-slide-in"
            onKeyDown={(e) => e.key === 'Escape' && !deleting && cancelDeleteAsset()}
          >
            <p>Delete {asset.name} and all its service history and faults? This can't be undone.</p>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button variant="danger" disabled={deleting} onClick={removeAsset}>Delete Asset</Button>
              <Button variant="ghost" disabled={deleting} onClick={cancelDeleteAsset} autoFocus>Cancel</Button>
            </div>
          </div>
        )}

        <section aria-labelledby="reading-heading" className="rounded-xl border border-line bg-surface p-4">
          <h2 id="reading-heading" className="text-sm text-muted">Current {readingLabel.toLowerCase()}</h2>
          {editor === 'reading' ? (
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
                <Button type="submit" disabled={saving}>Save</Button>
                <Button variant="ghost" onClick={closeEditor}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-display text-4xl font-bold tabular-nums">
                {formatNumber(asset.reading)} <span className="text-xl text-muted">{asset.unit}</span>
              </p>
              <Button variant="ghost" onClick={(e) => startEdit(e.currentTarget)}>Update</Button>
            </div>
          )}
        </section>

        <section aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="mb-3 font-display text-xl font-semibold">Schedule</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {schedules.map((s) => {
              const key = `schedule:${s.schedule.id}`;
              return (
                <ScheduleRow
                  key={s.schedule.id}
                  item={s}
                  editing={editor === key}
                  onEdit={(t) => toggleEditor(key, t)}
                  editor={
                    <EditIntervalForm
                      schedule={s.schedule}
                      onCancel={closeEditor}
                      onSave={(interval) => saveEdit(() => updateInterval(s.schedule.id, interval), 'Interval updated')}
                    />
                  }
                />
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="history-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 id="history-heading" ref={historyHeading} tabIndex={-1} className="font-display text-xl font-semibold focus-visible:outline-none">Service history</h2>
            {entries.length > 0 && <Sparkline points={sparkline} />}
          </div>
          {entries.length === 0 ? (
            <EmptyState
              title="No services logged yet — log the first one"
              action={<ButtonLink to={`/log?asset=${asset.id}`}>Log Service</ButtonLink>}
            />
          ) : (
            <ServiceHistory
              entries={entries}
              unit={asset.unit}
              highlightId={lastAddedEntryId}
              onDelete={(e) => runDelete(() => deleteEntry(e.id), 'Entry deleted', historyHeading)}
              editingId={editor?.startsWith('entry:') ? editor.slice(6) : null}
              onEdit={(e, t) => toggleEditor(`entry:${e.id}`, t)}
              renderEditor={(e) => (
                <EditEntryForm
                  entry={e}
                  unit={asset.unit}
                  maxReading={asset.reading}
                  onCancel={closeEditor}
                  onSave={(input) => saveEdit(() => updateEntry(e.id, input), 'Entry updated')}
                />
              )}
            />
          )}
        </section>

        <section aria-labelledby="faults-heading" className="flex flex-col gap-4">
          <h2 id="faults-heading" ref={faultsHeading} tabIndex={-1} className="font-display text-xl font-semibold focus-visible:outline-none">Faults</h2>
          {faults.length === 0 ? (
            <EmptyState title="No faults reported" />
          ) : openFaults.length === 0 ? (
            <EmptyState title="No open faults" />
          ) : (
            <FaultList faults={openFaults} {...faultListProps} />
          )}
          {correctedFaults.length > 0 && (
            <>
              <h3 className="font-display text-lg font-semibold text-muted">Corrected faults</h3>
              <FaultList faults={correctedFaults} correctedOn={(f) => correctedOn(data, f)} {...faultListProps} />
            </>
          )}
        </section>
      </div>
    </>
  );
}
