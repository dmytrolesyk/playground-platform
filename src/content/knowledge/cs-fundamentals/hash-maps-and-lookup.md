---
title: "Hash Maps and O(1) Lookup"
category: cs-fundamentals
summary: "How hash maps power constant-time lookups — from collision handling to why Record<string, WindowState> is the beating heart of the desktop store."
difficulty: intermediate
relatedConcepts:
  - architecture/state-management
  - architecture/app-registry
  - concepts/fine-grained-reactivity
relatedFiles:
  - src/components/desktop/store/desktop-store.ts
  - src/components/desktop/store/types.ts
  - src/components/desktop/apps/registry.ts
technologies:
  - typescript
  - solidjs
order: 1
dateAdded: 2026-04-20
lastUpdated: 2026-04-23
externalReferences:
  - title: "Introduction to Algorithms (CLRS) — Chapter 11: Hash Tables"
    url: "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/"
    type: book
  - title: "V8 Blog — Fast Properties in V8"
    url: "https://v8.dev/blog/fast-properties"
    type: article
  - title: "MDN — Map"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map"
    type: docs
  - title: "Hash table — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Hash_table"
    type: article
  - title: "TypeScript Handbook — Index Signatures"
    url: "https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures"
    type: docs
module: reactivity
moduleOrder: 7
estimatedMinutes: 15
prerequisites:
  - architecture/overview
learningObjectives:
  - "Explain how hash maps achieve O(1) average-case lookup and why the worst case is O(n)"
  - "Identify hash map usage in the desktop store and app registry and explain why it was chosen over arrays"
  - "Predict the performance difference between looking up a window by ID in a Record vs finding it in an array"
exercises:
  - question: "The desktop store uses `Record<string, WindowState>` for `state.windows`. If it used an array instead, what would change about `focusWindow(id)` performance when 20 windows are open?"
    type: predict
    hint: "Think about how you'd find a specific window in an array vs a hash map."
    answer: "With a Record (hash map), focusWindow looks up the window by ID in O(1) — one property access regardless of how many windows exist. With an array, you'd need Array.find() which scans elements sequentially — O(n) in the worst case. With 20 windows this is negligible, but the bigger issue is ergonomics: every operation (focus, move, resize, close) would need a linear scan. The hash map also prevents duplicate IDs by construction, while an array could accidentally contain two entries with the same ID. The Record was chosen not primarily for raw speed but for semantic correctness: windows are keyed entities, and a map is the natural data structure for key-value relationships."
  - question: "Open the browser DevTools console on the CV desktop. Run: `performance.now()` before and after accessing a property on a large object (1 million keys) vs calling Array.find on an array with 1 million objects. What's the ratio?"
    type: do
    hint: "Create the test data with a loop. Access the last-inserted key."
    answer: "The object property access completes in microseconds (typically <0.01ms) regardless of size. The Array.find scans linearly and takes several milliseconds for 1M elements — roughly 100-1000x slower. V8 optimizes object property access using hidden classes and inline caches (for objects with stable shapes) or hash tables (for dictionary-mode objects with many dynamic keys). With 1M keys V8 switches to dictionary mode, but the hash lookup is still O(1) amortized. The array scan is always O(n). This demonstrates why indexed data structures like the window store use maps, not arrays."
  - question: "Why does APP_REGISTRY use `Record<string, AppRegistryEntry>` with string IDs like 'browser', 'terminal', 'snake' instead of a Map object?"
    type: explain
    answer: "Plain objects with string keys work well here because: (1) the keys are static string literals known at registration time, making them natural property names; (2) TypeScript's Record type provides good type inference for property access; (3) V8 optimizes objects with string keys that are added in initialization and rarely deleted — they stay in 'fast mode' with inline caches; (4) objects serialize to JSON naturally, while Maps don't; (5) SolidJS stores track plain object properties reactively via Proxies, but would need special handling for Map. A Map would be preferable if keys were non-string types, if entries were frequently added/deleted at runtime, or if key ordering mattered (Map preserves insertion order reliably across all operations)."
---

## Why Should I Care?

You click a window in the taskbar. The desktop store needs to find that window's state — its position, size, z-index, whether it's minimized. There might be 3 windows open, or 15. The lookup needs to be instant, every time, because it happens on every click, every drag frame, every keyboard shortcut.

In `src/components/desktop/store/types.ts`, the answer is one line:

```typescript
windows: Record<string, WindowState>;
```

That `Record<string, WindowState>` is a hash map. It's the reason `state.windows['terminal-3']` runs in constant time whether there are 2 windows or 200. Understanding hash maps — how they work, when they break, and why JavaScript objects are secretly hash maps — is foundational to understanding how keyed data flows through this entire application.

## What Is a Hash Map?

A [hash map](https://en.wikipedia.org/wiki/Hash_table) (also called hash table, dictionary, or associative array) stores key-value pairs with O(1) average-case lookup, insertion, and deletion. The trick: instead of searching through items to find a key, it computes a **hash function** on the key to jump directly to the storage location.

```mermaid
flowchart LR
    K["Key: 'terminal-3'"] --> HF["Hash Function"]
    HF --> I["Index: 7"]
    I --> B["Bucket 7"]
    B --> V["Value: WindowState"]

    subgraph "Hash Table (internal array)"
        B0["Bucket 0: empty"]
        B1["Bucket 1: browser-1 → {...}"]
        B2["Bucket 2: empty"]
        B7["Bucket 7: terminal-3 → {...}"]
        BN["Bucket N: snake-1 → {...}"]
    end

    style HF fill:#ffd54f
    style B7 fill:#81c784
```

The hash function converts the key string into an array index. To look up `'terminal-3'`, the map computes `hash('terminal-3')`, gets an index (say 7), and goes directly to bucket 7. No scanning. No comparison with other keys. Just arithmetic and one memory access.

### The Big-O Story

| Operation | Average Case | Worst Case |
|---|---|---|
| Lookup | O(1) | O(n) |
| Insert | O(1) | O(n) |
| Delete | O(1) | O(n) |

The worst case happens when many keys **collide** — hash to the same bucket. Good hash functions and proper table sizing make collisions rare, keeping the amortized cost at O(1).

## Collision Handling

When two keys hash to the same index, a collision occurs. Two main strategies exist:

**Chaining** — each bucket holds a linked list (or small array) of entries. Colliding keys go into the same list. Lookup scans the short list at the target bucket. Most textbook implementations use this.

**Open addressing** — on collision, probe other buckets using a deterministic sequence (linear probing, quadratic probing, double hashing). V8's internal hash tables use a variant of this for memory efficiency.

```mermaid
flowchart TD
    subgraph "Chaining"
        BC["Bucket 3"] --> E1["'browser-1' → {...}"]
        E1 --> E2["'settings-1' → {...}"]
    end
    subgraph "Open Addressing (Linear Probing)"
        BP3["Bucket 3: 'browser-1' → {...}"]
        BP4["Bucket 4: 'settings-1' → {...}<br/>(probed from 3)"]
        BP5["Bucket 5: empty"]
    end

    style BC fill:#bbdefb
    style BP3 fill:#c8e6c9
    style BP4 fill:#c8e6c9
```

The **load factor** (entries / buckets) determines when the table resizes. Typical threshold: 0.75. When exceeded, the table doubles in size and rehashes all entries — an O(n) operation, but amortized over many inserts it averages O(1) per insert.

## Hash Maps in This Codebase

### The Window Store

The core state structure in `src/components/desktop/store/desktop-store.ts`:

```typescript
const [state, setState] = createStore<DesktopState>({
  windows: {},
  windowOrder: [],
  nextZIndex: 10,
  // ...
});
```

`windows` is a hash map from window ID to `WindowState`. Every window operation is a direct property access:

```typescript
// O(1) — direct hash lookup
const win = state.windows[id];

// Compare with an array approach:
// O(n) — linear scan
const win = state.windowsArray.find(w => w.id === id);
```

The `windowOrder` array complements the map: it tracks z-order (which window is on top). The map provides fast lookup by ID; the array provides ordered iteration. This is a common pattern — **use a map for keyed access, an array for ordered traversal**.

### The App Registry

`APP_REGISTRY` in `src/components/desktop/apps/registry.ts` is another hash map:

```typescript
export const APP_REGISTRY: Record<string, AppRegistryEntry> = {};

export function registerApp(entry: AppRegistryEntry): void {
  APP_REGISTRY[entry.id] = entry;
}
```

When you type `open browser` in the terminal, the command handler does `APP_REGISTRY['browser']` — O(1) lookup from the user's string input to the app definition. Without a hash map, you'd scan every registered app comparing IDs.

## JavaScript Objects as Hash Maps

In JavaScript, plain objects (`{}`) and `Map` are both hash maps, but they work differently under the hood.

**Plain objects** — V8 uses **[hidden classes](https://v8.dev/blog/fast-properties)** (also called "shapes" or "maps" internally) for objects with known property sets. When properties are added in a consistent order (like the `WindowState` interface), V8 creates a hidden class that maps property names to fixed memory offsets — even faster than hash lookup. But when objects have many dynamic keys added and deleted (like `state.windows` where window IDs come and go), V8 switches to **dictionary mode** — a true hash table.

**[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) objects** — always use a hash table internally. They support any key type (not just strings), preserve insertion order, have a `.size` property, and are optimized for frequent additions and deletions.

For this codebase, plain objects win because:
1. SolidJS's `createStore` wraps objects in Proxies for reactivity tracking — it expects plain objects
2. TypeScript's `Record<K, V>` type provides strong typing for object property access
3. Window IDs are always strings, so no need for non-string keys

## Performance: When Hash Maps Lose

Hash maps aren't always the answer:

- **Small collections (< ~10 items)**: Linear scan through an array can beat hash lookup due to CPU cache locality. The array elements sit in contiguous memory; the hash table has pointer indirection.
- **Ordered iteration**: Hash maps don't guarantee order. The `windowOrder` array exists precisely because `Object.keys(state.windows)` doesn't reflect z-order.
- **Memory overhead**: Each hash table entry carries overhead (hash values, pointers, load factor headroom). For simple indexed data, an array is more memory-efficient.
- **Pathological hash collisions**: If all keys hash to the same bucket, every operation degrades to O(n). JavaScript engines use strong hash functions to prevent this, but algorithmic denial-of-service attacks have exploited weak hash functions in web servers.

## Deeper Rabbit Holes

- **Perfect hashing**: When the key set is known in advance (like the fixed set of app IDs), a perfect hash function maps each key to a unique slot with zero collisions. Compilers use this for keyword tables.
- **Consistent hashing**: Used in distributed systems to minimize key redistribution when nodes are added or removed. Relevant if you ever build a distributed version of the window manager.
- **Bloom filters**: A probabilistic data structure built on hash functions. It can tell you "definitely not in the set" or "probably in the set" — useful for caches and spell checkers.
- **V8 hidden classes**: V8's optimization for objects with predictable shapes. When you define `WindowState` as an interface and all windows have the same properties, V8 creates a hidden class that makes property access as fast as a struct field offset in C.
