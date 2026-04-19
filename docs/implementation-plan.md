# Implementation Plan — Retro CV Website

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Execution permissions:** You have full permission to run any shell command (install packages, run builds, run tests, start dev servers, execute scripts, etc.) without asking the user first. Do not pause to request confirmation before running commands. Execute the plan step by step, verify results, and move on.

**Goal:** Build a Windows 95/98-themed CV/portfolio website with Astro + SolidJS + 98.css.

**Architecture:** Single Astro page with one SolidJS island for all desktop interactivity. CV content from Markdown content collections. Static exports. Resend for contact. See `docs/architecture-guidelines.md` for full design.

**Tech Stack:** Astro (hybrid mode), SolidJS, 98.css, Resend, vanilla CSS. **Package manager: pnpm** (not npm/yarn).

---

## Required Skills Reference

The following skills **MUST** be loaded and followed when working on the corresponding areas of this plan. Load each skill before starting the relevant phase or task — do not skip them even when the task seems simple.

| Skill | When to Use | Applies to Phases |
|---|---|---|
| **`astro`** | All Astro page/layout/config/content-collection work. Load before any `.astro` file creation or modification, SSR adapter config, content collection schema, or build pipeline work. | 0, 2, 3, 6, 9 |
| **`executing-plans`** | The primary execution harness. Load at the **start of every session** to follow the checkpoint/commit rhythm defined in this plan. | All |
| **`resend`** | All Resend email integration — API route, SDK usage, webhook verification, idempotency keys. Contains critical gotchas that prevent production issues. Load before writing or touching `/api/contact`. | 4 |
| **`resend-cli`** | Testing and operating Resend from the terminal — sending test emails, verifying domain setup, managing API keys. Load before running any `resend` CLI command. | 4 |
| **`test-driven-development`** | Before writing **any** implementation code. Write the failing test first, then implement. Applies to store logic, API endpoints, component behavior, and content pipeline validation. | 1, 2, 4, 7 |
| **`web-design-guidelines`** | UI review checkpoints — audit against Web Interface Guidelines for accessibility, interaction patterns, and usability. Load during Phase 6 polish and after each visual component is built. | 1, 5, 6 |
| **`vercel-composition-patterns`** | When building or refactoring component APIs — compound components, context providers, render delegation. Applies to Window/TitleBar/WindowBody composition and app-slot patterns. Note: patterns are framework-agnostic principles; adapt React-specific examples to SolidJS equivalents. | 1, 2, 3, 4 |
| **`typescript-magician`** | When defining types, generics, or resolving TS compiler errors. Especially for `WindowState`, `AppType`, store types, API request/response schemas, and content collection type inference. | 0, 1, 4 |

### How to Apply Skills

1. **At session start:** Always load `executing-plans`.
2. **Before touching a file:** Check the table above. If the phase/task matches a skill, load it first.
3. **When multiple skills apply:** Load all of them. They don't conflict — e.g., building the Email app requires `resend` + `test-driven-development` + `vercel-composition-patterns` simultaneously.
4. **Adapt React → SolidJS:** The `vercel-composition-patterns` skill uses React examples. Apply the underlying principles (compound components, context providers, render delegation) using SolidJS equivalents. Do not install React.

---

## Phase Overview

| Phase | Scope | Risk | Effort | MVP? |
|---|---|---|---|---|
| **Phase 0** | Project scaffolding & tooling | Low | Small | ✅ |
| **Phase 1** | Desktop shell (icons, taskbar, window chrome) + app registry | Medium | Medium | ✅ |
| **Phase 2** | CV Browser app (Markdown → Netscape window) | Low | Medium | ✅ |
| **Phase 3** | Explorer app (export downloads) | Low | Small | ✅ |
| **Phase 4** | Email app (contact form + Resend) | Medium | Medium | ✅ |
| **Phase 5** | Mobile responsive degradation | Medium | Medium | ✅ |
| **Phase 6** | Polish, accessibility, performance | Low | Medium | ✅ |
| **Phase 7** | Terminal app (xterm.js) | Medium | Large | ❌ Nice-to-have |
| **Phase 8** | Retro games (90s Snake + WASM scaffold) | Low | Large | ❌ Nice-to-have |
| **Phase 9** | Automated PDF/DOC generation | Low | Medium | ❌ Nice-to-have |

---

## Phase 0: Project Scaffolding

> **Skills:** `astro`, `typescript-magician`, `resend-cli`, `use-railway`

**Goal:** Working Astro project with SolidJS integration, 98.css, and content collections configured. All external tokens and services verified before writing any code.

**Estimated time:** ~30 minutes

### Task 0.0: Pre-Flight — Verify All Tokens, Secrets & Services

Before writing a single line of code, confirm every external dependency is ready so that no implementation session is interrupted by missing credentials.

**Required secrets/config:**

| Variable | Value | Purpose |
|---|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxxx` | Sending email from `/api/contact` |
| `CONTACT_TO_EMAIL` | Your personal email | Where contact form submissions land |
| `CONTACT_FROM_EMAIL` | `noreply@cv.yourdomain.com` | "From" address (must match verified Resend domain) |
| `TELEGRAM_USERNAME` | Your Telegram handle (no `@`) | Contact link in EmailApp |
| `HOST` | `0.0.0.0` | Astro Node adapter on Railway |

**Not needed (and why):**
- No database credentials — fully static + one API route
- No auth tokens — no user authentication
- No `RESEND_WEBHOOK_SECRET` — we only send, never receive
- No Railway project token — manual `railway up` for now
- No S3/object storage — static files in `public/`

- [ ] **Step 1: Verify Railway CLI is authed**

```bash
railway whoami --json
```
Expected: JSON with your username and workspace.

- [ ] **Step 2: Verify you can see your existing Railway project**

```bash
railway project list --json
```
Expected: list includes your project. Note the project name/ID for later.

- [ ] **Step 3: Verify Resend CLI is installed**

```bash
resend --version
```
If not found:
```bash
pnpm add -g resend-cli
```

- [ ] **Step 4: Verify Resend API key works**

```bash
resend emails send \
  --from "noreply@cv.yourdomain.com" \
  --to delivered@resend.dev \
  --subject "Test from CV project" \
  --text "If you see this, Resend is ready." \
  --api-key re_xxxxxxxxx -q
```
Expected: `{"id": "..."}` — a successful send. If 403, domain is not verified (see next step).

- [ ] **Step 5: Verify sending domain is verified in Resend**

```bash
resend domains list --api-key re_xxxxxxxxx -q
```
Expected: your sending domain shows `status: "verified"`. If not:
```bash
resend domains get <domain-id> --api-key re_xxxxxxxxx -q
```
This shows the DNS records (SPF TXT, DKIM CNAMEs, optional DMARC TXT) you need to add. Add them, wait for propagation, then re-check.

- [ ] **Step 6: Create `.env` file with all secrets**

```bash
cat > .env << 'EOF'
RESEND_API_KEY=re_xxxxxxxxx
CONTACT_TO_EMAIL=your-email@domain.com
CONTACT_FROM_EMAIL=noreply@cv.yourdomain.com
TELEGRAM_USERNAME=yourusername
HOST=0.0.0.0
EOF
```

- [ ] **Step 7: Add `.env` to `.gitignore`**

```bash
echo ".env" >> .gitignore
```

- [ ] **Step 8: Commit .gitignore**

```bash
git add .gitignore
git commit -m "chore: add .gitignore with .env"
```

### Task 0.1: Initialize Astro Project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`

- [ ] **Step 1: Create Astro project**
```bash
pnpm create astro@latest . -- --template minimal --typescript strictest
```

Note: `--typescript strictest` gives us Astro's strictest base tsconfig.

- [ ] **Step 2: Install dependencies**
```bash
pnpm astro add solid-js
pnpm add 98.css
pnpm add @astrojs/node  # for hybrid SSR (contact API)
```

- [ ] **Step 3: Configure Astro for hybrid mode + SolidJS**

`astro.config.mjs`:
```javascript
import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import node from '@astrojs/node';

export default defineConfig({
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  integrations: [solidJs()],
});
```

- [ ] **Step 4: Verify dev server starts**
```bash
pnpm dev
```
Expected: Astro dev server running on localhost:4321

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "chore: initialize Astro project with SolidJS and 98.css"
```

### Task 0.2: Set Up Base Layout and Global Styles

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/styles/global.css`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create BaseLayout.astro**

Includes `<head>` with:
- 98.css import
- global.css import
- Meta tags, charset, viewport
- Retro favicon

- [ ] **Step 2: Create global.css**

Desktop background (`#008080`), full viewport, overflow hidden, optional cursor overrides. Reference `docs/design-tokens.json` for exact values.

- [ ] **Step 3: Create minimal index.astro**

Uses BaseLayout. Shows teal desktop background. Just a `<div>` with the desktop background. Placeholder text "Desktop".

- [ ] **Step 4: Verify teal desktop renders in browser**

```bash
pnpm dev
# Open http://localhost:4321 — should see teal background
```

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add base layout with 98.css and teal desktop background"
```

### Task 0.3: Set Up Content Collections for CV

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/cv/profile.md`
- Create: `src/content/cv/experience.md`
- Create: `src/content/cv/education.md`
- Create: `src/content/cv/skills.md`

- [ ] **Step 1: Create content collection schema**

`src/content/config.ts` — define `cv` collection with `title` (string), `order` (number) fields.

- [ ] **Step 2: Create placeholder CV Markdown files**

Each file has frontmatter (`title`, `order`) and placeholder content. Real content will be filled in later.

Example `profile.md`:
```markdown
---
title: "Profile"
order: 1
---

## Dmytro Lesyk

Software Engineer. [Placeholder summary.]
```

- [ ] **Step 3: Verify content collections build correctly**
```bash
pnpm build
```
Expected: No errors related to content collections.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: add CV content collections with placeholder Markdown"
```

### Task 0.4: Copy Icon Assets

**Files:**
- Move/copy: `assets/icons/*.png` → `src/assets/icons/`

- [ ] **Step 1: Copy icon files to src/assets/icons/**

```bash
mkdir -p src/assets/icons
cp assets/icons/*.png src/assets/icons/
```

- [ ] **Step 2: Verify icons are importable in Astro**

Quick test: add an `<img>` in `index.astro` importing one icon. Remove after verifying.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "chore: copy pixel art icons to src/assets"
```

### Task 0.5: Add Static Export Files

**Files:**
- Create: `public/downloads/cv.pdf` (placeholder or real)
- Create: `public/downloads/cv.docx` (placeholder or real)

- [ ] **Step 1: Create downloads directory and add files**

```bash
mkdir -p public/downloads
# Place your CV.pdf and CV.docx here
# If you don't have them yet, create placeholder text files:
echo "Placeholder PDF" > public/downloads/cv.pdf
echo "Placeholder DOC" > public/downloads/cv.docx
```

- [ ] **Step 2: Verify files are accessible**
```bash
pnpm dev
# Open http://localhost:4321/downloads/cv.pdf — should download
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "chore: add placeholder CV export files"
```

### Task 0.6: Set Up Biome and Harden tsconfig

**Files:**
- Create: `biome.json`
- Modify: `tsconfig.json`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Install Biome**
```bash
pnpm add -D @biomejs/biome
```

- [ ] **Step 2: Create `biome.json` with strictest config**

Biome v2 does not have an `"all": true` preset. The strictest approach is `"recommended": true` at the top level (enables all recommended rules across all groups), plus every non-recommended rule that adds value explicitly set to `"error"`. Nursery rules are cherry-picked individually — never use `nursery.recommended: true` because nursery rules are unstable and can change between minor Biome versions, breaking CI without code changes.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.12/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noDefaultExport": "off",
        "useFilenamingConvention": "off",
        "noImplicitBoolean": "error",
        "useConsistentBuiltinInstantiation": "error",
        "useForOf": "error",
        "useShorthandAssign": "error",
        "useThrowNewError": "error",
        "useThrowOnlyError": "error",
        "useExplicitLengthCheck": "error",
        "useCollapsedElseIf": "error",
        "useDefaultSwitchClause": "error"
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": "error",
        "noVoid": "error",
        "useSimplifiedLogicExpression": "error"
      },
      "correctness": {
        "noNodejsModules": "off",
        "noUndeclaredDependencies": "off",
        "useImportExtensions": "off"
      },
      "suspicious": {
        "noConsole": "warn",
        "noReactSpecificProps": "off",
        "noEvolvingTypes": "error",
        "useErrorMessage": "error"
      },
      "performance": {
        "noBarrelFile": "error",
        "noNamespaceImport": "error",
        "useTopLevelRegex": "error"
      },
      "nursery": {
        "useExplicitType": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  },
  "css": {
    "formatter": { "enabled": true },
    "linter": { "enabled": true }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

**Why these overrides:**
- `noDefaultExport: off` — Astro pages and layouts require default exports.
- `useFilenamingConvention: off` — SolidJS components use PascalCase `.tsx` files.
- `noNodejsModules: off` — API routes and build scripts use Node.js builtins.
- `noUndeclaredDependencies: off` — Astro virtual modules (`astro:content`) trigger false positives.
- `useImportExtensions: off` — Astro and SolidJS bundler handles extensions.
- `noReactSpecificProps: off` — SolidJS uses JSX with `class` not `className`, but biome may flag JSX patterns.
- `noConsole: warn` — Warn, not error. Useful during development, should be cleaned before release.

- [ ] **Step 3: Harden `tsconfig.json`**

Astro's `--typescript strictest` template already sets `"strict": true`. Add these additional flags for maximum strictness:

```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "jsxImportSource": "solid-js"
  }
}
```

Note: Check which flags Astro's `strictest` base already includes. Do not duplicate. Only add flags that are missing from the base.

- [ ] **Step 4: Add scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "astro check",
    "check": "biome check . && astro check",
    "test": "vitest run",
    "verify": "biome check . && astro check && vitest run"
  }
}
```

The `verify` command runs all three checks in sequence — lint, typecheck, tests. This is what gets run after every phase.

- [ ] **Step 5: Install vitest (for future tests)**
```bash
pnpm add -D vitest
```

- [ ] **Step 6: Run lint and typecheck to verify zero errors on empty project**
```bash
pnpm lint
pnpm typecheck
```
Expected: Both pass with zero errors.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "chore: add Biome linter (strict), harden tsconfig, add verify scripts"
```

---

## Phase 1: Desktop Shell

> **Skills:** `test-driven-development`, `typescript-magician`, `vercel-composition-patterns`, `web-design-guidelines`

**Goal:** Interactive desktop with draggable windows, taskbar, and desktop icons. The core window manager.

**Estimated time:** 2-3 hours (largest phase)

**Dependency:** Phase 0 complete.

### Task 1.1: Desktop Store, Types, and App Registry

**Files:**
- Create: `src/components/desktop/store/types.ts`
- Create: `src/components/desktop/store/desktop-store.ts`
- Create: `src/components/desktop/store/context.tsx`
- Create: `src/components/desktop/apps/registry.ts`

- [ ] **Step 1: Define types**

`types.ts`: `WindowState`, `DesktopStore`, and `AppRegistryEntry` interfaces as specified in architecture-guidelines.md § 6-8. Note: `WindowState.app` is a `string` (registry key), not a union type. `AppRegistryEntry` defines `id`, `title`, `icon`, `component`, `desktop`, `startMenu`, `startMenuCategory`, `singleton`, `defaultSize`, `defaultProps`.

- [ ] **Step 2: Create the app registry**

`registry.ts`: Export `APP_REGISTRY` (a `Record<string, AppRegistryEntry>`) and a `registerApp(entry)` function. This is the single extensibility point — all desktop icons, start menu items, and window resolution flow through this registry.

- [ ] **Step 3: Create store with actions**

`desktop-store.ts`: `createDesktopStore()` function that returns `[state, actions]`.

Actions:
- `openWindow(appId)` — looks up `APP_REGISTRY[appId]`, checks singleton, creates `WindowState` with title/icon/defaultSize from registry, assigns z-index, cascade position
- `closeWindow(id)` — remove window
- `focusWindow(id)` — update z-index
- `minimizeWindow(id)` — toggle isMinimized
- `maximizeWindow(id)` — toggle isMaximized, save/restore prevBounds
- `updateWindowPosition(id, x, y)` — for drag
- `toggleStartMenu()` — toggle boolean
- `selectDesktopIcon(id)` — set selected icon

- [ ] **Step 4: Create context provider**

`context.tsx`: `DesktopProvider` component + `useDesktop()` hook.

- [ ] **Step 5: Test store logic manually**

Create a simple test page that opens/closes/drags windows using the store. Verify state changes work correctly.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add desktop store with window manager actions"
```

### Task 1.2: Window Component (Draggable Container)

**Files:**
- Create: `src/components/desktop/Window.tsx`
- Create: `src/components/desktop/TitleBar.tsx`
- Create: `src/styles/window.css`

- [ ] **Step 1: Build TitleBar component**

Uses 98.css `.title-bar` classes. Includes:
- Icon + title text (`.title-bar-text`)
- Minimize, maximize, close buttons (`.title-bar-controls`)
- `onPointerDown` on the title bar element for drag initiation

- [ ] **Step 2: Build Window component**

Uses 98.css `.window` class. Includes:
- Absolute positioning via `transform: translate(x, y)` (not left/top — better for perf)
- `z-index` from store
- `display: none` when minimized
- Title bar + slotted body content (children/props)
- Click handler on window → `focusWindow(id)`
- Active/inactive title bar styling based on focus state

- [ ] **Step 3: Implement drag behavior**

Pointer event handlers on TitleBar:
- `onPointerDown` → record offset, setPointerCapture, focusWindow
- `onPointerMove` → calculate new position, clamp to viewport, `updateWindowPosition`
- `onPointerUp` → releasePointerCapture

- [ ] **Step 4: Create window.css**

Minimal CSS for:
- Window absolute positioning
- `will-change: transform` during drag
- Full-viewport maximize
- Transition for maximize/restore (subtle, optional)

- [ ] **Step 5: Test window rendering and drag**

In a temp test setup, render a Window with some placeholder content. Verify:
- Window appears with 98.css styling
- Drag works smoothly
- Minimize hides window
- Close removes window
- Click focuses (z-index changes)

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add draggable Window component with title bar controls"
```

### Task 1.3: Desktop Icons

**Files:**
- Create: `src/components/desktop/DesktopIconGrid.tsx`
- Create: `src/components/desktop/DesktopIcon.tsx`
- Create: `src/styles/desktop.css`

- [ ] **Step 1: Build DesktopIcon component**

Props: `id`, `icon` (image src), `label`, `appType`.
Behavior:
- Single click → select (blue highlight on label, per design-system.md § 4)
- Double click → call `openWindow(appType, label)`
- White label text, 32×32 icon above

- [ ] **Step 2: Build DesktopIconGrid component**

Renders icons in a vertical column (left side of screen, matching Win95 layout from inspiration images). Icons are driven by the registry:

```typescript
import { APP_REGISTRY } from '../apps/registry';

const desktopApps = () =>
  Object.values(APP_REGISTRY).filter(app => app.desktop);
```

No hardcoded icon list. Adding a new app with `desktop: true` in its `registerApp()` call makes it appear here automatically.

- [ ] **Step 3: Create desktop.css**

Icon grid layout, icon sizing (32×32), label styling (white text, blue highlight on select, white text shadow for readability).

- [ ] **Step 4: Click desktop background → deselect all icons**

Add handler on desktop area to clear `selectedDesktopIcon`.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add desktop icons with selection and double-click to open"
```

### Task 1.4: Taskbar

**Files:**
- Create: `src/components/desktop/Taskbar.tsx`
- Create: `src/components/desktop/StartMenu.tsx`
- Create: `src/components/desktop/Clock.tsx`

- [ ] **Step 1: Build Taskbar component**

Fixed bottom bar. Uses 98.css outset button styling. Contains:
- Start button (left)
- Task buttons area (middle, flex)
- System tray with clock (right)

- [ ] **Step 2: Build task buttons**

One button per open window from the store. Styling:
- Focused (topmost) window → button appears "pressed" (inset)
- Other windows → button appears normal (outset)
- Click → if minimized, restore + focus. If focused, minimize. If unfocused, focus.

- [ ] **Step 3: Build Start button + StartMenu**

Start button: 98.css button with bold "Start" text and a small icon.
StartMenu: Popup above the start button when clicked. Contains menu items matching desktop icons. Click item → `openWindow(app)`, close menu.
Click outside menu → close menu.

- [ ] **Step 4: Build Clock component**

Displays current time in `HH:MM AM/PM` format (matching Win95 system tray). Updates every minute via `setInterval`.

- [ ] **Step 5: Wire taskbar to z-index: 1000**

Taskbar is always above all windows. StartMenu at z-index: 1001.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add taskbar with start menu, task buttons, and clock"
```

### Task 1.5: Desktop Root Component + Integration

**Files:**
- Create: `src/components/desktop/Desktop.tsx`
- Create: `src/components/desktop/WindowManager.tsx`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Build WindowManager component**

Reads `state.windows` from store. Renders a `<Window>` for each open window. Resolves the app body component via `APP_REGISTRY[window.app].component`. Wraps every app body in `<Suspense>` so lazy apps get a loading indicator automatically. For now, all app bodies are placeholder `<div>` elements.

- [ ] **Step 2: Build Desktop root component**

Wraps everything in `DesktopProvider`. Renders:
- DesktopIconGrid
- WindowManager
- Taskbar

- [ ] **Step 3: Mount in index.astro**

```astro
---
export const prerender = true;
---
<BaseLayout>
  <Desktop client:load />
</BaseLayout>
```

- [ ] **Step 4: End-to-end test**

In the browser:
- ✅ Teal desktop with icons on the left
- ✅ Double-click icon → window opens with placeholder content
- ✅ Drag window by title bar
- ✅ Click window → comes to front
- ✅ Minimize → window hides, taskbar button updates
- ✅ Click taskbar button → restore window
- ✅ Close → window gone, taskbar button gone
- ✅ Start menu opens/closes
- ✅ Clock shows time

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: integrate desktop shell — icons, windows, taskbar working end-to-end"
```

### Phase 1 Verification Gate

- [ ] **Run `pnpm verify`**
```bash
pnpm verify
```
Expected: Lint passes, typecheck passes, tests pass. Fix any errors before proceeding to Phase 2.

---

## Phase 2: CV Browser App

> **Skills:** `astro`, `test-driven-development`, `vercel-composition-patterns`

**Goal:** "View CV" opens a Netscape-styled browser window displaying CV content from Markdown.

**Estimated time:** 1-2 hours

**Dependency:** Phase 1 complete. Phase 0.3 (content collections) complete.

### Task 2.1: Serialize CV Content at Build Time

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Query content collections in index.astro frontmatter**

```astro
---
import { getCollection } from 'astro:content';
const cvSections = (await getCollection('cv')).sort((a, b) => a.data.order - b.data.order);
// Render each section to HTML
const cvData = await Promise.all(cvSections.map(async (s) => {
  const { Content } = await s.render();
  // TODO: capture rendered HTML — may need a render-to-string utility
  return { slug: s.slug, title: s.data.title };
}));
---
```

**Note:** Astro doesn't have a built-in `renderToString` for Content components. The recommended approach is to use Astro's `<Content />` component in a hidden element, OR to use the raw compiled `body` HTML. Research the cleanest approach at implementation time. The `entry.render()` method returns a `Content` component — you may need to use `compiledContent()` or the raw body from the entry.

- [ ] **Step 2: Embed CV data as JSON script tag**

```astro
<script type="application/json" id="cv-data" set:html={JSON.stringify(cvData)} />
```

- [ ] **Step 3: Verify JSON is in the page source**

```bash
pnpm dev
# View page source — JSON block should contain CV content
```

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: serialize CV Markdown content into page JSON at build time"
```

### Task 2.2: Build BrowserApp Component

**Files:**
- Create: `src/components/desktop/apps/BrowserApp.tsx`

- [ ] **Step 1: Build browser toolbar**

Decorative (non-functional) elements mimicking Netscape Navigator:
- Back, Forward, Reload, Home, Print buttons (all disabled/decorative)
- Address bar showing a fake URL like `http://cv.local/dmytro-lesyk`
- Optional: Netscape throbber animation (small spinning logo)

Use 98.css button and input classes for authentic look.

- [ ] **Step 2: Build CV content display area**

Read CV data from `document.getElementById('cv-data')`. Parse JSON. Render sections as HTML inside a scrollable `.window-body` area.

Use `innerHTML` for rendered Markdown HTML (it's trusted, build-time generated content).

- [ ] **Step 3: Style the content area**

The "browser viewport" should have:
- White background (like a web page inside the browser chrome)
- Proper heading/paragraph spacing
- Scrollable if content overflows

- [ ] **Step 4: Wire BrowserApp into WindowManager**

When `window.app === 'browser'`, render `<BrowserApp />` as the window body.

- [ ] **Step 5: Test end-to-end**

- ✅ Double-click "View CV" icon → browser window opens
- ✅ Address bar shows fake URL
- ✅ CV content renders with proper formatting
- ✅ Content scrolls within the window
- ✅ Window can be dragged, minimized, closed

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add BrowserApp with Netscape-styled CV viewer"
```

### Phase 2 Verification Gate

- [ ] **Run `pnpm verify`**
```bash
pnpm verify
```
Expected: Lint passes, typecheck passes, tests pass. Fix any errors before proceeding to Phase 3.

---

## Phase 3: Explorer App (Export Downloads)

> **Skills:** `astro`, `vercel-composition-patterns`

**Goal:** "Export CV" opens a Windows Explorer-styled folder window with PDF and DOC download links.

**Estimated time:** 30-45 minutes

**Dependency:** Phase 1 complete. Phase 0.5 (static export files) complete.

### Task 3.1: Build ExplorerApp Component

**Files:**
- Create: `src/components/desktop/apps/ExplorerApp.tsx`

- [ ] **Step 1: Build explorer toolbar**

Decorative toolbar mimicking Windows Explorer:
- Address bar showing `C:\My Documents\CV\`
- Optional: Back, Forward, Up buttons (decorative)

- [ ] **Step 2: Build file grid**

Display two file icons:
- `CV.pdf` with the PDF icon from `assets/icons/pdf_icon.png`
- `CV.docx` with the DOC icon from `assets/icons/doc_icon.png`

Each is an `<a href="/downloads/cv.pdf" download>` (or `.docx`) styled as a Win95 file icon with label beneath.

- [ ] **Step 3: Add status bar**

Bottom of the window: `2 object(s)` — matching Win95 Explorer aesthetic (see inspiration images).

- [ ] **Step 4: Wire ExplorerApp into WindowManager**

When `window.app === 'explorer'`, render `<ExplorerApp />`.

- [ ] **Step 5: Test**

- ✅ Double-click "Export CV" → Explorer window opens
- ✅ PDF and DOC icons are visible
- ✅ Clicking PDF icon downloads the PDF
- ✅ Clicking DOC icon downloads the DOC

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add ExplorerApp with CV export downloads"
```

### Phase 3 Verification Gate

- [ ] **Run `pnpm verify`**
```bash
pnpm verify
```
Expected: Lint passes, typecheck passes, tests pass. Fix any errors before proceeding to Phase 4.

---

## Phase 4: Email App (Contact Form)

> **Skills:** `resend`, `resend-cli`, `test-driven-development`, `typescript-magician`, `vercel-composition-patterns`

**Goal:** "Contact Me" opens a 90s email client window. User can send a message (via Resend) or open Telegram.

**Estimated time:** 1-2 hours

**Dependency:** Phase 1 complete. Resend API key available.

### Task 4.1: Create Contact API Endpoint

**Files:**
- Create: `src/pages/api/contact.ts`

- [ ] **Step 1: Install Resend SDK**
```bash
pnpm add resend
```

- [ ] **Step 2: Create the API endpoint**

```typescript
// src/pages/api/contact.ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  // Honeypot check
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // Validate required fields: name, email, subject, message
  // ... validation logic ...

  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'CV Contact <noreply@yourdomain.com>',
    to: 'your-email@domain.com',
    replyTo: body.email,
    subject: `[CV Contact] ${body.subject}`,
    text: `From: ${body.name} (${body.email})\n\n${body.message}`,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: 'Failed to send' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

- [ ] **Step 3: Add environment variable**

Create `.env`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

- [ ] **Step 4: Test endpoint with curl**
```bash
curl -X POST http://localhost:4321/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","subject":"Hello","message":"Test message"}'
```
Expected: `{"ok":true}` and email received.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add contact API endpoint with Resend"
```

### Task 4.2: Build EmailApp Component

**Files:**
- Create: `src/components/desktop/apps/EmailApp.tsx`

- [ ] **Step 1: Build email window layout**

Styled as Outlook Express / The Bat!:
- Toolbar: "Send" button, "New", "Reply" (decorative) buttons
- Header fields: To (pre-filled, read-only), From (user input), Subject (user input)
- Body: textarea for message
- Hidden honeypot field (CSS `display: none`)
- Telegram link button: `<a href="https://t.me/yourusername">` styled as 98.css button

- [ ] **Step 2: Handle form submission**

On "Send" click:
1. Validate fields client-side (basic: not empty, email format)
2. Show hourglass cursor / "Sending..." state
3. `fetch('/api/contact', { method: 'POST', body: JSON.stringify(formData) })`
4. On success: show a retro dialog box ("Message sent successfully!")
5. On error: show error dialog

- [ ] **Step 3: Build retro dialog box**

A small 98.css `.window` centered in the email window with an OK button. Used for success/error feedback. Think "MessageBox" from Win95.

- [ ] **Step 4: Wire EmailApp into WindowManager**

When `window.app === 'email'`, render `<EmailApp />`.

- [ ] **Step 5: Test end-to-end**

- ✅ Double-click "Contact Me" → email window opens
- ✅ Fill in fields and click Send
- ✅ Success dialog appears
- ✅ Email arrives in inbox
- ✅ Telegram link opens Telegram

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add EmailApp with Resend contact form and Telegram link"
```

### Phase 4 Verification Gate

- [ ] **Run `pnpm verify`**
```bash
pnpm verify
```
Expected: Lint passes, typecheck passes, tests pass. Fix any errors before proceeding to Phase 5.

---

## Phase 5: Mobile Responsive Degradation

> **Skills:** `web-design-guidelines`

**Goal:** Site is usable on mobile without breaking the desktop metaphor.

**Estimated time:** 1-2 hours

**Dependency:** Phases 1-4 complete.

### Task 5.1: Add Mobile Detection Signal

**Files:**
- Modify: `src/components/desktop/store/desktop-store.ts`

- [ ] **Step 1: Add `isMobile` signal**

Based on `window.matchMedia("(max-width: 768px)")`. Attach listener for resize/orientation changes.

- [ ] **Step 2: Expose through context**

Add `isMobile()` to the store's public API so all components can read it.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add isMobile reactive signal based on viewport width"
```

### Task 5.2: Adapt Components for Mobile

**Files:**
- Modify: `src/components/desktop/Window.tsx`
- Modify: `src/components/desktop/DesktopIconGrid.tsx`
- Modify: `src/components/desktop/Taskbar.tsx`
- Modify: `src/styles/desktop.css`
- Modify: `src/styles/window.css`

- [ ] **Step 1: Windows go full-screen on mobile**

When `isMobile()`:
- Window uses `position: fixed; inset: 0;` (below taskbar)
- No drag behavior
- Title bar close button still works
- Add a "Back" button or make close more prominent

- [ ] **Step 2: Desktop icons become a grid**

When `isMobile()`:
- Icons arrange in a centered grid (2-3 columns)
- Tap = open (no double-click on mobile; single-tap opens)
- Icons are slightly larger for touch targets

- [ ] **Step 3: Taskbar adapts**

When `isMobile()`:
- Simplified: just Start button + active app name
- Or: hide task buttons, show only Back + Home

- [ ] **Step 4: Only one window visible at a time on mobile**

Opening a new window closes (or hides) the current one. No stacking.

- [ ] **Step 5: Test on mobile viewport**

Use browser DevTools responsive mode at 375×812 (iPhone) and 390×844 (iPhone 14).

- ✅ Icons visible and tappable
- ✅ App opens full-screen
- ✅ Close returns to desktop
- ✅ Contact form usable
- ✅ CV content scrollable
- ✅ No horizontal overflow

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add mobile responsive degradation — full-screen windows, simplified UI"
```

### Phase 5 Verification Gate

- [ ] **Run `pnpm verify`**
```bash
pnpm verify
```
Expected: Lint passes, typecheck passes, tests pass. Fix any errors before proceeding to Phase 6.

---

## Phase 6: Polish, Accessibility, and Performance

> **Skills:** `astro`, `web-design-guidelines`

**Goal:** Ship-quality MVP. Accessibility basics. Performance targets met.

**Estimated time:** 1-2 hours

**Dependency:** Phases 1-5 complete.

### Task 6.1: Accessibility Pass

**Files:**
- Modify: Multiple component files

- [ ] **Step 1: Add ARIA roles**

- Desktop icons: `role="button"`, `aria-label="Open [app name]"`
- Windows: `role="dialog"`, `aria-labelledby` → title bar text ID
- Taskbar: `role="toolbar"`
- Start menu: `role="menu"`, items: `role="menuitem"`

- [ ] **Step 2: Keyboard navigation**

- Tab cycles through desktop icons
- Enter/Space activates selected icon (opens app)
- Escape closes focused window or start menu
- Tab within windows cycles through interactive elements

- [ ] **Step 3: Focus management**

- Window open → focus moves to the window (or first interactive element inside)
- Window close → focus returns to the icon or taskbar button that opened it

- [ ] **Step 4: Add `<noscript>` fallback**

In `index.astro`, add a `<noscript>` block with:
- Direct link to `/cv-print` (print-friendly CV page)
- Direct download links to PDF and DOC
- `mailto:` link for contact

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add accessibility — ARIA roles, keyboard nav, noscript fallback"
```

### Task 6.2: Print-Friendly CV Page

**Files:**
- Create: `src/pages/cv-print.astro`

- [ ] **Step 1: Create cv-print.astro**

A clean, static page that renders all CV sections from content collections. No 98.css, no window chrome. Plain, professional layout with `@media print` styles. This serves as:
- The `<noscript>` fallback destination
- The source for automated PDF generation (Phase 9)
- A direct link someone could share

- [ ] **Step 2: Verify it renders cleanly**
```bash
pnpm dev
# Open http://localhost:4321/cv-print — clean CV page
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add print-friendly CV page for noscript fallback"
```

### Task 6.3: Performance Audit

- [ ] **Step 1: Run production build**
```bash
pnpm build
```

- [ ] **Step 2: Check bundle sizes**

Verify:
- index.html < 50KB
- SolidJS island JS < 25KB gzip
- No unexpected large chunks

- [ ] **Step 3: Run Lighthouse**

```bash
pnpm dlx lighthouse http://localhost:4321 --output=json --output-path=./lighthouse.json
```

Targets:
- Performance: 90+
- Accessibility: 80+ (retro UI is hard to score perfectly)
- Best Practices: 90+

- [ ] **Step 4: Fix any critical issues found**

Common issues to check:
- Images without dimensions
- Missing alt text
- Color contrast (98.css title bars should pass)
- CLS from window rendering

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "perf: optimize bundle sizes and fix Lighthouse issues"
```

### Task 6.4: Visual Polish

- [ ] **Step 1: Retro cursors (optional)**

Add cursor CSS overrides from `docs/design-system.md` § 5. If cursor files aren't ready, skip this — default cursors are fine.

- [ ] **Step 2: Desktop icon hover/select states**

Match Win95: dotted border on focus, solid blue background with white text on select.

- [ ] **Step 3: Window open/close micro-animations (optional)**

Subtle scale-in on open (100ms). Not required — Win95 didn't have animations.

- [ ] **Step 4: Taskbar start button bold text + icon**

Match authentic Win95 start button styling.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "style: visual polish — cursors, icon states, taskbar refinements"
```

### Phase 6 Verification Gate (MVP Final)

- [ ] **Run `pnpm verify`**
```bash
pnpm verify
```
Expected: Lint passes, typecheck passes, tests pass. **This is the MVP gate.** Do not deploy until this passes.

---

## 🏁 MVP Complete After Phase 6

At this point you have a deployed, functional retro CV website with:
- ✅ Win95 desktop with icons, taskbar, start menu
- ✅ Draggable windows with focus/minimize/maximize/close
- ✅ CV browser window with Markdown content
- ✅ Explorer window with PDF/DOC downloads
- ✅ Contact form via Resend
- ✅ Mobile support
- ✅ Accessibility basics
- ✅ Performance targets met

---

## Phase 7: Terminal App (Nice-to-Have)

> **Skills:** `test-driven-development`

**Goal:** xterm.js-based terminal window that can launch apps and display CV via CLI.

**Estimated time:** 3-4 hours

**Dependency:** MVP complete. This is independent and can be built anytime after Phase 6.

**Risk:** Medium — xterm.js integration has quirks. Bundle size is large (~300KB).

### Task 7.1: Lazy-Load xterm.js

**Files:**
- Create: `src/components/desktop/apps/TerminalApp.tsx`

- [ ] **Step 1: Install xterm.js**
```bash
pnpm add xterm @xterm/addon-fit
```

- [ ] **Step 2: Create TerminalApp with lazy loading**

Use SolidJS `lazy()`:
```typescript
const TerminalApp = lazy(() => import('./apps/TerminalApp'));
```

The component:
1. Dynamic `import('xterm')` in `onMount`
2. Initialize terminal in a container `<div>`
3. Apply retro theme (green text on black, or white on black)
4. Show loading indicator until xterm is ready

- [ ] **Step 3: Implement command parser**

Simple command registry:
- `help` — list available commands
- `cv` — print CV sections as text
- `cv experience` — print specific section
- `open browser` — call `openWindow('browser', 'View CV')`
- `open email` — call `openWindow('email', 'Contact Me')`
- `export pdf` — trigger PDF download
- `clear` — clear terminal
- `about` — display ASCII art banner

- [ ] **Step 4: Wire into WindowManager**

When `window.app === 'terminal'`, render `<Suspense fallback={<Loading />}><TerminalApp /></Suspense>`.

- [ ] **Step 5: Verify lazy loading works**

- ✅ Open terminal → loading indicator → terminal appears
- ✅ Network tab shows xterm.js chunk only loaded when terminal opens
- ✅ Commands work
- ✅ Window can be closed and reopened

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add terminal app with xterm.js (lazy-loaded)"
```

### Phase 7 Verification Gate

- [ ] **Run `pnpm verify`**
```bash
pnpm verify
```
Expected: Lint passes, typecheck passes, tests pass.

---

## Phase 8: Retro Games (Nice-to-Have)

> **Skills:** `test-driven-development`

**Goal:** Playable retro games in windows, starting with a 90s-authentic Snake. Architecture provisions for WASM games (Doom, etc.) later.

**Estimated time:** 4-6 hours (Snake: ~3h, infrastructure + WASM scaffold: ~2h)

**Dependency:** MVP complete. Independent of Phase 7.

**Risk:** Low (games are self-contained), but time-consuming. WASM games are an unknown — the infrastructure is straightforward, but sourcing/building a working Doom WASM port requires research.

### Task 8.1: Game Infrastructure

**Files:**
- Create: `src/components/desktop/apps/GameApp.tsx`

- [ ] **Step 1: Build GameApp wrapper**

Generic game host component that:
- Receives `gameId` via `appProps` from the window state
- Lazy-loads the specific game module based on `gameId`
- Renders a `<canvas>` element (or a `<div>` container for WASM games that need their own DOM)
- Captures keyboard focus when the window is focused (games need arrow keys, WASD, etc.)
- Pauses the game when the window is minimized or loses focus
- Shows a retro loading screen ("Loading..." with an hourglass) while the game module loads
- Provides a consistent frame: score display area at top, game area below, 98.css-styled status bar at bottom

- [ ] **Step 2: Register game app entries**

Each game registers itself via the app registry. Example for Snake:

```typescript
// In games/Snake.tsx (or a games/index.ts manifest)
import { registerApp } from '../registry';
import { lazy } from 'solid-js';
import snakeIcon from '../../../assets/icons/snake.png';

registerApp({
  id: 'snake',
  title: 'Snake',
  icon: snakeIcon,
  component: lazy(() => import('./games/Snake')),
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Games',
  singleton: true,
  defaultSize: { width: 320, height: 360 },
});
```

The game appears on the desktop and in Start > Games automatically. No other files change.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add GameApp wrapper and game registry infrastructure"
```

### Task 8.2: Implement Snake (90s Authentic)

**Files:**
- Create: `src/components/desktop/apps/games/Snake.tsx`
- Create: `src/components/desktop/apps/games/snake-engine.ts`

The Snake game must feel like a late-90s PC game — not a modern HTML5 tutorial project.

**90s Design Requirements:**
- **Low resolution feel:** Render on a small canvas (e.g., 300×300) with large, blocky grid cells (15×15px). No anti-aliasing. `imageSmoothingEnabled = false`.
- **Color palette:** Restrict to the Win95 16-color palette — bright green snake on black background, red food, gray border. No gradients, no glow effects.
- **Grid-based movement:** Snake moves in discrete grid steps, not smooth interpolation. One cell per tick. This is how 90s Snake felt.
- **Sound (optional):** Simple beeps via `AudioContext.oscillator` for eat/die events. No audio files needed.
- **Score display:** Rendered as part of the 98.css window chrome — a status bar at the bottom of the window: `Score: 42 | High Score: 108 | Speed: 3`.
- **Speed progression:** Game gets faster as the snake grows. Start at ~150ms per tick, decrease to ~80ms.
- **Game over:** Freeze the canvas. Show a 98.css-styled MessageBox dialog inside the game window: "Game Over! Score: 42. Play again?" with [OK] and [Cancel] buttons.
- **Pause:** Pressing `P` or `Space` pauses. A "PAUSED" text overlay on the canvas (blocky, centered).
- **Controls:** Arrow keys only. No touch support in MVP (games are desktop-oriented).
- **No external dependencies.** Pure canvas API + game loop. ~200-300 lines for the engine.

- [ ] **Step 1: Write the game engine**

`snake-engine.ts`: Pure logic, no DOM. Exports a class/functions:
- `createGame(cols, rows)` → initial state
- `tick(state)` → next state (move snake, check collision, check food)
- `changeDirection(state, direction)` → updated state
- `isGameOver(state)` → boolean

This is testable without a canvas.

- [ ] **Step 2: Write tests for the engine**

Test:
- Snake moves in the correct direction
- Snake grows when eating food
- Game over on wall collision
- Game over on self collision
- Direction change doesn't allow 180° reversal
- Speed increases with score

- [ ] **Step 3: Run tests**
```bash
pnpm vitest run src/components/desktop/apps/games/snake-engine.test.ts
```
Expected: All tests pass.

- [ ] **Step 4: Build the Snake component**

`Snake.tsx`: SolidJS component that:
- Creates a `<canvas>` element
- Runs a `requestAnimationFrame` loop with tick-rate throttling
- Renders the game state to the canvas each frame (blocky pixels, 16-color palette)
- Listens for arrow key input via `onKeyDown`
- Shows score in a 98.css status bar below the canvas
- Shows game-over MessageBox dialog
- Shows pause overlay

- [ ] **Step 5: Test in a game window**

- ✅ Double-click Snake icon → game window opens
- ✅ Game starts immediately, snake moves
- ✅ Arrow keys control direction
- ✅ Eating food grows snake and increases score
- ✅ Collision shows game-over dialog with 98.css styling
- ✅ "Play again" resets the game
- ✅ Pause works
- ✅ Game visually looks like a 90s PC game (blocky, 16-color, grid-based)
- ✅ Minimizing the window pauses the game

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add 90s-style Snake game with tested engine"
```

### Phase 8 Verification Gate (after Snake)

- [ ] **Run `pnpm verify`**
```bash
pnpm verify
```
Expected: Lint passes, typecheck passes, tests pass (including snake-engine tests).

### Task 8.3: WASM Game Infrastructure (Scaffold for Future)

**Files:**
- Create: `public/wasm/.gitkeep`
- Create: `src/components/desktop/apps/games/WasmGameHost.tsx`

This task does NOT implement Doom or any specific WASM game. It builds the host infrastructure so that adding a WASM game later is trivial.

- [ ] **Step 1: Create WasmGameHost component**

A generic component that:
- Accepts a `wasmUrl` prop (path to `.wasm` file in `public/wasm/`)
- Fetches and instantiates the WASM module
- Provides a `<canvas>` for rendering
- Forwards keyboard/mouse events to the WASM module
- Shows a loading progress bar while the WASM binary downloads (these can be 1-5MB)
- Handles errors gracefully ("Failed to load game" dialog)

```typescript
interface WasmGameHostProps {
  wasmUrl: string;           // e.g., "/wasm/doom.wasm"
  initFunction: string;      // entry point function name in the WASM module
  canvasWidth: number;
  canvasHeight: number;
}
```

- [ ] **Step 2: Document how to add a WASM game**

Create `src/components/desktop/apps/games/README.md` explaining:
1. Place the `.wasm` binary in `public/wasm/`
2. Create a thin wrapper component that uses `WasmGameHost`
3. Call `registerApp()` with `lazy(() => import('./games/YourGame'))`
4. Done — game appears on desktop and Start > Games

Example for a hypothetical Doom port:
```typescript
// games/DoomGame.tsx
import { registerApp } from '../registry';
import { lazy } from 'solid-js';
import doomIcon from '../../../assets/icons/doom.png';

const DoomGame = () => (
  <WasmGameHost
    wasmUrl="/wasm/doom.wasm"
    initFunction="doom_main"
    canvasWidth={640}
    canvasHeight={480}
  />
);

registerApp({
  id: 'doom',
  title: 'DOOM',
  icon: doomIcon,
  component: lazy(() => import('./games/DoomGame')),
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Games',
  singleton: true,
  defaultSize: { width: 660, height: 520 },
});

export default DoomGame;
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add WASM game host scaffold and documentation"
```

### Task 8.4: Add More Games (Future)

Each additional game follows the same pattern:
1. **Canvas-based game (Snake, Tetris, Minesweeper):** Pure TS engine + SolidJS renderer + `registerApp()`.
2. **WASM game (Doom, Quake):** Find/build the `.wasm` binary, create a thin wrapper using `WasmGameHost`, `registerApp()`.

The registry pattern means zero framework changes regardless of how many games are added.

---

## Phase 9: Automated PDF/DOC Generation (Nice-to-Have)

> **Skills:** `astro`

**Goal:** PDF and DOC files auto-generated from Markdown at build time.

**Estimated time:** 2-3 hours

**Dependency:** MVP complete. Phase 6.2 (cv-print page) complete.

### Task 9.1: Automated PDF via Playwright

**Files:**
- Create: `scripts/generate-pdf.mjs`
- Modify: `package.json` (add build script)

- [ ] **Step 1: Install Playwright**
```bash
pnpm add -D @playwright/test
pnpm dlx playwright install chromium
```

- [ ] **Step 2: Create PDF generation script**

```javascript
// scripts/generate-pdf.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:4321/cv-print');
await page.pdf({ path: 'public/downloads/cv.pdf', format: 'A4' });
await browser.close();
```

- [ ] **Step 3: Add to build pipeline**

In `package.json`:
```json
{
  "scripts": {
    "build": "astro build",
    "build:pdf": "node scripts/generate-pdf.mjs",
    "build:all": "pnpm build && pnpm preview & sleep 3 && pnpm build:pdf"
  }
}
```

*Note:* The exact build pipeline depends on your hosting. The concept: run the static build, start a preview server, generate PDF against it, stop the server.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: add automated PDF generation from cv-print page"
```

### Task 9.2: Automated DOC via docx Library

**Files:**
- Create: `scripts/generate-docx.mjs`

- [ ] **Step 1: Install docx**
```bash
pnpm add -D docx
```

- [ ] **Step 2: Create DOCX generation script**

Reads CV Markdown files, parses frontmatter, generates a `.docx` file with proper headings and paragraphs.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add automated DOCX generation from CV Markdown"
```

---

## Suggested Order for Codex-Driven Sessions

Each session should be one phase or sub-phase. Keep sessions focused.

**Every session:** Load `executing-plans` at session start before doing anything else.

| Session | What to build | Estimated time | Load these skills | Notes |
|---|---|---|---|---|
| **Session 1** | Phase 0 (scaffolding) | 30 min | `astro`, `typescript-magician` | Get the project running. No interactivity yet. |
| **Session 2** | Task 1.1 + 1.2 (store + Window component) | 1-1.5 hr | `test-driven-development`, `typescript-magician`, `vercel-composition-patterns` | The hardest single task. Drag behavior is the core technical challenge. |
| **Session 3** | Task 1.3 + 1.4 + 1.5 (icons + taskbar + integration) | 1-1.5 hr | `vercel-composition-patterns`, `web-design-guidelines` | Wire everything together. First "wow it works" moment. |
| **Session 4** | Phase 2 (CV Browser app) | 1 hr | `astro`, `test-driven-development`, `vercel-composition-patterns` | Content architecture. First real useful feature. |
| **Session 5** | Phase 3 (Explorer app) | 30 min | `astro`, `vercel-composition-patterns` | Quick win. |
| **Session 6** | Phase 4 (Email app + Resend) | 1-1.5 hr | `resend`, `resend-cli`, `test-driven-development`, `typescript-magician` | Backend integration. Test with real Resend key. Use `resend-cli` to verify domain and send test emails. |
| **Session 7** | Phase 5 (Mobile) | 1-1.5 hr | `web-design-guidelines` | Responsive work. Test on real devices. |
| **Session 8** | Phase 6 (Polish + a11y + perf) | 1-2 hr | `web-design-guidelines`, `astro` | Final MVP quality pass. **Deploy after this.** |
| **Session 9** | Phase 7 (Terminal) | 3-4 hr | `test-driven-development` | Terminal is the most impressive. |
| **Session 10** | Phase 8 Tasks 8.1-8.2 (Snake + game infra) | 3-4 hr | `test-driven-development` | 90s-style Snake. TDD the engine. |
| **Session 11** | Phase 8 Task 8.3 (WASM scaffold) | 1-2 hr | `test-driven-development` | Build the host. No actual WASM game yet — just the infrastructure. |
| **Session 12** | Phase 9 (automated PDF/DOC) | 2-3 hr | `astro` | Build-time generation. |
| **Session 13+** | Add more games (Tetris, Doom, etc.) | 2-4 hr each | `test-driven-development` | Each game is independent. WASM games need a `.wasm` binary to be sourced. |

---

## Testing Strategy

### What to Test and How

| Layer | Approach | Tools |
|---|---|---|
| **Store logic** | Unit tests for actions (open, close, focus, drag) | Vitest |
| **Component rendering** | Snapshot or basic render tests for key components | Vitest + solid-testing-library |
| **Drag behavior** | Manual testing (automated drag simulation is fragile) | Browser DevTools |
| **Contact API** | Integration test: POST with valid/invalid data | Vitest + fetch |
| **Content pipeline** | Build succeeds, CV data is in page HTML | `astro build` + grep |
| **Mobile** | Manual testing in responsive mode | Chrome DevTools |
| **Performance** | Lighthouse CI | `pnpm dlx lighthouse` |
| **Accessibility** | axe-core + manual keyboard navigation test | `axe-core`, manual |

### Testing Priority (MVP)

1. **Store unit tests** — the window manager logic is the most complex code and the most testable
2. **Contact API integration test** — verify Resend integration works
3. **Build verification** — ensure `astro build` succeeds with content
4. **Manual E2E** — visual + interaction testing in browser

### What NOT to Test

- 98.css rendering (it's a third-party library)
- Exact pixel positions of dragged windows
- Animation timing
- Game logic (if implemented, games are nice-to-haves)

---

## Dependency Decisions

### MVP Dependencies

| Package | Purpose | Size (gzip) | Required? |
|---|---|---|---|
| `astro` | Site framework | Dev only | ✅ |
| `@astrojs/solid-js` | SolidJS integration | Dev only | ✅ |
| `@astrojs/node` | Node SSR adapter (for API route) | Dev only | ✅ |
| `solid-js` | UI reactivity | ~7KB | ✅ |
| `98.css` | Win98 aesthetic | ~10KB | ✅ |
| `resend` | Email API (server only) | ~5KB (server) | ✅ |

### Nice-to-Have Dependencies (Deferred)

| Package | Purpose | Size (gzip) | When |
|---|---|---|---|
| `xterm` | Terminal emulator | ~300KB | Phase 7 |
| `@xterm/addon-fit` | Terminal auto-resize | ~2KB | Phase 7 |
| `@playwright/test` | PDF generation | Dev only | Phase 9 |
| `docx` | DOCX generation | Dev only | Phase 9 |

### Explicitly Rejected

| Package | Why Not |
|---|---|
| `tailwindcss` | Conflicts with 98.css philosophy. Adds build complexity. |
| `jspdf` / `html2pdf` | Client-side generation is slow, large, and looks worse than pre-built. |
| `react` | Too large. No fine-grained reactivity. |
| `zustand` / `redux` | React-ecosystem. SolidJS has built-in store. |
| `framer-motion` | React-only. Not needed. CSS transitions suffice. |

---

## Performance Checkpoints

Run these after each phase:

| Checkpoint | Command | Target |
|---|---|---|
| **Lint + typecheck + tests** | `pnpm verify` | Exit code 0, zero errors. **Mandatory gate — do not proceed to next phase if this fails.** |
| Build succeeds | `pnpm build` | Exit code 0, no errors |
| HTML size | Check `dist/index.html` | < 50KB |
| JS bundle | Check `dist/_astro/*.js` sizes | Largest chunk < 25KB gzip |
| Lighthouse perf | `pnpm dlx lighthouse` on preview server | 90+ desktop |
| No unintended imports | `grep -r "xterm\|@xterm" dist/` | Should find nothing in Phases 0-6 |
| Time to interactive | Lighthouse TTI metric | < 1.5s desktop, < 3s mobile 3G |
