import { expect, test } from '@playwright/test';
import { ConsoleErrorCollector, waitForHydration } from './helpers';

test.describe('Page Health', () => {
  test('loads without console errors or hydration failures', async ({ page }) => {
    const collector = new ConsoleErrorCollector();
    collector.attach(page);

    await page.goto('/');
    await waitForHydration(page);

    expect(collector.errors).toEqual([]);
  });

  test('desktop icons render after hydration', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const icons = page.locator('.desktop-icon');
    const count = await icons.count();
    expect(count).toBe(8);
  });
});
