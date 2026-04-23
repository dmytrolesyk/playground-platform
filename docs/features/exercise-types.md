# Feature: Static Exercise Types (arrange, compare, trace)

## Status: Implemented

## Summary

Added three new static exercise types (`arrange`, `compare`, `trace`) and an optional `targetConcepts` field to the knowledge engine schema. These types extend the exercise system beyond the original four types (`predict`, `explain`, `do`, `debug`) to test procedural understanding, analytical reasoning, and runtime mental models.

## Schema Changes

The exercise schema in `packages/knowledge-engine/src/schema.ts` now accepts seven types and new optional fields:

- **`arrange`** — Parsons problems. Optional `fragments: string[]` and `correctOrder: number[]`.
- **`compare`** — Tradeoff analysis. Optional `approachA: string` and `approachB: string`.
- **`trace`** — Step-by-step execution tracing. Optional `steps: Array<{ description: string; expectedState: string }>`.
- **`targetConcepts`** — Optional `string[]` on all exercise types, linking exercises to concept article IDs for future mastery assessment.

All new fields are optional. Existing exercises continue to validate without changes.

## Rendering

New exercise types render as static HTML in `src/pages/learn/[...slug].astro`:

- `arrange`: Numbered list of fragments, answer in collapsible details.
- `compare`: Side-by-side (desktop) or stacked (mobile) approach panels with code blocks.
- `trace`: Ordered step list with description and expected state, plus collapsible answer.

CSS in `src/styles/learn.css` provides distinct border-left colors and layout for each type.

## Content

Eight new exercises added across seven articles:
- 3 `arrange` exercises (overview, app-registry, data-flow)
- 2 `compare` exercises (signals-vs-vdom, state-management)
- 3 `trace` exercises (fine-grained-reactivity, contact-system, observer-pattern)

## Files Changed

- `packages/knowledge-engine/src/schema.ts` — Extended exercise type enum and added optional fields
- `packages/knowledge-engine/src/schema.test.ts` — New test file for exercise type validation
- `packages/knowledge-engine/src/audit/types.ts` — Extended Exercise interface with new fields
- `src/pages/learn/[...slug].astro` — Rendering for new exercise types
- `src/styles/learn.css` — CSS for arrange, compare, trace exercise layouts
- `src/content/knowledge/architecture/overview.md` — Added arrange exercise
- `src/content/knowledge/architecture/app-registry.md` — Added arrange exercise
- `src/content/knowledge/architecture/data-flow.md` — Added arrange exercise
- `src/content/knowledge/architecture/contact-system.md` — Added trace exercise
- `src/content/knowledge/architecture/state-management.md` — Added compare exercise
- `src/content/knowledge/concepts/fine-grained-reactivity.md` — Added trace exercise
- `src/content/knowledge/concepts/signals-vs-vdom.md` — Added compare exercise
- `src/content/knowledge/concepts/observer-pattern.md` — Added trace exercise
- `AGENTS.md` — Added exercise type guide section
