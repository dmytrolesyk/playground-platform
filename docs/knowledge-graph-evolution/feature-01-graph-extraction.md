# Feature 1: Extract Implicit Graph into Explicit JSON

## Goal

Create a build-time TypeScript script that reads all content collections, architecture-data.ts, and modules.ts, and outputs a single queryable `knowledge-graph.json` file. This is the keystone — Features 2, 4, 6, and 8 depend on it.

## Applicable Skills

- `node` — TypeScript script with --experimental-strip-types, yaml parsing, file I/O
- `typescript-magician` — graph node/edge type definitions, Zod schema alignment
- `test-driven-development` — extraction script should have tests (correct node count, edge count, valid JSON)

## Output

- **Script:** `scripts/build-knowledge-graph.ts`
- **Output file:** `src/data/knowledge-graph.json`
- **Run as:** `node --experimental-strip-types scripts/build-knowledge-graph.ts`
- **Add to package.json:** `"prebuild": "node --experimental-strip-types scripts/build-knowledge-graph.ts"`

## Graph Schema

```json
{
  "nodes": [
    {
      "id": "concepts/fine-grained-reactivity",
      "type": "article",
      "label": "Fine-Grained Reactivity",
      "category": "concept",
      "difficulty": "intermediate",
      "module": "reactivity",
      "estimatedMinutes": 20,
      "technologies": ["solidjs"],
      "hasExercises": true,
      "exerciseCount": 3,
      "hasLearningObjectives": true,
      "diagramRef": null
    },
    {
      "id": "tech:solidjs",
      "type": "technology",
      "label": "SolidJS"
    },
    {
      "id": "module:reactivity",
      "type": "module",
      "label": "Why SolidJS?",
      "order": 2
    },
    {
      "id": "arch:content-collections",
      "type": "architecture-node",
      "label": "Content Collections",
      "category": "astro",
      "knowledgeSlug": "architecture/overview"
    }
  ],
  "edges": [
    { "source": "article-id", "target": "article-id", "type": "relatedConcept" },
    { "source": "article-id", "target": "article-id", "type": "prerequisite" },
    { "source": "article-id", "target": "tech:name", "type": "usesTechnology" },
    { "source": "article-id", "target": "module:id", "type": "belongsToModule" },
    { "source": "article-id", "target": "arch:id", "type": "hasDiagramRef" },
    { "source": "arch:id", "target": "arch:id", "type": "data-flow|dependency|renders|lazy-load" }
  ],
  "metadata": {
    "generatedAt": "ISO-date",
    "articleCount": 0,
    "edgeCount": 0,
    "categories": []
  }
}
```

## Node Types

- `article` — from knowledge content collection entries (~40 currently)
- `technology` — synthesized by deduplicating `technologies` arrays across all articles
- `module` — from `src/content/knowledge/modules.ts` (7 currently)
- `architecture-node` — from `architecture-data.ts` NODES array

## Edge Types

- `relatedConcept` — from article `relatedConcepts` frontmatter
- `prerequisite` — from article `prerequisites` frontmatter
- `usesTechnology` — from article `technologies` frontmatter
- `belongsToModule` — from article `module` frontmatter
- `hasDiagramRef` — from article `diagramRef` frontmatter
- Architecture edges (`data-flow`, `dependency`, `renders`, `lazy-load`) — from architecture-data.ts EDGES

## Files to Read

- `src/content.config.ts` — schema definition
- `src/content/knowledge/**/*.md` — all article frontmatter
- `src/content/knowledge/modules.ts` — curriculum modules
- `src/components/desktop/apps/architecture-explorer/architecture-data.ts` — architecture graph
- `scripts/knowledge-audit/load.ts` — reference for how content is already loaded (may reuse logic)

## Key Design Decisions

- **Markdown files remain the source of truth.** The JSON is a derived artifact, regenerated on every build.
- The script parses Markdown frontmatter directly (using the `yaml` package already in devDependencies) rather than depending on Astro's content collection API (which requires the Astro runtime).
- Technology and module nodes are synthesized — they don't exist as explicit files.

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/01-graph-extraction`
2. Implement with tests (unit tests for extraction logic: correct node counts, edge counts, valid JSON output)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] Script runs successfully: `node --experimental-strip-types scripts/build-knowledge-graph.ts`
- [ ] JSON contains all articles as nodes (check count matches number of .md files in knowledge/)
- [ ] JSON contains synthesized technology nodes (deduplicated from all `technologies` arrays)
- [ ] JSON contains all 7 module nodes
- [ ] JSON contains all architecture nodes from architecture-data.ts
- [ ] All frontmatter relationships are represented as edges
- [ ] All architecture edges from architecture-data.ts are included
- [ ] `pnpm verify` still passes
- [ ] JSON is valid (parseable by `JSON.parse`)

---

## AGENTS.md Update

Add to the "Knowledge base content collection" section:

```markdown
### Knowledge graph (generated artifact)
`src/data/knowledge-graph.json` is generated at build time by `scripts/build-knowledge-graph.ts`.
It is a derived artifact — never edit it manually. It is regenerated on every build via the
`prebuild` script. If you change any knowledge article frontmatter, architecture-data.ts, or
modules.ts, the graph JSON updates automatically on next build.
```
