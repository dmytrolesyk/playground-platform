# Knowledge Graph Evolution — Overview

## What This Is

A series of features that evolve the playground-platform knowledge base into a graph-powered learning system. Each feature is documented in a separate spec file in this directory. They should be implemented sequentially — each builds on the previous ones. Features 1-11 build the infrastructure; Feature 12 is the killer feature that uses the full infrastructure.

Between Features 3 and 4, there is a **content remediation phase** to fix existing articles that fail the new audit rules. Between Feature 6 and Feature 7, there is a **mini learning cycle** to validate the system by actually using it.

**Approach:** Implement features one at a time. Each feature = one branch, one design doc, one PR. Follow the existing feature development process in `docs/feature-development.md`.

**Key principle:** Build on what exists. Extend the existing Astro content collections, Zod schemas, audit pipeline, and Architecture Explorer — don't replace them.

## Big Picture

The knowledge base currently has an **implicit knowledge graph** — relationships between articles are scattered across Markdown frontmatter fields (`relatedConcepts`, `prerequisites`, `technologies`, `diagramRef`) and `architecture-data.ts`. The evolution makes this graph **explicit and queryable**, adds **semantic vocabulary management** (SKOS), extends the **quality audit pipeline** (SHACL-inspired), introduces **graph analysis** (NetworkX), **interactive visualization** (Cytoscape.js), and **extracts the knowledge engine into a reusable package** early to enforce clean boundaries.

## What Already Exists (Don't Replace, Extend)

- Astro content collections with Zod-validated frontmatter (~40 articles, 6 categories)
- Implicit graph through frontmatter: `relatedConcepts`, `prerequisites`, `relatedFiles`, `technologies`, `diagramRef`
- Architecture Explorer — custom interactive SVG with typed nodes/edges/layers in `architecture-data.ts`
- Curriculum modules with prerequisite ordering (`src/content/knowledge/modules.ts`)
- Labs with DO → OBSERVE → EXPLAIN structure
- Exercises with 4 types: predict, explain, do, debug
- Staged mastery progress: read → checked → practiced → mastered (localStorage)
- Knowledge audit pipeline (`pnpm verify:knowledge`): broken links, cycles, orphan refs, invalid graph nodes
- Mermaid diagrams rendered client-side
- Quality standards enforced in AGENTS.md

## Content Quality Philosophy: Grounded Articles, Not AI Summaries

Articles in this system are AI-generated, which creates a real risk: fluent, confident text that isn't grounded in anything beyond the LLM's training data. Two structural rules prevent this:

**1. Research before writing.** Before writing any article, the agent must find 3-5 authoritative external sources about the concepts the article covers (official docs, specs, RFCs, content by recognized experts). Read them. Use them to inform the writing. This is NOT optional background — the sources shape the article's accuracy and depth.

**2. Inline citations throughout the text.** Every major factual claim, concept explanation, or technical assertion must be supported by an inline hyperlink to the authoritative source at the point where it's used — not just in a references section at the bottom. This makes claims verifiable at the point of assertion and structurally prevents hallucination (fabricated claims don't have URLs).

The result: articles become curated syntheses of authoritative sources connected to your code, not AI summaries of training data. The external references section at the bottom still exists as a collected bibliography, but the inline links are where the real epistemic value lives.

These rules are enforced by audit (inline citation density check in Feature 3) and by the quality pipeline (grounding verification in Feature 5).

## Feature Dependency Graph

```
Feature 1: Graph Extraction (JSON) ─────┬──────────────────────────────────────────────┐
Feature 2: Stats Dashboard ◄────────────┤                                              │
Feature 3: Audit Rules (independent) ───┤                                              │
                                        │                                              │
    ┌── CONTENT REMEDIATION (2-3 weekends) ◄── after Feature 3                         │
    │                                                                                  │
Feature 4: Package Extraction ◄─────────┘ (draws the boundary after core engine)       │
    │                                                                                  │
    ├── Feature 5a: Content Quality Pipeline (Tier A + C)                              │
    ├── Feature 6: Cytoscape.js Visualization ◄──── also needs Feature 1 (graph JSON)  │
    │       └── Feature 6b: E2E Smoke Tests (Playwright) ◄── after Feature 6           │
    │                                                                                  │
    ┌── MINI PHASE 2: USE THE SYSTEM (1-2 weekends) ◄── after Feature 6b               │
    │                                                                                  │
    ├── Feature 7: SKOS Fields (extends engine: schema)                                │
    ├── Feature 8: NetworkX Analysis ◄──── also needs Feature 1 (graph JSON)           │
    ├── Feature 9a: Static Exercise Types (extends engine: schema)                     │
    │                                                                                  │
    │   Feature 10: D2 + Generated Diagrams ◄──────────────────────────────────────────┘
    │       (depends on Feature 1 only — does NOT require Feature 4)                    
    │                                                                                  
    ├── Feature 11: OWL Lab ◄──── depends on Feature 7 (SKOS fields)                   
    │
    ├── Feature 9b: CodeMirror Exercises ◄── depends on 9a (can defer)                  
    ├── Feature 5b: AI Review CLI ◄── depends on 5a (defer until ~80+ articles)         
    │
    └── Feature 12: Project Labs ◄── ALL (the killer feature — uses full infrastructure)
```

## Implementation Order

| # | Feature | Depends On | Estimated Time | Engine or Presentation? |
|---|---------|-----------|----------------|------------------------|
| 1 | Graph extraction → JSON | — | 1 weekend | Engine |
| 2 | Graph stats dashboard | 1 | 2-3 hours | Presentation |
| 3 | 13 new audit rules | — | 1 day | Engine |
| — | **Content remediation** | **3** | **2-3 weekends** | **Fix existing articles to pass new rules** |
| **4** | **Package extraction** | **1, 3** | **1 weekend** | **Draws the boundary** |
| 5a | Content quality pipeline (Tier A + C) | 4 | 1 weekend | Engine (extends package) |
| 6 | Cytoscape.js visualization | 1, 4 | 1 weekend | Presentation (outside package) |
| **6b** | **E2E smoke tests (Playwright)** | **6** | **2-3 hours** | **Quality gate** |
| — | **Mini Phase 2: use the system** | **6b** | **1-2 weekends** | **Write 10-15 articles on a new topic** |
| 7 | SKOS vocabulary fields | 3, 4 | 1 day | Engine (extends package schema) |
| 8 | NetworkX analysis | 1, 4 | 1 weekend | Outside package (Python) |
| 9a | Static exercise types | 4 | 1 weekend | Engine (extends package schema) |
| 10 | D2 + generated diagrams | 1 | 1 weekend | Presentation (outside package) |
| 11 | OWL learning lab | 7 | 1-2 weekends | Content (outside package) |
| 9b | CodeMirror exercises (optional) | 9a | 1 weekend | Engine + presentation |
| 5b | AI review CLI (defer until ~80+ articles) | 5a | 1 weekend | Engine (extends package) |
| **12** | **Project Labs (guided rebuild)** | **All above** | **2-3 weekends** | **Content + schema (the killer feature)** |

**Why package extraction is Feature 4:** After Features 1-3 the core engine exists (schema + graph extraction + audit pipeline). Extracting it into a workspace package at this point forces every subsequent feature to respect the boundary: Features 5a, 7, 9a extend the engine *inside* the package, while Features 6, 8, 10 consume it from *outside*. This prevents accidental coupling and proves the API early.

**Why content remediation comes between Features 3 and 4:** Feature 3 introduces 13 new audit rules. The existing ~40 articles were written before these rules existed. Many will fail. Fixing them requires real work — finding external sources, writing exercises, adding inline citations. Shipping rules without fixing content means the audit pipeline cries wolf on every run. Budget 2-3 weekends. See Feature 3 doc for the detailed remediation plan.

**Why Mini Phase 2 comes after Feature 6b:** After Features 1–6b, the system is usable: you have an explicit graph, stats dashboard, audit pipeline, quality checks, Cytoscape.js visualization, and E2E tests. Spending 1-2 weekends writing 10-15 articles on a new topic (e.g., Node.js HTTP internals) validates the pipeline, populates the graph visualization, breaks the infrastructure-only streak, and provides motivation by demonstrating the system's value. The remaining features (7-12) benefit from having real content to work with.

**Why Features 5 and 9 are split:** Feature 5a (Tier A deterministic checks + Tier C human feedback) is fast and high-value. Feature 5b (AI review CLI) is complex and needs content volume to justify — defer until ~80+ articles. Feature 9a (arrange, compare, trace) is straightforward schema + rendering. Feature 9b (CodeMirror `code` type) is a significant interactive component with new dependencies — ship separately.

**Why Project Labs is Feature 12:** It's the capstone feature — a multi-session guided rebuild of a simplified version of a real system, with every build phase connected to knowledge graph concepts. It uses everything: the graph (concept linking), Cytoscape.js (visualizing what you're learning), SKOS (connecting new concepts to existing vocabulary), exercises (embedded practice), the quality pipeline (validating generated content), and the engine package (schema). Features 1-11 build the instrument; Feature 12 is the first time you play something ambitious on it.

## Per-Session Instructions

Each feature is implemented in its own agent session on a dedicated branch. Start each session with:

> "Read `docs/knowledge-graph-evolution/overview.md` for big picture context. The spec for this feature is `docs/knowledge-graph-evolution/feature-NN-name.md` — it's already researched, specced, and approved. Skip brainstorming and writing-plans. Go straight to implementation. Use verification-before-completion against the acceptance criteria when done."

### Workflow Per Feature

1. **Branch:** Create a feature branch (`git checkout -b feat/NN-feature-name`)
2. **Implement:** Follow the feature doc spec. Write tests alongside implementation.
3. **Verify:** Run the full verification suite before claiming done:
   - `pnpm verify` (typecheck + lint + unit tests)
   - `pnpm verify:knowledge` (knowledge audit pipeline)
   - `pnpm build` (confirm build succeeds)
   - Check all acceptance criteria from the feature doc
4. **Commit:** Commit all changes with a clear message referencing the feature number
5. **Stop.** Do not start the next feature. The human will review and merge, then start a fresh agent session for the next feature.

**Every feature must have tests.** Scripts get unit tests for their core logic. Schema changes get validation tests. Audit rules get per-rule tests. UI features get at minimum a build-success check. The `test-driven-development` skill applies to Features 1, 3, 5 especially, but all features should have some test coverage.

### Skills Guide

**Use during implementation:**
- `verification-before-completion` — every feature, before claiming done
- `systematic-debugging` — when something breaks
- `test-driven-development` — for features that need unit tests (see per-feature notes)
- `finishing-a-development-branch` — after each feature passes verification
- `node` — for TypeScript scripts (--experimental-strip-types, module resolution, package.json)
- `typescript-magician` — for Zod schemas, type definitions, discriminated unions
- `astro` — for Astro pages, content collections, Solid.js islands
- `web-design-guidelines` — for UI features (stats dashboard, graph page, exercise rendering)
- `subagent-driven-development` — for features with many independent subtasks
- `init` — when updating AGENTS.md (ensures high-signal, non-discoverable instructions only)
- `data-visualization` — for Feature 8 (Python/NetworkX chart design)
- `documentation` — for Feature 11 (writing the ontology engineering article)

**Skip (already done or not relevant):**
- `brainstorming` — research already done
- `writing-plans` — the feature doc IS the plan
- `executing-plans` — use `subagent-driven-development` instead when subtasks are independent
- `requesting-code-review` / `receiving-code-review` — solo project
- `deep-research` / `knowledge-synthesis` / `content-creation` — not implementation
- `system-design` — design already done in research
- `vercel-react-best-practices` / `vercel-composition-patterns` — React-specific, project uses Solid.js (different reactivity model, these would produce wrong patterns)
- `caveman` variants, `compress`, `memory-management`, `find-skills`, `writing-skills`, `skill-optimizer`
- `fastify-best-practices`, `postgres-best-practices`, `redis-development`, `resend`, `use-railway`, `snipgrapher`, `nodejs-core` — wrong domain

Per-feature skill recommendations are noted in each feature doc.

## Research Reports (Reference Only)

These features are based on two deep research reports. They're reference material for the human, NOT input for the agent:

- `~/Documents/Domain_Agnostic_Learning_System_Research_20260422/` — theoretical foundations
- `~/Documents/Code_Learning_System_Research_20260422/` — practical implementation recommendations

## Design Philosophy: The Three-Layer Learning Loop

The 12 features are designed around a learning philosophy with three complementary layers:

1. **Build** (Feature 12: Project Labs) — Constructing simplified versions of real systems produces the deepest understanding. Learning by building is the system's core bet.
2. **Connect** (Features 6, 7: Cytoscape + SKOS) — Seeing how concepts relate, discovering hierarchies, exploring the full graph. The big-picture view that makes individual concepts meaningful.
3. **Deepen** (Features 5, 9: Quality Pipeline + Exercises) — Testing understanding through varied exercises, ensuring content quality, and iterating on weak areas.

Every feature should be evaluated against this loop: does it help the learner **build**, **connect**, or **deepen**?

## Mini Phase 2: Validate by Learning (After Feature 6b)

After Features 1–6b are complete, the system is usable: explicit graph, stats dashboard, audit pipeline with 13 rules + quality checks, package extraction, Cytoscape.js visualization, and E2E tests. **Before continuing to Feature 7, spend 1-2 weekends writing 10-15 articles on a new topic.**

Recommended topic: **Node.js HTTP internals** (or any topic that interests you and connects to future pet project features). This mini-cycle serves four purposes:

1. **Validates the pipeline** — Does the audit pipeline catch real problems in fresh content? Do the inline citation rules work in practice? Does the graph extraction handle new content correctly?
2. **Populates the Cytoscape graph** — 50+ nodes makes the visualization meaningful. A graph of 40 nodes barely justifies the investment; 55 nodes starts showing real clusters and structure.
3. **Breaks the infrastructure streak** — Features 1-6b are pure infrastructure. Writing articles shifts the mode from "building the tool" to "using the tool to learn." This prevents the yak-shaving trap where you spend months building without ever learning through the system.
4. **Provides motivation** — Seeing the Cytoscape graph grow, watching audit rules catch issues, and exploring your own knowledge structure is genuinely satisfying. This energy carries you through Features 7-12.

**Scope:** 10-15 articles, 1-2 new curriculum modules, exercises for each article, passing all audit rules. This is content work, not infrastructure work. Use the existing AI agent workflow (AGENTS.md research mandate, inline citations, quality standards).

**After the mini-cycle:** Resume with Feature 7 (SKOS fields). The new content gives SKOS broader/narrower hierarchy real material to organize, and gives NetworkX (Feature 8) a meaningfully larger graph to analyze.

## Phase 2: Use the System to Learn (Post-Feature 12)

After Features 1-12 are complete, the learning system is functional. Before returning to pet project feature development, **use it to study the technologies you'll need next.** This serves three purposes: (a) you learn the tech at depth, (b) you generate 60-80+ articles that stress-test the engine across diverse domains, (c) you validate the API boundaries and multi-project support before extracting.

Recommended project labs (in rough priority order):

1. **"Build a Tiny 3D Scene"** — study Three.js internals (scene graph, WebGL pipeline, matrix transforms, animation loop). Generates articles in a "3D Rendering" domain completely different from SolidJS reactivity. Tests cross-domain SKOS linking.
2. **"Build a Tiny Peer Connection"** — study WebRTC (ICE negotiation, STUN/TURN, SDP, MediaStream API). Generates networking articles. Tests conceptScheme scoping.
3. **"Build a Tiny DOS Emulator"** — study em-dosbox (x86 subset, memory model, display buffer, interrupt handling). Generates systems programming articles. Tests the schema with low-level CS content.
4. **"Build a Tiny JS Runtime"** — study MuJS/DOjS (lexing, parsing, bytecode, GC). Generates language implementation articles. Deepest CS fundamentals coverage.

After 2-3 of these project labs, the knowledge base will have 100-150+ articles across 5+ domains. At that point:
- The engine's API boundaries are proven (they've handled diverse content)
- NetworkX produces meaningful community detection and centrality results
- SKOS cross-domain links are tested (e.g., Three.js render loop ↔ SolidJS reactive rendering ↔ DOS display buffer — all "render loops" at different abstraction levels)
- The audit pipeline has caught real problems across different content types
- You understand the technologies you need for the fun pet project features

THEN extract into a standalone repo (Phase 3) with confidence that the boundaries are right.

## Future Capabilities (Post-Extraction)

The following capabilities were identified in the research but intentionally deferred:

- **Standalone learning system repo** — Create a separate repo that imports the `@playground/knowledge-engine` package and has its own UX. This is the extraction Phase 3 from the research. Do this after Phase 2 stress-testing above.
- **ts-belt FP refactor** — After all 12 features land and the engine API is stable, port the pure data pipelines (audit rules, graph extraction, stats computation) to [ts-belt](https://mobily.github.io/ts-belt/) idioms (`pipe`, `Option`, `Result`, `A.filter/map/flatMap`). Eliminates null-guard noise, improves composability. Low risk, high readability win. Do as a single clean sweep, not mid-stream.
- **Cross-domain transfer surfacing** — When the system covers multiple projects/codebases, surface cross-domain analogies ("dependency injection in your app is structurally similar to middleware in Express"). The `conceptScheme` and `broader`/`narrower` fields lay the groundwork. Requires multi-project content to be meaningful.
- **Spaced repetition scheduling** — Track when concepts were last studied/practiced and surface "due for review" prompts. Simple localStorage implementation. Strong learning science evidence supports this.
- **Hierarchical concept browser** — A sidebar or dedicated UI that lets you browse concepts by `broader`/`narrower` hierarchy (e.g., Architecture Patterns → State Management → Reactivity → Fine-Grained Reactivity).
- **Learning path optimization** — Use NetworkX analysis (Feature 8) to automatically generate optimized learning paths for specific goals ("I want to understand the build pipeline").
- **Exercise-based mastery assessment** — Use `targetConcepts` on exercises (Feature 9) to update mastery based on exercise performance, not just self-reported progress.

## Scaling Guidance: When the Knowledge Base Grows

As new pet project features are added (WebRTC, DOS emulation, Three.js, AI integration, etc.), the knowledge base should grow with them. The existing AGENTS.md mandates knowledge article creation per feature. The architecture handles this automatically: new Markdown files → prebuild regenerates graph JSON → Cytoscape, NetworkX, and audit pipeline pick up new content.

Specific scaling considerations:

**New curriculum modules.** When a new feature domain is added (e.g., networking, emulation, 3D rendering), create a new module in `modules.ts`. Each module needs: a title, a description, a prerequisite ordering relative to other modules, and at least 2 articles assigned to it (enforced by audit rule #8). Module prerequisites should reflect conceptual dependencies: "Networking" probably doesn't require "SolidJS Reactivity," but "3D Desktop Rendering" might require both "SolidJS" and "Three.js Basics."

**Architecture Explorer scaling.** The hand-positioned `architecture-data.ts` will become incomplete as the system grows. Options: (a) split into per-subsystem files (`architecture-data-desktop.ts`, `architecture-data-networking.ts`), (b) accept that the Architecture Explorer shows only the core architecture while Cytoscape shows the full graph, or (c) generate architecture-data from the knowledge graph. Option (b) is recommended initially — the Architecture Explorer becomes a curated "greatest hits" view, not the comprehensive map.

**Cross-feature concept discovery.** After completing a batch of articles for a new feature, run `python3 scripts/analyze-graph.py` and check for disconnected components or clusters with no edges between them. Missing cross-domain links (e.g., Three.js render loop ↔ SolidJS reactive rendering) should be added as `relatedConcepts`. The AI agent workflow should include this check: "After writing all articles for a feature, run NetworkX analysis and verify no new disconnected clusters appeared."

**Category expansion.** If the 7 existing categories become insufficient, new categories can be added to the `category` enum in the schema. Remember to update the word count minimum in audit rule #10 for any new category.
