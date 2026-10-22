import { useState } from 'react';
import { useInlineSave } from '../../hooks/useInlineSave';
import { todayISO } from '../../lib/dates';
import type { EntryEditInput } from '../../services/fleetService';
import {
  parseNumber,
  validateCost,
  validateEntryReading,
  validatePastDate,
} from '../../services/validation';
import type { ReadingUnit, ServiceEntry } from '../../types';
import { EditPanel } from './EditPanel';
import { Field } from './Field';
import { Input, Textarea } from './controls';

interface EditEntryFormProps {
  entry: ServiceEntry;
  unit: ReadingUnit;
  /** The asset's current reading; an entry can't be above it. */
  maxReading: number;
  onSave: (input: EntryEditInput) => Promise<void>;
  onCancel: () => void;
}

export function EditEntryForm({ entry, unit, maxReading, onSave, onCancel }: EditEntryFormProps) {
  const [date, setDate] = useState(entry.date);
  const [reading, setReading] = useState(String(entry.reading));
  const [cost, setCost] = useState(entry.partsCost ? String(entry.partsCost) : '');
  const [notes, setNotes] = useState(entry.notes);
  const { submitted, saving, saveError, run } = useInlineSave();

  const id = `edit-entry-${entry.id}`;
  const errors = {
    date: validatePastDate(date),
    reading: validateEntryReading(reading, maxReading),
    cost: validateCost(cost),
  };
  const shown = (key: keyof typeof errors) => (submitted ? errors[key] : null);

  return (
    <EditPanel
      label={`Edit ${entry.task} entry`}
      saving={saving}
      saveError={saveError}
      onCancel={onCancel}
      onSubmit={() =>
        run(!Object.values(errors).some(Boolean), () =>
          onSave({ date, reading: parseNumber(reading)!, partsCost: parseNumber(cost) ?? 0, notes: notes.trim() }),
        )
      }
    >
      <p className="text-sm text-muted">
        Task: <span className="font-medium text-ink">{entry.task}</span>
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Field id={`${id}-date`} label="Date" error={shown('date')}>
          <Input
            id={`${id}-date`}
            type="date"
            max={todayISO()}
            value={date}
            invalid={!!shown('date')}
            aria-describedby={shown('date') ? `${id}-date-error` : undefined}
            onChange={(e) => setDate(e.target.value)}
            autoFocus
          />
        </Field>
        <Field id={`${id}-reading`} label={`${unit === 'mi' ? 'Odometer' : 'Engine hours'} (${unit})`} error={shown('reading')}>
          <Input
            id={`${id}-reading`}
            inputMode="decimal"
            className="font-display tabular-nums"
            value={reading}
            invalid={!!shown('reading')}
            aria-describedby={shown('reading') ? `${id}-reading-error` : undefined}
            onChange={(e) => setReading(e.target.value)}
          />
        </Field>
        <Field id={`${id}-cost`} label="Parts cost ($)" error={shown('cost')}>
          <Input
            id={`${id}-cost`}
            inputMode="decimal"
            placeholder="0.00"
            className="font-display tabular-nums"
            value={cost}
            invalid={!!shown('cost')}
            aria-describedby={shown('cost') ? `${id}-cost-error` : undefined}
            onChange={(e) => setCost(e.target.value)}
          />
        </Field>
      </div>
      <Field id={`${id}-notes`} label="Notes">
        <Textarea id={`${id}-notes`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </EditPanel>
  );
}
