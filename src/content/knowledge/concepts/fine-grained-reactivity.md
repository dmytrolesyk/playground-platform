---
title: "Fine-Grained Reactivity"
category: concept
summary: "Why SolidJS updates only what changed — no virtual DOM, no diffing, no wasted work."
difficulty: intermediate
prefLabel: "Fine-Grained Reactivity"
altLabels:
  - "reactive programming"
  - "push-based reactivity"
  - "signal-based reactivity"
  - "granular reactivity"
broader:
  - concepts/observer-pattern
narrower: []
relatedConcepts:
  - concepts/signals-vs-vdom
  - concepts/observer-pattern
  - concepts/javascript-proxies
  - concepts/event-loop-and-microtasks
  - concepts/browser-rendering-pipeline
  - cs-fundamentals/hash-maps-and-lookup
relatedFiles:
  - src/components/desktop/store/desktop-store.ts
  - src/components/desktop/store/context.tsx
  - src/components/desktop/Window.tsx
  - src/components/desktop/WindowManager.tsx
technologies:
  - solidjs
order: 1
dateAdded: 2026-04-20
lastUpdated: 2026-04-20
externalReferences:
  - title: "SolidJS Reactivity Guide"
    url: "https://www.solidjs.com/guides/reactivity"
    type: docs
  - title: "A Hands-on Introduction to Fine-Grained Reactivity"
    url: "https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf"
    type: article
  - title: "Building a Reactive Library from Scratch — Ryan Carniato"
    url: "https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p"
    type: article
  - title: "SolidJS — Thinking Granularly (talk)"
    url: "https://www.youtube.com/watch?v=OqcHoLWyyIw"
    type: talk
  - title: "Knockout.js — Observables"
    url: "https://knockoutjs.com/documentation/observables.html"
    type: docs
module: reactivity
moduleOrder: 1
estimatedMinutes: 20
prerequisites: []
learningObjectives:
  - "Explain what fine-grained reactivity means and how it differs from coarse-grained (VDOM) approaches"
  - "Describe the signal/computation/effect dependency graph that SolidJS builds at runtime"
  - "Predict which DOM nodes update when a specific signal changes value"
exercises:
  - question: "If a signal changes from 5 to 5 (same value), does the effect re-run in SolidJS?"
    type: predict
    hint: "SolidJS compares old and new values before notifying."
    answer: "No, the effect does not re-run. SolidJS performs an equality check (===) before propagating changes. If the new value is identical to the old value, no subscribers are notified. This is a key optimization that prevents unnecessary DOM updates — unlike React's useState which always triggers a re-render even if the new state equals the old state (unless you use React.memo)."
  - question: "How does automatic dependency tracking avoid re-rendering the entire component tree when a single signal changes?"
    type: explain
    answer: "Each reactive expression (effect, memo, JSX binding) tracks exactly which signals it reads during execution. When a signal changes, SolidJS only re-runs the specific expressions that are subscribed to that signal — not the component function, not parent components, not sibling expressions. A component rendering state.windows['win-1'].x creates a subscription from that specific JSX expression to that specific store path. Changing win-2's x doesn't trigger it."
  - question: "Open the SolidJS tutorial (solidjs.com/tutorial), create a counter with createSignal, and add a console.log at the top of the component function. Click the button 5 times. How many times does the log appear?"
    type: do
    hint: "Compare this to what React would do."
    answer: "The console.log appears exactly once — when the component first renders. In SolidJS, component functions run once and never re-execute. Only the specific JSX expression bound to count() updates when the signal changes. In React, the entire component function would re-run on every click (6 logs total), and React would diff the virtual DOM to find what changed."
---

## Why Should I Care?

When you drag a window across this desktop, the browser updates the screen at 60 frames per second. Each frame, only one thing changes: the CSS `transform` of the dragged window. The taskbar doesn't re-render. Other windows don't re-render. The start menu doesn't re-render. Only the specific DOM property that reads the window's `x` and `y` coordinates updates.

This surgical precision isn't manual optimization — it's the default behavior of SolidJS's fine-grained reactivity system. Understanding it explains why the window manager feels responsive, why there's no `React.memo` or `useMemo` anywhere in the codebase, and why SolidJS was chosen over React for this project.

## The Core Mechanism

In [fine-grained reactivity](https://www.solidjs.com/guides/reactivity), the system tracks **which specific values** each piece of UI depends on, and updates **only those pieces** when the values change. No tree walking, no diffing, no reconciliation.

Compare to coarse-grained approaches:
- **React**: "This component's state changed → re-run the entire component function → diff the old and new [virtual DOM](https://legacy.reactjs.org/docs/faq-internals.html) → patch the real DOM"
- **SolidJS**: "This signal changed → run only the specific DOM update expression that reads it"

```mermaid
flowchart LR
    subgraph "Coarse-grained (React)"
        SC[State Change] --> RC[Re-run Component] --> VDOM[New VDOM Tree] --> Diff[Diff Old vs New] --> Patch[Patch DOM]
    end
    subgraph "Fine-grained (SolidJS)"
        SS[Signal Change] --> NS[Notify Subscribers] --> UD[Update Specific DOM Nodes]
    end

    style SC fill:#fce4ec
    style SS fill:#e8f5e9
```

## Signals: The Foundation

A [signal](https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p) is a reactive value with automatic dependency tracking:

```typescript
const [count, setCount] = createSignal(0);
```

- `count()` — reads the value AND subscribes the current tracking context
- `setCount(1)` — sets the value AND notifies all subscribers

The key insight: when SolidJS compiles JSX, each expression becomes a separate "computation" — an independently-subscribable unit:

```tsx
<span>{count()}</span>
// Compiles roughly to:
// 1. Create a Text node
// 2. Create a computation that reads count() and updates the Text node
// 3. The computation auto-subscribes to count's signal
```

### The Subscription Graph

Every reactive expression creates an edge in a dependency graph:

```mermaid
graph TD
    S1["Signal: count"] --> C1["Computation: text node update"]
    S2["Signal: name"] --> C2["Computation: title text update"]
    S1 --> C3["Computation: createEffect logging"]
    S2 --> C3

    style S1 fill:#f9f,stroke:#333
    style S2 fill:#f9f,stroke:#333
    style C1 fill:#bbf,stroke:#333
    style C2 fill:#bbf,stroke:#333
    style C3 fill:#bfb,stroke:#333
```

When `count` changes, only C1 and C3 re-execute. C2 is untouched because it doesn't read `count`. This tracking is automatic — you never specify dependencies manually.

## Automatic Dependency Tracking: Step by Step

Here's exactly what happens when SolidJS encounters a reactive expression:

1. **SolidJS sets a global "current listener"** — the computation being executed
2. **Your code reads a signal** — `count()` is called
3. **The signal's getter records the current listener** — adds it to its subscriber set
4. **The expression finishes** — SolidJS clears the current listener
5. **Later, when the signal changes** — `setCount(1)` iterates the subscriber set and re-runs each computation

This is the [Observer pattern](/learn/concepts/observer-pattern) with automatic subscription management. You never call `subscribe()` or `watch()` — the system infers dependencies from what you read.

## Effects and Memos

### createEffect — Side Effects

Runs whenever its tracked dependencies change:

```typescript
createEffect(() => {
  console.log('Count is:', count()); // Re-runs when count changes
});
```

### createMemo — Derived Values

A derived signal that caches its result and only recomputes when dependencies change:

```typescript
const doubled = createMemo(() => count() * 2);
// doubled() is a signal — other computations can subscribe to it
```

Memos are important for avoiding redundant computation. If multiple expressions need `count() * 2`, a memo computes it once and shares the result.

## How This Powers the Desktop

In `src/components/desktop/store/desktop-store.ts`, the desktop store uses SolidJS's `createStore` — which extends reactivity to nested objects via [JavaScript Proxies](/learn/concepts/javascript-proxies):

```typescript
const [state, setState] = createStore<DesktopState>({
  windows: {
    'browser-1': { x: 100, y: 50, title: 'CV', zIndex: 10 },
    'terminal-1': { x: 200, y: 100, title: 'Terminal', zIndex: 11 },
  },
  startMenuOpen: false,
});
```

Reading `state.windows['browser-1'].x` tracks only that specific path. When a drag operation updates it:

```typescript
actions.updateWindowPosition('browser-1', 250, 150);
// Internally: setState(produce(s => { s.windows['browser-1'].x = 250; ... }))
```

SolidJS updates **only** the `transform` style of browser-1's DOM element. The terminal window doesn't re-render. The taskbar doesn't re-render. Only the CSS transform changes.

## Cleanup and Disposal

When a component unmounts (e.g., a window closes), all its computations must be cleaned up — otherwise they'd continue subscribing to signals and running effects for a component that no longer exists.

SolidJS handles this through **ownership scoping**: every computation is created within a scope (the component function, an effect, etc.). When the scope is disposed, all computations within it are automatically unsubscribed.

```typescript
// Window closes → component scope disposes
// → all effects and memos created in the component are cleaned up
// → their subscriptions are removed from signal subscriber sets
// → no memory leaks, no phantom updates
```

SolidJS's `onCleanup()` hook runs when the current scope is disposed:

```typescript
onCleanup(() => {
  resizeObserver?.disconnect();
  fitAddonInstance?.dispose();
  terminalInstance?.dispose();
});
```

This appears in `TerminalApp.tsx` — when the terminal window closes, the ResizeObserver, FitAddon, and Terminal instances are cleaned up.

## The Diamond Problem: Glitch-Free Propagation

A potential issue in reactive systems: if computation C depends on both A and B, and both change simultaneously, C might see an inconsistent state (A has changed, B hasn't yet). This is called a **glitch**.

```
Signal A ─┐
           ├──→ Computation C (reads A + B)
Signal B ─┘
```

SolidJS solves this with **synchronous, batched propagation**: when multiple signals change in one `produce()` callback, all updates are collected and propagated in topological order. C runs once, seeing both new values.

```typescript
// In openWindow — multiple signals change atomically
setState(produce((s) => {
  s.windows[id] = newWindow;    // Changes windows
  s.windowOrder.push(id);       // Changes windowOrder
  s.nextZIndex += 1;            // Changes nextZIndex
  s.startMenuOpen = false;      // Changes startMenuOpen
}));
// Computations that read any of these values run ONCE after all changes
```

## Comparison: The Reactivity Family

Fine-grained reactivity isn't unique to SolidJS. It has a lineage:

| Framework | Year | Mechanism | Granularity |
|---|---|---|---|
| **Knockout.js** | 2010 | Observables | Per-observable |
| **MobX** | 2015 | Proxy/Object.defineProperty | Per-property |
| **Vue 2** | 2016 | Object.defineProperty | Per-property (with caveats) |
| **Vue 3** | 2020 | Proxy | Per-property |
| **SolidJS** | 2021 | Signals + Proxy stores | Per-expression |
| **Preact Signals** | 2022 | Signals | Per-signal |
| **Angular Signals** | 2023 | Signals | Per-signal |

SolidJS's innovation isn't the reactive primitive (signals are decades old) — it's the integration with JSX compilation. By making each JSX expression an independent computation, SolidJS achieves per-expression granularity: not per-component (React), not per-property (Vue), but per-DOM-binding.

## What If We'd Done It Differently?

Without fine-grained reactivity, the window manager would need manual optimization:

```tsx
// React version — needs memoization to avoid full tree re-renders
const Window = React.memo(({ window }) => {
  // This function re-runs on every state change unless memoized
  return <div style={{ transform: `translate(${window.x}px, ${window.y}px)` }} />;
});

// SolidJS version — no memoization needed
function Window(props) {
  // This function runs ONCE. The style expression tracks props.window.x automatically.
  return <div style={{ transform: `translate(${props.window.x}px, ${props.window.y}px)` }} />;
}
```

With React, you'd need `React.memo` on the Window component, `useMemo` for the style object, and possibly `useCallback` for event handlers — all to prevent the entire window tree from re-rendering during drag. With SolidJS, the surgical update is the default behavior.
