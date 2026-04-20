# Feature: Knowledge Base & Learning System

## Status
Complete

## Motivation

This codebase was built almost entirely by AI (Claude/Opus). It works perfectly, but the human developer doesn't deeply understand the architecture, patterns, or technologies used (SolidJS, Astro islands, fine-grained reactivity, the registry pattern, etc.). Since this is a personal platform for experimentation and learning, that knowledge gap undermines the whole purpose.

The knowledge base is a structured learning system that:
1. Documents the entire architecture with interactive diagrams
2. Explains every technology, pattern, and concept used
3. Provides deep-dive articles with external references
4. Grows automatically with every new feature
5. Eventually becomes a blog / online presence (deferred)

## Architecture Fit

This feature spans multiple layers:

- **New Astro content collection** (`knowledge`) — follows the exact same pattern as the existing `cv` collection. Build-time rendering, Zod schema validation, static routes.
- **New Astro routes** (`/learn/*`) — static pages with a new reading-optimized layout (not 98.css). Uses Astro's file-based routing with `[...slug]` catch-all.
- **Two new registered apps** — `LibraryApp` (iframe-based reader) and `ArchitectureExplorer` (interactive SVG diagram). Both follow the standard `registerApp()` pattern with `lazy()` loading.
- **Extended feature development process** — `docs/feature-development.md` gains a "Knowledge Entries" section in the feature doc template.

No changes to Desktop, WindowManager, Taskbar, StartMenu, or the store. No new runtime dependencies for the content/reading layer. The Architecture Explorer is pure SolidJS + SVG (no charting library).

## Technical Design

### 1. Content Architecture

#### New Content Collection: `knowledge`

```
src/content/knowledge/
├── architecture/           ← how OUR system is built
│   ├── overview.md
│   ├── window-manager.md
│   ├── app-registry.md
│   ├── state-management.md
│   ├── data-flow.md
│   └── contact-system.md
│
├── concepts/               ← transferable CS/web concepts
│   ├── fine-grained-reactivity.md
│   ├── signals-vs-vdom.md
│   ├── islands-architecture.md
│   ├── pointer-events-and-capture.md
│   ├── compositor-pattern.md
│   ├── inversion-of-control.md
│   └── lazy-loading-and-code-splitting.md
│
├── technologies/           ← the tools themselves
│   ├── solidjs.md
│   ├── astro.md
│   ├── 98css.md
│   ├── xterm.md
│   └── resend.md
│
└── features/               ← per-feature learning (grows with platform)
    ├── cv-viewer.md
    ├── terminal.md
    ├── snake-game.md
    └── crt-monitor-frame.md
```

#### Frontmatter Schema

```typescript
const knowledge = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(['architecture', 'concept', 'technology', 'feature']),
    summary: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    relatedConcepts: z.array(z.string()).default([]),
    relatedFiles: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    externalReferences: z.array(z.object({
      title: z.string(),
      url: z.string(),
      type: z.enum(['article', 'video', 'docs', 'talk', 'repo']),
    })).default([]),
    diagramRef: z.string().optional(),
    order: z.number().optional(),
    dateAdded: z.date().optional(),
    lastUpdated: z.date().optional(),
  }),
});
```

Key design decisions:
- **Relationships by slug** — `relatedConcepts: ['fine-grained-reactivity', 'solidjs']`. Build-time validation catches broken links.
- **`relatedFiles`** — points to actual source paths (e.g., `src/components/desktop/Window.tsx`).
- **`diagramRef`** — ties a doc to a node in the Architecture Explorer. Click node → open doc.
- **`externalReferences` with types** — enables filtering by article/video/docs/talk/repo.
- **Categories map to directories** — simple, discoverable.

### 2. Reading Interface (`/learn/*` routes)

Static Astro pages rendered at build time from the `knowledge` collection.

#### Route Structure

```
/learn                                → index: categories, "start here" path, search/filter
/learn/[...slug]                      → article page (e.g., /learn/architecture/overview)
```

#### Page Layout

Separate layout from the main desktop — clean, modern, reading-optimized. NOT 98.css-styled, but retro-flavored to stay on brand.

```
┌──────────────────────────────────────────────────┐
│  ← Back to Desktop    Knowledge Base    🔍 Search │
├────────────┬─────────────────────────────────────┤
│            │                                      │
│ Sidebar    │  Article content                     │
│ - Category │  - Title + summary                   │
│   nav with │  - Difficulty badge                  │
│   collapse │  - Full markdown content             │
│ - Current  │  - Code excerpts from relatedFiles   │
│   article  │  - Mermaid diagrams (rendered to SVG) │
│   highlight│                                      │
│            │  Related section                     │
│ ────────── │  - Related concepts (from frontmatter)│
│ Related    │  - Related source files              │
│ files from │  - External references by type       │
│ frontmatter│    📄 Articles  🎥 Videos  📚 Docs   │
│            │                                      │
└────────────┴─────────────────────────────────────┘
```

Design decisions:
- **Sidebar navigation** with collapsible categories — always visible, shows position in knowledge graph.
- **"Back to Desktop"** link — one click returns to the Win95 experience.
- **No 98.css** — separate `LearnLayout.astro` optimized for reading.
- **Static rendering** — all pages prerendered at build time, zero JS needed for reading.
- **Mermaid diagrams** in markdown → rendered to inline SVG at build time.

### 3. Desktop Integration: Library App

A registered desktop app that bridges the retro desktop and the reading experience.

#### Two Modes

**Embedded browser mode** — iframe pointing to `/learn/*`. Full reading experience inside a Win95 window. Address bar shows current URL, navigation buttons work.

**Tree-view index mode** — 98.css tree component listing all knowledge entries by category. Click → navigates the embedded iframe.

```
┌─ Knowledge Base ──────────────────────── _ □ ×─┐
│ 📍 /learn/architecture/overview                 │
│ ← Back  → Fwd  ↻ Reload  📖 Index  🔗 New Tab  │
├─────────────────────────────────────────────────┤
│                                                  │
│  (iframe: /learn/architecture/overview)          │
│                                                  │
│  Full reading experience rendered inside         │
│  the Win95 window                                │
│                                                  │
├─────────────────────────────────────────────────┤
│ Status: Document: Done                           │
└──────────────────────────────────────────────────┘
```

"New Tab" button opens the current page in an actual browser tab for full-width reading.

#### Registry Integration

```typescript
registerApp({
  id: 'library',
  title: 'Knowledge Base',
  icon: '/icons/help_icon.png',
  component: lazy(() => import('./library/LibraryApp')),
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 700, height: 500 },
});
```

#### Component Structure

```
src/components/desktop/apps/library/
├── LibraryApp.tsx          ← main component, manages mode toggle + iframe src
├── LibraryToolbar.tsx      ← address bar, nav buttons, index/new-tab buttons
├── LibraryTreeView.tsx     ← 98.css tree of all knowledge entries
└── styles/
    └── library-app.css
```

### 4. Interactive Architecture Explorer

A SolidJS app rendering an interactive SVG diagram of the entire system.

#### Interactions

- **Click a node** → detail panel slides in with summary + link to full `/learn/` article
- **Hover a node** → connected edges highlight, showing dependencies and data flow
- **Toggle layers** → show/hide edge types: data flow, dependencies, renders, lazy-load boundaries

**Deferred to polish pass (after first use):**
- Click a category group → all nodes in that group highlight
- Zoom into subsystems → click "App Registry" → expanded view showing internal flow

#### Data Structure

```typescript
// architecture-data.ts

export interface ArchNode {
  id: string;                    // matches diagramRef in knowledge frontmatter
  label: string;
  category: 'astro' | 'solidjs' | 'registry' | 'app' | 'css' | 'infrastructure';
  x: number;
  y: number;
  description: string;
  knowledgeSlug?: string;        // links to /learn/<slug>
  sourceFiles?: string[];
  children?: string[];           // for collapsible subsystems
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
  type: 'data-flow' | 'dependency' | 'renders' | 'lazy-load';
}

export interface ArchLayer {
  id: string;
  label: string;
  edgeType: ArchEdge['type'];
  color: string;
  defaultVisible: boolean;
}
```

#### Diagram Layout (Reference)

```
┌─────────────────────────────────────────────────────┐
│  ASTRO (Build Time)                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Content   │→│ index.astro  │→│ <script#cv>  │  │
│  │Collections│  │              │  │ JSON payload  │  │
│  └──────────┘  └──────┬───────┘  └──────┬───────┘  │
│                        │                  │          │
│  ┌──────────────┐     │    ┌─────────────┐          │
│  │ /api/contact │     │    │ /learn/*    │          │
│  │ (SSR)        │     │    │ (static)    │          │
│  └──────────────┘     │    └─────────────┘          │
├───────────────────────┼─────────┼───────────────────┤
│  SOLIDJS ISLAND       ▼         │                    │
│  ┌─────────────────────────┐    │                    │
│  │ Desktop                 │    │                    │
│  │ ├── DesktopIconGrid ◄───┼────┼── APP_REGISTRY    │
│  │ ├── WindowManager       │    │      ▲             │
│  │ │   └── Window ×N       │    │      │             │
│  │ │       └── WindowBody ─┼────┼──────┘ resolves    │
│  │ └── Taskbar ◄───────────┼────┼── APP_REGISTRY    │
│  └──────────┬──────────────┘    │                    │
│             │                    │                    │
│    DesktopContext (Store)        │                    │
│    ┌─────────────────┐          │                    │
│    │ windows{}       │          │                    │
│    │ windowOrder[]   │          │                    │
│    │ nextZIndex      │          │                    │
│    │ isMobile        │          │                    │
│    └─────────────────┘          │                    │
├─────────────────────────────────┼───────────────────┤
│  APPS (lazy loaded)             │                    │
│  ┌────────┐ ┌────────┐ ┌──────┐│┌──────┐ ┌───────┐ │
│  │Browser │ │Explorer│ │Email ││ │Term  │ │Snake  │ │
│  │ (CV)   │ │(Export)│ │      ││ │xterm │ │canvas │ │
│  └───┬────┘ └────────┘ └──┬───┘│└──────┘ └───────┘ │
│      │                     │    │                    │
│      ▼ reads JSON          ▼    │                    │
│   cv-data.ts          Resend API│                    │
├─────────────────────────────────┼───────────────────┤
│  98.CSS + CRT Frame (Pure CSS)  │                    │
│  Semantic classes + layout only │                    │
└─────────────────────────────────┴───────────────────┘
```

#### Explorer ↔ Library Connection

Clicking a node in the explorer opens the Library app navigated to the relevant article:

```typescript
actions.openWindow('library', { initialUrl: `/learn/${node.knowledgeSlug}` });
```

#### Component Structure

```
src/components/desktop/apps/architecture-explorer/
├── ArchitectureExplorer.tsx     ← main app component
├── architecture-data.ts         ← nodes, edges, layers
├── ExplorerCanvas.tsx           ← SVG rendering, pan/zoom
├── ExplorerNode.tsx             ← individual clickable node
├── ExplorerEdge.tsx             ← animated connection line
├── ExplorerPanel.tsx            ← slide-in detail panel
├── LayerToggle.tsx              ← checkboxes to show/hide edge types
└── styles/
    └── architecture-explorer.css
```

#### Registry Integration

```typescript
registerApp({
  id: 'architecture-explorer',
  title: 'Architecture Explorer',
  icon: '/icons/blueprint_icon.png',
  component: lazy(() => import('./architecture-explorer/ArchitectureExplorer')),
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 900, height: 600 },
  resizable: true,
});
```

### 5. Living Process — Feature Development Integration

#### Extended Feature Doc Template

New section added to the template in `docs/feature-development.md`:

```markdown
## Knowledge Entries

New entries to create:
- [ ] `architecture/<slug>.md` — ...
- [ ] `concepts/<slug>.md` — ...
- [ ] `technologies/<slug>.md` — ...

Existing entries to update:
- [ ] `architecture/overview.md` — ...

Architecture explorer updates:
- [ ] Add node(s): ...
- [ ] Add edge(s): ...
```

#### Extended Phase 3 (Finalize) Checklist

Added to the existing Phase 3 steps:

- Write/update knowledge entries listed in the feature doc's "Knowledge Entries" section.
- Update `architecture-data.ts` — add new nodes and edges for the feature.
- Update `architecture/overview.md` if the feature changes the big picture.
- (Optional) Draft blog entry.

#### Authorship Modes

- **Collaborative mode (default):** Developer and AI have a conversation about the concepts. The conversation IS the learning. Then distill into a markdown doc together.
- **Fast mode:** Developer says "just draft it." AI generates comprehensive drafts. Developer reviews, edits, learns through critical reading.

Both produce the same artifact: a markdown file in `src/content/knowledge/`.

### 6. Initial Content Plan

#### "Start Here" Reading Path (recommended order)

1. `architecture/overview.md` — "The Big Picture"
2. `technologies/astro.md` — "What Astro Does and Why"
3. `technologies/solidjs.md` — "SolidJS — Signals, Not Virtual DOM"
4. `architecture/data-flow.md` — "From Markdown to Screen"
5. `architecture/state-management.md` — "The Desktop Store"
6. `architecture/window-manager.md` — "How Windows Work"
7. `architecture/app-registry.md` — "The Registry Pattern"
8. `concepts/fine-grained-reactivity.md` — "Why This Matters"
9. `technologies/98css.md` — "98.css — Aesthetic Without Custom CSS"
10. `features/crt-monitor-frame.md` — "The CRT Frame — Pure CSS Wizardry"

#### Content Scope

| Category | Count | Depth | Authorship |
|---|---|---|---|
| Architecture | 6 docs | Deep (~1500-2500 words) — code excerpts, diagrams, decision rationale, trade-off analysis | Collaborative |
| Concepts | 13 docs (7 original + 6 foundational) | Transferable (~1000-1800 words) — what, why, history, broader context, external refs | Mix |
| Technologies | 5 docs | Reference + "how we use it" + alternatives comparison (~800-1400 words) | Fast-mode drafts |
| Features | 4 docs | Walkthrough linking to arch + concepts (~600-1000 words) | Fast-mode drafts |
| **Total** | **28 docs** | **~30,000-40,000 words** | Rolling effort |

### 7. Content Quality Standards

Every knowledge article must meet these standards. This applies to initial content, enrichments, and all future articles created as part of new features.

#### Article Structure (all categories)

1. **"Why should I care?" opening** — The first paragraph explains what this concept enables and why a working engineer needs to understand it. Never open with a dry definition.
2. **Mental model** — At least one analogy, diagram, or visualization that builds intuition *before* diving into implementation details. The reader should have an "aha" moment before seeing code.
3. **How it works here** — Concrete code from THIS codebase with actual file paths. Not generic examples — real references to `src/components/desktop/Window.tsx`, etc.
4. **Broader context** — History, alternatives, where this pattern appears in the wild. Connect to CS fundamentals. Every concept exists in a lineage — show the lineage.
5. **Edge cases & gotchas** — Where does this break? What's the failure mode? What surprised you? These are often the most valuable parts of an article.
6. **"What if we'd done it differently?"** — At least one alternative approach and why it was rejected. Understanding rejected alternatives deepens understanding of chosen ones. (Required for architecture/concept articles; optional for technology/feature.)
7. **Mermaid diagram** — At least one per article. Flowcharts for processes, sequence diagrams for interactions, comparison diagrams for trade-offs. Diagrams are rendered client-side by Mermaid.
8. **External references** — 3–6 curated links per article. Must include diverse types (articles, docs, videos/talks, repos). Prioritize: (a) the canonical/foundational resource, (b) the best explanatory video/talk, (c) official docs, (d) deep-dive articles.

#### Category-Specific Requirements

**Architecture articles** (1500–2500 words):
- Must include at least one sequence diagram or data flow diagram
- Must reference actual source files and explain non-obvious implementation choices
- Must include a "What if we'd done it differently?" section
- Must connect decisions back to the architectural principles from `docs/architecture-guidelines.md`

**Concept articles** (1000–1800 words):
- Must explain the concept's history and lineage (where did this idea come from?)
- Must show how the concept appears beyond this project (2+ real-world examples)
- Must include at least one "before/after" or "with/without" comparison
- Must link to related concepts in other articles via `relatedConcepts`

**Technology articles** (800–1400 words):
- Must include a comparison to at least 2 alternatives and why this was chosen
- Must cover the most common gotchas/pitfalls
- Must show both "how it works in general" and "how we use it specifically"
- Must link to official docs AND at least one tutorial/talk

**Feature articles** (600–1000 words):
- Must walk through the most interesting implementation detail (not just describe what it does)
- Must link to the architecture/concept articles that explain the patterns used
- Must include at least one diagram (component structure, data flow, or interaction flow)

#### Quality Checklist (applied to every article before merge)

- [ ] Opens with motivation, not definition
- [ ] Has ≥1 Mermaid diagram
- [ ] References actual source files from this codebase
- [ ] Connects to ≥1 broader CS concept or pattern
- [ ] Includes ≥1 "what goes wrong without this" scenario
- [ ] Has 3–6 external references with diverse types (articles, docs, video/talk)
- [ ] Meets minimum word count for its category
- [ ] Cross-links to related articles via `relatedConcepts` frontmatter
- [ ] All referenced file paths (`relatedFiles`) exist in the current codebase

#### Research Process (mandatory for AI-authored content)

Most knowledge articles are written by AI agents. To ensure accuracy and depth, the agent must conduct thorough research before writing — never generate content from training data alone.

1. **Read the source code.** Open and read every file listed in `relatedFiles`. Understand the *actual* implementation — variable names, function signatures, control flow, edge cases. Quote real code, don't paraphrase from memory.
2. **Consult official documentation.** For every technology mentioned, read the current documentation pages. APIs change between versions; training data goes stale. Verify function signatures, configuration options, and behavior against the actual docs.
3. **Search the web.** Find authoritative blog posts, conference talks, and tutorials. Prioritize primary sources (framework authors, spec editors, core contributors). Use search to discover the best external references — don't link to URLs from memory without verifying they exist and are relevant.
4. **Analyze the codebase architecture.** Read `docs/architecture-guidelines.md`, related feature docs in `docs/features/`, and trace actual data flows through the code. Understand *why* decisions were made, not just *what* was built.
5. **Read related knowledge articles.** Before writing, read the articles listed in `relatedConcepts` to avoid contradictions and find natural cross-reference points.
6. **Synthesize across sources.** Cross-reference documentation, source code, web resources, and architecture docs to produce accurate, nuanced explanations. If sources disagree, investigate and note the discrepancy.
7. **Verify every factual claim.** If you state that a library is X KB, check it. If you say a function returns a specific type, read the source. If you claim a CSS property triggers layout, verify against browser rendering docs. Do not guess.

## Resolved Questions

- **Icon assets:** Create new pixel-art icons (32×32) for both Library and Architecture Explorer apps.
- **Mermaid rendering:** Use a remark plugin (`remark-mermaid` or similar) for build-time SVG rendering from the start.
- **Search on /learn:** Category browsing only for now. Static search (Pagefind) deferred as a separate feature.
- **Mobile /learn routes:** Mobile users go directly to `/learn/*` routes — bypass the Library app (iframe-in-window is awkward on mobile). Desktop icon on mobile opens `/learn/` in a new tab or navigates directly.

## Implementation Plan

### Phase 1: Content Foundation
- [x] Set up `knowledge` content collection with Zod schema in `src/content.config.ts`
- [x] Create `LearnLayout.astro` — reading-optimized layout (not 98.css)
- [x] Create `/learn/index.astro` — category index with "Start Here" path
- [x] Create `/learn/[...slug].astro` — article page with sidebar, related links, external refs
- [x] Create 2-3 initial architecture docs as seed content (overview, window-manager, app-registry)
- [x] Verify build works, routes render correctly

### Phase 2: Desktop Integration — Library App
- [x] Create `LibraryApp.tsx` with iframe browser mode + toolbar
- [x] Create `LibraryTreeView.tsx` with 98.css tree component
- [x] Register in `app-manifest.ts` with `lazy()` loading
- [x] Wire "New Tab" button to open current URL in browser tab
- [x] Test iframe navigation, back/forward, address bar sync

### Phase 3: Architecture Explorer
- [x] Create `architecture-data.ts` with full node/edge/layer definitions
- [x] Create `ExplorerCanvas.tsx` — SVG rendering with viewBox pan/zoom
- [x] Create `ExplorerNode.tsx` — clickable nodes with hover highlighting
- [x] Create `ExplorerEdge.tsx` — animated edges with layer-based visibility
- [x] Create `ExplorerPanel.tsx` — slide-in detail panel with "Open in Library" link
- [x] Create `LayerToggle.tsx` — edge type visibility controls
- [x] Register in `app-manifest.ts` with `lazy()` loading
- [x] Wire node clicks to open Library app at relevant `/learn/` URL

### Phase 4: Complete Initial Content
- [x] Write remaining architecture docs (state-management, data-flow, contact-system)
- [x] Write concept docs (fine-grained-reactivity, signals-vs-vdom, islands-architecture, pointer-events, compositor-pattern, inversion-of-control, lazy-loading)
- [x] Write technology docs (solidjs, astro, 98css, xterm, resend)
- [x] Write feature docs (cv-viewer, terminal, snake-game, crt-monitor-frame)
- [x] Wire all `diagramRef` values to corresponding explorer nodes
- [x] Verify all `relatedConcepts` slugs resolve correctly

### Phase 5: Process Integration
- [x] Update `docs/feature-development.md` — add "Knowledge Entries" section to template
- [x] Update `docs/feature-development.md` — add knowledgebase steps to Phase 3 (Finalize)
- [x] Update `AGENTS.md` — add knowledgebase rules (content must be in knowledge collection, architecture-data.ts must stay in sync, etc.)

### Deviations
- **rehype-mermaid removed** — The plugin requires Playwright for all strategies (including `pre-mermaid`). Replaced with client-side mermaid rendering: a script in `LearnLayout.astro` converts `<pre><code class="language-mermaid">` blocks to `<pre class="mermaid">` and calls `mermaid.run()`.
- **Biome overrides added** — SVG interactive elements in the Architecture Explorer trigger false-positive a11y rules (`noInteractiveElementToNoninteractiveRole`, `useSemanticElements`, `noStaticElementInteractions`). Added a biome.json override for `**/architecture-explorer/**`.

### Future (Not In Scope)
- Blog system as another content collection + routes + desktop app
- Remotion animations explaining complex concepts
- Pagefind or similar static search integration
- Auto-generated dependency graphs from code analysis
