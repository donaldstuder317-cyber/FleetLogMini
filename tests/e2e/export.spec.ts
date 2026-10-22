import { IDS, expect, test } from './fixtures';
import { readFileSync } from 'node:fs';

test('CSV download matches the preview count', async ({ page }) => {
  await page.goto('/export');
  const preview = await page.getByTestId('export-preview').innerText();
  const count = Number(preview.match(/^(\d+)/)![1]);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download' }).click(),
  ]);
  const lines = readFileSync((await download.path())!, 'utf8').trim().split(/\r?\n/);
  expect(lines[0]).toBe('row_type,date,asset,task,odometer,parts_cost,fault,deadline,fault_cost,total,notes');
  expect(lines.filter((l) => l.startsWith('service,'))).toHaveLength(count);
  expect(lines.filter((l) => l.startsWith('total,'))).toHaveLength(3);
  expect(lines.at(-1)).toMatch(/^grand_total,/);
});

test('the page is only assets, dates and format — no reload footer', async ({ page }) => {
  await page.goto('/export');
  await expect(page.getByText('Data is loaded from the server')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reload data from server' })).toHaveCount(0);
});

test('corrected faults and their cost are in the export and the totals', async ({ page }) => {
  await page.goto(`/assets/${IDS.van4}`);
  await page.getByRole('button', { name: 'Report Fault' }).click();
  await page.getByLabel('Describe the fault').fill('Brake line leaking');
  await page.getByLabel('Cost ($)').fill('240.50');
  await page.getByRole('checkbox', { name: /deadline/i }).check();
  await page.getByRole('button', { name: 'Submit Fault' }).click();
  await expect(page.getByText('Fault reported')).toBeVisible();

  await page.goto(`/log?asset=${IDS.van4}`);
  await page.getByLabel('Task type').selectOption('Brakes');
  await page.getByLabel('Parts cost').fill('100');
  await page.getByRole('group', { name: 'Faults corrected' }).getByRole('checkbox', { name: 'All' }).check();
  await page.getByRole('button', { name: 'Save Entry' }).click();
  await expect(page.getByText('Saved')).toBeVisible();

  await page.goto('/export');
  await page.getByRole('checkbox', { name: 'All assets' }).uncheck();
  await page.getByRole('checkbox', { name: 'Van 4' }).check();
  await expect(page.getByTestId('export-preview')).toContainText('1 fault corrected');
  await expect(page.getByTestId('export-preview')).toContainText('$452.75'); // 112.25 + 100 + 240.50

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download' }).click(),
  ]);
  const lines = readFileSync((await download.path())!, 'utf8').trim().split(/\r?\n/);
  const serviceAt = lines.findIndex((l) => l.startsWith('service,') && l.includes(',Brakes,'));
  expect(lines[serviceAt + 1]).toMatch(/^fault_corrected,.*,Van 4,,,,Brake line leaking,DEADLINE,240.5,,/);
  expect(lines.find((l) => l.startsWith('total,'))).toBe('total,,Van 4,Total,,212.25,,,240.5,452.75,');
});

test('start after end shows an error', async ({ page }) => {
  await page.goto('/export');
  await page.getByLabel('From', { exact: true }).fill('2026-12-31');
  await page.getByLabel('To', { exact: true }).fill('2026-01-01');
  await expect(page.getByText('Start date must be before end date')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download' })).toBeDisabled();
});

test('empty range disables Download', async ({ page }) => {
  await page.goto('/export');
  await page.getByLabel('From', { exact: true }).fill('2001-01-01');
  await page.getByLabel('To', { exact: true }).fill('2001-01-02');
  await expect(page.getByText('No entries in this range — widen dates')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download' })).toBeDisabled();
});

test('unticking every asset disables Download instead of exporting the whole fleet', async ({ page }) => {
  await page.goto('/export');
  const all = page.getByRole('checkbox', { name: 'All assets' });
  await all.uncheck();
  await expect(page.getByText('Select at least one asset to export.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download' })).toBeDisabled();

  // Picking one asset re-enables it; unticking that last asset goes back to none, not all.
  await page.getByRole('checkbox', { name: 'Truck 12' }).check();
  await expect(page.getByRole('button', { name: 'Download' })).toBeEnabled();
  await page.getByRole('checkbox', { name: 'Truck 12' }).uncheck();
  await expect(all).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Download' })).toBeDisabled();

  await all.check();
  await expect(page.getByTestId('export-preview')).toBeVisible();
});
