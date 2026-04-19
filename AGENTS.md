# AGENTS.md

## Execution

- **You have full permission to run any shell command** (install packages, build, test, dev server, scripts) without asking for confirmation. Execute, verify, move on.
- Package manager is **pnpm**, not npm or yarn. `pnpm add`, `pnpm build`, `pnpm dev`, `pnpm dlx` for one-off tools.
- After every phase: run `pnpm verify` (lint + typecheck + tests). Do not proceed to the next phase if it fails.

## Architecture — read these first

- `docs/architecture-guidelines.md` — all architectural decisions, component hierarchy, state design, extensibility model. This is the source of truth.
- `docs/implementation-plan.md` — phased plan with exact tasks, files, and commands. Follow it step by step.
- `docs/design-system.md` + `docs/design-tokens.json` — visual spec and token values. 98.css handles component aesthetics; custom CSS is layout only.

## Non-discoverable rules

### App registry is the extensibility point
Adding any new "app" (game, tool, settings panel) means: create a component in `src/components/desktop/apps/`, call `registerApp()` in `apps/registry.ts`. No other files should need changes — desktop icons, start menu, window manager, and terminal all read from the registry. If you find yourself editing Desktop, WindowManager, Taskbar, or StartMenu to add a new app, you are doing it wrong.

### Single SolidJS island
There is exactly one island: `<Desktop client:load />` in `index.astro`. Do not create additional `client:*` islands. All interactive state lives in one SolidJS `createStore` distributed via context.

### 98.css is law
Do not write custom CSS for any element 98.css already styles (buttons, windows, title bars, inputs, selects, tabs, trees, progress bars). Use the 98.css semantic classes. Custom CSS is only for layout positioning (desktop grid, taskbar fixed bottom, window `transform: translate()`).

### Linting and formatting
Biome handles linting, formatting, and import sorting. Config is in `biome.json` at the repo root. Strictest practical config: `recommended: true` globally, plus ~20 additional non-recommended rules set to `error`. Nursery rules are cherry-picked individually — never set `nursery.recommended: true` (unstable rules break CI between Biome minor versions). Key overrides: `noDefaultExport: off` (Astro needs default exports), `noReactSpecificProps: off` (SolidJS JSX), `noNodejsModules: off` (API routes). Run `pnpm lint` to check, `pnpm lint:fix` to auto-fix.

### TypeScript strictness
`tsconfig.json` extends `astro/tsconfigs/strictest` plus additional flags (`noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, etc.). If the compiler complains, fix the code — do not loosen the config.

### CV content is build-time only
Markdown → Astro content collections → pre-rendered HTML serialized as `<script type="application/json">` in the page. Zero runtime Markdown processing. If you're importing a Markdown parser into client code, stop.

### Exports are static files
PDF and DOC live in `public/downloads/` as pre-built static files. The Explorer window just uses `<a href download>`. No client-side PDF generation libraries.

### Lazy loading boundary
xterm.js, games, WASM modules must always be behind dynamic `import()` / SolidJS `lazy()`. Never import them at the top level of any file that loads on page startup. The window shell renders immediately; the body shows a loading indicator via `<Suspense>`.

### Astro hybrid mode
`output: 'hybrid'` — the index page is prerendered (static). Only `/api/contact` runs server-side. If you add a new page, mark it `export const prerender = true` unless it genuinely needs SSR.

### Contact API
Single endpoint: `src/pages/api/contact.ts` → Resend. The Resend SDK returns `{ data, error }` — it does NOT throw. Always check `error` explicitly; do not use try/catch for Resend API errors. The `from` address domain must exactly match the verified Resend domain.

### Window positioning
Use `transform: translate(x, y)` for window position — not CSS `left`/`top`. This enables GPU-accelerated movement during drag. Use `will-change: transform` only during active drag, remove it after.

### Mobile breakpoint
`768px`. Below it: full-screen windows, no drag, one window at a time, single-tap opens apps. The `isMobile` signal from the store drives this — same components, conditional behavior.

## Required skills per phase

The implementation plan (`docs/implementation-plan.md`) has a "Required Skills Reference" table at the top and skill callouts on every phase header. Load the listed skills before starting each phase.

## Secrets

Environment variables are in `.env` (gitignored). See Task 0.0 in the implementation plan for the full list: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `TELEGRAM_USERNAME`, `HOST`.
