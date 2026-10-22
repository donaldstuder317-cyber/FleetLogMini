import { IDS, expect, test } from './fixtures';

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

test('the wordmark links back to the Dashboard by mouse and keyboard', async ({ page }) => {
  await page.goto('/export');
  const home = page.getByRole('link', { name: 'FleetLog Mini — Dashboard' });
  await expect(home).toHaveCount(1);
  await home.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.goto('/alerts');
  await home.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/$/);
});

test('Deadline filter and Most urgent sort put deadlined assets first', async ({ page }) => {
  await page.goto(`/assets/${IDS.excavator3}`);
  await page.getByRole('button', { name: 'Report Fault' }).click();
  await page.getByLabel('Describe the fault').fill('Hydraulic hose burst');
  await page.getByRole('checkbox', { name: /deadline/i }).check();
  await page.getByRole('button', { name: 'Submit Fault' }).click();
  await expect(page.getByText('Fault reported')).toBeVisible();

  await page.goto('/');
  const rows = page.getByRole('main').getByRole('link', { name: /Truck 12|Van 4|Excavator 3/ });
  await expect(rows.first()).toContainText('Excavator 3'); // deadlined beats Overdue Truck 12
  // DEADLINE replaces the status badge: one badge only
  await expect(rows.first().locator('[data-status]')).toHaveCount(0);
  await expect(rows.first()).not.toContainText('Due Soon');
  await expect(rows.nth(1).locator('[data-status="overdue"]')).toHaveCount(1);
  await expect(rows.nth(1)).toContainText('Truck 12');

  await page.getByLabel('Deadline').selectOption('yes');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Excavator 3');

  await page.getByLabel('Deadline').selectOption('no');
  await expect(rows).toHaveCount(2);

  // Combined with Status: deadlined + Overdue matches nothing; Clear filter resets both
  await page.getByLabel('Deadline').selectOption('yes');
  await page.getByLabel('Status').selectOption('overdue');
  await expect(page.getByText('No assets match this filter')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filter' }).click();
  await expect(rows).toHaveCount(3);
  await expect(page.getByLabel('Deadline')).toHaveValue('all');
  await expect(page.getByLabel('Status')).toHaveValue('all');
});
