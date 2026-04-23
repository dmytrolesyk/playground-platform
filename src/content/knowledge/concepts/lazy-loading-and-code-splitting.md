---
title: "Lazy Loading and Code Splitting"
category: concept
summary: "How dynamic import() and SolidJS lazy() keep the initial bundle small by loading heavy apps on demand."
difficulty: beginner
prefLabel: "Lazy Loading & Code Splitting"
altLabels:
  - "dynamic import"
  - "code splitting"
  - "lazy loading"
  - "bundle splitting"
  - "on-demand loading"
broader:
  - concepts/islands-architecture
narrower: []
relatedConcepts:
  - concepts/inversion-of-control
  - concepts/module-systems-and-bundling
  - concepts/browser-rendering-pipeline
technologies:
  - solidjs
  - astro
order: 7
dateAdded: 2026-04-20
lastUpdated: 2026-04-21
externalReferences:
  - title: "Dynamic import() — MDN Web Docs"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import"
    type: docs
  - title: "SolidJS lazy() API"
    url: "https://docs.solidjs.com/reference/component-apis/lazy"
    type: docs
  - title: "Code Splitting — Vite"
    url: "https://vite.dev/guide/features.html#async-chunk-loading-optimization"
    type: docs
  - title: "Reduce JavaScript payloads with code splitting — web.dev"
    url: "https://web.dev/articles/reduce-javascript-payloads-with-code-splitting"
    type: article
  - title: "Code splitting — MDN Web Docs"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Code_splitting"
    type: docs
module: extensibility
moduleOrder: 3
estimatedMinutes: 12
prerequisites:
  - architecture/app-registry
learningObjectives:
  - "Explain how dynamic import() splits code at bundler boundaries"
  - "Describe how SolidJS lazy() wraps dynamic import with Suspense integration"
  - "Identify which apps in this codebase are lazy-loaded and why"
exercises:
  - question: "If you remove lazy() from the TerminalApp import and use a regular static import instead, what happens to the initial page load?"
    type: predict
    hint: "xterm.js is about 300KB. Think about what goes into the initial bundle."
    answer: "The entire xterm.js library (~300KB) gets bundled into the initial JavaScript payload, even though most users never open the terminal. The initial page load gets 300KB heavier, and the browser must parse and compile all of xterm.js before the desktop becomes interactive. With lazy(), xterm.js is split into a separate chunk that loads only when the user clicks the Terminal icon."
  - question: "Open the browser's Network tab (JS filter), click the Terminal icon on the desktop, and observe what loads. What files appear that weren't there before?"
    type: do
    hint: "Look for new JavaScript chunks that appear after the click."
    answer: "You'll see one or more new JS chunks load after clicking the Terminal icon. These contain the TerminalApp component and the xterm.js library. The chunk names are hashed (e.g., TerminalApp-abc123.js). Before the click, these files weren't loaded. The Suspense fallback shows a loading indicator while these chunks download and parse. This is code splitting in action."
  - question: "Why does the Suspense fallback show during lazy loading instead of a blank screen?"
    type: explain
    answer: "SolidJS lazy() returns a component that throws a Promise during its first render (before the chunk loads). The nearest <Suspense> boundary catches this Promise and renders its fallback content while the Promise is pending. When the chunk finishes loading, the Promise resolves and Suspense re-renders with the actual component. Without Suspense, the thrown Promise would propagate up and crash the app."
---

## Why Should I Care?

xterm.js is ~300KB. If it loaded on page startup, the desktop would take seconds to become interactive — even for users who never open the terminal. Code splitting solves this: heavy code is extracted into separate chunks that load on demand, keeping the initial bundle at ~35KB. Understanding this pattern explains why the window shell renders instantly (its code is already loaded) while the app content shows a loading indicator (its chunk is downloading).

## The Problem: Bundle Bloat

Without [code splitting](https://developer.mozilla.org/en-US/docs/Glossary/Code_splitting), every `import` at the top of a file adds to the main bundle — the code that downloads before the page is usable:

```typescript
// ❌ All of these load on page startup
import { TerminalApp } from './TerminalApp';   // +300KB (xterm.js)
import { SnakeGame } from './games/Snake';      // +20KB
import { LibraryApp } from './library/LibraryApp'; // +5KB
import { ArchitectureExplorer } from './architecture-explorer/ArchitectureExplorer'; // +15KB
// Main bundle: ~35KB (desktop) + 340KB (apps) = ~375KB
```

Time to interactive would increase from <1.5s to potentially 3-4s on mobile connections.

## The Solution: Dynamic import() + lazy()

Heavy apps are wrapped in [`lazy()`](https://docs.solidjs.com/reference/component-apis/lazy) in `src/components/desktop/apps/app-manifest.ts`:

```typescript
const TerminalApp = lazy(() =>
  import('./TerminalApp').then(m => ({ default: m.TerminalApp }))
);
const SnakeGame = lazy(() =>
  import('./games/Snake').then(m => ({ default: m.SnakeGame }))
);
```

This tells the bundler ([Vite/Rollup](https://vite.dev/guide/features.html#async-chunk-loading-optimization)) to split each app and its dependencies into a separate chunk file. The chunk only downloads when the user first opens the app.

## How It Works at Runtime

```mermaid
sequenceDiagram
    participant User
    participant Icon as Desktop Icon
    participant Store as Desktop Store
    participant WM as WindowManager
    participant Win as Window Component
    participant Suspense as Suspense Boundary
    participant Network as Network

    User->>Icon: Double-click "Terminal"
    Icon->>Store: openWindow('terminal')
    Store->>WM: New window in state
    WM->>Win: Render Window shell<br/>(title bar, borders)
    Note over Win: Shell renders INSTANTLY<br/>(code already loaded)
    Win->>Suspense: Render app content
    Suspense->>Suspense: Show "Loading..." fallback
    Suspense->>Network: import('./TerminalApp')
    Note over Network: Download terminal chunk<br/>(~300KB)
    Network-->>Suspense: Module loaded
    Suspense->>Suspense: Replace fallback with TerminalApp
    Note over Win: Terminal appears inside window
```

The key insight: the **window shell** (title bar, borders, minimize/maximize/close buttons) appears **instantly** because it's part of `Window.tsx`, which is in the main bundle. Only the **content area** shows a loading indicator while the app chunk downloads.

## Chunk Boundaries in This Project

```mermaid
graph TD
    subgraph "Main Bundle (~35KB gzip)"
        DESK["Desktop.tsx"]
        WM["WindowManager.tsx"]
        WIN["Window.tsx"]
        TB["Taskbar.tsx"]
        SM["StartMenu.tsx"]
        REG["registry.ts"]
        STORE["desktop-store.ts"]
        BA["BrowserApp"]
        EA["ExplorerApp"]
        CA["ContactApp"]
        EMAIL["EmailApp"]
    end

    subgraph "Lazy Chunks (load on demand)"
        TERM["TerminalApp chunk<br/>~300KB (xterm.js)"]
        SNAKE["Snake chunk<br/>~20KB"]
        LIB["LibraryApp chunk<br/>~5KB"]
        ARCH["ArchExplorer chunk<br/>~15KB"]
    end

    DESK --> WM
    WM --> WIN
    DESK --> TB
    REG -.->|"lazy()"| TERM
    REG -.->|"lazy()"| SNAKE
    REG -.->|"lazy()"| LIB
    REG -.->|"lazy()"| ARCH

    style TERM fill:#fff3e0
    style SNAKE fill:#fff3e0
    style LIB fill:#fff3e0
    style ARCH fill:#fff3e0
```

Light apps (BrowserApp, ExplorerApp, EmailApp, ContactApp) are imported directly — they're small enough that code splitting would add overhead (extra network request) without meaningful bundle size benefit.

## How Rollup/Vite Decide Chunk Boundaries

The bundler creates a new chunk at every `import()` call:

```typescript
// Static import — bundled with the importing file
import { registerApp } from './registry';

// Dynamic import — new chunk boundary
const module = await import('./TerminalApp');
```

Vite/Rollup also creates shared chunks for dependencies used by multiple lazy chunks. If both TerminalApp and Snake imported the same utility library, that library would be extracted into a shared chunk loaded by both.

## The Suspense Boundary

SolidJS's `<Suspense>` component shows a fallback while lazy components load. In `WindowManager.tsx`, every app is wrapped in Suspense:

```typescript
<Window window={win}>
  <Suspense fallback={<LoadingFallback />}>
    {AppComponent ? <Dynamic component={AppComponent} {...(win.appProps ?? {})} /> : null}
  </Suspense>
</Window>
```

`LoadingFallback` is a simple centered "Loading..." message. Because it's inside the `<Window>` shell, the user sees a familiar window with loading content — not a blank screen or an abstract spinner.

### Suspense Placement Strategy

The Suspense boundary is per-window, not per-desktop. This means:
- Opening a lazy app shows loading **in that window only** — other windows are unaffected
- Opening a non-lazy app (BrowserApp) shows no loading indicator at all
- Multiple lazy apps can load simultaneously in separate windows

## The Waterfall Problem and Preloading

Lazy loading has a tradeoff: the first time a user opens a lazy app, there's a network fetch. If the app has nested lazy imports, you get a **waterfall**:

```
Frame 1:  Download TerminalApp chunk ──────→
Frame 2:                                     Download xterm.js ──────→
Frame 3:                                                              Download addon-fit ──→
```

Vite mitigates this with **async chunk loading optimization**: when a chunk is requested, Vite also fetches its static imports in parallel. So xterm.js and addon-fit would load simultaneously, not sequentially.

For predicted user paths, you could use `<link rel="modulepreload">` to start downloading chunks before the user clicks:

```html
<!-- Preload terminal chunk if you expect users to open the terminal -->
<link rel="modulepreload" href="/assets/TerminalApp-abc123.js" />
```

This project doesn't currently preload any chunks — the lazy loading latency is acceptable for the use case.

## The AGENTS.md Rule

From `AGENTS.md`:

> xterm.js, games, WASM modules must always be behind dynamic `import()` / SolidJS `lazy()`. Never import them at the top level of any file that loads on page startup. The window shell renders immediately; the body shows a loading indicator via `<Suspense>`.

This is a hard rule, not a suggestion. It protects the critical path (~35KB) from accidental bloat. A single top-level `import` of xterm.js would increase the initial bundle by ~300KB — nearly 10× the current size.

## What Goes Wrong Without Code Splitting

| Metric | With Code Splitting | Without |
|---|---|---|
| Initial bundle | ~35KB gzip | ~375KB gzip |
| Time to interactive | <1.5s (3G) | ~4s (3G) |
| First terminal open | ~1s delay (chunk download) | Instant (already loaded) |
| Users who never open terminal | Save ~300KB download | Waste ~300KB download |

The tradeoff is a one-time delay when first opening a lazy app. After the chunk is cached by the browser, subsequent opens are instant.

## Beyond This Project: Advanced Patterns

### Route-Based Splitting

Frameworks like Next.js and Remix automatically split by route — each page is a separate chunk. Astro does this too: each `.astro` page produces its own HTML file with only the JavaScript it needs.

### Component-Based Splitting

What this project does — splitting by component. SolidJS's `lazy()` and React's `React.lazy()` both wrap dynamic imports in a component API.

### Module Federation

Webpack 5's Module Federation allows sharing modules between independently deployed applications — useful for micro-frontends but overkill for this project.

### Import Maps

Browser-native import maps (`<script type="importmap">`) allow resolving bare specifiers like `import 'solid-js'` without a bundler. Combined with native ESM, this could eventually eliminate the need for bundling entirely during development.
