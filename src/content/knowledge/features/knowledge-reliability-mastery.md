---
title: "Knowledge Reliability and Mastery"
category: feature
summary: "How the knowledge base became an auditable learning system with executable graph checks, staged progress, Library bridge coverage, and production-build e2e tests."
difficulty: intermediate
relatedConcepts:
  - concepts/executable-quality-gates
  - cs-fundamentals/graph-validation
  - concepts/progressive-enhancement
  - architecture/data-flow
relatedFiles:
  - scripts/audit-knowledge.ts
  - scripts/knowledge-audit/load.ts
  - scripts/knowledge-audit/rules.ts
  - src/scripts/learn-progress.ts
  - src/layouts/LearnLayout.astro
  - src/pages/learn/index.astro
  - src/pages/learn/[...slug].astro
  - src/components/desktop/apps/library/LibraryApp.tsx
  - src/components/desktop/store/desktop-store.ts
  - tests/e2e/knowledge.spec.ts
  - tests/e2e/desktop-knowledge.spec.ts
technologies:
  - astro
  - solidjs
  - typescript
  - playwright
order: 5
dateAdded: 2026-04-21
lastUpdated: 2026-04-23
externalReferences:
  - title: "Astro Content Collections"
    url: "https://docs.astro.build/en/guides/content-collections/"
    type: docs
  - title: "MDN Web Storage API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API"
    type: docs
  - title: "Node.js TypeScript Type Stripping"
    url: "https://nodejs.org/api/typescript.html#type-stripping"
    type: docs
  - title: "Playwright Visual Comparisons"
    url: "https://playwright.dev/docs/test-snapshots"
    type: docs
  - title: "Spaced Repetition and Learning Science"
    url: "https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge"
    type: article
  - title: "SelfTestingCode.html — martinfowler.com"
    url: "https://martinfowler.com/bliki/SelfTestingCode.html"
    type: article
  - title: "Progressive Enhancement — MDN Web Docs"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement"
    type: docs
diagramRef: "mastery-progress"
module: learning-system-reliability
moduleOrder: 3
estimatedMinutes: 12
prerequisites:
  - concepts/executable-quality-gates
  - cs-fundamentals/graph-validation
  - concepts/progressive-enhancement
learningObjectives:
  - "Trace how a knowledge article is validated by the audit, rendered by Astro, and enhanced by staged progress"
  - "Explain why read, checked, practiced, and mastered are separate states"
  - "Describe how the Library singleton bridge keeps Architecture Explorer navigation useful"
exercises:
  - question: "Predict what happens if an article sets diagramRef to a node id that does not exist in architecture-data.ts."
    type: predict
    hint: "Follow scripts/audit-knowledge.ts into the diagram-ref rule."
    answer: "pnpm verify:knowledge exits with an error. load.ts reads article frontmatter and architecture-data.ts, rules.ts builds a set of architecture node ids, and auditArticleDiagramRef reports bad-diagram-ref when the article's diagramRef is absent. Because pnpm verify chains verify:knowledge, the normal verification command fails before the broken documentation can merge."
  - question: "Open a /learn article, click Checked, then click Mastered. Why does the progress module also keep checkedAt?"
    type: explain
    answer: "Stages are cumulative. A mastered article has also been checked and practiced if those thresholds were crossed. advanceArticle() uses stageAtLeast() to preserve milestone timestamps, so the UI can summarize how many articles reached each threshold without losing the earlier learning history."
  - question: "In the desktop, open Architecture Explorer, select APP_REGISTRY, and open the article twice after selecting another node. What should happen to the Library window?"
    type: do
    answer: "There should still be one Knowledge Base window. openWindow() merges the new initialUrl into the existing singleton appProps, LibraryApp reacts to props.initialUrl with a Solid effect, and the iframe/address bar navigate to the new /learn article instead of leaving the old article visible."
---

## Why This Matters

The knowledge base is only useful if it stays trustworthy. A stale article, a broken prerequisite, or a diagram node that links nowhere teaches the wrong lesson at exactly the moment the reader is trying to build a mental model. This feature turns the learning system into a self-checking artifact: the content still lives as Markdown, but the repo now has [executable rules](https://martinfowler.com/bliki/SelfTestingCode.html) that verify the graph around it. Scripts run via [Node.js type stripping](https://nodejs.org/api/typescript.html#type-stripping), and [Playwright visual snapshots](https://playwright.dev/docs/test-snapshots) catch UI regressions.

It also makes progress more honest. Reading an article is not the same thing as practicing it. The [staged mastery model](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge) keeps that distinction visible without adding accounts, a database, or a quiz engine.

## The Reliability Loop

```mermaid
flowchart TD
    MD["Knowledge Markdown<br/>[frontmatter](https://docs.astro.build/en/guides/content-collections/) + body"] --> LOAD["load.ts<br/>parse YAML + source graph"]
    AD["architecture-data.ts<br/>nodes + edges"] --> LOAD
    MOD["modules.ts<br/>curriculum ids"] --> LOAD
    LOAD --> RULES["rules.ts<br/>pure validation"]
    RULES --> REPORT["report.ts<br/>actionable terminal output"]
    REPORT --> VERIFY["pnpm verify<br/>fails on audit errors"]
    MD --> LEARN["/learn/* static pages"]
    LEARN --> PROGRESS["learn-progress.ts<br/>localStorage stages"]
```

The important move is separation. `scripts/knowledge-audit/load.ts` knows how to read files and import TypeScript data. `scripts/knowledge-audit/rules.ts` knows only about in-memory articles, modules, nodes, and edges. That makes the hard part testable with Vitest while the CLI remains thin.

The audit currently checks reference integrity and graph shape: related concepts must resolve, prerequisites must resolve, modules must exist, diagram refs must point to architecture nodes, architecture edges must point to real endpoints, node categories and edge types must stay inside the documented contract, and prerequisite cycles are rejected.

## Staged Mastery

`src/scripts/learn-progress.ts` stores one local record per article:

```ts
type MasteryStage = 'read' | 'checked' | 'practiced' | 'mastered';
```

The page marks an article as `read` on load. Opening an exercise answer or clicking the Checked button advances it to `checked`. Labs and do-style exercises can be marked `practiced`. `mastered` stays a deliberate self-assessment button.

That choice matters. A system that automatically marks a page as complete after a visit is convenient, but it lies. This codebase is supposed to teach engineering judgment, so it should preserve friction where friction means "pause and prove you understand."

The implementation is [progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement). `/learn` pages are static Astro HTML first. If JavaScript fails, the article, prerequisites, source files, and external references remain readable. If JavaScript runs, `LearnLayout.astro` imports the progress module, renders the tracker, and updates module summaries from [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API).

## Library and Architecture Explorer Stay Connected

The Architecture Explorer is a visual map, but the Library is the actual reading surface. Before this feature, opening a second node could focus the existing singleton Library window without navigating it. The fix is small but architectural:

- `openWindow('library', extraProps)` now merges `extraProps` into the existing singleton window.
- `LibraryApp` watches `props.initialUrl` and navigates its iframe when the prop changes.
- iframe `load` events synchronize the toolbar address and history for same-origin `/learn` navigation.

This keeps the desktop shell simple. The store still has no knowledge-specific state; it only preserves the generic `appProps` channel that any singleton app can use.

## What Goes Wrong Without This Feature

Without the audit, a renamed article can silently break prerequisites. Without graph validation, Architecture Explorer can render an edge whose endpoint does not exist. Without staged progress, the learner sees a completion percentage that rewards opening tabs more than doing exercises. Without e2e coverage, a production-only hydration issue on `/learn` or a Library iframe bug can slip through unit tests.

The feature does not make the system perfect. It does make the failure modes visible, fast, and local. That is the difference between documentation that decays and a learning system that can be trusted over time as the codebase evolves and new articles are added.
