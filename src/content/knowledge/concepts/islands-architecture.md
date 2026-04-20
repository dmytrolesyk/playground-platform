---
title: "Islands Architecture"
category: concept
summary: "How Astro delivers static HTML with targeted JavaScript hydration — and why this site uses exactly one island."
difficulty: beginner
relatedConcepts:
  - concepts/fine-grained-reactivity
technologies:
  - astro
  - solidjs
order: 3
dateAdded: 2026-04-20
externalReferences:
  - title: "Islands Architecture — Jason Miller"
    url: "https://jasonformat.com/islands-architecture/"
    type: article
  - title: "Astro Islands Documentation"
    url: "https://docs.astro.build/en/concepts/islands/"
    type: docs
---

## The Concept

In traditional SPAs, the entire page is JavaScript-rendered. In islands architecture, the page is mostly static HTML with isolated "islands" of interactivity that hydrate independently.

```
┌───────────────────────────────────┐
│  Static HTML (zero JS)            │
│  ┌─────────┐    ┌─────────────┐  │
│  │ Island 1 │    │  Island 2   │  │
│  │ (React)  │    │  (Svelte)   │  │
│  └─────────┘    └─────────────┘  │
│  More static HTML...              │
└───────────────────────────────────┘
```

Each island:
- Hydrates independently (doesn't block other islands)
- Can use a different framework
- Only ships JavaScript for interactive parts

## Why One Island?

This site has exactly **one** island: `<Desktop client:load />`. Why not multiple?

1. **Shared state** — Windows, taskbar, and icons all need to access the same `DesktopStore`. Multiple islands would mean separate SolidJS instances that can't share reactive context.
2. **Coordinated behavior** — Double-clicking an icon must open a window, update the taskbar, and manage z-index — all in one atomic operation.
3. **The entire desktop is interactive** — There's no "static part" of the desktop to carve out.

The `/learn/*` pages are a different story — they're fully static with a small Mermaid rendering script. No SolidJS, no island, no store.

## Astro Hydration Directives

Astro controls when islands hydrate:

- `client:load` — hydrate immediately on page load (used for Desktop)
- `client:idle` — hydrate when the browser is idle
- `client:visible` — hydrate when the element scrolls into view
- `client:media` — hydrate when a media query matches

We use `client:load` because the desktop must be interactive immediately — there's no useful static state to show first.
