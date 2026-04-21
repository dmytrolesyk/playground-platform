import { expect, type Locator, type Page, test } from '@playwright/test';
import { openApp, waitForHydration } from './helpers';

const READ_FULL_ARTICLE = /Read Full Article/;

function desktopWindow(page: Page, title: string): Locator {
  return page.locator('.window.win-container').filter({
    has: page.locator('.title-bar-text', { hasText: title }),
  });
}

test.describe('Desktop knowledge bridge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
  });

  test('Architecture Explorer reuses the Library singleton and updates its address', async ({
    page,
  }, testInfo) => {
    const isMobile = await page.evaluate(() => window.matchMedia('(max-width: 768px)').matches);
    if (isMobile) {
      testInfo.skip();
      return;
    }

    await openApp(page, 'Architecture');

    const architectureWindow = desktopWindow(page, 'Architecture Explorer');
    await expect(architectureWindow.locator('.arch-explorer__canvas')).toBeVisible();

    await page.getByRole('group', { name: 'DesktopStore' }).click();
    await architectureWindow.getByRole('button', { name: READ_FULL_ARTICLE }).click();

    const libraryWindow = desktopWindow(page, 'Knowledge Base');
    await expect(libraryWindow).toHaveCount(1);
    await expect(libraryWindow.locator('.library-toolbar__input')).toHaveValue(
      '/learn/architecture/overview',
    );

    await page.locator('.taskbar__task-btn', { hasText: 'Architecture Explorer' }).click();
    await page.getByRole('group', { name: 'APP_REGISTRY' }).click();
    await architectureWindow.getByRole('button', { name: READ_FULL_ARTICLE }).click();

    await expect(libraryWindow).toHaveCount(1);
    await expect(libraryWindow.locator('.library-toolbar__input')).toHaveValue(
      '/learn/architecture/app-registry',
    );
  });
});
