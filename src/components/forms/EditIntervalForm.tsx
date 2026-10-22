import { useState } from 'react';
import { useInlineSave } from '../../hooks/useInlineSave';
import { parseNumber, validateInterval } from '../../services/validation';
import type { IntervalUnit, Schedule } from '../../types';
import { EditPanel } from './EditPanel';
import { Field } from './Field';
import { Input } from './controls';

const UNIT_LABEL: Record<IntervalUnit, string> = { mi: 'miles', hrs: 'hours', days: 'days' };

interface EditIntervalFormProps {
  schedule: Schedule;
  onSave: (interval: number) => Promise<void>;
  onCancel: () => void;
}

/** Only the interval number changes; the unit is fixed. */
export function EditIntervalForm({ schedule, onSave, onCancel }: EditIntervalFormProps) {
  const [interval, setIntervalValue] = useState(String(schedule.interval));
  const { submitted, saving, saveError, run } = useInlineSave();

  const id = `edit-interval-${schedule.id}`;
  const error = submitted ? validateInterval(interval) : null;

  return (
    <EditPanel
      label={`Edit ${schedule.task} interval`}
      saving={saving}
      saveError={saveError}
      onCancel={onCancel}
      onSubmit={() => run(!validateInterval(interval), () => onSave(parseNumber(interval)!))}
    >
      <Field id={id} label={`Interval (${UNIT_LABEL[schedule.unit]})`} error={error}>
        <Input
          id={id}
          inputMode="numeric"
          className="font-display tabular-nums md:max-w-48"
          value={interval}
          invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => setIntervalValue(e.target.value)}
          autoFocus
        />
      </Field>
    </EditPanel>
  );
}
