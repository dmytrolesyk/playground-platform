# Feature 12e: First Content — "Build a Tiny App Framework"

## Goal

Create the first project-lab: a 4-phase guided rebuild of a simplified version of the playground-platform's desktop framework. This validates the format, populates the knowledge graph, and serves as the template for future project-labs.

## Depends On

Features 12a (schema), 12b (rendering), 12c (progress), 12d (audit rules).

## Applicable Skills

- `astro` — verify rendering works with real content
- `web-design-guidelines` — review the rendered output

## Content Design

### Target System

The playground-platform's own desktop framework:
- `src/components/desktop/store/desktop-store.ts` (reactive store)
- `src/components/desktop/apps/registry.ts` (app registry)
- `src/components/desktop/WindowManager.tsx` (window rendering)
- `src/components/desktop/Desktop.tsx` (root composition)

### Simplification Scope

**Included:** SolidJS `createStore` for window state, `registerApp()` pattern for extensibility, basic window rendering with positioning, opening/closing windows.

**Excluded (and why):**
- Drag handling — requires pointer events, capture, transform optimization. Adds complexity without teaching registry/store concepts.
- Taskbar — purely presentational, no architectural insight.
- Start menu — same as taskbar.
- Lazy loading — important but orthogonal to the store/registry/window triad.
- Maximize/minimize — state extensions that add complexity without teaching new patterns.
- Mobile responsive — conditional behavior that deserves its own study.

### Phase Outline

#### Phase 1: The Reactive Store (~60 min)

**Build Objective:** Create a SolidJS store that holds window state and supports adding/removing/focusing windows.

**Real System Comparison:** In the real system, this is `desktop-store.ts` with `DesktopStore` interface. Our version has the same shape but fewer fields (no `startMenuOpen`, no `selectedDesktopIcon`) and only 3 actions (open, close, focus) instead of 8+.

**Steps (3-4):**
1. DO: Create `store.ts` with `createStore` and the `WindowState` interface (id, title, x, y, width, height, zIndex). OBSERVE: Create a test that adds a window and reads it back. EXPLAIN: SolidJS `createStore` wraps objects in Proxies for fine-grained tracking.
2. DO: Add `openWindow(app)` and `closeWindow(id)` actions. OBSERVE: Open two windows, close one, verify the store state. EXPLAIN: Store actions are just functions that call `setState` — no event system, no reducers.
3. DO: Add `focusWindow(id)` that increments `nextZIndex`. OBSERVE: Open three windows, focus the first — verify its zIndex is now highest. EXPLAIN: Z-index stacking without re-sorting uses a monotonically increasing counter.
4. Checkpoint: Run test suite. All 3 windows can be opened, one can be focused to top, one can be closed.

**Concepts linked:** `concepts/fine-grained-reactivity`, `architecture/state-management`

#### Phase 2: The App Registry (~60 min)

**Build Objective:** Create an app registry where apps register themselves and are discoverable by ID.

**Real System Comparison:** In the real system, this is `registry.ts` with `APP_REGISTRY` and `registerApp()`. Our version has the same API but fewer fields per entry (no `startMenuCategory`, no `captureKeyboard`).

**Steps (3):**
1. DO: Create `registry.ts` with `AppRegistryEntry` interface and `registerApp()` function. OBSERVE: Register two apps, iterate the registry. EXPLAIN: The registry is an inversion-of-control pattern — apps register themselves instead of being enumerated by a central config.
2. DO: Create two dummy app components that call `registerApp()` at module scope. OBSERVE: Import both app files, then read the registry — both apps appear. EXPLAIN: Module-scope side effects ensure registration happens on import. This is the "no switch statements" extensibility model.
3. DO: Connect registry to store — `openWindow()` now looks up the app in the registry for default size and title. OBSERVE: Open an app by ID — it gets the registered title and dimensions. EXPLAIN: The store consumes registry metadata, but doesn't depend on specific apps.

**Concepts linked:** `architecture/app-registry`, `concepts/inversion-of-control`

#### Phase 3: The Window Manager (~75 min)

**Build Objective:** Create a component that renders open windows from the store, with correct positioning and z-index stacking.

**Real System Comparison:** In the real system, this is `WindowManager.tsx` + `Window.tsx`. Our version renders windows but doesn't support drag, resize, or minimize.

**Steps (4):**
1. DO: Create `Window.tsx` — a component that renders a 98.css `.window` with title bar and body, positioned via `transform: translate(x, y)`. OBSERVE: Hard-code one window's state, render it, verify positioning. EXPLAIN: `transform: translate` uses the GPU compositor layer, avoiding layout recalculation.
2. DO: Create `WindowManager.tsx` — iterates `store.windows`, renders a `<Window>` for each. OBSERVE: Open two apps via the store, see two windows appear with cascaded positioning. EXPLAIN: SolidJS's `<For>` component efficiently tracks keyed lists without re-rendering unchanged windows.
3. DO: Add close button to title bar that calls `closeWindow(id)`. OBSERVE: Click close — window disappears, store updated. EXPLAIN: The component doesn't manage its own lifecycle — the store is the single source of truth.
4. DO: Add click-to-focus — clicking a window calls `focusWindow(id)`, updating its z-index. OBSERVE: Click the back window — it comes to front. EXPLAIN: Z-index ordering without array re-sorting is O(1).

**Concepts linked:** `architecture/window-manager`, `concepts/compositor-pattern`, `concepts/pointer-events-and-capture`

#### Phase 4: Wiring It All Together (~60 min)

**Build Objective:** Create a desktop with icon grid that opens apps on double-click, demonstrating the full store → registry → window manager flow.

**Real System Comparison:** In the real system, this is `Desktop.tsx` with `DesktopIconGrid`. Our version has the same data flow but no taskbar, no start menu, and no mobile behavior.

**Steps (3):**
1. DO: Create `Desktop.tsx` that provides store via SolidJS context, renders icon grid + window manager. OBSERVE: The desktop renders, icons appear from registry, double-click opens windows. EXPLAIN: Context avoids prop drilling — any component in the tree can access the store.
2. DO: Add singleton behavior — if an app is already open, focus it instead of opening a new instance. OBSERVE: Double-click the same icon twice — no duplicate window, existing one focuses. EXPLAIN: Singleton check is a store query, not a registry concern. The registry declares intent (`singleton: true`), the store enforces it.
3. DO: Create a third app (a simple "About" dialog) and register it. Verify it appears on the desktop automatically. OBSERVE: No changes to Desktop, WindowManager, or any existing component — the new app just works. EXPLAIN: This is the proof of the registry pattern. The AGENTS.md claim is true: adding an app requires one file + one `registerApp()` call.

**Concepts linked:** `concepts/inversion-of-control`, `concepts/observer-pattern`, `architecture/app-registry`

## Content Quality

### Research Mandate: Lighter for Own Codebase

The standard AGENTS.md research mandate (find 3-5 external sources, inline citations, etc.) applies fully to project-labs targeting **unfamiliar** systems (Three.js, WebRTC, etc.). For the "Tiny App Framework" which targets **this repository's own codebase**, the research mandate is lighter:

- The agent reads actual source files directly (`desktop-store.ts`, `registry.ts`, etc.) — no web research needed for understanding the target
- External references are optional (SolidJS docs for `createStore` API, 98.css docs for window styling)
- Inline citation density rule is already waived for phase files (see 12d audit rules)

This significantly reduces token cost for the first project-lab.

### Recommended Workflow for Future Project-Labs (Unfamiliar Tech)

For project-labs on technologies the developer doesn't already know (Three.js, WebRTC, em-dosbox):

1. **Do Phase 1 yourself manually.** Actually build the TCP echo server or the Three.js triangle. Learn by doing.
2. **Have the agent write up what you did** as a structured project-lab phase. The agent becomes your technical writer, grounding content in your real code.
3. **Iterate:** The agent researches the target system's docs and source code to write the `realSystemComparison` sections and find external references.
4. **Review by doing:** Follow your own guide to verify it's followable.

This produces the highest-quality content at the lowest token cost — the developer learns by building, and the agent learns from the developer's actual code.

Each phase:
- Opens with motivation (why this phase matters)
- Has 3-4 steps with DO/OBSERVE/EXPLAIN
- Includes at least 1 human-readable checkpoint
- Includes at least 1 copyable test snippet
- Links to 2-3 knowledge graph concepts
- Includes `realSystemComparison` with specific file references
- Has `learningObjectives` (2-3 per phase)
- Has `prerequisites` linking to relevant theory articles

The index:
- Has `simplificationScope` with explicit inclusion/exclusion list
- Has `designRationale` explaining why this scope was chosen
- References all 4 phases in `projectLabPhases`
- Has `totalEstimatedHours: 5`

### Estimated Word Counts

| File | Target Words |
|------|-------------|
| Index | 800-1200 |
| Phase 1 | 1000-1500 |
| Phase 2 | 1000-1500 |
| Phase 3 | 1200-1700 |
| Phase 4 | 1000-1500 |
| **Total** | **5000-7400** |

## Files to Create

- `src/content/knowledge/labs/tiny-app-framework-index.md`
- `src/content/knowledge/labs/tiny-app-framework-phase-01-store.md`
- `src/content/knowledge/labs/tiny-app-framework-phase-02-registry.md`
- `src/content/knowledge/labs/tiny-app-framework-phase-03-windows.md`
- `src/content/knowledge/labs/tiny-app-framework-phase-04-integration.md`

## Acceptance Criteria

- [ ] 5 files created (1 index + 4 phases)
- [ ] All files pass Zod schema validation
- [ ] `pnpm verify:knowledge` passes (all audit rules, including new project-lab rules)
- [ ] Index page renders with phase list and metadata
- [ ] Each phase page renders with DO/OBSERVE/EXPLAIN steps
- [ ] Phase navigation works (prev/next between phases)
- [ ] Collapsible OBSERVE/EXPLAIN sections work
- [ ] Each phase links to real source files in this repo
- [ ] Each phase has human-readable checkpoint(s)
- [ ] `pnpm build` succeeds
- [ ] Content is followable — a developer who has read the prerequisite articles can complete each phase
