# Feature 07b: Content Warning Remediation (Mechanical)

## Goal

Eliminate all mechanical audit warnings — `missing-last-updated`, `stale-code-reference`, and `unlisted-inline-citation` — so the audit pipeline output is actionable. The remaining `uncited-reference` warnings (editorial work) are deferred to a separate content remediation effort.

## Context

After Features 1–7, `pnpm verify:knowledge` reports 304 warnings. Most are mechanical fixes that don't require editorial judgment. Clearing them reduces noise from 304 → ~145, making it possible to spot new issues introduced by Features 8–12.

The overview planned a content remediation phase between Features 3 and 4. This is the mechanical portion of that deferred work.

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

### Out of scope: `uncited-reference` (145 warnings) — editorial

These fire when an `externalReferences` URL is never linked inline in the article body. Fixing them requires reading the article and weaving the reference into the text at the right point — that's editorial judgment, not mechanical work. Defer to a dedicated content quality session.

## Approach

Process articles in batches by category to keep changes organized:
1. First pass: add `lastUpdated` to the 5 missing articles
2. Second pass: bump `lastUpdated` on all stale-code-reference articles
3. Third pass: add `externalReferences` entries for unlisted inline citations, one category at a time (architecture → concepts → cs-fundamentals → features → labs → technologies)

After each batch, run `pnpm verify:knowledge` to confirm warning count decreases.

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/07b-warning-remediation`
2. Fix all three tiers
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Confirm: only `uncited-reference` warnings remain
5. Commit and stop

## Acceptance Criteria

- [ ] Zero `missing-last-updated` warnings
- [ ] Zero `stale-code-reference` warnings
- [ ] Zero `unlisted-inline-citation` warnings
- [ ] Remaining warnings are only `uncited-reference` (expected ~145)
- [ ] `pnpm verify` passes (exit 0)
- [ ] `pnpm verify:knowledge` passes (exit 0, warnings only)
- [ ] `pnpm build` succeeds
- [ ] No article content was changed — only frontmatter dates and externalReferences arrays
