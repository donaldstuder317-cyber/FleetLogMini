import { expect, test } from '@playwright/test';

const alertLinks = (page: import('@playwright/test').Page) =>
  page.getByRole('main').getByRole('link', { name: /Truck 12|Van 4|Excavator 3/ });

test('seeded data shows 1 Overdue and 2 Due Soon', async ({ page }) => {
  await page.goto('/alerts');
  await expect(alertLinks(page)).toHaveCount(3);
  await expect(page.locator('[data-status="overdue"]')).toHaveCount(1);
  await expect(page.locator('[data-status="due"]')).toHaveCount(2);
});

test('a 7-day window hides Van 4 tire rotation', async ({ page }) => {
  await page.goto('/alerts');
  await page.getByLabel('Within (days)').selectOption('7');
  await expect(page.getByRole('main').getByRole('link', { name: /Van 4/ })).toHaveCount(0);
});

test('tapping an alert opens the correct asset', async ({ page }) => {
  await page.goto('/alerts');
  await page.getByRole('main').getByRole('link', { name: /Excavator 3/ }).click();
  await expect(page).toHaveURL(/\/assets\/excavator-3/);
  await expect(page.getByRole('heading', { name: 'Excavator 3' })).toBeVisible();
});
