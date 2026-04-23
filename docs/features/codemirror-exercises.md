# Feature: Interactive Code Exercises (CodeMirror)

## Status: Complete

## Summary

Adds the `code` exercise type with an in-page CodeMirror 6 editor for write-from-scratch and fix-the-bug coding challenges. A significant interactive component — split from the static exercise types (Feature 9a) to keep scope manageable.

## Design

### Schema Changes

Extended the exercise type enum with `code` and added code-specific fields to the exercise schema in `packages/knowledge-engine/src/schema.ts`:

- `starterCode` (string, optional) — initial code in editor
- `solution` (string, optional) — correct solution shown after attempt
- `testCases` (array of `{input, expected}`, optional) — validation inputs
- `language` (enum: typescript, javascript, python, html, css, optional) — syntax highlighting

### Component

`src/components/learn/InteractiveExercise.tsx` — SolidJS island with:
- Lazy-loaded CodeMirror 6 (modular ~50-100KB, NOT Monaco at 5MB+)
- `client:visible` loading — only loads when scrolled into view
- Syntax highlighting via language-specific extensions
- Tier 1 pattern-based validation (structure checks + `new Function()` test execution)
- "Check", "Reset", "Show Solution" controls
- Fallback `<textarea>` if CodeMirror fails to load

### Validation

Two-tier approach:
- **Tier 1 (implemented):** Deterministic, in-browser. Checks definitions exist, runs test cases via `new Function()`.
- **Tier 2 (future):** AI evaluation via "Get AI feedback" button. Not implemented in this feature.

### Articles Updated

Added `code` exercises to 3 articles:
1. `cs-fundamentals/hash-maps-and-lookup` — implement a SimpleHashMap class
2. `concepts/javascript-proxies` — write a reactive proxy with tracking
3. `concepts/observer-pattern` — write a minimal EventEmitter class

## Files Changed

- `packages/knowledge-engine/src/schema.ts` — added `code` type + code-specific fields
- `packages/knowledge-engine/src/schema.test.ts` — 5 new tests for code exercise validation
- `src/components/learn/InteractiveExercise.tsx` — new SolidJS CodeMirror island
- `src/pages/learn/[...slug].astro` — renders code exercises with InteractiveExercise island
- `src/styles/learn.css` — styles for code exercise component
- `src/content/knowledge/cs-fundamentals/hash-maps-and-lookup.md` — added code exercise
- `src/content/knowledge/concepts/javascript-proxies.md` — added code exercise
- `src/content/knowledge/concepts/observer-pattern.md` — added code exercise
- `AGENTS.md` — updated exercise type guide
- `package.json` — added CodeMirror dependencies

## Dependencies Added

- `codemirror` — minimal CodeMirror 6 bundle
- `@codemirror/state` — editor state management
- `@codemirror/view` — editor view layer
- `@codemirror/language` — language support infrastructure
- `@codemirror/lang-javascript` — JS/TS syntax highlighting
- `@codemirror/lang-html` — HTML syntax highlighting
- `@codemirror/lang-css` — CSS syntax highlighting
- `@codemirror/lang-python` — Python syntax highlighting
