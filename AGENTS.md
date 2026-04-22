# AGENTS.md

## Execution

- **You have full permission to run any shell command** (install packages, build, test, dev server, scripts) without asking for confirmation. Execute, verify, move on.
- Package manager is **pnpm**, not npm or yarn.
- Run `pnpm verify` (lint + typecheck + unit tests) before committing. Do not commit if it fails.
- Run `pnpm test:e2e` before opening a PR for any feature that touches UI, styling, or interaction behavior. E2E tests run against a production build and catch hydration mismatches, responsive breakage, and visual regressions that unit tests cannot.

## Architecture — read these first

- `docs/architecture-guidelines.md` — all architectural decisions, component hierarchy, state design, extensibility model. This is the source of truth.
- `docs/feature-development.md` — the process for designing and building new features. Read before starting any feature work.
- `docs/features/` — one design doc per feature. Each feature is designed, planned, and tracked in its own file.
- `docs/design-system.md` + `docs/design-tokens.json` — visual spec and token values. 98.css handles component aesthetics; custom CSS is layout only.

## Non-discoverable rules

### Testing — two tiers, both mandatory
The project has two separate test suites. Both must pass before merging.

- **`pnpm verify`** runs lint, typecheck, vitest, and the knowledge audit. Use for pure functions, engines, API handlers, and knowledge graph integrity.
- **`pnpm verify:knowledge`** runs only the executable knowledge audit. Run it directly after changing `src/content/knowledge/**`, `src/content/knowledge/modules.ts`, `architecture-data.ts`, or knowledge process docs.
- **`pnpm test:e2e`** runs Playwright against a production build. Use for UI, interaction, hydration, responsive, and visual regression tests. Tests live in `tests/e2e/`.
- **`pnpm test:e2e:update`** regenerates visual regression reference screenshots. Run this when UI changes intentionally, inspect the new screenshots, then commit them.
- **Bug fixes start with a failing test.** Pick the right tier: vitest for logic bugs, Playwright for UI/interaction bugs. Write the test, watch it fail, fix the bug, watch it pass.
- E2E tests run in two viewports (desktop 1280×720, mobile 375×812). Tests that only apply to one viewport skip on the other.
- Visual regression snapshots are platform-specific (darwin/linux) and committed to git. CI uses Linux snapshots.
- To regenerate Linux visual snapshots from CI for same-repo PRs, add the `update snapshots` label. The label-gated job runs `pnpm test:e2e:update` on Ubuntu and commits changed Linux snapshots back to the PR branch.
- `tests/e2e/` is excluded from vitest. Do not put vitest tests there.

### Feature development process
Every new feature follows: branch (`feat/<name>`) → design doc (`docs/features/<name>.md`) → implement with TDD → finalize (update docs, PR). Read `docs/feature-development.md` for the full process. Do not skip the design doc, even for simple features.

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

### Knowledge base content collection
Learning content lives in `src/content/knowledge/` as Markdown with Zod-validated frontmatter (category, relatedConcepts, relatedFiles, technologies, externalReferences, diagramRef, prerequisites, learningObjectives, exercises, estimatedMinutes, module, moduleOrder). Six directories: `architecture/`, `concepts/`, `technologies/`, `features/`, `cs-fundamentals/`, `labs/`. Every new feature must include knowledge entries in its feature doc. The Architecture Explorer data in `architecture-data.ts` is a renderer-agnostic graph contract — keep node ids stable, keep edges valid, and update nodes/edges when adding apps or changing architecture.

### Knowledge base is a learning system, not documentation
The knowledge base exists to make the human developer a rockstar engineer — not to document the codebase. Every article must include `learningObjectives` (what you should be able to DO after reading), `exercises` (2-4 per article with answers, at least one `predict` or `do` type), `prerequisites` (which articles to read first), and `estimatedMinutes`. Articles are grouped into curriculum modules via the `module` frontmatter field. Labs (`labs/` directory, `category: lab`) are hands-on guided experiments. CS fundamentals (`cs-fundamentals` category) cover foundational CS concepts grounded in THIS codebase. See `docs/features/knowledge-base.md` for the canonical active system design.

### Staged mastery progress
`src/scripts/learn-progress.ts` is the canonical progress module. Progress is local-only in `localStorage` under `kb-learning-progress` and has four stages: `read`, `checked`, `practiced`, `mastered`. Do not reintroduce a binary completed-only model. `/learn` pages must remain fully readable without JavaScript; progress controls are progressive enhancement.

### Knowledge article quality bar
All knowledge articles must meet the canonical standards in `docs/features/knowledge-base.md`. Key requirements: open with motivation (not definition), ≥1 Mermaid diagram, reference actual source files, connect to broader CS concepts, include edge cases/gotchas, 3–6 external references with diverse types, meet minimum word counts (architecture: 1500–2500, concepts: 1000–1800, technologies: 800–1400, features: 600–1000, cs-fundamentals: 1000-1800, labs: 800-1500). Additionally: 2-4 exercises per article, learning objectives, prerequisites, module assignment, estimated reading time. Never create shallow placeholder articles — every article must teach something a working engineer would find valuable.

### Knowledge expansion is mandatory for every feature
Every new feature must produce knowledge content proportional to its complexity. Minimum: 1 feature article + exercises + architecture explorer update. Medium features add technology articles + 1 lab. Complex features add CS fundamentals articles + concept articles + 1-2 labs + a new curriculum module. See `docs/feature-development.md` Phase 3 and the Knowledge Expansion section in the feature doc template for the full checklist. The feature is not complete until its knowledge expansion is done and `pnpm verify:knowledge` passes.

### Knowledge e2e expectations
Run `pnpm test:e2e` before opening a PR for any change that touches `/learn`, `LearnLayout.astro`, `learn-progress.ts`, Library iframe behavior, Architecture Explorer graph/navigation, or knowledge visual styling. Update snapshots with `pnpm test:e2e:update` only for intentional visual changes and inspect the new images before committing.

### Knowledge article research process
Articles are written by AI agents, but must be grounded in thorough research — not generated from training data alone. Before writing or enriching any article, the agent must: (1) **read the actual source code** referenced in `relatedFiles` and understand the real implementation, not assumed patterns; (2) **consult official documentation** for every technology mentioned — read the docs pages, not just recall them; (3) **search the web** for authoritative explanations, talks, and blog posts to verify claims and find the best external references; (4) **analyze the codebase architecture** by reading `docs/architecture-guidelines.md`, related feature docs, and tracing actual data flows through the code; (5) **synthesize across sources** — cross-reference documentation, source code, and external resources to produce accurate, nuanced explanations. Do not write from memory. Every factual claim should be verifiable against docs or source code. If you're unsure about a detail, look it up.

### Knowledge exercise and lab creation
Exercises must test real understanding, not recall. Prefer `predict` ("What will happen if...") and `do` ("Open DevTools and...") types over `explain`. Answers must be thorough explanations, not yes/no. Labs must include exact setup instructions (git branch, files to create), a DO → OBSERVE → EXPLAIN structure for each experiment, and cleanup steps. Labs must link back to ≥2 theory articles. Every exercise and lab must be something the developer can actually perform in this codebase or browser.

## Secrets

Environment variables are in `.env` (gitignored). Required: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `PUBLIC_TELEGRAM_USERNAME`, `HOST`.

`PUBLIC_*` vars are inlined by Astro at build time (client-side). All others are read via `process.env` at runtime (server-side).

## CV File Generation

PDF and DOCX in `public/downloads/` are generated from `src/content/cv/*.md` by `pnpm generate-cv`. This script requires Chrome and pandoc. CI auto-regenerates and commits updated files on push to main (via the `cv-generate` job). You can also run `pnpm generate-cv` locally to preview changes.

## Deployment

- **Target:** Railway. Builds via `Dockerfile` (node:24-slim multi-stage), NOT nixpacks.
- **Start command:** `node dist/server/entry.mjs`
- **CI:** Single `ci.yml` workflow with four jobs: `verify` (lint + typecheck + unit tests + build, runs on all PRs and main push), `e2e` (Playwright E2E tests against production build, runs after verify on all PRs and main push), `cv-generate` (regenerates CV files and auto-commits if changed, main only, after verify), `deploy` (Railway deploy, main only, after verify + e2e + cv-generate).
- **Branch protection:** main branch is protected — PRs only, merge blocked until `verify` and `e2e` pass.
- **Railway env vars:** `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `PUBLIC_TELEGRAM_USERNAME`, `HOST=0.0.0.0`. `PUBLIC_*` must be set at build time (Astro inlines them). `PUBLIC_*` vars need `ARG` + `ENV` in the Dockerfile to be available during Docker build.
- **Deploy secret:** `RAILWAY_TOKEN` GitHub secret needed for deploy job.
