# Feature 07b: Content Warning Remediation

## Goal

Eliminate **all** audit warnings — `missing-last-updated`, `stale-code-reference`, `unlisted-inline-citation`, and `uncited-reference` — so `pnpm verify:knowledge` produces a clean 0-warning output. Features 8–12 can then treat any new warning as a real signal.

## Context

After Features 1–7, `pnpm verify:knowledge` reports 304 warnings across 4 codes. The overview planned a content remediation phase between Features 3 and 4. This is that deferred work, done now before Feature 8.

## Scope

### Tier 1: `missing-last-updated` (5 articles) — trivial

Add `lastUpdated: 2026-04-23` to these 5 articles that lack the field:

- `concepts/browser-rendering-pipeline`
- `concepts/event-loop-and-microtasks`
- `concepts/javascript-proxies`
- `concepts/module-systems-and-bundling`
- `concepts/observer-pattern`

### Tier 2: `stale-code-reference` (57 warnings) — trivial

These fire when a source file in `relatedFiles` was modified after the article's `lastUpdated`. The articles aren't actually wrong — the source files were touched by infrastructure features (window manager refactor, audit pipeline changes, etc.).

**Fix:** Bump `lastUpdated` to today's date (`2026-04-23`) on each affected article. The audit rule compares dates, so updating the date clears the warning.

**Articles affected** (deduplicate — one article can have multiple stale refs):
Run `pnpm verify:knowledge 2>&1 | grep stale-code-reference | cut -d' ' -f3 | cut -d: -f1 | sort -u` to get the exact list.

### Tier 3: `unlisted-inline-citation` (97 warnings) — mechanical

These fire when an article body contains an inline `[text](https://...)` link that isn't listed in the `externalReferences` frontmatter array.

**Fix:** For each warning, add the URL to the article's `externalReferences` array with an appropriate `title` and `type`. This is mechanical — the URL and the article are both identified in the warning message.

**Type heuristic:**
- `developer.mozilla.org` → `docs`
- `docs.astro.build`, `docs.solidjs.com`, `vitest.dev`, `playwright.dev`, `biomejs.dev`, `nodejs.org`, `zod.dev`, `vite.dev` → `docs`
- `github.com` → `repo`
- `wikipedia.org` → `article`
- `martinfowler.com`, `dev.to`, `web.dev`, `css-tricks.com` → `article`
- `youtube.com` → `video`
- Blog posts, tutorials → `article`

### Tier 4: `uncited-reference` (145 warnings) — editorial

These fire when an `externalReferences` URL is never linked inline in the article body. Fixing them requires reading the article, finding the paragraph where the source's topic is discussed, and adding an inline `[relevant text](url)` link.

**Fix:** For each warning, read the article body and find the right place to weave in the reference URL as a Markdown inline link. The link text should be natural — describe what the source covers, don't just dump the URL.

**Guidelines:**
- Place the link where the source's specific topic is discussed, not in a random paragraph
- Use descriptive link text: `[SolidJS reactivity guide](url)` not `[link](url)` or `[here](url)`
- If the externalReference genuinely doesn't fit anywhere in the article body (rare), remove it from `externalReferences` instead — a reference that can't be cited inline probably shouldn't be listed
- Don't add filler sentences just to host a link — the text must read naturally

## Approach

Process articles in batches by category to keep changes organized:
1. **First pass:** Tier 1 + Tier 2 — add/bump `lastUpdated` dates (fast, all articles)
2. **Second pass:** Tier 3 — add `externalReferences` entries for unlisted inline citations, one category at a time (architecture → concepts → cs-fundamentals → features → labs → technologies)
3. **Third pass:** Tier 4 — weave uncited references into article bodies, one category at a time (same order)

After each pass, run `pnpm verify:knowledge` to confirm warning count decreases.

## Applicable Skills

- `subagent-driven-development` — Tier 3 and Tier 4 can be parallelized across categories since articles are independent files
- `verification-before-completion` — must see 0 warnings in final output

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/07b-warning-remediation`
2. Fix all four tiers
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Confirm: **zero warnings** in knowledge audit output
5. Commit and stop

## Acceptance Criteria

- [ ] Zero `missing-last-updated` warnings
- [ ] Zero `stale-code-reference` warnings
- [ ] Zero `unlisted-inline-citation` warnings
- [ ] Zero `uncited-reference` warnings
- [ ] `pnpm verify:knowledge` reports **0 issues**
- [ ] `pnpm verify` passes (exit 0)
- [ ] `pnpm build` succeeds
- [ ] All inline link additions read naturally in context — no filler sentences
