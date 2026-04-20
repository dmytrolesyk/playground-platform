# Plan: Knowledge Base Article Enrichment

## Status
In Progress

## Goal

Transform the knowledge base from shallow placeholder articles (~8,000 words total, ~33% of planned depth) into a genuine learning system (~30,000+ words) that teaches the codebase, technologies, and tangential CS concepts in depth.

## Problem Statement

The initial seed articles answer "what does this do in our codebase?" but fail to:
- Build mental models (the *why* behind decisions)
- Connect to broader CS/web concepts (transferable knowledge)
- Show edge cases and gotchas (where things break)
- Provide "what if we'd done it differently?" analysis (deepens understanding)
- Include enough visual aids (diagrams, flowcharts, comparison tables)
- Curate meaningful external references (learning paths, not just links)

Current vs. target word counts:

| Category | Current avg | Target range | Gap |
|---|---|---|---|
| Architecture (6 docs) | ~547 | 1500–2500 | ~3× expansion |
| Concepts (7 + 6 new = 13 docs) | ~314 | 1000–1800 | ~4× expansion |
| Technologies (5 docs) | ~310 | 800–1400 | ~3× expansion |
| Features (4 docs) | ~236 | 600–1000 | ~3× expansion |

## Content Quality Standards

Every enriched article must meet these criteria (codified in `docs/features/knowledge-base.md`):

### Structure Requirements
1. **"Why should I care?" opening** — First paragraph explains what this concept enables and why a working engineer needs to understand it
2. **Mental model** — At least one analogy, diagram, or visualization that builds intuition before diving into details
3. **How it works here** — Concrete code from THIS codebase, not generic examples. Reference actual file paths.
4. **Broader context** — History, alternatives, where this pattern appears in the wild. Connect to CS fundamentals.
5. **Edge cases & gotchas** — Where does this break? What's the failure mode? What surprised you?
6. **"What if we'd done it differently?"** — At least one alternative approach and why it was rejected. (Architecture/concept articles)
7. **Mermaid diagram** — At least one per article (flowchart, sequence diagram, comparison, or architecture diagram)
8. **External references** — 3–6 curated links per article, including at least one video/talk when available

### Quality Checklist (per article)
- [ ] Opens with motivation, not definition
- [ ] Has ≥1 Mermaid diagram
- [ ] References actual source files from this codebase
- [ ] Connects to ≥1 broader CS concept
- [ ] Includes ≥1 "what goes wrong without this" scenario
- [ ] Has 3–6 external references with diverse types
- [ ] Meets minimum word count for its category
- [ ] Cross-links to related articles via `relatedConcepts`

### Research Process (mandatory)
Articles are written by AI agents but must be grounded in thorough research:
1. **Read the source code** — open every file in `relatedFiles`, understand the actual implementation, quote real code
2. **Consult official docs** — read current documentation for every technology mentioned; don't rely on training data
3. **Search the web** — find authoritative blog posts, talks, and tutorials; verify external reference URLs exist
4. **Analyze codebase architecture** — read `docs/architecture-guidelines.md`, feature docs, trace real data flows
5. **Read related knowledge articles** — check `relatedConcepts` articles for consistency and cross-reference points
6. **Synthesize across sources** — cross-reference docs, code, and web resources for accuracy
7. **Verify every factual claim** — library sizes, function signatures, CSS behavior, API return types — look it up, don't guess

---

## Implementation Plan

### Wave 1: New Foundational Concept Articles (create 6 new)

These are prerequisites that make the existing articles click. Create them first so enriched articles can reference them.

- [ ] **1.1** `concepts/observer-pattern.md` — The Observer Pattern
  - Pub/sub → Observer → Reactive signals progression
  - Gang of Four origins, event emitters, DOM events as observers
  - Why signals are "Observer Pattern + automatic dependency tracking"
  - Mermaid: observer subscription/notification sequence diagram
  - ~1200 words

- [ ] **1.2** `concepts/javascript-proxies.md` — JavaScript Proxy Objects
  - What Proxy/Reflect do, trap handlers
  - How SolidJS stores use Proxy for fine-grained tracking
  - Comparison: Proxy (SolidJS/Vue 3) vs Object.defineProperty (Vue 2) vs dirty checking (Angular 1)
  - Mermaid: proxy trap flow diagram
  - ~1200 words

- [ ] **1.3** `concepts/event-loop-and-microtasks.md` — The Event Loop & Microtasks
  - Call stack, task queue, microtask queue, rendering steps
  - Why `batch()` works, how effects schedule, Promise timing
  - requestAnimationFrame's place in the loop
  - Jake Archibald's talk as primary reference
  - Mermaid: event loop cycle diagram
  - ~1400 words

- [ ] **1.4** `concepts/browser-rendering-pipeline.md` — The Browser Rendering Pipeline
  - Parse → Style → Layout → Paint → Composite (full pipeline)
  - Layer promotion, stacking contexts, GPU rasterization
  - Why some CSS properties are "free" and others cause reflow
  - How DevTools Performance panel shows this
  - Mermaid: rendering pipeline stages with which CSS properties trigger what
  - ~1400 words

- [ ] **1.5** `concepts/module-systems-and-bundling.md` — Module Systems & Bundling
  - CommonJS → ESM progression, static vs dynamic imports
  - How bundlers (Rollup/Vite) analyze the import graph
  - How `import()` becomes a network request at runtime
  - Tree shaking, chunk splitting, the cost of dependencies
  - Mermaid: import graph → chunk splitting diagram
  - ~1200 words

- [ ] **1.6** `concepts/progressive-enhancement.md` — Progressive Enhancement
  - Core content without JS → enhanced experience with JS
  - How Astro's static-first + islands is progressive enhancement by architecture
  - The `<noscript>` fallback in this project
  - Why "works without JS for basic content" is a project goal
  - Mermaid: enhancement layers diagram
  - ~1000 words

### Wave 2: Enrich Architecture Articles (expand 6 existing)

These are the most important articles — they teach how the system works.

- [ ] **2.1** `architecture/overview.md` — The Big Picture (696 → ~2000 words)
  - Add: detailed component hierarchy diagram (Mermaid)
  - Add: data flow sequence diagram (build time → runtime)
  - Add: "what if we'd used React?" analysis
  - Add: "what if we'd used multiple islands?" failure scenario
  - Add: deployment architecture (Astro → Node → Railway)
  - Add: performance budget breakdown
  - Expand external references (Astro architecture docs, Islands article)

- [ ] **2.2** `architecture/window-manager.md` — How Windows Work (797 → ~2200 words)
  - Add: state machine diagram for window lifecycle (Mermaid)
  - Add: drag sequence diagram showing pointer events + store updates + DOM changes
  - Add: resize edge detection algorithm explanation with visual
  - Add: "what goes wrong without pointer capture" demo scenario
  - Add: comparison to how real OS window managers work (X11/Wayland concepts)
  - Add: performance analysis (what makes drag feel smooth)
  - Expand edge cases: iframe interaction during drag, mobile vs desktop behavior

- [ ] **2.3** `architecture/app-registry.md` — The Registry Pattern (783 → ~2000 words)
  - Add: comparison to plugin systems (VS Code extensions, webpack plugins, Express middleware)
  - Add: the Open/Closed Principle connection
  - Add: sequence diagram showing "what happens when you double-click an icon" end-to-end
  - Add: singleton vs multi-instance decision tree
  - Add: "how would you add a Settings app?" walkthrough
  - Add: trade-offs of the registry approach (discoverability, type safety)

- [ ] **2.4** `architecture/state-management.md` — The Desktop Store (356 → ~1800 words)
  - Add: comparison table (SolidJS store vs Redux vs Zustand vs MobX)
  - Add: proxy-based reactivity deep dive (how reads are tracked)
  - Add: `produce()` explanation (Immer-like API for nested mutations)
  - Add: diagram showing "which components re-render when state.windows['browser-1'].x changes"
  - Add: why a single store, not per-window stores
  - Add: actions as the public API — command pattern connection
  - Add: debugging strategies (how to inspect store state)

- [ ] **2.5** `architecture/data-flow.md` — From Markdown to Screen (362 → ~1500 words)
  - Add: complete pipeline diagram (Mermaid sequence diagram, 4 stages)
  - Add: Zod schema validation — what it catches and when
  - Add: innerHTML security considerations and why it's safe here
  - Add: "what if we'd used runtime Markdown parsing?" cost analysis
  - Add: comparison to CMS-based approaches (Contentful, Sanity)
  - Add: how the knowledge collection follows the same pattern

- [ ] **2.6** `architecture/contact-system.md` — The Contact System (289 → ~1500 words)
  - Add: complete request flow diagram (form → validation → API → Resend → email)
  - Add: honeypot anti-spam explanation
  - Add: SSR vs static rendering decision (why only this route needs SSR)
  - Add: rate limiting strategies
  - Add: the Vite `import.meta.env` inlining deep dive (build time vs runtime)
  - Add: Docker build implications diagram

### Wave 3: Enrich Concept Articles (expand 7 existing)

- [ ] **3.1** `concepts/fine-grained-reactivity.md` (377 → ~1500 words)
  - Add: subscription graph visualization (Mermaid)
  - Add: automatic dependency tracking explained step by step
  - Add: cleanup and disposal — what happens when a component unmounts
  - Add: comparison to MobX, Vue 3, Knockout (same lineage)
  - Add: "diamond problem" in reactive graphs
  - Add: glitch-free propagation explanation
  - Reference new `observer-pattern.md` and `javascript-proxies.md`

- [ ] **3.2** `concepts/signals-vs-vdom.md` (317 → ~1400 words)
  - Add: side-by-side update trace (React re-render vs SolidJS signal)
  - Add: Mermaid comparison diagram showing update paths
  - Add: when VDOM wins (large structural changes, server components)
  - Add: the Svelte approach (compiled reactivity — a third way)
  - Add: real performance implications for this project (benchmark-style analysis)
  - Add: Rich Harris "Rethinking Reactivity" talk as reference

- [ ] **3.3** `concepts/islands-architecture.md` (325 → ~1400 words)
  - Add: the serialization boundary problem
  - Add: framework comparison (Astro vs Fresh vs Qwik vs Next.js partial hydration)
  - Add: progressive hydration strategies diagram
  - Add: "why not multiple islands in our case" with concrete failure scenario
  - Add: islands vs SPAs vs MPAs comparison table

- [ ] **3.4** `concepts/pointer-events-and-capture.md` (296 → ~1200 words)
  - Add: event propagation model (capture → target → bubble) diagram
  - Add: coalesced events and getCoalescedEvents() for high-frequency input
  - Add: touch vs mouse vs pen differences
  - Add: implicit vs explicit pointer capture
  - Add: "try moving your mouse really fast" interactive mental model

- [ ] **3.5** `concepts/compositor-pattern.md` (260 → ~1200 words)
  - Add: full rendering pipeline diagram (referencing new `browser-rendering-pipeline.md`)
  - Add: layer promotion rules and stacking contexts
  - Add: the GPU rasterization process
  - Add: DevTools "Layers" panel walkthrough
  - Add: `will-change` gotchas (memory cost, over-promotion)
  - Add: comparison: `transform` vs `left/top` vs Web Animations API

- [ ] **3.6** `concepts/inversion-of-control.md` (299 → ~1400 words)
  - Add: IoC vs DI vs Service Locator — they're different things
  - Add: connection to SOLID principles (Dependency Inversion)
  - Add: real-world examples beyond this project (Express middleware, React hooks, VS Code extensions)
  - Add: the Framework vs Library distinction (who calls whom)
  - Add: Mermaid diagram showing control flow direction reversal

- [ ] **3.7** `concepts/lazy-loading-and-code-splitting.md` (323 → ~1200 words)
  - Add: how Rollup/Vite decide chunk boundaries
  - Add: waterfall problem and preloading strategies
  - Add: `<link rel="modulepreload">` for predicted user paths
  - Add: Suspense boundary placement strategy
  - Add: diagram showing the chunk graph for this project
  - Reference new `module-systems-and-bundling.md`

### Wave 4: Enrich Technology Articles (expand 5 existing)

- [ ] **4.1** `technologies/solidjs.md` (346 → ~1200 words)
  - Add: "SolidJS mental model for React developers" section (top gotchas)
  - Add: component lifecycle comparison (React vs Solid)
  - Add: control flow components explained (`<For>`, `<Show>`, `<Switch>`, `<Index>`)
  - Add: `onMount` vs `createEffect` — when to use which
  - Add: Ryan Carniato talks as references

- [ ] **4.2** `technologies/astro.md` (290 → ~1100 words)
  - Add: Astro 6 changes (hybrid by default, content layer)
  - Add: build output explained (what's in `dist/`)
  - Add: the adapter system (Node, Vercel, Cloudflare)
  - Add: content collections v2 (glob loader pattern)
  - Add: comparison to Next.js / Remix / Nuxt for this use case

- [ ] **4.3** `technologies/98css.md` (299 → ~1000 words)
  - Add: how 98.css works internally (CSS custom properties, box-shadow tricks, border-style: outset/inset)
  - Add: the 3D border technique explained
  - Add: accessibility implications (focus styles, color contrast)
  - Add: alternatives (XP.css, 7.css) and why 98 was chosen

- [ ] **4.4** `technologies/xterm.md` (317 → ~1200 words)
  - Add: terminal emulation concepts (ANSI escape codes, PTY model)
  - Add: how xterm.js renders (Canvas API, WebGL renderer)
  - Add: addon architecture (fit, webgl, search, web-links)
  - Add: our custom command handler architecture in more detail
  - Add: how keyboard capture works end-to-end

- [ ] **4.5** `technologies/resend.md` (296 → ~1000 words)
  - Add: how email delivery works (MX records, SPF, DKIM, DMARC)
  - Add: transactional vs marketing email distinction
  - Add: Resend vs SendGrid vs SES comparison
  - Add: domain verification process
  - Add: idempotency keys for retry safety

### Wave 5: Enrich Feature Articles (expand 4 existing)

- [ ] **5.1** `features/cv-viewer.md` (227 → ~800 words)
  - Add: the build-time serialization pattern in detail
  - Add: innerHTML security model (why it's safe: build-time generated, no user input)
  - Add: the fake toolbar design decisions (aesthetic vs function)
  - Add: how CV sections map from Markdown to on-screen sections
  - Add: print-friendly layout and PDF generation pipeline

- [ ] **5.2** `features/terminal.md` (263 → ~900 words)
  - Add: command handler architecture (command map pattern)
  - Add: how xterm.js key handling works (onKey vs onData)
  - Add: how `open <app>` reaches into the desktop store
  - Add: ANSI escape codes used for colors/formatting
  - Add: comparison to a real shell (bash architecture)

- [ ] **5.3** `features/snake-game.md` (205 → ~900 words)
  - Add: game loop pattern (requestAnimationFrame vs setInterval, fixed timestep)
  - Add: collision detection algorithm
  - Add: separation of concerns (pure engine vs framework wrapper)
  - Add: canvas rendering basics (clearRect, fillRect, coordinate system)
  - Add: how keyboard capture prevents arrow keys from scrolling

- [ ] **5.4** `features/crt-monitor-frame.md` (249 → ~900 words)
  - Add: how CRT displays actually work (electron gun, phosphor dots, scanlines)
  - Add: CSS techniques deep dive (repeating-linear-gradient, box-shadow stacking, pseudo-elements)
  - Add: `pointer-events: none` and its implications
  - Add: performance impact analysis (are the overlays expensive?)
  - Add: other skeuomorphic CSS effects in the wild

### Wave 6: Update Architecture Data & Cross-Links

- [ ] **6.1** Update `architecture-data.ts` — add nodes for new concept articles
- [ ] **6.2** Update all `relatedConcepts` frontmatter to cross-link new articles
- [ ] **6.3** Update "Start Here" reading path in `/learn/index.astro` to include foundational concepts
- [ ] **6.4** Verify all builds pass with `pnpm verify`

---

## Execution Strategy

**Waves 1–3 are highest priority** — they create the foundational concepts and expand the architecture articles that teach the system.

**Each wave is independently mergeable** — complete a wave, run `pnpm verify`, commit.

**Estimated total**: ~30,000–35,000 words across 28 articles (22 existing + 6 new).

## Dependencies

- Mermaid rendering already works (client-side via LearnLayout.astro script)
- No new runtime dependencies needed
- No schema changes needed (current Zod schema supports all fields)
