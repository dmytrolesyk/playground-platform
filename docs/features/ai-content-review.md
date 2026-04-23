# Feature: AI-Assisted Content Review CLI

## Status: Complete

## Summary

CLI tool that evaluates knowledge article quality across 5 dimensions using an LLM (Tier B of the three-tier quality pipeline). Feature 3 + 5a provide deterministic checks (Tier A) and human feedback (Tier C); this feature adds model-based evaluation.

## Files Created

- `scripts/review-article.ts` — main CLI entry point
- `scripts/review-article/types.ts` — shared types (report schema, dimensions, CLI args, provider interface)
- `scripts/review-article/prompts.ts` — structured prompts for each quality dimension
- `scripts/review-article/providers.ts` — Anthropic and OpenAI-compatible LLM provider implementations
- `scripts/review-article/review-article.test.ts` — unit tests for prompts and provider factory
- `src/data/quality-reports/.gitkeep` — output directory for JSON quality reports

## Files Modified

- `package.json` — added `review:article` script
- `.gitignore` — added `src/data/quality-reports/*.json`
- `AGENTS.md` — added content quality review section

## Quality Dimensions

1. **Factual Grounding** (30% weight) — does the explanation match the code AND cited sources?
2. **Depth** (25%) — does it explain WHY, not just WHAT?
3. **Coverage** (20%) — does it cover the important aspects?
4. **Exercise Quality** (15%) — do exercises test real understanding?
5. **External Reference Quality** (10%) — are references authoritative and diverse?

## Usage

```bash
# Single article
REVIEW_API_KEY=sk-... pnpm review:article concepts/fine-grained-reactivity

# All articles
REVIEW_API_KEY=sk-... pnpm review:article -- --all

# Articles modified since a date
REVIEW_API_KEY=sk-... pnpm review:article -- --since 2026-04-20
```

## Environment Variables

- `REVIEW_API_KEY` — LLM API key (required)
- `REVIEW_MODEL` — model to use (default: claude-sonnet-4-20250514)
- `REVIEW_PROVIDER` — 'anthropic' or 'openai' (default: anthropic)
- `REVIEW_BASE_URL` — API base URL override

## Design Decisions

- Uses raw `fetch` instead of SDK dependencies to keep the script lightweight
- Prompts request JSON-only responses for reliable parsing
- Rate limiting between articles (2s) and dimensions (1s) to avoid API throttling
- Reports stored as JSON files, gitignored — they're runtime artifacts
- Provider abstraction supports both Anthropic and OpenAI-compatible APIs
