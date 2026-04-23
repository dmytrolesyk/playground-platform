import { expect, test } from '@playwright/test';
import { ConsoleErrorCollector } from './helpers';

/**
 * Smoke tests for the Knowledge Graph page (/learn/graph).
 *
 * The graph is a Cytoscape.js instance exposed as `window.__cyGraph` for
 * testability. All node/edge queries go through that handle rather than
 * trying to inspect the underlying canvas pixels.
 */

/** Wait for Cytoscape to finish initialising and expose the graph handle. */
async function waitForGraph(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => window.__cyGraph !== undefined, null, {
    timeout: 30_000,
  });
}

test.describe('Knowledge Graph page', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const collector = new ConsoleErrorCollector();
    collector.attach(page);

    await page.goto('/learn/graph');
    await waitForGraph(page);

    expect(collector.errors).toEqual([]);
  });

  test('renders Cytoscape container with non-zero dimensions', async ({ page }) => {
    await page.goto('/learn/graph');
    await waitForGraph(page);

    const container = page.locator('[data-cy="knowledge-graph"]');
    await expect(container).toBeVisible();

    const box = await container.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('displays the expected number of nodes from knowledge-graph.json', async ({ page }) => {
    await page.goto('/learn/graph');
    await waitForGraph(page);

    const counts = await page.evaluate(() => {
      const cy = window.__cyGraph;
      if (!cy) throw new Error('Cytoscape not initialised');
      return {
        total: cy.nodes().length,
        visible: cy.nodes(':visible').length,
      };
    });

    // The graph has 94 nodes (48 articles + 9 techs + 7 modules + 30 arch nodes).
    // Use a generous lower bound so the test doesn't break when articles are added.
    expect(counts.total).toBeGreaterThanOrEqual(50);
    expect(counts.visible).toBeGreaterThan(0);
  });

  test('clicking an article node navigates to the article page', async ({ page }) => {
    await page.goto('/learn/graph');
    await waitForGraph(page);

    // Pick the first article node's slug via the Cytoscape API
    const slug = await page.evaluate(() => {
      const cy = window.__cyGraph;
      if (!cy) throw new Error('Cytoscape not initialised');
      const articleNode = cy.nodes('[nodeType="article"]').first();
      return articleNode.data('id') as string;
    });

    expect(slug).toBeTruthy();

    // Simulate a tap on the node by emitting a Cytoscape tap event
    await page.evaluate(() => {
      const cy = window.__cyGraph;
      if (!cy) throw new Error('Cytoscape not initialised');
      const node = cy.nodes('[nodeType="article"]').first();
      node.emit('tap');
    });

    await page.waitForURL(`**/learn/${slug}`, { timeout: 10_000 });
    expect(page.url()).toContain(`/learn/${slug}`);
  });

  test('category filter hides nodes of that category', async ({ page }) => {
    await page.goto('/learn/graph');
    await waitForGraph(page);

    // Count architecture articles before toggle
    const before = await page.evaluate(() => {
      const cy = window.__cyGraph;
      if (!cy) throw new Error('Cytoscape not initialised');
      return cy.nodes('[category="architecture"]:visible').length;
    });
    expect(before).toBeGreaterThan(0);

    // Uncheck the "Architecture" category checkbox
    const architectureCheckbox = page
      .locator('fieldset', { hasText: 'Categories' })
      .getByLabel('Architecture');
    await architectureCheckbox.uncheck();

    // Architecture nodes should now be hidden
    await page.waitForFunction(
      () => {
        const cy = window.__cyGraph;
        if (!cy) return false;
        return cy.nodes('[category="architecture"]:visible').length === 0;
      },
      undefined,
      { timeout: 5_000 },
    );
    const after = await page.evaluate(() => {
      const cy = window.__cyGraph;
      if (!cy) throw new Error('Cytoscape not initialised');
      return cy.nodes('[category="architecture"]:visible').length;
    });
    expect(after).toBe(0);

    // Re-check → they come back
    await architectureCheckbox.check();

    // Wait for SolidJS effect + Cytoscape batch update to propagate
    await page.waitForFunction(
      (expected) => {
        const cy = window.__cyGraph;
        if (!cy) return false;
        return cy.nodes('[category="architecture"]:visible').length === expected;
      },
      before,
      { timeout: 5_000 },
    );
    const restored = await page.evaluate(() => {
      const cy = window.__cyGraph;
      if (!cy) throw new Error('Cytoscape not initialised');
      return cy.nodes('[category="architecture"]:visible').length;
    });
    expect(restored).toBe(before);
  });

  test('mastery coloring reflects localStorage state', async ({ page }) => {
    // Inject mastery data before the page loads
    await page.addInitScript(() => {
      localStorage.setItem(
        'kb-learning-progress',
        JSON.stringify({
          articlesRead: {
            'architecture/overview': {
              stage: 'mastered',
              lastUpdated: new Date().toISOString(),
            },
          },
        }),
      );
    });

    await page.goto('/learn/graph');
    await waitForGraph(page);

    const hasMasteredClass = await page.evaluate(() => {
      const cy = window.__cyGraph;
      if (!cy) throw new Error('Cytoscape not initialised');
      const node = cy.$('node[id="architecture/overview"]');
      return node.hasClass('mastery-mastered');
    });
    expect(hasMasteredClass).toBe(true);
  });
});
