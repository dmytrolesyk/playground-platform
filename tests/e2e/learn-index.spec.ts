import { expect, test } from '@playwright/test';

const SEEDED_PROGRESS = {
  articlesRead: {
    'architecture/overview': {
      firstRead: '2026-04-24T00:00:00.000Z',
      lastRead: '2026-04-24T00:00:00.000Z',
      stage: 'mastered',
      checkedAt: '2026-04-24T00:00:00.000Z',
      practicedAt: '2026-04-24T00:00:00.000Z',
      masteredAt: '2026-04-24T00:00:00.000Z',
    },
  },
  modulesCompleted: [],
};

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

  test('renders progress summary and module progress from localStorage', async ({ page }) => {
    await page.addInitScript((progress: typeof SEEDED_PROGRESS) => {
      window.localStorage.setItem('kb-learning-progress', JSON.stringify(progress));
    }, SEEDED_PROGRESS);

    await page.goto('/learn');

    await expect(page.locator('#progress-summary')).toHaveText(
      'Progress: 1 read · 1 checked · 1 practiced · 1 mastered',
    );
    await expect(page.locator('#module-foundation .learn-module__progress-label')).toContainText(
      '1 read · 1 checked · 1 practiced',
    );
  });

  test('stats dashboard contains non-zero article count', async ({ page }) => {
    await page.goto('/learn');

    const statsSummary = page.locator('.graph-stats__toggle');
    await statsSummary.click();

    const articleCount = page.locator('.graph-stats__card').first().locator('.graph-stats__number');
    await expect(articleCount).toBeVisible();

    const text = await articleCount.textContent();
    const count = Number(text?.trim());
    expect(count).toBeGreaterThan(0);
  });

  test('displays network analysis results in the stats dashboard', async ({ page }) => {
    await page.goto('/learn');

    await page.locator('.graph-stats__toggle').click();

    const analysisSection = page.locator('[data-cy="graph-analysis"]');
    await expect(analysisSection).toBeVisible();
    await expect(
      analysisSection.getByRole('heading', { name: 'Top Central Concepts (PageRank)' }),
    ).toBeVisible();

    const centralityRows = analysisSection.locator(
      '[data-cy="graph-analysis-centrality"] tbody tr',
    );
    await expect(centralityRows).toHaveCount(5);
  });

  test('navigates to the graph page via the nav link', async ({ page }) => {
    await page.goto('/learn');

    await page.getByRole('link', { name: '🕸️ Graph' }).click();

    await page.waitForURL('**/learn/graph', { timeout: 10_000 });
    expect(page.url()).toContain('/learn/graph');
  });
});
