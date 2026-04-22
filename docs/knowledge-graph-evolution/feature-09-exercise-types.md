# Feature 9a: Static Exercise Types (arrange, compare, trace)

## Goal

Add three new static exercise types (arrange, compare, trace) and an optional `targetConcepts` field for linking exercises to specific concepts.

**Note:** The interactive `code` exercise type with CodeMirror is split into Feature 9b. Ship the static types first — they deliver most of the pedagogical value with minimal complexity.

## Depends On

Feature 4 (extends the engine package schema)

## Applicable Skills

- `typescript-magician` — discriminated union types for exercise schema (type-specific optional fields)
- `astro` — rendering new exercise types in Astro templates
- `web-design-guidelines` — exercise UI accessibility, side-by-side compare layout

## Schema Changes

Update the exercises array schema in `src/content.config.ts`:

```typescript
exercises: z.array(z.object({
  question: z.string(),
  hint: z.string().optional(),
  answer: z.string(),
  type: z.enum([
    'predict', 'explain', 'do', 'debug',   // existing
    'arrange', 'compare', 'trace',           // NEW
  ]).default('explain'),
  // NEW optional fields for specific exercise types:
  fragments: z.array(z.string()).optional(),     // for 'arrange' (Parsons problems)
  correctOrder: z.array(z.number()).optional(),  // for 'arrange'
  approachA: z.string().optional(),              // for 'compare'
  approachB: z.string().optional(),              // for 'compare'
  steps: z.array(z.object({                      // for 'trace'
    description: z.string(),
    expectedState: z.string(),
  })).optional(),
  targetConcepts: z.array(z.string()).optional(), // links exercise to concept IDs
  // NOTE: targetConcepts data will be used in future features for:
  // (a) exercise-based mastery assessment (not just self-reported progress)
  // (b) concept-specific exercise recommendations ("practice these weak concepts")
  // For now, just populate the field — the system logic comes later.
})).default([]),
```

**Note:** The `code` exercise type (with `starterCode`, `solution`, `testCases`, `language` fields) and CodeMirror integration are in Feature 9b.

## New Exercise Types

### `arrange` (Parsons Problems)

Present code fragments in scrambled order. Learner mentally arranges them into the correct sequence. Tests procedural understanding.

```yaml
exercises:
  - question: "Arrange these steps in the correct order for the Astro build pipeline:"
    type: arrange
    fragments:
      - "Astro reads content collections"
      - "Zod validates frontmatter"
      - "Markdown is compiled to HTML"
      - "Static pages are written to dist/"
      - "Content is available via getCollection()"
    correctOrder: [0, 1, 4, 2, 3]
    answer: "The pipeline flows: read → validate → expose via API → compile → output. Validation happens before the content API is available, which means invalid content fails fast at build time."
```

For MVP rendering: show the fragments as a numbered list in shuffled order. Ask the learner to state the correct order. Show the answer with explanation. No drag-and-drop needed.

### `compare`

Present two approaches and ask learner to analyze tradeoffs.

```yaml
exercises:
  - question: "Compare these two state management approaches for the window manager:"
    type: compare
    approachA: |
      // Approach A: Individual signals per window property
      const [x, setX] = createSignal(0);
      const [y, setY] = createSignal(0);
      const [width, setWidth] = createSignal(400);
    approachB: |
      // Approach B: Single store with nested state
      const [state, setState] = createStore({
        windows: { 'win-1': { x: 0, y: 0, width: 400 } }
      });
    answer: "Approach A gives maximum granularity — changing x doesn't trigger y subscribers. But it doesn't scale: 10 windows × 6 properties = 60 signals to manage. Approach B (the actual implementation) uses a store that provides path-based granular subscriptions while keeping state organized. The tradeoff: slightly more complex subscription paths, but much better organization."
```

### `trace`

Step-by-step execution tracing with expected state at each step.

```yaml
exercises:
  - question: "Trace what happens when setCount(5) is called in this SolidJS code:"
    type: trace
    hint: "Remember: SolidJS component functions run once. Only the bound expressions update."
    steps:
      - description: "setCount(5) is called"
        expectedState: "count signal internal value changes from 0 to 5"
      - description: "SolidJS checks subscribers of count"
        expectedState: "One subscriber found: the JSX expression {count()} in the <span>"
      - description: "The subscriber effect re-runs"
        expectedState: "Only the <span> text node updates to '5'. Component function does NOT re-run."
    answer: "The key insight: only the specific DOM node bound to count() updates. No virtual DOM diff, no component re-render, no parent notification. This is fine-grained reactivity."
```

## Interactive Exercise Component (CodeMirror 6) — See Feature 9b

The interactive `code` exercise type with CodeMirror 6 integration, in-browser validation, and optional AI feedback has been split into **Feature 9b** (`feature-09b-codemirror-exercises.md`). It depends on this feature and can be implemented after the static types are working.

## Fallback rendering

All new exercise types render as static HTML — no JavaScript dependencies needed:

- `arrange`: Show fragments as a numbered list. Below the list, show "Correct order" button/section that reveals the answer.
- `compare`: Show approachA and approachB side-by-side (or stacked on mobile) as code blocks. Show answer below.
- `trace`: Show steps in sequence, each with a collapsible "Expected state" section. Show full answer at the end.

## Content Work

Create **5-10 exercises** using the new types across existing articles. Good candidates:

- `arrange`: Build pipeline steps in `architecture/overview.md`
- `compare`: Signals vs VDOM in `concepts/signals-vs-vdom.md`
- `trace`: Signal propagation in `concepts/fine-grained-reactivity.md`
- `arrange`: App registration steps in `architecture/app-registry.md`
- `trace`: Request lifecycle in `architecture/contact-system.md`

## Files to Modify

- `src/content.config.ts` — extend exercise schema
- `src/pages/learn/[...slug].astro` — render new exercise types
- 5-10 `src/content/knowledge/**/*.md` files — add new exercises

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/09a-exercise-types`
2. Implement with tests (schema validation tests for new exercise types, rendering tests if applicable)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] Schema accepts all three new exercise types (arrange, compare, trace)
- [ ] Schema accepts `targetConcepts` optional field on all exercise types
- [ ] Existing exercises still validate (no breaking changes)
- [ ] `arrange` exercises render with fragments and answer
- [ ] `compare` exercises render with both approaches side-by-side and answer
- [ ] `trace` exercises render with steps, expected state, and answer
- [ ] 5-10 new exercises created across existing articles
- [ ] `pnpm verify` and `pnpm verify:knowledge` pass

---

## AGENTS.md Update

Add to the "Knowledge exercise and lab creation" section:

```markdown
### Exercise type guide

Eight exercise types are available (seven now, plus `code` in Feature 9b). Choose based on what you're testing:

- `predict` — "What will happen if...?" Tests causal reasoning. Best for: reactivity,
  state changes, build pipeline behavior.
- `explain` — "Why does X work this way?" Tests conceptual understanding. Best for:
  design decisions, pattern rationale, tradeoffs.
- `do` — "Open DevTools and..." Tests hands-on ability. Best for: debugging, profiling,
  browser APIs.
- `debug` — "This code has a bug..." Tests diagnostic skill. Best for: common mistakes,
  edge cases.
- `arrange` — "Put these steps in order." Tests procedural understanding. Best for:
  build pipelines, request lifecycles, multi-step processes.
- `compare` — "Compare approaches A and B." Tests analytical reasoning. Best for:
  architecture decisions, library comparisons, pattern tradeoffs.
- `trace` — "Trace execution step by step." Tests runtime mental model. Best for:
  reactivity propagation, event handling, async flows.

(Feature 9b adds `code` — "Write a function that..." with in-page CodeMirror editor.)

Every article must have at least 1 `predict` or `do` exercise (enforced by audit).
Aim for type diversity: don't make all exercises `explain`.
```
