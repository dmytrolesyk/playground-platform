---
title: "Inversion of Control"
category: concept
summary: "The design principle behind the app registry — why apps don't know about the desktop, and the desktop doesn't know about apps."
difficulty: beginner
prefLabel: "Inversion of Control"
altLabels:
  - "IoC"
  - "dependency inversion"
  - "Hollywood principle"
  - "don't call us we'll call you"
relatedConcepts:
  - concepts/lazy-loading-and-code-splitting
  - concepts/observer-pattern
relatedFiles:
  - src/components/desktop/apps/registry.ts
  - src/components/desktop/apps/app-manifest.ts
  - src/components/desktop/WindowManager.tsx
  - src/components/desktop/Desktop.tsx
technologies:
  - solidjs
order: 6
dateAdded: 2026-04-20
lastUpdated: 2026-04-24
externalReferences:
  - title: "Inversion of Control — Martin Fowler"
    url: "https://martinfowler.com/bliki/InversionOfControl.html"
    type: article
  - title: "Inversion of Control Containers and the Dependency Injection pattern — Fowler"
    url: "https://martinfowler.com/articles/injection.html"
    type: article
  - title: "SOLID Principles — Robert C. Martin"
    url: "https://en.wikipedia.org/wiki/SOLID"
    type: article
  - title: "VS Code Extension Architecture"
    url: "https://code.visualstudio.com/api/get-started/extension-anatomy"
    type: docs
  - title: "Using middleware.html — expressjs.com"
    url: "https://expressjs.com/en/guide/using-middleware.html"
    type: article
  - title: "Hollywood principle — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Hollywood_principle"
    type: article
module: extensibility
moduleOrder: 2
estimatedMinutes: 12
prerequisites:
  - architecture/app-registry
learningObjectives:
  - "Explain the Inversion of Control principle and its relationship to the Dependency Inversion Principle"
  - "Identify where IoC appears in the app registry pattern"
  - "Apply IoC thinking to design extensible systems"
exercises:
  - question: "If you delete the registerApp() call for the browser app from app-manifest.ts, what specifically breaks — and what still works?"
    type: predict
    hint: "Think about which consumers read from APP_REGISTRY dynamically."
    answer: "The browser app disappears from: the desktop icon grid, the start menu, and the terminal's 'open' command. No code throws an error — the registry simply doesn't contain a 'browser' entry, so filter operations return fewer results. The rest of the desktop works perfectly. This is IoC in action: removing an app requires zero changes to consumers because they never referenced it directly."
  - question: "What's the difference between Inversion of Control, Dependency Injection, and the Service Locator pattern?"
    type: explain
    answer: "IoC is the broad principle: the framework calls you, you don't call the framework. DI is a specific IoC technique where dependencies are passed in (constructor, props, function parameters). Service Locator is another IoC technique where a component asks a central registry for what it needs. The app registry uses Service Locator: DesktopIconGrid calls getDesktopApps() to look up available apps, rather than having them injected. DI would mean someone passes the app list as a prop."
  - question: "How does the app registry demonstrate the Hollywood Principle ('Don't call us, we'll call you')?"
    type: explain
    answer: "Apps don't call the desktop, start menu, or terminal to register themselves in each consumer. Instead, apps call registerApp() once (registering themselves), and the framework (Desktop, StartMenu, Terminal) calls into the registry when it needs app information. The app doesn't know or care which consumers exist. If a new consumer is added tomorrow (e.g., a search bar), it can read from the same registry without any app changes."
---

## Why Should I Care?

Inversion of Control (IoC) is the design principle that makes the app registry work. Without it, adding a new app would require editing 4-5 files across the codebase. With it, you create a component, call `registerApp()`, and everything works — following the [SOLID principles](https://en.wikipedia.org/wiki/SOLID). Understanding [IoC](https://martinfowler.com/bliki/InversionOfControl.html) explains not just this project's extensibility, but the architecture of frameworks ([Express middleware](https://expressjs.com/en/guide/using-middleware.html), React hooks), plugin systems ([VS Code extension anatomy](https://code.visualstudio.com/api/get-started/extension-anatomy), webpack plugins), and why "the framework calls you" instead of "you call the framework."

## The Traditional Way: Direct Control

In a direct-dependency approach, the desktop would import every app and decide what to render:

```typescript
// Desktop.tsx — knows about every app (tightly coupled)
import { BrowserApp } from './BrowserApp';
import { TerminalApp } from './TerminalApp';
import { SnakeGame } from './SnakeGame';

function renderApp(id: string) {
  if (id === 'browser') return <BrowserApp />;
  if (id === 'terminal') return <TerminalApp />;
  if (id === 'snake') return <SnakeGame />;
  // Must edit this switch for every new app!
}
```

The control flow is: **Desktop calls apps**. The desktop controls which apps exist, how they're rendered, and when they're loaded. Adding a new app means editing this file.

## The Inverted Way: Apps Register Themselves

With inversion of control, the direction flips:

```mermaid
flowchart LR
    subgraph "Direct Control"
        Desktop1["Desktop<br/>(knows all apps)"] --> BA1[BrowserApp]
        Desktop1 --> TA1[TerminalApp]
        Desktop1 --> SG1[SnakeGame]
    end

    subgraph "Inverted Control"
        BA2[BrowserApp] -->|"registerApp()"| REG[APP_REGISTRY]
        TA2[TerminalApp] -->|"registerApp()"| REG
        SG2[SnakeGame] -->|"registerApp()"| REG
        REG -->|"reads from"| Desktop2["Desktop<br/>(generic container)"]
    end

    style Desktop1 fill:#fce4ec
    style Desktop2 fill:#e8f5e9
```

Apps declare themselves to the registry. The desktop reads from the registry:

```typescript
// WindowManager.tsx — doesn't know about specific apps
const AppComponent = resolveAppComponent(windowState.app);
return <Dynamic component={AppComponent} />;
```

Now the control flow is: **Apps provide themselves to the framework**. The desktop is a generic container. Adding a new app never requires editing the desktop.

## IoC vs DI vs Service Locator — They're Different Things

These terms are often confused. They're related but distinct:

### Inversion of Control (IoC) — The Principle

IoC is the *direction* of dependency. Instead of your code calling library functions, the framework calls your code. This is sometimes called the ["Hollywood Principle"](https://en.wikipedia.org/wiki/Hollywood_principle): *Don't call us, we'll call you.*

In this project: apps don't call `desktop.addApp(this)`. The desktop calls `APP_REGISTRY[id].component` when it needs to render an app. The registry is the intermediary that inverts the dependency direction.

### [Dependency Injection](https://martinfowler.com/articles/injection.html) (DI) — One IoC Technique

DI provides dependencies from outside rather than having code create them:

```typescript
// Without DI: Window creates its own state
function Window() {
  const store = new DesktopStore(); // ← creates dependency internally
}

// With DI: Window receives state from context
function Window() {
  const [state, actions] = useDesktop(); // ← receives dependency
}
```

SolidJS's `useDesktop()` is a form of dependency injection — the store is created by `DesktopProvider` and injected into any component that calls the hook. The component doesn't know how the store was created or where it lives.

### Service Locator — Another IoC Technique

A service locator is a central registry that other code queries:

```typescript
// APP_REGISTRY is a service locator
const component = APP_REGISTRY[appId]?.component;
```

The `APP_REGISTRY` in `src/components/desktop/apps/registry.ts` is literally a service locator — a key-value map that any consumer can query to find a registered service (app component). The registry pattern is a specific application of the service locator pattern.

## The Framework vs Library Distinction

IoC is what separates a *framework* from a *library*:

- **Library**: You call it. `const result = marked.parse(markdown)` — you control when and how parsing happens.
- **Framework**: It calls you. `registerApp({ component: MyApp })` — the framework decides when and how to render your component.

The desktop system is a micro-framework: it provides lifecycle management (open/close/focus/minimize), rendering infrastructure (Window chrome, Suspense), and discovery mechanisms (registry). Apps plug into this framework rather than calling it.

## Real-World Examples Beyond This Project

### Express Middleware

```javascript
app.use(cors());         // Register middleware
app.use(bodyParser());   // Register middleware
app.get('/api', handler); // Register route handler
// Express decides when to call these — you don't call Express
```

### React Hooks

```typescript
function Counter() {
  const [count, setCount] = useState(0);  // Register state
  useEffect(() => {                       // Register effect
    document.title = `Count: ${count}`;
  }, [count]);
  // React decides when to run the effect — you don't call React
}
```

### VS Code Extensions

```json
// package.json — declare what the extension provides
{
  "contributes": {
    "commands": [{ "command": "myExt.doThing", "title": "Do Thing" }],
    "languages": [{ "id": "mylang", "extensions": [".ml"] }]
  }
}
```

VS Code discovers extensions, loads them, and calls their `activate()` function. The extension declares capabilities; VS Code decides when to invoke them.

### Webpack Plugins

```javascript
module.exports = {
  plugins: [
    new HtmlWebpackPlugin(),  // Register plugin
    new MiniCssExtractPlugin(), // Register plugin
  ],
};
// Webpack calls plugin hooks at the right build stages
```

The pattern is always the same: **registration** (declare capabilities) → **discovery** (the framework finds registrations) → **invocation** (the framework calls at the right time).

## SOLID Connection: Dependency Inversion Principle

IoC is closely related to the Dependency Inversion Principle (the "D" in SOLID):

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

In this project:
- **High-level module**: `WindowManager.tsx` — renders windows with app components
- **Low-level modules**: `BrowserApp`, `TerminalApp`, `SnakeGame` — specific apps
- **Abstraction**: `AppRegistryEntry` interface + `APP_REGISTRY`

`WindowManager` depends on the `AppRegistryEntry` interface, not on `BrowserApp` or `TerminalApp`. Apps depend on the same interface (they conform to it via `registerApp()`). Neither depends on the other. Both depend on the abstraction.

```mermaid
flowchart TD
    WM["WindowManager<br/>(high-level)"] -->|depends on| I["AppRegistryEntry interface<br/>(abstraction)"]
    BA["BrowserApp<br/>(low-level)"] -->|conforms to| I
    TA["TerminalApp<br/>(low-level)"] -->|conforms to| I
    SG["SnakeGame<br/>(low-level)"] -->|conforms to| I

    style I fill:#e3f2fd
```

## What Goes Wrong Without IoC

Without IoC, the desktop would have **direct dependencies** on every app:

```typescript
// Desktop.tsx imports every app
import { BrowserApp } from './BrowserApp';     // Direct dependency
import { TerminalApp } from './TerminalApp';   // Direct dependency
import { SnakeGame } from './games/Snake';      // Direct dependency
```

Consequences:
1. **Adding an app** requires editing `Desktop.tsx` (or `WindowManager.tsx`)
2. **Removing an app** requires editing the same files
3. **Lazy loading** requires per-app `if` statements
4. **Testing** the desktop requires importing every app
5. **Build** — changing any app potentially invalidates the desktop's chunk

With IoC, the desktop only depends on the registry interface. Apps can be added, removed, or changed without touching desktop code.
