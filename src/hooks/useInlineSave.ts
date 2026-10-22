import { useState } from 'react';

/**
 * Submit state for an inline edit form. `run` shows field errors (via `submitted`), skips the save
 * while invalid or already saving, and keeps the form open with "Couldn't save" if the save throws.
 * On success the parent closes (unmounts) the form.
 */
export function useInlineSave() {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function run(valid: boolean, save: () => Promise<void>) {
    setSubmitted(true);
    if (saving || !valid) return;
    setSaving(true);
    setSaveError(null);
    try {
      await save();
    } catch {
      setSaveError("Couldn't save — try again");
      setSaving(false);
    }
  }

  return { submitted, saving, saveError, run };
}
