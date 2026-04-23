---
title: "Vitest — Unit Testing with Vite Speed"
category: technology
summary: "The Vite-native test runner used for pure functions, audit rules, and engine logic — how it's configured, what it tests, and when to use it vs Playwright."
difficulty: beginner
prefLabel: "Vitest"
altLabels:
  - "Vite test runner"
  - "vitest testing"
  - "unit testing framework"
relatedConcepts:
  - concepts/executable-quality-gates
  - concepts/module-systems-and-bundling
relatedFiles:
  - package.json
  - scripts/knowledge-audit/rules.test.ts
  - scripts/knowledge-audit/rules.ts
  - scripts/knowledge-audit/types.ts
technologies:
  - vitest
order: 6
dateAdded: 2026-04-23
lastUpdated: 2026-04-23
externalReferences:
  - title: "Vitest Official Documentation"
    url: "https://vitest.dev/"
    type: docs
  - title: "Vitest — Why Vitest?"
    url: "https://vitest.dev/guide/why"
    type: docs
  - title: "Vitest GitHub Repository"
    url: "https://github.com/vitest-dev/vitest"
    type: repo
  - title: "Vitest Configuration Reference"
    url: "https://vitest.dev/config/"
    type: docs
  - title: "Testing Library — Guiding Principles"
    url: "https://testing-library.com/docs/guiding-principles"
    type: article
  - title: "Guide — Vitest"
    url: "https://vitest.dev/guide/"
    type: docs
  - title: "Cli — Vitest"
    url: "https://vitest.dev/guide/cli"
    type: docs
module: learning-system-reliability
moduleOrder: 4
estimatedMinutes: 12
prerequisites:
  - concepts/executable-quality-gates
learningObjectives:
  - "Explain why Vitest is used instead of Jest and what advantage Vite-native test execution provides"
  - "Write a unit test for a pure function using Vitest's describe/it/expect API"
  - "Determine whether a bug should be tested with Vitest (logic) or Playwright (UI/interaction)"
exercises:
  - question: "You discover a bug where the `auditMinimumWordCount` function counts code blocks toward the word count, inflating the number. Should you write a Vitest test or a Playwright test? What would the test look like?"
    type: predict
    hint: "The audit function is a pure function that takes input and returns issues."
    answer: "This is a Vitest test — the audit function is pure logic with no DOM or browser dependency. The test would create a KnowledgeAuditInput with an article whose body is mostly a code block but has few prose words, call `auditMinimumWordCount(input)`, and assert that it returns an issue for insufficient word count. Something like: `it('should not count code blocks toward word count', () => { const input = makeInput({ body: 'Short intro.\\n```\\nconst a = 1; const b = 2; ...100 lines...\\n```', category: 'architecture' }); const issues = auditMinimumWordCount(input); expect(issues).toHaveLength(1); })`. Pure functions get Vitest tests; UI behavior gets Playwright tests."
  - question: "Open `scripts/knowledge-audit/rules.test.ts` and read how the test helpers create mock articles. Run `pnpm test` and observe the output. Now add a test that verifies an article with exactly 3 inline citations passes the `inline-citation-density` rule."
    type: do
    hint: "Look at the `makeArticle` or similar helper function that constructs test fixtures."
    answer: "The test file uses helper functions to build KnowledgeAuditInput objects with configurable fields. To test the boundary condition, create an article with a body containing exactly 3 external URLs (like `See https://example.com and https://docs.example.com and https://spec.example.com`), pass it through `auditInlineCitationDensity`, and assert the result is an empty array (no issues). This boundary test verifies the rule uses `< 3` not `<= 3`. Running `pnpm test` executes all vitest tests and shows pass/fail results with timing."
  - question: "Why does the project run Vitest with `--exclude 'tests/e2e/**'` instead of configuring the exclude in a vitest.config.ts file?"
    type: explain
    answer: "The project doesn't have a separate `vitest.config.ts` — it relies on Vitest's defaults plus CLI flags. The `--exclude 'tests/e2e/**'` flag prevents Vitest from discovering Playwright test files in the e2e directory, which use a different test runner and API. Keeping this as a CLI flag in package.json makes it visible and explicit. The alternative — a vitest.config.ts with `exclude: ['tests/e2e/**']` — would work too, but the project chose minimal configuration. Vitest tests live alongside their source in `scripts/` (e.g., `rules.test.ts` next to `rules.ts`), while Playwright tests live in `tests/e2e/`."
---

## Why Should I Care?

Every audit rule, every graph extraction function, every pure utility in this project needs tests that run in milliseconds, not seconds. [Vitest](https://vitest.dev/) (see the [Vitest repository](https://github.com/vitest-dev/vitest)) provides this by sharing Vite's transform pipeline — the same tool that builds the web app also runs the tests, with no [configuration](https://vitest.dev/config/) duplication. If you've used Jest, Vitest's API is nearly identical, but the speed difference is dramatic: Vitest's [HMR-based watch mode](https://vitest.dev/guide/why) re-runs only affected tests when a file changes, typically under 100ms.

## How Vitest Fits the Testing Strategy

This project has a **two-tier testing strategy**, and understanding which tier handles what prevents you from writing tests in the wrong place:

| Tier | Tool | What it tests | Speed | Command |
|---|---|---|---|---|
| Unit/Logic | **Vitest** | Pure functions, audit rules, graph extraction, utilities | Fast (ms) | `pnpm test` |
| Integration/UI | **Playwright** | Browser rendering, interactions, hydration, responsive layout | Slow (s) | `pnpm test:e2e` |

Vitest tests answer: "Does this function produce the correct output for a given input?" Playwright tests answer: "Does the user see and experience the right thing in a browser?" following the [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles). The line is clear: if your test needs a DOM, a browser, or visual verification, use Playwright. If it tests logic that takes data in and produces data out, use Vitest.

```mermaid
flowchart TB
    subgraph "pnpm verify (fast path)"
        A[biome check] --> B[astro check]
        B --> C["vitest run"]
        C --> D[verify:knowledge]
    end
    
    subgraph "pnpm test:e2e (slow path)"
        E[Build production app] --> F[Start preview server]
        F --> G["Playwright tests"]
    end
    
    style C fill:#90EE90
    style G fill:#87CEEB
```

## Configuration: Zero-Config with Overrides

The project uses Vitest without a dedicated config file. The defaults work because Vitest automatically discovers `.test.ts` files and uses the project's `tsconfig.json` for TypeScript support. The only configuration is in `package.json`:

```json
{
  "test": "vitest run --passWithNoTests --exclude 'tests/e2e/**'"
}
```

Two flags:
- `--passWithNoTests` — exits 0 if no test files are found (prevents CI failure when a branch temporarily has no tests)
- `--exclude 'tests/e2e/**'` — keeps Playwright tests out of Vitest's discovery, since they use a different test API and need a browser

Vitest [shares Vite's config](https://vitest.dev/guide/why) automatically, so it resolves TypeScript imports, handles path aliases, and transforms files the same way the dev server does — no separate `jest.config.js` with duplicate transform settings.

## Anatomy of a Test File

The primary test file in this project is `scripts/knowledge-audit/rules.test.ts`, which tests every audit rule. Here's the pattern:

```typescript
import { describe, expect, it } from 'vitest';
import { auditMinimumWordCount } from './rules.ts';
import type { KnowledgeAuditInput } from './types.ts';

describe('minimum-word-count', () => {
  it('should warn when architecture article is below 1500 words', () => {
    const input: KnowledgeAuditInput = {
      articles: [{
        id: 'architecture/test',
        category: 'architecture',
        body: 'Short body with few words.',
        // ... other required fields
      }],
      modules: [],
      architectureNodeIds: [],
    };
    
    const issues = auditMinimumWordCount(input);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('minimum-word-count');
  });
});
```

The pattern follows [arrange-act-assert](https://vitest.dev/guide/): construct input, call the function, verify output. Test data uses minimal fixtures — only the fields the rule actually inspects, with sensible defaults for the rest.

### Test Helpers

The test file defines helpers that generate valid article objects with overridable fields. This avoids repeating boilerplate across tests:

```typescript
function makeInput(overrides: Partial<KnowledgeArticle>): KnowledgeAuditInput {
  return {
    articles: [{
      id: 'test/article',
      category: 'architecture',
      body: generateValidBody(), // enough words + citations
      ...overrides,
    }],
    modules: [],
    architectureNodeIds: [],
  };
}
```

This pattern keeps tests focused on what varies. If you're testing `auditInlineCitationDensity`, you only override `body` — everything else uses valid defaults.

## What Gets Tested

The audit pipeline is the primary Vitest testing surface in this project:

**Per-rule tests** — Each of the 13 audit rules has at least one test for the failure case and one for the passing case. Tests verify the exact issue code, severity, and message content.

**Boundary tests** — Rules with numeric thresholds are tested at the boundary. For example, `minimum-word-count` is tested with word counts just below and at the minimum for each category.

**Integration test** — The `auditKnowledgeRules` function that orchestrates all rules is tested to ensure it aggregates issues correctly and that no rule throws on edge cases (empty articles, missing optional fields).

The `pnpm verify` command runs Vitest as part of its pipeline, so every PR gets unit test coverage verified alongside linting, type checking, and the knowledge audit.

## Running Tests

```bash
# Run all unit tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
npx vitest

# Run a specific test file
npx vitest scripts/knowledge-audit/rules.test.ts

# Run tests matching a pattern
npx vitest -t "minimum-word-count"
```

[Watch mode](https://vitest.dev/guide/cli) is Vitest's killer feature for development. It uses Vite's module graph to determine which tests are affected by a file change and re-runs only those tests. Changing `rules.ts` re-runs `rules.test.ts` in under 100ms — fast enough to feel instant.

## Gotchas

**Vitest uses ESM by default.** Unlike Jest (which traditionally uses CommonJS), Vitest runs in [ES module mode](https://vitest.dev/guide/why). This means `import`/`export` syntax, no `require()`, and `__dirname`/`__filename` aren't available (use `import.meta.url` + `fileURLToPath` instead). The project's scripts already use ESM, so this isn't a practical issue, but it matters if you copy patterns from Jest tutorials.

**No browser APIs in Vitest.** Vitest runs in Node.js, not a browser. There's no `document`, no `window`, no `localStorage`. If your test needs browser APIs, either mock them (fragile) or use Playwright (correct). The audit rules are pure functions that operate on data structures, so they don't need browser APIs.

**`--passWithNoTests` is intentional.** Some branches may temporarily have no test files (e.g., content-only changes). Without this flag, Vitest would exit with a non-zero code, failing CI. The flag ensures that "no tests" is a valid state, not an error.
