/**
 * AI-assisted content quality review CLI.
 *
 * Evaluates knowledge articles across 5 quality dimensions using an LLM:
 * 1. Factual Grounding — does the explanation match the code AND cited sources?
 * 2. Depth — does it explain WHY, not just WHAT?
 * 3. Coverage — does it cover the important aspects?
 * 4. Exercise Quality — do exercises test real understanding?
 * 5. External Reference Quality — are references authoritative and diverse?
 *
 * Usage:
 *   node --experimental-strip-types scripts/review-article.ts concepts/fine-grained-reactivity
 *   node --experimental-strip-types scripts/review-article.ts --all
 *   node --experimental-strip-types scripts/review-article.ts --since 2026-04-20
 *
 * Environment:
 *   REVIEW_API_KEY — API key for the LLM provider (required)
 *   REVIEW_MODEL — model to use (default: claude-sonnet-4-20250514)
 *   REVIEW_BASE_URL — API base URL (default: https://api.anthropic.com)
 *   REVIEW_PROVIDER — 'anthropic' or 'openai' (default: anthropic)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { getArray, getString, getStringArray } from '@playground/knowledge-engine/frontmatter';
import { match, tryCatch } from '@playground/knowledge-engine/result';
import { parse as parseYaml } from 'yaml';
import {
  buildCoveragePrompt,
  buildDepthPrompt,
  buildExerciseQualityPrompt,
  buildGroundingPrompt,
  buildReferenceQualityPrompt,
} from './review-article/prompts.ts';
import { createProvider } from './review-article/providers.ts';
import type {
  ArticleContent,
  CliArgs,
  DimensionResult,
  LlmProvider,
  QualityReport,
  ReviewDimension,
} from './review-article/types.ts';

// ── Constants ───────────────────────────────────────────────────────────

const CONTENT_ROOT = join(process.cwd(), 'src/content/knowledge');
const REPORT_DIR = join(process.cwd(), 'src/data/quality-reports');

const DIMENSION_WEIGHTS: Record<ReviewDimension, number> = {
  grounding: 0.3,
  depth: 0.25,
  coverage: 0.2,
  exerciseQuality: 0.15,
  referenceQuality: 0.1,
};

const DELAY_BETWEEN_ARTICLES_MS = 2000;
const DELAY_BETWEEN_DIMENSIONS_MS = 1000;

// ── CLI parsing ─────────────────────────────────────────────────────────

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);

  if (args.includes('--all')) {
    return { mode: 'all' };
  }

  const sinceIndex = args.indexOf('--since');
  if (sinceIndex !== -1) {
    const dateStr = args[sinceIndex + 1];
    if (!dateStr) {
      throw new Error('--since requires a date argument (YYYY-MM-DD)');
    }
    return { mode: 'since', since: dateStr };
  }

  const slug = args[0];
  if (!slug) {
    throw new Error('Usage: review-article.ts <article-slug> | --all | --since YYYY-MM-DD');
  }

  return { mode: 'single', slug };
}

// ── Article loading ─────────────────────────────────────────────────────

const FRONTMATTER_PATTERN = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---\r?\n?(?<body>[\s\S]*)$/u;
const MARKDOWN_EXTENSION_PATTERN = /\.md$/;

function loadArticle(slug: string): ArticleContent {
  const filePath = join(CONTENT_ROOT, `${slug}.md`);
  if (!existsSync(filePath)) {
    throw new Error(`Article not found: ${filePath}`);
  }

  const source = readFileSync(filePath, 'utf8');
  const match = FRONTMATTER_PATTERN.exec(source);

  if (!match?.groups) {
    throw new Error(`Could not parse frontmatter for ${slug}`);
  }

  const frontmatter = parseYaml(match.groups.frontmatter ?? '') as Record<string, unknown>;
  const body = match.groups.body ?? '';

  // Load related files content
  const relatedFiles = getStringArray(frontmatter, 'relatedFiles');
  const relatedFileContents: Record<string, string> = {};
  for (const rf of relatedFiles) {
    const rfPath = join(process.cwd(), rf);
    if (existsSync(rfPath)) {
      try {
        relatedFileContents[rf] = readFileSync(rfPath, 'utf8');
      } catch {
        relatedFileContents[rf] = '(could not read file)';
      }
    } else {
      relatedFileContents[rf] = '(file not found)';
    }
  }

  return {
    slug,
    title: getString(frontmatter, 'title') ?? slug,
    body,
    frontmatter,
    relatedFileContents,
    exercises: getArray(frontmatter, 'exercises'),
    learningObjectives: getStringArray(frontmatter, 'learningObjectives'),
    externalReferences: getArray(frontmatter, 'externalReferences'),
    lastUpdated: getString(frontmatter, 'lastUpdated'),
  };
}

function listAllSlugs(): string[] {
  return listMarkdownFiles(CONTENT_ROOT).map((filePath) =>
    relative(CONTENT_ROOT, filePath).replaceAll(sep, '/').replace(MARKDOWN_EXTENSION_PATTERN, ''),
  );
}

function listMarkdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(fullPath);
      }
      return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function filterByDate(slugs: string[], since: string): string[] {
  const sinceDate = new Date(since);
  return slugs.filter((slug) => {
    const article = loadArticle(slug);
    if (!article.lastUpdated) return false;
    const articleDate = new Date(article.lastUpdated);
    return articleDate >= sinceDate;
  });
}

// ── LLM review ──────────────────────────────────────────────────────────

async function reviewDimension(
  provider: LlmProvider,
  article: ArticleContent,
  dimension: ReviewDimension,
): Promise<DimensionResult> {
  const prompt = buildPromptForDimension(article, dimension);
  const result = await provider.complete(prompt);

  return match(result, {
    onOk: (response: string) => parseDimensionResponse(response, dimension),
    onErr: (message: string) => ({
      score: 0,
      rationale: `Review failed: ${message}`,
      error: message,
    }),
  });
}

function buildPromptForDimension(article: ArticleContent, dimension: ReviewDimension): string {
  switch (dimension) {
    case 'grounding':
      return buildGroundingPrompt(article);
    case 'depth':
      return buildDepthPrompt(article);
    case 'coverage':
      return buildCoveragePrompt(article);
    case 'exerciseQuality':
      return buildExerciseQualityPrompt(article);
    case 'referenceQuality':
      return buildReferenceQualityPrompt(article);
    default:
      throw new Error(`Unknown review dimension: ${dimension as string}`);
  }
}

const JSON_EXTRACT_PATTERN = /\{[\s\S]*\}/u;

const DIMENSION_FIELDS: Record<string, string> = {
  grounding: 'issues',
  depth: 'suggestedImprovements',
  coverage: 'missingTopics',
  exerciseQuality: 'suggestedExercises',
  referenceQuality: 'suggestedReferences',
};

function extractDimensionField(
  result: DimensionResult,
  dimension: ReviewDimension,
  parsed: Record<string, unknown>,
): void {
  const field = DIMENSION_FIELDS[dimension];
  if (!field) return;
  const value = parsed[field];
  if (!Array.isArray(value)) return;
  (result as Record<string, unknown>)[field] = value.filter(
    (item): item is string => typeof item === 'string',
  );
}

function parseDimensionResponse(response: string, dimension: ReviewDimension): DimensionResult {
  const jsonMatch = JSON_EXTRACT_PATTERN.exec(response);
  if (!jsonMatch) {
    return {
      score: 0,
      rationale: `Could not parse LLM response as JSON. Raw response: ${response.slice(0, 500)}`,
      error: 'JSON parse failure',
    };
  }

  const parseResult = tryCatch(
    () => {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const score = typeof parsed.score === 'number' ? parsed.score : 0;
      const rationale = typeof parsed.rationale === 'string' ? parsed.rationale : '';

      const result: DimensionResult = { score, rationale };
      extractDimensionField(result, dimension, parsed);
      return result;
    },
    (): DimensionResult => ({
      score: 0,
      rationale: `JSON parse error. Raw response: ${response.slice(0, 500)}`,
      error: 'JSON parse failure',
    }),
  );

  return match(parseResult, {
    onOk: (dim: DimensionResult) => dim,
    onErr: (dim: DimensionResult) => dim,
  });
}

function computeOverallScore(dimensions: QualityReport['dimensions']): number {
  let total = 0;
  for (const [key, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    const dim = dimensions[key as ReviewDimension];
    if (dim) {
      total += dim.score * weight;
    }
  }
  return Math.round(total * 10) / 10;
}

async function reviewArticle(
  provider: LlmProvider,
  slug: string,
  model: string,
): Promise<QualityReport> {
  const article = loadArticle(slug);
  const dimensions: ReviewDimension[] = [
    'grounding',
    'depth',
    'coverage',
    'exerciseQuality',
    'referenceQuality',
  ];

  const results: Partial<QualityReport['dimensions']> = {};

  for (const dimension of dimensions) {
    process.stdout.write(`    ${dimension}...`);
    const result = await reviewDimension(provider, article, dimension);
    results[dimension] = result;
    process.stdout.write(` ${result.score}/5\n`);

    // Rate-limit between dimensions
    if (dimension !== dimensions[dimensions.length - 1]) {
      await delay(DELAY_BETWEEN_DIMENSIONS_MS);
    }
  }

  const allDimensions = results as QualityReport['dimensions'];
  const overallScore = computeOverallScore(allDimensions);

  return {
    articleId: slug,
    reviewedAt: new Date().toISOString(),
    overallScore,
    dimensions: allDimensions,
    model,
    articleLastUpdated: article.lastUpdated ?? 'unknown',
  };
}

// ── Report I/O ──────────────────────────────────────────────────────────

function saveReport(report: QualityReport): void {
  mkdirSync(REPORT_DIR, { recursive: true });
  const filename = `${report.articleId.replaceAll('/', '--')}.json`;
  const filePath = join(REPORT_DIR, filename);
  writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function printReportSummary(report: QualityReport): void {
  const flag = report.overallScore < 3.0 ? ' ⚠️  NEEDS REVISION' : '';
  process.stdout.write(`\n  📊 ${report.articleId}: ${report.overallScore}/5${flag}\n`);
  for (const [key, dim] of Object.entries(report.dimensions)) {
    const label = key.padEnd(18);
    process.stdout.write(`     ${label} ${dim.score}/5\n`);
  }
}

function printBatchSummary(reports: QualityReport[]): void {
  if (reports.length === 0) return;

  process.stdout.write(`\n${'═'.repeat(60)}\n`);
  process.stdout.write(`  Review complete: ${reports.length} article(s)\n`);
  process.stdout.write(`${'═'.repeat(60)}\n\n`);

  const sorted = [...reports].sort((a, b) => a.overallScore - b.overallScore);

  const needsRevision = sorted.filter((r) => r.overallScore < 3.0);
  if (needsRevision.length > 0) {
    process.stdout.write(`  ⚠️  Articles needing revision (score < 3.0):\n`);
    for (const r of needsRevision) {
      process.stdout.write(`     ${r.overallScore}/5  ${r.articleId}\n`);
    }
    process.stdout.write('\n');
  }

  const avg = reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length;
  process.stdout.write(`  Average score: ${Math.round(avg * 10) / 10}/5\n`);
  process.stdout.write(`  Reports saved to: ${REPORT_DIR}\n\n`);
}

// ── Helpers ─────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env.REVIEW_API_KEY;
  if (!apiKey) {
    process.stderr.write(
      'Error: REVIEW_API_KEY environment variable is required.\n' +
        'Usage: REVIEW_API_KEY=sk-... node --experimental-strip-types scripts/review-article.ts <slug>\n',
    );
    process.exitCode = 1;
    return;
  }

  const providerName = (process.env.REVIEW_PROVIDER ?? 'anthropic') as 'anthropic' | 'openai';
  const model = process.env.REVIEW_MODEL ?? 'claude-sonnet-4-20250514';
  const baseUrl = process.env.REVIEW_BASE_URL;

  let cliArgs: CliArgs;
  try {
    cliArgs = parseArgs(process.argv);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
    return;
  }

  const provider = createProvider(providerName, apiKey, model, baseUrl);

  let slugs: string[];
  switch (cliArgs.mode) {
    case 'single':
      slugs = [cliArgs.slug];
      break;
    case 'all':
      slugs = listAllSlugs();
      break;
    case 'since':
      slugs = filterByDate(listAllSlugs(), cliArgs.since);
      break;
    default:
      throw new Error(`Unknown mode: ${cliArgs.mode as string}`);
  }

  process.stdout.write(`\n🔍 Reviewing ${slugs.length} article(s) with ${model}...\n\n`);

  const reports: QualityReport[] = [];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i] as string;
    process.stdout.write(`  [${i + 1}/${slugs.length}] ${slug}\n`);

    try {
      const report = await reviewArticle(provider, slug, model);
      saveReport(report);
      printReportSummary(report);
      reports.push(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`  ❌ Failed to review ${slug}: ${message}\n`);
    }

    // Rate-limit between articles
    if (i < slugs.length - 1) {
      await delay(DELAY_BETWEEN_ARTICLES_MS);
    }
  }

  printBatchSummary(reports);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `Review script crashed: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exitCode = 1;
});
