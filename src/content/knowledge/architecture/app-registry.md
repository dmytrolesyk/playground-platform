---
title: "The Registry Pattern"
category: architecture
summary: "How registerApp() makes one function call wire an app into the desktop, start menu, terminal, and window manager."
difficulty: beginner
relatedConcepts:
  - concepts/inversion-of-control
  - concepts/lazy-loading-and-code-splitting
relatedFiles:
  - src/components/desktop/apps/registry.ts
  - src/components/desktop/apps/app-manifest.ts
  - src/components/desktop/WindowManager.tsx
  - src/components/desktop/DesktopIconGrid.tsx
  - src/components/desktop/StartMenu.tsx
technologies:
  - solidjs
diagramRef: "app-registry"
order: 3
dateAdded: 2026-04-20
---

## The Problem

Imagine adding a new app to a desktop environment without a registry. You'd need to:

1. Edit `DesktopIconGrid.tsx` to add the icon
2. Edit `StartMenu.tsx` to add the menu entry
3. Edit `WindowManager.tsx` to recognize the app ID and render the component
4. Edit the terminal command handler to support opening it via CLI
5. Maybe edit `Taskbar.tsx` if it has special behavior

That's 4-5 files for every new app. Miss one and you get a broken experience. This is the **shotgun surgery** anti-pattern.

## The Solution: APP_REGISTRY

The entire app system reads from a single data structure:

```typescript
// registry.ts
export const APP_REGISTRY: Record<string, AppRegistryEntry> = {};

export function registerApp(entry: AppRegistryEntry): void {
  APP_REGISTRY[entry.id] = entry;
}
```

Every consumer reads from this map:

- **DesktopIconGrid** — `Object.values(APP_REGISTRY).filter(app => app.desktop)` → renders icons
- **StartMenu** — `Object.values(APP_REGISTRY).filter(app => app.startMenu)` → renders menu entries grouped by `startMenuCategory`
- **WindowManager** — `APP_REGISTRY[windowState.app].component` → resolves the component to render
- **Terminal** — `APP_REGISTRY[command]` → opens apps by name from the command line

## AppRegistryEntry: The Full Interface

```typescript
interface AppRegistryEntry {
  id: string;                    // unique identifier ("browser", "terminal", "snake")
  title: string;                 // display name ("View CV", "Terminal", "Snake")
  icon: string;                  // path to 32×32 pixel-art PNG
  component: Component | lazy;   // the SolidJS component (or lazy wrapper)
  desktop: boolean;              // show on desktop icon grid?
  startMenu: boolean;            // show in start menu?
  startMenuCategory?: string;    // "Programs", "Games", etc.
  singleton: boolean;            // only one instance allowed?
  defaultSize: { width; height };// initial window dimensions
  minSize?: { width; height };   // minimum resize dimensions
  resizable?: boolean;           // can the window be resized?
  captureKeyboard?: boolean;     // should the app capture keyboard events?
  defaultProps?: Record<...>;    // default props passed to the component
}
```

Key design choices:

- **`singleton: true`** means double-clicking the icon when the app is already open will focus the existing window instead of opening a second one.
- **`captureKeyboard: true`** tells the desktop to stop handling keyboard shortcuts (like Escape to close start menu) when this app's window is focused. Used by the terminal and games.
- **`defaultProps`** are merged with any `extraProps` passed to `openWindow()`.

## The app-manifest.ts File

All `registerApp()` calls live in one file: `app-manifest.ts`. This file is imported by `Desktop.tsx` as a side effect — its module-level code runs immediately, populating the registry before any component renders.

```typescript
// app-manifest.ts (simplified)
import { lazy } from 'solid-js';
import { BrowserApp } from './BrowserApp';
import { registerApp } from './registry';

const TerminalApp = lazy(() =>
  import('./TerminalApp').then(m => ({ default: m.TerminalApp }))
);

registerApp({
  id: 'browser',
  title: 'View CV',
  icon: '/icons/browser_icon.png',
  component: BrowserApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 640, height: 480 },
});

registerApp({
  id: 'terminal',
  title: 'Terminal',
  icon: '/icons/terminal_icon.png',
  component: TerminalApp,  // lazy-loaded!
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 640, height: 400 },
});
```

## Lazy Loading via the Registry

Heavy apps (terminal with xterm.js ~300KB, games) are wrapped in `lazy()`:

```typescript
const TerminalApp = lazy(() =>
  import('./TerminalApp').then(m => ({ default: m.TerminalApp }))
);
```

This means:
- The code isn't downloaded until the user opens the app
- `WindowManager` wraps every app in `<Suspense>`, showing a loading indicator while the chunk downloads
- The registry doesn't care whether the component is lazy or not — it's just a `Component` type either way

## How openWindow Works

When you double-click a desktop icon or select an app from the start menu:

1. `actions.openWindow('browser')` is called
2. The store checks `singleton` — if the app is already open, it just focuses the existing window
3. Otherwise, it creates a new `WindowState` with cascade positioning and the registry's `defaultSize`
4. `WindowManager` picks up the new window, resolves `APP_REGISTRY['browser'].component`, and renders it inside a `<Window>` shell

The app component receives its `appProps` as props — this is how the Architecture Explorer can open the Library at a specific URL:

```typescript
actions.openWindow('library', { initialUrl: '/learn/architecture/overview' });
```

## Adding a New App: The Checklist

1. **Create your component** in `src/components/desktop/apps/your-app/`
2. **Add a `registerApp()` call** in `app-manifest.ts`
3. **Add a 32×32 pixel-art icon** to `public/icons/`

That's it. No other files need changes. The desktop, start menu, window manager, and terminal all read from the registry automatically.

If you find yourself editing `Desktop.tsx`, `WindowManager.tsx`, `Taskbar.tsx`, or `StartMenu.tsx` to add a new app — stop. You're doing it wrong.
