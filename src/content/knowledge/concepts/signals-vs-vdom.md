---
title: "Signals vs Virtual DOM"
category: concept
summary: "Two fundamentally different approaches to keeping UI in sync with state — and why SolidJS chose signals."
difficulty: intermediate
relatedConcepts:
  - concepts/fine-grained-reactivity
  - concepts/observer-pattern
  - concepts/browser-rendering-pipeline
  - concepts/javascript-proxies
  - concepts/event-loop-and-microtasks
technologies:
  - solidjs
order: 2
dateAdded: 2026-04-20
lastUpdated: 2026-04-20
externalReferences:
  - title: "Virtual DOM is pure overhead — Rich Harris"
    url: "https://svelte.dev/blog/virtual-dom-is-pure-overhead"
    type: article
  - title: "Rethinking Reactivity — Rich Harris (talk)"
    url: "https://www.youtube.com/watch?v=AdNJ3fydeao"
    type: talk
  - title: "SolidJS — Why SolidJS?"
    url: "https://www.solidjs.com/guides/getting-started#why-solidjs"
    type: docs
  - title: "React Fiber Architecture"
    url: "https://github.com/acdlite/react-fiber-architecture"
    type: article
  - title: "Svelte — Rethinking Reactivity"
    url: "https://svelte.dev/blog/svelte-3-rethinking-reactivity"
    type: article
module: reactivity
moduleOrder: 2
estimatedMinutes: 15
prerequisites:
  - concepts/fine-grained-reactivity
learningObjectives:
  - "Compare the update strategies of React (VDOM diffing) and SolidJS (direct signal bindings)"
  - "Explain why VDOM reconciliation has O(n) overhead that signals avoid"
  - "Identify scenarios where each approach has advantages"
exercises:
  - question: "In a list of 1000 items where one item's text changes, how many DOM operations happen with SolidJS signals vs React VDOM?"
    type: predict
    hint: "Think about what each framework must check to find the change."
    answer: "SolidJS: exactly 1 DOM operation — update the specific text node bound to that item's signal. The signal directly knows which DOM node to update. React: at minimum, React must re-run the parent component, diff 1000 virtual DOM list items, identify the one difference, then perform 1 DOM operation. The diffing work is O(n) even though only 1 item changed. SolidJS skips the diffing entirely."
  - question: "Why does React need 'key' props on list items but SolidJS's <For> component doesn't need them for correct updates?"
    type: explain
    answer: "React's VDOM diffing algorithm uses keys to match old and new virtual nodes — without keys, it falls back to index-based matching which breaks on reorders. SolidJS's <For> tracks each item by reference identity and maintains a direct binding between each item and its DOM nodes. When the list changes, SolidJS moves or removes the actual DOM nodes — it doesn't diff a virtual tree, so it doesn't need keys to match nodes across renders."
  - question: "When does React's VDOM approach actually outperform SolidJS's signals?"
    type: predict
    hint: "Think about bulk updates that change many things at once."
    answer: "VDOM can batch large structural changes more efficiently. If 80% of a complex UI changes at once (e.g., a route transition replacing the entire page), VDOM diffs the whole tree and applies changes in one pass. Signals would fire hundreds of individual updates. In practice, this rarely matters because route transitions are infrequent and browsers batch DOM mutations. Signals win in the common case: frequent, small, localized updates like drag, typing, and animations."
---

## Why Should I Care?

The choice between signals and virtual DOM isn't just a framework preference — it determines how much work the browser does on every state change. For a desktop window manager that updates window positions at 60fps during drag, this difference is the gap between smooth interaction and visible jank. Understanding both approaches lets you choose the right tool for the job and predict how your UI will perform under load.

## The Virtual DOM Approach (React)

[React](https://react.dev/) re-runs your component function on every state change, producing a new virtual DOM tree. It then **[diffs](https://legacy.reactjs.org/docs/reconciliation.html)** the old and new trees to figure out what actually changed in the real DOM:

```mermaid
flowchart LR
    A[State Change] --> B[Re-run Component<br/>+ all children]
    B --> C[New VDOM Tree]
    C --> D[Diff Old ↔ New]
    D --> E[Patch Real DOM]

    style A fill:#fce4ec
    style D fill:#fff3e0
```

**Advantages:** Simple mental model — your component is a pure function of state. Easy to reason about, easy to debug.

**Disadvantages:** The diff is work. Every state change re-runs the entire component function and all its children (unless you manually add `React.memo`, `useMemo`, `useCallback`). The VDOM itself is a data structure in memory that must be allocated and garbage collected.

### Side-by-Side: React Update Trace

```typescript
// React: what happens when count changes
function Counter() {
  const [count, setCount] = useState(0);
  console.log('Component re-rendered'); // Runs EVERY TIME count changes
  return (
    <div>
      <span>{count}</span>           {/* Re-evaluated */}
      <span>Static text</span>       {/* Also re-evaluated (same result) */}
      <ChildComponent />             {/* Also re-rendered (unless memoized) */}
    </div>
  );
}
```

React's reconciler walks the entire subtree, comparing the new VDOM to the old. Even though only `count` changed, every element in the component is re-evaluated. React is smart enough to skip the actual DOM update for `<span>Static text</span>` (the VDOM node hasn't changed), but the *comparison work* still happens.

## The Signals Approach (SolidJS)

[SolidJS](https://www.solidjs.com/guides/reactivity) runs your component function **once** — at mount time. Each reactive expression in JSX becomes a direct DOM subscription. When a signal changes, only the subscribed DOM nodes update:

```mermaid
flowchart LR
    A[Signal Change] --> B[Notify Subscribers]
    B --> C[Update Specific<br/>DOM Nodes]

    style A fill:#e8f5e9
    style C fill:#e8f5e9
```

### Side-by-Side: SolidJS Update Trace

```typescript
// SolidJS: what happens when count changes
function Counter() {
  const [count, setCount] = createSignal(0);
  console.log('Component mounted'); // Runs ONCE
  return (
    <div>
      <span>{count()}</span>         {/* This expression re-runs */}
      <span>Static text</span>       {/* Never touched again */}
      <ChildComponent />             {/* Never re-rendered */}
    </div>
  );
}
```

Only the `{count()}` expression re-evaluates — a single Text node update. No component function re-execution, no VDOM diff, no tree walking. The work is proportional to what *actually changed*, not to the size of the component tree.

## The Performance Implications for This Project

The desktop has dozens of reactive values updating simultaneously during interaction:

| Interaction | Updates per second | Values changing |
|---|---|---|
| Window drag | 60 (every frame) | x, y position of one window |
| Focus change | 1 | zIndex of focused window, nextZIndex |
| Open window | 1 | windows map, windowOrder, nextZIndex, startMenuOpen |
| Resize | 60 | x, y, width, height of one window |

With **React**, dragging a window at 60fps would re-render the Window component 60 times per second. Each re-render executes the entire component function, creates a new VDOM subtree, diffs it against the previous one, and patches the DOM. Without careful memoization, the entire `WindowManager` and its children would re-render too — every open window, every taskbar button, potentially the entire desktop tree.

With **SolidJS**, dragging a window at 60fps updates exactly one CSS `transform` value 60 times per second. The update is a direct DOM property change — no component re-execution, no VDOM, no diff. The cost is O(1) regardless of how many windows are open.

```mermaid
flowchart TD
    subgraph "React: drag update path"
        R1["setState({x: 250})"] --> R2["Re-render Window component"]
        R2 --> R3["Re-render children"]
        R3 --> R4["VDOM diff"]
        R4 --> R5["Patch: style.transform = '...'"]
    end

    subgraph "SolidJS: drag update path"
        S1["setX(250)"] --> S2["style.transform = '...'"]
    end

    style R2 fill:#fff3e0
    style R3 fill:#fff3e0
    style R4 fill:#fff3e0
    style S2 fill:#e8f5e9
```

## When VDOM Actually Wins

Signals aren't universally better. VDOM approaches have advantages in specific scenarios:

1. **Large structural changes** — If the entire UI structure changes (switching between completely different views), VDOM's diffing efficiently determines the minimal set of DOM operations. Signals would need to tear down and recreate many subscriptions.

2. **Server components (React Server Components)** — The VDOM model extends naturally to server rendering where components return serializable trees. SolidJS doesn't have an equivalent of RSC.

3. **Developer tooling** — React's component model enables time-travel debugging, component profiling, and dev tools that show the full render tree. Signal-based systems are harder to inspect because there's no "render" to profile.

4. **Ecosystem size** — React's VDOM model has 10+ years of libraries, patterns, and community knowledge.

## The Third Way: Compiled Reactivity (Svelte)

Svelte takes a different approach: the compiler analyzes your code and generates imperative DOM updates at build time. No runtime VDOM library, no runtime signal tracking:

```svelte
<script>
  let count = 0;
  // Svelte compiler detects this is reactive
</script>
<span>{count}</span>
<!-- Compiles to: if count changed, textNode.data = count -->
```

Svelte achieves similar performance to SolidJS signals but through compile-time analysis rather than runtime tracking. The tradeoff: Svelte requires a custom file format (`.svelte`), while SolidJS uses standard JSX/TSX.

For this project, SolidJS was chosen because:
- First-class Astro integration (`@astrojs/solid-js`)
- JSX syntax (familiar to React developers)
- Fine-grained stores for nested state (`createStore` + `produce`)
- Smaller runtime (~7KB vs Svelte's ~2KB — both negligible)

## What Goes Wrong Without Signals

Without fine-grained reactivity, the window manager would need extensive manual optimization:

```tsx
// React: every component in the drag path needs memoization
const Window = React.memo(({ window }) => {
  const style = useMemo(
    () => ({ transform: `translate(${window.x}px, ${window.y}px)` }),
    [window.x, window.y]
  );
  return <div style={style}>{/* ... */}</div>;
});

const WindowManager = React.memo(({ windows }) => {
  return windows.map(win => <Window key={win.id} window={win} />);
});
```

Every component needs `React.memo`. Every derived value needs `useMemo`. Every callback needs `useCallback`. Miss one and you get a performance cliff — one un-memoized component causes the entire subtree to re-render.

SolidJS eliminates this entire class of optimization work. The performance is correct by default.
