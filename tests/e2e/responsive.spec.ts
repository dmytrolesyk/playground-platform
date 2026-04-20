import { expect, test } from '@playwright/test';
import { openApp, waitForHydration } from './helpers';

test.describe('Responsive — breakpoint boundary', () => {
  test('at 769px: desktop taskbar has display flex, mobile taskbar has display none', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 769, height: 720 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await waitForHydration(page);

    const desktopDisplay = await page
      .locator('.taskbar__tasks--desktop')
      .evaluate((el) => getComputedStyle(el).display);
    const mobileDisplay = await page
      .locator('.taskbar__tasks--mobile')
      .evaluate((el) => getComputedStyle(el).display);

    expect(desktopDisplay).toBe('flex');
    expect(mobileDisplay).toBe('none');

    await context.close();
  });

  test('at 768px: mobile taskbar has display flex, desktop taskbar has display none', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await waitForHydration(page);

    const mobileDisplay = await page
      .locator('.taskbar__tasks--mobile')
      .evaluate((el) => getComputedStyle(el).display);
    const desktopDisplay = await page
      .locator('.taskbar__tasks--desktop')
      .evaluate((el) => getComputedStyle(el).display);

    expect(mobileDisplay).toBe('flex');
    expect(desktopDisplay).toBe('none');

    await context.close();
  });
});

test.describe('Responsive — mobile behavior', () => {
  test('window opens full-screen on mobile', async ({ page }, testInfo) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width > 768) {
      testInfo.skip();
      return;
    }

    await page.goto('/');
    await waitForHydration(page);
    await openApp(page, 'View CV');

    const win = page.locator('.window.win-container').first();
    const box = await win.boundingBox();

    expect(box).toBeTruthy();
    expect(box!.width).toBe(viewport.width);

    // Window should use position: fixed on mobile
    const position = await win.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('CRT frame elements hidden on mobile', async ({ page }, testInfo) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width > 768) {
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
    const viewport = page.viewportSize();
    if (!viewport || viewport.width <= 768) {
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
