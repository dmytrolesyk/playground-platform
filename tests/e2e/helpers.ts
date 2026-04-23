import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';

const HYDRATION_TIMEOUT = 15_000;
const SETTLE_DELAY = 1_000;
const LEARNING_PROGRESS_KEY = 'kb-learning-progress';
const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function resolveFixturePath(filename: string): string {
  return resolve(FIXTURES_DIR, filename);
}

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

export async function clearLearningProgress(page: Page): Promise<void> {
  await page.addInitScript((storageKey: string) => {
    const sentinel = `${storageKey}:cleared`;
    if (window.sessionStorage.getItem(sentinel) === 'true') return;
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.setItem(sentinel, 'true');
  }, LEARNING_PROGRESS_KEY);
}

export async function mockGithubNotifierEmbed(page: Page): Promise<void> {
  await page.route('https://swe-school.dmytrolesyk.dev/embed/subscribe', async (route) => {
    if (route.request().method() === 'POST') {
      const formData = new URLSearchParams(route.request().postData() ?? '');
      const repo = formData.get('repo') ?? 'unknown/repo';
      const email = formData.get('email') ?? 'unknown@example.com';

      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Subscription saved</title>
    <style>
      body {
        margin: 0;
        padding: 16px;
        background: #fff4c7;
        color: #222;
        font-family: Arial, sans-serif;
      }

      h1 {
        margin: 0 0 12px;
        font-size: 24px;
      }

      p {
        margin: 0;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <h1>Subscription saved</h1>
    <p>Watching ${repo} for ${email}</p>
  </body>
</html>`,
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      path: resolveFixturePath('github-notifier-embed.html'),
    });
  });
}

export function desktopWindow(page: Page, title: string): Locator {
  return page.locator('.window.win-container').filter({
    has: page.locator('.title-bar-text', { hasText: title }),
  });
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
  const isMobile = await page.evaluate(() => window.matchMedia('(max-width: 768px)').matches);
  if (isMobile) {
    await icon.tap();
  } else {
    await icon.dblclick();
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
