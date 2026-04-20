---
title: "Lazy Loading and Code Splitting"
category: concept
summary: "How dynamic import() and SolidJS lazy() keep the initial bundle small by loading heavy apps on demand."
difficulty: beginner
relatedConcepts:
  - concepts/inversion-of-control
technologies:
  - solidjs
order: 7
dateAdded: 2026-04-20
externalReferences:
  - title: "Dynamic import() — MDN"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import"
    type: docs
---

## The Problem

xterm.js is ~300KB. The Snake game has a canvas engine. Mermaid is ~200KB. If all of these loaded on page startup, the initial bundle would be massive and the desktop would take seconds to become interactive.

## The Solution: Lazy Boundaries

Heavy apps are wrapped in `lazy()`:

```typescript
const TerminalApp = lazy(() =>
  import('./TerminalApp').then(m => ({ default: m.TerminalApp }))
);
```

This tells the bundler (Vite/Rollup) to split `TerminalApp` and all its dependencies into a separate chunk. The chunk only downloads when the user first opens the terminal.

## How It Works at Runtime

1. User double-clicks the Terminal icon
2. `actions.openWindow('terminal')` creates a window
3. `WindowManager` renders the window shell (title bar, borders) immediately
4. Inside the window body, `<Suspense>` shows a loading indicator
5. The `lazy()` wrapper triggers `import('./TerminalApp')`
6. Browser downloads the terminal chunk (~300KB)
7. Chunk loads, `<Suspense>` resolves, terminal renders

The window shell appears **instantly**. Only the content area shows a loading state.

## What Gets Lazy-Loaded

In this project, four apps are lazy-loaded:

| App | Why | Approx. Size |
|---|---|---|
| TerminalApp | xterm.js dependency | ~300KB |
| SnakeGame | Canvas game engine | ~20KB |
| LibraryApp | Only used when reading docs | ~5KB |
| ArchitectureExplorer | SVG diagram engine | ~15KB |

Light apps (BrowserApp, ExplorerApp, EmailApp, ContactApp) are imported directly — they're small enough that code splitting would add overhead without benefit.

## The Rule

From AGENTS.md: *"xterm.js, games, WASM modules must always be behind dynamic import() / SolidJS lazy(). Never import them at the top level of any file that loads on page startup."*
