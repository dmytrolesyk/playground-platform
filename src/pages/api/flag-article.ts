import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIRoute } from 'astro';
import { isRecord } from '../../utils/type-guards';

export const prerender = false;

interface FlagBody {
  articleId?: string;
  reason?: string;
}

const ARTICLE_ID_PATTERN = /^[\w-]+\/[\w-]+$/;

export const POST: APIRoute = async ({ request }: { request: Request }) => {
  let body: FlagBody;
  try {
    const raw: unknown = await request.json();
    if (!isRecord(raw)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    body = {
      ...(typeof raw.articleId === 'string' && { articleId: raw.articleId }),
      ...(typeof raw.reason === 'string' && { reason: raw.reason }),
    };
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.articleId || typeof body.articleId !== 'string') {
    return new Response(JSON.stringify({ ok: false, error: 'Missing articleId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate article ID format to prevent path traversal
  if (!ARTICLE_ID_PATTERN.test(body.articleId)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid articleId format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const flagDir = join(process.cwd(), 'src/data/review-flags');
  if (!existsSync(flagDir)) {
    mkdirSync(flagDir, { recursive: true });
  }

  const slug = body.articleId.replace(/\//g, '--');
  const flagPath = join(flagDir, `${slug}.json`);

  const flag = {
    articleId: body.articleId,
    flaggedAt: new Date().toISOString(),
    reason: typeof body.reason === 'string' ? body.reason : undefined,
  };

  writeFileSync(flagPath, `${JSON.stringify(flag, null, 2)}\n`);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
