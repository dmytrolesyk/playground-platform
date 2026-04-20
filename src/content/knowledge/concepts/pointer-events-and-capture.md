---
title: "Pointer Events and Capture"
category: concept
summary: "Why pointer events with capture are essential for drag operations — and how they solve the fast-mouse problem."
difficulty: intermediate
relatedConcepts:
  - concepts/compositor-pattern
technologies:
  - solidjs
order: 4
dateAdded: 2026-04-20
externalReferences:
  - title: "Pointer Events MDN"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events"
    type: docs
  - title: "Element.setPointerCapture()"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture"
    type: docs
---

## The Fast-Mouse Problem

Without pointer capture, drag operations break when the user moves the mouse quickly:

1. User presses on the title bar → `mousedown` fires
2. User moves mouse fast → cursor leaves the title bar element
3. `mousemove` events now fire on whatever element is under the cursor — **not** the title bar
4. The window stops following the cursor

## The Solution: Pointer Capture

`element.setPointerCapture(pointerId)` locks all subsequent pointer events to that element, regardless of where the pointer actually is:

```typescript
const handleDragStart = (e: PointerEvent): void => {
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);  // Lock events to this element
  isDragging = true;
  offsetX = e.clientX - window.x;
  offsetY = e.clientY - window.y;
};

const handleDragMove = (e: PointerEvent): void => {
  if (!isDragging) return;
  actions.updateWindowPosition(id, e.clientX - offsetX, e.clientY - offsetY);
};

const handleDragEnd = (e: PointerEvent): void => {
  isDragging = false;
  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
};
```

## Why Pointer Events, Not Mouse Events?

Pointer events unify mouse, touch, and stylus input:

- `pointerdown` → `mousedown` + `touchstart`
- `pointermove` → `mousemove` + `touchmove`
- `pointerup` → `mouseup` + `touchend`

One set of handlers for all input types. Plus, pointer capture has no equivalent in the mouse/touch API.

## In This Project

Both window drag and window resize use pointer capture. They're mutually exclusive — if you start resizing (detected by proximity to a window edge), the drag handler doesn't activate.
