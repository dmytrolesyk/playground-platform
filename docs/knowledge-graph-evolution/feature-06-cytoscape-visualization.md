# Feature 6: Cytoscape.js Full Knowledge Graph Visualization

## Goal

Create an interactive visualization of the FULL knowledge graph — all articles, technologies, modules, and their relationships — using Cytoscape.js with the fcose layout algorithm.

## Depends On

Features 1 and 4 (needs `src/data/knowledge-graph.json` and consumes the engine package from outside)

## Applicable Skills

- `astro` — Astro page setup, Solid.js island with client:load, build-time data passing
- `web-design-guidelines` — interactive visualization accessibility, keyboard navigation, color contrast for node categories

## Deliverables

- **New page:** `src/pages/learn/graph.astro`
- **New component:** `src/components/learn/KnowledgeGraph.tsx` (Solid.js island)
- **New dependencies:** `cytoscape`, `cytoscape-fcose`
- **Optional dependencies (can defer):** `cytoscape-popper` + `@tippyjs/react` for tooltips, `cytoscape-navigator` for minimap, `cytoscape-expand-collapse` for compound nodes

## Layout Algorithm

Use **fcose** (fast Compound Spring Embedder):
- Force-directed layout with high-quality results
- Supports compound nodes (for grouping articles by module)
- Supports constraints (prerequisite chains can flow top-to-bottom)
- First-party Cytoscape.js extension, actively maintained

Install: `pnpm add cytoscape cytoscape-fcose`

## Node Styling

| Node Type | Shape | Color Scheme |
|-----------|-------|-------------|
| Article (architecture) | Round rectangle | Blue |
| Article (concept) | Round rectangle | Purple |
| Article (technology) | Round rectangle | Green |
| Article (feature) | Round rectangle | Orange |
| Article (cs-fundamentals) | Round rectangle | Teal |
| Article (lab) | Round rectangle | Red |
| Technology | Diamond | Green (darker) |
| Module | Compound/parent node | Light gray background |

## Edge Styling

| Edge Type | Style | Weight |
|-----------|-------|--------|
| `prerequisite` | Solid directed arrow | Prominent (2px) |
| `relatedConcept` | Dashed line | Medium (1px) |
| `usesTechnology` | Thin dotted line | Subtle (0.5px) |
| `belongsToModule` | Implicit via compound node containment | N/A |

## Interactions

- **Click node** → navigate to `/learn/{article-slug}` (for article nodes)
- **Hover node** → show article summary (tooltip)
- **Filter controls** — toggle visibility by: category, module, difficulty, edge type
- **Mastery coloring** — read localStorage progress, color node borders by mastery stage: unread = gray, read = blue, checked = yellow, practiced = orange, mastered = green. This is the "X-ray view" of learning progress — essential for a visual learner to see what they know and what they don't.

## Data Source

Read `src/data/knowledge-graph.json` (from Feature 1). Transform to Cytoscape.js elements format:

```typescript
// Cytoscape.js expects this format:
const elements = {
  nodes: graphData.nodes.map(n => ({
    data: { id: n.id, label: n.label, ...n },
    // For compound nodes, articles set parent to their module:
    ...(n.module ? { data: { ...n, parent: `module:${n.module}` } } : {})
  })),
  edges: graphData.edges.map(e => ({
    data: { source: e.source, target: e.target, type: e.type }
  }))
};
```

## Relationship to Architecture Explorer

**Keep both.** The Architecture Explorer is a handcrafted, precisely positioned architecture view. The Cytoscape.js graph is the auto-laid-out full knowledge graph view. They serve different purposes. Optionally, architecture nodes in the Cytoscape graph with a `knowledgeSlug` can link to the corresponding article.

## Page Structure

```astro
<!-- src/pages/learn/graph.astro -->
<LearnLayout title="Knowledge Graph">
  <div class="graph-controls">
    <!-- Filter toggles for category, edge type -->
  </div>
  <KnowledgeGraph client:load graphData={graphJson} />
</LearnLayout>
```

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/06-cytoscape-visualization`
2. Implement with tests (at minimum: build succeeds, graph data transforms correctly)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Testability (for Feature 6b E2E tests)

The component needs to expose hooks for Playwright testing:

1. `data-cy="knowledge-graph"` attribute on the container div
2. `window.__cyGraph` — expose the Cytoscape instance on window in dev/test builds so E2E tests can query graph state (node count, visibility, selected node)
3. Accessible node labels — article nodes should be queryable by label text

## Acceptance Criteria

- [ ] Graph renders with all nodes from knowledge-graph.json
- [ ] Nodes are colored by category
- [ ] Edges are styled by type (prerequisite vs. related vs. technology)
- [ ] Clicking an article node navigates to its /learn page
- [ ] Filter controls toggle node/edge visibility by category
- [ ] Layout is readable (no overlapping nodes, clusters visible)
- [ ] Module compound nodes group their member articles
- [ ] Page is linked from /learn index (sidebar or top nav)
- [ ] Node borders colored by mastery stage (unread/read/checked/practiced/mastered) from localStorage progress data
- [ ] `pnpm verify` passes
