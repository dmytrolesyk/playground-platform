# Feature 5a: Content Quality Pipeline — Automated Checks & Human Feedback

## Goal

Add automated quality checks (Tier A) and a lightweight human feedback mechanism (Tier C) that verify article *content* is grounded, accurate, and current — beyond the structural checks in Feature 3.

**Note:** The AI-assisted review CLI (Tier B) is split into Feature 5b. Ship this first; add AI review when content volume justifies it (~80+ articles).

## Depends On

Feature 4 (package extraction — quality checks extend the engine package)

## Applicable Skills

- `node` — script design, git CLI integration (staleness detection), HTTP requests (link checking)
- `test-driven-development` — Tier A audit rules need unit tests

## Two Tiers (in this feature)

### Tier A: Automatable checks (added to audit pipeline or as fast scripts)

These run deterministically, no AI needed, and can be integrated into `pnpm verify:knowledge` or run as separate scripts.

### Tier B: AI-assisted checks (CLI tool, run on demand)

These use an LLM to evaluate content quality. Run manually per article or in batch. NOT part of the fast audit loop — they're slow and cost tokens.

---

## Tier A: Automatable Checks

### 1. Code reference staleness detection

For every `relatedFiles` entry in an article, check if the referenced file has been modified more recently than the article's `lastUpdated` date.

```bash
# Conceptually:
git log --since="2026-04-20" --oneline -- src/components/desktop/Window.tsx
# If this returns commits → the code changed after the article was last updated → flag
```

Implementation: a new audit rule or standalone script that:
- Reads each article's `relatedFiles` and `lastUpdated`
- Runs `git log` to check for modifications after `lastUpdated`
- Flags stale articles with the specific files that changed

New issue code: `stale-code-reference`
Severity: **warning**
Message: `"concepts/fine-grained-reactivity references src/components/desktop/Window.tsx which was modified on 2026-04-21, after the article's lastUpdated (2026-04-20)."`

**Note:** This requires `lastUpdated` to be set on all articles. Add an audit rule for that too: `missing-last-updated` — every article must have a `lastUpdated` date. Severity: warning.

### 2. External reference liveness

HTTP HEAD request to each `externalReferences[].url` to check if the URL is still alive.

Implementation: a **separate script** (not in the fast audit loop — it's network-dependent and slow):

```bash
node --experimental-strip-types scripts/check-external-links.ts
```

The script:
- Reads all articles' `externalReferences`
- Sends HEAD requests (with timeout, retry, rate limiting)
- Reports dead links (HTTP 404, 410, connection refused)
- Reports redirects (HTTP 301, 302 — may indicate moved content)
- Outputs a report to stdout

New script: `scripts/check-external-links.ts`

Add to package.json: `"check:links": "node --experimental-strip-types scripts/check-external-links.ts"`

Do NOT add to `pnpm verify` — it's slow and requires network access. Run manually or in CI as a scheduled job.

### 3. Code snippet verification

If the article body contains fenced code blocks with file path comments (e.g., `// src/components/desktop/Window.tsx`), extract the snippet and compare against the actual file. Flag if the code in the article doesn't match the code in the repo.

This is harder to implement reliably (code blocks may be simplified examples, not exact copies). A pragmatic version:
- Only check code blocks that start with a comment containing an exact file path
- Extract the function/class name from the block
- Check if that function/class still exists in the referenced file
- Flag if the function signature changed

New issue code: `code-snippet-mismatch`
Severity: **warning**

This is lower priority than staleness detection. Implement if time allows, defer if not.

### 4. Inline citation URL verification

Extract all inline hyperlinks from the article body (Markdown `[text](url)` patterns where URL is external). Cross-reference against `externalReferences` — inline URLs should appear in the references list. Flag any inline URL that's not in `externalReferences` (missing from bibliography) or any `externalReferences` URL that's never cited inline (bibliography padding — listed but never actually used in the text).

New issue code: `uncited-reference` (reference listed but never linked inline) — Severity: warning.
New issue code: `unlisted-inline-citation` (inline link not in references) — Severity: warning.

### 5. Missing `lastUpdated` date

Every article must have a `lastUpdated` frontmatter field. Without it, staleness detection (check #1) can't work.

New issue code: `missing-last-updated`
Severity: **warning**

---

## Tier B: AI-Assisted Quality Checks — See Feature 5b

The AI-assisted review CLI (structured LLM evaluation of articles across 5 quality dimensions) has been split into **Feature 5b** (`feature-05b-ai-review.md`). It depends on this feature and should be implemented when content volume justifies the investment (~80+ articles).

---

## Tier C: Human Feedback Loop

Completes the three-tier quality pipeline from the theoretical foundations research. Lightweight, integrated into the learning experience.

### 1. "Flag for review" button on article pages

Add a small button/link at the bottom of each article page:
- Clicking it writes a JSON file to `src/data/review-flags/{article-slug}.json`
- Contents: `{ "articleId": "...", "flaggedAt": "ISO-date", "reason": "optional free text" }`
- The stats dashboard (Feature 2) shows a "Flagged for review" count
- `pnpm verify:knowledge` reports flagged articles as informational (not errors)

### 2. "Was this helpful?" feedback (optional)

Optional thumbs-up/down on each article, stored in localStorage alongside mastery progress. Aggregated into the stats dashboard. Not critical for MVP but closes the feedback loop.

### 3. Correction pipeline

When a flagged article is revised:
- Re-run `scripts/review-article.ts` on the revised article
- Remove the flag file if the review passes
- Update `lastUpdated` in frontmatter

This is a manual workflow, not automated — but having the flag files ensures flagged articles don't get lost.

### Files for Tier C

- `src/data/review-flags/` — directory for flag JSON files
- Small UI addition to article pages (button + localStorage handler)
- Stats dashboard integration (Feature 2)

### Acceptance Criteria (Tier C)

- [ ] "Flag for review" button appears on article pages
- [ ] Clicking it creates a flag JSON file
- [ ] Stats dashboard shows flagged article count
- [ ] Flagged articles are visible in `pnpm verify:knowledge` output (informational)

---

## Files to Create

- `scripts/check-external-links.ts` — URL liveness checker
- `src/data/review-flags/` — directory for flag JSON files

## Files to Modify

- `scripts/knowledge-audit/rules.ts` — add `stale-code-reference` and `missing-last-updated` rules
- `scripts/knowledge-audit/types.ts` — add new issue codes
- `scripts/knowledge-audit/load.ts` — may need to access git history for staleness check
- `package.json` — add `check:links` script
- Article page template — add "Flag for review" button

## New Issue Codes (for Tier A)

```typescript
| 'stale-code-reference'
| 'missing-last-updated'
| 'code-snippet-mismatch'   // lower priority
| 'dead-external-link'      // reported by separate script, not audit
| 'uncited-reference'       // reference in frontmatter but never linked inline
| 'unlisted-inline-citation' // inline link not in externalReferences
```

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/05a-content-quality-pipeline`
2. Implement with tests (Tier A audit rules need unit tests; Tier C needs basic manual verification)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Check all acceptance criteria below (Tier A and Tier C separately)
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

### Tier A (automatable)
- [ ] `stale-code-reference` rule detects articles whose referenced files changed after `lastUpdated`
- [ ] `missing-last-updated` rule flags articles without the field
- [ ] `check-external-links.ts` script checks all URLs and reports dead links
- [ ] `uncited-reference` and `unlisted-inline-citation` rules work
- [ ] `pnpm verify:knowledge` passes with new rules

### Tier C (human feedback)
- [ ] "Flag for review" button appears on article pages
- [ ] Clicking it creates a flag JSON file
- [ ] Stats dashboard shows flagged article count
- [ ] Flagged articles are visible in `pnpm verify:knowledge` output (informational)

---

## AGENTS.md Update

Add a new section:

```markdown
### Research mandate for article creation

Before writing or significantly updating any knowledge article:
1. Read the actual source files listed in `relatedFiles` (existing rule)
2. Find 3-5 authoritative external sources about the concepts the article covers:
   official docs, specs, RFCs, content by recognized experts, well-known technical
   blog posts. NOT random Medium articles or AI-generated content.
3. Read the sources. Use them to inform the writing — they shape accuracy and depth.
4. Cite sources inline throughout the article text as Markdown hyperlinks at the
   point where the source's information is used. Example:
   "The event loop [processes microtasks before macrotasks](https://developer.mozilla.org/...)."
5. Collect all cited sources in the `externalReferences` frontmatter section.

Every major factual claim, concept explanation, or technical assertion must have an
inline hyperlink to its source. Not every sentence — but every paragraph that introduces
a new concept or makes a non-obvious claim.

Articles without inline citations will fail the `inline-citation-density` audit rule.

### Content staleness detection

The audit pipeline checks if source files referenced by an article have been modified
after the article's `lastUpdated` date. When `verify:knowledge` reports
`stale-code-reference`, update the article to reflect code changes.

Always set `lastUpdated` to today's date when modifying an article.

### Content quality review (Feature 5b)

When Feature 5b ships, an AI-assisted review tool will be available:
`node --experimental-strip-types scripts/review-article.ts {article-slug}`
Until then, rely on the audit pipeline and human review via the "Flag for review" button.
```
