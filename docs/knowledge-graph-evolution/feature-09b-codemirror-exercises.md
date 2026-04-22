# Feature 9b: Interactive Code Exercises (CodeMirror)

## Goal

Add the `code` exercise type with an in-page CodeMirror 6 editor for write-from-scratch and fix-the-bug challenges. This is a significant interactive component — it's split from the static exercise types (Feature 9a) to keep scope manageable.

## Depends On

Feature 9a (static exercise types and `targetConcepts` field)

## Applicable Skills

- `typescript-magician` — extending discriminated union exercise schema with code-specific fields
- `astro` — Solid.js island integration, lazy loading with `client:visible`
- `web-design-guidelines` — CodeMirror keyboard accessibility, editor focus management

## Schema Changes

Extend the exercise type enum and add code-specific fields:

```typescript
exercises: z.array(z.object({
  // ... existing fields from Feature 9a ...
  type: z.enum([
    'predict', 'explain', 'do', 'debug',    // original
    'arrange', 'compare', 'trace',            // Feature 9a
    'code',                                    // NEW
  ]).default('explain'),
  // Code exercise fields (NEW):
  starterCode: z.string().optional(),            // initial code in editor
  solution: z.string().optional(),               // correct solution (shown after attempt)
  testCases: z.array(z.object({                  // validation
    input: z.string(),
    expected: z.string(),
  })).optional(),
  language: z.enum([                             // syntax highlighting
    'typescript', 'javascript', 'python', 'html', 'css',
  ]).optional(),
})).default([]),
```

## CodeMirror 6 Component

**Component:** `src/components/learn/InteractiveExercise.tsx` (Solid.js island)

**Dependencies:** `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-typescript`, `codemirror` (minimal bundle — ~50-100KB modular, NOT Monaco at 5MB+)

**Loading:** `client:visible` or `client:idle` — lazy-loaded since most articles won't need it.

**Used for:**
- `code` — an editable code editor where the learner writes code from scratch or fixes/modifies a starter snippet. A "Check" button validates the solution. For small, focused challenges: "write a memoization function," "implement debounce," "fix the bug in this event handler."

**NOT used for:** full project coding. The learner's IDE handles real project work. This component is for small, focused, in-page exercises only — think 5-50 lines of code.

## Example Exercise

```yaml
exercises:
  - question: "Write a memoize function that caches results based on arguments"
    type: code
    starterCode: |
      function memoize(fn) {
        // your implementation here
      }
    testCases:
      - input: "const add = memoize((a, b) => a + b); add(1, 2); add(1, 2);"
        expected: "fn called once, both calls return 3"
      - input: "const add = memoize((a, b) => a + b); add(1, 2); add(3, 4);"
        expected: "fn called twice, returns 3 then 7"
    solution: |
      function memoize(fn) {
        const cache = new Map();
        return (...args) => {
          const key = JSON.stringify(args);
          if (cache.has(key)) return cache.get(key);
          const result = fn(...args);
          cache.set(key, result);
          return result;
        };
      }
    answer: "Memoization caches function results keyed by arguments. The Map provides O(1) lookup. JSON.stringify creates a cache key from arguments — this works for primitives but not for object references, which is a deliberate simplification."
    hint: "Think about what data structure gives you O(1) lookup by key."
    targetConcepts:
      - cs-fundamentals/hash-maps-and-lookup
```

## Validation Approach

Two tiers of validation, matching the system's overall quality philosophy:

**Tier 1: Pattern matching (deterministic, instant).** The simplest `code` exercises can be validated by checking if the solution contains expected patterns:
- Does the code define the expected function/variable?
- Does it use the required constructs (Map, closure, async/await, etc.)?
- Does a basic `new Function()` execution produce expected output for test cases?

This runs entirely in the browser — no server, no API call. Good for straightforward exercises.

**Tier 2: AI evaluation (optional, richer feedback).** For more complex exercises where pattern matching isn't sufficient, a "Get AI feedback" button sends the learner's code to the LLM API for evaluation:
- Does the solution correctly implement the requirement?
- What edge cases does it miss?
- How does it compare to the provided solution?
- What could be improved?

This uses the same API key as the quality pipeline (Feature 5b). It's optional — the exercise works without it.

## Fallback Rendering

If CodeMirror integration proves too complex, fall back to a `<textarea>` with monospace font and a "Show solution" toggle. The exercise content (starter code, test cases, solution) is all in the frontmatter — the interactive component is a progressive enhancement.

## Files to Create

- `src/components/learn/InteractiveExercise.tsx` — Solid.js island with CodeMirror 6

## Files to Modify

- `src/content.config.ts` — add `code` to exercise type enum, add code-specific fields
- `src/pages/learn/[...slug].astro` — render `code` exercises with InteractiveExercise island
- `package.json` — add CodeMirror dependencies

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/09b-codemirror-exercises`
2. Implement with tests (schema validation, CodeMirror renders, Tier 1 validation works)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build` + `pnpm test:e2e` (if E2E tests exist)
4. Check all acceptance criteria below
5. Commit and stop.

## Acceptance Criteria

- [ ] Schema accepts `code` exercise type with starterCode, solution, testCases, language
- [ ] Existing exercises still validate
- [ ] CodeMirror component loads lazily on pages with `code` exercises
- [ ] Editor shows starter code with syntax highlighting
- [ ] "Check" button runs Tier 1 pattern validation and shows pass/fail
- [ ] "Show solution" reveals the correct solution
- [ ] Fallback textarea works if CodeMirror fails to load
- [ ] At least 2-3 `code` exercises created across existing articles
- [ ] `pnpm verify` and `pnpm build` pass

---

## AGENTS.md Update

Add to the exercise type guide:

```markdown
- `code` — "Write a function that..." or "Fix this bug." Tests implementation ability.
  In-page CodeMirror editor with starter code and validation. Best for: algorithm
  implementation, utility functions, small focused coding challenges (5-50 lines).
  Always provide starterCode, solution, testCases, language, and answer.
```
