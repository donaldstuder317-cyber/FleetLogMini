import { expect, test } from '@playwright/test';

test('Truck 12 shows Oil change OVERDUE by 340 mi', async ({ page }) => {
  await page.goto('/assets/truck-12');
  await expect(page.getByText('OVERDUE by 340 mi')).toBeVisible();
});

test('updating the odometer recalculates badges immediately', async ({ page }) => {
  await page.goto('/assets/truck-12');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.getByLabel(/New odometer/).fill('48000');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText("Odometer can't be lower than last reading (48,210)")).toBeVisible();
  await page.getByLabel(/New odometer/).fill('50000');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('OVERDUE by 2,130 mi')).toBeVisible();
});

test('Log Service pre-selects the asset', async ({ page }) => {
  await page.goto('/assets/truck-12');
  await page.getByRole('link', { name: 'Log Service' }).click();
  await expect(page).toHaveURL(/\/log\?asset=truck-12/);
  await expect(page.getByLabel('Asset')).toHaveValue('truck-12');
});

test('unknown id shows Asset not found', async ({ page }) => {
  await page.goto('/assets/nope');
  await expect(page.getByText('Asset not found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Dashboard' })).toBeVisible();
});
