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
- **Test-driven development:** write the test first, watch it fail, implement, watch it pass. This applies to logic-heavy code (engines, services, API routes). Pure UI components that are hard to unit-test get manual verification instead.
- Commit incrementally — one commit per logical step, not one giant commit at the end.
- If the design needs to change during implementation, **update the feature doc first**, then continue. The doc stays in sync with reality.

---

## Phase 3: Finalize

Before merging:

1. **`pnpm verify` passes** — lint, typecheck, tests. Non-negotiable.
2. **Update the feature doc:**
   - Set Status to `Complete`.
   - Check off all implementation plan steps.
   - Add a "Deviations" note if anything was built differently than designed.
3. **Update `docs/architecture-guidelines.md`** — only if the feature introduced new patterns, extension points, or architectural decisions worth recording. Most simple features won't need this. Features that add new shared services, new registry fields, or new platform-level behaviors should update §19 (Experimentation Platform Analysis) or add a new section.
4. **Update `AGENTS.md`** — only if there are new non-discoverable rules that an agent couldn't figure out from reading the code (e.g., "audio service is a singleton — don't create a second AudioContext").
5. **PR → merge to main.** Squash or merge commit — your preference per feature.

---

## Scaling Guide

| Feature complexity | Doc length | Architecture Fit | Technical Design | Implementation Plan |
|---|---|---|---|---|
| **Simple** (new game, small UI app) | ~30 lines | "Standard registry pattern. No platform changes." | Paragraph + file list | 3-5 steps |
| **Medium** (shared service + UI, e.g., radio + Winamp) | ~100-200 lines | Analysis of what's new (shared service, cross-app state) | Component diagram, data flow, API contracts | 8-15 steps, possibly grouped |
| **Complex** (WebRTC, DOS emulator integration) | ~300+ lines | Full architectural analysis, new infra needs, risk assessment | Detailed design with diagrams, state machines, error handling | 15+ steps, phased with milestones |

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
