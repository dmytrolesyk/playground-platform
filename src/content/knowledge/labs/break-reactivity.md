---
title: "Lab: Break Reactivity in 5 Ways"
category: lab
summary: "Deliberately break SolidJS reactivity with five common anti-patterns, observe the symptoms, then fix each one."
difficulty: intermediate
relatedConcepts:
  - concepts/fine-grained-reactivity
  - concepts/javascript-proxies
  - concepts/observer-pattern
  - concepts/signals-vs-vdom
relatedFiles:
  - src/components/desktop/store/desktop-store.ts
  - src/components/desktop/store/context.tsx
  - src/components/desktop/Window.tsx
  - src/components/desktop/WindowManager.tsx
technologies:
  - solidjs
  - typescript
order: 1
dateAdded: 2026-04-20
lastUpdated: 2026-04-23
externalReferences:
  - title: "SolidJS Reactivity Guide"
    url: "https://www.solidjs.com/guides/reactivity"
    type: docs
  - title: "A Hands-on Introduction to Fine-Grained Reactivity"
    url: "https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf"
    type: article
  - title: "SolidJS — createEffect"
    url: "https://docs.solidjs.com/reference/basic-reactivity/create-effect"
    type: docs
prerequisites:
  - concepts/fine-grained-reactivity
  - technologies/solidjs
  - concepts/javascript-proxies
learningObjectives:
  - "Identify 5 common ways to accidentally break SolidJS reactivity"
  - "Observe the exact symptoms of each broken pattern in the browser"
  - "Fix each broken pattern and explain why the fix restores reactivity"
  - "Use browser DevTools console to confirm reactive updates fire or don't"
exercises: []
estimatedMinutes: 45
module: reactivity
moduleOrder: 99
---

## Why This Lab Exists

[SolidJS reactivity](https://www.solidjs.com/guides/reactivity) feels magical — until it silently stops working. Unlike React, which re-runs entire components on every state change, SolidJS builds a dependency graph at **first execution time**. If a signal isn't read during that first synchronous pass, SolidJS never knows about it. The result: your UI freezes while your data changes underneath. This lab creates five of these breaks so you can recognize them instantly in real code.

## Setup

Create a throwaway branch to experiment freely:

```bash
git checkout -b lab/break-reactivity
```

Create a test file at `src/lab-reactivity.tsx`. You won't wire it into the app — just use it as a scratch pad and run the experiments through the browser console or by temporarily importing it.

```tsx
// src/lab-reactivity.tsx
import { createSignal, createEffect } from "solid-js";

// We'll add experiments here
```

You can test each experiment by pasting code into the browser console on the running dev server (`pnpm dev`), or by importing the file temporarily into `Desktop.tsx` and calling the exported functions.

## Experiment 1: Destructuring Props

SolidJS props are Proxies. Destructuring them extracts the values **once** at call time, severing the reactive connection.

**DO:** Create a component that destructures its props:

```tsx
function Greeting(props: { name: string }) {
  const { name } = props; // ← destructured
  return <span>{name}</span>;
}
```

Use it with a signal:

```tsx
const [name, setName] = createSignal("Alice");
// In JSX: <Greeting name={name()} />
// Then call: setName("Bob")
```

**OBSERVE:** The `<span>` still displays "Alice" after calling `setName("Bob")`. The UI is frozen. Open DevTools Console — no errors, no warnings. The breakage is completely silent.

**EXPLAIN:** When you write `const { name } = props`, JavaScript reads `props.name` once and stores the string `"Alice"` in a local variable. SolidJS never re-invokes the component function (unlike React), so `name` stays `"Alice"` forever. The [Proxy's](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) getter was called during destructuring but never again — the reactive subscription was never created inside a tracking scope.

**FIX:** Always access props directly: `props.name`, or use [`splitProps()`](https://docs.solidjs.com/reference/component-apis/split-props) / `mergeProps()` which preserve reactivity:

```tsx
function Greeting(props: { name: string }) {
  return <span>{props.name}</span>; // ← reactive
}
```

## Experiment 2: Early Return Before Signal Read

SolidJS tracks which signals are read **during the first synchronous execution** of a `createEffect` or JSX expression. If you return early before reading a signal, that signal is invisible to the tracker.

**DO:** Create an effect with a conditional early return:

```tsx
const [enabled, setEnabled] = createSignal(false);
const [count, setCount] = createSignal(0);

createEffect(() => {
  if (!enabled()) return; // exits before count() is read
  console.log("Count is:", count());
});
```

Now run: `setCount(5)`, then `setCount(10)`.

**OBSERVE:** Nothing logs. The effect ran once, hit `!enabled()` (which is `true` because `enabled()` is `false`), returned, and never subscribed to `count`. Even after you change `count` to 5 or 10, the effect doesn't re-run because it only tracks `enabled`.

**FIX:** Now run `setEnabled(true)`. The effect re-runs (because `enabled` is tracked), and this time it reads `count()` — subscribing to it. From this point forward, `setCount(20)` will trigger the effect. To avoid the conditional-subscription bug entirely, read all signals at the top of the effect:

```tsx
createEffect(() => {
  const isEnabled = enabled();
  const currentCount = count();
  if (!isEnabled) return;
  console.log("Count is:", currentCount);
});
```

## Experiment 3: Async After Await

SolidJS tracking is **synchronous**. Any signal read after an `await` happens outside the reactive tracking scope because the continuation runs in a new microtask.

**DO:** Create an effect that reads a signal after an await:

```tsx
const [userId, setUserId] = createSignal(1);

createEffect(async () => {
  await Promise.resolve(); // simulates any async operation
  console.log("User ID:", userId()); // ← read after await
});
```

Run `setUserId(2)`, then `setUserId(3)`.

**OBSERVE:** The effect logs `"User ID: 1"` once and never again. Changing `userId` has no effect. The reactive subscription is dead.

**EXPLAIN:** `createEffect` executes the function synchronously. It encounters `await`, which returns a Promise and exits the synchronous execution. The tracking scope closes. When the microtask resumes after `await`, `userId()` is read — but there's no active tracking scope, so no subscription is created.

**FIX:** Read all reactive dependencies **before** any `await`:

```tsx
createEffect(() => {
  const id = userId(); // ← read synchronously, tracked
  fetchUser(id);       // async work uses the captured value
});

async function fetchUser(id: number) {
  await fetch(`/api/users/${id}`);
  // ...
}
```

## Experiment 4: Accessing Store Outside Tracking Scope

SolidJS stores (like `desktop-store.ts` in this codebase) use deep Proxies. Reading a store property outside any effect or JSX expression creates no subscription.

**DO:** In the browser console on the running app, try:

```js
// Access the store directly (not inside a component or effect)
const state = document.querySelector('[data-desktop]')?.__store;
// Or simulate with:
import { createStore } from "solid-js/store";
const [state, setState] = createStore({ windows: { a: { title: "Test" } } });

// Read outside any tracking scope:
const title = state.windows.a.title;
console.log(title); // "Test"

setState("windows", "a", "title", "Updated");
console.log(title); // still "Test" — it's just a string
```

**OBSERVE:** `title` is `"Test"` even after the store update. The variable holds a primitive string, not a reactive reference.

**EXPLAIN:** Store Proxies intercept property access and create subscriptions — but only inside a tracking scope (`createEffect`, `createMemo`, JSX expressions). Outside these scopes, the Proxy getter returns the value but nobody records the dependency. See `desktop-store.ts` lines where `setState` is called — every consumer that needs to react reads from `state.windows[id].title` inside JSX, not from a captured variable.

**FIX:** Always read store properties inside a reactive context:

```tsx
createEffect(() => {
  console.log(state.windows.a.title); // re-runs on every change
});
```

## Experiment 5: Stale Closure in setTimeout

Signals return the current value when called, but a `setTimeout` captures the **function reference**, not the value. The real danger is when the timeout callback reads state that was valid when the closure was created but stale when it executes.

**DO:**

```tsx
const [count, setCount] = createSignal(0);

createEffect(() => {
  const current = count(); // tracked, effect re-runs
  setTimeout(() => {
    console.log("Delayed count:", current); // ← stale!
  }, 2000);
});
```

Run `setCount(1)`, then quickly `setCount(2)`, then `setCount(3)`.

**OBSERVE:** After 2 seconds, you see three logs: `0`, `1`, `2`. The value `3` is logged 2 seconds after the last `setCount`. Each timeout captured `current` at the moment the effect ran, not the latest value. If you expected only the final value, this is a bug.

**EXPLAIN:** Each time `count` changes, the effect re-runs and creates a **new** `setTimeout` with the value at that instant. The old timeouts still fire with their captured values. This isn't a reactivity break per se — SolidJS is working correctly — but it's a common source of bugs when developers assume the callback sees "live" data.

**FIX:** If you only want the latest value, call the signal getter inside the timeout (not a captured variable), or use a debounce pattern:

```tsx
createEffect(() => {
  count(); // subscribe to changes
  const timer = setTimeout(() => {
    console.log("Delayed count:", count()); // ← reads CURRENT value
  }, 2000);
  onCleanup(() => clearTimeout(timer)); // cancel previous timeout
});
```

The `onCleanup` ensures that when `count` changes, the previous timeout is cancelled, and only the latest one fires.

## Wrap-Up

These five patterns all share one root cause: SolidJS builds its dependency graph during **synchronous execution inside tracking scopes**. Anything that moves a signal read outside that scope — destructuring, early returns, `await`, global scope, or stale closures — breaks the reactive chain.

The mental model: think of `createEffect` as a function that SolidJS watches while it runs. It notes every signal and store property you touch. When any of those change, it re-runs the function. But it only watches the **first synchronous run**. Anything read later (after `await`, inside `setTimeout`, or from a destructured variable) is invisible.

For the real-world application, examine `src/components/desktop/store/desktop-store.ts` — notice how every consumer reads `state.windows[id]` inside JSX or effects, never from destructured variables. The `Window.tsx` component accesses `props.window.x` and `props.window.y` directly, keeping the Proxy chain intact for reactive positioning.

## Cleanup

```bash
rm src/lab-reactivity.tsx
git checkout feat/knowledge-base
git branch -D lab/break-reactivity
```
