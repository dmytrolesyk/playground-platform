# Feature 2: Graph Statistics Dashboard

## Goal

Add a statistics section to the /learn page that displays knowledge graph health metrics computed from the generated JSON.

## Depends On

Feature 1 (graph extraction — needs `src/data/knowledge-graph.json`)

## Applicable Skills

- `astro` — build-time data loading, static import of JSON in Astro pages
- `web-design-guidelines` — stats layout, accessibility, collapsible panel UX
- `typescript-magician`

## Metrics to Display

- Total nodes and edges, broken down by type
- Articles per category (bar or table)
- Orphan articles: articles with zero incoming edges (not referenced by any other article's `relatedConcepts` or `prerequisites`)
- Longest prerequisite chain (compute by topological sort of prerequisite-type edges)
- Technology coverage: technology nodes that have no corresponding `category: technology` article
- Module sizes: number of articles per module

## Implementation

- Read `src/data/knowledge-graph.json` in `src/pages/learn/index.astro` at build time (static import or Astro's data loading)
- Compute metrics from the graph data using simple TypeScript functions
- Display as a summary section near the top of /learn, below the existing progress summary
- Use simple HTML tables or a grid layout — no new dependencies needed
- The stats section should be collapsible or in an expandable panel so it doesn't overwhelm the main learning UI

## Files to Modify

- `src/pages/learn/index.astro` — add stats section
- Potentially create `src/utils/graph-stats.ts` for computation functions (keeps logic testable)

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/02-stats-dashboard`
2. Implement with tests (unit tests for graph-stats computation functions)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] Stats section renders on /learn page
- [ ] All 6 metric types are displayed
- [ ] Orphan detection is correct (verified against manual check of a few articles)
- [ ] Prerequisite chain length is correct
- [ ] Technology coverage gaps are identified
- [ ] `pnpm verify` still passes
- [ ] Stats update automatically when graph JSON is regenerated
