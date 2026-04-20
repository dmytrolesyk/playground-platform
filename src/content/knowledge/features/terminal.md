---
title: "Terminal"
category: feature
summary: "A client-side terminal emulator with custom commands — powered by xterm.js, lazy-loaded for performance."
difficulty: intermediate
relatedConcepts:
  - concepts/lazy-loading-and-code-splitting
relatedFiles:
  - src/components/desktop/apps/TerminalApp.tsx
  - src/components/desktop/apps/styles/terminal-app.css
technologies:
  - solidjs
order: 2
dateAdded: 2026-04-20
---

## What It Does

The Terminal app provides a command-line interface to the desktop. Users can type commands to view CV sections, open apps, or get information about the system.

## Available Commands

| Command | Action |
|---|---|
| `help` | Lists all available commands |
| `about` | Displays an ASCII art banner |
| `clear` | Clears the terminal screen |
| `ls` | Lists all registered desktop apps |
| `open <app>` | Opens a desktop app (e.g., `open browser`) |
| `cat <section>` | Displays a CV section as plain text |
| `whoami` | Shows developer info |

## Architecture

The terminal has no server connection. All commands are handled client-side:

1. xterm.js captures keystrokes and renders the terminal canvas
2. When Enter is pressed, the input line is parsed into command + args
3. A command handler map dispatches to the appropriate function
4. Output is written back to the terminal via xterm.js API

## Lazy Loading

xterm.js is ~300KB. The TerminalApp is wrapped in `lazy()`:

```typescript
const TerminalApp = lazy(() =>
  import('./TerminalApp').then(m => ({ default: m.TerminalApp }))
);
```

The terminal chunk only downloads when the user first opens the Terminal window.

## Keyboard Capture

The terminal's registry entry sets `captureKeyboard: true`, telling the desktop to forward all keyboard events to xterm.js when the terminal is focused.
