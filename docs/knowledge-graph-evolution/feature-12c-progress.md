# Feature 12c: Project-Lab Progress & Navigation

## Goal

Track per-phase progress within project-labs and provide "continue from where you left off" navigation.

## Depends On

Feature 12a (schema), Feature 12b (rendering).

## Design

### Per-Phase Progress (Free)

Since phase files are regular `lab` category articles with their own slugs, the existing `kb-learning-progress` localStorage system already tracks them individually. Each phase slug (e.g., `labs/tiny-app-framework-phase-01-store`) gets its own `read | checked | practiced | mastered` state.

**No changes needed to `packages/knowledge-engine/src/progress.ts`.**

### Project-Lab Completion Derivation

The project-lab index page needs to display aggregate progress. This is a **client-side presentation concern** — progress lives in localStorage, which isn't available at build time (pages are prerendered). The aggregation logic runs in the existing `LearnLayout.astro` client-side `<script>` section, alongside the existing per-article progress controls.

```typescript
// Runs client-side in LearnLayout.astro <script>, NOT at build time
function getProjectLabProgress(phases: { slug: string }[]): {
  completed: number;
  total: number;
  nextPhaseSlug: string | null;
} {
  const progress = getStoredProgress(); // existing function from learn-progress.ts
  let completed = 0;
  let nextPhaseSlug: string | null = null;

  for (const phase of phases) {
    const state = progress[phase.slug];
    if (state === 'mastered' || state === 'practiced') {
      completed++;
    } else if (nextPhaseSlug === null) {
      nextPhaseSlug = phase.slug;
    }
  }

  return { completed, total: phases.length, nextPhaseSlug };
}
```

The project-lab index page renders a static HTML skeleton at build time (phase list, metadata) with placeholder elements for progress indicators and the "Continue" button. The client-side script hydrates these on page load. This matches the existing pattern: `/learn` pages are fully readable without JavaScript; progress controls are progressive enhancement.
```

### "Continue from Phase N" Button

On the project-lab index page:
- If no phases started → "Start Phase 1" button linking to first phase
- If some phases completed → "Continue: Phase N" button linking to first non-completed phase
- If all phases completed → "Review Phase 1" button + "All phases completed ✅" message

### Phase Navigation on Phase Pages

Each phase page shows:
- Breadcrumb: `Project Lab: Tiny App Framework > Phase 2: The App Registry`
- "← Phase 1: The Reactive Store" / "Phase 3: The Window Manager →" navigation
- Current progress state for this phase (read/checked/practiced/mastered controls)

The prev/next phase slugs come from the `projectLabPhases` array on the parent project-lab index article. The phase page needs to look up its parent and find its siblings.

**Implementation:** At build time, the `[...slug].astro` page can query all articles to find the parent project-lab (via `parentProjectLab` field) and read its `projectLabPhases` array. This is a static build-time query, not a runtime concern.

### Learn Index Page Integration

The `/learn` index page should show project-labs in a dedicated section:

```
📚 Project Labs
┌─────────────────────────────────────────┐
│ 🔨 Build a Tiny App Framework           │
│    4 phases · ~5 hours · 2/4 completed  │
│    [Continue →]                          │
└─────────────────────────────────────────┘
```

Filter project-lab index articles (`category === 'project-lab'`) and render them separately from regular articles.

## Files to Modify

- `src/pages/learn/index.astro` — add project-labs section
- `src/pages/learn/[...slug].astro` — add phase navigation, breadcrumb, continue button

## Acceptance Criteria

- [ ] Per-phase progress tracked independently in localStorage (verified by existing progress system)
- [ ] Project-lab index page shows aggregate progress (N/M phases completed)
- [ ] "Continue" / "Start" button links to correct phase
- [ ] Phase pages show prev/next navigation
- [ ] Phase pages show breadcrumb to parent project-lab
- [ ] Learn index page has a project-labs section
- [ ] All phases completed shows completion message
