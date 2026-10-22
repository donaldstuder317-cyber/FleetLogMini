import { expandRow, expect, IDS, test } from './fixtures';

async function addAsset(page: import('@playwright/test').Page, name: string) {
  await page.goto('/assets/new');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Model').fill('Test model');
  await page.getByLabel('Current odometer').fill('1000');
  await page.getByRole('button', { name: 'Save Asset' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

test('every asset and history row has edit and delete controls (no locked rows)', async ({ page }) => {
  await page.goto(`/assets/${IDS.truck12}`);
  await expect(page.getByRole('heading', { name: 'Truck 12' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Asset' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Asset' })).toBeVisible();
  const row = page.locator('[data-testid=history-row]:visible').first();
  await expandRow(row);
  await expect(row.getByRole('button', { name: /^Delete .* entry from/ })).toBeVisible();
  await expect(row.getByRole('button', { name: /^Edit .* entry from/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Edit .* interval$/ })).toHaveCount(4);
});

test('create an asset, delete it, and it is gone from the dashboard', async ({ page }) => {
  await addAsset(page, 'Temp Rig');
  await page.getByRole('button', { name: 'Delete Asset' }).click();
  await expect(page.getByText(/Delete Temp Rig and all its service history and faults\?/)).toBeVisible();
  await page.getByRole('group', { name: 'Confirm delete asset' }).getByRole('button', { name: 'Delete Asset' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Asset deleted')).toBeVisible();
  await expect(page.getByText('Temp Rig')).toHaveCount(0);
  await expect(page.getByText('Asset not found')).toHaveCount(0);
});

test('cancelling the asset delete confirm returns focus to the Delete Asset button', async ({ page }) => {
  await addAsset(page, 'Cancel Rig');
  const trigger = page.getByRole('button', { name: 'Delete Asset', exact: true }).first();
  await trigger.click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('deleting a logged entry rolls the schedule back', async ({ page }) => {
  await page.goto(`/assets/${IDS.truck12}`);
  await expect(page.getByText('OVERDUE by 340 mi')).toBeVisible();
  await page.goto(`/log?asset=${IDS.truck12}`);
  await page.getByLabel('Task type').selectOption('Oil change');
  await page.getByRole('button', { name: 'Save Entry' }).click();
  await page.goto(`/assets/${IDS.truck12}`);
  await expect(page.getByText('OVERDUE by 340 mi')).toHaveCount(0);
  const row = page.locator('[data-testid=history-row]:visible').first();
  await expandRow(row);
  await row.getByRole('button', { name: /^Delete Oil change entry from/ }).click();
  await row.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Entry deleted')).toBeVisible();
  await expect(page.getByText('OVERDUE by 2,130 mi')).toHaveCount(0);
  await expect(page.getByText('OVERDUE by 340 mi')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Service history' })).toBeFocused();
});

test('report a fault, see it listed, delete it', async ({ page }) => {
  await page.goto(`/assets/${IDS.van4}`);
  await page.getByRole('button', { name: 'Report Fault' }).click();
  await page.getByLabel('Describe the fault').fill('Cracked mirror');
  await page.getByRole('button', { name: 'Submit Fault' }).click();
  const row = page.getByTestId('fault-row');
  await expect(row).toContainText('Cracked mirror');
  await row.getByRole('button', { name: /^Delete fault/ }).click();
  await row.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Fault deleted')).toBeVisible();
  await expect(page.getByText('No faults reported')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Faults' })).toBeFocused();
});

test('confirm panels work by keyboard', async ({ page }) => {
  await page.goto(`/assets/${IDS.van4}`);
  await page.getByRole('button', { name: 'Report Fault' }).click();
  await page.getByLabel('Describe the fault').fill('Squeaky belt');
  await page.getByRole('button', { name: 'Submit Fault' }).click();
  const trash = page.getByRole('button', { name: /^Delete fault/ });
  await trash.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trash).toBeFocused();
  await expect(page.getByText('Squeaky belt')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Fault deleted')).toBeVisible();

  await addAsset(page, 'Key Rig');
  await page.getByRole('button', { name: 'Delete Asset' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
});
