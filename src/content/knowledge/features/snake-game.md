---
title: "Snake Game"
category: feature
summary: "A canvas-based Snake game in a Win95 window — pure game engine with a SolidJS wrapper."
difficulty: beginner
relatedConcepts:
  - concepts/lazy-loading-and-code-splitting
relatedFiles:
  - src/components/desktop/apps/games/Snake.tsx
  - src/components/desktop/apps/games/snake-engine.ts
technologies:
  - solidjs
order: 3
dateAdded: 2026-04-20
---

## What It Does

Classic Snake game: navigate a snake to eat food, grow longer, avoid hitting walls or yourself. Rendered on an HTML Canvas element inside a Win95 window.

## Architecture

The game separates concerns into two layers:

### Game Engine (`snake-engine.ts`)

Pure logic — no DOM, no framework:
- Grid state (snake positions, food position)
- Movement and collision detection
- Score tracking
- Game loop timing

### SolidJS Wrapper (`Snake.tsx`)

Framework integration:
- Canvas element management
- Keyboard input handling
- Score display with SolidJS signals
- Start/restart UI

## Key Design Decisions

- **Canvas rendering** — Games draw directly to a `<canvas>` element, bypassing the DOM entirely for performance
- **Lazy-loaded** — Wrapped in `lazy()` to avoid loading the game engine on page startup
- **Keyboard capture** — Uses `captureKeyboard: true` in the registry so arrow keys go to the game, not the desktop
- **Responsive** — The canvas resizes to fit the window, with the game grid scaling proportionally
