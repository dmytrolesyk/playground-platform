# Feature 3: Extend Knowledge Audit Pipeline (13 New Rules)

## Goal

Add 13 new audit rules to `scripts/knowledge-audit/rules.ts` following the existing pattern. These enforce content quality, graph health, and structural completeness.

## Depends On

Nothing (independent). Rule #9 (broader-narrower-symmetry) will only activate after Feature 7 adds SKOS fields.

## Applicable Skills

- `typescript-magician` — union type extensions for issue codes, type narrowing in rule functions
- `test-driven-development` — each rule needs at least one unit test (write tests first)
- `subagent-driven-development` — 12 independent rules can be implemented as separate subtasks

## New Issue Codes

Add to `KnowledgeAuditIssueCode` union in `types.ts`:

```typescript
| 'minimum-related-concepts'
| 'minimum-exercises'
| 'required-learning-objectives'
| 'architecture-requires-diagram'
| 'lab-requires-prerequisites'
| 'no-orphan-articles'
| 'technology-coverage'
| 'module-completeness'
| 'broader-narrower-symmetry'
| 'minimum-word-count'
| 'exercise-type-diversity'
| 'external-reference-minimum'
| 'inline-citation-density'
```

## Rules (in priority order)

### Structural completeness

1. **`minimum-related-concepts`** — Every article must have ≥1 `relatedConcept`. Severity: **warning**.
2. **`minimum-exercises`** — Every non-lab article must have ≥2 exercises. Severity: **error**.
3. **`required-learning-objectives`** — Every article must have ≥1 `learningObjective`. Severity: **error**.
4. **`architecture-requires-diagram`** — Articles with `category: architecture` must have a `diagramRef`. Severity: **warning**.
5. **`lab-requires-prerequisites`** — Articles with `category: lab` must have ≥1 `prerequisite`. Severity: **warning**.

### Graph health

6. **`no-orphan-articles`** — Every article must be referenced by at least one other article's `relatedConcepts` or `prerequisites`, OR be assigned to a module. Severity: **warning**.
7. **`technology-coverage`** — Every unique technology tag used across articles should have a corresponding `category: technology` article. Severity: **warning**.
8. **`module-completeness`** — Every curriculum module must have ≥2 articles assigned. Severity: **warning**.
9. **`broader-narrower-symmetry`** — If article A lists B in `broader`, B must list A in `narrower`. Severity: **error**. (Implement the rule but it won't fire until Feature 5 adds the fields.)

### Content quality

10. **`minimum-word-count`** — Enforce per-category minimums from AGENTS.md: architecture: 1500, concepts: 1000, technologies: 800, features: 600, cs-fundamentals: 1000, labs: 800. When Feature 12 adds the `project-lab` category, add project-lab: 800 (same as lab). Severity: **warning**. **Note:** Requires extending `load.ts` to include article body content, not just frontmatter.
11. **`exercise-type-diversity`** — Each article's exercises must include ≥1 `predict` or `do` type (not all `explain`). Severity: **warning**.
12. **`external-reference-minimum`** — Every article needs ≥2 `externalReferences` with ≥2 different types (e.g., one `docs` + one `article`). Severity: **warning**.

13. **`inline-citation-density`** — Article body must contain at least 3 inline hyperlinks to external sources (URLs matching `http://` or `https://`, excluding internal links to other articles). Articles without inline citations are likely AI-generated summaries not grounded in authoritative sources. Severity: **warning**. **Note:** Requires `load.ts` to provide article body content (same as word count rule).

## Implementation Pattern

Each rule follows the existing pattern in `rules.ts`:

```typescript
function auditMinimumExercises(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter(article => article.category !== 'lab')
    .filter(article => (article.exercises?.length ?? 0) < 2)
    .map(article => ({
      severity: 'error',
      code: 'minimum-exercises',
      subject: article.id,
      message: `${article.id} has ${article.exercises?.length ?? 0} exercises (minimum 2 for non-lab articles).`,
    }));
}
```

Wire all new rules into `auditKnowledgeRules()`.

## Files to Modify

- `scripts/knowledge-audit/types.ts` — add new issue codes, extend `KnowledgeArticle` interface if needed
- `scripts/knowledge-audit/rules.ts` — add 12 new rule functions, add to main `auditKnowledgeRules`
- `scripts/knowledge-audit/load.ts` — extend to load article body content (for word count rule)
- `scripts/knowledge-audit/rules.test.ts` — add tests for new rules

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/03-audit-rules`
2. Implement with tests (each rule needs at least one unit test — use `test-driven-development` skill)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Content Remediation Phase (Budget: 2-3 weekends)

When the 13 new rules activate, many existing articles (~40) will fail. This is expected — the articles were written before these rules existed. **Do not skip this phase.** Stale audit failures erode trust in the pipeline.

### Before implementing rules

1. Run a **dry-run scan**: implement the rules, run them against existing content, and count failures per rule. Do NOT fix content yet — just measure the damage.
2. Triage failures into:
   - **Must-fix before Feature 4** (errors: `minimum-exercises`, `required-learning-objectives`)
   - **Fix during remediation weekends** (warnings: word count, external references, inline citations, orphans, technology coverage)

### Remediation process

Fix articles in batches by rule priority:

1. **Weekend 1:** Fix all `error`-severity failures (exercises, learning objectives). These are blocking — they represent real quality gaps. For each article: read the source code, write 2+ exercises (at least 1 predict/do), add learning objectives.
2. **Weekend 2:** Fix `inline-citation-density` and `external-reference-minimum` warnings. For each article: find 3-5 authoritative sources, add inline hyperlinks throughout the text, populate `externalReferences`. This is the most time-consuming fix because the quality philosophy demands real research, not just pasting URLs.
3. **Weekend 3 (if needed):** Fix remaining warnings (word count, diagrams, orphans, technology coverage). Some of these may require creating new stub articles (e.g., missing technology articles).

### Time budget

- **Dry-run + triage:** 2-3 hours (part of Feature 3 implementation)
- **Error fixes:** 1 weekend (~15-20 articles × 30 min average)
- **Citation/reference fixes:** 1 weekend (~30 articles × 30-45 min average)
- **Remaining warnings:** 0.5-1 weekend
- **Total: 2-3 weekends** of content work, budgeted between Feature 3 and Feature 4

This time is NOT optional. The rules exist to enforce quality. Shipping rules without fixing content means the audit pipeline cries wolf on every run.

## Acceptance Criteria

- [ ] All 13 rules implemented and wired into the audit
- [ ] Each rule has at least one unit test
- [ ] `pnpm verify:knowledge` runs with new rules
- [ ] Dry-run scan completed — failure count documented
- [ ] All `error`-severity failures fixed in existing content
- [ ] All `warning`-severity failures either fixed or tracked in a remediation checklist
- [ ] `load.ts` now provides article body text for word count checking
- [ ] `pnpm verify` passes

---

## AGENTS.md Update

Update the "Knowledge base content collection" and audit sections to document the new rules. Agents need to know that `pnpm verify:knowledge` now checks:
- Minimum 2 exercises per non-lab article (error)
- Minimum 1 learning objective per article (error)
- Minimum 1 relatedConcept per article (warning)
- Architecture articles must have diagramRef (warning)
- Labs must have prerequisites (warning)
- Word count minimums per category (warning)
- Exercise type diversity — at least 1 predict or do type (warning)
- Minimum 2 external references with 2+ types (warning)
- Minimum 3 inline citations (external hyperlinks) in article body (warning)

When `verify:knowledge` fails with these codes, the agent must fix the content, not suppress the rule.
