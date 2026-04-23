import { expect, test } from '@playwright/test';
import { mockGithubNotifierEmbed, openApp, waitForHydration } from './helpers';

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

  test('knowledge index', async ({ page }) => {
    await page.goto('/learn');

    await expect(page.getByRole('heading', { level: 1, name: 'Knowledge Base' })).toBeVisible();
    await expect(page.locator('#progress-summary')).toHaveText(
      'Progress: 0 read · 0 checked · 0 practiced · 0 mastered',
    );

    await expect(page).toHaveScreenshot('knowledge-index.png');
  });

  test('knowledge article', async ({ page }) => {
    await page.goto('/learn/architecture/overview');

    await expect(page.getByRole('heading', { level: 1, name: 'The Big Picture' })).toBeVisible();
    await expect(page.locator('.progress-tracker__stage')).toHaveText('Read');

    await expect(page).toHaveScreenshot('knowledge-article-overview.png');
  });

  test('desktop window open — Knowledge Base', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'mobile') {
      testInfo.skip();
      return;
    }

    await page.goto('/');
    await waitForHydration(page);

    await openApp(page, 'Knowledge Base');
    await expect(page.locator('.library-app')).toBeVisible();

    await expect(page).toHaveScreenshot('window-knowledge-base.png');
  });

  test('desktop window open — Github Notifier', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'mobile') {
      testInfo.skip();
      return;
    }

    await mockGithubNotifierEmbed(page);
    await page.goto('/');
    await waitForHydration(page);

    await openApp(page, 'Github Notifier');
    await expect(page.locator('.github-notifier-app')).toBeVisible();

    await expect(page).toHaveScreenshot('window-github-notifier.png');
  });

  test('desktop window open — Architecture Explorer', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    await openApp(page, 'Architecture');
    await expect(page.locator('.arch-explorer__canvas')).toBeVisible();

    await expect(page).toHaveScreenshot('window-architecture-explorer.png');
  });
});
