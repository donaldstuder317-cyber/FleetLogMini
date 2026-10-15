import { expect, test } from '@playwright/test';

test('odometer below last reading shows inline error and keeps other fields', async ({ page }) => {
  await page.goto('/log?asset=truck-12');
  await page.getByLabel('Task type').selectOption('Brakes');
  await page.getByLabel('Parts cost').fill('120');
  await page.getByLabel(/Odometer/).fill('40000');
  await page.getByRole('button', { name: 'Save Entry' }).click();
  await expect(page.getByText("Odometer can't be lower than last reading (48,210)")).toBeVisible();
  await expect(page.getByLabel('Parts cost')).toHaveValue('120');
  await expect(page.getByLabel('Task type')).toHaveValue('Brakes');
});

test('Save stays disabled until a task type is picked', async ({ page }) => {
  await page.goto('/log');
  await expect(page.getByRole('button', { name: 'Save Entry' })).toBeDisabled();
  await page.getByLabel('Task type').selectOption('Inspection');
  await expect(page.getByRole('button', { name: 'Save Entry' })).toBeEnabled();
});

test('saved oil change appears at the top of the asset history', async ({ page }) => {
  await page.goto('/log?asset=truck-12');
  await page.getByLabel('Task type').selectOption('Oil change');
  await page.getByLabel('Notes').fill('E2E entry');
  await page.getByRole('button', { name: 'Save Entry' }).click();
  await page.goto('/assets/truck-12');
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const first = page.locator('[data-testid=history-row]:visible').first();
  await expect(first).toContainText('Oil change');
  await expect(first).toContainText(today);
});

test('form works by keyboard alone', async ({ page }) => {
  await page.goto('/log');
  await page.getByLabel('Asset').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Task type')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Date')).toBeFocused();
});
