import { expect, IDS, test } from './fixtures';

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
  await expect(page).toHaveURL(new RegExp(`/assets/${IDS.excavator3}`));
  await expect(page.getByRole('heading', { name: 'Excavator 3' })).toBeVisible();
});

test('Deadline filter: Yes shows only deadlined assets, No the rest', async ({ page }) => {
  await page.goto('/alerts');
  await page.getByLabel('Deadline').selectOption('yes');
  await expect(page.getByText('Nothing due in this window 🎉')).toBeVisible();

  await page.goto(`/assets/${IDS.van4}`);
  await page.getByRole('button', { name: 'Report Fault' }).click();
  await page.getByLabel('Describe the fault').fill('Brake line leaking');
  await page.getByRole('checkbox', { name: /deadline/i }).check();
  await page.getByRole('button', { name: 'Submit Fault' }).click();
  await expect(page.getByText('Fault reported')).toBeVisible();

  await page.goto('/alerts');
  await expect(page.getByRole('main').getByRole('link', { name: /Van 4/ })).toContainText('Deadline');
  await expect(alertLinks(page).first()).toContainText('Van 4'); // deadlined first, ahead of Overdue Truck 12
  await expect(alertLinks(page).first().locator('[data-status]')).toHaveCount(0); // DEADLINE replaces the status badge
  await expect(alertLinks(page).first()).not.toContainText('Due Soon');
  await page.getByLabel('Deadline').selectOption('yes');
  await expect(alertLinks(page)).toHaveCount(1);
  await expect(alertLinks(page).first()).toContainText('Van 4');
  await page.getByLabel('Deadline').selectOption('no');
  await expect(alertLinks(page)).toHaveCount(2);
  await expect(page.getByRole('main').getByRole('link', { name: /Van 4/ })).toHaveCount(0);
});
