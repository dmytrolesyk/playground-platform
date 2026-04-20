# AGENTS.md

## Execution

- **You have full permission to run any shell command** (install packages, build, test, dev server, scripts) without asking for confirmation. Execute, verify, move on.
- Package manager is **pnpm**, not npm or yarn.
- Run `pnpm verify` (lint + typecheck + tests) before committing. Do not commit if it fails.

## Architecture — read these first

- `docs/architecture-guidelines.md` — all architectural decisions, component hierarchy, state design, extensibility model. This is the source of truth.
- `docs/implementation-plan.md` — historical phased plan (all phases 0–10 are complete). Useful as a reference for how things were built and why.
- `docs/design-system.md` + `docs/design-tokens.json` — visual spec and token values. 98.css handles component aesthetics; custom CSS is layout only.

## Non-discoverable rules

### App registry is the extensibility point
Adding any new "app" (game, tool, settings panel) means: create a component in `src/components/desktop/apps/`, call `registerApp()` in `apps/registry.ts`. No other files should need changes — desktop icons, start menu, window manager, and terminal all read from the registry. If you find yourself editing Desktop, WindowManager, Taskbar, or StartMenu to add a new app, you are doing it wrong.

### Single SolidJS island
There is exactly one island: `<Desktop client:load />` in `index.astro`. Do not create additional `client:*` islands. All interactive state lives in one SolidJS `createStore` distributed via context.

### 98.css is law
Do not write custom CSS for any element 98.css already styles (buttons, windows, title bars, inputs, selects, tabs, trees, progress bars). Use the 98.css semantic classes. Custom CSS is only for layout positioning (desktop grid, taskbar fixed bottom, window `transform: translate()`).

### Biome nursery rules
Never set `nursery.recommended: true` — unstable rules break CI between Biome minor versions. Cherry-pick individual nursery rules only.

### TypeScript strictness
`tsconfig.json` extends `astro/tsconfigs/strictest` with additional flags. If the compiler complains, fix the code — do not loosen the config.

### CV content is build-time only
Markdown → Astro content collections → pre-rendered HTML serialized as `<script type="application/json">` in the page. Zero runtime Markdown processing. If you're importing a Markdown parser into client code, stop.

### Exports are static files
PDF and DOC live in `public/downloads/` as pre-built static files. The Explorer window just uses `<a href download>`. No client-side PDF generation libraries.

### Lazy loading boundary
xterm.js, games, WASM modules must always be behind dynamic `import()` / SolidJS `lazy()`. Never import them at the top level of any file that loads on page startup. The window shell renders immediately; the body shows a loading indicator via `<Suspense>`.

### Astro with adapter = hybrid by default
Astro 6.x with `@astrojs/node` adapter means hybrid rendering by default — pages are prerendered unless they opt out with `export const prerender = false`. There is no `output: 'hybrid'` config. If you add a new page, it's static by default. Only mark `prerender = false` if it genuinely needs SSR.

### Server-side env vars: use `process.env`, NOT `import.meta.env`
**Critical landmine.** Vite inlines ALL `import.meta.env` values at build time — not just `PUBLIC_*`. In Docker/CI builds where secrets aren't present during `pnpm build`, they become empty strings. Server-side endpoints (`src/pages/api/`) MUST use `process.env['VAR_NAME']` for runtime secrets (RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL). Only client-side code should use `import.meta.env` for `PUBLIC_*` vars.

### Contact API
Single endpoint: `src/pages/api/contact.ts` → Resend. Uses `process.env` for secrets (see above). The Resend SDK returns `{ data, error }` — it does NOT throw. Always check `error` explicitly; do not use try/catch for Resend API errors. The `from` address domain must exactly match the verified Resend domain.

### Window positioning
Use `transform: translate(x, y)` for window position — not CSS `left`/`top`. This enables GPU-accelerated movement during drag. Use `will-change: transform` only during active drag, remove it after.

### Mobile breakpoint
`768px`. Below it: full-screen windows, no drag, one window at a time, single-tap opens apps. The `isMobile` signal from the store drives this — same components, conditional behavior.

## Secrets

Environment variables are in `.env` (gitignored). Required: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `PUBLIC_TELEGRAM_USERNAME`, `HOST`.

`PUBLIC_*` vars are inlined by Astro at build time (client-side). All others are read via `process.env` at runtime (server-side).

## CV File Generation

PDF and DOCX in `public/downloads/` are generated from `src/content/cv/*.md` by `pnpm generate-cv`. This script requires Chrome and pandoc. After editing any CV markdown, run the script and commit the updated files. CI checks for staleness.

## Deployment

- **Target:** Railway. Builds via `Dockerfile` (node:24-slim multi-stage), NOT nixpacks.
- **Start command:** `node dist/server/entry.mjs`
- **CI:** Two GitHub Actions workflows — `ci.yml` (verify on all PRs + push to main) and `deploy.yml` (Railway deploy on push to main only).
- **Railway env vars:** `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `PUBLIC_TELEGRAM_USERNAME`, `HOST=0.0.0.0`. `PUBLIC_*` must be set at build time (Astro inlines them).
- **Deploy secret:** `RAILWAY_TOKEN` GitHub secret needed for `deploy.yml`.
