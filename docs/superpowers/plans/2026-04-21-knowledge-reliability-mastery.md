# Knowledge Reliability & Mastery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an executable reliability layer and staged mastery model for the knowledge base, including audits, doc reconciliation, Library bridge fixes, expanded Playwright e2e coverage, and richer learning progress.

**Architecture:** Keep the system static-first and local-first. Audit tooling runs in Node during verification, mastery progress runs in the browser through `localStorage`, and desktop integration is limited to improving existing Library and Architecture Explorer behavior. Architecture graph work must stabilize renderer-agnostic data only; do not deepen the current SVG renderer or migrate to Cytoscape/LikeC4/ELK in this feature.

**Tech Stack:** Astro content collections, SolidJS desktop store, Node 24 native TypeScript stripping, Vitest, Playwright, localStorage, Markdown frontmatter, Mermaid.

---

## File Structure

- Create `scripts/audit-knowledge.ts`: CLI entry point for the knowledge audit.
- Create `scripts/knowledge-audit/types.ts`: shared audit types.
- Create `scripts/knowledge-audit/load.ts`: file discovery and frontmatter loading.
- Create `scripts/knowledge-audit/rules.ts`: pure validation rules.
- Create `scripts/knowledge-audit/report.ts`: readable terminal output.
- Create `scripts/knowledge-audit/rules.test.ts`: unit tests for graph and quality rules.
- Modify `package.json`: add `verify:knowledge` and wire it into `verify`; keep existing `test:e2e` scripts working.
- Modify `src/scripts/learn-progress.ts`: make this the canonical staged mastery module.
- Modify `src/layouts/LearnLayout.astro`: use staged progress behavior instead of binary completed state.
- Modify `src/pages/learn/index.astro`: show read, checked, practiced, and mastered progress.
- Modify `src/pages/learn/[...slug].astro`: render staged mastery controls.
- Modify `src/components/desktop/store/desktop-store.ts`: update singleton app props on repeated open.
- Modify `src/components/desktop/apps/library/LibraryApp.tsx`: react to changing `initialUrl` and sync iframe navigation.
- Modify `src/components/desktop/apps/architecture-explorer/architecture-data.ts`: stabilize graph data and links without adding renderer-specific layout behavior.
- Modify `tests/e2e/playwright.config.ts` if the existing production-build e2e config needs knowledge-specific adjustments.
- Modify `tests/e2e/helpers.ts`: extend shared Playwright helpers where useful.
- Create `tests/e2e/knowledge.spec.ts`: `/learn` and mastery tests.
- Create `tests/e2e/desktop-knowledge.spec.ts`: Library and Architecture Explorer bridge tests.
- Modify `tests/e2e/visual-regression.spec.ts`: extend the existing snapshot set with focused knowledge views.
- Modify during implementation: `docs/features/knowledge-reliability-mastery.md` stays current as the feature-local design/status document.
- Modify after behavior stabilizes: `AGENTS.md`, `docs/feature-development.md`, `docs/features/knowledge-base.md`, `docs/features/knowledge-base-v2.md`, and `docs/architecture-guidelines.md` document the real commands, data model, and future-agent rules. Consolidate knowledge-system guidance into one canonical active doc.

## Task 1: Audit Rule Core

**Files:**
- Create: `scripts/knowledge-audit/types.ts`
- Create: `scripts/knowledge-audit/rules.ts`
- Create: `scripts/knowledge-audit/rules.test.ts`

- [ ] **Step 1: Write failing tests for graph resolution**

Test missing related concepts, missing prerequisites, unknown modules, bad diagram refs, broken edge endpoints, duplicate architecture node IDs, invalid node categories, invalid edge types, and prerequisite cycles.

Run:

```bash
pnpm test scripts/knowledge-audit/rules.test.ts
```

Expected: fail because files/functions do not exist.

- [ ] **Step 2: Implement pure audit types and rule functions**

Rules should accept in-memory article/module/node objects so they are easy to test without reading the filesystem.

- [ ] **Step 3: Run unit tests**

Run:

```bash
pnpm test scripts/knowledge-audit/rules.test.ts
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add scripts/knowledge-audit
git commit -m "test: add knowledge audit rule coverage"
```

## Task 2: Audit CLI and Package Script

**Files:**
- Create: `scripts/audit-knowledge.ts`
- Create: `scripts/knowledge-audit/load.ts`
- Create: `scripts/knowledge-audit/report.ts`
- Modify: `package.json`

- [ ] **Step 1: Add CLI test coverage through existing pure rule tests**

Keep CLI thin. Do not over-test terminal formatting.

- [ ] **Step 2: Implement loader**

Use a structured YAML/frontmatter parser. If adding a package is needed, add a small dev dependency such as `yaml`.

The loader should collect:

- article id from path under `src/content/knowledge`
- raw frontmatter fields
- raw body text
- architecture node ids and `knowledgeSlug` values from `architecture-data.ts`
- architecture edge endpoints, node categories, and edge types from `architecture-data.ts`
- module ids from `src/content/knowledge/modules.ts`

- [ ] **Step 3: Implement CLI report and exit codes**

Exit `0` when no issues exist. Exit `1` when any error exists. Warnings can be printed but should not fail initially unless they represent a documented hard rule.

- [ ] **Step 4: Add package script**

```json
"verify:knowledge": "node --experimental-strip-types scripts/audit-knowledge.ts"
```

Append `&& pnpm verify:knowledge` to `verify`.

- [ ] **Step 5: Run the audit**

Run:

```bash
pnpm verify:knowledge
```

Expected: fail on current known issues.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/audit-knowledge.ts scripts/knowledge-audit
git commit -m "feat: add executable knowledge audit"
```

## Task 3: Fix Current Knowledge Audit Failures and Stabilize Graph Data

**Files:**
- Modify: `src/content/knowledge/**/*.md`
- Modify: `src/components/desktop/apps/architecture-explorer/architecture-data.ts`
- Modify: `docs/features/knowledge-reliability-mastery.md`

- [ ] **Step 1: Run audit and list failures**

Run:

```bash
pnpm verify:knowledge
```

Expected: concrete failures, including stale docs or graph inconsistencies.

- [ ] **Step 2: Fix article metadata and diagram refs**

Make `diagramRef` values match real node ids or add missing nodes where the relationship is meaningful.

- [ ] **Step 3: Fix architecture graph integrity**

Make node IDs stable and unique, ensure every edge endpoint resolves, ensure node categories and edge types come from the documented enums, and ensure every `knowledgeSlug` points to a real article.

- [ ] **Step 4: Avoid renderer-specific expansion**

Do not add new manual SVG layout behavior or visual interactions in this task. The graph data should be clean enough for a future renderer migration, but the existing SVG renderer should only receive fixes needed to keep it working.

- [ ] **Step 5: Fix lab quality gaps**

If the audit requires Mermaid diagrams for labs, add concise Mermaid diagrams to lab bodies. If labs are intentionally exempt, update the audit and docs so the rule is explicit.

- [ ] **Step 6: Record feature-local deviations**

Update `docs/features/knowledge-reliability-mastery.md` with any implementation deviations discovered while fixing audit failures. Do not update repo-wide process docs yet; those should wait until the actual commands and behaviors exist.

- [ ] **Step 7: Run audit again**

Run:

```bash
pnpm verify:knowledge
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add docs/features/knowledge-reliability-mastery.md src/content src/components/desktop/apps/architecture-explorer
git commit -m "fix: stabilize knowledge graph data"
```

## Task 4: Staged Mastery Model

**Files:**
- Modify: `src/scripts/learn-progress.ts`
- Modify: `src/layouts/LearnLayout.astro`
- Modify: `src/pages/learn/index.astro`
- Modify: `src/pages/learn/[...slug].astro`

- [ ] **Step 1: Write tests for progress migration**

Add tests for:

- empty progress
- old `{ completed: true }` becomes `stage: 'mastered'`
- old `{ completed: false }` becomes `stage: 'read'`
- stage advancement never moves backward accidentally

- [ ] **Step 2: Implement staged progress module**

Expose functions:

- `markArticleRead(slug)`
- `markArticleChecked(slug)`
- `markArticlePracticed(slug)`
- `markArticleMastered(slug)`
- `getProgress()`
- `getStage(slug)`
- `getModuleProgress(slugs)`

- [ ] **Step 3: Update LearnLayout client script**

Use the canonical module logic or mirror the same data contract if Astro bundling makes direct import awkward.

- [ ] **Step 4: Update article progress panel**

Render actions for checked, practiced, and mastered states. Keep it progressive-enhancement friendly: article content must remain fully readable without JavaScript.

- [ ] **Step 5: Update index progress summaries**

Show per-module counts by stage, with mastered as the main progress bar and read/checked/practiced as supporting text.

- [ ] **Step 6: Run typecheck and tests**

```bash
pnpm typecheck
pnpm test
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/scripts src/layouts src/pages
git commit -m "feat: add staged knowledge mastery progress"
```

## Task 5: Library Bridge Fix

**Files:**
- Modify: `src/components/desktop/store/desktop-store.ts`
- Modify: `src/components/desktop/apps/library/LibraryApp.tsx`

- [ ] **Step 1: Add unit coverage if store actions are already testable**

If the store is not currently easy to unit-test, add Playwright coverage in Task 6 instead of forcing a large test harness now.

- [ ] **Step 2: Update singleton `openWindow()` behavior**

When an existing singleton app is opened with `extraProps`, merge those props into the existing window's `appProps` before focusing/restoring it.

- [ ] **Step 3: Update `LibraryApp` to react to `initialUrl` changes**

Use a SolidJS effect to navigate when `props.initialUrl` changes.

- [ ] **Step 4: Sync iframe navigation**

On iframe load, read same-origin `contentWindow.location.pathname + search + hash`, update the toolbar address, and push/replace history without duplicating entries.

- [ ] **Step 5: Manual smoke check**

Open Architecture Explorer, click a node, open Library, then click a second node. Expected: existing Library window navigates to the second article.

- [ ] **Step 6: Commit**

```bash
git add src/components/desktop/store/desktop-store.ts src/components/desktop/apps/library/LibraryApp.tsx
git commit -m "fix: keep library singleton navigation in sync"
```

## Task 6: Extend Playwright E2E for Knowledge Reliability

**Files:**
- Modify: `tests/e2e/playwright.config.ts`
- Modify: `tests/e2e/helpers.ts`
- Create: `tests/e2e/knowledge.spec.ts`
- Create: `tests/e2e/desktop-knowledge.spec.ts`
- Modify: `tests/e2e/visual-regression.spec.ts`
- Modify: `package.json` only if the existing e2e scripts are missing or stale

- [ ] **Step 1: Confirm existing Playwright baseline**

Run:

```bash
pnpm test:e2e
```

Expected: the current e2e tier runs from `tests/e2e/playwright.config.ts`. If it fails before this feature's changes, fix or record the pre-existing failure before adding new knowledge-specific tests.

- [ ] **Step 2: Verify e2e scripts and config are aligned**

Confirm `package.json` points `test:e2e` and `test:e2e:update` at `tests/e2e/playwright.config.ts`, and confirm the config still uses:

- desktop Chromium `1280x720`
- mobile Chromium `375x812`
- a production build web server
- the existing visual snapshot expectations

- [ ] **Step 3: Add `/learn` smoke tests**

Test curriculum rendering, article navigation, and staged progress persistence after reload.

- [ ] **Step 4: Add desktop bridge tests**

Test opening Library and Architecture Explorer, then assert the Library address changes after selecting an explorer node.

- [ ] **Step 5: Add focused visual snapshots**

Extend the existing visual regression suite with focused snapshots:

- `/learn`
- one article page
- desktop with Library open
- architecture explorer

- [ ] **Step 6: Run e2e tests**

```bash
pnpm test:e2e
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml tests/e2e
git commit -m "test: restore knowledge e2e coverage"
```

## Task 7: Knowledge Expansion and Repo-Wide Docs Finalization

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/feature-development.md`
- Modify: `docs/features/knowledge-base.md`
- Modify: `docs/features/knowledge-base-v2.md`
- Modify: `docs/architecture-guidelines.md`
- Modify: `docs/features/knowledge-reliability-mastery.md`
- Modify: knowledge articles listed in the feature doc

- [ ] **Step 1: Add or update knowledge expansion articles**

Create/update the articles promised in the feature doc:

- `features/knowledge-reliability-mastery.md`
- `concepts/executable-quality-gates.md`
- `cs-fundamentals/graph-validation.md`
- `labs/repair-a-knowledge-graph.md`

- [ ] **Step 2: Update repo-wide agent/process docs after behavior exists**

Update the canonical docs to describe real implemented behavior, not intentions:

- `AGENTS.md`: add hard rules for `pnpm verify:knowledge`, staged mastery, renderer-agnostic graph data, and e2e expectations for `/learn`/Library/Architecture Explorer changes.
- `docs/feature-development.md`: update Phase 3 and the feature template so future features include audit-passing knowledge expansion, graph integrity updates, mastery/checkpoint expectations, and e2e requirements.
- `docs/features/knowledge-base.md`: make this the canonical active Knowledge Base system document by merging the still-relevant v2 and reliability standards into it.
- `docs/features/knowledge-base-v2.md`: mark as superseded or archive after its active guidance has been merged, so future agents do not treat v1/v2/reliability docs as competing sources of truth.
- `docs/architecture-guidelines.md`: update Architecture Explorer guidance so `architecture-data.ts` is documented as a renderer-agnostic graph contract and Architecture Explorer v2 is the future renderer migration.

- [ ] **Step 3: Run the full verification stack**

```bash
pnpm verify
pnpm build
pnpm test:e2e
```

Expected: all pass.

- [ ] **Step 4: Update feature doc status**

Set `docs/features/knowledge-reliability-mastery.md` to `Complete`, check completed tasks, and add deviations.

- [ ] **Step 5: Commit final docs**

```bash
git add AGENTS.md docs src/content
git commit -m "docs: finalize knowledge reliability mastery feature"
```

## Final Manual Checks

- [ ] Open `/learn` and verify modules show staged progress.
- [ ] Open an article, use progress controls, reload, and verify state persists.
- [ ] Open Architecture Explorer and navigate Library twice from different nodes.
- [ ] Run `pnpm verify:knowledge` and inspect output.
- [ ] Confirm `test-results/` remains ignored or removed from accidental tracking.
