import { expandRow, expect, IDS, test } from './fixtures';

test('edit asset details; a reading below the last service is rejected', async ({ page }) => {
  await page.goto(`/assets/${IDS.truck12}`);
  const trigger = page.getByRole('button', { name: 'Edit Asset' });
  await trigger.click();
  const form = page.getByRole('form', { name: 'Edit Truck 12' });
  await form.getByLabel('Name').fill('Truck 12B');
  await form.getByLabel('Odometer (mi)').fill('40000');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form.getByText("Reading can't be lower than the last logged service (44,000)")).toBeVisible();
  await expect(form.getByLabel('Name')).toHaveValue('Truck 12B');

  await form.getByLabel('Odometer (mi)').fill('48,210');
  await form.getByLabel('Model').fill('Ford F-750');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Asset updated')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Truck 12B' })).toBeVisible();
  await expect(page.getByText('Truck · Ford F-750')).toBeVisible();
  await expect(trigger).toBeFocused();
});

test('editing a service entry recalculates its schedule', async ({ page }) => {
  await page.goto(`/assets/${IDS.truck12}`);
  await expect(page.getByText('OVERDUE by 340 mi')).toBeVisible();
  const row = page.locator('[data-testid=history-row]:visible').filter({ hasText: 'Oil change' });
  await expandRow(row);
  await row.getByRole('button', { name: /^Edit Oil change entry from/ }).click();

  const form = page.getByRole('form', { name: 'Edit Oil change entry' });
  await expect(form.getByText('Oil change')).toBeVisible(); // task is read-only
  await form.getByLabel('Odometer (mi)').fill('50000');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form.getByText("Reading can't be higher than the current reading (48,210)")).toBeVisible();

  await form.getByLabel('Odometer (mi)').fill('43870');
  await form.getByLabel('Parts cost ($)').fill('99');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Entry updated')).toBeVisible();
  await expect(form).toHaveCount(0);
  await expect(page.getByText('OVERDUE by 340 mi')).toHaveCount(0);
  await expect(page.locator('[data-testid=history-row]:visible').filter({ hasText: '$99.00' })).toHaveCount(1);
});

test('changing a schedule interval updates its countdown; invalid values show the error', async ({ page }) => {
  await page.goto(`/assets/${IDS.truck12}`);
  await page.getByRole('button', { name: 'Edit Oil change interval' }).click();
  const form = page.getByRole('form', { name: 'Edit Oil change interval' });
  const input = form.getByLabel('Interval (miles)');
  for (const bad of ['0', '-5', '2.5']) {
    await input.fill(bad);
    await form.getByRole('button', { name: 'Save' }).click();
    await expect(form.getByText('Enter a whole number greater than 0')).toBeVisible();
  }
  await input.fill('3,000');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Interval updated')).toBeVisible();
  await expect(page.getByText('OVERDUE by 2,340 mi')).toBeVisible();
});

test('edit a fault; blank description and future dates are rejected', async ({ page }) => {
  await page.goto(`/assets/${IDS.van4}`);
  await page.getByRole('button', { name: 'Report Fault' }).click();
  await page.getByLabel('Describe the fault').fill('Leak');
  await page.getByRole('button', { name: 'Submit Fault' }).click();
  const row = page.getByTestId('fault-row');
  await row.getByRole('button', { name: /^Edit fault from/ }).click();

  const form = page.getByRole('form', { name: 'Edit fault' });
  await form.getByLabel('Description').fill('  ');
  await form.getByLabel('Date').fill('2099-01-01');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form.getByText('Describe the fault')).toBeVisible();
  await expect(form.getByText("Date can't be in the future")).toBeVisible();

  await form.getByLabel('Description').fill('Big leak at rear axle');
  await form.getByLabel('Date').fill('2026-01-02');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Fault updated')).toBeVisible();
  await expect(row).toContainText('Big leak at rear axle');
  await expect(row).toContainText('Jan 2, 2026');
});

test('only one edit form is open; Escape closes it and returns focus', async ({ page }) => {
  await page.goto(`/assets/${IDS.truck12}`);
  await page.getByRole('button', { name: 'Edit Asset' }).click();
  await expect(page.getByRole('form', { name: 'Edit Truck 12' })).toBeVisible();
  const intervalButton = page.getByRole('button', { name: 'Edit Brakes interval' });
  await intervalButton.click();
  await expect(page.getByRole('form', { name: 'Edit Truck 12' })).toHaveCount(0);
  await expect(page.getByRole('form', { name: 'Edit Brakes interval' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('form', { name: 'Edit Brakes interval' })).toHaveCount(0);
  await expect(intervalButton).toBeFocused();
});

test('lowering the odometer below the starting reading never shows more than the interval', async ({ page }) => {
  await page.goto('/assets/new');
  await page.getByLabel('Name').fill('Lowered Rig');
  await page.getByLabel('Model').fill('Test model');
  await page.getByLabel('Current odometer').fill('50000');
  await page.getByRole('button', { name: 'Save Asset' }).click();
  await expect(page.getByRole('heading', { name: 'Lowered Rig' })).toBeVisible();
  await expect(page.getByText('in 5,000 mi')).toBeVisible(); // Oil change every 5,000 mi

  await page.getByRole('button', { name: 'Edit Asset' }).click();
  const form = page.getByRole('form', { name: 'Edit Lowered Rig' });
  await form.getByLabel('Odometer (mi)').fill('48000');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Asset updated')).toBeVisible();
  await expect(page.getByText('in 5,000 mi')).toBeVisible();
  await expect(page.getByText('in 7,000 mi')).toHaveCount(0);

  // Survives a reload: the server (mock) moved the schedule down too
  await page.reload();
  await expect(page.getByText('in 5,000 mi')).toBeVisible();
  await expect(page.getByText('in 8,000 mi')).toBeVisible(); // Tire rotation every 8,000 mi
});
