import { expect, test } from '@playwright/test';

test.describe('Learn static', () => {
  test.use({ javaScriptEnabled: false });

  test('renders article content without JavaScript', async ({ page }) => {
    await page.goto('/learn/architecture/overview');

    await expect(page.getByRole('heading', { level: 1, name: 'The Big Picture' })).toBeVisible();
    await expect(page.locator('article')).toContainText('This platform looks like a toy');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Three-Layer Architecture' }),
    ).toBeVisible();
  });

  test('renders the learn index without JavaScript', async ({ page }) => {
    await page.goto('/learn');

    await expect(page.getByRole('heading', { level: 1, name: 'Knowledge Base' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'The Foundation' })).toBeVisible();
    await expect(page.locator('.learn-module__objective').first()).toBeVisible();
  });
});
