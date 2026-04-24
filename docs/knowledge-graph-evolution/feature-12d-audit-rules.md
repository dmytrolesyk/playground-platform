# Feature 12d: Project-Lab Audit Rules

## Goal

Add audit rules specific to project-lab content that validate structural completeness while respecting the reduced audit profile for phase files.

## Depends On

Feature 12a (schema), Feature 4 (package extraction — rules live in `packages/knowledge-engine/`).

## Design

### New Rules

**Error-level (block pipeline):**

| Rule ID | Description | Applies To |
|---------|-------------|------------|
| `project-lab-requires-target` | Project-lab index must have `targetDescription` and `simplificationScope` | `category: project-lab` |
| `project-lab-requires-hours` | Project-lab index must have `totalEstimatedHours` | `category: project-lab` |
| `project-lab-min-phases` | Project-lab index must reference ≥2 phases in `projectLabPhases` | `category: project-lab` |
| `project-lab-phase-structure` | Phase files with `parentProjectLab` must have `buildObjective` and `realSystemComparison` | `category: lab` with `parentProjectLab` |

**Warning-level (report but don't block):**

| Rule ID | Description | Applies To |
|---------|-------------|------------|
| `project-lab-phase-concepts` | Each phase should link to ≥1 concept via `phaseConcepts` | Phase files |
| `project-lab-hours-consistency` | `totalEstimatedHours` should roughly match sum of phase `estimatedMinutes` (±20%) | Project-lab index |
| `project-lab-prerequisites` | Project-lab index should have ≥1 prerequisite | `category: project-lab` |
| `project-lab-phase-ordering` | Phase `phaseOrder` values should be contiguous (1, 2, 3...) | Phase files |
| `project-lab-orphan-phases` | Phase files with `parentProjectLab` should be referenced in the parent's `projectLabPhases` array | Phase files |
| `project-lab-parent-exists` | `parentProjectLab` slug should resolve to an existing article with `category: project-lab` | Phase files |

### Reduced Audit Profile for Phase Files

Phase files (identified by having `parentProjectLab` set) should be **exempt** from the following existing rules:

| Existing Rule | Why Exempt |
|--------------|------------|
| `min-exercises` (2 per non-lab) | Phase steps ARE exercises (DO/OBSERVE/EXPLAIN). Labs already exempt. |
| `inline-citation-density` (≥3 links) | Phase content is imperative instructions, not expository writing |
| `min-word-count` | Phase steps should be concise. Brevity is a feature. |
| `exercise-type-diversity` | Same as min-exercises — the DO steps are the practice |

Phase files still subject to:
- `min-learning-objectives` (at least 1)
- `valid-prerequisites` (if declared, must resolve)
- `valid-related-concepts` (if declared, must resolve)
- `module-assignment` (must have module)

### Implementation

Add rules to `packages/knowledge-engine/src/audit/rules.ts`. Each rule is a function that takes the article (and optionally the full input for cross-referencing) and returns `{ passed: boolean, message?: string }`.

Detection logic for "is this a project-lab phase?":
```typescript
const isProjectLabPhase = (article: KnowledgeArticle) =>
  article.category === 'lab' && article.parentProjectLab != null;

const isProjectLabIndex = (article: KnowledgeArticle) =>
  article.category === 'project-lab';
```

**Cross-referencing rules** (`project-lab-hours-consistency`, `project-lab-orphan-phases`, `project-lab-parent-exists`) need access to the full `KnowledgeAuditInput.articles` array to look up related articles. The existing audit infrastructure already passes the full input to each rule function, so this is supported.

## Files to Modify

- `packages/knowledge-engine/src/audit/rules.ts` — add new rules, add phase exemptions to existing rules
- `packages/knowledge-engine/src/audit/types.ts` — add 10 new `KnowledgeAuditIssueCode` values: `project-lab-requires-target`, `project-lab-requires-hours`, `project-lab-min-phases`, `project-lab-phase-structure`, `project-lab-phase-concepts`, `project-lab-hours-consistency`, `project-lab-prerequisites`, `project-lab-phase-ordering`, `project-lab-orphan-phases`, `project-lab-parent-exists`

## Files to Create

- Test file for new audit rules (in `packages/knowledge-engine/`)

## Acceptance Criteria

- [ ] All 4 error-level rules implemented and tested
- [ ] All 6 warning-level rules implemented and tested
- [ ] Phase files exempt from citation density, word count, exercise count rules
- [ ] Phase files still validated for learning objectives, prerequisites, module
- [ ] `pnpm verify:knowledge` passes with valid project-lab content
- [ ] `pnpm verify:knowledge` fails (error) for project-lab index missing target description
- [ ] `pnpm verify:knowledge` warns for phase without `phaseConcepts`
- [ ] `pnpm verify` passes
