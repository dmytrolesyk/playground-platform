# Feature 12a: Project-Lab Schema & Content Architecture

## Goal

Add the `project-lab` content type to the knowledge engine schema, establish the multi-file content architecture, and set up content collection routing.

## Depends On

Features 1-11 (schema, audit pipeline, package extraction all exist).

## Applicable Skills

- `typescript-magician` — Zod schema extension with conditional fields
- `astro` — content collection routing for nested structure
- `test-driven-development` — schema validation tests

## Design

### Schema Changes (in `packages/knowledge-engine/src/schema.ts`)

**1. Add `project-lab` to category enum:**
```typescript
category: z.enum([
  'architecture', 'concept', 'technology', 'feature', 'lab', 'cs-fundamentals',
  'project-lab',  // NEW
]),
```

**2. Add project-lab-specific fields (all optional, enforced by audit rules for `project-lab` category):**

```typescript
// Project-lab index fields (used when category === 'project-lab')
targetRepo: z.string().optional(),
targetDescription: z.string().optional(),
simplificationScope: z.string().optional(),
designRationale: z.string().optional(),       // NEW: why this scope was chosen
totalEstimatedHours: z.number().optional(),
projectLabPhases: z.array(z.object({           // References only, not content
  slug: z.string(),                            // e.g., "labs/tiny-app-phase-01-store"
  order: z.number(),
  title: z.string(),
})).optional(),

// Project-lab phase fields (used on phase files with category 'lab')
parentProjectLab: z.string().optional(),       // slug of the project-lab index
phaseOrder: z.number().optional(),             // explicit ordering within the project-lab
buildObjective: z.string().optional(),         // what the learner builds in this phase
realSystemComparison: z.string().optional(),   // how this maps to the real system
phaseConcepts: z.array(z.string()).optional(), // knowledge graph concept IDs for this phase
```

**Key design decision:** Phase files use `category: lab` (not a new category) with a `parentProjectLab` backlink. This means existing lab infrastructure (routing, rendering) works for phases. The `parentProjectLab` field distinguishes standalone labs from project-lab phases.

**3. Add DO/OBSERVE/EXPLAIN step structure:**

Steps are NOT in frontmatter. They are rendered from the Markdown body using a consistent heading/structure pattern:

```markdown
### Step 1: Create the store file

**DO:** Create `src/store.ts` with a `createStore` function...

**OBSERVE:** Import and call `createStore()` in a test file. Log the returned object...

**EXPLAIN:** The store uses a JavaScript Proxy to intercept property access...

```checkpoint
Run `node src/store.ts` — you should see `{ windows: {}, nextZIndex: 10 }` logged.
```

This keeps steps in the article body (where Markdown excels) rather than cramming them into frontmatter (which would be unwieldy and break the Zod schema with huge nested arrays).

### Content Directory Structure

```
src/content/knowledge/
├── labs/
│   ├── build-an-app-from-scratch.md          # existing standalone lab
│   ├── tiny-app-framework-index.md           # NEW: project-lab index
│   ├── tiny-app-framework-phase-01-store.md  # NEW: phase 1
│   ├── tiny-app-framework-phase-02-registry.md
│   ├── tiny-app-framework-phase-03-windows.md
│   └── tiny-app-framework-phase-04-integration.md
```

**Alternative considered and rejected:** A nested `project-labs/tiny-app-framework/` directory. Rejected because Astro content collections already handle flat directories with slug prefixes, and adding a new top-level content directory would require changes to the collection loader. Flat files with a naming convention (`tiny-app-framework-*`) are simpler and match existing patterns.

### Content Collection Impact

The existing `src/content/knowledge/` collection with `[...slug].astro` routing should handle the new files without changes. The slug for `labs/tiny-app-framework-index.md` becomes `labs/tiny-app-framework-index`, routed to `/learn/labs/tiny-app-framework-index`.

### Frontmatter Examples

**Project-lab index (`tiny-app-framework-index.md`):**
```yaml
---
title: "Project Lab: Build a Tiny App Framework"
category: project-lab
summary: "Understand SolidJS reactivity, the registry pattern, and window management by building a simplified version of this site's desktop framework"
difficulty: intermediate
targetRepo: "This repository (playground-platform)"
targetDescription: "We're building a simplified version of the playground-platform's desktop framework — store, registry, and window manager."
simplificationScope: "SolidJS store + app registry + basic window positioning. No drag, no taskbar, no start menu, no lazy loading."
designRationale: "The store/registry/window-manager triad is the architectural backbone. Understanding these three concepts explains 80% of how the desktop works."
totalEstimatedHours: 5
technologies:
  - solidjs
  - typescript
relatedConcepts:
  - concepts/fine-grained-reactivity
  - architecture/app-registry
  - architecture/window-manager
  - architecture/state-management
prerequisites:
  - architecture/overview
projectLabPhases:
  - slug: "labs/tiny-app-framework-phase-01-store"
    order: 1
    title: "Phase 1: The Reactive Store"
  - slug: "labs/tiny-app-framework-phase-02-registry"
    order: 2
    title: "Phase 2: The App Registry"
  - slug: "labs/tiny-app-framework-phase-03-windows"
    order: 3
    title: "Phase 3: The Window Manager"
  - slug: "labs/tiny-app-framework-phase-04-integration"
    order: 4
    title: "Phase 4: Wiring It All Together"
estimatedMinutes: 300
module: extensibility
moduleOrder: 100
---
```

**Phase file (`tiny-app-framework-phase-01-store.md`):**
```yaml
---
title: "Phase 1: The Reactive Store"
category: lab
summary: "Build a SolidJS store that tracks window state with fine-grained reactivity"
difficulty: intermediate
parentProjectLab: "labs/tiny-app-framework-index"
phaseOrder: 1
buildObjective: "Create a reactive store using SolidJS createStore that manages window state"
realSystemComparison: "In the real system, this is src/components/desktop/store/desktop-store.ts. Our version has the same shape but fewer fields and no actions."
phaseConcepts:
  - concepts/fine-grained-reactivity
  - architecture/state-management
relatedConcepts:
  - concepts/fine-grained-reactivity
  - concepts/javascript-proxies
prerequisites:
  - architecture/state-management
technologies:
  - solidjs
  - typescript
estimatedMinutes: 60
module: extensibility
moduleOrder: 101
---
```

## Files to Modify

- `packages/knowledge-engine/src/schema.ts` — add new fields and category
- `packages/knowledge-engine/src/audit/types.ts` — add new fields to `KnowledgeArticle` interface (`parentProjectLab`, `phaseOrder`, `buildObjective`, `realSystemComparison`, `phaseConcepts`, `targetDescription`, `simplificationScope`, `totalEstimatedHours`, `designRationale`, `projectLabPhases`). Also add 10 new rule IDs to `KnowledgeAuditIssueCode` union type (see 12d spec for the list).
- `src/content.config.ts` — uses `knowledgeSchema` from engine directly, so no changes needed (verify)

## Files to Create

- Schema validation test file (in `packages/knowledge-engine/`)

## Acceptance Criteria

- [ ] `project-lab` added to category enum
- [ ] All project-lab-specific fields parse correctly via Zod
- [ ] `parentProjectLab`, `phaseOrder`, `buildObjective`, `realSystemComparison`, `phaseConcepts` fields added
- [ ] `projectLabPhases` array field on index articles parses correctly
- [ ] `designRationale` field added
- [ ] Schema validation tests pass for valid project-lab frontmatter
- [ ] Schema validation tests pass for valid phase frontmatter with parentProjectLab
- [ ] Schema rejects invalid project-lab frontmatter (missing required conditional fields caught by audit, not schema — schema fields are optional)
- [ ] `pnpm verify` passes
- [ ] `pnpm build` succeeds
