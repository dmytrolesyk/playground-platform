---
title: "Fine-Grained Reactivity"
category: concept
summary: "Why SolidJS updates only what changed — no virtual DOM, no diffing, no wasted work."
difficulty: intermediate
relatedConcepts:
  - concepts/signals-vs-vdom
technologies:
  - solidjs
order: 1
dateAdded: 2026-04-20
externalReferences:
  - title: "SolidJS Reactivity Guide"
    url: "https://www.solidjs.com/guides/reactivity"
    type: docs
  - title: "A Hands-on Introduction to Fine-Grained Reactivity"
    url: "https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf"
    type: article
---

## What Is Fine-Grained Reactivity?

In fine-grained reactivity, the system tracks **which specific values** each piece of UI depends on, and updates **only those pieces** when the values change. No tree walking, no diffing, no reconciliation.

Compare to coarse-grained approaches (like React):
- React: "This component's state changed → re-run the entire component function → diff the old and new virtual DOM → patch the real DOM"
- SolidJS: "This signal changed → run only the specific DOM update expression that reads it"

## Signals: The Foundation

A signal is a reactive value:

```typescript
const [count, setCount] = createSignal(0);
```

- `count()` — reads the value AND subscribes the current tracking context
- `setCount(1)` — sets the value AND notifies all subscribers

The key insight: when SolidJS compiles JSX, each expression becomes a separate "computation" that subscribes to exactly the signals it reads:

```tsx
<span>{count()}</span>
// Compiles to: create a Text node, subscribe to count(), update Text node when count changes
```

## Effects and Memos

- **`createEffect`** — runs a side effect whenever its tracked dependencies change
- **`createMemo`** — a derived signal that caches its result and only recomputes when dependencies change

## How This Powers the Desktop

In the desktop store, when you drag a window:

```typescript
actions.updateWindowPosition(id, newX, newY);
```

SolidJS updates **only** the `transform` style of that specific window's DOM element. The taskbar doesn't re-render. Other windows don't re-render. The start menu doesn't re-render. Only the CSS transform of the dragged window changes.

This is why the window manager feels responsive even with many windows open — updates are surgical.

## Stores: Fine-Grained Objects

SolidJS `createStore` extends reactivity to nested objects:

```typescript
const [state, setState] = createStore({
  windows: {
    'browser-1': { x: 100, y: 50, title: 'CV' },
    'terminal-1': { x: 200, y: 100, title: 'Terminal' },
  },
});
```

Reading `state.windows['browser-1'].x` tracks only that specific path. Updating it notifies only computations that read it.
