---
title: "Lab: Measure Compositor Performance"
category: lab
summary: "Compare transform vs left/top window positioning with Chrome DevTools profiling to see the rendering pipeline difference."
difficulty: intermediate
relatedConcepts:
  - concepts/compositor-pattern
  - concepts/browser-rendering-pipeline
  - concepts/pointer-events-and-capture
relatedFiles:
  - src/components/desktop/Window.tsx
  - src/components/desktop/styles/window.css
  - src/components/desktop/store/desktop-store.ts
technologies:
  - solidjs
  - typescript
order: 2
dateAdded: 2026-04-20
lastUpdated: 2026-04-23
externalReferences:
  - title: "Chrome DevTools — Analyze Runtime Performance"
    url: "https://developer.chrome.com/docs/devtools/performance"
    type: docs
  - title: "CSS Triggers — What Gets Triggered by Mutating a Given CSS Property"
    url: "https://csstriggers.com/"
    type: article
  - title: "High Performance Animations — Google Web Fundamentals"
    url: "https://web.dev/animations-guide/"
    type: docs
prerequisites:
  - concepts/compositor-pattern
  - concepts/browser-rendering-pipeline
learningObjectives:
  - "Profile window dragging performance using Chrome DevTools Performance panel"
  - "Compare Layout/Paint/Composite metrics between transform and left/top approaches"
  - "Identify compositor-only properties and their performance advantage in the Layers panel"
  - "Explain why this codebase uses will-change only during active drag"
exercises: []
estimatedMinutes: 30
module: window-manager
moduleOrder: 99
---

## Why This Lab Exists

This codebase positions windows with `transform: translate(x, y)` instead of CSS `left`/`top`. The architecture guidelines say this "enables [GPU-accelerated movement](https://developer.chrome.com/docs/devtools/performance/rendering) during drag." But how much does it actually matter? This lab gives you the tools to measure it yourself using [Chrome DevTools Performance panel](https://developer.chrome.com/docs/devtools/performance) and the [Layers panel](https://developer.chrome.com/docs/devtools/layers), so you can make informed decisions about CSS performance instead of repeating rules from blog posts.

## Setup

Start the dev server and open Chrome:

```bash
pnpm dev
```

Open the app in Chrome (not Firefox — we need Chrome's Layers panel). Open at least 3 windows (View CV, Export CV, Terminal) so there's meaningful layout work during drag.

You'll be modifying `src/components/desktop/Window.tsx` temporarily. Create a branch:

```bash
git checkout -b lab/compositor-perf
```

## Experiment 1: Baseline with Transform

First, measure the current implementation that uses `transform: translate()`.

**DO:**

1. Open Chrome DevTools → **Performance** tab
2. Click the record button (⏺)
3. Drag a window around the screen for about 3 seconds — move it briskly
4. Stop recording
5. In the flame chart, look at the **Summary** tab at the bottom. Note the percentages for **Layout**, **Paint**, and **Composite**
6. Zoom into a single frame during the drag. Look for green (Paint) and purple (Layout) bars

**OBSERVE:** You should see that most frames during the drag show very little or no Layout and Paint work. The bulk of the time is in Scripting (the pointer event handlers updating the store) and Compositing. Frames should be well under 16ms (60fps target).

Record these numbers — you'll compare them in Experiment 3.

**EXPLAIN:** `transform: translate()` is a compositor-only property. The browser doesn't need to recalculate element positions (Layout) or repaint pixels (Paint). It hands the transform to the GPU compositor, which moves the layer as a texture. The rendering pipeline short-circuits: Style → **skip Layout** → **skip Paint** → Composite.

## Experiment 2: Switch to Left/Top

Now modify `Window.tsx` to use `left`/`top` positioning instead of `transform`.

**DO:** Open `src/components/desktop/Window.tsx`. Find the JSX where the window element gets its position. The current code uses an inline style with `transform: translate(${x}px, ${y}px)`. Change it to use `left` and `top`:

```tsx
// Before (current code):
style={{
  transform: `translate(${props.window.x}px, ${props.window.y}px)`,
  width: `${props.window.width}px`,
  height: `${props.window.height}px`,
  'z-index': props.window.zIndex,
  position: 'absolute',
}}

// After (for this experiment):
style={{
  left: `${props.window.x}px`,
  top: `${props.window.y}px`,
  width: `${props.window.width}px`,
  height: `${props.window.height}px`,
  'z-index': props.window.zIndex,
  position: 'absolute',
}}
```

Save the file and let HMR update.

Now repeat the exact same profiling steps as Experiment 1:

1. Open Performance tab
2. Record while dragging the same window for 3 seconds
3. Stop, check Summary percentages

**OBSERVE:** You should see significantly more **Layout** time (purple bars) in each frame. The Paint time may also increase slightly. Frames during rapid dragging may exceed 16ms, especially if multiple windows are open. The flame chart shows Layout events firing on every pointer move.

**EXPLAIN:** `left` and `top` are layout-triggering properties. Every time you change them, the browser must recalculate the positions of all elements that could be affected (Layout), then repaint the affected areas (Paint), then composite. The pipeline runs fully: Style → Layout → Paint → Composite. With 3+ windows open, each layout calculation checks whether the moved window overlaps siblings.

## Experiment 3: Compare the Numbers

**DO:** Place the two recordings side by side (Chrome keeps them in the Performance tab history). Compare:

| Metric | Transform | Left/Top |
|--------|-----------|----------|
| Layout % | | |
| Paint % | | |
| Composite % | | |
| Max frame time | | |
| Dropped frames | | |

**OBSERVE:** The transform approach should show near-zero Layout, minimal Paint, and the majority of time in Compositing. The left/top approach shows measurable Layout in every frame, some Paint, and similar Composite time. On a fast machine, both might hit 60fps — but left/top has much less headroom before it starts dropping frames.

**EXPLAIN:** The difference matters most on lower-powered devices (phones, older laptops) and when the page has complex layout. This codebase targets mobile (breakpoint at 768px), where layout calculations are expensive relative to CPU power. Using `transform` gives a consistent 60fps budget margin.

## Experiment 4: Inspect GPU Layers

**DO:**

1. Revert `Window.tsx` back to the `transform` approach
2. Open DevTools → **Layers** panel (you may need to enable it via More Tools → Layers)
3. Drag a window — during drag, `will-change: transform` is added (see `handleDragStart` in `Window.tsx`)
4. Look at the Layers panel — the dragged window should appear as its own compositor layer
5. Stop dragging — `will-change` is removed (see `handleDragEnd`)
6. Check Layers again — the window should no longer be on its own layer

**OBSERVE:** During drag, the window element is promoted to its own GPU layer (shown as a separate entry in the Layers panel). After drag ends, it merges back into the parent layer. The other windows that aren't being dragged are NOT on separate layers.

**EXPLAIN:** `will-change: transform` tells the browser "this element is about to be animated, give it its own compositor layer." A dedicated layer means the GPU can move it without touching other layers. But layers consume GPU memory — each one stores a texture bitmap. That's why this codebase adds `will-change` only during active drag and removes it immediately after:

```tsx
// In Window.tsx handleDragStart:
windowEl.style.willChange = 'transform';

// In Window.tsx handleDragEnd:
windowEl.style.willChange = 'auto';
```

If `will-change: transform` were permanent on all windows, every window would consume a separate GPU texture even when idle — wasting VRAM on mobile devices.

## Experiment 5: Test will-change Impact

**DO:**

1. Add `will-change: transform` permanently to the `.win-container` class in `src/components/desktop/styles/window.css`:

```css
.win-container {
  will-change: transform; /* added for experiment */
}
```

2. Open 5+ windows
3. Open Layers panel — count the layers
4. Now remove the permanent `will-change` and check again

**OBSERVE:** With permanent `will-change`, every window is a separate layer (5+ layers for the windows alone). Without it, windows share layers when idle. The memory impact section of the Layers panel shows higher memory usage with permanent promotion.

**EXPLAIN:** Layer promotion is a trade-off: faster compositing during animation, but more GPU memory at all times. The strategy in this codebase — promote on drag, demote on release — gives the best of both worlds. This is why the architecture guidelines specify "Use `will-change: transform` only during active drag, remove it after."

## Wrap-Up

You've now seen the rendering pipeline difference with real numbers. The key takeaways:

1. **`transform` skips Layout and Paint** — the two most expensive pipeline stages
2. **`left`/`top` trigger full pipeline** — Layout → Paint → Composite on every frame
3. **`will-change` should be temporary** — permanent promotion wastes GPU memory
4. **The Layers panel reveals compositor decisions** — use it to verify your assumptions

These principles from `concepts/compositor-pattern` and `concepts/browser-rendering-pipeline` aren't theoretical — you just measured the difference. The `Window.tsx` implementation in this codebase applies them precisely: `transform` for positioning, `will-change` only during drag.

## Cleanup

```bash
git checkout -- src/components/desktop/Window.tsx
git checkout -- src/components/desktop/styles/window.css
git checkout feat/knowledge-base
git branch -D lab/compositor-perf
```
