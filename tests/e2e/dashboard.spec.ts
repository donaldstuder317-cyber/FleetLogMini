import { expect, test } from '@playwright/test';

test('seeded assets show with Overdue first', async ({ page }) => {
  await page.goto('/');
  const rows = page.getByRole('main').getByRole('link', { name: /Truck 12|Van 4|Excavator 3/ });
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText('Truck 12');
  await expect(rows.first()).toContainText('Overdue');
});

test('filtering by Overdue shows only Truck 12', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Status').selectOption('overdue');
  const rows = page.getByRole('main').getByRole('link', { name: /Truck 12|Van 4|Excavator 3/ });
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Truck 12');
});

test('filter with no matches shows a clear-filter state', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Status').selectOption('good');
  await expect(page.getByText('No assets match this filter')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filter' }).click();
  await expect(page.getByRole('main').getByRole('link', { name: /Truck 12/ })).toBeVisible();
});

test('logging an oil change for Truck 12 flips its badge to Good', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('main').getByRole('link', { name: 'Log Service' }).click();
  await page.getByLabel('Asset').selectOption({ label: 'Truck 12' });
  await page.getByLabel('Task type').selectOption('Oil change');
  await page.getByRole('button', { name: 'Save Entry' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  await page.getByLabel('Status').selectOption('overdue');
  await expect(page.getByText('No assets match this filter')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filter' }).click();
  await expect(page.getByRole('main').getByRole('link', { name: /Truck 12/ })).toContainText('Good');
});
