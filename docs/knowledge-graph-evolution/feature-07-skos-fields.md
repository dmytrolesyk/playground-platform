# Feature 7: SKOS Vocabulary Fields

## Goal

Add SKOS-inspired vocabulary management fields to the content schema for synonym discovery, hierarchical concept navigation, and future cross-project concept linking.

## Depends On

Features 3 and 4 (needs the `broader-narrower-symmetry` audit rule from Feature 3, and extends the engine package schema from Feature 4)

## Applicable Skills

- `typescript-magician` — Zod schema extensions, enum types, optional field defaults
- `init` — for the AGENTS.md update (critical relationship type distinction — must be clear and non-redundant)

## Schema Changes

Add to the existing knowledge collection schema in `src/content.config.ts`:

```typescript
// SKOS-inspired vocabulary management (NEW — all optional with defaults)
prefLabel: z.string().optional(),              // canonical display name (defaults to title)
altLabels: z.array(z.string()).default([]),     // synonyms, abbreviations, alternative names
broader: z.array(z.string()).default([]),       // parent concepts (conceptual hierarchy, NOT prerequisite)
narrower: z.array(z.string()).default([]),      // child concepts (conceptual hierarchy)
conceptScheme: z.string().default('playground-platform'), // scopes concepts for multi-project future

// Epistemic metadata (NEW — lightweight trust indicators)
confidence: z.enum(['established', 'probable', 'uncertain', 'speculative']).default('established'),
  // How certain is this article's content? 'established' = well-sourced, widely accepted.
  // 'probable' = good evidence. 'uncertain' = limited evidence. 'speculative' = inferred.
evidenceType: z.enum(['authoritative', 'derived', 'empirical', 'analogical']).optional(),
  // What kind of evidence supports this? 'authoritative' = official docs/specs.
  // 'derived' = synthesized from multiple sources. 'empirical' = tested/measured.
isContested: z.boolean().default(false),
  // True if multiple valid perspectives exist on this topic.
  // When true, article body should present competing views.
```

All existing fields are preserved. All new fields are optional with defaults — zero existing articles break.

## Important Distinction

`broader`/`narrower` is about **conceptual containment** (what concept is this a sub-concept of?).
`prerequisites` is about **learning order** (what must I understand before this?).

Example: "Fine-Grained Reactivity" is **narrower** under "Reactivity" (conceptual hierarchy).
"Fine-Grained Reactivity" has **prerequisite** "Observer Pattern" (learning order).

These are different relationships.

## Example: Before/After

Current `concepts/fine-grained-reactivity.md`:
```yaml
title: "Fine-Grained Reactivity"
category: concept
relatedConcepts:
  - concepts/signals-vs-vdom
  - concepts/observer-pattern
```

After SKOS extension:
```yaml
title: "Fine-Grained Reactivity"
category: concept
prefLabel: "Fine-Grained Reactivity"
altLabels:
  - "reactive programming"
  - "push-based reactivity"
  - "signal-based reactivity"
  - "granular reactivity"
broader: []                    # could point to a future "reactivity" parent concept
narrower: []
relatedConcepts:
  - concepts/signals-vs-vdom
  - concepts/observer-pattern
```

## Content Work

Tag **10-15 existing articles** with `altLabels` and `broader`/`narrower`. Focus on `concepts/` and `technologies/` categories — they benefit most from vocabulary management.

Also set `confidence` on any article where the content is uncertain or contested (most will default to `established`).

## Search Integration

The `altLabels` field exists to power synonym-aware search. When a learner searches for "signals" or "push-based reactivity", they should find "Fine-Grained Reactivity."

**If search already exists** (e.g., Pagefind, Fuse.js): configure it to index `altLabels` alongside `title`. Pagefind supports custom meta attributes; Fuse.js supports searching across multiple keys.

**If search does not yet exist:** defer this to a future search feature, but note that altLabels were designed to feed it. Add a brief note to `/learn` index linking to a future search enhancement.

## Epistemic Metadata

The `confidence`, `evidenceType`, and `isContested` fields add lightweight trust indicators to content. This is the minimal version of the epistemic modeling recommended in the theoretical foundations research.

**UI treatment:** Articles with `confidence: 'uncertain'` or `confidence: 'speculative'` should display a small visual indicator (e.g., a muted banner: "This content has limited supporting evidence" or "This is a contested topic — multiple valid perspectives exist"). Implementation can be as simple as a conditional CSS class in the article template.

**When to use:**
- `established` (default): well-sourced, based on official docs, specifications, or widely accepted practice
- `probable`: good evidence from multiple sources, but not definitive
- `uncertain`: limited evidence, based on a single source, or rapidly evolving
- `speculative`: inferred by analogy, theorized but not verified
- `isContested: true`: when there are legitimately competing approaches or disagreements (e.g., "signals vs VDOM" has two valid camps)

## Audit Pipeline Updates

1. **Activate rule #9** (`broader-narrower-symmetry`) from Feature 3: if A lists B in `broader`, B must list A in `narrower`.
2. **Add `broader`/`narrower` link validation**: targets must exist as article IDs (same pattern as existing `relatedConcepts` validation in `auditRelatedConcepts`).

## Graph Extraction Update

Update `scripts/build-knowledge-graph.ts` (Feature 1) to add two new edge types:
- `broader` — from article `broader` frontmatter
- `narrower` — from article `narrower` frontmatter

## Files to Modify

- `src/content.config.ts` — add SKOS fields to knowledge schema
- 10-15 `src/content/knowledge/**/*.md` files — add altLabels, broader, narrower
- `scripts/knowledge-audit/rules.ts` — add broader/narrower link validation, activate symmetry rule
- `scripts/knowledge-audit/types.ts` — extend KnowledgeArticle if needed
- `scripts/build-knowledge-graph.ts` — add broader/narrower edge types

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/07-skos-fields`
2. Implement with tests (schema validation tests for new fields, symmetry rule tests)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] Schema accepts new SKOS fields (prefLabel, altLabels, broader, narrower, conceptScheme)
- [ ] Schema accepts new epistemic fields (confidence, evidenceType, isContested)
- [ ] All existing articles still validate (all new fields have defaults)
- [ ] 10-15 articles tagged with altLabels and/or broader/narrower
- [ ] Broader/narrower symmetry audit rule works
- [ ] Broader/narrower link validation catches invalid targets
- [ ] Graph JSON includes broader/narrower edges
- [ ] Articles with non-default `confidence` display a visual indicator
- [ ] altLabels are searchable (or deferred with a documented note if search doesn't exist yet)
- [ ] `pnpm verify` and `pnpm verify:knowledge` pass

---

## AGENTS.md Update (Significant)

Add a new section explaining the three relationship types. This is the most important agent instruction update in the entire evolution — if agents confuse these, the graph semantics are corrupted:

```markdown
### Knowledge graph relationship types — CRITICAL DISTINCTION

Three relationship types exist between articles. They mean different things. Do not confuse them:

**`prerequisites`** = learning order. "You must understand A before you can understand B."
- Example: `prerequisites: [architecture/app-registry]` on the IoC article means
  "read the app registry article first."
- This is about the LEARNER's sequence, not conceptual containment.
- Creates directed edges in the learning path DAG. Must not create cycles.

**`broader` / `narrower`** = conceptual hierarchy. "A is a more general concept that contains B."
- Example: "State Management" is `broader` than "Fine-Grained Reactivity."
- This is about CONCEPT CONTAINMENT, not learning order.
- A concept can be narrower than something that is NOT its prerequisite.
- MUST be symmetric: if A lists B in `broader`, B must list A in `narrower`.

**`relatedConcepts`** = associative link. "A and B are related but neither contains the other
and neither is a prerequisite of the other."
- Example: "Observer Pattern" is `relatedConcept` of "Fine-Grained Reactivity" — they're
  related but neither contains the other.
- This is the loosest relationship. Use it when the other two don't apply.

**Decision guide for agents:**
- "Must I understand A before B?" → `prerequisites`
- "Is A a sub-topic of B?" → `broader`/`narrower`
- "Are A and B related but independent?" → `relatedConcepts`

### SKOS vocabulary fields

When creating or updating articles:
- `prefLabel`: Set to the canonical display name. Usually same as `title`.
- `altLabels`: Add 3-5 alternative names, synonyms, abbreviations that a learner
  might search for. Think: "what would someone type if they were looking for this concept
  but didn't know its exact name?"
- `broader`/`narrower`: Only set if there's a clear conceptual hierarchy. Not every
  article needs these. Leaf concepts have `narrower: []`. Top-level concepts have
  `broader: []`.
- `conceptScheme`: Leave as default ('playground-platform') unless working with
  multi-project content.

### Epistemic metadata fields

These fields communicate trust and certainty to the learner. Set them honestly:

- `confidence`: How certain is this article's content? Default is 'established'.
  Set to 'probable' if based on good but not definitive sources, 'uncertain' if
  limited evidence, 'speculative' if inferred. Most articles will be 'established'.
- `evidenceType`: What kind of evidence? 'authoritative' for official docs/specs,
  'derived' for content synthesized from multiple sources, 'empirical' for tested/measured
  claims, 'analogical' for reasoning by analogy. Optional — omit if not relevant.
- `isContested`: Set to true if multiple valid perspectives exist. When true, the article
  body MUST present competing views fairly, not just pick one side.

**Trust principle:** Never claim more confidence than the evidence warrants. An honest
'uncertain' is better than a false 'established'. The system's value comes from epistemic
transparency, not authoritative posturing.
```
