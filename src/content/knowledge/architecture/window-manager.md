---
title: "How Windows Work"
category: architecture
summary: "The window manager — drag, resize, focus, z-index stacking, and the pointer event model that makes it all work."
difficulty: intermediate
relatedConcepts:
  - concepts/pointer-events-and-capture
  - concepts/compositor-pattern
  - concepts/fine-grained-reactivity
relatedFiles:
  - src/components/desktop/Window.tsx
  - src/components/desktop/TitleBar.tsx
  - src/components/desktop/store/desktop-store.ts
  - src/components/desktop/store/types.ts
technologies:
  - solidjs
diagramRef: "window-manager"
order: 2
dateAdded: 2026-04-20
---

## WindowState: The Data Model

Every open window is represented by a `WindowState` object in the store:

```typescript
interface WindowState {
  id: string;            // unique instance ID (e.g., "browser-1")
  app: string;           // registry key (e.g., "browser")
  title: string;         // title bar text
  icon?: string;         // icon path
  x: number;             // position via transform: translate()
  y: number;
  width: number;
  height: number;
  zIndex: number;        // stacking order
  isMinimized: boolean;
  isMaximized: boolean;
  prevBounds?: { x: number; y: number; width: number; height: number };
  appProps?: Record<string, unknown>;
}
```

The store holds `windows: Record<string, WindowState>` — a flat map keyed by window ID. This makes lookups O(1) and updates surgical (only the changed window triggers reactivity).

## Drag: Pointer Events + Capture

Window dragging uses the **Pointer Events API** with **pointer capture** — not mouse events. Here's why:

1. **`pointerdown` on the title bar** — Records the offset between the cursor and the window's (x, y) position. Calls `setPointerCapture(e.pointerId)` to lock all future pointer events to this element.
2. **`pointermove`** — Computes new position as `(clientX - offsetX, clientY - offsetY)`. Updates the store via `actions.updateWindowPosition()`.
3. **`pointerup`** — Releases capture, clears drag state.

Pointer capture is critical: without it, moving the mouse quickly can leave the title bar element, and you'd stop receiving move events. With capture, events continue even when the pointer leaves the element.

### GPU-Accelerated Movement

Window position is applied via `transform: translate(x, y)` — not CSS `left`/`top`. This keeps the window on its own compositor layer, making movement GPU-accelerated with no layout reflow. The `will-change: transform` hint is applied only during active drag and removed after.

## Z-Index Stacking

Every window gets a `zIndex` from a monotonically increasing counter (`nextZIndex` in the store). When you focus a window:

1. `nextZIndex` increments
2. The focused window gets the new z-index
3. All other windows keep their current z-index

This means the most recently focused window is always on top. No sorting, no recalculation — just an ever-increasing number.

The `windowOrder` array in the store tracks the order separately for the taskbar. It's the creation order, not the z-order.

## Resize: Eight-Direction Edge Detection

The `Window` component supports resizing from all four edges and four corners. It works by:

1. **Hit testing** — An invisible 6px border zone around the window detects which edge the cursor is near. The cursor changes to the appropriate resize cursor (`ns-resize`, `ew-resize`, `nwse-resize`, etc.).
2. **`pointerdown` on an edge** — Captures the pointer, records the starting edge and initial bounds.
3. **`pointermove`** — Calculates the new bounds based on which edge is being dragged. Minimum size is enforced (per-app `minSize` or platform default of 200×150).
4. **`pointerup`** — Releases capture.

The key insight: resize and drag use the **same pointer capture mechanism** but are mutually exclusive — if you start resizing, you can't accidentally start dragging.

## Maximize and Restore

Maximizing a window:

1. Saves current `{ x, y, width, height }` to `prevBounds`
2. Sets position to (0, 0) and size to fill the viewport (minus taskbar height)
3. Sets `isMaximized: true`

Restoring reads from `prevBounds` and resets. Double-clicking the title bar toggles maximize.

## Cascade Positioning

New windows are positioned using a cascade algorithm — each new window is offset 30px down and 30px right from the previous one. When the cascade would go off-screen, it wraps back to the start. This mimics classic Windows behavior.

## Mobile Behavior

On mobile (viewport < 768px, detected by `isMobile` in the store):

- Windows are **always maximized** — full-screen, no drag, no resize
- Only **one window visible at a time** — the most recently opened/focused
- Single-tap on a desktop icon opens the app directly
- No title bar drag handle

The same components are used — the behavior is conditional, not separate mobile components.

## Key Implementation Details

### WindowManager.tsx

The `WindowManager` component iterates `windowOrder`, looks up each window's app in `APP_REGISTRY`, resolves the component, and wraps it in a `<Window>` shell:

```typescript
// Simplified
<For each={state.windowOrder}>
  {(id) => {
    const win = state.windows[id];
    const app = APP_REGISTRY[win.app];
    const AppComponent = app.component;
    return (
      <Window window={win}>
        <Suspense fallback={<Loading />}>
          <AppComponent {...win.appProps} />
        </Suspense>
      </Window>
    );
  }}
</For>
```

The `<Suspense>` boundary is important — lazy-loaded apps (terminal, games) show a loading indicator while their chunks download.

### TitleBar.tsx

A separate component handling the title bar rendering and button actions (minimize, maximize, close). It fires actions on the store — it doesn't manage window state itself.
