# Architecture Guidelines - Retro CV Website

> A Windows 95/98 desktop metaphor as a personal CV/portfolio site.
> Built with Astro + SolidJS + 98.css. Static-first. Minimal dependencies.

---

## Table of Contents

1. [Project Goals and Non-Goals](#1-project-goals-and-non-goals)
2. [Architectural Principles](#2-architectural-principles)
3. [Stack Decision](#3-stack-decision)
4. [App Shell Architecture](#4-app-shell-architecture)
5. [Component Hierarchy](#5-component-hierarchy)
6. [Window Manager Design](#6-window-manager-design)
7. [Global State Design](#7-global-state-design)
8. [App Registry & Extensibility Architecture](#8-app-registry--extensibility-architecture)
9. [Astro Islands Strategy](#9-astro-islands-strategy)
10. [Content Architecture (Markdown CV)](#10-content-architecture-markdown-cv)
11. [Export Architecture (PDF / DOC)](#11-export-architecture-pdf--doc)
12. [Contact Architecture (Resend)](#12-contact-architecture-resend)
13. [Mobile Strategy](#13-mobile-strategy)
14. [Lazy-Loading & Performance Strategy](#14-lazy-loading--performance-strategy)
15. [Accessibility Considerations](#15-accessibility-considerations)
16. [Folder Structure](#16-folder-structure)
17. [Risks, Tradeoffs, and Rejected Alternatives](#17-risks-tradeoffs-and-rejected-alternatives)
18. [Recommended Architecture Summary](#18-recommended-architecture-summary)
19. [Experimentation Platform Analysis](#19-experimentation-platform-analysis)

---

## 1. Project Goals and Non-Goals

### Goals
- Deliver a memorable, interactive CV that feels like a late-90s Windows desktop
- Content is readable and accessible to recruiters who may not "get" the gimmick
- Site loads fast and works without JavaScript for basic content access (progressive enhancement where feasible)
- CV content is authored in Markdown and rendered at build time
- Exports (PDF/DOC) are pre-built static assets - no client-side generation
- Contact form works via a single serverless endpoint
- Nice-to-haves (games, terminal) exist but never compromise core load performance

### Non-Goals
- Not a general-purpose window manager or OS simulator
- Not pixel-perfect Windows 95 reproduction - "feels like it" is enough
- Not a SPA - Astro's static output is the foundation
- No user accounts, authentication, or persistent server-side state
- No CMS - Markdown files in the repo are the content layer
- No analytics platform integration in MVP

---

## 2. Architectural Principles

| Principle | What it means here |
|---|---|
| **Static-first** | Everything that can be pre-rendered is pre-rendered. JS hydrates interactivity on top. |
| **Single island** | One SolidJS island owns all interactive state to avoid cross-island communication complexity. |
| **Lazy boundaries** | Heavy dependencies (xterm.js, games) load on demand, never at startup. |
| **98.css as truth** | Don't reinvent Win98 aesthetics. Use 98.css classes. Custom CSS is only for layout (desktop grid, taskbar positioning, window coordinates). |
| **Content ≠ presentation** | CV data is Markdown. The "Netscape browser" is a presentation layer. They connect at build time. |
| **Minimal dependencies** | Each new dependency must justify its bundle cost. Target: ≤5 runtime dependencies for MVP. |
| **Progressive disclosure** | Desktop loads → user clicks icons → windows appear → heavy content lazy-loads inside windows. |
| **Registry-driven extensibility** | Every surface (desktop icons, start menu, terminal commands) reads from one `APP_REGISTRY`. Adding a new "app" is one file + one function call. No switch statements, no router config, no multi-file ceremony. |

---

## 3. Stack Decision

### Core Stack

| Layer | Choice | Why |
|---|---|---|
| Site framework | **Astro** | Static-first, content collections for Markdown, islands architecture, API routes for contact |
| Interactive UI | **SolidJS** | See detailed comparison below |
| Aesthetic layer | **98.css** | Authentic Win98 components out of the box, no reinvention |
| Contact backend | **Resend** (via Astro API route) | Minimal serverless, your existing choice |
| Styling | **Vanilla CSS** + 98.css | No Tailwind. Custom CSS only for layout. |

### SolidJS vs Svelte - Detailed Comparison

Both are excellent Astro island candidates. Here's why SolidJS wins for this specific project:

| Criterion | SolidJS | Svelte |
|---|---|---|
| **Bundle size** | ~7KB runtime | ~0KB runtime (compiled), but each component adds code |
| **Reactivity model** | Fine-grained signals | Compiled reactivity, coarser update batching |
| **Window drag/position updates** | Signals update individual properties without re-rendering siblings. `x` changes → only that window's transform updates. | Each state change triggers component-level re-render (efficient, but less granular). |
| **Nested store** | `createStore` handles `windows[id].x` updates without cloning the whole tree | Svelte stores work but require more manual subscription wiring for nested state |
| **Shared state across components** | Context + signals. Taskbar reads `windows` store directly. | Svelte stores work, but cross-component subscription is slightly more boilerplate |
| **Astro integration** | `@astrojs/solid-js` - mature, well-tested | `@astrojs/svelte` - also mature |
| **JSX vs template** | JSX (familiar if you know React) | Template syntax (own learning curve) |
| **Ecosystem for this use case** | Smaller ecosystem, but we need almost nothing from ecosystem | Larger component ecosystem, but irrelevant here |

**Recommendation: SolidJS.**

**Why:** The core technical challenge of this project is a window manager - dozens of rapid, fine-grained state updates (drag position, z-index, focus) across multiple windows. SolidJS's signal-based reactivity is purpose-built for this. When you drag a window, only that window's `transform` CSS updates - no diffing, no component re-render. This is a meaningful performance advantage for the primary interaction pattern.

**Tradeoff:** If you're more familiar with Svelte's syntax, the DX advantage might outweigh the reactivity advantage. But for a window manager, SolidJS signals are the more natural primitive.

---

## 4. App Shell Architecture

```
┌──────────────────────────────────────────────────────┐
│  index.astro (Static Astro Page)                     │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  <head>                                        │  │
│  │  - meta, fonts, 98.css, global.css             │  │
│  │  - <script type="application/json" id="cv">    │  │
│  │    (pre-rendered CV HTML from Markdown)         │  │
│  │  </script>                                     │  │
│  │  - <link> to pre-built PDF/DOC for exports     │  │
│  │  </head>                                       │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  <body>                                        │  │
│  │                                                │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  <Desktop client:load />                 │  │  │
│  │  │  (Single SolidJS Island)                 │  │  │
│  │  │                                          │  │  │
│  │  │  ├── DesktopIconGrid                     │  │  │
│  │  │  ├── WindowLayer (all open windows)      │  │  │
│  │  │  └── Taskbar                             │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  │                                                │  │
│  │  <noscript> fallback: direct links to CV,     │  │
│  │   PDF, DOC, contact mailto </noscript>         │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Why one island, not many?

Desktop icons, windows, and the taskbar all share state:
- Clicking an icon → opens a window → adds a taskbar button
- Clicking a taskbar button → focuses/minimizes a window
- Closing a window → removes the taskbar button

Splitting these into separate islands would require a cross-island messaging system (CustomEvents, BroadcastChannel, etc.) - added complexity for no benefit. A single SolidJS island with context-provided state is simpler, faster, and easier to reason about.

---

## 5. Component Hierarchy

```
Desktop (root SolidJS component)
├── DesktopIconGrid
│   └── DesktopIcon (×N: driven by APP_REGISTRY)
│       - icon image (32×32 pixel art from assets/icons/)
│       - label (white text, blue highlight on select)
│       - double-click → opens corresponding window
│
├── WindowLayer (absolutely positioned container, full viewport)
│   └── <For each={openWindows}>
│       └── Window (generic draggable/focusable container)
│           ├── TitleBar
│           │   ├── icon + title text
│           │   └── WindowControls (minimize, maximize, close buttons)
│           └── WindowBody
│               └── resolveApp(window.app, window.appProps)
│                   // WindowBody calls APP_REGISTRY[app].component
│                   // to render the correct app. Apps are just
│                   // SolidJS components - add one to the registry
│                   // and it's instantly available everywhere.
│
│           Registered apps (MVP):
│               ├── BrowserApp (for "View CV")
│               ├── ExplorerApp (for "Export CV")
│               ├── EmailApp (for "Contact Me")
│               ├── TerminalApp (lazy: xterm.js)
│               └── GameApp (lazy: per-game dynamic import)
│                   ├── SnakeGame
│                   ├── (future: Tetris, Minesweeper, etc.)
│                   └── (future: more games)
│
└── Taskbar (fixed bottom bar)
    ├── StartButton
    │   └── StartMenu (popup on click)
    │       ├── Programs → (submenu driven by APP_REGISTRY)
    │       ├── Settings → (future: display settings, sound, etc.)
    │       └── Shut Down
    ├── TaskButtonList
    │   └── TaskButton (×N: one per open window, inset=focused, outset=unfocused)
    └── SystemTray
        └── Clock (current time, updated every minute)
```

### Component Responsibilities

| Component | Static or Interactive | Responsibility |
|---|---|---|
| `Desktop` | Interactive (SolidJS root) | Provides window state context, handles desktop click (deselect) |
| `DesktopIcon` | Interactive | Selection state, double-click to open app |
| `Window` | Interactive | Drag, focus, minimize, maximize, close. Generic container. |
| `TitleBar` | Interactive | Drag handle (pointerdown), window control buttons |
| `WindowBody` | Interactive | Looks up `APP_REGISTRY[app].component` and renders it |
| `BrowserApp` | Mostly static content | Reads pre-rendered CV HTML, displays in scrollable area |
| `ExplorerApp` | Minimal interactivity | File icons that are download links |
| `EmailApp` | Interactive | Form state, submission to API endpoint |
| `GameApp` | Interactive (lazy) | Generic canvas/container for any game - resolves sub-game by type |
| `Taskbar` | Interactive | Reflects open windows, start menu toggle |
| `StartMenu` | Interactive | Reads `APP_REGISTRY` for Programs submenu items |
| `Clock` | Interactive | `setInterval` updates time display |

---

## 6. Window Manager Design

The window manager is the central interactive system. It must handle:

### State Per Window

```typescript
interface WindowState {
  id: string;             // unique, e.g., "browser-1", "explorer-1"
  app: string;            // registry key - e.g., "browser", "explorer", "snake"
  title: string;          // displayed in title bar and taskbar
  icon?: string;          // icon path for title bar + taskbar (from registry)
  x: number;              // left position in px
  y: number;              // top position in px
  width: number;          // window width
  height: number;         // window height
  zIndex: number;         // stacking order
  isMinimized: boolean;   // hidden but still in taskbar
  isMaximized: boolean;   // fills viewport (minus taskbar)
  prevBounds?: { x, y, width, height }; // restore point for un-maximize
  appProps?: Record<string, unknown>;    // extra props forwarded to the app component
}
```

### Operations

| Operation | Trigger | Effect |
|---|---|---|
| **Open** | Desktop icon double-click, Start menu click | Add `WindowState` to store, assign next z-index, position with cascade offset |
| **Close** | Title bar × button | Remove from store entirely |
| **Minimize** | Title bar - button, or click active taskbar button | Set `isMinimized: true`, window hidden via CSS |
| **Restore** | Click minimized window's taskbar button | Set `isMinimized: false`, bring to front |
| **Maximize** | Title bar □ button | Save current bounds to `prevBounds`, set to viewport size |
| **Unmaximize** | Click □ again when maximized | Restore from `prevBounds` |
| **Focus** | Click anywhere on window | Set this window's zIndex to `++nextZIndex` |
| **Drag** | Pointerdown on title bar → pointermove → pointerup | Update `x`, `y` in real time |

### Drag Implementation

```
pointerdown on TitleBar:
  1. Record offset = pointer position - window position
  2. Set pointer capture on title bar element
  3. Focus the window (bring to front)

pointermove (while captured):
  1. New x = pointer.clientX - offset.x
  2. New y = pointer.clientY - offset.y
  3. Clamp to viewport bounds
  4. Update store: windows[id].x = newX, windows[id].y = newY

pointerup:
  1. Release pointer capture
```

**Why pointer events, not mouse events?** Pointer events work for both mouse and touch, handle capture correctly, and don't need separate touch event handling.

### Z-Index Strategy

- Global counter starts at 10 (above desktop icons at z-index 1, below taskbar at z-index 1000)
- Each `focusWindow(id)` call: `nextZIndex++`, assign to window
- Counter never resets (it would take millions of clicks to overflow)
- Taskbar is always `z-index: 1000` (above all windows)
- Start menu is `z-index: 1001` (above taskbar)

### Cascade Positioning

When opening a new window, position it with a cascade offset:

```
baseX = 50, baseY = 50
offset = (openWindowCount % 8) * 30
newX = baseX + offset
newY = baseY + offset
```

This mimics how Windows 95 cascaded new windows.

### Window Singleton Behavior

Some apps should be singletons (only one instance):
- Browser (CV viewer) - singleton, re-focus if already open
- Explorer (export) - singleton
- Email - singleton
- Terminal - allow multiple? Start with singleton for simplicity
- Games - one per game type

On double-click of an icon whose app is already open: focus existing window instead of opening a new one.

---

## 7. Global State Design

### Store Shape

```typescript
import { createStore } from "solid-js/store";

interface DesktopStore {
  windows: Record<string, WindowState>;
  windowOrder: string[];      // ordered by z-index, last = topmost
  nextZIndex: number;
  startMenuOpen: boolean;
  selectedDesktopIcon: string | null;
}

const [state, setState] = createStore<DesktopStore>({
  windows: {},
  windowOrder: [],
  nextZIndex: 10,
  startMenuOpen: false,
  selectedDesktopIcon: null,
});
```

### State Distribution

```
DesktopContext (SolidJS context)
│
├── provides: state (read-only)
├── provides: actions { openWindow, closeWindow, focusWindow,
│                       minimizeWindow, maximizeWindow, startDrag,
│                       toggleStartMenu, selectIcon }
│
├── consumed by: DesktopIconGrid (selectIcon, openWindow)
├── consumed by: Window (focusWindow, closeWindow, minimizeWindow, drag)
├── consumed by: Taskbar (windows list, focusWindow, minimizeWindow)
└── consumed by: StartMenu (openWindow, toggleStartMenu)
```

### Why a single store, not per-window signals?

The window manager needs to reason about all windows at once for:
- Z-index ordering (which window is on top?)
- Taskbar rendering (list all open windows)
- Singleton checks (is this app already open?)
- Start menu state (click outside → close)

A single store with per-window entries is the simplest model that supports all these use cases. SolidJS's fine-grained store tracking means updating `windows["browser-1"].x` only re-renders that window's position - not the whole tree.

---

## 8. App Registry & Extensibility Architecture

The "fake OS" must be trivially extensible. Adding a new "app" (a game, a settings panel, a new contact channel) should require:

1. Create the app component (a `.tsx` file in `apps/`)
2. Add one entry to the app registry
3. Done - the app is now available on the desktop, in the start menu, and in the terminal

No other files need to change. No switch statements to update. No router to configure.

### The App Registry

```typescript
// src/components/desktop/apps/registry.ts

import { lazy, Component } from 'solid-js';

export interface AppRegistryEntry {
  /** Unique key used in WindowState.app */
  id: string;
  /** Display name in title bar, taskbar, start menu */
  title: string;
  /** Path to 32×32 icon */
  icon: string;
  /** The component to render inside the Window body */
  component: Component<any> | ReturnType<typeof lazy>;
  /** Show as a desktop icon? */
  desktop: boolean;
  /** Show in Start Menu > Programs? */
  startMenu: boolean;
  /** Category for Start Menu grouping (e.g., "Programs", "Games", "Settings") */
  startMenuCategory?: string;
  /** Only one instance allowed? */
  singleton: boolean;
  /** Default window dimensions */
  defaultSize: { width: number; height: number };
  /** Extra props always passed to this app */
  defaultProps?: Record<string, unknown>;
}

export const APP_REGISTRY: Record<string, AppRegistryEntry> = {};

/** Register an app. Call at module scope in each app file, or in a central manifest. */
export function registerApp(entry: AppRegistryEntry) {
  APP_REGISTRY[entry.id] = entry;
}
```

### How Everything Reads the Registry

| Consumer | What it reads | Effect |
|---|---|---|
| `DesktopIconGrid` | `Object.values(APP_REGISTRY).filter(a => a.desktop)` | Desktop icons appear automatically |
| `StartMenu` | `Object.values(APP_REGISTRY).filter(a => a.startMenu)`, grouped by `startMenuCategory` | Programs submenu builds itself |
| `WindowBody` | `APP_REGISTRY[window.app].component` | Resolves which component to render inside the window |
| `openWindow(appId)` | `APP_REGISTRY[appId]` | Gets title, icon, defaultSize, singleton flag |
| Terminal `open` cmd | `APP_REGISTRY[arg]` | `open snake` works if "snake" is registered |

### Adding a New App - The Full Recipe

```typescript
// src/components/desktop/apps/MyNewApp.tsx
import { registerApp } from './registry';
import myIcon from '../../assets/icons/my-icon.png';

function MyNewApp() {
  return <div>Hello from my new app!</div>;
}

registerApp({
  id: 'my-new-app',
  title: 'My New App',
  icon: myIcon,
  component: MyNewApp,    // or: lazy(() => import('./MyNewApp')) for heavy apps
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 400, height: 300 },
});

export default MyNewApp;
```

That's it. No other file needs to change.

### Lazy Loading via the Registry

Heavy apps register a `lazy()` component:

```typescript
registerApp({
  id: 'terminal',
  title: 'MS-DOS Prompt',
  icon: terminalIcon,
  component: lazy(() => import('./TerminalApp')),  // ~300KB, loads on open
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 640, height: 400 },
});
```

`WindowBody` wraps every app in `<Suspense>`, so lazy apps get a loading indicator automatically. No special handling needed per app.

### Start Menu Categories

The Start Menu groups registered apps by `startMenuCategory`:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Programs        ▶  ┃ ┏━━━━━━━━━━━━━━━━━━━━┓
┃  Games           ▶  ┃ ┃ View CV          ┃
┃  Settings        ▶  ┃ ┃ Export CV         ┃
┃────────────────────────┃ ┃ Contact Me        ┃
┃  Shut Down        ┃ ┃ Terminal          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━━━━━━━┛
```

Future categories ("Settings", "Games") populate automatically when apps register with those categories. No StartMenu code changes needed.

### Extensibility Guarantees

| Scenario | What you do | What you don't do |
|---|---|---|
| Add a new app | Create component + `registerApp()` | Touch Desktop, WindowManager, Taskbar, StartMenu |
| Add a new game | Same as above, `startMenuCategory: 'Games'` | Touch GameApp (unless new game host type) |
| Add game | Same as above | Change lazy-loading infra |
| Add contact channel | Add a button/link inside EmailApp, or register a new app | Touch API route (unless new backend needed) |
| Add settings panel | Register a SettingsApp | Touch StartMenu |
| Add Start Menu category | Just use a new `startMenuCategory` string | Touch StartMenu rendering code |

---

## 9. Astro Islands Strategy

### What Astro Does (Static)

- Renders `index.astro` as the page shell
- Processes CV Markdown via content collections at build time
- Serializes CV HTML into a `<script type="application/json">` block
- Serves pre-built PDF/DOC as static files from `public/`
- Provides `/api/contact` endpoint for email submission
- Loads 98.css, global CSS, fonts in `<head>`

### What SolidJS Does (Interactive)

- One `<Desktop client:load />` island hydrates immediately
- Manages all window state, drag interactions, taskbar, start menu
- Reads pre-rendered CV content from the JSON script tag
- Lazy-loads heavy sub-apps (terminal, games) via dynamic `import()`

### Hydration Directive

`client:load` - not `client:idle` or `client:visible`. The desktop IS the page. It needs to be interactive immediately. There's no "above the fold static content" to show first.

### Data Flow: Astro → SolidJS

```
Build time:
  Markdown files → Astro content collections → HTML string

Rendered in index.astro:
  <script type="application/json" id="cv-data">
    { "html": "<h2>Experience</h2>...", "title": "Dmytro Lesyk - CV" }
  </script>

At runtime (SolidJS):
  const cvData = JSON.parse(document.getElementById('cv-data').textContent);
  // BrowserApp renders cvData.html via innerHTML
```

This is zero-overhead: no runtime Markdown parser, no fetch request, no loading state for CV content.

---

## 10. Content Architecture (Markdown CV)

### File Structure

```
src/content/cv/
├── config.ts          # content collection schema (zod)
├── profile.md         # name, title, summary, photo, links
├── experience.md      # work history
├── education.md       # education
├── skills.md          # technical skills
└── projects.md        # notable projects (optional)
```

### Content Collection Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const cv = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number(),        // controls section ordering
    icon: z.string().optional(), // optional section icon
  }),
});

export const collections = { cv };
```

### Why Multiple Files, Not One Big Markdown?

- Each section is independently editable
- Order is controlled via frontmatter `order` field
- Easy to add/remove sections without touching other content
- Content collections validate structure at build time

### Build-Time Rendering

In `index.astro`:

```astro
---
import { getCollection } from 'astro:content';

const cvSections = await getCollection('cv');
const sorted = cvSections.sort((a, b) => a.data.order - b.data.order);

const rendered = await Promise.all(
  sorted.map(async (section) => {
    const { Content } = await section.render();
    // Capture rendered HTML (implementation detail)
    return { slug: section.slug, title: section.data.title, html: /* rendered */ };
  })
);
---

<script type="application/json" id="cv-data" set:html={JSON.stringify(rendered)} />
```

The SolidJS `BrowserApp` component reads this and renders section-by-section inside the fake Netscape window.

---

## 11. Export Architecture (PDF / DOC)

### Recommendation: Build-Time Generation

**Approach:** Generate PDF and DOC files at build time. Serve them as static downloads.

**Why:**
- No client-side libraries needed (jsPDF is ~280KB, docx is ~80KB)
- No server-side rendering endpoint needed at runtime
- Files are always in sync with Markdown content (generated from same source)
- Download is instant (no generation delay)

### PDF Generation

Use a dedicated Astro page `src/pages/cv-print.astro` that renders CV content in a clean, print-friendly layout. Then:

**Option A (recommended): Pre-built PDF checked into `public/`**
- Render `cv-print.astro` in a headless browser during build (Playwright)
- Output to `public/downloads/cv.pdf`
- Simple, reliable, and the PDF looks exactly like what you'd print from the browser

**Option B: Manual PDF**
- Just keep a manually designed PDF in `public/downloads/cv.pdf`
- Update it when CV content changes
- Simpler, but can drift from Markdown source

**Recommendation:** Start with Option B (manual) for MVP. Add automated generation (Option A) later if you edit CV content frequently.

### DOC Generation

**Option A (recommended): Build script with `docx` library**
- A Node.js build script reads CV Markdown, generates `.docx` via the `docx` package
- Output to `public/downloads/cv.docx`
- Run as part of `pnpm build`

**Option B: Manual DOC**
- Keep a manually exported DOC in `public/downloads/`

**Recommendation:** Start with manual DOC for MVP. The `docx` library approach is straightforward to add later.

### Explorer Window UX

The Explorer window displays:
```
📁 My Documents > CV
├── 📄 CV.pdf    (1.2 MB)
└── 📄 CV.docx   (45 KB)
```

Each file icon is just an `<a href="/downloads/cv.pdf" download>` link styled as a Win95 file icon. Clicking triggers a browser download. No JavaScript needed for the actual download.

---

## 12. Contact Architecture (Resend)

### Architecture

```
EmailApp (SolidJS)          Astro API Route           Resend API
┌──────────────┐           ┌──────────────┐          ┌──────────┐
│ ComposeForm  │──POST────▶│/api/contact  │──send───▶│ Resend   │
│              │◀──JSON────│              │◀─result──│          │
│ • name       │           │ • validate   │          └──────────┘
│ • email      │           │ • rate limit │
│ • subject    │           │ • honeypot   │
│ • message    │           │ • send email │
│ • honeypot   │           └──────────────┘
│   (hidden)   │
└──────────────┘
```

### API Endpoint

`src/pages/api/contact.ts`:

```typescript
// Pseudocode - not implementation
export async function POST({ request }) {
  const body = await request.json();

  // 1. Honeypot check (hidden field must be empty)
  if (body.website) return new Response("OK", { status: 200 }); // silent discard

  // 2. Validate required fields
  // 3. Basic rate limiting (optional: check timestamp-based token)
  // 4. Send via Resend
  //    from: noreply@yourdomain.com
  //    to: your-email@domain.com
  //    replyTo: body.email
  //    subject: `[CV Contact] ${body.subject}`
  //    text: body.message

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
```

### Email Window UX

Styled as a 90s email client (Outlook Express / The Bat! vibes):
- **To field**: Pre-filled, read-only (your email, partially masked)
- **From field**: User enters their email
- **Subject field**: User enters subject
- **Body**: Textarea for message
- **Send button**: Posts to API, shows "Message sent!" or error in a retro dialog box
- **Telegram button**: Separate button/link: `<a href="https://t.me/yourusername">` styled as a 98.css button

### Deployment Consideration

Resend needs a server-side API key. This means:
- Astro must be deployed with SSR enabled for at least the `/api/contact` route
- With `@astrojs/node` adapter, Astro defaults to hybrid rendering: static by default, SSR only for pages that opt in with `export const prerender = false`
- Or use `server` mode with `prerender: true` on index.astro

**Recommendation:** Use the Node adapter (hybrid by default). The index page is prerendered (static). Only `/api/contact` runs server-side (`export const prerender = false`).

### Deployment Target: Railway

The site deploys to Railway using the Astro Node adapter (`@astrojs/node` in standalone mode).

**Build & runtime:**
- Railway builds via a multi-stage `Dockerfile` (node:24-slim), NOT nixpacks
- Start command: `node dist/server/entry.mjs`

**Environment variables (must be set in Railway):**

| Variable | Scope | How accessed | Description |
|---|---|---|---|
| `RESEND_API_KEY` | Runtime (server) | `process.env` | Resend API key for sending emails |
| `CONTACT_TO_EMAIL` | Runtime (server) | `process.env` | Destination email for contact form |
| `CONTACT_FROM_EMAIL` | Runtime (server) | `process.env` | Sender address (must match verified Resend domain) |
| `PUBLIC_TELEGRAM_USERNAME` | Build-time | `import.meta.env` | Telegram handle (Astro inlines `PUBLIC_*` at build) |
| `HOST` | Runtime | Node adapter | `0.0.0.0` (Railway requires binding to all interfaces) |
| `PORT` | Runtime | Node adapter | Railway sets this automatically |

**Critical:** `PUBLIC_*` variables are inlined into the client bundle at build time. They must be present in Railway's build environment, not just runtime.

**Critical:** Server-side runtime secrets (RESEND_API_KEY, CONTACT_TO/FROM_EMAIL) MUST be read via `process.env`, not `import.meta.env`. Vite inlines all `import.meta.env` values at build time — in Docker builds where secrets aren't present, they become empty strings.

### CI/CD: GitHub Actions

Two workflow files:
1. **`ci.yml` (quality gate)** — runs on all PRs and push to `main`. Jobs: `pnpm verify` + `pnpm build`, and CV file staleness check (`pnpm generate-cv` + git diff, requires Chrome + pandoc).
2. **`deploy.yml` (deployment)** — runs on push to `main` only. Deploys to Railway via `railway up` using `RAILWAY_TOKEN` GitHub secret.

### CV File Generation

`scripts/generate-cv.ts` reads all Markdown files from `src/content/cv/` and generates:
- `public/downloads/cv.pdf` - via Chrome headless (styled HTML with sidebar layout)
- `public/downloads/cv.docx` - via pandoc

Both include the photo and all content. The generated files are committed to the repo and served as static assets. Run `pnpm generate-cv` after editing any CV content.

---

## 13. Mobile Strategy

### The Problem

A draggable window manager makes no sense on a 375px-wide phone screen. But the site must still be usable on mobile.

### Approach: Responsive Degradation, Not Full Redesign

**Above 768px (desktop/tablet):** Full window manager experience - drag, overlap, z-index, taskbar.

**Below 768px (mobile):**
- Desktop icons become a clean vertical list/grid
- Tapping an icon opens the app **full-screen** (like a mobile OS app)
- Only one "app" visible at a time (no overlapping windows)
- Taskbar becomes a minimal bottom bar with Back/Home buttons
- No dragging, no resize, no minimize
- Windows get a "Back" button (close window, return to icon grid)

### Why This Works

- The metaphor is preserved: you still "open apps" from a "desktop"
- 98.css components look fine at any width - buttons, inputs, title bars are all naturally responsive
- The CV content reflows normally in a full-screen window
- The export links work identically
- The contact form works identically
- Games/terminal can fill the screen

### Implementation

A single `isMobile` signal derived from a media query (via `matchMedia`). The same components render differently based on this signal - no separate mobile component tree.

```typescript
const isMobile = createSignal(window.matchMedia("(max-width: 768px)").matches);
// Update on resize via matchMedia listener
```

Window component checks `isMobile()`:
- If mobile: `position: fixed; inset: 0; z-index: auto;`
- If desktop: `position: absolute; left: ${x}px; top: ${y}px;`

---

## 14. Lazy-Loading & Performance Strategy

### Load Budget

| Resource | Target Size | Loads When |
|---|---|---|
| 98.css | ~10KB gzip | Page load (critical) |
| SolidJS runtime | ~7KB gzip | Page load (critical) |
| Desktop + WindowManager + Taskbar | ~15-20KB gzip (estimate) | Page load (critical) |
| **Total critical path** | **~35KB gzip** | **Immediately** |
| xterm.js | ~300KB gzip | Terminal window opens |
| Game (each) | ~50-150KB (varies) | Game window opens |

### Lazy Loading Pattern

Every "heavy" app uses the same pattern:

```typescript
// In WindowBody, when app === "terminal"
const TerminalApp = lazy(() => import("./apps/TerminalApp"));

// Renders:
<Suspense fallback={<LoadingIndicator />}>
  <TerminalApp />
</Suspense>
```

The `Window` shell (title bar, chrome, position) renders immediately. The `WindowBody` shows a retro-styled loading indicator (hourglass cursor + "Loading..." text) until the dynamic import resolves.

### Performance Guardrails

1. **No top-level imports of heavy modules.** xterm.js and game engines must always be behind `import()`.
2. **98.css in `<head>` as render-blocking.** It's only ~10KB and prevents FOUC.
3. **Fonts:** Use 98.css's bundled Pixelated MS Sans Serif. No external font requests.
4. **Images:** Desktop icons are small (32×32) PNGs. Already in `assets/icons/`. No lazy loading needed - total is <50KB.
5. **Pre-rendered CV:** No runtime Markdown processing. HTML is in the page from build time.
6. **Prefetch exports:** `<link rel="prefetch" href="/downloads/cv.pdf">` - start downloading PDF in the background so it's instant when clicked.

### Build-Time Checks

- `astro build` output should show the index page is <50KB HTML
- Lighthouse performance score target: 90+ on desktop, 80+ on mobile
- No JS bundle larger than 25KB gzip (SolidJS island code, excluding lazy chunks)

---

## 15. Accessibility Considerations

### The Tension

A "fake OS in a browser" is inherently an accessibility challenge. Real OS window managers have years of accessibility work. We won't replicate that. But we can do the basics right.

### Must-Haves

1. **Keyboard navigation:**
   - Tab cycles through desktop icons
   - Enter/Space opens the selected icon's app
   - Escape closes the focused window or start menu
   - Tab within a window cycles through interactive elements

2. **ARIA roles:**
   - Desktop icons: `role="button"` with `aria-label`
   - Windows: `role="dialog"` with `aria-labelledby` pointing to title bar text
   - Taskbar: `role="toolbar"`
   - Start menu: `role="menu"` with `role="menuitem"` children

3. **Focus management:**
   - When a window opens, focus moves to it
   - When a window closes, focus returns to the desktop icon or taskbar button that opened it
   - The focused window has a visible title bar color change (already handled by Win95 active/inactive title bar styling)

4. **`<noscript>` fallback:**
   - Direct links to CV content (a separate `/cv` page rendered from the same Markdown)
   - Direct download links to PDF/DOC
   - `mailto:` link for contact

5. **Semantic HTML under the aesthetic:**
   - CV content uses proper `<h2>`, `<h3>`, `<ul>`, `<p>` tags (comes from Markdown rendering)
   - Form elements in email app use `<label>`, proper `type` attributes, `required`
   - Window title bars use `<h1>` or heading tag for the window title

### Nice-to-Haves (Defer)

- Screen reader announcement when windows open/close (`aria-live` region)
- High contrast mode toggle
- Reduced motion preference (disable drag animations)

---

## 16. Folder Structure

```
cv/
├── public/
│   ├── downloads/
│   │   ├── cv.pdf                    # pre-built PDF
│   │   └── cv.docx                   # pre-built DOC
│   ├── cursors/                      # retro cursor files (optional)
│   │   ├── default.cur
│   │   ├── pointer.cur
│   │   └── wait.cur
│   └── favicon.ico                   # retro-styled favicon
│
├── src/
│   ├── assets/
│   │   └── icons/                    # desktop icon PNGs (32×32)
│   │       ├── browser.png
│   │       ├── folder.png
│   │       ├── email.png
│   │       ├── terminal.png
│   │       ├── pdf.png
│   │       ├── doc.png
│   │       └── snake.png                 # (+ more game icons as needed)
│   │
│   ├── content/
│   │   └── cv/                       # Markdown CV sections
│   │       ├── profile.md
│   │       ├── experience.md
│   │       ├── education.md
│   │       ├── skills.md
│   │       └── projects.md
│   │
│   ├── components/
│   │   └── desktop/                  # SolidJS components
│   │       ├── Desktop.tsx           # root island component
│   │       ├── DesktopIconGrid.tsx
│   │       ├── DesktopIcon.tsx
│   │       ├── WindowManager.tsx     # renders all open windows
│   │       ├── Window.tsx            # generic window container
│   │       ├── TitleBar.tsx
│   │       ├── Taskbar.tsx
│   │       ├── StartMenu.tsx
│   │       ├── Clock.tsx
│   │       ├── apps/
│   │       │   ├── registry.ts       # APP_REGISTRY + registerApp()
│   │       │   ├── BrowserApp.tsx    # CV viewer
│   │       │   ├── ExplorerApp.tsx   # export downloads
│   │       │   ├── EmailApp.tsx      # contact form
│   │       │   ├── TerminalApp.tsx   # lazy: xterm.js wrapper
│   │       │   ├── GameApp.tsx       # lazy: generic game host (canvas + keyboard)
│   │       │   └── games/
│   │       │       ├── Snake.tsx     # 90s-style Snake game
│   │       │       └── (future: Tetris.tsx, etc.)
│   │       └── store/
│   │           ├── desktop-store.ts  # createStore + actions
│   │           ├── types.ts          # WindowState, AppRegistryEntry, etc.
│   │           └── context.tsx       # DesktopContext provider
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro          # <html>, <head>, shared meta
│   │
│   ├── pages/
│   │   ├── index.astro               # the desktop page
│   │   ├── cv-print.astro            # print-friendly CV layout (for PDF gen)
│   │   └── api/
│   │       └── contact.ts            # Resend API endpoint
│   │
│   └── styles/
│       ├── global.css                # desktop background, layout, cursor overrides
│       ├── desktop.css               # icon grid positioning, taskbar layout
│       └── window.css                # window positioning, drag transforms
│
├── assets/                           # source design assets (not deployed)
│   └── icons/                        # original icon files
│
├── docs/                             # architecture, planning, design docs
│   ├── design-system.md
│   ├── design-tokens.json
│   ├── architecture-guidelines.md    # this file
│   └── implementation-plan.md
│
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

### Key Structural Decisions

- **All SolidJS components live under `src/components/desktop/`** - they form a cohesive unit (the desktop environment). No scattering across `ui/`, `features/`, `shared/`.
- **`apps/registry.ts` is the single point of extensibility.** Adding a new app = creating a component file + calling `registerApp()`. Desktop icons, start menu, and window manager all read from the registry.
- **Store is co-located with components** - not in a top-level `src/store/`. It's specific to the desktop system.
- **Apps are in a sub-folder** - `apps/` contains the content components rendered inside windows. This separates "window chrome" from "window content."
- **Games get their own sub-folder** - `apps/games/` keeps game implementations isolated. Each game is a self-contained module.
- **CSS is minimal** - 98.css handles 80% of styling. Custom CSS is only for layout positioning.
- **`assets/` (root) vs `src/assets/`** - root `assets/` is for design source files. `src/assets/` is for files imported by Astro components (optimized at build time).

---

## 17. Risks, Tradeoffs, and Rejected Alternatives

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Window drag performance on low-end devices | Medium | Visible jank during drag | SolidJS fine-grained updates help. Use CSS `transform` not `left/top`. Use `will-change: transform`. |
| xterm.js bundle hurts perception of load speed | Low | Slow perceived load | Lazy-load only on terminal open. Never import at top level. |
| 98.css doesn't cover all needed components | Medium | Need custom CSS for non-standard elements | Expected. The toolbar decorations in BrowserApp/ExplorerApp need custom CSS. Budget time for this. |
| Accessibility complaints | Medium | Reputation risk | Implement `<noscript>` fallback. Keyboard nav for core flows. ARIA on windows. |
| Mobile experience feels broken | Medium | Mobile users bounce | Responsive degradation to full-screen apps. Test on real devices early. |
| CV content gets out of sync with PDF/DOC | Medium | Embarrassing inconsistency | MVP uses manual files. Automated build-time generation is Phase 3. |

### Tradeoffs Accepted

| Decision | Benefit | Cost |
|---|---|---|
| Single SolidJS island | Simple state management | All interactive code loads upfront (~25KB) |
| `client:load` not `client:idle` | Desktop is immediately interactive | No progressive hydration savings |
| No window resizing in MVP | Much simpler drag implementation | Less authentic window behavior |
| Manual PDF/DOC for MVP | No build complexity | Must remember to update when CV changes |
| Hybrid rendering (adapter default) | Static pages + SSR API routes | Slightly more complex deploy than pure static |

### Rejected Alternatives

| Alternative | Why Rejected |
|---|---|
| **React** for islands | Too large (~40KB). No fine-grained reactivity. Overkill for this project. |
| **Svelte** for islands | Good choice, but SolidJS signals are a more natural fit for the window manager's frequent fine-grained updates. See detailed comparison in Section 3. |
| **Multiple small islands** (separate island per icon, per window, for taskbar) | Cross-island state synchronization is complex and fragile. One island is simpler. |
| **Web Components** for windows | Could work for the window shell, but state management across components is painful. No ecosystem benefit over SolidJS. |
| **Tailwind CSS** | Contradicts the 98.css approach. Utility classes would fight with 98.css's semantic classes. Adds build complexity. |
| **Client-side PDF generation** (jsPDF, html2pdf) | Adds ~280KB to bundle. Results look worse than headless browser rendering. No benefit over pre-built static files. |
| **Zustand/Redux for state** | These are React-ecosystem tools. SolidJS has `createStore` built in - no extra dependency needed. |
| **Full SSR for the desktop** | The desktop IS the client-side interaction. SSR adds complexity with no SEO benefit (it's a single-page desktop). |
| **iframe-based windows** | Simpler isolation but terrible for state management, styling consistency, and performance. Each iframe loads a full document. |
| **CSS-only draggable windows** | Fragile hacks with `resize` or `:active` pseudo-classes. Don't actually work for proper drag behavior. |

---

## 18. Recommended Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     ASTRO (Static Shell)                     │
│                                                              │
│  index.astro ─── renders ──┬── <head>: 98.css, global.css   │
│                             ├── <script#cv-data>: pre-built  │
│                             │   CV HTML from Markdown         │
│                             ├── <noscript> fallback links    │
│                             └── <Desktop client:load />      │
│                                                              │
│  cv-print.astro ── clean CV layout for PDF generation        │
│  api/contact.ts ── Resend email endpoint (SSR)               │
│                                                              │
│  Content Collections:                                        │
│  src/content/cv/*.md → validated, rendered at build time     │
│                                                              │
│  Static Files:                                               │
│  public/downloads/cv.pdf, cv.docx                            │
├─────────────────────────────────────────────────────────────┤
│                   SOLIDJS (Interactive Island)               │
│                                                              │
│  Desktop ─── provides DesktopContext ───┐                    │
│  │                                      │                    │
│  ├── DesktopIconGrid                    │                    │
│  │   └── DesktopIcon ×N                 │                    │
│  │       (driven by APP_REGISTRY)       │                    │
│  │                                      │                    │
│  ├── WindowManager                      │                    │
│  │   └── Window ×N (open windows)       │ Shared store:      │
│  │       ├── TitleBar (drag handle)     │ - windows{}        │
│  │       └── WindowBody                 │ - windowOrder[]    │
│  │           └── APP_REGISTRY[app]      │ - nextZIndex       │
│  │               .component             │ - startMenuOpen    │
│  │                                      │                    │
│  └── Taskbar                            │                    │
│      ├── StartButton + StartMenu        │                    │
│      │   (Programs/Games/Settings from   │                    │
│      │    APP_REGISTRY categories)        │                    │
│      ├── TaskButton ×N                  │                    │
│      └── Clock                          │                    │
├─────────────────────────────────────────────────────────────┤
│              APP_REGISTRY (Extensibility)                    │
│                                                              │
│  One file: apps/registry.ts                                  │
│  registerApp() → app appears on desktop, start menu,        │
│                   terminal, everywhere. No other changes.     │
│                                                              │
│  MVP apps: browser, explorer, email                          │
│  Post-MVP: terminal, snake, tetris, settings...               │
├─────────────────────────────────────────────────────────────┤
│                      98.CSS (Aesthetic)                       │
│                                                              │
│  .window, .title-bar, button, input, select                  │
│  Pixelated MS Sans Serif font                                │
│  3D outset/inset borders                                     │
│  + Custom CSS: desktop layout, icon grid, window transforms  │
├─────────────────────────────────────────────────────────────┤
│                    MOBILE (< 768px)                           │
│                                                              │
│  Same components, different behavior:                        │
│  - Icons → grid list                                         │
│  - Windows → full-screen, one at a time                      │
│  - Taskbar → minimal back/home bar                           │
│  - No dragging                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Numbers

| Metric | Target |
|---|---|
| Critical JS bundle | ≤ 25KB gzip |
| Total page weight (no lazy) | ≤ 50KB gzip |
| Time to interactive | < 1.5s on 3G |
| Lighthouse perf (desktop) | 90+ |
| Runtime dependencies (MVP) | Astro, SolidJS, 98.css, Resend |
| API endpoints | 1 (`/api/contact`) |
| Astro rendering mode | Hybrid (default with Node adapter — static + SSR for API) |

### Decision Record

| Question | Answer |
|---|---|
| Framework for interactivity? | SolidJS (fine-grained signals for window manager) |
| How many islands? | One (`<Desktop client:load />`) |
| Where does state live? | SolidJS `createStore` in `DesktopContext` |
| How are apps registered? | `APP_REGISTRY` in `apps/registry.ts`. One `registerApp()` call = app everywhere. |
| How is CV content delivered? | Markdown → Astro content collections → pre-rendered HTML in `<script>` tag |
| How are exports generated? | Pre-built static files in `public/downloads/` |
| How does contact work? | Astro API route → Resend. Form in SolidJS `EmailApp`. |
| How does mobile work? | Responsive degradation: full-screen windows, no drag, simplified taskbar |
| How are heavy features loaded? | Dynamic `import()` with SolidJS `lazy()` + `<Suspense>` via registry |
| How do you add a new app? | Create component + `registerApp()`. No other files change. |
| What about accessibility? | ARIA roles, keyboard nav, `<noscript>` fallback with direct links |
| Window resizing? | Deferred. Not in MVP. |

---

## 19. Experimentation Platform Analysis

> Added post-MVP. The site is intended to evolve into a playground for web technology experiments — WebRTC video chat, em-dosbox/DOjS embedding, canvas drawing apps, and other ideas that fit the "retro OS" metaphor. This section evaluates the architecture's readiness and documents known extension points, pain points, and future mechanisms.

### 19.1 Architecture Scorecard

| Criterion | Score | Notes |
|---|---|---|
| **App isolation** | 🟢 9/10 | Each app is a self-contained component with its own CSS. No cross-contamination between apps. |
| **Adding a new app** | 🟢 9/10 | 1 file + 1 `registerApp()` call. `app-manifest.ts` is the only friction (see §19.4.1). |
| **Heavy dependency management** | 🟢 10/10 | `lazy()` + `<Suspense>` = zero-config lazy loading per app. |
| **Platform stability** | 🟢 9/10 | Store, Window, Desktop code won't change when adding apps. |
| **Diverse app types** (canvas, WASM, video, iframes) | 🟢 8/10 | `WindowBody` renders anything via `<Dynamic>`. Minor additions needed for min-size/keyboard capture (see §19.5). |
| **Server-side extensibility** | 🟡 7/10 | One API route today. Adding more is trivial in Astro, but WebSocket signaling is a different story. |
| **Inter-app communication** | 🟡 6/10 | Not needed yet. `appProps` covers basics. Pub/sub would be additive (see §19.6). |
| **Store complexity** | 🟢 9/10 | ~200 lines, zero app-specific logic. Will stay stable as apps grow. |

### 19.2 The Universal "Add an Experiment" Recipe

Every experiment follows the same pattern, regardless of complexity:

```
1. Create   src/components/desktop/apps/MyExperiment.tsx   (or apps/my-experiment/ for multi-file)
2. Add      registerApp({ id: 'my-experiment', component: lazy(() => import(...)), ... })
            in app-manifest.ts
3. Done.    Desktop icon, start menu, terminal, window chrome — all work automatically.
```

The platform doesn't care what's inside the window body. Canvas, `<video>`, WASM, iframes, WebGL — all are valid.

### 19.3 Target Experiments — Feasibility Assessment

#### 🟢 em-dosbox / DOjS Embedding (DOS Emulator)

**What it needs:** A `<canvas>` + WASM module (~2–5 MB), keyboard/mouse capture, audio context.

**Fits?** Yes, perfectly.

```
apps/DosBoxApp.tsx     → lazy(() => import('./DosBoxApp'))
apps/dosbox/           → emscripten glue, ROM files, config
```

- The Window component already supports canvas apps (Snake proves this pattern)
- `lazy()` handles the heavy WASM load; `<Suspense>` shows loading while WASM initializes
- Each DOS game registers separately: `registerApp({ id: 'doom', startMenuCategory: 'Games', ... })`
- A shared `DosBoxHost` component can be reused across games, parameterized via `appProps` (e.g., which ROM to load)
- **No platform changes needed.**

#### 🟢 Drawing App (Canvas-based, or via DOS Emulation)

**What it needs:** A `<canvas>`, tool state (brush, color, eraser), possibly layers.

**Fits?** Perfectly. Same pattern as Snake — a canvas component with internal state.

```
apps/PaintApp.tsx      → registerApp({ id: 'paint', ... })
```

- Tool state stays local to `PaintApp` (no store leakage)
- If done via DOS emulation, it's just another DOjS/dosbox instance
- **No platform changes needed.**

#### 🟡 WebRTC Video Chat

**What it needs:** `getUserMedia`, `RTCPeerConnection`, signaling server, `<video>` elements, retro overlay on video.

**Fits with one caveat:**

The app itself is self-contained — a `VideoChatApp.tsx` with its own `<video>` elements, connection logic, and retro overlay styling. Registration is trivial.

**However:**
- **Signaling server** — WebRTC requires a signaling channel to exchange SDP offers/answers. Options:
  - Add a new Astro SSR API route with Server-Sent Events or long-polling
  - Use a third-party signaling service (PeerJS, Firebase Realtime Database, or a hosted TURN/signaling server)
  - Add a lightweight WebSocket server alongside the Astro Node adapter
- **This is the only listed experiment that requires server-side infrastructure changes.** The Astro hybrid model supports adding API routes, but real-time signaling is a step beyond simple request/response.
- The retro overlay on `<video>` is pure CSS/canvas compositing — no platform concern.

**Platform changes needed:** One or more new API routes or an external signaling service. No Window/Desktop/Store changes.

#### 🟢 Any Future Canvas/WASM/WebGL App

The pattern is always the same: create component → lazy import → register. The platform is an inert shell.

### 19.4 Known Pain Points

#### 19.4.1 `app-manifest.ts` as a Manual Registration File

Currently all `registerApp()` calls live in `app-manifest.ts`, and `Desktop.tsx` imports it as a side-effect:

```ts
import './apps/app-manifest';
```

This works today with 6 apps. With 20+ apps (10 DOS games, paint, video chat, etc.), this file becomes a growing list of imports and registrations.

**Risk:** Low — it's just a list. But it's the one place that technically violates "no other files change when adding an app."

**Mitigation options (in order of preference):**

| Option | How | Tradeoff |
|---|---|---|
| **A: Keep the manifest** (recommended now) | One file with all imports + registerApp calls | Simple, explicit, readable up to ~30 apps |
| **B: Self-registering modules** | Each app calls `registerApp()` at module scope; manifest just re-exports: `export * from './DosBoxApp'` | Each app is 100% self-contained, but manifest still lists exports |
| **C: Dynamic glob import** | `import.meta.glob('./apps/**/register.ts', { eager: true })` auto-discovers registrations | Zero maintenance, but less explicit, harder to control load order |

**Current recommendation:** Stay with Option A until you have 15+ apps. Then evaluate B or C.

#### 19.4.2 Terminal `open` Command is Hardcoded

In `TerminalApp.tsx`, the `open` command has a hardcoded `appMap`:

```ts
const appMap: Record<string, { id: string; label: string }> = {
  browser: { id: 'browser', label: 'CV Browser' },
  email: { id: 'email', label: 'Contact app' },
  explorer: { id: 'explorer', label: 'File Explorer' },
};
```

New apps are not automatically openable from the terminal. This should read from `APP_REGISTRY` instead:

```ts
import { APP_REGISTRY } from './registry';
const app = APP_REGISTRY[target];
if (app) { actions.openWindow(app.id); ... }
```

**Status:** Should be fixed before adding new apps.

#### 19.4.3 Window Sizing for Diverse Apps

`defaultSize: { width, height }` works for most apps, but some experiments need:
- **Minimum size** — a DOS game with fixed 640×480 canvas shouldn't resize below that
- **Fixed aspect ratio** — video chat with retro overlay
- **No resize** — simple dialogs, about boxes

Currently the Window component hardcodes `MIN_WIDTH: 200` and `MIN_HEIGHT: 150`.

**Fix:** Add optional fields to `AppRegistryEntry`:

```ts
minSize?: { width: number; height: number };
resizable?: boolean;  // default: true
```

The Window component reads these from the registry entry for the current app and respects them during resize. Backward-compatible — existing apps don't need to set these.

**Status:** Should be added before the first fixed-resolution app (dosbox, paint).

#### 19.4.4 Global Keyboard Handling for Games/Emulators

The Snake game handles keyboard events on its container div via `onKeyDown`. This works because the user clicks the canvas to focus it. But:

- DOS emulators need **full keyboard capture** (including Tab, Escape, function keys that the browser or desktop shell normally intercepts)
- Two games open simultaneously could fight over keyboard input
- Escape currently closes the start menu at the Desktop level

**Mitigation options:**

| Option | How | Tradeoff |
|---|---|---|
| **A: `stopPropagation` in the app** (works today) | The app's keydown handler calls `e.stopPropagation()` for keys it consumes | Simple, no platform change, but each app must remember to do it |
| **B: `captureKeyboard` registry flag** | Add `captureKeyboard?: boolean` to `AppRegistryEntry`. When the focused window's app has this flag, the Desktop-level keydown handler yields. | Cleaner, centralized, but adds a concept to the platform |

**Current recommendation:** Start with A (apps manage their own keyboard). Move to B if it becomes a recurring problem across multiple emulator apps.

**Status:** No action needed until the first emulator app.

### 19.5 Recommended Pre-Experimentation Improvements

Small, surgical changes to make the platform ready. Do these before the first non-trivial experiment:

| # | Change | Effort | Unlocks |
|---|---|---|---|
| 1 | **Terminal `open` reads from `APP_REGISTRY`** (§19.4.2) | 15 min | Every new app is auto-openable from terminal |
| 2 | **Add `minSize?` and `resizable?` to `AppRegistryEntry`** (§19.4.3) | 30 min | DOS games with fixed resolution, non-resizable dialogs |
| 3 | **Add `captureKeyboard?` to `AppRegistryEntry`** (§19.4.4, Option B) | 30 min | DOS emulators and games that need full keyboard capture |

Total: ~75 minutes. Everything else should wait until a specific experiment demands it.

### 19.6 Future Mechanisms (Not Needed Now)

Documented here for when they become relevant. **Do not build these preemptively.**

#### 19.6.1 App-to-App Communication (Event Bus / Pub-Sub)

Currently apps are fully isolated — they can't talk to each other except through `useDesktop()` actions (`openWindow`, `closeWindow`). This is a strength. But some future scenarios might need cross-app messaging:

- A terminal that sends commands to a running DOS game
- A file manager that "opens" a file in a drawing app
- A video chat that spawns a shared whiteboard

**Current capability:** An app can call `actions.openWindow('paint', { file: 'drawing.bmp' })` via `appProps`. This covers the simplest case ("open app X with data Y").

**If more is needed:** Add a lightweight event bus to the store:

```ts
// Hypothetical — DO NOT BUILD YET
interface DesktopActions {
  // ... existing actions ...
  publish: (topic: string, payload: unknown) => void;
  subscribe: (topic: string, handler: (payload: unknown) => void) => () => void;
}
```

Apps subscribe to topics, other apps publish. The store mediates. This keeps apps decoupled (they communicate by topic, not by direct reference).

**Trigger:** Build this when two apps genuinely need to coordinate at runtime beyond the "open with props" pattern.

#### 19.6.2 App Lifecycle Hooks

Some experiments might need to react to window events:

- Pause a game when its window loses focus or is minimized
- Stop a webcam stream when the video chat window closes
- Save drawing state before the window is closed

Currently apps use SolidJS `onMount`/`onCleanup` for setup and teardown, and can read `props.window.isMinimized` (if passed through). But they don't get notified of focus/blur or pre-close events.

**If needed:** Extend `AppRegistryEntry` or pass lifecycle callbacks through context:

```ts
// Hypothetical — DO NOT BUILD YET
interface AppLifecycle {
  onWindowFocus?: () => void;
  onWindowBlur?: () => void;
  onBeforeClose?: () => boolean;  // return false to cancel close
}
```

Or more simply: pass the `WindowState` as a prop to every app, letting it react to `isMinimized`, `zIndex` changes, etc.

**Trigger:** Build this when an app needs to react to window-level events that `onMount`/`onCleanup` can't cover.

#### 19.6.3 Shared Services (Audio, Filesystem Abstraction)

Multiple apps might need shared browser APIs:

- **Audio context** — DOS emulator, games, and notification sounds all need `AudioContext`. Browsers limit how many active audio contexts you can have.
- **Virtual filesystem** — DOS emulator, drawing app (save/load), and file manager could share an IndexedDB-backed virtual FS.

**If needed:** Create shared service singletons (not in the store — these are infrastructure, not UI state):

```
services/
├── audio-service.ts      // single AudioContext, apps request channels
└── virtual-fs.ts         // IndexedDB wrapper, apps read/write files
```

Apps import these directly. No platform coupling.

**Trigger:** Build the audio service when a second app needs sound. Build the virtual FS when you want file persistence across apps.

#### 19.6.4 Window-Level Feature Flags

Some window features only matter for certain app types:

- **Status bar** — Some apps (Explorer, Paint) have a status bar at the bottom of the window; others don't.
- **Menu bar** — Some apps (Notepad, Paint) have a File/Edit/View menu bar below the title bar.
- **Toolbar** — Browser-style forward/back/address bar.

Currently these are built into individual app components (BrowserApp has its own toolbar). This is correct — apps own their chrome below the title bar. But if multiple apps need the same menu bar pattern, extract a reusable `<MenuBar>` component into `components/desktop/` (not the registry).

**Trigger:** Build shared chrome components when two or more apps need the same sub-window UI pattern.

### 19.7 Knowledge System and Architecture Explorer Graph Contract

The knowledge base is part of the platform, not a detached docs folder. `/learn/*` routes, the Library app, Architecture Explorer, `src/content/knowledge/modules.ts`, and the executable audit all share one graph-shaped contract.

`src/components/desktop/apps/architecture-explorer/architecture-data.ts` is the source of truth for Architecture Explorer graph data:

- `NODES` defines stable ids, categories, source files, and optional `knowledgeSlug` links.
- `EDGES` defines directed relationships between node ids.
- `LAYERS` maps edge types to visual layers.

The current renderer is a hand-authored SVG canvas, so nodes still contain `x`, `y`, `width`, and `height`. Treat those as presentation fields. The durable contract is renderer-agnostic:

- node ids are unique and stable
- edge endpoints resolve to node ids
- node categories stay inside the documented enum
- edge types stay inside the documented enum
- `knowledgeSlug` points to real `/learn` articles
- article `diagramRef` values point back to real node ids

`pnpm verify:knowledge` validates this contract. Run it after changing knowledge articles, curriculum modules, or Architecture Explorer data. Future **Architecture Explorer v2** work should consume this stabilized graph model and may replace the renderer with Cytoscape, LikeC4, ELK, React Flow, Solid Flow, or another graph renderer. That migration should be its own feature; do not add renderer-specific layout complexity to the current SVG implementation as a side effect of unrelated work.

The Library bridge uses the generic desktop `appProps` channel: Architecture Explorer calls `actions.openWindow('library', { initialUrl })`, the singleton store merges new props into the existing Library window, and `LibraryApp` reacts by navigating its iframe. Keep that bridge generic. Do not add Architecture Explorer-specific state to `DesktopState`.

### 19.8 What Not to Change

These patterns are load-bearing and should remain as-is:

| Pattern | Why it works | Don't... |
|---|---|---|
| `registerApp()` as single entry point | Desktop icons, start menu, terminal `open` — all derived from registry | ...add a second registration mechanism |
| `lazy()` + `<Suspense>` per app | Heavy apps load on demand, window chrome renders instantly | ...eagerly import WASM/heavy deps |
| `WindowState.appProps` for passing data | Apps receive config without store pollution | ...add app-specific fields to `WindowState` |
| `<Dynamic component={...} />` in WindowManager | Platform doesn't know or care what's inside | ...add switch statements or type checks in WindowManager |
| Single store with zero app-specific logic | ~200 lines, stable regardless of app count | ...leak app state into `DesktopState` |
| One SolidJS island | Simple state management, no cross-island sync | ...create additional `client:*` islands |
| CSS isolation (each app has own CSS file) | No style conflicts between apps | ...use global classes for app-specific styling |
| Renderer-agnostic architecture graph | Future renderers can consume stable nodes and edges | ...encode correctness in SVG-only layout assumptions |

---

## 20. Testing Strategy

The project uses a two-tier testing architecture. Each tier runs a different tool, targets different kinds of bugs, and has a different execution model.

### Tier 1: Unit Tests — vitest

**What it covers:** Pure logic — game engines, utility functions, data transformations, API route handlers. Anything that can be tested without a browser.

**Runs via:** `pnpm verify` (which also runs lint, typecheck, and `pnpm verify:knowledge`).

**Location:** Test files live next to their source files or in `tests/` (but **not** in `tests/e2e/` — that directory is excluded from vitest).

**When to write:** Any new function with branching logic, calculations, or state transitions gets a unit test. If the code has no UI and you can describe its behavior as "given X, returns Y", it belongs in vitest.

### Tier 2: E2E Tests — Playwright

**What it covers:** Hydration health, UI interactions, visual regression, responsive behavior. Tests run against a **production build** (`pnpm build && node dist/server/entry.mjs`), which is critical because SSR hydration mismatches only manifest in production — the dev server bypasses hydration via HMR.

**Runs via:** `pnpm test:e2e`. Update visual regression baselines with `pnpm test:e2e:update`.

**Location:** `tests/e2e/`. Core spec files:

| File | Purpose |
|---|---|
| `health.spec.ts` | Zero console errors, hydration succeeds, icon count correct |
| `smoke.spec.ts` | Every app opens, shows expected content, start menu + taskbar work |
| `visual-regression.spec.ts` | Screenshot comparisons for desktop/mobile empty, start menu, window |
| `responsive.spec.ts` | 768px breakpoint boundary, CRT frame visibility, mobile full-screen |
| `knowledge.spec.ts` | `/learn` curriculum rendering and staged progress persistence |
| `desktop-knowledge.spec.ts` | Architecture Explorer to Library singleton navigation |

Shared helpers live in `tests/e2e/helpers.ts`: `waitForHydration`, `ConsoleErrorCollector`, `openApp`, `closeTopWindow`.

**Two viewport projects:** Every test runs twice — desktop (1280×720) and mobile (Pixel 5, 375×812 with touch). Tests that only apply to one viewport skip on the other using `page.viewportSize()`.

**Visual regression snapshots** are committed to git (`tests/e2e/visual-regression.spec.ts-snapshots/`). They are platform-specific (darwin/linux). CI generates its own Linux snapshots on first run. When UI changes intentionally, run `pnpm test:e2e:update` locally and commit the updated snapshots.

### Which Tier to Use

| Situation | Test tier |
|---|---|
| New pure-logic module (game engine, parser, utility) | vitest unit test |
| Bug fix in logic code | vitest — reproduce the bug as a failing test first |
| New app or UI component | Playwright smoke test (app opens, content renders) |
| Bug fix in UI/interaction/responsive behavior | Playwright E2E test — reproduce the bug as a failing test first |
| Hydration or SSR issue | Playwright health test (only shows in production build) |
| Visual change (layout, styling) | Playwright visual regression — update snapshots after verifying |
| New API endpoint | vitest for the handler logic |
| Knowledge article, module, diagram ref, or Architecture Explorer graph change | `pnpm verify:knowledge` |
| `/learn`, Library iframe, Architecture Explorer navigation, or progress UI change | Playwright E2E |

### CI Integration

The `e2e` job runs after `verify` in CI. Both `verify` and `e2e` must pass before deploy. On failure, Playwright uploads screenshot diffs and traces as artifacts for debugging.
