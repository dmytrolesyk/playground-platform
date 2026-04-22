# Feature 6b: E2E Smoke Tests (Playwright)

## Goal

Add a small Playwright test suite that smoke-tests the interactive parts of the learning platform. This is NOT comprehensive E2E coverage — it's a targeted set of tests for the features where build-time verification isn't enough (interactive islands, client-side navigation, localStorage-dependent behavior).

## Depends On

Feature 6 (Cytoscape.js visualization — the first significant interactive component)

## Why Now, Not Earlier

Features 1-5 are fully covered by the existing verification suite:
- Schema correctness → Zod validation at build time
- Graph integrity → audit pipeline (`pnpm verify:knowledge`)
- Type safety → TypeScript typecheck
- Build success → `pnpm build`
- Script correctness → unit tests

Feature 6 introduces the first component where "it builds" doesn't mean "it works": the Cytoscape.js graph must render nodes, respond to clicks, apply filters, and show mastery colors from localStorage. These behaviors can only be tested in a real browser.

## What to Test

### Tier 1: Test now (after Feature 6)

**Knowledge graph page (`/learn/graph`):**
- [ ] Page loads without JavaScript errors
- [ ] Cytoscape.js canvas renders (element exists, has non-zero dimensions)
- [ ] Nodes are visible (correct count matches knowledge-graph.json)
- [ ] Clicking an article node navigates to `/learn/{slug}`
- [ ] Category filter toggles hide/show nodes of that category
- [ ] Mastery coloring reflects localStorage state (set a value, reload, verify node style)

**Learn index page (`/learn`):**
- [ ] Page loads
- [ ] Stats section renders with non-zero numbers
- [ ] Navigation to graph page works

### Tier 2: Add when features ship

After Feature 9 (exercise types):
- [ ] CodeMirror editor loads in `code` exercise
- [ ] Arrange exercise fragments render
- [ ] Compare exercise shows both approaches

After Feature 12 (project labs):
- [ ] Project lab phase navigation works
- [ ] Collapsible sections expand/collapse
- [ ] Code blocks have copy buttons that work
- [ ] Progress tracking persists across page reloads

## Setup

### Dependencies

```bash
pnpm add -D @playwright/test
npx playwright install chromium  # single browser is enough for smoke tests
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'pnpm preview',       // serves the built site
    port: 4321,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

### Directory Structure

```
e2e/
├── graph-page.spec.ts       # Cytoscape graph tests
├── learn-index.spec.ts      # Stats dashboard tests
├── exercises.spec.ts        # Added after Feature 9
└── project-labs.spec.ts     # Added after Feature 12
```

### Package.json Scripts

```json
{
  "test:e2e": "pnpm build && playwright test",
  "test:e2e:headed": "pnpm build && playwright test --headed"
}
```

## Example Test

```typescript
// e2e/graph-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Knowledge Graph Page', () => {
  test('renders graph with nodes', async ({ page }) => {
    await page.goto('/learn/graph');
    
    // Cytoscape canvas should exist
    const canvas = page.locator('[data-cy="knowledge-graph"]');
    await expect(canvas).toBeVisible();
    
    // Should have nodes (Cytoscape renders to a canvas,
    // so check via exposed data or aria attributes)
    // Implementation depends on how KnowledgeGraph.tsx exposes testability
  });

  test('clicking article node navigates to article', async ({ page }) => {
    await page.goto('/learn/graph');
    // Click a known article node → verify URL changed to /learn/{slug}
  });

  test('mastery colors reflect localStorage', async ({ page }) => {
    // Set localStorage mastery data before page load
    await page.addInitScript(() => {
      localStorage.setItem('learn-progress', JSON.stringify({
        'concepts/fine-grained-reactivity': 'mastered'
      }));
    });
    await page.goto('/learn/graph');
    // Verify the node has mastered styling
  });

  test('category filter hides nodes', async ({ page }) => {
    await page.goto('/learn/graph');
    // Toggle off 'technology' category → technology nodes should disappear
  });
});
```

## Testability Requirements

The Cytoscape.js component (Feature 6) needs to expose hooks for E2E testing:

1. **`data-cy="knowledge-graph"`** attribute on the container div
2. **`window.__cyGraph`** — expose the Cytoscape instance on window in dev/test builds so Playwright can query graph state (node count, node visibility, selected node)
3. **Accessible node labels** — article nodes should be queryable by their label text

Add this note to Feature 6 as a testability requirement.

## Keep It Small

This is a smoke test suite, not a comprehensive E2E framework. Rules:

- **Max 15 tests total** across all spec files
- **Chromium only** — no cross-browser matrix for a personal project
- **No visual regression** — too much maintenance for too little value
- **No API mocking** — the site is static, there's nothing to mock
- **Run after build** — tests hit the built site via `pnpm preview`, not dev server

If a test is flaky, delete it rather than adding retries and waits. Flaky E2E tests are worse than no E2E tests.

## Applicable Skills

- `web-design-guidelines` — accessibility testing considerations
- `node` — Playwright configuration, test script setup

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/06b-e2e-smoke-tests`
2. Implement Tier 1 tests (graph page + learn index — 6-8 tests total)
3. Verify: `pnpm verify` + `pnpm test:e2e` (all tests pass)
4. Check all Tier 1 acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] Playwright installed and configured
- [ ] `pnpm test:e2e` script works (builds site, starts preview, runs tests)
- [ ] Graph page: loads without JS errors
- [ ] Graph page: Cytoscape canvas renders with nodes
- [ ] Graph page: click-to-navigate works
- [ ] Graph page: category filter works
- [ ] Graph page: mastery coloring reflects localStorage
- [ ] Learn index: page loads, stats render
- [ ] All tests pass in CI-compatible headless mode
- [ ] `pnpm verify` still passes

---

## AGENTS.md Update

Add to the verification section:

```markdown
### E2E smoke tests

After any change to interactive components (Cytoscape graph, exercise rendering, project
lab navigation), run the E2E smoke tests:

`pnpm test:e2e`

This builds the site, starts a preview server, and runs Playwright tests against it.
Tests cover: graph page rendering, node click navigation, category filtering, mastery
coloring, and learn index stats.

The full verification suite for features touching interactive components is:
1. `pnpm verify` (typecheck + lint + unit tests)
2. `pnpm verify:knowledge` (audit pipeline)
3. `pnpm build` (build succeeds)
4. `pnpm test:e2e` (interactive components work in a real browser)
```
