import { useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Field } from '../components/forms/Field';
import { Input, Select } from '../components/forms/controls';
import { BackLink } from '../components/layout/BackLink';
import { PageHeader } from '../components/layout/PageHeader';
import { useFleet, useToast } from '../hooks/useFleet';
import { parseNumber, validateAssetModel, validateAssetName } from '../services/validation';
import { ASSET_KINDS, type ReadingUnit } from '../types';

export function AddAssetPage() {
  const { createAsset } = useFleet();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [kind, setKind] = useState(ASSET_KINDS[0]);
  const [model, setModel] = useState('');
  const [unit, setUnit] = useState<ReadingUnit>('mi');
  const [reading, setReading] = useState('0');
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nameError = submitted ? validateAssetName(name) : null;
  const modelError = submitted ? validateAssetModel(model) : null;
  const parsed = parseNumber(reading);
  const readingError = submitted && (parsed === null || parsed < 0) ? 'Enter a valid number' : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (saving || validateAssetName(name) || validateAssetModel(model) || parsed === null || parsed < 0) return;
    setSaveError(null);
    setSaving(true);
    try {
      const asset = await createAsset({ name: name.trim(), kind, model: model.trim(), unit, reading: parsed });
      showToast('Asset added');
      navigate(`/assets/${asset.id}`);
    } catch {
      setSaveError("Couldn't save — try again");
      setSaving(false);
    }
  }

  return (
    <>
      <BackLink to="/">Dashboard</BackLink>
      <PageHeader title="Add Asset" subtitle="Default service schedules are created for you" />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 md:max-w-3xl">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="asset-name" label="Name" error={nameError}>
            <Input id="asset-name" value={name} invalid={!!nameError} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="asset-kind" label="Type">
            <Select id="asset-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
              {ASSET_KINDS.map((k) => <option key={k}>{k}</option>)}
            </Select>
          </Field>
          <Field id="asset-model" label="Model" error={modelError}>
            <Input id="asset-model" value={model} invalid={!!modelError} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field id="asset-unit" label="Tracked by">
            <Select id="asset-unit" value={unit} onChange={(e) => setUnit(e.target.value as ReadingUnit)}>
              <option value="mi">Odometer (miles)</option>
              <option value="hrs">Engine hours</option>
            </Select>
          </Field>
          <Field id="asset-reading" label={`Current ${unit === 'mi' ? 'odometer' : 'hours'}`} error={readingError}>
            <Input id="asset-reading" inputMode="decimal" value={reading} invalid={!!readingError} onChange={(e) => setReading(e.target.value)} />
          </Field>
        </div>
        {saveError && (
          <p role="alert" className="flex items-start gap-1.5 text-sm text-danger">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {saveError}
          </p>
        )}
        <div className="flex flex-col gap-3 md:flex-row">
          <Button type="submit" disabled={saving}>Save Asset</Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </>
  );
}
