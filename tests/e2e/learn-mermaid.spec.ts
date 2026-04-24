import { expect, test } from '@playwright/test';

test.describe('Learn Mermaid diagrams', () => {
  test('renders article diagrams as SVG instead of raw source blocks', async ({ page }) => {
    await page.goto('/learn/architecture/overview');

    await expect(page.getByRole('heading', { level: 1, name: 'The Big Picture' })).toBeVisible();
    await expect(page.locator('pre[data-language="mermaid"] code')).toHaveCount(0);
    await expect(page.locator('pre.mermaid svg').first()).toBeVisible();
  });
});
