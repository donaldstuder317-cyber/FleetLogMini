import { expect, test } from '@playwright/test';

test('layout matches the viewport', async ({ page }, info) => {
  await page.goto('/');
  const width = page.viewportSize()!.width;
  const bottomNav = page.locator('nav.fixed');
  const noSideScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(noSideScroll, `horizontal scroll on ${info.project.name}`).toBe(true);

  if (width < 1024) {
    await expect(bottomNav).toBeVisible();
    await expect(page.locator('aside')).toBeHidden();
  } else {
    await expect(page.locator('aside')).toBeVisible();
    await expect(bottomNav).toBeHidden();
  }
});
