import { useState } from 'react';
import { useInlineSave } from '../../hooks/useInlineSave';
import type { AssetEditInput } from '../../services/fleetService';
import {
  parseNumber,
  validateAssetModel,
  validateAssetName,
  validateAssetReading,
} from '../../services/validation';
import { ASSET_KINDS, type Asset } from '../../types';
import { EditPanel } from './EditPanel';
import { Field } from './Field';
import { Input, Select } from './controls';

interface EditAssetFormProps {
  asset: Asset;
  /** Highest logged service reading; the reading can't go below it. */
  floor: number | null;
  onSave: (input: AssetEditInput) => Promise<void>;
  onCancel: () => void;
}

export function EditAssetForm({ asset, floor, onSave, onCancel }: EditAssetFormProps) {
  const [name, setName] = useState(asset.name);
  const [kind, setKind] = useState(asset.kind);
  const [model, setModel] = useState(asset.model);
  const [reading, setReading] = useState(String(asset.reading));
  const { submitted, saving, saveError, run } = useInlineSave();

  const errors = {
    name: validateAssetName(name),
    model: validateAssetModel(model),
    reading: validateAssetReading(reading, floor),
  };
  const shown = (key: keyof typeof errors) => (submitted ? errors[key] : null);
  const kinds = ASSET_KINDS.includes(asset.kind) ? ASSET_KINDS : [...ASSET_KINDS, asset.kind];
  const readingLabel = asset.unit === 'mi' ? 'Odometer' : 'Engine hours';

  return (
    <EditPanel
      label={`Edit ${asset.name}`}
      saving={saving}
      saveError={saveError}
      onCancel={onCancel}
      onSubmit={() =>
        run(!Object.values(errors).some(Boolean), () =>
          onSave({ name: name.trim(), kind, model: model.trim(), reading: parseNumber(reading)! }),
        )
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="edit-asset-name" label="Name" error={shown('name')}>
          <Input
            id="edit-asset-name"
            value={name}
            invalid={!!shown('name')}
            aria-describedby={shown('name') ? 'edit-asset-name-error' : undefined}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field id="edit-asset-kind" label="Type">
          <Select id="edit-asset-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {kinds.map((k) => <option key={k}>{k}</option>)}
          </Select>
        </Field>
        <Field id="edit-asset-model" label="Model" error={shown('model')}>
          <Input
            id="edit-asset-model"
            value={model}
            invalid={!!shown('model')}
            aria-describedby={shown('model') ? 'edit-asset-model-error' : undefined}
            onChange={(e) => setModel(e.target.value)}
          />
        </Field>
        <Field id="edit-asset-reading" label={`${readingLabel} (${asset.unit})`} error={shown('reading')}>
          <Input
            id="edit-asset-reading"
            inputMode="decimal"
            className="font-display tabular-nums"
            value={reading}
            invalid={!!shown('reading')}
            aria-describedby={shown('reading') ? 'edit-asset-reading-error' : undefined}
            onChange={(e) => setReading(e.target.value)}
          />
        </Field>
      </div>
    </EditPanel>
  );
}
