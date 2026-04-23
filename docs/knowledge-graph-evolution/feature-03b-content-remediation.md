# Feature 03b: Content Remediation (Post-Audit Rules)

## Goal

Fix all 66 audit warnings across 43 existing articles so `pnpm verify:knowledge` reports 0 issues. This is a prerequisite for Feature 4 (package extraction) — a noisy audit pipeline erodes trust.

## Depends On

Feature 3 (audit rules) — already merged.

## Context

Feature 3 added 13 new audit rules. The dry-run scan found **0 errors and 66 warnings** across existing content. All warnings must be resolved before Feature 4 begins. This is content work, not infrastructure work.

## Quality Philosophy — READ THIS FIRST

Articles are AI-generated. The #1 risk is fluent text that isn't grounded in anything real. Two structural rules prevent this:

1. **Research before writing.** Before touching any article, find 3-5 authoritative sources (official docs, specs, expert blog posts). Read them. Use them to inform changes. This is NOT optional.
2. **Inline citations at point of use.** Every factual claim gets a hyperlink to its source, right where the claim is made — not just in a references section at the bottom.

**Do NOT** fabricate URLs, guess at documentation content, or paste URLs without verifying they exist and say what you claim. Use web search to find real, current URLs. If a URL returns 404, don't use it.

## Applicable Skills

- `verification-before-completion` — run `pnpm verify:knowledge` after each batch and confirm 0 issues before claiming done
- `systematic-debugging` — if an article still fails after fixes, diagnose why

## Branch

```
git checkout -b remediation/03b-content-fixes
```

## Failure Inventory (66 warnings)

### By rule (what to fix)

| Rule | Count | Articles |
|------|-------|----------|
| `inline-citation-density` | 43 | All 43 articles — every single one needs ≥3 external URLs woven into the body text |
| `minimum-word-count` | 8 | `architecture/app-registry` (1366/1500), `architecture/contact-system` (1216/1500), `architecture/data-flow` (1262/1500), `architecture/state-management` (1350/1500), `concepts/executable-quality-gates` (778/1000), `cs-fundamentals/graph-validation` (874/1000), `features/knowledge-reliability-mastery` (595/600), `labs/repair-a-knowledge-graph` (644/800) |
| `technology-coverage` | 5 | Missing articles: `technologies/biome`, `technologies/node`, `technologies/playwright`, `technologies/typescript`, `technologies/vitest` |
| `external-reference-minimum` | 5 | `architecture/data-flow` (1 type), `concepts/pointer-events-and-capture` (1 type), `features/cv-viewer` (1 type), `features/knowledge-reliability-mastery` (1 type), `labs/trace-a-request` (1 type) |
| `architecture-requires-diagram` | 3 | `architecture/contact-system`, `architecture/data-flow`, `architecture/state-management` |
| `no-orphan-articles` | 2 | `features/terminal`, `technologies/xterm` |

### By article (multi-failure overlap)

These articles have 3-4 failures each — fix them holistically rather than making multiple passes:

| Article | Failures |
|---------|----------|
| `architecture/data-flow` | inline-citation-density, minimum-word-count, external-reference-minimum, architecture-requires-diagram |
| `architecture/contact-system` | inline-citation-density, minimum-word-count, architecture-requires-diagram |
| `architecture/state-management` | inline-citation-density, minimum-word-count, architecture-requires-diagram |
| `features/knowledge-reliability-mastery` | inline-citation-density, minimum-word-count, external-reference-minimum |

## Execution Plan

Work in batches. Run `pnpm verify:knowledge` after each batch to confirm progress.

### Batch 1: Write 5 new technology articles (technology-coverage)

Create these files — they don't exist yet:

- `src/content/knowledge/technologies/biome.md`
- `src/content/knowledge/technologies/node.md`
- `src/content/knowledge/technologies/playwright.md`
- `src/content/knowledge/technologies/typescript.md`
- `src/content/knowledge/technologies/vitest.md`

Each must meet ALL audit rules from day one:
- Category: `technology`
- ≥800 words
- ≥2 exercises (at least 1 predict or do)
- ≥1 learning objective
- ≥2 external references with ≥2 different types
- ≥3 inline citations (external URLs) in body
- ≥1 relatedConcept pointing to an existing article
- Assigned to a module (pick the most relevant existing module)

**Research mandate:** For each technology, read the official documentation and at least 2 other authoritative sources before writing. The article should explain how this technology is used in THIS codebase specifically, grounded in actual source files.

Reference the existing technology articles (`technologies/solidjs.md`, `technologies/astro.md`, etc.) for the expected format and depth.

### Batch 2: Fix multi-failure articles (4 articles)

Fix the 4 articles with 3-4 failures each. For each article:

1. Read the article and its referenced source files
2. Search the web for 3-5 authoritative sources about the concepts covered
3. Add inline hyperlinks throughout the body (≥3 external URLs) — at the point where claims are made
4. Expand the body to meet word count minimum
5. Add diverse external reference types in frontmatter if needed
6. Add `diagramRef` for architecture articles (must point to a valid node ID in `architecture-data.ts`)

Articles and their specific fixes:

**`architecture/data-flow`** (4 fixes):
- Add ≥3 inline citations
- Expand from 1262 → ≥1500 words
- Add a second reference type to `externalReferences` (currently all one type)
- Add `diagramRef` — use `data-flow` node from architecture-data.ts

**`architecture/contact-system`** (3 fixes):
- Add ≥3 inline citations
- Expand from 1216 → ≥1500 words
- Add `diagramRef` — use `api-contact` node from architecture-data.ts

**`architecture/state-management`** (3 fixes):
- Add ≥3 inline citations
- Expand from 1350 → ≥1500 words
- Add `diagramRef` — use `desktop-store` node from architecture-data.ts

**`features/knowledge-reliability-mastery`** (3 fixes):
- Add ≥3 inline citations
- Expand from 595 → ≥600 words (just 5 words short — but add real content, don't pad)
- Add a second reference type to `externalReferences`

### Batch 3: Fix remaining word count failures (4 articles)

- `architecture/app-registry` — expand from 1366 → ≥1500 words + add inline citations
- `concepts/executable-quality-gates` — expand from 778 → ≥1000 words + add inline citations
- `cs-fundamentals/graph-validation` — expand from 874 → ≥1000 words + add inline citations
- `labs/repair-a-knowledge-graph` — expand from 644 → ≥800 words + add inline citations

### Batch 4: Fix remaining external-reference-minimum failures (3 articles)

These need a second reference type added to their `externalReferences` frontmatter:

- `concepts/pointer-events-and-capture` — add inline citations + diversify reference types
- `features/cv-viewer` — add inline citations + diversify reference types
- `labs/trace-a-request` — add inline citations (has 2 already) + diversify reference types

### Batch 5: Fix orphan articles (2 articles)

- `features/terminal` — add to a module (likely `extensibility`) OR add it as a `relatedConcept` in another article
- `technologies/xterm` — add to a module OR reference from another article's `relatedConcepts`

These two are related — the terminal feature uses xterm. Consider cross-referencing them AND referencing them from existing articles like `architecture/overview` or `concepts/lazy-loading-and-code-splitting`.

### Batch 6: Remaining inline-citation-density (30 articles)

After batches 1-5, approximately 30 articles will still need inline citations added. These only have the `inline-citation-density` warning — their word count, exercises, etc. are fine.

For each article:
1. Read the article
2. Identify 3-5 factual claims or technical explanations that should cite a source
3. Search the web for authoritative sources (official docs, MDN, specs, expert posts)
4. Add inline hyperlinks at the point of each claim: `[concept](https://source.url)`
5. Verify the URLs are real and say what you claim

The full list (excluding articles already fixed in batches 1-5):

**Architecture (2):** `architecture/overview` (has 1, needs 2 more), `architecture/window-manager`

**Concepts (10):** `concepts/browser-rendering-pipeline`, `concepts/compositor-pattern`, `concepts/event-loop-and-microtasks` (has 1), `concepts/fine-grained-reactivity`, `concepts/inversion-of-control`, `concepts/islands-architecture`, `concepts/javascript-proxies`, `concepts/lazy-loading-and-code-splitting`, `concepts/module-systems-and-bundling`, `concepts/observer-pattern`, `concepts/progressive-enhancement`, `concepts/signals-vs-vdom`

**CS Fundamentals (6):** `cs-fundamentals/concurrency-models`, `cs-fundamentals/hash-maps-and-lookup`, `cs-fundamentals/memory-management-and-gc`, `cs-fundamentals/networking-fundamentals` (has 2), `cs-fundamentals/trees-and-traversal`, `cs-fundamentals/type-systems`

**Features (3):** `features/crt-monitor-frame`, `features/snake-game`, `features/terminal` (if not fully fixed in batch 5)

**Labs (4):** `labs/break-reactivity`, `labs/build-an-app-from-scratch`, `labs/create-a-memory-leak`, `labs/measure-compositor-performance`

**Technologies (5):** `technologies/98css`, `technologies/astro`, `technologies/resend`, `technologies/solidjs`, `technologies/xterm`

## How to Add Inline Citations

**Wrong way:** Paste random URLs at the end of paragraphs.

**Right way:** Find the claim, find the source, link at the point of assertion.

Before:
```markdown
SolidJS uses fine-grained reactivity to avoid virtual DOM diffing.
```

After:
```markdown
SolidJS uses [fine-grained reactivity](https://www.solidjs.com/guides/reactivity) to avoid
[virtual DOM diffing](https://svelte.dev/blog/virtual-dom-is-pure-overhead), tracking
individual signal dependencies at the expression level.
```

The link supports the claim at the exact point it's made. A reader can click to verify.

## Architecture Diagram Refs

The 3 architecture articles missing `diagramRef` need to point to valid node IDs in `src/components/desktop/apps/architecture-explorer/architecture-data.ts`. Likely mappings:

| Article | Suggested diagramRef |
|---------|---------------------|
| `architecture/contact-system` | `api-contact` |
| `architecture/data-flow` | `data-flow` |
| `architecture/state-management` | `desktop-store` |

Verify these exist in architecture-data.ts before using them.

## Verification

After all batches:

```bash
pnpm verify:knowledge   # must report 0 issues
pnpm verify             # must exit 0
pnpm build              # must succeed
```

## Acceptance Criteria

- [ ] `pnpm verify:knowledge` reports 0 issues (0 errors, 0 warnings)
- [ ] 5 new technology articles created (biome, node, playwright, typescript, vitest)
- [ ] All 43 articles have ≥3 inline citations with real, verified URLs
- [ ] All 8 word count failures resolved
- [ ] All 5 external reference diversity failures resolved
- [ ] All 3 architecture diagramRef failures resolved
- [ ] All 2 orphan article failures resolved
- [ ] No new audit failures introduced
- [ ] `pnpm verify` passes
- [ ] `pnpm build` succeeds

## Session Instructions

> Read `docs/knowledge-graph-evolution/overview.md` for big picture context. The spec for this task is `docs/knowledge-graph-evolution/feature-03b-content-remediation.md`. This is content remediation work — fixing existing articles to pass audit rules added in Feature 3. Skip brainstorming and writing-plans. Work through the batches in order. Use `verification-before-completion` — run `pnpm verify:knowledge` and confirm 0 issues before claiming done.

## Time Budget

- Batch 1 (5 new articles): ~3 hours
- Batch 2 (4 multi-failure articles): ~2 hours
- Batch 3 (4 word count fixes): ~1.5 hours
- Batch 4 (3 reference fixes): ~1 hour
- Batch 5 (2 orphan fixes): ~15 min
- Batch 6 (30 inline citation fixes): ~4-5 hours
- **Total: ~12-14 hours** (2 weekends at a relaxed pace, or 1 intense weekend)

The work is highly parallelizable by batch — batches 1-5 are independent. Batch 6 is also internally parallelizable (each article is independent). If using `subagent-driven-development`, dispatch articles in parallel.
