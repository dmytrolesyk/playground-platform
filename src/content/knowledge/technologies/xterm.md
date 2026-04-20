---
title: "xterm.js — Terminal Emulation"
category: technology
summary: "The terminal emulator library that powers the desktop's Terminal app — lazy-loaded, with a custom command handler."
difficulty: intermediate
relatedConcepts:
  - concepts/lazy-loading-and-code-splitting
technologies:
  - solidjs
order: 4
dateAdded: 2026-04-20
externalReferences:
  - title: "xterm.js Documentation"
    url: "https://xtermjs.org/"
    type: docs
  - title: "xterm.js GitHub Repository"
    url: "https://github.com/xtermjs/xterm.js"
    type: repo
---

## What xterm.js Does

xterm.js is a full terminal emulator that runs in the browser. It renders a GPU-accelerated terminal canvas, handles keyboard input, escape sequences, colors, and cursor positioning — everything a real terminal does.

## Why It's Lazy-Loaded

xterm.js and its addons weigh ~300KB. Loading this on page startup would significantly delay the desktop's time-to-interactive. Instead:

```typescript
const TerminalApp = lazy(() =>
  import('./TerminalApp').then(m => ({ default: m.TerminalApp }))
);
```

The terminal chunk only downloads when the user opens the Terminal app.

## Custom Command Handler

This terminal doesn't connect to a server shell. Instead, it has a client-side command handler that responds to typed commands:

- `help` — lists available commands
- `about` — shows an ASCII art banner
- `clear` — clears the screen
- `ls` — lists registered apps
- `open <app>` — opens a desktop app by name
- `cat <section>` — displays a CV section as plain text

The handler reads CV data from the same JSON blob the BrowserApp uses, stripping HTML to produce plain text.

## Integration with the Desktop

The terminal uses `captureKeyboard: true` in its registry entry:

```typescript
registerApp({
  id: 'terminal',
  captureKeyboard: true,
  // ...
});
```

This tells the desktop to stop handling keyboard shortcuts (Escape to close start menu, etc.) when the terminal is focused — those keys need to go to xterm.js instead.

## The Fit Addon

The `@xterm/addon-fit` automatically resizes the terminal grid to match its container dimensions. When the window is resized, the terminal re-fits to show the right number of columns and rows.
