import { expect, test } from '@playwright/test';

/**
 * Smoke tests for the Learn index page (/learn).
 *
 * Verifies the page loads, the stats dashboard shows real numbers, and
 * navigation to the graph page works.
 */

test.describe('Learn index page', () => {
  test('loads and displays the Knowledge Base heading', async ({ page }) => {
    await page.goto('/learn');

    await expect(page.getByRole('heading', { level: 1, name: 'Knowledge Base' })).toBeVisible();
  });

  test('stats dashboard contains non-zero article count', async ({ page }) => {
    await page.goto('/learn');

    // The stats section is inside a <details> element — open it
    const statsSummary = page.locator('.graph-stats__toggle');
    await statsSummary.click();

    // The first stats card shows the article count
    const articleCount = page.locator('.graph-stats__card').first().locator('.graph-stats__number');
    await expect(articleCount).toBeVisible();

    const text = await articleCount.textContent();
    const count = Number(text?.trim());
    expect(count).toBeGreaterThan(0);
  });

  test('navigates to the graph page via the nav link', async ({ page }) => {
    await page.goto('/learn');

    await page.getByRole('link', { name: '🕸️ Graph' }).click();

    await page.waitForURL('**/learn/graph', { timeout: 10_000 });
    expect(page.url()).toContain('/learn/graph');
  });
});
