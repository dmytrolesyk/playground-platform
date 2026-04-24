import { describe, expect, it } from 'vitest';
import { handleFlagArticleRequest } from '../../../src/pages/api/flag-article.ts';

function makeJsonRequest(body: string): Request {
  return new Request('http://localhost/api/flag-article', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

describe('POST /api/flag-article', () => {
  it('rejects wrong-type JSON fields instead of treating them as missing', async () => {
    const response = await handleFlagArticleRequest(
      makeJsonRequest(JSON.stringify({ articleId: 42 })),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'Field "articleId" must be a string',
    });
  });

  it('rejects malformed JSON bodies', async () => {
    const response = await handleFlagArticleRequest(
      makeJsonRequest('{"articleId":"architecture/overview"'),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'Malformed JSON body',
    });
  });

  it('rejects non-object JSON bodies', async () => {
    const response = await handleFlagArticleRequest(
      makeJsonRequest(JSON.stringify(['architecture/overview'])),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'JSON body must be an object',
    });
  });
});
