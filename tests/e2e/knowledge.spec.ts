import { expect, test } from '@playwright/test';
import { clearLearningProgress } from './helpers';

const ARTICLE_SLUG = 'architecture/overview';
const ARTICLE_URL = `/learn/${ARTICLE_SLUG}`;

test.describe('Knowledge learning path', () => {
  test.beforeEach(async ({ page }) => {
    await clearLearningProgress(page);
  });

  test('renders the article progress tracker in the read state', async ({ page }) => {
    await page.goto(ARTICLE_URL);

    await expect(page.getByRole('heading', { level: 1, name: 'The Big Picture' })).toBeVisible();
    await expect(page.locator('.progress-tracker__stage')).toHaveText('Read');
    await expect(page.getByRole('button', { name: 'Checked' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.getByRole('button', { name: 'Practiced' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.getByRole('button', { name: 'Mastered' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('updates article stages and persists pressed state across reloads', async ({ page }) => {
    await page.goto(ARTICLE_URL);

    await page.getByRole('button', { name: 'Checked' }).click();
    await expect(page.locator('.progress-tracker__stage')).toHaveText('Checked');
    await expect(page.getByRole('button', { name: 'Checked' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Practiced' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.getByRole('button', { name: 'Mastered' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await page.getByRole('button', { name: 'Practiced' }).click();
    await expect(page.locator('.progress-tracker__stage')).toHaveText('Practiced');
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
      'false',
    );

    await page.getByRole('button', { name: 'Mastered' }).click();
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
  });
});
