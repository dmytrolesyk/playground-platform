# Feature 4: Extract Knowledge Engine into Workspace Package

## Goal

Extract the reusable parts of the knowledge system into a pnpm workspace package, preparing for eventual extraction into a standalone repo.

## Depends On

Features 1 and 3 (graph extraction + audit rules = core engine to extract).

## Applicable Skills

- `node` — pnpm workspace configuration, package.json exports, module resolution
- `typescript-magician` — type re-exports, ensuring no type leakage from internal modules
- `init` — for the AGENTS.md update (apply discoverability filter: only non-obvious instructions)

## Separation Boundary

### Moves into `packages/knowledge-engine/` (reusable across projects):

- **Schema types** — Zod schemas for knowledge articles (from `content.config.ts` knowledge section)
- **Audit rules** — entire `scripts/knowledge-audit/` directory
- **Graph extraction logic** — from `scripts/build-knowledge-graph.ts`
- **Graph types** — node/edge type definitions
- **Progress model** — from `src/scripts/learn-progress.ts`
- **Module types** — `CurriculumModule` interface from `modules.ts`

### Stays in the main project (project-specific):

- **Content files** — `src/content/knowledge/**/*.md`
- **Astro pages** — `src/pages/learn/`
- **LearnLayout.astro** — presentation layer
- **Desktop integration** — LibraryApp, ArchitectureExplorer
- **architecture-data.ts** — project-specific graph data
- **modules.ts** — project-specific module definitions (uses shared types)
- **Cytoscape.js component** — presentation layer
- **KnowledgeGraph.tsx** — presentation layer

## Package Structure

```
packages/knowledge-engine/
├── src/
│   ├── schema.ts              # Zod schemas extracted from content.config.ts
│   ├── audit/
│   │   ├── rules.ts           # all audit rules
│   │   ├── load.ts            # content loading utilities
│   │   ├── report.ts          # report formatting
│   │   └── types.ts           # audit types
│   ├── graph/
│   │   ├── extract.ts         # graph extraction logic
│   │   └── types.ts           # graph node/edge types
│   └── progress.ts            # mastery progress model
├── package.json
└── tsconfig.json
```

## Package Configuration

```json
// packages/knowledge-engine/package.json
{
  "name": "@playground/knowledge-engine",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./schema": "./src/schema.ts",
    "./audit": "./src/audit/rules.ts",
    "./audit/types": "./src/audit/types.ts",
    "./audit/load": "./src/audit/load.ts",
    "./audit/report": "./src/audit/report.ts",
    "./graph": "./src/graph/extract.ts",
    "./graph/types": "./src/graph/types.ts",
    "./progress": "./src/progress.ts"
  }
}
```

## Workspace Configuration

Update `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

## Import Migration

Replace direct imports in the main project:

```typescript
// Before:
import { auditKnowledgeRules } from './knowledge-audit/rules.ts';
import type { KnowledgeAuditInput } from './knowledge-audit/types.ts';

// After:
import { auditKnowledgeRules } from '@playground/knowledge-engine/audit';
import type { KnowledgeAuditInput } from '@playground/knowledge-engine/audit/types';
```

Similarly for content.config.ts — the Zod schema definition imports from the package:

```typescript
// Before (in content.config.ts):
// schema defined inline

// After:
import { knowledgeSchema } from '@playground/knowledge-engine/schema';

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
  schema: knowledgeSchema,
});
```

## Key Constraint

The package must have **zero Astro dependencies**. It uses only:
- `zod` (for schema validation)
- `yaml` (for frontmatter parsing in load.ts)
- Standard Node.js APIs

This ensures it can be used by: the pet project (Astro), a future standalone app (Astro or anything else), and Python scripts (via the JSON graph output).

## Multi-Project Support

The `conceptScheme` field (added in Feature 7) scopes concepts to a project. The package's schema includes this field by default. A future standalone system would set `conceptScheme: 'other-project'` and could link to playground-platform concepts via `relatedConcepts` with cross-scheme references.

## Files to Create

- `packages/knowledge-engine/package.json`
- `packages/knowledge-engine/tsconfig.json`
- `packages/knowledge-engine/src/schema.ts`
- `packages/knowledge-engine/src/audit/*` (moved from scripts/knowledge-audit/)
- `packages/knowledge-engine/src/graph/*` (extracted from scripts/build-knowledge-graph.ts)
- `packages/knowledge-engine/src/progress.ts` (moved from src/scripts/learn-progress.ts)

## Files to Modify

- `pnpm-workspace.yaml` — add packages directory
- `src/content.config.ts` — import schema from package
- `scripts/audit-knowledge.ts` — import from package
- `scripts/build-knowledge-graph.ts` — import from package (or this becomes a thin wrapper)
- Any other file importing from the moved modules

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/04-package-extraction`
2. Implement — move files, update imports, verify no Astro dependencies in package
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build` (all must pass with new import paths)
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] Package directory exists with correct structure
- [ ] `pnpm install` resolves the workspace package
- [ ] All imports updated to use `@playground/knowledge-engine/*`
- [ ] `pnpm verify` passes (lint, typecheck, unit tests)
- [ ] `pnpm verify:knowledge` passes (audit uses package imports)
- [ ] Build succeeds (`pnpm build`)
- [ ] Graph extraction still works
- [ ] Progress tracking still works
- [ ] Package has zero Astro dependencies
- [ ] E2E tests pass if applicable

---

## AGENTS.md Update

Add to the project structure / imports section:

```markdown
### Knowledge engine package

The reusable knowledge engine lives in `packages/knowledge-engine/`. It contains:
- Schema types (`@playground/knowledge-engine/schema`)
- Audit rules (`@playground/knowledge-engine/audit`)
- Graph extraction (`@playground/knowledge-engine/graph`)
- Progress model (`@playground/knowledge-engine/progress`)

**Import paths:** Always use `@playground/knowledge-engine/*` — never import directly
from `packages/knowledge-engine/src/`. The workspace package resolution handles this.

**Where to make changes:**
- Changing the knowledge article schema (Zod types, adding/removing fields) → edit
  `packages/knowledge-engine/src/schema.ts`
- Adding or modifying audit rules → edit `packages/knowledge-engine/src/audit/rules.ts`
- Changing graph extraction logic or graph types → edit `packages/knowledge-engine/src/graph/`
- Changing progress model → edit `packages/knowledge-engine/src/progress.ts`

**Boundary rule:** The package must have ZERO Astro dependencies. It uses only `zod`,
`yaml`, and standard Node.js APIs. If you need Astro-specific code, put it in the
main project (`src/`), not in the package.

**Content stays in main project:** Article Markdown files (`src/content/knowledge/`),
Astro pages (`src/pages/learn/`), presentation components, and project-specific data
(architecture-data.ts, modules.ts) remain in the main project.
```
