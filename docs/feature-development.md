# Feature Development Process

> How new features are designed, documented, and built in this project.

---

## Overview

Every feature — from a simple game to a complex WebRTC integration — follows the same three-phase process: **Design → Implement → Finalize.** The depth of each phase scales to the feature's complexity, but the structure is always the same.

Each feature gets its own document in `docs/features/<name>.md` and its own branch `feat/<name>`. The feature doc is the single source of truth for that feature's design, implementation plan, and post-completion notes.

---

## Phase 1: Design

### Branch

Create a feature branch before writing anything:

```
git checkout -b feat/<feature-name>
```

### Skills

The design phase requires the following agent skills. Load them before starting:

- **`system-design`** — for architecture analysis, component design, data flow, trade-off analysis
- **`brainstorming`** — for exploring the idea, clarifying requirements, proposing approaches before committing to a design

Additional skills as applicable (e.g., `test-driven-development` for Phase 2, `typescript-magician` for complex types, `web-design-guidelines` for UI-heavy features).

### Feature Document

Create `docs/features/<feature-name>.md`. The document has required sections, but **scale each section to the feature's complexity** — a simple canvas game might be 30 lines total; a WebRTC video chat gets the full treatment.

#### Required Sections

```markdown
# Feature: <Name>

## Status
<!-- One of: Design | In Progress | Complete -->

## Motivation
<!-- What problem does this solve? Why add it? 1-3 sentences is fine for simple features. -->

## Architecture Fit
<!-- Does the current platform support this? What existing patterns does it use?
     What (if anything) needs to change in the platform?
     For simple apps that just registerApp() + lazy(): "Standard registry pattern. No platform changes."
     For complex features: full analysis of what's new. -->

## Technical Design
<!-- Components, data flow, new files, new dependencies.
     Simple feature: a paragraph + file list.
     Complex feature: component diagram, API contracts, state design, data flow. -->

## Registry Integration
<!-- How the app registers. Copy and fill in: -->
registerApp({
  id: '...',
  title: '...',
  icon: '...',
  component: lazy(() => import('./...')),
  desktop: true/false,
  startMenu: true/false,
  startMenuCategory: '...',
  singleton: true/false,
  defaultSize: { width: ..., height: ... },
  resizable: true/false,       // if non-default
  captureKeyboard: true/false, // if non-default
});

## Open Questions
<!-- Anything unresolved. Delete this section if there are none. -->

## Implementation Plan
<!-- Ordered steps. Use checkboxes for tracking.
     Simple feature: 3-5 steps.
     Complex feature: as many as needed, grouped by phase. -->

- [ ] Step 1
- [ ] Step 2
- [ ] ...

## Knowledge Expansion
<!-- What learning content does this feature produce?
     Every feature should expand the knowledge base. Scale to complexity:
     Simple feature: 1 feature article + exercises + architecture explorer update.
     Complex feature: feature article + technology articles + CS fundamentals + lab + new module. -->

### Articles to create:
- [ ] `features/<slug>.md` — (REQUIRED: walkthrough of the most interesting implementation detail)
- [ ] `technologies/<slug>.md` — (one per new technology/library introduced)
- [ ] `concepts/<slug>.md` — (for any new patterns or architectural concepts)
- [ ] `cs-fundamentals/<slug>.md` — (for foundational CS concepts the feature relies on that aren't already covered)
- [ ] `labs/<slug>.md` — (at least one hands-on experiment per medium/complex feature)

### Articles to update:
- [ ] `architecture/overview.md` — (if the feature changes the big picture)
- [ ] (list any other existing articles that need updates)

### Per-article checklist (apply to every new/updated article):
- [ ] `learningObjectives` filled in (2-4 action-verb objectives)
- [ ] `prerequisites` specified (which articles should be read first)
- [ ] `exercises` added (2-4 per article, at least one `predict` or `do` type)
- [ ] `estimatedMinutes` set
- [ ] `module` and `moduleOrder` assigned (new module if needed, or extend existing)
- [ ] Quality standards met (see canonical `docs/features/knowledge-base.md`)

### Architecture explorer updates:
- [ ] Add/update renderer-agnostic graph node(s): ...
- [ ] Add/update graph edge(s): ...
- [ ] Confirm node ids, edge endpoints, `knowledgeSlug`, and `diagramRef` values pass `pnpm verify:knowledge`

### Curriculum:
- [ ] New module defined? (name, objective, article sequence, checkpoint)
- [ ] Or articles added to existing module? (which one, at what position)

### Verification:
- [ ] `pnpm verify:knowledge` passes after knowledge and graph edits
- [ ] `pnpm test:e2e` passes if `/learn`, Library, Architecture Explorer, progress controls, styling, or visual snapshots changed

### Blog entry (optional but encouraged):
- [ ] Draft blog post linking to relevant knowledge articles
```

### Commit the doc before writing code

The design document is the first commit on the feature branch. This forces the thinking to happen before the coding.

```
git add docs/features/<feature-name>.md
git commit -m "docs: add feature design for <feature-name>"
```

---

## Phase 2: Implement

- Follow the implementation plan in the feature doc step by step.
- **Test-driven development** — write the test first, watch it fail, implement, watch it pass. This applies across both test tiers:
  - **vitest** for logic-heavy code (engines, services, API routes, utilities). If it has branching logic and no DOM, write a unit test.
  - **Playwright E2E** for UI/interaction/responsive behavior. If the feature adds a new app, write a smoke test that opens it and asserts on key content. If you’re fixing a UI bug, reproduce it as a failing E2E test first. If the change affects layout or styling, update visual regression snapshots.
  - **Bug fixes always start with a failing test** in the appropriate tier. Fix the bug, watch the test pass. This prevents regressions and documents the bug’s root cause.
  - See `docs/architecture-guidelines.md` §20 (Testing Strategy) for the full decision table on which tier to use.
- Commit incrementally — one commit per logical step, not one giant commit at the end.
- If the design needs to change during implementation, **update the feature doc first**, then continue. The doc stays in sync with reality.

---

## Phase 3: Finalize

Before merging:

1. **Expand the knowledge base** — this is the most important learning step. For each new feature:
   a. Write/update all articles listed in the feature doc's "Knowledge Expansion" section.
   b. Every article must include `learningObjectives`, `prerequisites`, `exercises` (2-4 per article), `estimatedMinutes`, and `module` assignment.
   c. Every exercise must have a thorough answer, not just yes/no. At least one exercise per article must be type `predict` or `do`.
   d. For medium/complex features: write at least one lab (`labs/<name>.md`) with guided hands-on experiments.
   e. For features introducing new technologies: write CS fundamentals articles for any underlying CS concepts not already covered.
   f. Assign articles to curriculum modules — either a new module or extension of an existing one in `src/content/knowledge/modules.ts`.
   g. Update `architecture-data.ts` with renderer-agnostic nodes and edges. Keep node ids stable, edge endpoints valid, and `knowledgeSlug` values pointed at real articles.
   h. Update article `diagramRef` values when the feature changes the Architecture Explorer graph.
   i. Update `architecture/overview.md` if the feature changes the big picture.
   j. **All articles must pass** the quality standards in canonical `docs/features/knowledge-base.md`.
   k. **Research process is mandatory** — read the source code, consult official docs, search the web. Never generate knowledge articles from training data alone.
2. **`pnpm verify:knowledge` passes** — executable audit for article links, prerequisite cycles, module ids, diagram refs, and Architecture Explorer graph integrity.
3. **`pnpm verify` passes** — lint, typecheck, unit tests, and knowledge audit. Non-negotiable.
4. **`pnpm test:e2e` passes** — E2E tests against production build. Required for UI, styling, interaction, `/learn`, Library, Architecture Explorer, and progress behavior changes. If you changed visuals intentionally, run `pnpm test:e2e:update`, inspect the new screenshots, and commit updated snapshots.
5. **Update the feature doc:**
   - Set Status to `Complete`.
   - Check off all implementation plan steps.
   - Add a "Deviations" note if anything was built differently than designed.
6. **Update `docs/architecture-guidelines.md`** — only if the feature introduced new patterns, extension points, or architectural decisions worth recording. Most simple features won't need this. Features that add new shared services, new registry fields, graph contracts, or platform-level behaviors should update §19 or add a new section.
7. **Update `AGENTS.md`** — only if there are new non-discoverable rules that an agent couldn't figure out from reading the code (e.g., "audio service is a singleton — don't create a second AudioContext").
8. **(Optional but encouraged) Draft blog entry** — write a blog post about the feature, linking to relevant knowledge articles.
9. **PR → merge to main.** Squash or merge commit — your preference per feature.

---

## Scaling Guide

| Feature complexity | Doc length | Architecture Fit | Technical Design | Implementation Plan | Knowledge Expansion |
|---|---|---|---|---|---|
| **Simple** (new game, small UI app) | ~30 lines | "Standard registry pattern. No platform changes." | Paragraph + file list | 3-5 steps | 1 feature article + exercises + arch explorer update |
| **Medium** (shared service + UI, e.g., radio + Winamp) | ~100-200 lines | Analysis of what's new (shared service, cross-app state) | Component diagram, data flow, API contracts | 8-15 steps, possibly grouped | Feature + technology articles + 1 lab + exercises + module assignment |
| **Complex** (WebRTC, DOS emulator integration, WASM) | ~300+ lines | Full architectural analysis, new infra needs, risk assessment | Detailed design with diagrams, state machines, error handling | 15+ steps, phased with milestones | Feature + technology + CS fundamentals + concepts + 1-2 labs + exercises + new curriculum module |

---

## Example: Simple Feature (Minesweeper Game)

```markdown
# Feature: Minesweeper

## Status
Complete

## Motivation
Classic Win95 game. Adds to the retro authenticity.

## Architecture Fit
Standard registry pattern. No platform changes.

## Technical Design
- `apps/games/Minesweeper.tsx` — canvas-based game, self-contained
- `apps/games/minesweeper-engine.ts` — pure game logic (testable)

## Registry Integration
registerApp({
  id: 'minesweeper',
  title: 'Minesweeper',
  icon: '/icons/minesweeper_icon.png',
  component: lazy(() => import('./games/Minesweeper')),
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Games',
  singleton: true,
  defaultSize: { width: 220, height: 300 },
});

## Implementation Plan
- [x] Create minesweeper-engine.ts with tests
- [x] Create Minesweeper.tsx component
- [x] Add icon and register in app-manifest.ts
- [x] Manual test, verify pnpm verify passes
```

---

## Where Things Live

```
docs/
├── architecture-guidelines.md   ← platform-level truth (updated rarely)
├── design-system.md             ← visual spec
├── design-tokens.json           ← token values
├── feature-development.md       ← THIS FILE (the process)
└── features/                    ← one doc per feature
    ├── radio-winamp.md
    ├── dosbox-emulator.md
    └── ...
```
