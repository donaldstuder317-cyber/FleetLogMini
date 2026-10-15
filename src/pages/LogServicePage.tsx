import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Field } from '../components/forms/Field';
import { Input, Select, Textarea } from '../components/forms/controls';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ButtonLink } from '../components/common/Button';
import { useFleet, useToast } from '../hooks/useFleet';
import { todayISO } from '../lib/dates';
import { parseNumber, validateCost, validateReading } from '../services/validation';
import { TASK_TYPES, type TaskType } from '../types';

export function LogServicePage() {
  const { data, addEntry } = useFleet();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const preselected = data.assets.find((a) => a.id === params.get('asset'));
  const firstAsset = preselected ?? data.assets[0];

  const [assetId, setAssetId] = useState(firstAsset?.id ?? '');
  const [task, setTask] = useState<TaskType | ''>('');
  const [date, setDate] = useState(todayISO());
  const [reading, setReading] = useState(firstAsset ? String(firstAsset.reading) : '');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [taskTouched, setTaskTouched] = useState(false);
  const [readingTouched, setReadingTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const asset = data.assets.find((a) => a.id === assetId);

  if (!asset) {
    return (
      <EmptyState
        title="No equipment yet — add your first asset"
        action={<ButtonLink to="/assets/new">Add Asset</ButtonLink>}
      />
    );
  }

  const unitLabel = asset.unit === 'mi' ? 'Odometer' : 'Engine hours';
  const readingError = readingTouched ? validateReading(reading, asset.reading) : null;
  const costError = validateCost(cost);
  const taskError = !task && (taskTouched || dirty) ? 'Pick a task type' : null;

  function onAssetChange(id: string) {
    setAssetId(id);
    const next = data.assets.find((a) => a.id === id);
    if (next) setReading(String(next.reading));
    setReadingTouched(false);
    setDirty(true);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setReadingTouched(true);
    setSaveError(null);
    if (!task || !date || validateReading(reading, asset!.reading) || costError) return;
    try {
      addEntry({
        assetId: asset!.id,
        task,
        date,
        reading: parseNumber(reading)!,
        partsCost: parseNumber(cost) ?? 0,
        notes: notes.trim(),
      });
    } catch {
      setSaveError("Couldn't save — try again");
      return; // nothing is lost: every field keeps its value
    }
    showToast('Saved');
    navigate('/');
  }

  function cancel() {
    if (location.key === 'default') navigate('/');
    else navigate(-1);
  }

  return (
    <>
      <PageHeader title="Log Service" subtitle="Record a completed service in under 30 seconds" />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 md:max-w-3xl">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="asset" label="Asset">
            <Select id="asset" value={assetId} onChange={(e) => onAssetChange(e.target.value)}>
              {data.assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>
          <Field id="task" label="Task type" error={taskError}>
            <Select
              id="task"
              value={task}
              invalid={!!taskError}
              aria-describedby={taskError ? 'task-error' : undefined}
              onBlur={() => setTaskTouched(true)}
              onChange={(e) => {
                setTask(e.target.value as TaskType | '');
                setTaskTouched(true);
              }}
            >
              <option value="">Select a task…</option>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field id="date" label="Date">
            <Input id="date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setDirty(true); }} />
          </Field>
          <Field id="reading" label={`${unitLabel} (${asset.unit})`} error={readingError}>
            <Input
              id="reading"
              inputMode="decimal"
              value={reading}
              invalid={!!readingError}
              aria-describedby={readingError ? 'reading-error' : undefined}
              onBlur={() => setReadingTouched(true)}
              onChange={(e) => { setReading(e.target.value); setReadingTouched(true); setDirty(true); }}
            />
          </Field>
          <Field id="cost" label="Parts cost ($)" error={costError}>
            <Input
              id="cost"
              inputMode="decimal"
              placeholder="0.00"
              value={cost}
              invalid={!!costError}
              aria-describedby={costError ? 'cost-error' : undefined}
              onChange={(e) => { setCost(e.target.value); setDirty(true); }}
            />
          </Field>
        </div>
        <Field id="notes" label="Notes">
          <Textarea id="notes" rows={3} value={notes} onChange={(e) => { setNotes(e.target.value); setDirty(true); }} />
        </Field>

        {saveError && <p role="alert" className="text-sm text-danger">{saveError}</p>}

        <div className="flex flex-col gap-3 md:flex-row">
          <Button type="submit" disabled={!task}>Save Entry</Button>
          <Button variant="ghost" onClick={cancel}>Cancel</Button>
        </div>
      </form>
    </>
  );
}
