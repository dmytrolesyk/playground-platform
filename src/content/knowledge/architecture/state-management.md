---
title: "The Desktop Store"
category: architecture
summary: "How createStore, produce, and SolidJS context manage all desktop state — windows, z-index, and mobile detection."
difficulty: intermediate
relatedConcepts:
  - concepts/fine-grained-reactivity
relatedFiles:
  - src/components/desktop/store/desktop-store.ts
  - src/components/desktop/store/types.ts
  - src/components/desktop/store/context.tsx
technologies:
  - solidjs
order: 4
dateAdded: 2026-04-20
---

## The Single Store

All desktop state lives in one `createStore` call:

```typescript
const [state, setState] = createStore<DesktopState>({
  windows: {},        // Record<string, WindowState>
  windowOrder: [],    // string[] — creation order for taskbar
  nextZIndex: 10,     // monotonic counter
  startMenuOpen: false,
  selectedDesktopIcon: null,
  isMobile: false,    // derived from MediaQuery
});
```

SolidJS stores use **proxies** — reads are tracked, writes are batched. When you update `state.windows['browser-1'].x`, only components that read that specific property re-render. No diffing, no reconciliation.

## Context Distribution

The store is created once in `createDesktopStore()` and distributed via SolidJS context:

```typescript
function DesktopProvider(props) {
  const store = createDesktopStore();
  return <DesktopContext.Provider value={store}>{props.children}</DesktopContext.Provider>;
}
```

Any component calls `useDesktop()` to get `[state, actions]`. This is the only way to access desktop state — no global singletons, no prop drilling.

## Actions: The Public API

The `DesktopActions` interface defines every mutation:

- `openWindow(appId, extraProps?)` — creates or focuses a window
- `closeWindow(id)` — removes from state and order
- `focusWindow(id)` — bumps z-index
- `minimizeWindow(id)` / `maximizeWindow(id)` — toggle state flags
- `updateWindowPosition(id, x, y)` — drag updates
- `updateWindowSize(id, w, h)` — resize updates
- `toggleStartMenu()` / `closeStartMenu()`
- `selectDesktopIcon(id | null)`
- `isTopWindow(id)` / `getTopWindowId()`

All mutations use `setState` with `produce()` for nested updates:

```typescript
setState(produce((s) => {
  const win = s.windows[id];
  if (win) {
    win.x = x;
    win.y = y;
  }
}));
```

## Mobile Detection

The store watches `window.matchMedia('(max-width: 768px)')`:

```typescript
const mediaQuery = window.matchMedia(`(max-width: 768px)`);
setState('isMobile', mediaQuery.matches);
mediaQuery.addEventListener('change', (e) => {
  setState('isMobile', e.matches);
});
```

Components read `state.isMobile` and conditionally change behavior — same components, different rendering. No separate mobile tree.

## Why Not Multiple Stores?

One store means:
1. **Atomic operations** — opening a window updates `windows`, `windowOrder`, and `nextZIndex` in one batch
2. **No sync bugs** — the taskbar and window manager always agree on what's open
3. **Simple debugging** — one place to inspect all state
