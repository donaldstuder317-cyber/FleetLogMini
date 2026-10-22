import { IDS, expandRow, expect, test } from './fixtures';

test('a DEADLINE fault with a cost marks the asset until it is cleared', async ({ page }) => {
  await page.goto(`/assets/${IDS.van4}`);
  const header = page.getByRole('main').locator('header').first();
  await expect(header.getByText('Deadline')).toHaveCount(0);

  await page.getByRole('button', { name: 'Report Fault' }).click();
  await page.getByLabel('Describe the fault').fill('Brake line leaking');
  await page.getByLabel('Cost ($)').fill('1.999');
  await expect(page.getByText('Enter a valid cost')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit Fault' })).toBeDisabled();
  await page.getByLabel('Cost ($)').fill('240.50');
  await page.getByRole('checkbox', { name: /deadline/i }).check();
  await page.getByRole('button', { name: 'Submit Fault' }).click();
  await expect(page.getByText('Fault reported')).toBeVisible();

  const row = page.getByTestId('fault-row');
  await expect(row).toContainText('$240.50');
  await expect(row.getByText('Deadline')).toBeVisible();
  await expect(header.getByText('Deadline')).toBeVisible();

  // Dashboard row carries the marker too
  await page.goto('/');
  await expect(page.getByRole('main').getByRole('link', { name: /Van 4/ })).toContainText('Deadline');
  await expect(page.getByRole('main').getByRole('link', { name: /Truck 12/ })).not.toContainText('Deadline');

  // Unchecking DEADLINE clears the marker
  await page.goto(`/assets/${IDS.van4}`);
  await row.getByRole('button', { name: /^Edit fault from/ }).click();
  const form = page.getByRole('form', { name: 'Edit fault' });
  await form.getByRole('checkbox', { name: /deadline/i }).uncheck();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Fault updated')).toBeVisible();
  await expect(header.getByText('Deadline')).toHaveCount(0);
});

async function reportFault(page: import('@playwright/test').Page, description: string, cost: string, deadline = false) {
  await page.getByRole('button', { name: 'Report Fault' }).click();
  await page.getByLabel('Describe the fault').fill(description);
  await page.getByLabel('Cost ($)').fill(cost);
  if (deadline) await page.getByRole('checkbox', { name: /deadline/i }).check();
  await page.getByRole('button', { name: 'Submit Fault' }).click();
  await expect(page.getByText('Fault reported')).toBeVisible();
  await expect(page.getByText('Fault reported')).toHaveCount(0);
}

test('logging a service corrects the picked faults; deleting it reopens them', async ({ page }) => {
  await page.goto(`/assets/${IDS.van4}`);
  await reportFault(page, 'Brake line leaking', '240.50', true);
  await reportFault(page, 'Cracked mirror', '35');
  await reportFault(page, 'Wiper torn', '12');

  await page.goto(`/log?asset=${IDS.van4}`);
  const picker = page.getByRole('group', { name: 'Faults corrected' });
  await expect(picker.getByRole('checkbox', { name: 'None' })).toBeChecked();
  await picker.getByRole('checkbox', { name: /Brake line leaking/ }).check();
  await picker.getByRole('checkbox', { name: /Cracked mirror/ }).check();
  await expect(picker.getByRole('checkbox', { name: 'None' })).not.toBeChecked();
  await expect(picker.getByRole('checkbox', { name: 'All' })).not.toBeChecked();
  await page.getByLabel('Task type').selectOption('Brakes');
  await page.getByRole('button', { name: 'Save Entry' }).click();
  await expect(page.getByText('Saved')).toBeVisible();

  // The last open DEADLINE fault was fixed: marker gone
  await expect(page.getByRole('main').getByRole('link', { name: /Van 4/ })).not.toContainText('Deadline');

  await page.goto(`/assets/${IDS.van4}`);
  await expect(page.getByTestId('fault-row')).toHaveCount(1);
  await expect(page.getByTestId('fault-row')).toContainText('Wiper torn');
  const corrected = page.getByTestId('corrected-fault-row');
  await expect(corrected).toHaveCount(2);
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  await expect(corrected.first()).toContainText(`Corrected ${today}`);

  // Only the remaining open fault is offered next time
  await page.goto(`/log?asset=${IDS.van4}`);
  await expect(page.getByRole('group', { name: 'Faults corrected' }).getByRole('checkbox', { name: /Wiper torn/ })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Faults corrected' }).getByRole('checkbox', { name: /Brake line/ })).toHaveCount(0);

  // Deleting the entry reopens both faults and the DEADLINE marker
  await page.goto(`/assets/${IDS.van4}`);
  const row = page.locator('[data-testid=history-row]:visible').first();
  await expandRow(row);
  await row.getByRole('button', { name: /^Delete Brakes entry from/ }).click();
  await row.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Entry deleted')).toBeVisible();
  await expect(page.getByTestId('fault-row')).toHaveCount(3);
  await expect(page.getByTestId('corrected-fault-row')).toHaveCount(0);
  await expect(page.getByRole('main').locator('header').first().getByText('Deadline')).toBeVisible();
});

test('Faults corrected: All, None, asset change and keyboard', async ({ page }) => {
  await page.goto(`/assets/${IDS.van4}`);
  await reportFault(page, 'Cracked mirror', '35');
  await reportFault(page, 'Wiper torn', '12');

  await page.goto(`/log?asset=${IDS.van4}`);
  const picker = page.getByRole('group', { name: 'Faults corrected' });
  const all = picker.getByRole('checkbox', { name: 'All' });
  const none = picker.getByRole('checkbox', { name: 'None' });

  // Keyboard: Space toggles All
  await all.focus();
  await page.keyboard.press('Space');
  await expect(all).toBeChecked();
  await expect(picker.getByRole('checkbox', { name: /Cracked mirror/ })).toBeChecked();
  await expect(picker.getByRole('checkbox', { name: /Wiper torn/ })).toBeChecked();
  await expect(none).not.toBeChecked();

  await none.check();
  await expect(all).not.toBeChecked();
  await expect(picker.getByRole('checkbox', { name: /Cracked mirror/ })).not.toBeChecked();

  // Another asset: back to None, and Truck 12 has no open faults
  await picker.getByRole('checkbox', { name: /Wiper torn/ }).check();
  await page.getByLabel('Asset').selectOption({ label: 'Truck 12' });
  await expect(picker.getByText('No open faults')).toBeVisible();
  await page.getByLabel('Asset').selectOption({ label: 'Van 4' });
  await expect(none).toBeChecked();
});
