import { useState } from 'react';
import { useInlineSave } from '../../hooks/useInlineSave';
import { todayISO } from '../../lib/dates';
import { formatCurrency } from '../../lib/format';
import { isFaultOpen, type FaultEditInput } from '../../services/fleetService';
import { parseNumber, validateCost, validateFaultDescription, validatePastDate } from '../../services/validation';
import type { Fault } from '../../types';
import { DeadlineCheckbox } from './DeadlineCheckbox';
import { EditPanel } from './EditPanel';
import { Field } from './Field';
import { Input, Textarea } from './controls';

interface EditFaultFormProps {
  fault: Fault;
  onSave: (input: FaultEditInput) => Promise<void>;
  onCancel: () => void;
}

/** Cost and DEADLINE are editable only while the fault is open; a corrected fault shows its cost read-only. */
export function EditFaultForm({ fault, onSave, onCancel }: EditFaultFormProps) {
  const open = isFaultOpen(fault);
  const [date, setDate] = useState(fault.date);
  const [description, setDescription] = useState(fault.description);
  const [cost, setCost] = useState(String(fault.cost));
  const [deadline, setDeadline] = useState(fault.deadline);
  const { submitted, saving, saveError, run } = useInlineSave();

  const id = `edit-fault-${fault.id}`;
  const errors = {
    date: validatePastDate(date),
    description: validateFaultDescription(description),
    cost: open ? validateCost(cost) : null,
  };
  const shown = (key: keyof typeof errors) => (submitted ? errors[key] : null);

  function input(): FaultEditInput {
    const base = { date, description: description.trim() };
    return open ? { ...base, deadline, cost: parseNumber(cost) ?? 0 } : base;
  }

  return (
    <EditPanel
      label="Edit fault"
      saving={saving}
      saveError={saveError}
      onCancel={onCancel}
      onSubmit={() => run(!Object.values(errors).some(Boolean), () => onSave(input()))}
    >
      <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
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
        <Field id={`${id}-description`} label="Description" error={shown('description')}>
          <Textarea
            id={`${id}-description`}
            rows={2}
            value={description}
            invalid={!!shown('description')}
            aria-describedby={shown('description') ? `${id}-description-error` : undefined}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        {open ? (
          <>
            <Field id={`${id}-cost`} label="Cost ($)" error={shown('cost')}>
              <Input
                id={`${id}-cost`}
                inputMode="decimal"
                placeholder="0.00"
                value={cost}
                invalid={!!shown('cost')}
                aria-describedby={shown('cost') ? `${id}-cost-error` : undefined}
                onChange={(e) => setCost(e.target.value)}
              />
            </Field>
            <DeadlineCheckbox id={`${id}-deadline`} checked={deadline} onChange={setDeadline} className="md:pt-[1.625rem]" />
          </>
        ) : (
          <p className="text-sm text-muted md:col-span-2">
            Cost {formatCurrency(fault.cost)} — locked because this fault was corrected.
          </p>
        )}
      </div>
    </EditPanel>
  );
}
