---
title: "Executable Quality Gates"
category: concept
summary: "Turning documentation standards into automated checks so broken knowledge links, invalid graph data, and UI regressions fail before merge."
difficulty: intermediate
relatedConcepts:
  - architecture/data-flow
  - concepts/progressive-enhancement
  - cs-fundamentals/graph-validation
  - concepts/module-systems-and-bundling
relatedFiles:
  - package.json
  - scripts/audit-knowledge.ts
  - scripts/knowledge-audit/load.ts
  - scripts/knowledge-audit/rules.ts
  - scripts/knowledge-audit/report.ts
  - scripts/knowledge-audit/rules.test.ts
  - tests/e2e/playwright.config.ts
  - tests/e2e/visual-regression.spec.ts
technologies:
  - typescript
  - node
  - vitest
  - playwright
  - biome
order: 14
dateAdded: 2026-04-21
lastUpdated: 2026-04-23
externalReferences:
  - title: "Continuous Integration — Martin Fowler"
    url: "https://martinfowler.com/articles/continuousIntegration.html"
    type: article
  - title: "GitHub Docs — Protected Branches"
    url: "https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches"
    type: docs
  - title: "Biome CLI Reference"
    url: "https://biomejs.dev/reference/cli/"
    type: docs
  - title: "Vitest Getting Started"
    url: "https://vitest.dev/guide/"
    type: docs
  - title: "Playwright Visual Comparisons"
    url: "https://playwright.dev/docs/test-snapshots"
    type: docs
  - title: "Actions — docs.github.com"
    url: "https://docs.github.com/en/actions"
    type: repo
  - title: "SpecificationByExample.html — martinfowler.com"
    url: "https://martinfowler.com/bliki/SpecificationByExample.html"
    type: article
  - title: "Intro — Playwright"
    url: "https://playwright.dev/docs/intro"
    type: docs
  - title: " — Vitest"
    url: "https://vitest.dev/"
    type: docs
diagramRef: "knowledge-audit"
module: learning-system-reliability
moduleOrder: 1
estimatedMinutes: 14
prerequisites:
  - architecture/data-flow
  - concepts/progressive-enhancement
learningObjectives:
  - "Explain the difference between a written standard and an executable quality gate"
  - "Design a thin CLI that turns deterministic content rules into CI failures"
  - "Choose whether a new rule belongs in unit tests, the knowledge audit, or Playwright e2e"
exercises:
  - question: "Predict what happens if pnpm verify runs Biome, Astro check, Vitest, and then pnpm verify:knowledge, and the knowledge audit reports one error."
    type: predict
    hint: "Shell commands connected with && stop at the first non-zero exit code."
    answer: "The overall pnpm verify command fails. The earlier tools may pass, but verify:knowledge exits with code 1 when any issue has severity error. Because package.json chains the commands with &&, the non-zero audit exit code becomes the verification result."
  - question: "Why are graph rules implemented in scripts/knowledge-audit/rules.ts instead of directly inside scripts/audit-knowledge.ts?"
    type: explain
    answer: "The CLI has side effects: file reads, dynamic imports, terminal output, and process.exitCode. The rules are pure functions over in-memory data, so Vitest can exercise missing links, duplicate nodes, bad edge types, and cycles without building a fake filesystem. That split keeps the quality gate reliable and cheap to test."
  - question: "Add a temporary bad relatedConcepts value to one article, run pnpm verify:knowledge, then revert it. What exact issue code appears?"
    type: do
    answer: "The audit reports missing-related-concept for the article. This proves the gate is checking semantic graph integrity that Astro's Zod schema cannot know: Zod can validate that relatedConcepts is an array of strings, but only the audit can validate that each string points to another article."
---

## Why Should I Care?

A checklist in a document is a promise. A quality gate is a promise with teeth. The difference matters because humans and agents both forget: someone renames a knowledge article, forgets to update `relatedConcepts`, and the broken link lives quietly until a reader hits it. An executable gate makes that mistake loud during `pnpm verify`.

This project now treats learning content like code. Markdown is still pleasant to write, but the shape around it is validated by scripts, unit tests, and production-build e2e checks.

## The Mental Model: Standards as Code

```mermaid
flowchart LR
    STANDARD["Written standard<br/>docs/features/knowledge-base.md"] --> RULE["Executable rule<br/>rules.ts"]
    RULE --> TEST["Rule tests<br/>Vitest"]
    RULE --> CLI["CLI<br/>verify:knowledge"]
    CLI --> VERIFY["pnpm verify"]
    VERIFY --> PR["Protected branch<br/>merge blocked on failure"]
```

The written standard still matters. It explains intent, tradeoffs, and what "good" means. But any rule that can be evaluated deterministically should become code. The audit can check that a prerequisite exists. It cannot judge whether an explanation has soul. The quality gate should automate the first category so humans can spend attention on the second.

## How It Works Here

`package.json` defines the gate:

```json
"verify:knowledge": "node --experimental-strip-types scripts/audit-knowledge.ts",
"verify": "biome check . && astro check && vitest run --passWithNoTests --exclude 'tests/e2e/**' && pnpm verify:knowledge"
```

That order gives each tool a clear job:

| Gate | What it catches |
|---|---|
| `biome check .` | Formatting and lint rules |
| `astro check` | Astro and TypeScript type errors |
| `vitest run` | Unit-level logic regressions |
| `pnpm verify:knowledge` | Knowledge graph and Architecture Explorer contract errors |
| `pnpm test:e2e` | Production-build UI, hydration, iframe, responsive, and visual regressions |

The knowledge audit is intentionally small. `scripts/audit-knowledge.ts` loads input, calls rules, formats a report, and sets `process.exitCode`. The rules live in `scripts/knowledge-audit/rules.ts` so they can be tested without terminal plumbing.

## Why Zod Is Not Enough

Astro content collections already validate frontmatter in `src/content.config.ts`. That gives you schema guarantees:

- `category` is one of the allowed categories
- `externalReferences` is an array of structured objects
- `exercises` have question, answer, and type fields

But schema validation does not know the rest of the repository. It can say "`diagramRef` is a string." It cannot say "that string points to a node in `architecture-data.ts`." It can say "`module` is a string." It cannot say "that string is one of the ids in `src/content/knowledge/modules.ts`." That is why the audit loader collects articles, modules, architecture nodes, and architecture edges into one in-memory graph before the rules run.

## What Counts as an Executable Gate?

A good gate has three properties:

1. **Deterministic**: same input, same output. Link resolution and graph cycles are deterministic. "This paragraph is boring" is not.
2. **Fast enough to run locally**: if developers avoid it, it stops protecting the system.
3. **Actionable output**: the error should name the broken subject and the rule that failed.

This is why `formatKnowledgeAuditReport()` prints lines like:

```text
- [bad-diagram-ref] architecture/overview: architecture/overview uses diagramRef "missing-node", but no architecture node has that id.
```

The message tells you what broke, where it broke, and what relationship to repair.

## Before and After

Before this feature, knowledge quality was mostly social:

- Read `AGENTS.md`
- Remember v1 standards
- Remember v2 standards
- Remember reliability plan notes
- Manually inspect graph links

After this feature, the process is layered:

- Read the canonical standard in `docs/features/knowledge-base.md`
- Run `pnpm verify:knowledge` for graph integrity
- Run `pnpm verify` before commit
- Run `pnpm test:e2e` for `/learn`, Library, Architecture Explorer, responsive behavior, and visual snapshots

The social layer remains, but it has a mechanical floor.

## Broader Context

This is the same idea behind continuous integration and required status checks. CI is valuable because integration problems appear close to the commit that caused them. Protected branches are valuable because they turn a team rule into a merge rule. Visual regression tests are valuable because a layout mistake becomes a diff instead of a surprise in production.

The knowledge audit applies that engineering habit to documentation. Documentation is not exempt from entropy. It just needs different tests.

## What Goes Wrong Without Executable Gates

The dangerous failure mode is confidence without evidence. A feature doc says every new article has prerequisites, exercises, and graph links. The author believes it. The reviewer skims it. The site builds because every field has the right type. But the Architecture Explorer points to an old slug and the learner gets a dead end.

Executable gates do not replace judgment. They make the boring promises enforceable so judgment can focus on teaching quality, architecture fit, and whether the article actually helps someone think better.

## How to Build Your Own Quality Gate

The pattern is transferable to any project that maintains structured content:

1. **Define the contract** — What must be true about every piece of content? In this project: every article has exercises, prerequisites resolve, diagram refs point to real nodes. Write these as code, not comments.
2. **Make it a pure function** — Each rule takes structured input and returns a list of issues. No file I/O, no side effects in the rule itself. Loading data and reporting results are separate concerns.
3. **Wire it into CI** — The gate only works if it runs automatically. [GitHub Actions](https://docs.github.com/en/actions) or any CI system can run `pnpm verify:knowledge` as a required check on every PR.
4. **Distinguish severity** — Some violations are errors (broken references that crash the UI) and some are warnings (style issues that degrade quality). Only errors should block merges; warnings should be tracked and fixed on a cadence.
5. **Keep the audit fast** — The knowledge audit runs in under a second. If a quality gate takes minutes, developers will skip it. Pure functions over in-memory data are fast; spawning browsers or calling APIs is slow.

The broader insight: [executable specifications](https://martinfowler.com/bliki/SpecificationByExample.html) beat written guidelines because they can't be accidentally ignored. Every team has a document that says "always do X" and nobody does X. Turn X into a test and it gets done.

## Connection to Testing Philosophy

Quality gates and test suites serve the same purpose: they make promises verifiable. The difference is scope. A unit test verifies one function's behavior. An [E2E test](https://playwright.dev/docs/intro) verifies a user journey. A quality gate verifies a structural invariant across an entire content corpus.

This project uses all three: [Vitest](https://vitest.dev/) for audit rule logic, Playwright for visual and interaction testing, and the knowledge audit for cross-article graph integrity. Each layer catches what the others can't — unit tests don't verify broken prerequisite links, and graph audits don't verify that a window renders correctly.
