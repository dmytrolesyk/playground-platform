import { expect, test } from '@playwright/test';
import { openApp, waitForHydration } from './helpers';

test.describe('Visual Regression', () => {
  test('empty desktop', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    await expect(page).toHaveScreenshot('empty-desktop.png');
  });

  test('start menu open', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    await page.locator('.taskbar__start-btn').click();
    await page.locator('.start-menu--open').waitFor({ state: 'visible' });

    await expect(page).toHaveScreenshot('start-menu-open.png');
  });

  test('window open — View CV', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    await openApp(page, 'View CV');
    // Wait for content to load inside the browser app
    await page
      .locator('.window.win-container')
      .first()
      .locator('text=Dmytro Lesyk')
      .first()
      .waitFor({
        state: 'visible',
        timeout: 10_000,
      });

    await expect(page).toHaveScreenshot('window-view-cv.png');
  });
});
