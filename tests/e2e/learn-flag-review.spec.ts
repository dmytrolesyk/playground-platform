import { expect, test } from '@playwright/test';

const ARTICLE_ID = 'architecture/overview';
const ARTICLE_URL = `/learn/${ARTICLE_ID}`;
const ALREADY_FLAGGED_TEXT = /already flagged/i;
const SUBMITTING_TEXT = /flagging|submitting/i;
const SUCCESS_TEXT = /flagged|thanks/i;

test.describe('Learn review flag', () => {
  test('shows the already-flagged state from localStorage', async ({ page }) => {
    await page.addInitScript((flagKey: string) => {
      window.localStorage.setItem(flagKey, new Date().toISOString());
    }, `review-flag:${ARTICLE_ID}`);

    await page.goto(ARTICLE_URL);

    const widget = page.locator('#flag-for-review');
    const button = page.locator('#flag-review-btn');
    const status = page.locator('#flag-review-status');

    await expect(widget).toHaveAttribute('data-state', 'already-flagged');
    await expect(button).toBeDisabled();
    await expect(status).toContainText(ALREADY_FLAGGED_TEXT);
  });

  test('shows submitting and success states when the review flag request succeeds', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.prompt = (): string => 'Needs clarification';
    });

    await page.route('**/api/flag-article', async (route) => {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 1_500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(ARTICLE_URL);

    const widget = page.locator('#flag-for-review');
    const button = page.locator('#flag-review-btn');
    const status = page.locator('#flag-review-status');

    await button.click();

    await expect(widget).toHaveAttribute('data-state', 'submitting');
    await expect(status).toContainText(SUBMITTING_TEXT);

    await expect(widget).toHaveAttribute('data-state', 'success');
    await expect(status).toContainText(SUCCESS_TEXT);
    await expect(button).toBeDisabled();
  });
});
