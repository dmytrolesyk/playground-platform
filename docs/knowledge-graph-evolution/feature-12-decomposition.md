# Feature 12: Project Labs — Decomposition Overview

_Date: 2026-04-23_
_Status: Design (extended from original spec)_

## Why This Decomposition Exists

The original Feature 12 spec was a ~19KB brainstorm that described the *vision* for Project Labs but left critical architectural decisions unresolved and underestimated the complexity of several components. This document decomposes Feature 12 into 5 core sub-features (12a–12e) and 3 enhancement sub-features (12f–12h), with resolved design decisions based on prior-art research of CodeCrafters, Exercism, The Odin Project, freeCodeCamp, and boot.dev.

See: `research/project-labs-prior-art-research.md` for the full analysis.

## Primary Use Case

The primary value of Project Labs is **learning unfamiliar technologies** (Three.js, WebRTC, em-dosbox, etc.) by rebuilding simplified versions of real systems, with every phase connected to the knowledge graph. The first project-lab ("Tiny App Framework") rebuilds the developer's own codebase — this is a **format validation step**, not the primary value. It's the easiest to write (target system is known) and validates the schema, rendering, and audit pipeline before tackling unfamiliar domains where the content is genuinely educational.

## Future Integration: GraphRAG / AI Chatbot

A future feature (post-Feature 12) will add a GraphRAG-powered AI chatbot that has access to the knowledge graph and can assist learners during project-lab sessions — answering questions, suggesting next steps, and connecting concepts across domains. **This is explicitly out of scope for Feature 12.** The integration point is the existing `knowledge-graph.json` (generated at build time) and the article Markdown content. Feature 12 does not need to anticipate the chatbot's needs — the knowledge graph and article content are the interface.

## Resolved Design Decisions

These decisions were left open in the original spec. They are now resolved:

### Decision 1: Multi-file Architecture (Resolved: Multi-file with Backlink)

**Choice:** Project-lab phases are separate Markdown files with `category: lab` and a new `parentProjectLab` field linking back to the index.

**Rationale:**
- Per-phase progress tracking comes for free (existing article-level localStorage progress)
- Manageable file sizes (~800-1500 words per phase vs 5000+ for a monolithic file)
- Independent rendering — each phase is a full `/learn/` page
- The `phases` array in the index frontmatter contains only references (slug + order), not content
- Matches Exercism's multi-file-per-exercise pattern (the most mature content architecture in this space)

**Trade-off accepted:** Slight routing complexity (index page vs phase pages need different rendering).

### Decision 2: Checkpoint Approach (Resolved: Human + Copyable Snippets)

**Choice:** Human-readable checkpoints (primary) + copyable test code blocks (secondary). No separate test files in the CV repo.

**Rationale:**
- CodeCrafters uses server-side test execution — not viable for a static site
- The Odin Project has zero automated verification and still works
- Exercism's local test runner requires language-specific tooling setup
- Our learners code in their own project directory with their own tooling
- Copyable vitest snippets inside the article body give them test code without path-resolution problems

**Trade-off accepted:** Learner must paste test code manually. The instructional value of understanding what the test checks outweighs the convenience of a pre-built test harness.

### Decision 3: Diff Views (Resolved: Deferred to 12f)

**Choice:** Defer to an enhancement sub-feature. MVP uses code blocks only.

**Rationale:** No platform in the study (CodeCrafters, Exercism, Odin, freeCodeCamp, boot.dev) provides step-by-step diff rendering. All use code blocks with copy buttons. Diff rendering requires either a library (~45KB for diff2html) or custom implementation, plus syntax highlighting within diffs. The project-lab format works well without them.

### Decision 4: AI Code Review Script (Resolved: Deferred to 12h)

**Choice:** Defer entirely. Not part of core delivery.

**Rationale:** The script requires LLM API integration, learner project path resolution, and cost management — all orthogonal to the project-lab format. The `review-article.ts` pattern can be adapted later.

### Decision 5: Audit Profile for Phases (Resolved: Reduced Profile)

**Choice:** Project-lab phase files get structural validation only. No inline citation density, exercise count, or word count minimums.

**Rationale:** DO/OBSERVE/EXPLAIN steps are inherently instructional (the step IS the exercise). Forcing citation density into imperative instructions distorts the format. The project-lab index file gets standard audit treatment for its descriptive fields.

### Decision 6: First Content Scope (Resolved: 4 Phases, ~15 Steps)

**Choice:** "Build a Tiny App Framework" with 4 phases of 3-4 steps each.

**Rationale:** Comparable to CodeCrafters' smaller challenges (Git=7 stages, DNS=15 stages). Uses this project's own codebase as the target (no external repo analysis needed). Concepts already exist in the knowledge graph. Each phase produces a running demo.

## Sub-Feature Map

```
Feature 12a: Schema & Content Architecture ─── (1 weekend)
    │
    ▼
Feature 12b: Core Rendering ────────────────── (1 weekend)
    │
    ├──▶ Feature 12c: Progress & Navigation ── (2-3 hours)
    │
    └──▶ Feature 12d: Audit Rules ──────────── (half day)
              │
              ▼
         Feature 12e: First Content ─────────── (1-2 weekends)

═══════════════ Enhancements (post-core) ═══════════════

Feature 12f: Diff Views ────────────────────── (1 weekend)
Feature 12g: Cytoscape Integration ─────────── (half day)
Feature 12h: AI Code Review Script ─────────── (1 weekend)
```

**Core critical path: 12a → 12b → 12c + 12d → 12e**
**Total core estimate: 3-4 weekends**
**Total with enhancements: 5-6 weekends**

## Sub-Feature Specifications

Each sub-feature has its own spec file:

- `feature-12a-schema.md` — Schema & content architecture
- `feature-12b-rendering.md` — Core rendering components
- `feature-12c-progress.md` — Progress tracking & navigation
- `feature-12d-audit-rules.md` — Project-lab-specific audit rules
- `feature-12e-first-content.md` — "Build a Tiny App Framework" content
- `feature-12f-diff-views.md` — (Enhancement) Step-by-step diff rendering
- `feature-12g-cytoscape.md` — (Enhancement) Knowledge graph integration UI
- `feature-12h-ai-review.md` — (Enhancement) AI code review script

## Relationship to Original Feature 12

The original `feature-12-project-labs.md` remains as the vision document. This decomposition replaces it as the implementation guide. The acceptance criteria from the original spec map to sub-features:

| Original Acceptance Criterion | Sub-Feature |
|-------------------------------|-------------|
| `project-lab` category added to schema | 12a |
| Project-lab-specific frontmatter fields validate | 12a |
| First project-lab created (at least 2 phases) | 12e |
| Project-lab renders correctly on /learn pages | 12b |
| Code blocks have copy buttons | 12b |
| Collapsible "expected result" sections work | 12b |
| Step-by-step diff views render correctly | 12f (deferred) |
| Checkpoint test files exist | 12e (as copyable snippets, not separate files) |
| `review-my-code.ts` script works | 12h (deferred) |
| Progress tracking works per phase | 12c |
| Knowledge graph includes project-lab → concept edges | 12a (schema), 12g (UI) |
| Audit rules validate project-lab structure | 12d |
| `pnpm verify` and `pnpm verify:knowledge` pass | All |
