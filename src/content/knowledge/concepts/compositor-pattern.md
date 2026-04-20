---
title: "The Compositor Pattern"
category: concept
summary: "How GPU-accelerated CSS transforms make window dragging smooth — the browser's compositor thread and why transform beats left/top."
difficulty: advanced
relatedConcepts:
  - concepts/pointer-events-and-capture
order: 5
dateAdded: 2026-04-20
externalReferences:
  - title: "Compositor-only CSS properties"
    url: "https://web.dev/animations-guide/"
    type: article
---

## Layout vs Composite

When you change a CSS property, the browser goes through a pipeline:

```
Style → Layout → Paint → Composite
```

- **Layout** (`left`, `top`, `width`) — recalculates positions of all elements. Expensive.
- **Paint** (`background`, `color`) — redraws pixels. Medium cost.
- **Composite** (`transform`, `opacity`) — moves existing layers on the GPU. Cheap.

## Why transform: translate() for Windows

Window positions use `transform: translate(x, y)` instead of `left`/`top`:

```css
.window {
  transform: translate(150px, 80px);  /* GPU-composited */
  /* NOT: left: 150px; top: 80px;    — triggers layout */
}
```

During drag, the window moves at 60fps because the browser only recomposites — no layout recalculation, no repaint of other elements.

## will-change: The Hint

`will-change: transform` tells the browser to promote the element to its own compositor layer **before** the animation starts:

```typescript
// During drag start
windowEl.style.willChange = 'transform';

// During drag end
windowEl.style.willChange = '';  // Remove hint — saves memory
```

The hint is applied only during active drag and removed after. Keeping it on all elements permanently wastes GPU memory.

## In This Project

Every window in the desktop uses `transform: translate()` for position. During drag, `will-change: transform` is added to the window container. This is why dragging feels smooth even with multiple overlapping windows.
