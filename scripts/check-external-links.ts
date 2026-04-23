/**
 * External reference liveness checker.
 *
 * Reads all knowledge articles, extracts externalReferences URLs,
 * and sends HEAD requests to check if they're still alive.
 *
 * Run manually: pnpm check:links
 * NOT part of the fast audit loop (network-dependent and slow).
 */

import { loadKnowledgeAuditInput } from '@playground/knowledge-engine/audit/load';

interface LinkCheckResult {
  articleId: string;
  url: string;
  status: 'ok' | 'dead' | 'redirect' | 'timeout' | 'error';
  statusCode?: number;
  redirectUrl?: string;
  error?: string;
}

const REQUEST_TIMEOUT_MS = 10_000;
const CONCURRENT_REQUESTS = 5;
const DELAY_BETWEEN_BATCHES_MS = 500;

async function checkUrl(url: string): Promise<Omit<LinkCheckResult, 'articleId'>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual',
      headers: { 'User-Agent': 'knowledge-link-checker/1.0' },
    });

    clearTimeout(timeoutId);
    return classifyResponse(url, response);
  } catch (err) {
    return classifyError(url, err);
  }
}

function classifyResponse(
  url: string,
  response: Response,
): Omit<LinkCheckResult, 'articleId'> | Promise<Omit<LinkCheckResult, 'articleId'>> {
  const statusCode = response.status;

  if (statusCode >= 200 && statusCode < 300) {
    return { url, status: 'ok', statusCode };
  }

  if (statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308) {
    const redirectUrl = response.headers.get('location') ?? undefined;
    return { url, status: 'redirect', statusCode, redirectUrl };
  }

  if (statusCode === 404 || statusCode === 410) {
    return { url, status: 'dead', statusCode };
  }

  // Some servers reject HEAD — fall back to GET
  if (statusCode === 405 || statusCode === 403) {
    return checkUrlWithGet(url);
  }

  return { url, status: 'error', statusCode, error: `HTTP ${statusCode}` };
}

function classifyError(url: string, err: unknown): Omit<LinkCheckResult, 'articleId'> {
  if (err instanceof Error && err.name === 'AbortError') {
    return { url, status: 'timeout', error: 'Request timed out' };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { url, status: 'error', error: message };
}

async function checkUrlWithGet(url: string): Promise<Omit<LinkCheckResult, 'articleId'>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'manual',
      headers: { 'User-Agent': 'knowledge-link-checker/1.0' },
    });

    clearTimeout(timeoutId);
    const statusCode = response.status;

    if (statusCode >= 200 && statusCode < 400) {
      return { url, status: 'ok', statusCode };
    }
    if (statusCode === 404 || statusCode === 410) {
      return { url, status: 'dead', statusCode };
    }
    return { url, status: 'error', statusCode, error: `HTTP ${statusCode}` };
  } catch (err) {
    return classifyError(url, err);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function collectUrlMap(
  articles: readonly { id: string; externalReferences?: readonly { url?: string }[] }[],
): Map<string, string[]> {
  const urlToArticles = new Map<string, string[]>();
  for (const article of articles) {
    for (const ref of article.externalReferences ?? []) {
      if (!ref.url) continue;
      const existing = urlToArticles.get(ref.url);
      if (existing) {
        existing.push(article.id);
      } else {
        urlToArticles.set(ref.url, [article.id]);
      }
    }
  }
  return urlToArticles;
}

async function checkAllUrls(
  uniqueUrls: string[],
  urlToArticles: Map<string, string[]>,
): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];
  const totalUrls = uniqueUrls.length;

  for (let i = 0; i < uniqueUrls.length; i += CONCURRENT_REQUESTS) {
    const batch = uniqueUrls.slice(i, i + CONCURRENT_REQUESTS);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await checkUrl(url);
        const articles = urlToArticles.get(url) ?? [];
        return articles.map((articleId) => ({ ...result, articleId }));
      }),
    );

    for (const articleResults of batchResults) {
      results.push(...articleResults);
    }

    const checked = Math.min(i + CONCURRENT_REQUESTS, uniqueUrls.length);
    process.stdout.write(`  [${checked}/${totalUrls}] checked\r`);

    if (i + CONCURRENT_REQUESTS < uniqueUrls.length) {
      await delay(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return results;
}

function reportSection(
  label: string,
  items: LinkCheckResult[],
  format: (r: LinkCheckResult) => string,
): void {
  if (items.length === 0) return;
  process.stdout.write(`${label} (${items.length}):\n`);
  for (const r of items) {
    process.stdout.write(`  ${format(r)}\n`);
  }
  process.stdout.write('\n');
}

function reportResults(results: LinkCheckResult[]): void {
  const dead = results.filter((r) => r.status === 'dead');
  const redirects = results.filter((r) => r.status === 'redirect');
  const timeouts = results.filter((r) => r.status === 'timeout');
  const errors = results.filter((r) => r.status === 'error');
  const ok = results.filter((r) => r.status === 'ok');

  reportSection(
    '\u274c Dead links',
    dead,
    (r) => `${r.articleId}: ${r.url} (HTTP ${r.statusCode})`,
  );
  reportSection(
    '\u21aa\ufe0f  Redirects',
    redirects,
    (r) => `${r.articleId}: ${r.url} \u2192 ${r.redirectUrl ?? '(unknown)'} (HTTP ${r.statusCode})`,
  );
  reportSection('\u23f1\ufe0f  Timeouts', timeouts, (r) => `${r.articleId}: ${r.url}`);
  reportSection(
    '\u26a0\ufe0f  Errors',
    errors,
    (r) => `${r.articleId}: ${r.url} \u2014 ${r.error}`,
  );

  process.stdout.write(
    `Summary: ${ok.length} ok, ${dead.length} dead, ${redirects.length} redirects, ${timeouts.length} timeouts, ${errors.length} errors\n`,
  );

  if (dead.length > 0) {
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const input = await loadKnowledgeAuditInput();
  const urlToArticles = collectUrlMap(input.articles);
  const uniqueUrls = [...urlToArticles.keys()];

  process.stdout.write(
    `Checking ${uniqueUrls.length} unique URLs from ${input.articles.length} articles...\n\n`,
  );

  const results = await checkAllUrls(uniqueUrls, urlToArticles);
  process.stdout.write('\n\n');
  reportResults(results);
}

main().catch((err) => {
  process.stderr.write(
    `Link checker crashed: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exitCode = 1;
});
