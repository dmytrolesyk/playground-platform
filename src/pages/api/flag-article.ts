import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIRoute } from 'astro';
import { isRecord } from '../../utils/type-guards';

export const prerender = false;

interface FlagBody {
  articleId?: string;
  reason?: string;
}

type ParseResult<T> = { ok: true; value: T } | { ok: false; status: 400; error: string };

const ARTICLE_ID_PATTERN = /^[\w-]+\/[\w-]+$/;

function jsonResponse(body: { ok: boolean; error?: string }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseOptionalStringField(
  raw: Record<string, unknown>,
  field: keyof FlagBody,
): ParseResult<string | undefined> {
  const value = raw[field];
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (typeof value !== 'string') {
    return { ok: false, status: 400, error: `Field "${field}" must be a string` };
  }
  return { ok: true, value };
}

async function parseFlagBody(request: Request): Promise<ParseResult<FlagBody>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, status: 400, error: 'Malformed JSON body' };
  }
  if (!isRecord(raw)) {
    return { ok: false, status: 400, error: 'JSON body must be an object' };
  }

  const articleId = parseOptionalStringField(raw, 'articleId');
  if (!articleId.ok) return articleId;

  const reason = parseOptionalStringField(raw, 'reason');
  if (!reason.ok) return reason;

  const body: FlagBody = {};
  if (articleId.value !== undefined) body.articleId = articleId.value;
  if (reason.value !== undefined) body.reason = reason.value;

  return { ok: true, value: body };
}

export async function handleFlagArticleRequest(request: Request): Promise<Response> {
  const parsedBody = await parseFlagBody(request);
  if (!parsedBody.ok) {
    return jsonResponse({ ok: false, error: parsedBody.error }, parsedBody.status);
  }

  const body = parsedBody.value;

  if (!body.articleId || typeof body.articleId !== 'string') {
    return jsonResponse({ ok: false, error: 'Missing articleId' }, 400);
  }

  // Validate article ID format to prevent path traversal
  if (!ARTICLE_ID_PATTERN.test(body.articleId)) {
    return jsonResponse({ ok: false, error: 'Invalid articleId format' }, 400);
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

  return jsonResponse({ ok: true }, 200);
}

export const POST: APIRoute = ({ request }: { request: Request }) =>
  handleFlagArticleRequest(request);
