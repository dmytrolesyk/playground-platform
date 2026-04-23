---
title: "Trees and Traversal"
category: cs-fundamentals
summary: "Tree data structures, DOM traversal, component hierarchies, and the BFS/DFS algorithms that power everything from querySelector to rendering order."
difficulty: intermediate
prefLabel: "Trees & Traversal"
altLabels:
  - "tree data structure"
  - "DOM traversal"
  - "BFS"
  - "DFS"
  - "breadth-first search"
  - "depth-first search"
broader: []
narrower:
  - cs-fundamentals/graph-validation
relatedConcepts:
  - architecture/overview
  - cs-fundamentals/hash-maps-and-lookup
  - concepts/browser-rendering-pipeline
  - concepts/fine-grained-reactivity
relatedFiles:
  - src/components/desktop/Desktop.tsx
  - src/components/desktop/WindowManager.tsx
  - src/components/desktop/Window.tsx
  - src/components/desktop/store/context.tsx
technologies:
  - solidjs
  - typescript
order: 2
dateAdded: 2026-04-20
lastUpdated: 2026-04-23
externalReferences:
  - title: "Introduction to Algorithms (CLRS) — Chapter 12: Binary Search Trees"
    url: "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/"
    type: book
  - title: "MDN — Document Object Model (DOM)"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model"
    type: docs
  - title: "DOM Living Standard — Traversal"
    url: "https://dom.spec.whatwg.org/#traversal"
    type: docs
  - title: "SolidJS — Component Lifecycle"
    url: "https://docs.solidjs.com/concepts/components/basics"
    type: docs
  - title: "Tree Traversal — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Tree_traversal"
    type: article
  - title: "closest — MDN Web Docs"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/closest"
    type: docs
module: reactivity
moduleOrder: 8
estimatedMinutes: 18
prerequisites:
  - architecture/overview
  - cs-fundamentals/hash-maps-and-lookup
learningObjectives:
  - "Distinguish between BFS and DFS traversal and explain when each is appropriate"
  - "Trace the DOM tree from Desktop down to a specific Window child and explain what closest() does at each step"
  - "Describe how the component tree maps to the DOM tree and where they diverge"
exercises:
  - question: "In Window.tsx, `target.closest('.win-container')` walks up the DOM. Is this BFS or DFS? What's its time complexity relative to tree depth?"
    type: predict
    hint: "closest() starts at the current element and checks ancestors one by one."
    answer: "It's neither BFS nor DFS in the classical sense — it's a linear ancestor walk. closest() starts at the target element and walks up through parentElement references, checking each ancestor against the CSS selector. It stops at the first match or returns null at the document root. Time complexity is O(d) where d is the depth of the element in the DOM tree. Since the desktop DOM is shallow (Desktop → window-layer → win-container → title-bar → button is about 5-6 levels), this is effectively O(1) in practice. This upward traversal is the opposite of top-down tree search — it exploits the parent pointer that every DOM node maintains."
  - question: "Open DevTools on the CV desktop. In the console, run `document.querySelectorAll('.window')` and `document.querySelector('.window')`. The first returns all windows, the second returns the first. Which uses BFS (breadth-first) traversal?"
    type: do
    hint: "querySelector returns the first match in document order. What traversal order is document order?"
    answer: "Both use depth-first, pre-order traversal — which IS document order. The DOM spec defines 'tree order' as depth-first pre-order: visit the node, then recurse into children left-to-right. querySelector stops at the first match; querySelectorAll collects all matches but still visits nodes in depth-first order. You can verify this: if you have nested elements matching the selector, querySelector returns the outermost (shallowest) one that appears first in document order, not the one closest to the root in terms of breadth-first layers."
  - question: "Why does the component tree (Desktop → WindowManager → Window → AppComponent) not map 1:1 to the DOM tree?"
    type: explain
    answer: "SolidJS components are functions that run once and return DOM nodes — they don't create 'component instances' in the DOM like React's fiber tree. The component tree is a compile-time/authoring concept: Desktop calls WindowManager which calls Window which calls Dynamic. But the DOM tree is what the browser actually renders: div.desktop → div.window-layer → div.win-container → div.window-body → [app content]. Context providers like DesktopProvider add no DOM nodes at all — they exist only in the SolidJS ownership tree for reactive scope tracking. The For component in WindowManager also adds no wrapper DOM node. So the DOM tree is often flatter than the component tree, with fewer intermediate nodes."
  - question: "Write a depth-first traversal function that collects all text content from a DOM-like tree."
    type: code
    language: javascript
    starterCode: |
      function collectText(node) {
        // node has: .text (string or null), .children (array of nodes)
        // Return an array of all text values in DFS pre-order
        // your implementation here
      }
    solution: |
      function collectText(node) {
        const result = [];
        if (node.text) result.push(node.text);
        for (const child of node.children) {
          result.push(...collectText(child));
        }
        return result;
      }
    testCases:
      - input: "collectText({ text: 'a', children: [{ text: 'b', children: [] }, { text: 'c', children: [] }] });"
        expected: "['a', 'b', 'c']"
      - input: "collectText({ text: null, children: [{ text: 'x', children: [{ text: 'y', children: [] }] }] });"
        expected: "['x', 'y']"
    hint: "Pre-order means visit the node first, then recurse into children left-to-right. This is the same order as document order in the DOM."
    answer: "This is DFS pre-order traversal — the same traversal order the DOM uses for 'document order'. The function visits the current node first (collecting its text), then recurses into each child. This matches how querySelector traverses the DOM and how the browser walks the tree during rendering. The recursive version is clean but has O(d) call stack depth where d is tree depth. For very deep trees, an iterative version with an explicit stack avoids stack overflow."
    targetConcepts:
      - cs-fundamentals/trees-and-traversal
---

## Why Should I Care?

When you right-click inside a window on this desktop, the browser needs to figure out *which* window you clicked. It doesn't search every element on the page — it walks up the DOM tree from the click target using `closest('.win-container')`. When SolidJS renders the window list, it traverses the [component](https://docs.solidjs.com/concepts/components/basics) tree from `Desktop` down through `WindowManager` to each `Window`. When the browser paints the screen, it traverses the render tree to calculate layout.

Trees are everywhere in frontend development. The [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) is a tree. The component hierarchy is a tree. The CSS selector engine traverses trees. Understanding tree structures and [traversal algorithms](https://en.wikipedia.org/wiki/Tree_traversal) isn't abstract computer science — it's the mental model you need to reason about how every click, render, and layout calculation actually works (see [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/)).

## Trees: The Core Abstraction

A tree is a hierarchical data structure where each node has zero or more children, and every node except the root has exactly one parent. No cycles, no multiple parents.

```mermaid
graph TD
    D["Desktop"] --> IM["DesktopIconGrid"]
    D --> WM["WindowManager"]
    D --> TB["Taskbar"]
    WM --> W1["Window (browser-1)"]
    WM --> W2["Window (terminal-1)"]
    W1 --> TB1["TitleBar"]
    W1 --> APP1["BrowserApp"]
    W2 --> TB2["TitleBar"]
    W2 --> APP2["TerminalApp"]

    style D fill:#e3f2fd
    style WM fill:#e8f5e9
    style W1 fill:#fff9c4
    style W2 fill:#fff9c4
```

Key terminology:
- **Root**: The topmost node (`Desktop` in the component tree, `<html>` in the DOM)
- **Leaf**: A node with no children (a text node, a button)
- **Depth**: Distance from root to node. Root has depth 0.
- **Height**: Longest path from node to a leaf. Leaves have height 0.
- **Subtree**: A node and all its descendants. Each `Window` component is the root of its own subtree.

## Two Ways to Walk a Tree

Every tree algorithm boils down to visiting nodes in some order. The two fundamental strategies:

### Depth-First Search (DFS)

Go deep before going wide. From the root, visit a child, then that child's child, all the way to a leaf, then backtrack and visit the next sibling.

Three flavors for binary trees (generalized for n-ary trees):
- **Pre-order**: Visit node, then children. DOM document order uses this.
- **In-order**: Visit left child, node, right child. Used for BST sorted traversal.
- **Post-order**: Visit children, then node. Used for cleanup/disposal (SolidJS disposes children before parent scope).

### Breadth-First Search (BFS)

Go wide before going deep. Visit all nodes at depth 0, then depth 1, then depth 2, and so on. Uses a queue.

```mermaid
flowchart LR
    subgraph "DFS (Pre-order)"
        direction TB
        DA["1: Desktop"] --> DB["2: IconGrid"]
        DA --> DC["3: WindowManager"]
        DC --> DD["4: Window-1"]
        DC --> DE["5: Window-2"]
    end

    subgraph "BFS (Level-order)"
        direction TB
        BA["1: Desktop"] --> BB["2: IconGrid"]
        BA --> BC["3: WindowManager"]
        BA --> BD["4: Taskbar"]
        BC --> BE["5: Window-1"]
        BC --> BF["6: Window-2"]
    end

    style DA fill:#ffcdd2
    style BA fill:#c8e6c9
```

**DFS** is natural for recursive structures — and components are recursive. A component renders its children, which render their children. The call stack itself acts as the traversal stack.

**BFS** is useful when you care about proximity to the root — finding the nearest ancestor matching a condition, or rendering layers in z-order.

## Trees in This Codebase

### The DOM Tree and `closest()`

In `src/components/desktop/Window.tsx`, click handling uses upward DOM traversal:

```typescript
const handleDragStart = (e: PointerEvent): void => {
  const clicked = e.target as HTMLElement;
  if (clicked.closest('.title-bar-controls')) return;
  // ...
  const windowEl = target.closest('.win-container') as HTMLElement | null;
};
```

[`Element.closest(selector)`](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) walks the **ancestor chain** — from the clicked element up through parents toward the document root. It's a linear walk up one branch of the tree, not a full traversal. The DOM spec defines it as: "return the first ancestor (or self) that matches the selector."

This is the browser's built-in tree navigation. Every [DOM](https://dom.spec.whatwg.org/#traversal) node has a `parentElement` reference, making upward traversal O(d) where d is the depth. The desktop's DOM is shallow — typically 5-8 levels from a button inside a window to the root — so `closest()` is effectively instant.

### The Component Tree

The SolidJS component hierarchy forms a tree:

```
Desktop
├── DesktopProvider (no DOM output — context only)
│   ├── CrtMonitorFrame
│   ├── DesktopIconGrid
│   ├── WindowManager
│   │   └── For each window:
│   │       └── Window
│   │           ├── TitleBar
│   │           └── Suspense
│   │               └── Dynamic (app component)
│   └── Taskbar
```

But this component tree doesn't map 1:1 to the DOM tree. `DesktopProvider` adds no DOM element — it only establishes a SolidJS context scope. `For` adds no wrapper element — it directly inserts/removes child DOM nodes. This divergence between component tree and DOM tree is important: when you inspect the DOM in DevTools, you see the physical tree; when you read the source code, you see the logical component tree.

### WindowManager's Iteration

`WindowManager` in `src/components/desktop/WindowManager.tsx` iterates the window list:

```typescript
const openWindows = (): WindowState[] => {
  return state.windowOrder
    .map((id) => state.windows[id])
    .filter((w): w is WindowState => w !== undefined);
};

return (
  <For each={openWindows()}>
    {(win: WindowState) => <Window window={win}>...</Window>}
  </For>
);
```

This is flat iteration (the window list is an array), but the result is a tree: each `Window` becomes a subtree in the DOM with title bar, body, resize handles, and app content as descendants.

### Event Bubbling: Implicit Tree Traversal

When you click a button inside a window, the browser dispatches the event through three phases — all tree traversals:

1. **Capture phase**: DFS from root to target (downward)
2. **Target phase**: The clicked element handles the event
3. **Bubble phase**: Walk from target back up to root (upward)

The `handleDragStart` in `Window.tsx` listens during the bubble phase (the default). When a click on a title-bar button bubbles up to the title bar's `onPointerDown`, the handler checks `clicked.closest('.title-bar-controls')` to determine if the click originated from a control button — using tree traversal to make a decision about tree-structured UI.

## Tree Algorithms You Use Without Knowing

- **`querySelector` / `querySelectorAll`**: DFS pre-order traversal of the DOM, matching each node against the CSS selector.
- **`document.getElementById`**: Technically a hash map lookup (browsers index IDs), not a tree traversal. That's why it's faster.
- **CSS selector matching**: The browser matches selectors right-to-left. For `.window .title-bar`, it first finds all `.title-bar` elements, then walks up each one's ancestor chain checking for `.window`. Upward ancestor walk, not downward search.
- **Layout calculation**: The browser traverses the render tree to compute box positions. Some properties (like `width: 50%`) require a top-down pass; others (like auto height from content) require bottom-up. The browser does multiple passes.
- **Garbage collection**: The GC traverses the object graph (which is a general graph, not strictly a tree) from roots to find reachable objects. More on this in [Memory Management and GC](/learn/cs-fundamentals/memory-management-and-gc).

## Tree Complexity

| Operation | Time | Notes |
|---|---|---|
| DFS traversal | O(n) | Visit every node once |
| BFS traversal | O(n) | Visit every node once |
| `closest()` ancestor walk | O(d) | d = depth of starting element |
| Binary search tree lookup | O(log n) average | O(n) if tree is unbalanced |
| DOM `getElementById` | O(1) | Hash map, not tree search |

The key insight: traversing an entire tree is always O(n) — you must visit every node. But if you're searching for one node, the tree's structure determines whether you can skip subtrees (BST: O(log n)) or must visit everything (unsorted tree: O(n)).

## Deeper Rabbit Holes

- **Red-black trees / AVL trees**: Self-balancing binary search trees that guarantee O(log n) operations. Used internally by database indexes and `std::map` in C++. JavaScript doesn't expose balanced trees natively, but `Map` iteration order is guaranteed by insertion order (not tree-sorted order).
- **Trie (prefix tree)**: A tree where each edge is a character. Used for autocomplete and IP routing tables. If the terminal's command matching needed prefix search (`op` → `open`), a trie would be the data structure.
- **Abstract Syntax Trees (AST)**: The compiler/bundler parses your JSX into an AST — a tree — then transforms it. SolidJS's compiler walks the JSX AST to generate the fine-grained reactive bindings. Every JSX expression becomes a node in the AST that gets compiled to a DOM creation call.
- **Virtual DOM as tree diffing**: React's reconciliation algorithm diffs two virtual DOM trees. This is an O(n) heuristic algorithm (true tree diff is O(n³)). SolidJS avoids this entirely by not having a virtual DOM — another reason to understand trees and their algorithmic costs.
