# E2E & Visual Regression Test Suite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Playwright-based E2E tests covering hydration health, interaction smoke tests, visual regression screenshots, and responsive breakpoint behavior for both desktop and mobile viewports.

**Architecture:** Four test files (`health`, `smoke`, `visual-regression`, `responsive`) run against a production Astro build via Playwright's `webServer`. Shared helpers handle hydration waiting and error collection. CI gets a new `e2e` job after `verify`.

**Tech Stack:** `@playwright/test`, Chromium, Astro production build (`node dist/server/entry.mjs`)

**Spec:** `docs/features/e2e-tests.md`

---

## File Map

| File | Purpose |
|---|---|
| **Create:** `tests/e2e/playwright.config.ts` | Playwright config: webServer, desktop + mobile projects, snapshot settings |
| **Create:** `tests/e2e/helpers.ts` | Shared utilities: waitForHydration, ConsoleErrorCollector, openApp, closeTopWindow |
| **Create:** `tests/e2e/health.spec.ts` | Hydration + console error guard (both viewports) |
| **Create:** `tests/e2e/smoke.spec.ts` | Icon rendering, app open + content, start menu, taskbar |
| **Create:** `tests/e2e/visual-regression.spec.ts` | Screenshot comparisons (desktop + mobile empty, start menu, window) |
| **Create:** `tests/e2e/responsive.spec.ts` | 768px breakpoint boundary, CRT frame visibility, window positioning |
| **Modify:** `package.json` | Add `test:e2e` and `test:e2e:update` scripts, add `@playwright/test` devDep |
| **Modify:** `.gitignore` | Add `tests/e2e/test-results/` |
| **Modify:** `.github/workflows/ci.yml` | Add `e2e` job |

---

## Task 1: Project Setup — Install Dependencies & Config

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Modify: `.gitignore`
- Create: `tests/e2e/playwright.config.ts`

- [ ] **Step 1: Install `@playwright/test` and Chromium**

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Add scripts to `package.json`**

Add to `"scripts"`:
```json
"test:e2e": "playwright test --config tests/e2e/playwright.config.ts",
"test:e2e:update": "playwright test --config tests/e2e/playwright.config.ts --update-snapshots"
```

- [ ] **Step 3: Add test artifacts to `.gitignore`**

Append to `.gitignore`:
```
# Playwright
tests/e2e/test-results/
```

- [ ] **Step 4: Create `tests/e2e/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: {
    command: 'pnpm build && node dist/server/entry.mjs',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      HOST: '0.0.0.0',
      NODE_ENV: 'production',
    },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
});
```

Key decisions:
- `fullyParallel: false` and `workers: 1` — tests share one server, keeps things deterministic.
- `webServer` builds from scratch and serves production build.
- `reuseExistingServer: !process.env['CI']` — locally reuses an already-running server if you started one manually (speeds up iteration).
- `retries: 1` in CI to handle rare flakiness.
- `Pixel 5` device preset gives us touch + mobile user agent automatically.

- [ ] **Step 5: Verify config works — run empty test suite**

```bash
pnpm test:e2e
```

Expected: Playwright starts, builds the site, finds no test files, exits cleanly (or reports "no tests found"). This verifies the webServer config works.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore tests/e2e/playwright.config.ts
git commit -m "chore: add playwright e2e test infrastructure"
```

---

## Task 2: Shared Helpers

**Files:**
- Create: `tests/e2e/helpers.ts`

- [ ] **Step 1: Create `tests/e2e/helpers.ts`**

```typescript
import type { Page } from '@playwright/test';

const HYDRATION_TIMEOUT = 15_000;
const SETTLE_DELAY = 1_000;

/**
 * Wait for the SolidJS Desktop island to hydrate.
 * Hydration is complete when desktop icons appear in the DOM.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.locator('.desktop-icon').first().waitFor({
    state: 'attached',
    timeout: HYDRATION_TIMEOUT,
  });
  // Let any post-hydration effects settle
  await page.waitForTimeout(SETTLE_DELAY);
}

/**
 * Collects console errors and page errors during a test.
 * Attach before navigation, assert after test actions.
 */
export class ConsoleErrorCollector {
  readonly errors: string[] = [];

  attach(page: Page): void {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore favicon 404s — not a real error
        if (text.includes('favicon')) return;
        this.errors.push(text);
      }
    });
    page.on('pageerror', (err) => {
      this.errors.push(err.message);
    });
  }
}

/**
 * Open an app by clicking its desktop icon.
 * On mobile (touch), uses tap. On desktop, uses dblclick.
 */
export async function openApp(page: Page, appLabel: string): Promise<void> {
  const icon = page.locator('.desktop-icon', { hasText: appLabel });
  const isMobile = await page.evaluate(() =>
    window.matchMedia('(max-width: 768px)').matches,
  );
  if (isMobile) {
    await icon.tap();
  } else {
    await icon.dblClick();
  }
  // Wait for window to appear
  await page.locator('.window.win-container').first().waitFor({
    state: 'visible',
    timeout: 5_000,
  });
}

/**
 * Close the topmost window via its title bar close button.
 */
export async function closeTopWindow(page: Page): Promise<void> {
  const closeBtn = page
    .locator('.window.win-container')
    .last()
    .locator('.title-bar-controls button[aria-label="Close"]');
  await closeBtn.click();
  // Brief pause for DOM update
  await page.waitForTimeout(300);
}
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/helpers.ts
git commit -m "test: add e2e shared helpers (hydration, errors, app open/close)"
```

---

## Task 3: Health Tests — Hydration & Console Error Guard

**Files:**
- Create: `tests/e2e/health.spec.ts`

This is the highest-value test — it would have caught the `<Show>` hydration mismatch instantly.

- [ ] **Step 1: Write `tests/e2e/health.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';
import { ConsoleErrorCollector, waitForHydration } from './helpers';

test.describe('Page Health', () => {
  test('loads without console errors or hydration failures', async ({ page }) => {
    const collector = new ConsoleErrorCollector();
    collector.attach(page);

    await page.goto('/');
    await waitForHydration(page);

    expect(collector.errors).toEqual([]);
  });

  test('desktop icons render after hydration', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const icons = page.locator('.desktop-icon');
    const count = await icons.count();
    expect(count).toBe(7);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pnpm test:e2e tests/e2e/health.spec.ts
```

Expected: Both tests pass for both desktop and mobile projects (4 total test runs).

This is a special case for TDD — we're writing tests for existing working behavior. The tests should pass. If they don't, we've found a bug (like the hydration mismatch we already fixed). If they error, the test infra has issues.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/health.spec.ts
git commit -m "test: add e2e health checks (hydration, console errors, icon count)"
```

---

## Task 4: Smoke Tests — App Opening & Content Assertions

**Files:**
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write `tests/e2e/smoke.spec.ts`**

```typescript
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
    await expect(window).toContainText('Send Email');
    await expect(window).toContainText('Telegram');

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

  test('Knowledge Base — opens and shows tree view', async ({ page }) => {
    await openApp(page, 'Knowledge Base');

    const window = page.locator('.window.win-container').first();
    await expect(window.locator('.title-bar-text')).toContainText('Knowledge Base');
    // Tree view uses 98.css tree-view class
    await expect(window.locator('[role="tree"], .tree-view, .library-app')).toBeVisible();

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
    // Only relevant for desktop project
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
```

- [ ] **Step 2: Run tests**

```bash
pnpm test:e2e tests/e2e/smoke.spec.ts
```

Expected: All tests pass across both projects. Some tests self-skip on the wrong viewport (taskbar desktop-only / mobile-only tests).

- [ ] **Step 3: Fix any failures**

If a test fails, investigate the cause:
- Content assertion wrong → fix the locator/text to match actual DOM
- App doesn't open → check `openApp` helper matches actual icon labels
- Timeout → increase timeout or check if lazy-loaded component needs longer

Do NOT change production code to make tests pass (unless the test reveals a real bug).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test: add e2e smoke tests (all apps open, start menu, taskbar)"
```

---

## Task 5: Visual Regression Tests — Screenshot Comparisons

**Files:**
- Create: `tests/e2e/visual-regression.spec.ts`

- [ ] **Step 1: Write `tests/e2e/visual-regression.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';
import { openApp, waitForHydration } from './helpers';

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
    await page.locator('.window.win-container').first().locator('text=Dmytro Lesyk').waitFor({
      state: 'visible',
      timeout: 10_000,
    });

    await expect(page).toHaveScreenshot('window-view-cv.png');
  });
});
```

- [ ] **Step 2: Generate initial reference screenshots**

```bash
pnpm test:e2e:update tests/e2e/visual-regression.spec.ts
```

This generates the reference screenshots in `tests/e2e/visual-regression.spec.ts-snapshots/`. There will be separate images per project (desktop vs mobile).

- [ ] **Step 3: Inspect generated screenshots**

Verify the screenshots look correct by opening them:
```bash
ls tests/e2e/visual-regression.spec.ts-snapshots/
```

Open and visually confirm the images are correct (icons visible, CRT frame on desktop, no CRT on mobile, etc.).

- [ ] **Step 4: Run tests again to verify screenshots match**

```bash
pnpm test:e2e tests/e2e/visual-regression.spec.ts
```

Expected: All pass (comparing against the just-generated references).

- [ ] **Step 5: Commit (including reference screenshots)**

```bash
git add tests/e2e/visual-regression.spec.ts tests/e2e/visual-regression.spec.ts-snapshots/
git commit -m "test: add visual regression tests with reference screenshots"
```

---

## Task 6: Responsive Tests — Breakpoint Boundary

**Files:**
- Create: `tests/e2e/responsive.spec.ts`

- [ ] **Step 1: Write `tests/e2e/responsive.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';
import { openApp, waitForHydration } from './helpers';

test.describe('Responsive — breakpoint boundary', () => {
  test('at 769px: desktop taskbar visible, mobile taskbar hidden', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 769, height: 720 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await waitForHydration(page);

    await expect(page.locator('.taskbar__tasks--desktop')).toBeVisible();
    await expect(page.locator('.taskbar__tasks--mobile')).toBeHidden();

    await context.close();
  });

  test('at 768px: mobile taskbar visible, desktop taskbar hidden', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await waitForHydration(page);

    await expect(page.locator('.taskbar__tasks--mobile')).toBeVisible();
    await expect(page.locator('.taskbar__tasks--desktop')).toBeHidden();

    await context.close();
  });
});

test.describe('Responsive — mobile behavior', () => {
  test('window opens full-screen on mobile', async ({ page }, testInfo) => {
    const isMobile = await page.evaluate(() =>
      window.matchMedia('(max-width: 768px)').matches,
    );
    if (!isMobile) {
      testInfo.skip();
      return;
    }

    await page.goto('/');
    await waitForHydration(page);
    await openApp(page, 'View CV');

    const window = page.locator('.window.win-container').first();
    const box = await window.boundingBox();
    const viewport = page.viewportSize();

    expect(box).toBeTruthy();
    expect(box!.width).toBe(viewport!.width);

    // Window should use position: fixed on mobile
    const position = await window.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('CRT frame elements hidden on mobile', async ({ page }, testInfo) => {
    const isMobile = await page.evaluate(() =>
      window.matchMedia('(max-width: 768px)').matches,
    );
    if (!isMobile) {
      testInfo.skip();
      return;
    }

    await page.goto('/');
    await waitForHydration(page);

    await expect(page.locator('.crt-chin')).toBeHidden();
    await expect(page.locator('.crt-stand__neck')).toBeHidden();
    await expect(page.locator('.crt-stand__base')).toBeHidden();
    await expect(page.locator('.crt-glass')).toBeHidden();
    await expect(page.locator('.crt-scanlines')).toBeHidden();
  });

  test('CRT frame elements visible on desktop', async ({ page }, testInfo) => {
    const isMobile = await page.evaluate(() =>
      window.matchMedia('(max-width: 768px)').matches,
    );
    if (isMobile) {
      testInfo.skip();
      return;
    }

    await page.goto('/');
    await waitForHydration(page);

    await expect(page.locator('.crt-chin')).toBeVisible();
    await expect(page.locator('.crt-stand__neck')).toBeVisible();
    await expect(page.locator('.crt-stand__base')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts
```

Expected: All pass. Breakpoint tests create their own browser contexts (ignoring the project viewport). Mobile/desktop-specific tests skip on the wrong project.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/responsive.spec.ts
git commit -m "test: add responsive breakpoint and mobile/desktop behavior tests"
```

---

## Task 7: CI Integration

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add `e2e` job to `.github/workflows/ci.yml`**

Add this job after the existing `verify` job:

```yaml
  e2e:
    runs-on: ubuntu-latest
    needs: [verify]
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium
      - name: Run E2E tests
        run: pnpm test:e2e
      - name: Upload test results on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-test-results
          path: tests/e2e/test-results/
          retention-days: 7
```

Also update the `deploy` job's `needs` to include `e2e`:

```yaml
  deploy:
    needs: [verify, cv-generate, e2e]
```

Wait — `e2e` runs on all PRs and pushes, but `cv-generate` only runs on main push. The deploy job condition already has `if: github.ref == 'refs/heads/main'`. So `needs: [verify, cv-generate, e2e]` works because on main push all three run; on PRs only `verify` and `e2e` run and `deploy` is skipped by its `if` condition.

Actually, the `deploy` job needs `cv-generate` which only runs on main. If `e2e` is added to `needs` for deploy, and e2e runs on PRs too, deploy would wait for e2e on main. That's fine — deploy should wait for e2e.

- [ ] **Step 2: Verify CI config is valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML OK"
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add e2e playwright job, require before deploy"
```

---

## Task 8: Full Suite Validation

- [ ] **Step 1: Run the complete e2e suite locally**

```bash
pnpm test:e2e
```

Expected: All tests pass across both desktop and mobile projects.

- [ ] **Step 2: Run `pnpm verify` to ensure nothing is broken**

```bash
pnpm verify
```

Expected: Lint, typecheck, and unit tests all pass. The e2e tests are separate and not affected.

- [ ] **Step 3: Review screenshot references**

Open and visually inspect all files in `tests/e2e/visual-regression.spec.ts-snapshots/`. Verify:
- Desktop empty: CRT frame visible, 7 icons in grid, taskbar at bottom
- Mobile empty: no CRT frame, icons centered in flex grid, taskbar at bottom
- Start menu: open with sidebar and items listed
- Window open: View CV window with content visible

- [ ] **Step 4: Final commit with any adjustments**

```bash
git add -A
git commit -m "test: finalize e2e test suite — all tests passing"
```

- [ ] **Step 5: Update feature doc status**

In `docs/features/e2e-tests.md`, change:
```
## Status
Design
```
to:
```
## Status
Complete
```

```bash
git add docs/features/e2e-tests.md
git commit -m "docs: mark e2e test suite feature as complete"
```
