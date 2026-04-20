# Feature: Knowledge Base v2 — From Documentation to Learning System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the knowledge base from a well-written technical documentation system into an active, individualized learning platform with exercises, labs, CS fundamentals, structured curriculum, and progression tracking.

**Architecture:** Extends the existing `knowledge` content collection with new categories (`lab`, `cs-fundamentals`), new frontmatter fields (prerequisites, learning objectives, exercises), a localStorage-based progress tracker on `/learn`, and updated article quality standards. No new runtime dependencies for core content — all static HTML. Optional Anki export as a build script.

**Tech Stack:** Astro content collections (existing), Zod schema (extended), SolidJS (progress tracking widget), localStorage, Mermaid (existing).

---

## Status
Complete

## Motivation

The v1 knowledge base (28 articles, ~36K words) is excellent documentation. Every article has diagrams, external references, real code from the codebase, and "what if we'd done it differently" sections. But documentation is passive — you read it and forget 80% within a week.

The human developer's goal is not to have good docs. It's to **become a rockstar engineer** — someone who deeply understands the technologies, patterns, and CS fundamentals behind the code, not just the code itself. Since the code is AI-written, the knowledge base is the primary mechanism for the human to actually learn what the AI built and WHY.

### What v1 does well (keep all of this)
- Quality standards (§7) — motivation opening, diagrams, real code, external refs
- Four categories (architecture, concept, technology, feature) 
- Cross-references via `relatedConcepts`
- Dual access: `/learn/*` static routes + Library app iframe + Architecture Explorer
- "Start Here" reading path
- Research process (§7) for AI-authored content

### What v1 is missing
1. **Active learning** — no exercises, no self-assessment, nothing that forces you to verify understanding
2. **CS fundamentals** — concepts only go as deep as "things used in this project" but miss the computer science foundations that make an engineer strong regardless of framework
3. **Hands-on labs** — the codebase is a perfect laboratory but no guided experiments exist
4. **Structured curriculum** — "Start Here" is a flat list, not a learning path with prerequisites, objectives, and checkpoints
5. **Progression tracking** — no way to know what you've read, what you've mastered, what's next
6. **Retention mechanisms** — no spaced repetition, no review prompts
7. **Future-proofing** — no clear process for how new features (WebRTC, em-dosbox, DOjS, WebLLM, Three.js) generate knowledge content that fits the improved system

---

## Architecture Fit

### What stays the same
- Content collection, Zod schema, `/learn/*` routes, LearnLayout, Library app, Architecture Explorer
- All 28 existing articles remain as-is (they're already good)
- Article quality standards from §7 remain the baseline

### What changes
- **Zod schema extended** — new optional fields: `prerequisites`, `learningObjectives`, `exercises`, `estimatedMinutes`
- **Two new categories** — `lab` and `cs-fundamentals` added to the category enum
- **Content collection gains new directories** — `src/content/knowledge/labs/` and `src/content/knowledge/cs-fundamentals/`
- **`/learn/index.astro` redesigned** — from flat list to structured curriculum with modules, progress indicators
- **Progress tracking** — a small SolidJS island (or vanilla JS) on `/learn` pages that saves read/completed state to localStorage
- **Feature development process updated** — `docs/feature-development.md` Phase 3 gains detailed knowledge expansion requirements including labs and CS fundamentals
- **`AGENTS.md` updated** — new rules for knowledge content creation

### What's deferred
- Anki flashcard export (future build script, not in this plan)
- Full gamification (XP, streaks, achievements) — too much UI work for now
- AI-generated quizzes — interesting but premature

---

## Technical Design

### 1. Extended Frontmatter Schema

```typescript
const knowledge = defineCollection({
  schema: z.object({
    // --- existing fields (unchanged) ---
    title: z.string(),
    category: z.enum([
      'architecture', 'concept', 'technology', 'feature',
      'lab', 'cs-fundamentals',   // NEW
    ]),
    summary: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    relatedConcepts: z.array(z.string()).default([]),
    relatedFiles: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    externalReferences: z.array(z.object({
      title: z.string(),
      url: z.string(),
      type: z.enum(['article', 'video', 'docs', 'talk', 'repo', 'book']),  // added 'book'
    })).default([]),
    diagramRef: z.string().optional(),
    order: z.number().optional(),
    dateAdded: z.date().optional(),
    lastUpdated: z.date().optional(),

    // --- NEW fields ---
    prerequisites: z.array(z.string()).default([]),
    // Slugs of articles that should be read before this one.
    // Enables dependency graph for curriculum ordering.

    learningObjectives: z.array(z.string()).default([]),
    // What you should be able to DO after reading this article.
    // Phrased as actions: "Explain...", "Predict...", "Build...", "Debug..."

    exercises: z.array(z.object({
      question: z.string(),
      hint: z.string().optional(),
      answer: z.string(),
      type: z.enum(['predict', 'explain', 'do', 'debug']).default('explain'),
      // predict: "What will happen if..."
      // explain: "Why does..."
      // do: "Open DevTools and..."
      // debug: "This code has a bug..."
    })).default([]),

    estimatedMinutes: z.number().optional(),
    // How long this article takes to read + do exercises.

    module: z.string().optional(),
    // Which curriculum module this belongs to (e.g., "foundation", "reactivity", "performance").
    // Used for grouping in the learning path.

    moduleOrder: z.number().optional(),
    // Order within the module.
  }),
});
```

### 2. New Content Directories

```
src/content/knowledge/
├── architecture/           ← existing (6 articles)
├── concepts/               ← existing (13 articles)  
├── technologies/           ← existing (5 articles)
├── features/               ← existing (4 articles)
├── cs-fundamentals/        ← NEW
│   ├── hash-maps-and-lookup.md
│   ├── trees-and-traversal.md
│   ├── memory-management-and-gc.md
│   ├── concurrency-models.md
│   ├── type-systems.md
│   └── networking-fundamentals.md
└── labs/                   ← NEW
    ├── break-reactivity.md
    ├── measure-compositor-performance.md
    ├── build-an-app-from-scratch.md
    ├── trace-a-request.md
    └── create-a-memory-leak.md
```

### 3. Curriculum Modules

Articles are grouped into modules via the `module` frontmatter field. Each module has a clear learning objective and a checkpoint.

```
Module 1: "The Foundation" (~2 hours)
  Objective: Explain the 3-layer architecture and trace data from Markdown to screen
  Articles: overview → astro → data-flow → progressive-enhancement
  Checkpoint: Can you draw the build pipeline from memory?

Module 2: "Why SolidJS?" (~3 hours)  
  Objective: Explain fine-grained reactivity and predict what re-renders when state changes
  Articles: solidjs → fine-grained-reactivity → signals-vs-vdom → observer-pattern → javascript-proxies
  CS depth: cs-fundamentals/hash-maps → cs-fundamentals/trees → cs-fundamentals/memory-management
  Lab: labs/break-reactivity
  Checkpoint: Predict what happens when you call setState — then verify with SolidJS DevTools

Module 3: "The Window Manager" (~2.5 hours)
  Objective: Understand drag mechanics, compositor optimization, and pointer capture
  Articles: window-manager → pointer-events → compositor-pattern → browser-rendering-pipeline
  Lab: labs/measure-compositor-performance
  Checkpoint: Explain why transform beats left/top, with profiling evidence

Module 4: "Extensibility" (~1.5 hours)
  Objective: Build a new app using the registry pattern, end to end
  Articles: app-registry → inversion-of-control → lazy-loading → module-systems
  Lab: labs/build-an-app-from-scratch
  Checkpoint: You've built and registered a working app with tests

Module 5: "The Full Stack" (~2 hours)
  Objective: Trace a request from browser to email inbox
  Articles: contact-system → resend → islands-architecture
  CS depth: cs-fundamentals/networking-fundamentals
  Lab: labs/trace-a-request
  Checkpoint: Explain every hop of a contact form submission

Module 6: "Aesthetics & Performance" (~1.5 hours)
  Objective: Understand the CSS strategy and CRT frame implementation
  Articles: 98css → crt-monitor-frame → event-loop-and-microtasks
  Lab: labs/create-a-memory-leak
  Checkpoint: Find and fix a deliberate memory leak

Module 7+: (grows with new features)
  Each new feature (WebRTC, em-dosbox, DOjS, WebLLM, Three.js) spawns a new module.
```

### 4. "Check Your Understanding" — Exercise Format

Every article gets 2-4 exercises appended at the end, rendered from the `exercises` frontmatter array. The exercises use a collapsible `<details>` pattern:

```html
<section class="exercises">
  <h2>🧪 Check Your Understanding</h2>
  
  <div class="exercise exercise--predict">
    <p class="exercise__question">
      <strong>Predict:</strong> If you write `const title = props.window.title` 
      at the top of a SolidJS component, will the title update when the 
      window is renamed? Why or why not?
    </p>
    <details>
      <summary>Show hint</summary>
      <p>Think about when the component function runs in SolidJS vs React.</p>
    </details>
    <details>
      <summary>Show answer</summary>
      <p>No — the component function runs once. `const title` captures the 
      value at creation time. To maintain reactivity, access `props.window.title` 
      inside a JSX expression or a createMemo/createEffect.</p>
    </details>
  </div>
</section>
```

Exercise types serve different cognitive levels:
- **predict** — Forces you to build a mental model and test it ("What will happen if...")
- **explain** — Forces you to articulate understanding ("Why does X work this way?")
- **do** — Hands-on DevTools/code tasks ("Open the Layers panel and...")
- **debug** — Applies understanding to broken code ("This component has a bug...")

### 5. Labs — Guided Experiments

Labs are a new content category with their own structure requirements:

```markdown
---
title: "Lab: Break Reactivity in 5 Ways"
category: lab
summary: "Deliberately break SolidJS reactivity, observe what happens, then fix it."
difficulty: intermediate
prerequisites:
  - concepts/fine-grained-reactivity
  - technologies/solidjs
  - concepts/javascript-proxies
relatedFiles:
  - src/components/desktop/Window.tsx
  - src/components/desktop/store/desktop-store.ts
estimatedMinutes: 45
module: reactivity
moduleOrder: 99
learningObjectives:
  - "Identify 5 common ways to accidentally break SolidJS reactivity"
  - "Use SolidJS DevTools to diagnose broken reactive chains"  
  - "Fix each broken pattern and explain why the fix works"
exercises: []  # Labs ARE the exercise — no separate exercises section
---

## Setup
(exact steps to create a throwaway branch and test file)

## Experiment 1: Destructuring Props
(what to do, what to observe, what it means)

## Experiment 2: Early Return Before Signal Read
...

## Experiment 3: Async After Await
...

## Experiment 4: Accessing Store Outside Tracking Scope
...

## Experiment 5: Stale Closure in setTimeout
...

## Wrap-Up
(connect back to the theory articles, summarize mental model)
```

Labs quality standards:
- Must have exact setup instructions (branch, files to create/modify)
- Each experiment: DO step → OBSERVE step → EXPLAIN step
- Must link back to the theory articles that explain the underlying concepts
- Must include cleanup/reset instructions
- Estimated time must be realistic (measured, not guessed)

### 6. CS Fundamentals — Connecting Theory to Practice

CS fundamentals articles follow the same quality bar as concept articles (1000-1800 words) but have a distinct structure:

1. **Why this matters for a working engineer** — not academic motivation
2. **The concept explained from scratch** — assume no CS degree
3. **Where it appears in THIS codebase** — concrete file paths and code
4. **Where it appears everywhere** — 2-3 examples from the wider world
5. **The performance/correctness implications** — why getting this wrong causes bugs
6. **Deeper rabbit holes** — links to go further (Big-O analysis, academic papers, textbooks)

Example article: `cs-fundamentals/hash-maps-and-lookup.md`
- YOUR codebase: `Record<string, WindowState>` in `desktop-store.ts` — this IS a hash map. O(1) window lookup by ID is why `focusWindow(id)` is instant, not O(n).
- The wider world: database indexes, DNS lookup, object property access in V8
- Performance: what happens when the hash function is bad (collision chains, O(n) degradation)
- Rabbit holes: hash collision attacks on web servers, V8's hidden classes

### 7. Progress Tracking

A lightweight localStorage-based system. No database, no accounts.

```typescript
interface LearningProgress {
  articlesRead: Record<string, {
    firstRead: string;    // ISO date
    lastRead: string;     // ISO date
    completed: boolean;   // user marked as "understood"
  }>;
  modulesCompleted: string[];
  lastActiveModule: string;
}
```

Implementation: A small `<script>` on each `/learn/[...slug].astro` page that:
1. On page load: marks the article as "read" (saves timestamp)
2. Renders a "Mark as understood ✓" button at the bottom
3. On the `/learn/index.astro` page: renders progress bars per module

This is vanilla JS in the Astro page, NOT a SolidJS island. It's progressive enhancement — the knowledge base works perfectly without it.

### 8. Updated `/learn/index.astro`

The index page is restructured from a flat list to a curriculum view:

```
┌──────────────────────────────────────────────────┐
│  Knowledge Base                                   │
│                                                   │
│  📊 Your Progress: 12/28 articles · 2/6 modules  │
│                                                   │
│  ─── Learning Path ───                            │
│                                                   │
│  Module 1: The Foundation          ████░░ 4/6     │
│  ~2 hours · Trace data from Markdown to screen    │
│  → overview ✓ → astro ✓ → data-flow → ...        │
│                                                   │
│  Module 2: Why SolidJS?            ██░░░░ 2/8     │
│  ~3 hours · Predict what re-renders               │
│  🔒 Requires: Module 1                            │
│  → solidjs ✓ → fine-grained... ✓ → signals... →  │
│                                                   │
│  Module 3: The Window Manager      ░░░░░░ 0/5     │
│  ~2.5 hours · Drag, compositor, pointer capture   │
│  🔒 Requires: Modules 1 & 2                       │
│                                                   │
│  ─── Browse by Category ───                       │
│  (existing category lists remain below)           │
│                                                   │
│  ─── Labs ───                                     │
│  🧪 Break Reactivity (45 min)                     │
│  🧪 Measure Compositor (30 min)                   │
│  🧪 Build an App (60 min)                         │
│  ...                                              │
└──────────────────────────────────────────────────┘
```

### 9. Future Feature Integration Process

When a new feature is added (WebRTC, em-dosbox, DOjS, WebLLM, Three.js, etc.), the knowledge expansion follows this checklist:

#### Mandatory knowledge outputs per feature:
1. **Feature article** (`features/<name>.md`) — walkthrough of the most interesting implementation detail
2. **Technology article(s)** (`technologies/<name>.md`) — for each new technology/library introduced
3. **CS fundamentals article(s)** (`cs-fundamentals/<name>.md`) — for any foundational CS concepts the feature relies on that aren't already covered
4. **Concept article(s)** (`concepts/<name>.md`) — for any new patterns or architectural concepts
5. **Lab** (`labs/<name>.md`) — at least one hands-on experiment per feature
6. **Exercises** — 2-4 exercises added to each new article
7. **Module definition** — new feature spawns a new curriculum module (or extends an existing one)
8. **Architecture explorer update** — new nodes and edges in `architecture-data.ts`
9. **Prerequisites wired** — new articles specify which existing articles are prerequisites
10. **Blog entry** (optional but encouraged) — public-facing writeup linking to knowledge articles

#### Example: WebRTC Video Chat feature would produce:
- `features/video-chat.md` — the retro video effects pipeline, SolidJS integration
- `technologies/webrtc.md` — WebRTC API, STUN/TURN, ICE candidates, SDP
- `cs-fundamentals/networking-protocols.md` — UDP vs TCP, NAT traversal, peer-to-peer
- `cs-fundamentals/media-processing.md` — video codecs, canvas pixel manipulation, requestVideoFrameCallback
- `concepts/peer-to-peer-architecture.md` — P2P vs client-server, signaling, DHTs
- `labs/webrtc-connection.md` — "Establish a WebRTC connection between two tabs and inspect every SDP exchange"
- New module: "Real-Time Communication" (~3 hours)

#### Example: em-dosbox + DOjS + WebLLM would produce:
- `features/dos-emulator.md`, `features/dojs-environment.md`, `features/ai-game-builder.md`
- `technologies/emscripten-wasm.md` — compiling C to WebAssembly, memory model, emscripten FS
- `technologies/webllm.md` — running LLMs in browser, WebGPU, quantization, GGUF format
- `cs-fundamentals/virtual-machines-and-emulation.md` — CPU emulation, instruction sets, x86 basics
- `cs-fundamentals/compilers-and-interpreters.md` — parsing, ASTs, how DOjS interprets JavaScript
- `concepts/wasm-memory-model.md` — linear memory, shared buffers, crossing the JS-WASM boundary
- `labs/wasm-debugging.md` — "Inspect emscripten memory in DevTools, trace a DOS syscall"
- `labs/prompt-engineering-for-code.md` — "Get WebLLM to generate a working DOjS game, iteratively"
- New modules: "Emulation & WASM" (~3 hours), "AI in the Browser" (~2 hours)

---

## Quality Standards Update (extends §7 from v1)

### All existing standards remain. Additionally:

#### Exercise standards (all articles)
- Every article (except labs) must have 2-4 exercises in the `exercises` frontmatter
- At least one exercise must be type `predict` or `do` (not just `explain`)
- Answers must be thorough — not just "yes/no" but full explanations
- `do` exercises must include exact DevTools/CLI steps

#### Lab standards
- Estimated time must be realistic (45-90 minutes)
- Must have exact setup and cleanup instructions
- Each experiment: DO → OBSERVE → EXPLAIN structure
- Must link back to ≥2 theory articles
- Must include "what to try next" / extension ideas

#### CS fundamentals standards (1000-1800 words)
- Must open with a real-world engineering scenario, not academic definition
- Must show where the concept appears in THIS codebase (file paths, code)
- Must include at least one performance/correctness implication
- Must provide "deeper rabbit holes" section for further learning
- Must include book references (added 'book' to external ref types)

#### Prerequisites standards
- Every non-Module-1 article should specify `prerequisites`
- Prerequisites must form a DAG (no cycles)
- The `/learn` index must show which articles are "unlocked" based on progress

#### Learning objectives standards
- Every article should have 2-4 `learningObjectives`
- Objectives must use action verbs: Explain, Predict, Build, Debug, Compare, Trace
- Objectives are displayed at the top of the article and referenced by exercises

---

## Implementation Plan

### Phase 1: Schema & Infrastructure

- [ ] Extend Zod schema in `src/content.config.ts` with new fields (`prerequisites`, `learningObjectives`, `exercises`, `estimatedMinutes`, `module`, `moduleOrder`) and new categories (`lab`, `cs-fundamentals`) and new external ref type (`book`)
- [ ] Verify build still passes with existing articles (new fields are all optional/defaulted)
- [ ] Update `[...slug].astro` to render learning objectives at top of article
- [ ] Update `[...slug].astro` to render exercises section at bottom with `<details>` collapse pattern
- [ ] Update `[...slug].astro` to render prerequisites as "Read first" links
- [ ] Update `[...slug].astro` to render estimated reading time
- [ ] Add progress tracking `<script>` to `[...slug].astro` — localStorage read/write, "Mark as understood" button
- [ ] Add exercise and learning-objective styles to `src/styles/learn.css`
- [ ] Verify build, test manually

### Phase 2: Curriculum Structure on `/learn`

- [ ] Define module metadata structure (could be a JSON file or derived from article frontmatter)
- [ ] Redesign `/learn/index.astro` — module-based curriculum view with progress bars
- [ ] Add "Browse by Category" section below curriculum (preserves existing navigation)
- [ ] Add "Labs" section to index
- [ ] Add progress summary header ("12/28 articles · 2/6 modules")
- [ ] Wire progress tracking from localStorage into index page rendering
- [ ] Update sidebar on `[...slug].astro` to show module context (previous/next in module)
- [ ] Verify build, test navigation flow

### Phase 3: Enrich Existing Articles

- [ ] Add `module`, `moduleOrder`, `prerequisites`, `learningObjectives`, `estimatedMinutes` to all 28 existing articles
- [ ] Add 2-4 `exercises` to each existing article (this is the biggest content task — ~80-112 exercises total)
- [ ] Update `relatedConcepts` to also reference new cs-fundamentals articles (once they exist)
- [ ] Verify build, spot-check exercise rendering

### Phase 4: CS Fundamentals Articles

- [ ] `cs-fundamentals/hash-maps-and-lookup.md` — Record<string, WindowState>, V8 hidden classes, database indexes
- [ ] `cs-fundamentals/trees-and-traversal.md` — DOM tree, component tree, AST, BFS/DFS
- [ ] `cs-fundamentals/memory-management-and-gc.md` — JS garbage collection, closures as retention, onCleanup, WeakRef
- [ ] `cs-fundamentals/concurrency-models.md` — single-threaded event loop, Web Workers, compositor thread, SharedArrayBuffer
- [ ] `cs-fundamentals/type-systems.md` — structural vs nominal typing, generics, type narrowing, TypeScript's approach
- [ ] `cs-fundamentals/networking-fundamentals.md` — HTTP lifecycle, DNS, TLS, the full path of a Resend email
- [ ] Wire prerequisites from existing articles to these new ones where appropriate
- [ ] Verify build

### Phase 5: Lab Articles

- [ ] `labs/break-reactivity.md` — 5 ways to break SolidJS reactivity, observe, fix
- [ ] `labs/measure-compositor-performance.md` — transform vs left/top, DevTools profiling
- [ ] `labs/build-an-app-from-scratch.md` — Build a Calculator app with TDD, registry pattern
- [ ] `labs/trace-a-request.md` — Follow a contact form submission through every layer
- [ ] `labs/create-a-memory-leak.md` — Deliberate leak in SolidJS component, detect with DevTools, fix
- [ ] Wire prerequisites from labs to their theory articles
- [ ] Verify build

### Phase 6: Architecture Explorer Update

- [ ] Add nodes for `cs-fundamentals` and `labs` categories in `architecture-data.ts`
- [ ] Add a "Knowledge System" group node that shows how content collection → routes → Library app connects
- [ ] Verify explorer still renders correctly

### Phase 7: Documentation Updates

- [ ] Update `docs/features/knowledge-base.md` — set status to "v2 In Progress", add v2 sections (or reference this doc)
- [ ] Update `docs/feature-development.md` — expand Phase 3 knowledge requirements with lab, exercises, CS fundamentals, module assignment
- [ ] Update `AGENTS.md` — add rules for knowledge expansion when building new features
- [ ] Verify build, run `pnpm verify`

### Phase 8: Process Validation — Dry Run

- [ ] Pick one upcoming feature (e.g., the simplest planned one) and draft its knowledge expansion plan following the new process
- [ ] Verify the process produces the right outputs: feature article + tech articles + CS fundamentals + lab + exercises + module + architecture explorer nodes
- [ ] Adjust the process docs if the dry run reveals friction

---

## Open Questions

- **Module prerequisites: strict or advisory?** Strict means articles are visually "locked" until prerequisites are marked as understood. Advisory means they're shown as "recommended" but still accessible. Recommendation: advisory (locking creates friction; we want to encourage exploration, not gate it).
- **Exercise rendering: frontmatter or in-body?** Frontmatter is structured data (good for export, validation) but awkward for long code blocks. In-body with a special markdown convention (e.g., `:::exercise`) is more ergonomic. Recommendation: start with frontmatter for short exercises; if they need multi-line code blocks, put them in the article body with a conventional heading (`## 🧪 Check Your Understanding`).
- **Lab branches: throwaway or committed?** Labs that modify code should ideally use a throwaway git branch. Should the lab instructions include `git stash` / branch management? Recommendation: yes, every lab starts with `git checkout -b lab/<name>` and ends with `git checkout - && git branch -D lab/<name>`.

---

## Deviations from v1

This document does not replace `docs/features/knowledge-base.md`. That doc describes the v1 system (which remains the foundation). This doc describes the evolution from v1 → v2. Once complete, the v1 doc's status becomes "Superseded by v2" and this doc becomes the reference.

---

## Future (Not In Scope for v2)

- Anki flashcard export build script (generate `.apkg` from exercises)
- Gamification (XP, streaks, achievements, leaderboard against yourself)
- AI-powered quiz generation (use WebLLM to generate new exercises)
- Video walkthroughs embedded in articles
- Collaborative learning — share progress with others
- Full-text search (Pagefind integration — separate feature)
- Auto-generated dependency graphs from actual import analysis
