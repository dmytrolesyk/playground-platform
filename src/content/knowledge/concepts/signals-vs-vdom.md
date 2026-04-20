---
title: "Signals vs Virtual DOM"
category: concept
summary: "Two fundamentally different approaches to keeping UI in sync with state — and why SolidJS chose signals."
difficulty: intermediate
relatedConcepts:
  - concepts/fine-grained-reactivity
technologies:
  - solidjs
order: 2
dateAdded: 2026-04-20
externalReferences:
  - title: "Virtual DOM is pure overhead"
    url: "https://svelte.dev/blog/virtual-dom-is-pure-overhead"
    type: article
---

## The Virtual DOM Approach (React)

React re-runs your component function on every state change, producing a new virtual DOM tree. It then diffs the old and new trees to figure out what actually changed in the real DOM.

```
State Change → Re-run Component → New VDOM → Diff → Patch DOM
```

**Advantages:** Simple mental model — your component is a pure function of state. Easy to reason about.

**Disadvantages:** The diff is work. Every state change re-runs the entire component function and all its children (unless you manually add `React.memo`, `useMemo`, `useCallback`).

## The Signals Approach (SolidJS)

SolidJS runs your component function **once** — at mount time. Each reactive expression in JSX becomes a subscription. When a signal changes, only the subscribed DOM nodes update.

```
State Change → Notify Subscribers → Update Specific DOM Nodes
```

**Advantages:** Minimal work per update. No diffing. No wasted re-renders.

**Disadvantages:** Different mental model — your component function isn't re-called, so patterns like "early return" or "conditional hooks" don't apply.

## The Critical Difference

In React:
```tsx
function Counter() {
  const [count, setCount] = useState(0);
  console.log('Component re-rendered'); // Runs every time count changes
  return <span>{count}</span>;
}
```

In SolidJS:
```tsx
function Counter() {
  const [count, setCount] = createSignal(0);
  console.log('Component mounted'); // Runs ONCE
  return <span>{count()}</span>; // This expression tracks count
}
```

## Impact on This Project

The desktop has dozens of reactive values (window positions, z-indices, minimize states). With a VDOM approach, dragging a window would re-render the entire component tree unless carefully memoized. With signals, only the `transform: translate()` on the dragged window updates.
