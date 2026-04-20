# Feature: Knowledge Base & Learning System

## Status
Design

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
| Architecture | 6 docs | Deep (~1000-2000 words) — code excerpts, diagrams, decision rationale | Collaborative |
| Concepts | 7 docs | Transferable (~800-1500 words) — what, why, external refs | Mix |
| Technologies | 5 docs | Reference + "how we use it" (~600-1200 words) | Fast-mode drafts |
| Features | 4 docs | Walkthrough linking to arch + concepts (~500-1000 words) | Fast-mode drafts |
| **Total** | **22 docs** | **~20,000-30,000 words** | Rolling effort |

## Resolved Questions

- **Icon assets:** Create new pixel-art icons (32×32) for both Library and Architecture Explorer apps.
- **Mermaid rendering:** Use a remark plugin (`remark-mermaid` or similar) for build-time SVG rendering from the start.
- **Search on /learn:** Category browsing only for now. Static search (Pagefind) deferred as a separate feature.
- **Mobile /learn routes:** Mobile users go directly to `/learn/*` routes — bypass the Library app (iframe-in-window is awkward on mobile). Desktop icon on mobile opens `/learn/` in a new tab or navigates directly.

## Implementation Plan

### Phase 1: Content Foundation
- [ ] Set up `knowledge` content collection with Zod schema in `src/content.config.ts`
- [ ] Create `LearnLayout.astro` — reading-optimized layout (not 98.css)
- [ ] Create `/learn/index.astro` — category index with "Start Here" path
- [ ] Create `/learn/[...slug].astro` — article page with sidebar, related links, external refs
- [ ] Create 2-3 initial architecture docs as seed content (overview, window-manager, app-registry)
- [ ] Verify build works, routes render correctly

### Phase 2: Desktop Integration — Library App
- [ ] Create `LibraryApp.tsx` with iframe browser mode + toolbar
- [ ] Create `LibraryTreeView.tsx` with 98.css tree component
- [ ] Register in `app-manifest.ts` with `lazy()` loading
- [ ] Wire "New Tab" button to open current URL in browser tab
- [ ] Test iframe navigation, back/forward, address bar sync

### Phase 3: Architecture Explorer
- [ ] Create `architecture-data.ts` with full node/edge/layer definitions
- [ ] Create `ExplorerCanvas.tsx` — SVG rendering with viewBox pan/zoom
- [ ] Create `ExplorerNode.tsx` — clickable nodes with hover highlighting
- [ ] Create `ExplorerEdge.tsx` — animated edges with layer-based visibility
- [ ] Create `ExplorerPanel.tsx` — slide-in detail panel with "Open in Library" link
- [ ] Create `LayerToggle.tsx` — edge type visibility controls
- [ ] Register in `app-manifest.ts` with `lazy()` loading
- [ ] Wire node clicks to open Library app at relevant `/learn/` URL

### Phase 4: Complete Initial Content
- [ ] Write remaining architecture docs (state-management, data-flow, contact-system)
- [ ] Write concept docs (fine-grained-reactivity, signals-vs-vdom, islands-architecture, pointer-events, compositor-pattern, inversion-of-control, lazy-loading)
- [ ] Write technology docs (solidjs, astro, 98css, xterm, resend)
- [ ] Write feature docs (cv-viewer, terminal, snake-game, crt-monitor-frame)
- [ ] Wire all `diagramRef` values to corresponding explorer nodes
- [ ] Verify all `relatedConcepts` slugs resolve correctly

### Phase 5: Process Integration
- [ ] Update `docs/feature-development.md` — add "Knowledge Entries" section to template
- [ ] Update `docs/feature-development.md` — add knowledgebase steps to Phase 3 (Finalize)
- [ ] Update `AGENTS.md` — add knowledgebase rules (content must be in knowledge collection, architecture-data.ts must stay in sync, etc.)

### Future (Not In Scope)
- Blog system as another content collection + routes + desktop app
- Remotion animations explaining complex concepts
- Pagefind or similar static search integration
- Auto-generated dependency graphs from code analysis
