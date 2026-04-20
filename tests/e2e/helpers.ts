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
