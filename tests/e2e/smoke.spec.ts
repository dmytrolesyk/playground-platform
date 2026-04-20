import { expect, test } from '@playwright/test';
import { closeTopWindow, openApp, waitForHydration } from './helpers';

test.describe('App Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
  });

  test('View CV — opens and shows CV content', async ({ page }) => {
    await openApp(page, 'View CV');

    const window = page.locator('.window.win-container').first();
    await expect(window.locator('.title-bar-text')).toContainText('View CV');
    await expect(window).toContainText('Dmytro Lesyk');

    await closeTopWindow(page);
  });

  test('Export CV — opens and shows download links', async ({ page }) => {
    await openApp(page, 'Export CV');

    const window = page.locator('.window.win-container').first();
    await expect(window.locator('.title-bar-text')).toContainText('Export CV');
    await expect(window.locator('a[download]')).toHaveCount(2);

    await closeTopWindow(page);
  });

  test('Contact Me — opens and shows contact options', async ({ page }) => {
    await openApp(page, 'Contact Me');

    const window = page.locator('.window.win-container').first();
    await expect(window.locator('.title-bar-text')).toContainText('Contact Me');
    // "Send Email" is always present; "Telegram" depends on PUBLIC_TELEGRAM_USERNAME env var
    await expect(window).toContainText('Send Email');

    await closeTopWindow(page);
  });

  test('Terminal — opens and shows terminal container', async ({ page }) => {
    await openApp(page, 'Terminal');

    const window = page.locator('.window.win-container').first();
    await expect(window.locator('.title-bar-text')).toContainText('Terminal');
    // Terminal lazy-loads xterm — wait for the container to appear
    await expect(window.locator('.terminal-app__container')).toBeVisible({ timeout: 10_000 });

    await closeTopWindow(page);
  });

  test('Snake — opens and shows canvas', async ({ page }) => {
    await openApp(page, 'Snake');

    const window = page.locator('.window.win-container').first();
    await expect(window.locator('.title-bar-text')).toContainText('Snake');
    await expect(window.locator('canvas')).toBeVisible();

    await closeTopWindow(page);
  });

  test('Knowledge Base — opens and shows library app', async ({ page }, testInfo) => {
    // On mobile, Knowledge Base redirects to /learn — skip this test
    const isMobile = await page.evaluate(() =>
      window.matchMedia('(max-width: 768px)').matches,
    );
    if (isMobile) {
      testInfo.skip();
      return;
    }

    await openApp(page, 'Knowledge Base');

    const window = page.locator('.window.win-container').first();
    await expect(window.locator('.title-bar-text')).toContainText('Knowledge Base');
    await expect(window.locator('.library-app')).toBeVisible();

    await closeTopWindow(page);
  });

  test('Architecture Explorer — opens and shows canvas', async ({ page }) => {
    await openApp(page, 'Architecture');

    const window = page.locator('.window.win-container').first();
    await expect(window.locator('.title-bar-text')).toContainText('Architecture');
    await expect(window.locator('.arch-explorer__canvas')).toBeVisible();

    await closeTopWindow(page);
  });
});

test.describe('Start Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
  });

  test('opens on Start button click and lists apps', async ({ page }) => {
    await page.locator('.taskbar__start-btn').click();
    const menu = page.locator('.start-menu');
    await expect(menu).toBeVisible();

    const items = menu.locator('.start-menu__item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('clicking a menu item opens the app', async ({ page }) => {
    await page.locator('.taskbar__start-btn').click();
    await page.locator('.start-menu__item', { hasText: 'View CV' }).click();

    const window = page.locator('.window.win-container').first();
    await expect(window).toBeVisible();
    await expect(window.locator('.title-bar-text')).toContainText('View CV');

    await closeTopWindow(page);
  });
});

test.describe('Taskbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
  });

  test('shows task button when window is open (desktop)', async ({ page }, testInfo) => {
    const isMobile = await page.evaluate(() =>
      window.matchMedia('(max-width: 768px)').matches,
    );
    if (isMobile) {
      testInfo.skip();
      return;
    }

    await openApp(page, 'View CV');

    const taskBtn = page.locator('.taskbar__tasks--desktop .taskbar__task-btn');
    await expect(taskBtn.first()).toBeVisible();
    await expect(taskBtn.first()).toContainText('View CV');

    await closeTopWindow(page);
  });

  test('shows active app name when window is open (mobile)', async ({ page }, testInfo) => {
    const isMobile = await page.evaluate(() =>
      window.matchMedia('(max-width: 768px)').matches,
    );
    if (!isMobile) {
      testInfo.skip();
      return;
    }

    await openApp(page, 'View CV');

    const activeApp = page.locator('.taskbar__active-app');
    await expect(activeApp).toContainText('View CV');

    await closeTopWindow(page);
  });
});
