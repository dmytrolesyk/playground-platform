# Knowledge Base Articles Enrichment — Implementation Plan

> **Goal:** Upgrade the 22 seed articles from surface-level drafts to deep, teaching-quality content with real code excerpts, decision rationale, and interactive elements.

**Branch:** `feat/knowledge-base-enrichment`

**Approach:** Don't batch-upgrade all 22. Work through them on-demand using collaborative mode — conversation first, article second. Prioritize the "Start Here" reading path since that's the entry point.

**Content Authorship:** Same rules as the original plan:
- **Collaborative mode (default for architecture/concept docs):** Have a conversation about the concepts, then distill into the article.
- **Fast mode (for technology/feature docs):** Agent reads the actual source files and produces enriched drafts. Developer reviews.

---

## Enrichment Checklist (per article)

Every article upgrade should include as many of these as applicable:

- [ ] **Real code excerpts** — actual lines from the codebase (not simplified pseudocode), with file path and line range annotations. Use fenced code blocks with the file path as a comment header.
- [ ] **Decision log** — what was considered, what was rejected, why. "We use `transform: translate()` instead of `left/top` because..." not just "we use transform."
- [ ] **Step-by-step traces** — "when you drag a window, here's exactly what happens: 1) pointerdown fires on TitleBar (line 45) → 2) setPointerCapture locks events → 3) ..."
- [ ] **Mermaid diagrams** — data flow, component trees, state transitions. Use real variable/function names from the codebase, not generic labels.
- [ ] **Cross-links** — every concept mentioned should link to its `/learn/` article. Every code path described should list files in `relatedFiles` frontmatter.
- [ ] **"Try It Yourself"** — at least one hands-on exercise per article. DevTools inspection, store manipulation, code experiment.
- [ ] **Common mistakes / gotchas** — what goes wrong if you do it differently. Real examples from the project's own bug history where possible.
- [ ] **Update frontmatter** — add `lastUpdated` date, add any missing `relatedConcepts`, `relatedFiles`, `externalReferences`.

---

## Priority Order (Start Here path first)

### Tier 1 — Architecture (collaborative mode, conversation-driven)

---

### Task 1: `architecture/overview.md` — "The Big Picture"

**Source files to read before writing:**
- `src/components/desktop/Desktop.tsx` — the island root, import chain
- `src/components/desktop/store/types.ts` — full `DesktopState` and `AppRegistryEntry` interfaces
- `src/pages/index.astro` — how the island is mounted, what's serialized
- `src/components/desktop/CrtMonitorFrame.tsx` — the wrapping layer
- `src/layouts/BaseLayout.astro` — what loads before the island

**What to add:**

- [ ] **Real component tree** — read `Desktop.tsx` imports and render tree, produce an accurate hierarchy with actual component names and file paths (not the simplified one currently there)
- [ ] **Actual store shape** — copy the real `DesktopState` interface from `types.ts` with field-by-field annotations explaining what each field does and why it exists
- [ ] **Decision log: why one island** — explain what breaks with two islands (separate SolidJS instances, no shared context, store not reactive across boundaries). Show the actual `<Desktop client:load />` line and explain why `client:load` vs `client:idle`
- [ ] **Decision log: why 98.css** — what custom CSS would look like without it, maintenance burden of hand-styling Win98 aesthetics, the "98.css is law" rule with concrete examples of what NOT to override
- [ ] **Mermaid diagram upgrade** — replace the current generic diagram with one showing real file paths: `index.astro → <Desktop client:load> → DesktopProvider → CrtMonitorFrame → [DesktopIconGrid, WindowManager, Taskbar]`
- [ ] **Build pipeline diagram** — new mermaid diagram showing: `src/content/cv/*.md → content.config.ts (Zod) → index.astro (getCollection) → <script#cv-data> JSON → BrowserApp reads DOM`
- [ ] **Try It Yourself** — "Open DevTools on the deployed site. Find the `<script id="cv-data">` tag. Parse the JSON. Now find the `<Desktop>` island root — notice it's the only `client:load` on the page."

---

### Task 2: `architecture/data-flow.md` — "From Markdown to Screen"

**Source files to read before writing:**
- `src/content.config.ts` — both collection schemas
- `src/content/cv/` — list actual files, show a real frontmatter example
- `src/pages/index.astro` — the serialization code
- `src/components/desktop/apps/cv-data.ts` — the deserialization code
- `src/components/desktop/apps/BrowserApp.tsx` — how HTML is rendered

**What to add:**

- [ ] **Real markdown example** — show an actual `src/content/cv/*.md` file's frontmatter and first few lines
- [ ] **Real serialization code** — copy the exact code from `index.astro` that fetches, sorts, maps, and serializes. Annotate each line
- [ ] **Real deserialization code** — copy `loadCvData()` from `cv-data.ts`. Show the `getElementById` → `JSON.parse` → typed array pipeline
- [ ] **Real render code** — show how `BrowserApp.tsx` calls `loadCvData()` in `onMount` and maps sections to `innerHTML` divs
- [ ] **Mermaid sequence diagram** — show the full timeline: Build Time (`astro build` → `getCollection('cv')` → `rendered.html` → `JSON.stringify`) then Runtime (`onMount` → `getElementById` → `JSON.parse` → `setSections` → DOM update)
- [ ] **Gotcha: innerHTML XSS** — explain why `innerHTML` is safe here (content is our own markdown, rendered at build time, never user input)
- [ ] **Gotcha: what if you import a markdown parser** — explain the AGENTS.md rule about zero runtime markdown processing, show what it would cost (bundle size comparison)
- [ ] **Try It Yourself** — "Add a new `.md` file to `src/content/cv/` with frontmatter `order: 99`. Run `pnpm dev`. Open View CV. See it appear at the bottom. Now look at the `#cv-data` script tag — your new section is in the JSON."

---

### Task 3: `architecture/state-management.md` — "The Desktop Store"

**Source files to read before writing:**
- `src/components/desktop/store/desktop-store.ts` — full store implementation
- `src/components/desktop/store/types.ts` — all interfaces
- `src/components/desktop/store/context.tsx` — provider and hook

**What to add:**

- [ ] **Full DesktopState type** — copy the real interface, annotate each field
- [ ] **Full DesktopActions type** — copy the real interface, group actions by category (window lifecycle, window geometry, UI state)
- [ ] **Real `openWindow` implementation** — copy the actual function with annotations. Show: singleton check → id generation → cascade positioning → `setState(produce(...))` → start menu closes
- [ ] **Real `focusWindow` implementation** — show the z-index bump pattern, explain why monotonic counter works
- [ ] **Reactivity trace** — "When you call `actions.openWindow('terminal')`, here's exactly what re-renders: 1) `state.windows` has a new key → WindowManager's `<For>` picks it up → 2) `state.windowOrder` has a new entry → Taskbar's `<For>` picks it up → 3) `state.nextZIndex` incremented → nothing subscribes to this directly → 4) `state.startMenuOpen` set false → StartMenu hides"
- [ ] **Mermaid state diagram** — window lifecycle: `[not open] → openWindow → [open, normal] → minimizeWindow → [minimized] → focusWindow → [open, normal] → maximizeWindow → [maximized] → maximizeWindow → [open, normal] → closeWindow → [not open]`
- [ ] **Decision log: why one store** — explain atomic operations (openWindow updates 4 fields in one `produce`), contrast with what breaks if windows and windowOrder were separate stores
- [ ] **Decision log: produce vs direct setState** — show both styles, explain when `produce` is needed (nested object mutation) vs path syntax (`setState('startMenuOpen', false)`)
- [ ] **Try It Yourself** — "Open DevTools console. Run: `document.querySelector('[data-solid-context]')` (or explain how to access the store via SolidJS DevTools extension). Inspect `state.windows` — see every open window's full state. Change a z-index manually — watch the stacking order change."

---

### Task 4: `architecture/window-manager.md` — "How Windows Work"

**Source files to read before writing:**
- `src/components/desktop/Window.tsx` — full component (~200 lines)
- `src/components/desktop/TitleBar.tsx` — title bar rendering
- `src/components/desktop/WindowManager.tsx` — the orchestrator
- `src/components/desktop/styles/window.css` — layout styles

**What to add:**

- [ ] **Real drag implementation** — copy the actual `handleDragStart`, `handleDragMove`, `handleDragEnd` from Window.tsx. Annotate: pointer capture, offset calculation, clamping to container bounds, `will-change` toggle
- [ ] **Real resize implementation** — copy the edge detection logic (`detectResizeEdge`), the `handleResizeStart/Move/End` functions. Explain the 8-direction system with the `CURSOR_MAP`
- [ ] **Real WindowManager render** — show how it iterates `windowOrder`, looks up `APP_REGISTRY`, wraps in `<Window>` + `<Suspense>`
- [ ] **Mermaid sequence diagram: drag lifecycle** — `User pointerdown on TitleBar → setPointerCapture → style.willChange = 'transform' → [pointermove loop: updateWindowPosition → store update → CSS transform changes] → pointerup → releasePointerCapture → style.willChange = ''`
- [ ] **Mermaid sequence diagram: window open** — `User double-clicks icon → DesktopIconGrid.onDoubleClick → actions.openWindow(appId) → store.windows[id] = newWindow → WindowManager <For> picks up new id → resolves APP_REGISTRY[appId].component → <Suspense> renders → lazy chunk downloads (if lazy) → app renders`
- [ ] **Gotcha: pointer capture and fast mouse** — explain with a concrete scenario: "Move your mouse really fast during drag. Without capture, the cursor leaves the title bar, pointermove fires on the desktop background, the window freezes. With capture, events keep flowing to the title bar element."
- [ ] **Gotcha: viewport vs container** — document the bug we fixed this session: `window.innerHeight` is the browser viewport, but windows live inside the CRT frame. Show the wrong code (`100vh`) and the fix (`100%`)
- [ ] **Decision log: transform vs left/top** — show a Chrome DevTools Performance recording comparison if possible, or explain the compositor layer theory with reference to the compositor-pattern concept doc
- [ ] **Try It Yourself** — "Open a window. Open DevTools Elements panel. Find the `.win-container` div. Watch the `transform` style change as you drag. Now toggle `will-change` manually in Styles — notice the Layers panel shows a new compositor layer appear."

---

### Task 5: `architecture/app-registry.md` — "The Registry Pattern"

**Source files to read before writing:**
- `src/components/desktop/apps/registry.ts` — the registry and helpers
- `src/components/desktop/apps/app-manifest.ts` — all registrations
- `src/components/desktop/WindowManager.tsx` — component resolution
- `src/components/desktop/DesktopIconGrid.tsx` — icon reading
- `src/components/desktop/StartMenu.tsx` — menu entry reading
- `src/components/desktop/apps/TerminalApp.tsx` — terminal's `open` command (reads registry)

**What to add:**

- [ ] **Full AppRegistryEntry type** — copy from types.ts with field-by-field annotations. Include the new fields added during knowledge-base work: `desktopAlign`, `openMaximized`
- [ ] **Full app-manifest.ts** — show every registration, annotate the patterns: direct import (BrowserApp) vs lazy import (TerminalApp), singleton vs multi-instance, desktop+startMenu flags
- [ ] **Trace: registerApp → icon appears** — step through: `app-manifest.ts` runs (imported by Desktop.tsx) → `registerApp()` writes to `APP_REGISTRY` map → `DesktopIconGrid` calls `getDesktopApps()` → filters `desktop: true` → renders `<DesktopIcon>` for each
- [ ] **Trace: icon click → window renders** — step through: `DesktopIcon.onDoubleClick` → `actions.openWindow('browser')` → store creates `WindowState` → `WindowManager` iterates `windowOrder` → finds new id → `APP_REGISTRY['browser'].component` → renders `<BrowserApp>`
- [ ] **Real helper functions** — show `getDesktopApps()`, `getStartMenuApps()`, `getStartMenuCategories()`, `resolveAppComponent()` with annotations
- [ ] **Terminal integration** — show how the terminal's `open` command reads `APP_REGISTRY` to let users open apps by name from the CLI
- [ ] **Gotcha: import order matters** — `app-manifest.ts` must run before any component tries to read the registry. Show the import in Desktop.tsx (`import './apps/app-manifest'`) and explain why it's a side-effect import
- [ ] **Try It Yourself** — "Open the Terminal app. Type `ls`. See the list of registered apps. Type `open snake`. The Snake game opens. This works because the terminal reads APP_REGISTRY — same source of truth as the desktop icons."

---

### Task 6: `architecture/contact-system.md` — "The Contact System"

**Source files to read before writing:**
- `src/pages/api/contact.ts` — full endpoint
- `src/components/desktop/apps/EmailApp.tsx` — the form
- `src/components/desktop/apps/ContactApp.tsx` — the chooser
- `Dockerfile` — to show the build-time env var issue

**What to add:**

- [ ] **Full endpoint code** — copy `contact.ts` with line-by-line annotations: request parsing, validation, env var reading, Resend call, error handling, response
- [ ] **Real EmailApp form code** — show the form submission handler, the fetch to `/api/contact`, the success/error UI states
- [ ] **ContactApp → EmailApp flow** — trace: user clicks "Contact Me" → ContactApp renders chooser → user clicks "Email" → `actions.openWindow('email')` → EmailApp renders
- [ ] **The process.env landmine — detailed** — show three code examples: (1) wrong: `import.meta.env.RESEND_API_KEY` (2) wrong: `process.env.RESEND_API_KEY` (fails with noPropertyAccessFromIndexSignature) (3) correct: `process.env['RESEND_API_KEY']`. Show what happens in Docker: the Dockerfile's `ARG`/`ENV` for PUBLIC_ vars, and why non-PUBLIC_ vars must be runtime
- [ ] **Resend SDK pattern — detailed** — show the `{ data, error }` return, contrast with a try/catch approach that would silently swallow errors. Show what `error` actually looks like (the shape of the error object)
- [ ] **Gotcha: from address domain** — explain that Resend requires the from-domain to match the verified domain. Show what error you get if it doesn't match
- [ ] **Mermaid sequence diagram** — `User fills form → EmailApp fetch('/api/contact', POST) → contact.ts validates → Resend.emails.send() → Resend API → { data, error } → Response to client → EmailApp shows success/error`
- [ ] **Try It Yourself** — "Look at the Dockerfile. Find the `ARG PUBLIC_TELEGRAM_USERNAME` line. This is how PUBLIC_ vars survive Docker build. Now search for RESEND_API_KEY in the Dockerfile — it's NOT there, because it's read at runtime via process.env."

---

### Tier 2 — Core Concepts (mix of collaborative + enhanced drafts)

---

### Task 7: `concepts/fine-grained-reactivity.md`

**Source files to read:** `src/components/desktop/store/desktop-store.ts`, `src/components/desktop/Window.tsx`

- [ ] **SolidJS compiler output** — show a simple component before/after compilation. Explain how `{count()}` becomes a direct DOM subscription
- [ ] **Store proxy deep dive** — show how `state.windows['browser-1'].x` creates a granular subscription path. Use the actual store shape from the project
- [ ] **Performance proof** — "During a window drag, `updateWindowPosition` fires 60 times/second. Only the dragged window's `transform` CSS updates. The taskbar, other windows, start menu — nothing else re-executes." Explain why with the subscription model
- [ ] **DevTools exercise** — "Install SolidJS DevTools browser extension. Open the site. Inspect the component tree. Watch which components highlight (re-execute) when you drag a window — only the Window component for the dragged window lights up."
- [ ] **Comparison table** — Signal read/write vs React useState, createEffect vs useEffect, createMemo vs useMemo — with behavioral differences, not just syntax

---

### Task 8: `concepts/signals-vs-vdom.md`

**Source files to read:** `src/components/desktop/Window.tsx` (drag as the benchmark scenario)

- [ ] **Concrete perf scenario** — "Open 5 windows. Drag one. In React with default behavior, all 5 window components re-render on every mousemove (the parent re-renders, children re-render). In SolidJS, only the CSS transform on the one dragged window updates."
- [ ] **What React would need** — show the `React.memo` + `useCallback` + `useMemo` boilerplate you'd need to achieve the same performance. Show it's ~15 extra lines per component
- [ ] **DOM mutation comparison** — "Open DevTools Performance tab. Record a 2-second window drag. Look at the DOM mutations — you'll see only `style.transform` changes on one element. No DOM node creation, no attribute diffing, no tree walking."
- [ ] **Mental model diagram** — mermaid: React cycle (`State change → Component function runs → VDOM diff → DOM patch`) vs SolidJS cycle (`Signal change → Subscribed effect runs → DOM update`). Show that SolidJS skips two entire steps

---

### Task 9: `concepts/islands-architecture.md`

**Source files to read:** `src/pages/index.astro`, `src/layouts/BaseLayout.astro`

- [ ] **Actual index.astro source** — show the real file with the single `<Desktop client:load />` and the `<script#cv-data>` tag. Annotate: "This is the only `client:*` directive in the entire site"
- [ ] **What breaks with two islands** — concrete scenario: "Imagine splitting Taskbar into its own `<Taskbar client:load />`. Now the Taskbar has its own SolidJS instance. `useDesktop()` throws because there's no `DesktopProvider` wrapping it. You'd need a global event bus or postMessage to sync window state between islands. This defeats the purpose."
- [ ] **The /learn pages contrast** — "The `/learn/*` routes use `LearnLayout.astro` with zero SolidJS. No island, no store, no hydration. Just static HTML + a small mermaid script. This is where islands architecture shines — interactive pages get JS, reading pages don't."
- [ ] **Bundle size proof** — "View source on `/learn/architecture/overview`. Search for `solid` — nothing. Now view source on `/`. Find the SolidJS runtime chunk. That's the one island's cost."

---

### Task 10: `concepts/pointer-events-and-capture.md`

**Source files to read:** `src/components/desktop/Window.tsx` (drag + resize handlers)

- [ ] **Real drag code** — copy actual `handleDragStart/Move/End` with annotations on every line
- [ ] **Real resize code** — copy actual `handleResizeStart/Move/End`, show edge detection
- [ ] **Mermaid lifecycle diagram** — `pointerdown → setPointerCapture(id) → [pointermove × N (captured)] → pointerup → releasePointerCapture(id)`
- [ ] **The failure mode** — "Remove the `setPointerCapture` call. Now drag a window quickly. The window freezes when your cursor leaves the title bar. Here's why: [explain event targeting]"
- [ ] **Mutual exclusion** — show how drag and resize use the same pointer events but are mutually exclusive: resize checks edge proximity first, drag only activates on the title bar

---

### Task 11: `concepts/compositor-pattern.md`

**Source files to read:** `src/components/desktop/Window.tsx` (will-change toggle), `src/components/desktop/styles/window.css`

- [ ] **Chrome Layers panel walkthrough** — step-by-step: "Open DevTools → More Tools → Layers. Drag a window. Watch a new layer appear (will-change: transform). Release — layer disappears."
- [ ] **Performance recording** — "Open DevTools → Performance → Record → Drag a window for 2s → Stop. Look at the Frames section. Every frame should be under 16ms. In the Summary, 'Composite Layers' should dominate — minimal 'Layout' and 'Paint'."
- [ ] **The will-change lifecycle** — show the actual code from Window.tsx that adds/removes `will-change: transform`. Explain why permanent `will-change` wastes GPU memory (every window would have its own layer even when idle)
- [ ] **Contrast: left/top approach** — "If we used `left: ${x}px` instead, every drag frame would trigger Layout → Paint → Composite. That's ~3x more work per frame."

---

### Task 12: `concepts/inversion-of-control.md`

**Source files to read:** `src/components/desktop/apps/registry.ts`, `src/components/desktop/apps/app-manifest.ts`, `src/components/desktop/DesktopIconGrid.tsx`, `src/components/desktop/WindowManager.tsx`, `src/components/desktop/StartMenu.tsx`

- [ ] **Full trace: registerApp to visible icon** — step through every file in the chain with real code excerpts
- [ ] **Full trace: icon click to rendered window** — same, with every intermediate step
- [ ] **Before/after comparison** — show what the codebase would look like without the registry (direct imports, switch statements) vs with it. Count the files you'd need to edit to add a new app: 5+ files vs 1 file
- [ ] **The AGENTS.md rule** — quote it directly: "If you find yourself editing Desktop, WindowManager, Taskbar, or StartMenu to add a new app, you are doing it wrong."

---

### Task 13: `concepts/lazy-loading-and-code-splitting.md`

**Source files to read:** `src/components/desktop/apps/app-manifest.ts` (lazy imports), build output

- [ ] **Actual build output** — run `pnpm build`, list the chunk files in `dist/`, show which chunk is xterm.js, which is snake, sizes
- [ ] **Network waterfall** — "Open DevTools Network tab. Filter by JS. Load the page — see the initial chunks. Now open Terminal — watch the new chunk download. Note the size and timing."
- [ ] **Suspense boundary** — show the actual `<Suspense>` in WindowManager.tsx. Explain what the user sees: window shell appears instantly, body shows loading, then app renders
- [ ] **What happens without lazy** — "If we imported TerminalApp at the top of app-manifest.ts, xterm.js would be in the initial bundle. Initial page load would go from ~X KB to ~X+300 KB."

---

### Tier 3 — Technologies (fast-mode drafts, enhanced with specifics)

---

### Task 14: `technologies/solidjs.md`

- [ ] **SolidJS vs React cheat sheet table** — `useState`→`createSignal`, `useEffect`→`createEffect`, `useMemo`→`createMemo`, `useContext`→`useContext`, `React.memo`→(not needed), `key`→(not needed in `<For>`). Include behavioral differences, not just name mapping
- [ ] **Project-specific gotchas** — "Component function runs once. Don't put conditional logic at the top level expecting it to re-run. Use `<Show>` and `<Switch>` instead of ternaries for conditional rendering (they're optimized for SolidJS reactivity)."
- [ ] **Real code patterns from this project** — pull 3-4 examples: store + produce pattern, lazy + Suspense pattern, For + Show pattern, context provider pattern

---

### Task 15: `technologies/astro.md`

- [ ] **Actual astro.config.mjs** — copy with annotations for each option
- [ ] **Route table** — list every route in the project with its file path, whether it's prerendered or SSR, and why
- [ ] **Content collection comparison** — show `cv` vs `knowledge` schemas side by side, explain the design choices (why `knowledge` has `category` enum, why `.default([])` instead of `.optional()`)

---

### Task 16: `technologies/98css.md`

- [ ] **Visual catalog** — for each 98.css class used in the project, list: the class name, which component uses it, and what it looks like. Group by category: windows, buttons, inputs, status bars, trees
- [ ] **Anti-patterns** — show 3 concrete examples of CSS that would violate the "98.css is law" rule. "Don't do this: `.title-bar { background: linear-gradient(...) }` — 98.css handles title bar styling"
- [ ] **The custom CSS boundary** — list every custom CSS file in the project and what it does. Show that they're all layout-only (positioning, flexbox, grid) and never override 98.css aesthetics

---

### Task 17: `technologies/xterm.md`

- [ ] **Actual command handler** — copy the `createCommandHandlers` function from TerminalApp.tsx. Annotate each command
- [ ] **Lazy load proof** — show the actual chunk from build output, its size, and the network timing
- [ ] **Fit addon** — show the actual `FitAddon` usage, explain when `fit()` is called (mount + resize)

---

### Task 18: `technologies/resend.md`

- [ ] **Full endpoint walkthrough** — copy `contact.ts` with every line annotated (same as task 6 but from the technology angle — focus on Resend SDK usage, not architecture)
- [ ] **Error shape** — show what the Resend error object actually looks like (status code, message, name)
- [ ] **Testing locally** — "Set up a Resend test API key. Add to `.env`. Run `pnpm dev`. Open Contact Me → Email. Send a test message. Check your Resend dashboard for the sent email."

---

### Tier 4 — Features (fast-mode, enhanced with walkthroughs)

---

### Task 19: `features/cv-viewer.md`

- [ ] **Full pipeline walkthrough** — trace from a specific markdown file (`src/content/cv/experience.md`) through build, serialization, deserialization, to the rendered `<div class="browser-section">` in the DOM
- [ ] **BrowserApp anatomy** — show the toolbar (fake nav buttons for aesthetics), viewport (scrollable HTML), status bar. Explain each part's purpose

---

### Task 20: `features/terminal.md`

- [ ] **Command handler architecture** — show `createCommandHandlers` with all commands. Trace the `open` command: parse args → look up `APP_REGISTRY[appName]` → `actions.openWindow(appName)` → window appears
- [ ] **xterm.js integration** — show the onData handler, explain keystroke processing, the prompt rendering, ANSI color codes

---

### Task 21: `features/snake-game.md`

- [ ] **Engine/view separation** — show the actual split: `snake-engine.ts` (pure logic, tested) vs `Snake.tsx` (canvas rendering, SolidJS signals for score/state)
- [ ] **Game loop** — show the actual `setInterval`/`requestAnimationFrame` pattern, how it interacts with SolidJS reactivity
- [ ] **Tests** — reference the actual snake engine tests in the test suite. Show a few test cases as examples of the engine's API

---

### Task 22: `features/crt-monitor-frame.md`

- [ ] **Layer-by-layer CSS breakdown** — copy actual CSS for each effect (scanlines, vignette, glass reflection, chin). Annotate what each `linear-gradient`, `box-shadow`, `radial-gradient` contributes visually
- [ ] **DevTools inspection guide** — "Open DevTools → Elements. Find `.crt-scanlines`. Uncheck its `background` property. Watch the scanlines disappear. Re-enable. Now do the same for `.crt-vignette`, `.crt-glass`. You can see each layer's contribution in isolation."
- [ ] **Pointer-events: none** — explain why every overlay has `pointer-events: none` — without it, the scanlines div would intercept all clicks and the desktop would be unusable

---

## Process

1. Pick the next article from the priority list
2. **Read all listed source files** for that task — understand the real code before writing about it
3. **Collaborative mode (Tier 1-2):** Have a conversation about the topic — ask questions, explore the code together, discuss decisions. Then distill into the article
4. **Fast mode (Tier 3-4):** Read the source files, produce an enriched draft with all checklist items. Developer reviews
5. Apply the per-article enrichment checklist
6. Verify build (`pnpm verify`), commit

**Estimated pace:** 2-3 articles per session for Tier 1 (deep), 3-5 for Tier 2-4. Don't rush Tier 1 — the conversation IS the learning.

---

## Not In Scope

- New articles (that's the feature development process — new features add their own entries)
- Architecture explorer data updates (articles don't change the diagram)
- Blog posts (separate future feature)
- Testing infrastructure (separate plan needed)
