import { expect, test } from '@playwright/test';
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
  expect(lines[0]).toBe('date,asset,task,odometer,parts_cost,notes');
  expect(lines.length - 1).toBe(count);
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
