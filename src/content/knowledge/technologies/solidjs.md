---
title: "SolidJS — Signals, Not Virtual DOM"
category: technology
summary: "The reactive UI framework powering the desktop — how it works, why it was chosen, and how we use it."
difficulty: beginner
relatedConcepts:
  - concepts/fine-grained-reactivity
  - concepts/signals-vs-vdom
technologies:
  - solidjs
order: 1
dateAdded: 2026-04-20
externalReferences:
  - title: "SolidJS Official Documentation"
    url: "https://www.solidjs.com/"
    type: docs
  - title: "SolidJS Tutorial"
    url: "https://www.solidjs.com/tutorial"
    type: docs
  - title: "SolidJS GitHub Repository"
    url: "https://github.com/solidjs/solid"
    type: repo
---

## What Is SolidJS?

SolidJS is a reactive UI framework that looks like React but works fundamentally differently. Components run **once** (at mount time). Reactive expressions in JSX create direct DOM subscriptions. No virtual DOM, no diffing.

## Key Primitives

### Signals

```typescript
const [count, setCount] = createSignal(0);
// count() reads + subscribes
// setCount(1) writes + notifies
```

### Effects

```typescript
createEffect(() => {
  console.log('Count is:', count()); // Re-runs when count changes
});
```

### Stores

```typescript
const [state, setState] = createStore({ user: { name: 'Alice' } });
// Fine-grained: reading state.user.name tracks only that path
setState('user', 'name', 'Bob'); // Only subscribers of user.name update
```

## How We Use It

### Single Island

The entire desktop is one SolidJS component tree, hydrated via `<Desktop client:load />` in Astro. All state lives in one `createStore` distributed via context.

### Store + produce

Nested state updates use `produce()` from `solid-js/store`:

```typescript
setState(produce((s) => {
  const win = s.windows[id];
  if (win) {
    win.x = newX;
    win.y = newY;
  }
}));
```

### lazy() + Suspense

Heavy components are code-split:

```typescript
const TerminalApp = lazy(() => import('./TerminalApp'));
// In JSX:
<Suspense fallback={<Loading />}>
  <TerminalApp />
</Suspense>
```

### For + Show

SolidJS flow components (not array.map / ternary):

```typescript
<For each={items()}>{(item) => <div>{item.name}</div>}</For>
<Show when={isVisible()} fallback={<Placeholder />}>
  <Content />
</Show>
```

## Why SolidJS Over React?

1. **Performance** — No virtual DOM overhead for the many small updates during window drag
2. **Bundle size** — SolidJS is ~7KB vs React's ~40KB
3. **Mental model** — Components as setup functions (run once) vs render functions (run repeatedly)
4. **Astro integration** — First-class Astro integration with `@astrojs/solid-js`
