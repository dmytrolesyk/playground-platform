import { expect, test } from '@playwright/test';
import { clearLearningProgress } from './helpers';

const ARTICLE_SLUG = 'architecture/overview';
const ARTICLE_URL = `/learn/${ARTICLE_SLUG}`;

test.describe('Knowledge learning path', () => {
  test.beforeEach(async ({ page }) => {
    await clearLearningProgress(page);
  });

  test('renders curriculum modules and navigates to articles', async ({ page }) => {
    await page.goto('/learn');

    await expect(page.getByRole('heading', { level: 1, name: 'Knowledge Base' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Foundation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why SolidJS?' })).toBeVisible();
    await expect(page.locator('#progress-summary')).toHaveText(
      'Progress: 0 read · 0 checked · 0 practiced · 0 mastered',
    );

    await page.getByRole('link', { name: 'The Big Picture' }).first().click();

    await expect(page).toHaveURL(ARTICLE_URL);
    await expect(page.getByRole('heading', { level: 1, name: 'The Big Picture' })).toBeVisible();
    await expect(page.locator('.progress-tracker__stage')).toHaveText('Read');
  });

  test('persists staged mastery progress across reloads and index navigation', async ({ page }) => {
    await page.goto(ARTICLE_URL);

    await expect(page.locator('.progress-tracker__stage')).toHaveText('Read');
    await page.getByRole('button', { name: 'Checked' }).click();
    await expect(page.locator('.progress-tracker__stage')).toHaveText('Checked');
    await page.getByRole('button', { name: 'Practiced' }).click();
    await expect(page.locator('.progress-tracker__stage')).toHaveText('Practiced');
    await page.getByRole('button', { name: 'Mastered' }).click();
    await expect(page.locator('.progress-tracker__stage')).toHaveText('Mastered');

    await page.reload();

    await expect(page.locator('.progress-tracker__stage')).toHaveText('Mastered');
    await expect(page.getByRole('button', { name: 'Checked' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Practiced' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Mastered' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.goto('/learn');

    await expect(page.locator('#progress-summary')).toHaveText(
      'Progress: 1 read · 1 checked · 1 practiced · 1 mastered',
    );
    await expect(page.locator('#module-foundation .learn-module__progress-label')).toContainText(
      '1 read · 1 checked · 1 practiced',
    );
  });
});
