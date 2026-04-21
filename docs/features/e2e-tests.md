# Feature: E2E & Visual Regression Test Suite

## Status
Complete

## Motivation
Recent commits on this branch reveal a pattern: visual and interaction bugs on mobile are invisible until someone manually tests on a real device. The hydration mismatch that killed all mobile icons, the window-layer blocking clicks, the taskbar hidden behind browser chrome — none of these were caught by the existing unit-test-only `pnpm verify`. A production-build E2E suite running against real browser viewports would catch all three categories automatically.

## Architecture Fit
This is infrastructure, not an app — no registry integration. It adds a new test layer alongside the existing vitest unit tests. The two are deliberately separate:

- **vitest** (`pnpm verify`): fast, no browser, unit/logic tests (snake engine, future pure-logic modules)
- **Playwright** (`pnpm test:e2e`): production build, real Chromium, visual + interaction + hydration tests

CI gets a new `e2e` job that runs after `verify`. Both are required checks for PR merge.

## Technical Design

### Tooling
**Playwright Test** — built-in screenshot comparison (`toHaveScreenshot()`), mobile device emulation, `webServer` config to build+serve automatically, and CI artifact support for failure diffs.

### Test Server
Playwright's `webServer` option runs `pnpm build && node dist/server/entry.mjs` before tests start. Tests always run against the **production build**, not the dev server. This is critical because SSR hydration mismatches only manifest in production (dev mode uses Vite HMR which bypasses hydration).

### Viewports
Two device profiles used across all test files:
- **desktop**: 1280×720
- **mobile**: 375×812, `isMobile: true`, `hasTouch: true`

Plus a targeted functional test at the 768px breakpoint boundary (responsive.spec.ts).

### Browser
Chromium only. Single browser keeps CI fast. Firefox/WebKit can be added later if needed.

### File Structure

```
tests/
└── e2e/
    ├── playwright.config.ts
    ├── helpers.ts               — shared setup (page load, wait for hydration, error collector)
    ├── health.spec.ts           — hydration + console error checks
    ├── smoke.spec.ts            — icons render, apps open, shallow content
    ├── visual-regression.spec.ts — screenshot comparisons
    └── responsive.spec.ts       — breakpoint boundary, mobile vs desktop behavior
```

Reference screenshots stored in Playwright's default snapshot directory (`tests/e2e/<spec-name>.spec.ts-snapshots/`), committed to git. Updated via `pnpm test:e2e:update`.

### Test Categories

#### 1. health.spec.ts — Hydration & Console Error Guard
For each viewport (desktop, mobile):
- Load page, wait for hydration (`.desktop-icon` elements appear)
- Collect all `console.error` and `pageerror` events during load + 2s settle
- Assert zero errors

This single test would have caught the `<Show when={isMobile}>` hydration mismatch that broke mobile rendering.

#### 2. smoke.spec.ts — Interaction Smoke Tests
For each viewport (desktop, mobile):

**Icon rendering:**
- Desktop icons render, count matches registered desktop apps (7)

**App open + shallow content assertion (each desktop app):**

| App | Open via | Content assertion |
|---|---|---|
| browser | icon click/tap | Text "Dmytro Lesyk" visible |
| explorer | icon click/tap | Download link(s) present |
| contact | icon click/tap | "Telegram" and "Email" text visible |
| terminal | icon click/tap | Prompt element or terminal container exists |
| snake | icon click/tap | Canvas element exists |
| library | icon click/tap | Tree view element present |
| architecture-explorer | icon click/tap | Canvas or node elements present |

Each test: open app → assert window title → assert content element → close window.

**Start menu:**
- Click Start button → menu opens → items listed → click item → window opens

**Taskbar (desktop only):**
- Open a window → task button appears in taskbar with correct title

**Taskbar (mobile only):**
- Open a window → active app name shown in mobile taskbar

#### 3. visual-regression.spec.ts — Screenshot Comparisons
- Desktop: empty desktop (icons, taskbar, CRT frame)
- Mobile: empty desktop (icons in flex grid, taskbar, no CRT frame)
- Desktop: start menu open
- Desktop: one window open (browser app as representative)

Uses `toHaveScreenshot()` with Playwright's default diff threshold. Reference screenshots committed per-platform (CI runs Linux).

#### 4. responsive.spec.ts — Breakpoint Boundary Tests
- At 769px width: `.taskbar__tasks--desktop` visible, `.taskbar__tasks--mobile` hidden
- At 768px width: `.taskbar__tasks--mobile` visible, `.taskbar__tasks--desktop` hidden
- Mobile: opened window has `position: fixed`, fills viewport width
- Mobile: CRT frame elements hidden (`.crt-chin`, `.crt-stand__neck`, `.crt-stand__base` have `display: none`)
- Desktop: CRT frame elements visible

### Shared Helpers (`helpers.ts`)

```typescript
// Wait for the SolidJS island to hydrate (icons appear in DOM)
async function waitForHydration(page: Page): Promise<void>

// Collect console errors during a page session
class ConsoleErrorCollector { ... }

// Open an app by clicking/tapping its desktop icon
async function openApp(page: Page, appId: string): Promise<void>

// Close the topmost window
async function closeTopWindow(page: Page): Promise<void>
```

### CI Integration

New job in `.github/workflows/ci.yml`:

```yaml
e2e:
  runs-on: ubuntu-latest
  needs: [verify]
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version-file: '.node-version'
        cache: 'pnpm'
    - run: pnpm install
    - run: npx playwright install --with-deps chromium
    - run: pnpm test:e2e
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: e2e-test-results
        path: tests/e2e/test-results/
        retention-days: 7
```

Required check for PR merge (alongside `verify`). On failure, screenshot diffs uploaded as artifacts.

### Package Scripts

```json
{
  "test:e2e": "playwright test --config tests/e2e/playwright.config.ts",
  "test:e2e:update": "playwright test --config tests/e2e/playwright.config.ts --update-snapshots"
}
```

### .gitignore Additions

```
# Playwright
tests/e2e/test-results/
```

Reference snapshots (`*-snapshots/`) are NOT ignored — they are committed.

### Dependencies

```
devDependencies:
  @playwright/test  (latest)
```

Note: `playwright` (the library) is NOT needed — `@playwright/test` includes everything. The `playwright` package added during debugging should be removed.

## Open Questions
None — all resolved during brainstorming.

## Implementation Plan
- [ ] Install `@playwright/test`, add package scripts
- [ ] Create `tests/e2e/playwright.config.ts` with webServer, projects (desktop + mobile), and snapshot config
- [ ] Create `tests/e2e/helpers.ts` with shared utilities
- [ ] Create `tests/e2e/health.spec.ts` — hydration/error checks
- [ ] Create `tests/e2e/smoke.spec.ts` — icon rendering + app open + content assertions
- [ ] Create `tests/e2e/visual-regression.spec.ts` — screenshot comparisons
- [ ] Create `tests/e2e/responsive.spec.ts` — breakpoint boundary tests
- [ ] Update `.github/workflows/ci.yml` with `e2e` job
- [ ] Update `.gitignore` with test-results exclusion
- [ ] Run full suite locally, verify all non-screenshot tests pass
- [ ] Generate reference screenshots locally (macOS), commit them for local dev
- [ ] Push to CI — first run generates Linux reference screenshots, download artifacts, commit Linux snapshots
- [ ] Verify full suite passes in CI
- [ ] Update branch protection to require `e2e` check

## Knowledge Expansion

### Articles to create:
- [ ] `features/e2e-testing.md` — walkthrough of the hydration mismatch discovery, why production-build testing matters, Playwright viewport emulation

### Articles to update:
- [ ] `architecture/overview.md` — add testing layer to the architecture overview

### Architecture explorer updates:
- [ ] Add node: E2E Test Suite (testing layer)
- [ ] Add edges: E2E → Desktop, E2E → Taskbar, E2E → WindowManager
