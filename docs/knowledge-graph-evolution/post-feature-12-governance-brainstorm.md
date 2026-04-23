# Post-Feature-12 Brainstorm: Knowledge Governance, Autogenesis, and Analysis Feedback Loops

_Date: 2026-04-23_

## Purpose of This Note

This document captures the conclusions and recommendations from a brainstorming/system-design discussion about the **next phase after the current 12-feature knowledge-graph evolution plan**.

It is **not** a new approved implementation plan and **not** a replacement for the 12-feature roadmap. It is a summary artifact for a future design session once the current roadmap is complete.

The motivating question was:

> Is the current system building a genuinely useful, future-proof learning pipeline, or are parts of it—especially the Python/NetworkX analysis—currently more diagnostic and visual than operationally valuable?

The desired end state is a system that not only builds and audits a knowledge graph, but also:
- grows with the product,
- enforces knowledge expansion when new product features land,
- uses graph analysis to improve the learning experience,
- and supports automatic or semi-automatic content scaffolding for future domains such as Three.js, WebRTC, and em-dosbox.

---

## Executive Summary

### What exists today

The project already has a **real automated knowledge pipeline**, but it is only the **foundation layer**:

1. Knowledge content + architecture metadata are extracted into `knowledge-graph.json`.
2. The knowledge audit validates the content and graph.
3. Astro consumes the generated graph at build time.
4. CI runs verification and E2E tests.

This pipeline is useful and real.

### What is missing today

The system does **not yet** have:
- a feature-to-knowledge enforcement layer,
- a semi-automatic content generation/scaffolding layer,
- an automated graph-analysis stage in CI,
- or a mechanism that promotes useful structural analysis into actionable governance rules.

### Current role of the Python/NetworkX script

The Python analysis is currently best understood as a **diagnostic/intelligence layer**, not a self-improving pipeline. It can identify:
- central concepts,
- suspicious curriculum structures,
- disconnected clusters,
- and thin-but-important articles.

That is valuable, but at the moment it improves the knowledge graph only **indirectly**, when a human or agent acts on its findings.

### Main recommendation

**Do not rewrite the current 12-feature roadmap midstream.**

Instead:
- finish the current 12-feature plan,
- then add a new follow-on phase focused on **knowledge governance and assisted growth**,
- and do that **before** the next major expansion wave of desktop/product features.

---

## Current Pipeline: What Is Actually Automated?

### Canonical build/audit pipeline (already real)

Today the repo already has a deterministic build path:

```text
knowledge markdown + modules + architecture data
    -> TS graph extraction
    -> src/data/knowledge-graph.json
    -> knowledge audit
    -> Astro build
    -> CI verify/e2e
```

In practice this means:
- `pnpm prebuild` regenerates `knowledge-graph.json`
- `pnpm verify` runs lint, typecheck, unit tests, and `verify:knowledge`
- CI runs `pnpm verify`, `pnpm build`, and E2E tests

This is the **canonical pipeline** and should remain the source of truth.

### What the pipeline does well

It already ensures:
- the graph is regenerated from source content,
- the audit rules are enforced,
- build-time consumption stays aligned,
- and broken knowledge artifacts are caught early.

### What it does not yet do

It does **not** yet ensure:
- that a new product feature produces corresponding knowledge artifacts,
- that structurally suspicious analysis results are surfaced on every change,
- or that centrality/community findings influence authoring priorities or CI behavior.

---

## Current Role of the Python/NetworkX Analysis

### What it is good for

The NetworkX layer is useful for **structural intelligence**:
- PageRank / centrality
- prerequisite depth
- community detection
- disconnected-component detection
- identifying high-traffic low-content articles

These metrics can improve the learning system by helping answer questions like:
- Which concepts deserve the deepest investment?
- Are module boundaries aligned with real graph structure?
- Did a new domain create an isolated island?
- Which articles are bottlenecks in the learning graph but still underdeveloped?

### What it is not doing yet

Right now it does **not** automatically:
- change content,
- fail CI,
- scaffold missing articles/labs,
- or feed results into the audit pipeline.

So the honest framing is:

> The Python analysis is currently **advisory**, not **governing**.

That does not make it fake or useless. It means it is currently an **instrument**, not yet a **feedback loop**.

---

## Does the Python Script Conflict with the TypeScript Graph Builder?

### Short answer

No fundamental conflict exists.

### Current dependency direction

The architecture is currently:

```text
source content
  -> TypeScript extractor
  -> knowledge-graph.json   (source of truth)
  -> Python analyzer
  -> graph-analysis.json    (derived analysis)
```

This is a good separation.

### Recommended responsibility split

- **TypeScript** should remain responsible for:
  - schema,
  - extraction,
  - canonical graph generation,
  - deterministic audit,
  - repo governance rules.

- **Python** should remain responsible for:
  - advanced structural analysis,
  - experimentation with graph algorithms,
  - future learning-path optimization,
  - richer graph intelligence.

### Actual risks to watch

The main risks are not conflict, but:
- **staleness** — if analysis is not rerun when the graph changes,
- **schema drift** — if JSON shape changes and Python falls behind,
- **polyglot maintenance cost** — if too much core logic migrates into the analysis layer.

---

## The Bigger Insight: There Are Really Three Pipelines, Not One

The discussion revealed that the system should be modeled as three layers.

### 1. Canonical knowledge build pipeline

```text
content/code metadata
  -> extraction
  -> graph JSON
  -> audit
  -> site build
```

**Status:** already exists.

**Purpose:** produce correct artifacts deterministically.

### 2. Analysis/intelligence pipeline

```text
knowledge-graph.json
  -> structural analysis
  -> metrics / anomalies / recommendations
```

**Status:** partially exists via NetworkX, but currently manual/advisory.

**Purpose:** identify weak points, central concepts, cluster structure, and improvement opportunities.

### 3. Governance/enforcement pipeline

```text
feature intent/contracts
  + code changes
  + knowledge artifacts
    -> coverage validation
    -> required-artifact checks
    -> merge-time warnings/failures
```

**Status:** largely missing today.

**Purpose:** ensure product evolution and knowledge evolution stay coupled.

This third layer is the most important missing piece.

---

## The Key Missing Capability

The system can currently validate **knowledge quality** and **graph integrity**.

It cannot yet validate **knowledge completeness relative to product evolution**.

That is the gap.

Examples of what the current system cannot reliably enforce:
- “You added a WebRTC subsystem but forgot to add a lab.”
- “You registered a new app but didn’t create any feature article.”
- “You introduced a new technology domain but did not create the corresponding knowledge chain.”
- “You created a disconnected cluster and forgot cross-domain bridges.”

This is the capability that should be designed next.

---

## Recommendation: Keep the 12-Feature Plan Intact, Then Add a Governance Phase

### Why not rewrite the current roadmap?

The current 12-feature plan is still coherent and valuable. It is building the substrate:
- schema,
- extraction,
- audits,
- package boundaries,
- visualization,
- SKOS,
- exercises,
- diagrams,
- labs.

The new concerns raised in this discussion are not replacements for those features. They are the **next-order system** built on top of them.

### Recommended boundary

Do **not** radically alter the 12-feature roadmap now.

Instead:
- finish the current roadmap,
- then add a follow-on phase focused on governance and assisted growth,
- and do that **before** starting the next large product expansion wave (Three.js/WebRTC/em-dosbox/etc.).

### Why this timing matters

If governance is postponed too long, the next feature wave will generate knowledge debt again.

The ideal sequence is:
1. finish the substrate,
2. add governance/autogenesis,
3. then expand into major new product/technology domains.

---

## Suggested Follow-On Features After Feature 12

These are not approved roadmap items yet; they are suggested anchors for a future design session.

### Feature 13 — Knowledge Coverage Contracts

Purpose:
- enforce that new product features produce proportional knowledge artifacts.

Likely responsibilities:
- define expected knowledge expansion per feature,
- validate feature docs against actual artifacts,
- require architecture updates when subsystem changes occur,
- fail or warn when required artifacts are missing.

### Feature 14 — Assisted Knowledge Scaffolding / Draft Generation

Purpose:
- semi-automatically create high-quality scaffolds for new knowledge content.

Likely responsibilities:
- generate article/lab shells,
- prefill frontmatter,
- propose `relatedFiles`, `relatedConcepts`, prerequisites, and module placement,
- create draft exercise placeholders,
- create TODOs for research/citations.

Important principle:
- this should be **assisted**, not fully automatic final content generation.
- the current quality bar requires human/agent grounding in real code and external research.

### Feature 15 — Graph Intelligence in CI + Rule Promotion

Purpose:
- operationalize analysis results.

Likely responsibilities:
- run graph analysis automatically in CI or a report stage,
- surface disconnected clusters and high-value remediation targets,
- classify findings as advisory or enforceable,
- promote proven metrics into audit rules over time.

---

## Strong Recommendation: Make Feature Docs the Contract

The most important design recommendation from this discussion is this:

> Use feature docs as the source of truth for expected knowledge expansion.

### Why this matters

Pure inference from code diffs is weak.

Code can suggest:
- new files,
- new app registrations,
- new technologies,
- new APIs,
- new graph islands.

But it cannot reliably infer intent, complexity, or pedagogical scope.

### Better model

Each feature spec should declare:
- apps/subsystems touched,
- technologies introduced,
- concepts introduced,
- expected knowledge artifacts,
- expected architecture updates,
- expected modules and labs.

Then the governance layer can validate:

> “Did the repo changes satisfy the declared knowledge contract?”

### Recommended source-of-truth model

**Recommendation: A with some B**

- **A. Explicit feature contracts in `docs/features/*.md`** should be the primary source of truth.
- **B. Code-diff and graph-diff heuristics** should be used as secondary detection and safety checks.

This gives the best balance of:
- human intent,
- automation,
- and enforceability.

---

## How Analysis Results Should Be Treated

Not every interesting metric should become a hard failure.

A useful long-term split is:

### Hard deterministic rules
Good candidates for audit failures:
- missing required knowledge artifacts from a feature contract,
- missing architecture update for a declared subsystem change,
- introduced uncovered technology without required article,
- newly introduced disconnected island caused by the change.

### Soft structural warnings
Good as CI/reporting warnings:
- community structure diverges from module boundaries,
- central article remains below quality thresholds,
- prerequisite chain depth suggests curriculum refactor,
- bottleneck concept is underdeveloped.

### Learner-facing recommendations
Should remain advisory:
- what to study next,
- which cluster to deepen,
- which articles are best leverage points.

---

## Long-Term Role of NetworkX in the System

NetworkX becomes truly valuable if it evolves from a dashboard-only tool into a **decision-support engine**.

Its most promising long-term uses are:
- prioritizing which articles to deepen,
- detecting missing cross-domain bridges,
- validating module structure against emergent graph structure,
- identifying bottleneck concepts in the curriculum,
- and later generating optimized learning paths for specific goals.

So the Python layer should be kept, but framed as:

> **graph intelligence**, not just graph visualization.

---

## Future Design Principle for New Technology Waves

For future domains such as:
- Three.js / 3D rendering,
- WebRTC / real-time networking,
- em-dosbox / emulation,

the system should eventually support this loop:

```text
new feature planned
  -> feature doc declares expected knowledge expansion
  -> code ships
  -> knowledge scaffolds/drafts are generated
  -> graph rebuild runs
  -> audit runs
  -> graph intelligence runs
  -> missing or weak artifacts are surfaced
  -> learner gets better graph + better path + better labs
```

That is the future-proof direction.

---

## Final Recommendation

The current 12-feature roadmap should be preserved as the substrate-building phase.

The next major design effort should happen **after Feature 12**, but **before** the next major desktop/product expansion wave.

That future effort should focus on:
1. **knowledge coverage contracts**,
2. **assisted knowledge scaffolding**,
3. **graph intelligence in CI**,
4. and **promotion of useful analysis into governance rules**.

In short:

- The current system is already real and useful.
- The Python analysis is helpful, but currently advisory.
- The key missing capability is governance: tying feature evolution to knowledge evolution.
- The cleanest path is to add a follow-on phase, not rewrite the existing roadmap.

---

## Suggested Starting Question for the Next Design Session

When the governance phase begins, start with this question:

> For knowledge coverage enforcement, should the primary source of truth be explicit feature contracts in `docs/features/*.md`, or mostly inferred automatically from code and graph diffs?

Recommended answer to test first:

> **Explicit feature contracts as the primary source of truth, with code-diff/graph-diff heuristics as secondary safety checks.**
