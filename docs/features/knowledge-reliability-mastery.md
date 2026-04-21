# Feature: Knowledge Reliability & Mastery

## Status
Design

## Motivation

The knowledge base is now large and valuable enough that it needs its own reliability layer. The next step is to make the system trustworthy and active: executable audits should catch broken knowledge graph links, stale source references, weak exercises, and doc drift, while the learner experience should distinguish reading from actual practice and mastery.

## Architecture Fit

This feature extends the existing knowledge system without changing the core desktop architecture.

- **Audit tooling** runs from Node during verification. It reads `src/content/knowledge/**/*.md`, `src/content/knowledge/modules.ts`, and `architecture-data.ts`, then reports actionable failures.
- **Mastery progress** remains local-first. The browser stores progress in `localStorage`; no backend, account system, or database is introduced.
- **Library bridge fixes** stay inside the existing registry/window model by improving singleton prop updates and iframe URL synchronization.
- **Architecture graph stabilization** treats `architecture-data.ts` as a renderer-agnostic knowledge graph. This feature should audit and improve the graph model, not deepen the current hand-drawn SVG renderer or migrate to Cytoscape/LikeC4/ELK yet.
- **E2E tests** restore the missing Playwright tier expected by `AGENTS.md`, using production builds to test `/learn`, Library, Architecture Explorer, and mobile behavior.
- **Docs reconciliation** updates stale feature and architecture docs so agents can trust the documented process.

No new desktop app is required. This is a strengthening pass on the learning system, not a new surface.

## Technical Design

### 1. Knowledge Audit Tool

Create `scripts/audit-knowledge.ts` with small helper modules under `scripts/knowledge-audit/`.

The audit validates:

- frontmatter shape beyond Zod defaults: objective count, exercise count, at least one `predict` or `do`, external reference count, estimated minutes, module assignment
- graph integrity: `relatedConcepts`, `prerequisites`, `module`, and `diagramRef` all resolve
- prerequisite graph is acyclic
- `relatedFiles` exist
- architecture explorer coverage is intentional: every `diagramRef` maps to a node, and every node with `knowledgeSlug` maps to an article
- lab structure includes setup, cleanup, and repeated DO / OBSERVE / EXPLAIN sections
- docs status consistency for knowledge feature docs

The audit should also prepare for a future Architecture Explorer v2 by enforcing a clean graph contract:

- node IDs are stable and unique
- edge endpoints resolve
- node categories and edge types come from documented enums
- `knowledgeSlug` values point to real articles
- article `diagramRef` values point back to real graph nodes
- no renderer-only layout assumptions are required for correctness

Add package scripts:

```json
{
  "verify:knowledge": "node --experimental-strip-types scripts/audit-knowledge.ts",
  "verify": "biome check . && astro check && vitest run --passWithNoTests && pnpm verify:knowledge"
}
```

The audit should produce concise output:

```text
Knowledge audit failed with 3 issues:
- architecture/overview: diagramRef "overview" does not match any architecture node
- labs/break-reactivity: missing Mermaid diagram
- docs/features/knowledge-base-v2.md: status Complete but implementation checklist contains unchecked items
```

### 2. Mastery Progress Model

Replace the current binary `completed` model with staged progress:

```typescript
type MasteryStage = 'read' | 'checked' | 'practiced' | 'mastered';

interface ArticleProgress {
  firstRead: string;
  lastRead: string;
  stage: MasteryStage;
  checkedAt?: string;
  practicedAt?: string;
  masteredAt?: string;
}
```

Migration rule: existing `{ completed: true }` becomes `stage: 'mastered'`; existing unread or incomplete entries become `stage: 'read'`.

Article pages show a progress panel:

- **Read** is automatic on article load.
- **Checked** is available after the learner opens exercise answers or explicitly marks exercises checked.
- **Practiced** is for labs or articles with `do` exercises.
- **Mastered** is a deliberate final checkpoint after exercises/lab work.

The system still cannot know whether the learner truly understood the material. The design goal is honest friction: make mastery a separate intentional action, not a synonym for page view.

### 3. Library Bridge and Navigation

Fix two existing navigation issues:

- `actions.openWindow('library', { initialUrl })` should update the existing singleton Library window's `appProps`, not only focus it.
- `LibraryApp` should react when `initialUrl` changes and navigate its iframe accordingly.
- The iframe should sync same-origin navigation back to the Library toolbar/history when users click links inside `/learn`.

This keeps Architecture Explorer node clicks useful even if the Library is already open.

### 4. Renderer-Agnostic Architecture Graph Constraint

The current Architecture Explorer SVG renderer is useful enough to keep working, but not valuable enough to deepen during this feature. The visual learner goal is real, and a future graph upgrade should be treated as its own feature.

For this feature:

- **Do validate and stabilize** the architecture graph data model.
- **Do add tests/audits** that keep nodes, edges, article links, and diagram refs consistent.
- **Do keep existing Architecture Explorer behavior passing** through e2e smoke coverage.
- **Do not add new custom SVG layout complexity.**
- **Do not migrate to Cytoscape.js, LikeC4, React Flow, Solid Flow, or ELK yet.**

This creates a clean handoff for a future **Architecture Explorer v2** feature, where the data model can feed a professional interactive renderer.

### 5. E2E Testing Expansion

Use the existing Playwright tier under `tests/e2e/`, which already runs against a production build in desktop and mobile viewports:

```json
{
  "test:e2e": "playwright test --config tests/e2e/playwright.config.ts",
  "test:e2e:update": "playwright test --config tests/e2e/playwright.config.ts --update-snapshots all"
}
```

Add focused knowledge-system coverage:

- `/learn` renders curriculum modules, labs, and category browsing
- article progress advances and persists after reload
- Architecture Explorer can open a knowledge article in Library
- Library address/history updates when navigating inside the iframe
- mobile viewport opens/uses `/learn` without iframe window awkwardness

Visual regression should extend the existing snapshot suite with small snapshots for `/learn`, Library, and Architecture Explorer. Keep baselines focused so they catch layout breakage without making normal content edits painful.

### 6. Documentation Reconciliation

Update:

- `docs/features/knowledge-base.md` into the canonical active Knowledge Base system document
- `docs/features/knowledge-base-v2.md` as superseded or archived after still-relevant guidance is merged
- `docs/architecture-guidelines.md` §19 so already-implemented platform improvements are not listed as future work
- `AGENTS.md` and `docs/feature-development.md` if new verification commands or quality gates become non-discoverable
- this feature doc status and checklist as implementation progresses

## Registry Integration

No new registered app is added.

Existing apps affected:

- `library` receives improved singleton navigation behavior.
- `architecture-explorer` benefits from the Library bridge fix.

## Open Questions

- Should knowledge audit failures be fatal inside `pnpm verify` immediately, or should the first implementation include a baseline allowlist for known existing issues?
- Should `test:e2e` include visual snapshots in the first pass, or should smoke tests land first and visual snapshots follow after layout stabilizes?
- Should `mastered` require exercising at least one prompt, or remain a deliberate self-assessment button?

Recommended answers:

- Make the audit fatal, but fix current known issues in the same feature so no allowlist is needed.
- Land smoke tests first, then add a small visual regression set.
- Keep `mastered` deliberate for now; add stricter proof later when exercises become interactive inputs.

## Implementation Plan

- [ ] Create audit helper modules and tests.
- [ ] Add `scripts/audit-knowledge.ts` and `pnpm verify:knowledge`.
- [ ] Fix current audit failures in article metadata, docs, and renderer-agnostic architecture graph data.
- [ ] Upgrade `src/scripts/learn-progress.ts` to staged mastery with migration.
- [ ] Wire staged mastery UI into `/learn/[...slug].astro` and progress summaries into `/learn/index.astro`.
- [ ] Fix singleton `openWindow()` prop updates and Library iframe synchronization.
- [ ] Extend existing Playwright config, helpers, and e2e tests with knowledge-specific coverage.
- [ ] Reconcile knowledge docs and architecture guidelines.
- [ ] Run `pnpm verify`, `pnpm build`, and `pnpm test:e2e`.

## Knowledge Expansion

### Articles to create:

- [ ] `features/knowledge-reliability-mastery.md` - how executable audits and staged progress make the knowledge base trustworthy
- [ ] `concepts/executable-quality-gates.md` - turning documentation standards into automated checks
- [ ] `cs-fundamentals/graph-validation.md` - validating DAGs, link graphs, and cycle detection in this codebase
- [ ] `labs/repair-a-knowledge-graph.md` - break and fix knowledge links, prerequisites, and diagram refs

### Articles to update:

- [ ] `architecture/overview.md` - mention the knowledge audit and mastery layer if it changes the big picture
- [ ] `architecture/data-flow.md` - add audit-time and progress-time data flows
- [ ] `concepts/progressive-enhancement.md` - explain localStorage mastery as progressive enhancement

### Per-article checklist:

- [ ] `learningObjectives` filled in
- [ ] `prerequisites` specified
- [ ] `exercises` added where applicable
- [ ] `estimatedMinutes` set
- [ ] `module` and `moduleOrder` assigned
- [ ] Quality standards met from `docs/features/knowledge-base.md` and `docs/features/knowledge-base-v2.md`

### Architecture explorer updates:

- [ ] Add node for Knowledge Audit
- [ ] Add node for Mastery Progress
- [ ] Add edges from Knowledge Collection to Audit, `/learn/*` to Mastery Progress, and Architecture Explorer to Library
- [ ] Document Architecture Explorer v2 as a future renderer migration that consumes the stabilized graph model

### Curriculum:

- [ ] Add a new module: "Learning System Reliability"
- [ ] Include audit, graph validation, progressive enhancement, and repair lab articles

### Blog entry:

- [ ] Optional public writeup: "Turning an AI-written codebase into a personal engineering curriculum"
