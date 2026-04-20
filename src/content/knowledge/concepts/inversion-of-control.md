---
title: "Inversion of Control"
category: concept
summary: "The design principle behind the app registry — why apps don't know about the desktop, and the desktop doesn't know about apps."
difficulty: beginner
relatedConcepts:
  - concepts/lazy-loading-and-code-splitting
order: 6
dateAdded: 2026-04-20
externalReferences:
  - title: "Inversion of Control — Martin Fowler"
    url: "https://martinfowler.com/bliki/InversionOfControl.html"
    type: article
---

## The Traditional Way

In a direct-dependency approach, the desktop would import every app:

```typescript
// Desktop.tsx — knows about every app
import { BrowserApp } from './BrowserApp';
import { TerminalApp } from './TerminalApp';
import { SnakeGame } from './SnakeGame';

function renderApp(id: string) {
  if (id === 'browser') return <BrowserApp />;
  if (id === 'terminal') return <TerminalApp />;
  if (id === 'snake') return <SnakeGame />;
}
```

Adding a new app means editing this file. The desktop **controls** which apps exist.

## The Inverted Way

With inversion of control, the direction flips. Apps register **themselves**:

```typescript
// app-manifest.ts — apps declare themselves
registerApp({ id: 'browser', component: BrowserApp, ... });
registerApp({ id: 'terminal', component: TerminalApp, ... });
registerApp({ id: 'snake', component: SnakeGame, ... });
```

The desktop reads from the registry:

```typescript
// WindowManager.tsx — doesn't know about specific apps
const AppComponent = APP_REGISTRY[windowState.app].component;
return <AppComponent />;
```

Now apps control their own registration. The desktop is a generic container. Adding a new app never requires editing the desktop.

## The Hollywood Principle

IoC is sometimes called the "Hollywood Principle": *Don't call us, we'll call you.*

The framework (desktop, window manager, taskbar) provides hooks (the registry). Apps plug into those hooks. The framework decides when and how to use them.

## In This Project

The app registry is the IoC container. `registerApp()` is the registration API. The desktop components (WindowManager, DesktopIconGrid, StartMenu, Taskbar) are all registry consumers — they iterate the registry and render whatever they find.
