import { expect, IDS, test, USERS } from './fixtures';

const userName = (page: import('@playwright/test').Page) => page.getByTestId('user-name');

test.describe('signed out', () => {
  test.use({ signedInAs: null });

  test('an app page redirects to Sign In, and signing in returns to it', async ({ page }) => {
    await page.goto(`/assets/${IDS.truck12}`);
    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.getByLabel('Email').fill(USERS.demo.email);
    await page.getByLabel('Password').fill(USERS.demo.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(`/assets/${IDS.truck12}`);
    await expect(page.getByRole('heading', { name: 'Truck 12' })).toBeVisible();
    await expect(userName(page)).toHaveText(USERS.demo.name);
  });

  test('a wrong password clears the password and keeps the email', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(USERS.demo.email);
    await page.getByLabel('Password').fill('Wrong-pass1!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('alert')).toHaveText('Wrong email or password.');
    await expect(page.getByLabel('Email')).toHaveValue(USERS.demo.email);
    await expect(page.getByLabel('Password')).toHaveValue('');
  });

  test('bad input shows field messages without contacting the server', async ({ page }) => {
    const authCalls: string[] = [];
    page.on('request', (r) => r.url().includes('/auth/v1/token') && authCalls.push(r.url()));
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Enter your password.')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(authCalls).toEqual([]);
  });

  test('sign up lands on an empty dashboard with the name shown', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/sign-up');
    await page.getByLabel('Name').fill('Nina New');
    await page.getByLabel('Email').fill('nina@fleetlog.test');
    await page.getByLabel('Password', { exact: true }).fill('Fleet-log1');
    await page.getByLabel('Confirm password').fill('Fleet-log1');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('No equipment yet — add your first asset')).toBeVisible();
    await expect(userName(page)).toHaveText('Nina New');
    await expect(page.getByText('Truck 12')).toHaveCount(0);
  });

  test('sign-up validation messages keep the inputs', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Email').fill('nina@fleetlog.test');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByLabel('Confirm password').fill('different');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByText('Enter your name.')).toBeVisible();
    await expect(
      page.getByText('Password must be at least 8 characters and include an uppercase letter, a number and a symbol.'),
    ).toBeVisible();
    await expect(page.getByText("Passwords don't match.")).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue('nina@fleetlog.test');
  });

  test('signing up with a registered email says it already exists', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Name').fill('Dana Again');
    await page.getByLabel('Email').fill(USERS.demo.email);
    await page.getByLabel('Password', { exact: true }).fill('Fleet-log1');
    await page.getByLabel('Confirm password').fill('Fleet-log1');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByRole('alert')).toContainText('An account with this email already exists.');
    await expect(page.getByRole('alert').getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Name')).toHaveValue('Dana Again');
  });
});

test.describe('signed in', () => {
  test('refreshing keeps the user and their fleet', async ({ page }) => {
    await page.goto('/');
    await expect(userName(page)).toHaveText(USERS.demo.name);
    await page.reload();
    await expect(userName(page)).toHaveText(USERS.demo.name);
    await expect(page.getByRole('main').getByRole('link', { name: /Truck 12/ })).toBeVisible();
  });

  test('the auth pages send a signed-in user to the dashboard', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page).toHaveURL('/');
  });

  test('sign out returns to Sign In, and Back shows no fleet data', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('main').getByRole('link', { name: /Truck 12/ }).click();
    await expect(page.getByRole('heading', { name: 'Truck 12' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/sign-in');
    await page.goBack();
    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByText('Truck 12')).toHaveCount(0);
  });

  test("each user sees only their own fleet", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main').getByRole('link', { name: /Truck 12/ })).toBeVisible();
    await expect(page.getByText('Other Rig')).toHaveCount(0);
    await page.goto(`/assets/${IDS.otherRig}`);
    await expect(page.getByText('Asset not found')).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.getByLabel('Email').fill(USERS.other.email);
    await page.getByLabel('Password').fill(USERS.other.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/'); // not the previous user's last page
    await expect(userName(page)).toHaveText(USERS.other.name);
    await expect(page.getByRole('main').getByRole('link', { name: /Other Rig/ })).toBeVisible();
    await expect(page.getByText('Truck 12')).toHaveCount(0);
    await page.goto(`/assets/${IDS.truck12}`);
    await expect(page.getByText('Asset not found')).toBeVisible();
  });
});
