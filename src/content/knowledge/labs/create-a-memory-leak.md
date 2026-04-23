---
title: "Lab: Create and Detect a Memory Leak"
category: lab
summary: "Deliberately create memory leaks in SolidJS components, detect them with Chrome Memory panel, then fix them with onCleanup."
difficulty: advanced
relatedConcepts:
  - concepts/fine-grained-reactivity
  - concepts/event-loop-and-microtasks
  - concepts/observer-pattern
relatedFiles:
  - src/components/desktop/apps/TerminalApp.tsx
  - src/components/desktop/Window.tsx
  - src/components/desktop/store/desktop-store.ts
technologies:
  - solidjs
  - typescript
order: 5
dateAdded: 2026-04-20
lastUpdated: 2026-04-23
externalReferences:
  - title: "Chrome DevTools — Fix Memory Problems"
    url: "https://developer.chrome.com/docs/devtools/memory-problems"
    type: docs
  - title: "SolidJS — Lifecycle (onCleanup)"
    url: "https://docs.solidjs.com/reference/lifecycle/on-cleanup"
    type: docs
  - title: "V8 Blog — Trash Talk: The Orinoco Garbage Collector"
    url: "https://v8.dev/blog/trash-talk"
    type: article
  - title: "setInterval — MDN Web Docs"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval"
    type: docs
  - title: "Memory management — MDN Web Docs"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management"
    type: docs
prerequisites:
  - cs-fundamentals/memory-management-and-gc
  - concepts/event-loop-and-microtasks
learningObjectives:
  - "Create a deliberate memory leak in a SolidJS component using setInterval"
  - "Use Chrome DevTools Memory panel to take heap snapshots and identify growing detached nodes"
  - "Fix memory leaks using SolidJS onCleanup lifecycle hook"
  - "Verify the fix with before/after heap snapshot comparison"
exercises: []
estimatedMinutes: 45
module: aesthetics-performance
moduleOrder: 99
---

## Why This Lab Exists

Memory leaks in SolidJS are subtle. Unlike React, SolidJS components run their setup code **once** — there's no re-render cycle to accidentally create duplicate timers. But when a component mounts, creates a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval) or event listener, and then unmounts without cleaning up, the timer keeps firing forever. Since there's no re-render, there's no natural opportunity to notice the leak. The component is gone from the screen, but its timer is alive, holding references to DOM nodes that the [garbage collector](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management) can't free. This lab teaches you to create, detect, and fix this exact scenario using Chrome DevTools' [Memory panel](https://developer.chrome.com/docs/devtools/memory-problems).

## Setup

```bash
git checkout -b lab/memory-leak
pnpm dev
```

Open the app in Chrome. Keep DevTools open — you'll be using the **Memory** tab extensively.

## Experiment 1: Create a Leaking Component

**DO:** Create a new file `src/components/desktop/apps/LeakyApp.tsx`:

```tsx
import { createSignal, type JSX } from 'solid-js';

export function LeakyApp(): JSX.Element {
  const [count, setCount] = createSignal(0);
  const data: number[] = [];

  // Leak 1: setInterval with no cleanup
  setInterval(() => {
    setCount((c) => c + 1);
    // Leak 2: growing array that's never freed
    data.push(...new Array(1000).fill(Math.random()));
  }, 100);

  return (
    <div style={{ padding: '16px' }}>
      <p>Tick count: {count()}</p>
      <p>Array size: {data.length}</p>
      <p style={{ color: 'red', 'font-weight': 'bold' }}>
        ⚠ This component leaks memory!
      </p>
    </div>
  );
}
```

Now register it in `src/components/desktop/apps/app-manifest.ts`:

```tsx
import { LeakyApp } from './LeakyApp';

registerApp({
  id: 'leaky',
  title: 'Leaky App',
  icon: '/icons/folder_icon.png',
  component: LeakyApp,
  desktop: true,
  startMenu: false,
  singleton: false, // allows multiple instances
  defaultSize: { width: 300, height: 200 },
});
```

Note: `singleton: false` is important — it allows opening multiple instances, which amplifies the leak.

**OBSERVE:** Open the Leaky App from the desktop. You'll see the tick counter incrementing rapidly (10 times per second). Now **close the window**. The component disappears from the screen, but...

Open the browser console. You won't see any errors. The leak is completely silent. But that `setInterval` is still running in the background, still calling `setCount` on a signal that belongs to an unmounted component, and still pushing numbers into the `data` array.

**EXPLAIN:** SolidJS component functions run once. The `setInterval` call happens during that single execution. When the window closes, SolidJS removes the DOM nodes and tears down the reactive scope — but `setInterval` is a browser API, not a SolidJS API. The browser's timer subsystem holds a reference to the callback closure, which references `setCount`, `count`, and `data`. None of these can be garbage collected.

## Experiment 2: Detect the Leak with Heap Snapshots

**DO:**

1. **Reload the page** to start clean
2. Open DevTools → **Memory** tab
3. Select "Heap snapshot" and click **Take snapshot**. This is your baseline. Note the total size at the top
4. Open the Leaky App, wait 2 seconds, then **close it**. Repeat this 5 times: open → wait → close
5. Click **Take snapshot** again
6. At the top of the snapshot panel, switch the view from "Summary" to **"Comparison"** and compare Snapshot 2 against Snapshot 1

**OBSERVE:** The comparison view shows:

- **Size Delta:** The heap has grown significantly (by several MB depending on how long you waited)
- **# New:** Many new objects that weren't in the baseline
- Filter by "Detached" in the class filter — you'll see **detached DOM nodes** (HTMLDivElement, HTMLParagraphElement). These are the DOM nodes from the 5 closed windows that can't be garbage collected
- Sort by "Retained Size" descending to find the largest retainers

In the "Summary" view of Snapshot 2, search for `Array` — you'll find the `data` arrays from each closed instance, still growing.

**EXPLAIN:** Each time you opened the Leaky App, it:
1. Created a DOM subtree (the `<div>` with `<p>` elements)
2. Started a `setInterval` timer
3. Captured `data`, `count`, and `setCount` in the timer's closure

When you closed the window, SolidJS removed the DOM nodes from the document. But the `setInterval` callback still holds a reference to the component's closure, which references the DOM nodes (indirectly through `count()` which was used in JSX). The GC sees the reference chain: `setInterval callback` → `closure` → `data array` → growing numbers. None of this can be freed.

The "Detached" DOM nodes are the smoking gun — they're DOM elements that exist in memory but aren't attached to the document tree. They appear because the `setInterval` closure retains references that keep the entire component's scope alive.

## Experiment 3: Visualize Growth Over Time

**DO:**

1. Reload the page
2. In the Memory tab, select **"Allocation instrumentation on timeline"** instead of "Heap snapshot"
3. Click **Start**
4. Open the Leaky App and close it. Wait 5 seconds. Open and close again. Wait 5 seconds
5. Click **Stop**

**OBSERVE:** The timeline shows blue bars (allocations) and gray bars (freed memory). You'll see periodic blue spikes every 100ms — these are the `setInterval` allocations (the `new Array(1000)` calls). Notice that even after closing the window (visible as a gap in user activity), the blue spikes continue. There are no corresponding gray bars — nothing is being freed.

**EXPLAIN:** The allocation timeline makes the leak visually obvious. In a healthy app, allocations (blue) and deallocations (gray) roughly balance out over time. A leak appears as sustained blue bars with no corresponding gray. The 100ms periodicity confirms it's the `setInterval` — each tick allocates 1000 numbers that are pushed into the ever-growing `data` array.

## Experiment 4: Fix with onCleanup

**DO:** Modify `LeakyApp.tsx` to use SolidJS `onCleanup`:

```tsx
import { createSignal, type JSX, onCleanup } from 'solid-js';

export function LeakyApp(): JSX.Element {
  const [count, setCount] = createSignal(0);
  const data: number[] = [];

  const timer = setInterval(() => {
    setCount((c) => c + 1);
    data.push(...new Array(1000).fill(Math.random()));
  }, 100);

  // Clean up when the component unmounts
  onCleanup(() => {
    clearInterval(timer);
  });

  return (
    <div style={{ padding: '16px' }}>
      <p>Tick count: {count()}</p>
      <p>Array size: {data.length}</p>
      <p style={{ color: 'green', 'font-weight': 'bold' }}>
        ✅ This component cleans up properly!
      </p>
    </div>
  );
}
```

The only change: capture the timer ID and call `clearInterval(timer)` inside `onCleanup`.

**OBSERVE:** Open and close the app 5 times. The counter stops immediately when you close the window — no more background ticks. The `[onCleanup](https://docs.solidjs.com/reference/lifecycle/on-cleanup)` callback fires when SolidJS disposes the component's reactive scope.

**EXPLAIN:** `onCleanup` registers a disposal callback on the current reactive owner (the component's setup scope). When the parent (the window manager) removes the component, SolidJS runs all `onCleanup` callbacks registered during that component's lifecycle. The `clearInterval` call removes the timer from the browser's timer queue, which releases the closure reference, which allows the GC to collect `data`, `count`, `setCount`, and the detached DOM nodes.

## Experiment 5: Verify the Fix with Snapshots

**DO:**

1. Reload the page with the fixed component
2. Take a baseline heap snapshot
3. Open and close the Leaky App 5 times
4. Force garbage collection: click the trash can icon (🗑) in the Memory tab
5. Take a second heap snapshot
6. Compare Snapshot 2 vs Snapshot 1

**OBSERVE:** The heap size delta is now minimal — just normal churn from the window manager creating and destroying DOM. Filter by "Detached" — you should see zero or near-zero detached nodes from the Leaky App. The `data` arrays are gone.

**EXPLAIN:** With `onCleanup` properly clearing the interval, the reference chain breaks:

- **Before fix:** `browser timer queue` → `setInterval callback` → `closure` → `data`, `count`, `setCount`, DOM refs → **retained forever**
- **After fix:** `clearInterval()` removes the timer → callback unreferenced → closure unreferenced → `data`, `count`, DOM refs → **garbage collected**

Now look at the real-world example in `src/components/desktop/apps/TerminalApp.tsx`. Find the `onCleanup` at the bottom:

```tsx
onCleanup(() => {
  resizeObserver?.disconnect();
  fitAddonInstance?.dispose();
  terminalInstance?.dispose();
});
```

This cleans up three resources: the `ResizeObserver` (a browser API like `setInterval`), the xterm.js FitAddon, and the Terminal instance itself. Without this cleanup, every open/close cycle of the terminal would leak a `ResizeObserver`, a `Terminal` with its internal DOM nodes and buffers, and a `FitAddon`. The `cs-fundamentals/memory-management-and-[gc](https://v8.dev/blog/trash-talk)` article explains the V8 GC mechanics that make this possible.

## Wrap-Up

Memory leaks in SolidJS follow a consistent pattern:

1. **A component creates a resource** (timer, observer, event listener, WebSocket)
2. **The resource holds a reference** to the component's closure
3. **The component unmounts** but the resource survives
4. **The GC can't free anything** because the reference chain is unbroken

The fix is always the same: `onCleanup(() => { /* release the resource */ })`. This pattern appears throughout this codebase — check `TerminalApp.tsx`, `desktop-store.ts` (the media query listener), and any component that creates subscriptions.

Chrome's Memory tab is your diagnostic tool: heap snapshots to find what's leaking, allocation timelines to see when it's leaking, and comparison views to verify your fix worked. The theory behind all of this is covered in `cs-fundamentals/memory-management-and-gc` and `concepts/event-loop-and-microtasks`.

## Cleanup

```bash
rm src/components/desktop/apps/LeakyApp.tsx
git checkout -- src/components/desktop/apps/app-manifest.ts
git checkout feat/knowledge-base
git branch -D lab/memory-leak
```
