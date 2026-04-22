# Feature 10: D2 Diagrams + Generated Diagrams from Graph Data

## Goal

Add D2 as a diagram tool for standalone architectural diagrams, and auto-generate diagrams from the knowledge graph data at build time.

## Depends On

Feature 1 (needs `src/data/knowledge-graph.json` for generated diagrams). Presentation layer — stays outside the engine package.

## Applicable Skills

- `node` — D2 build script, diagram generation script, shell integration

## Part A: D2 Setup

### Installation

```bash
brew install d2   # macOS
# or: curl -fsSL https://d2lang.com/install.sh | sh
```

### Directory Structure

```
diagrams/
├── src/                    # D2 source files
│   ├── architecture-overview.d2
│   └── module-structure.d2
└── build.sh                # compiles .d2 → .svg
```

### Build Script

```bash
#!/bin/bash
# diagrams/build.sh
mkdir -p public/diagrams
for f in diagrams/src/*.d2; do
  d2 "$f" "public/diagrams/$(basename "$f" .d2).svg"
done
```

Add to package.json: `"build:diagrams": "bash diagrams/build.sh"`

### Create 2-3 D2 Diagrams

D2 is better than Mermaid for architectural diagrams because of native nested containers. Create diagrams for:
- Architecture overview (layers: Astro → SolidJS → Desktop → Apps)
- Module prerequisite structure (which modules depend on which)

Keep Mermaid as the primary inline diagram tool in articles. D2 is for standalone architectural diagrams only.

## Part B: Auto-Generated Diagrams

### Generation Script

Add to `scripts/build-knowledge-graph.ts` (or create `scripts/generate-diagrams.ts`):

Generate Mermaid source files from the knowledge graph:

1. **Module prerequisite diagram** — flowchart showing module dependency ordering
2. **Per-module article DAG** — for each module, show its articles in prerequisite order
3. **Technology usage map** — which technologies connect to which articles

Write output to `src/data/generated-diagrams/`:
```
src/data/generated-diagrams/
├── module-prerequisites.mmd
├── module-foundation-articles.mmd
├── module-reactivity-articles.mmd
└── technology-usage.mmd
```

### Include in Pages

Generated Mermaid files can be imported and rendered in Astro pages at build time, or embedded in the stats dashboard.

## Part C: Diagram References in Schema (Optional)

Extend frontmatter schema to support multiple diagram references:

```yaml
diagrams:
  - type: architecture     # link to Architecture Explorer node
    ref: "content-collections"
  - type: generated        # auto-generated from graph
    file: "generated-diagrams/reactivity-prereqs.mmd"
  - type: inline           # Mermaid in article body (existing, no change)
```

This is optional — the existing `diagramRef` field can coexist with the new approach.

## Coexistence Strategy

- **Mermaid**: primary inline diagram tool in article bodies (keep as-is)
- **D2**: standalone architectural diagrams (new, for precise layout)
- **Cytoscape.js**: interactive knowledge graph (Feature 4)
- **Generated Mermaid**: auto-generated from graph data (new, always fresh)

## Files to Create

- `diagrams/src/*.d2` — 2-3 D2 source files
- `diagrams/build.sh` — D2 compilation script
- `src/data/generated-diagrams/*.mmd` — auto-generated Mermaid files
- Potentially `scripts/generate-diagrams.ts`

## Files to Modify

- `package.json` — add `build:diagrams` script
- `scripts/build-knowledge-graph.ts` — add diagram generation (or separate script)
- `.gitignore` — decide whether generated diagrams are committed or gitignored

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/10-diagrams`
2. Implement with tests (D2 compiles without errors, generated Mermaid is valid)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build` + `pnpm build:diagrams`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] D2 installed and working: `d2 --version`
- [ ] 2-3 D2 diagrams compile to SVG in `public/diagrams/`
- [ ] Generated Mermaid files are produced from graph data
- [ ] Module prerequisite diagram is correct
- [ ] Generated diagrams are accessible from /learn pages
- [ ] Existing Mermaid diagrams in articles unaffected
- [ ] `pnpm verify` passes

---

## AGENTS.md Update

Add to documentation section:

```markdown
### Diagram tool selection

- **Mermaid** (default): Use for inline diagrams in article bodies. Flowcharts, sequence
  diagrams, state diagrams, simple class diagrams. Rendered client-side, zero build deps.
- **D2**: Use for standalone architectural diagrams that need precise layout and nested
  containers. Files live in `diagrams/src/`, compiled to SVG by `pnpm build:diagrams`.
- **Cytoscape.js**: The interactive knowledge graph at /learn/graph. Not used in articles.
- **Generated diagrams**: Auto-generated from knowledge-graph.json at build time. Found in
  `src/data/generated-diagrams/`. Never edit manually — they're regenerated on build.

When creating articles: use Mermaid for inline diagrams. Do not create D2 diagrams
unless building standalone architectural visualizations.
```
