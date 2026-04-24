# Full-Codebase Type Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend strict TypeScript type checking and Biome type-aware linting to cover every `.ts`/`.tsx` file in the repository — `src/`, `scripts/`, `packages/`, and `tests/e2e/` — all enforced by `pnpm verify`. Eliminate unsafe `as X` type assertions by replacing them with runtime type guards, discriminated union narrowing, SolidJS JSX event handler types, and `instanceof` narrowing. Enforce the policy going forward with Biome lint escalation and AGENTS.md documentation.

**Architecture:** Create a shared `tsconfig.base.json` with all strictest flags, have every zone-specific tsconfig extend it, add a `tsconfig.scripts.json` to cover the currently-excluded `scripts/` directory, tighten the `packages/knowledge-engine` tsconfig, and enable Biome's `types` domain nursery rules for type-aware linting. Replace unsafe `as` casts across production code with proper type narrowing where the tradeoff is favorable, leverage SolidJS's built-in event handler type inference to eliminate DOM event casts, and escalate Biome lint rules to block the related escape hatches (`!` and `any`). Wire everything into the `verify` pipeline.

**Tech Stack:** TypeScript 5.x (`tsc --noEmit`), Biome 2.4.x (linter), Astro `astro check`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `tsconfig.base.json` | **Create** | Shared strictest compiler options — single source of truth |
| `tsconfig.json` | **Modify** | Root Astro config extends base + astro/strictest, drops duplicated flags |
| `tsconfig.scripts.json` | **Create** | Covers `scripts/**/*.ts` with Node16 module settings |
| `packages/knowledge-engine/tsconfig.json` | **Modify** | Extends `../../tsconfig.base.json`, keeps package-specific settings |
| `biome.json` | **Modify** | Add `domains.types: "all"`, add 3 nursery type-aware rules |
| `package.json` | **Modify** | Add `typecheck:scripts` script, update `verify` pipeline |
| `scripts/check-external-links.ts` | **Modify** | Fix 1 `exactOptionalPropertyTypes` error |
| `scripts/generate-diagrams.ts` | **Modify** | Fix 1 `noUncheckedIndexedAccess` error |
| `scripts/knowledge-graph/load.ts` | **Modify** | Fix 2 `noPropertyAccessFromIndexSignature` errors |
| `scripts/knowledge-audit/rules.test.ts` | **Modify** | Fix 13 `exactOptionalPropertyTypes` errors |
| `scripts/review-article.ts` | **Modify** | Fix 13 errors (mixed: 10 index sig, 1 exactOptional, 1 assertion, 1 never) |
| `src/components/desktop/apps/TerminalApp.tsx` | **Modify** | Fix `noMisusedPromises`: wrap async onMount |
| `src/components/learn/InteractiveExercise.tsx` | **Modify** | Fix `noMisusedPromises`: wrap async onMount |
| `src/components/learn/KnowledgeGraph.tsx` | **Modify** | Fix `noMisusedPromises`: wrap async onMount |
| `src/utils/type-guards.ts` | **Create** | Shared `isRecord` and `isArrayOf` type guard utilities |
| `src/pages/api/contact.ts` | **Modify** | Replace `as ContactBody` with type guard |
| `src/pages/api/flag-article.ts` | **Modify** | Replace `as FlagBody` with type guard |

| `src/components/desktop/apps/EmailApp.tsx` | **Modify** | Replace `as { ok; error? }` with type guard |
| `packages/knowledge-engine/src/progress.ts` | **Modify** | Replace `as StoredLearningProgress` with type guard |
| `scripts/generate-diagrams.ts` | **Modify** | Replace `as KnowledgeGraph` with type guard |
| `scripts/audit-knowledge.ts` | **Modify** | Replace `as ReviewFlag` with type guard |
| `scripts/review-article.ts` | **Modify** | Replace `as Record<string, unknown>` with guards, fix result building |

| `src/utils/graph-stats.ts` | **Modify** | Delete 4 redundant discriminated union casts |
| `src/scripts/learn/article-progress.ts` | **Modify** | Replace `as MasteryStage` with validation against known values |
| `src/components/desktop/apps/EmailApp.tsx` | **Modify** | Remove redundant DOM event casts by leveraging SolidJS input handler inference |

| `src/components/desktop/Desktop.tsx` | **Modify** | Replace `e.target as HTMLElement` with `instanceof` narrowing |
| `src/components/desktop/DesktopIcon.tsx` | **Modify** | Replace `e.currentTarget as HTMLElement` with SolidJS JSX event handler types |

| `src/components/learn/KnowledgeGraph.tsx` | **Modify** | Remove `as unknown as Record<string, unknown>` double casts; align stylesheet type |
| `src/components/desktop/store/types.ts` | **Modify** | Simplify `component` field type — `lazy()` already returns `Component` |
| `src/components/desktop/apps/registry.ts` | **Modify** | Remove now-redundant `as Component` cast from `resolveAppComponent` |
| `biome.json` | **Modify** | Escalate `noNonNullAssertion` and `noExplicitAny` to `"error"` |

---

## Task 1: Create `tsconfig.base.json`

Extract all strictest compiler flags into a shared base config that every other tsconfig extends.

**Files:**
- Create: `tsconfig.base.json`

- [ ] **Step 1: Create `tsconfig.base.json`**

```jsonc
// tsconfig.base.json — every strictness flag TypeScript offers
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "noUncheckedSideEffectImports": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "erasableSyntaxOnly": true,
    "noErrorTruncation": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true
  }
}
```

**Flag rationale for the three additions beyond `astro/tsconfigs/strictest`:**
- `noUncheckedSideEffectImports` (TS 5.6): catches typos in side-effect imports (`import './stlyes.css'`) that would silently do nothing.
- `erasableSyntaxOnly` (TS 5.8): forbids enums, parameter properties, `import =`, and anything `node --experimental-strip-types` can't handle. Directly relevant since scripts run via strip-types.
- `noErrorTruncation`: DX flag — shows full type error messages instead of truncating with `...`.

- [ ] **Step 2: Verify the file is valid JSON**

Run: `node -e "require('./tsconfig.base.json')"`
Expected: No output (clean parse)

- [ ] **Step 3: Commit**

```bash
git add tsconfig.base.json
git commit -m "chore: add tsconfig.base.json with strictest shared flags"
```

---

## Task 2: Wire root `tsconfig.json` to extend the base

Make the root config extend both the shared base and Astro's strictest preset. Remove flags that are now inherited.

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Update `tsconfig.json`**

Replace the entire file with:

```jsonc
{
  "extends": ["./tsconfig.base.json", "astro/tsconfigs/strictest"],
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "scripts"],
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "solid-js"
  }
}
```

**Why this works:** `tsconfig.base.json` provides all the strict flags. `astro/tsconfigs/strictest` provides the same flags plus Astro-specific settings. TypeScript merges them — later entries win on conflicts but they agree on everything. The root config only adds JSX settings specific to SolidJS. The flags `noPropertyAccessFromIndexSignature` and `forceConsistentCasingInFileNames` (which were in the old root but not in `astro/tsconfigs/strictest`) are now inherited from the base.

- [ ] **Step 2: Verify `astro check` still passes**

Run: `npx astro check 2>&1 | tail -5`
Expected: `0 errors`, `0 warnings`

- [ ] **Step 3: Verify `tsc --noEmit` still passes**

Run: `npx tsc --noEmit`
Expected: No output (clean)

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json
git commit -m "refactor: root tsconfig extends tsconfig.base.json"
```

---

## Task 3: Tighten `packages/knowledge-engine/tsconfig.json`

The package's own tsconfig only has `strict: true` — missing 10 strictest flags. Extend the shared base so the package enforces the same standard as the rest of the repo.

**Files:**
- Modify: `packages/knowledge-engine/tsconfig.json`

- [ ] **Step 1: Update the tsconfig**

Replace the entire `packages/knowledge-engine/tsconfig.json` with:

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16",
    "declaration": true,
    "declarationMap": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

**Notes:**
- `allowImportingTsExtensions` + `noEmit` is required because the package's source files use `.ts` extensions in import paths (e.g., `import { schema } from './schema.ts'`). `noEmit` is required when `allowImportingTsExtensions` is enabled.

- [ ] **Step 2: Verify the package type-checks cleanly**

Run: `cd packages/knowledge-engine && npx tsc --noEmit && cd ../..`
Expected: No output (clean)

- [ ] **Step 3: Commit**

```bash
git add packages/knowledge-engine/tsconfig.json
git commit -m "chore: knowledge-engine tsconfig extends shared base with strictest flags"
```

---

## Task 4: Create `tsconfig.scripts.json` and fix all 30 type errors

This is the core task. The `scripts/` directory has 14 `.ts` files that are currently excluded from type checking entirely. We create a dedicated tsconfig, then fix all 30 errors to make it pass.

**Files:**
- Create: `tsconfig.scripts.json`
- Modify: `scripts/check-external-links.ts`
- Modify: `scripts/generate-diagrams.ts`
- Modify: `scripts/knowledge-graph/load.ts`
- Modify: `scripts/knowledge-audit/rules.test.ts`
- Modify: `scripts/review-article.ts`

### Step 1: Create `tsconfig.scripts.json`

- [ ] **Create the file**

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16",
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "baseUrl": ".",
    "paths": {
      "@playground/knowledge-engine/*": ["./packages/knowledge-engine/src/*"]
    }
  },
  "include": ["scripts/**/*.ts"]
}
```

- [ ] **Verify it finds the scripts and reports errors**

Run: `npx tsc --noEmit -p tsconfig.scripts.json 2>&1 | grep "error TS" | wc -l`
Expected: `30` (confirms the baseline)

- [ ] **Commit the tsconfig (errors not yet fixed)**

```bash
git add tsconfig.scripts.json
git commit -m "chore: add tsconfig.scripts.json for scripts type checking"
```

### Step 2: Fix `scripts/check-external-links.ts` (1 error)

Line 57 — `exactOptionalPropertyTypes`: `redirectUrl` is `string | undefined` but the target type expects `string`.

- [ ] **Fix: narrow `redirectUrl` before returning**

The `response.headers.get('location')` returns `string | null`. The `?? undefined` converts null to undefined, but the return type `Omit<LinkCheckResult, "articleId">` expects `redirectUrl: string` (optional property — present or absent, not `undefined`).

Read the `LinkCheckResult` type to confirm, then fix by conditionally including the property:

```typescript
// Before:
const redirectUrl = response.headers.get('location') ?? undefined;
return { url, status: 'redirect', statusCode, redirectUrl };

// After:
const redirectUrl = response.headers.get('location');
return redirectUrl
  ? { url, status: 'redirect' as const, statusCode, redirectUrl }
  : { url, status: 'redirect' as const, statusCode };
```

**Note:** Read the file to confirm the exact `LinkCheckResult` type definition and `redirectUrl` field. If `redirectUrl` is typed as `string | undefined` in the interface, the fix is instead to add `| undefined` to the type. Pick the approach that matches the actual type.

- [ ] **Verify the error is gone**

Run: `npx tsc --noEmit -p tsconfig.scripts.json 2>&1 | grep "check-external-links"`
Expected: No output

### Step 3: Fix `scripts/generate-diagrams.ts` (1 error)

Line 68 — `noUncheckedIndexedAccess`: `idMatch[1]` is `string | undefined` but used as `string`.

- [ ] **Fix: add a guard**

```typescript
// Before:
const id = idMatch[1];

// After:
const id = idMatch[1];
if (!id) continue;
```

- [ ] **Verify the error is gone**

Run: `npx tsc --noEmit -p tsconfig.scripts.json 2>&1 | grep "generate-diagrams"`
Expected: No output

### Step 4: Fix `scripts/knowledge-graph/load.ts` (2 errors)

Lines 111, 115 — `noPropertyAccessFromIndexSignature`: dot-accessing properties from an index signature (`Record<string, unknown>`).

- [ ] **Fix: use bracket notation**

Read the file around lines 111-115, then change dot access to bracket access:

```typescript
// Before:
something.frontmatter

// After:
something['frontmatter']
```

Apply this to both occurrences (lines 111 and 115).

- [ ] **Verify errors are gone**

Run: `npx tsc --noEmit -p tsconfig.scripts.json 2>&1 | grep "knowledge-graph/load"`
Expected: No output

### Step 5: Fix `scripts/review-article.ts` (11 errors)

This file has a mix of error types. Fix them in groups:

**Group A: `noPropertyAccessFromIndexSignature` (10 errors)** — lines 105, 106, 239 (×2), 240 (×2), 361, 371, 372, 373

- [ ] **Fix: use bracket notation for index signature access**

```typescript
// process.env access (lines 361, 371-373):
// Before:
process.env.REVIEW_API_KEY
process.env.REVIEW_PROVIDER
process.env.REVIEW_MODEL
process.env.REVIEW_BASE_URL

// After:
process.env['REVIEW_API_KEY']
process.env['REVIEW_PROVIDER']
process.env['REVIEW_MODEL']
process.env['REVIEW_BASE_URL']
```

For lines 105-106 (`.frontmatter`, `.body`), 239 (`.score` ×2) and 240 (`.rationale` ×2), read the file context and apply the same `obj.prop` → `obj['prop']` pattern for any property accessed via an index signature. Note lines 239 and 240 each have two dot-accesses on the same line.

**Group B: `exactOptionalPropertyTypes` (1 error)** — line 124

- [ ] **Fix: handle the `lastUpdated` field**

The `ArticleContent` type has `lastUpdated` as optional (`string`). But the constructed object has `lastUpdated: string | undefined` (from a nullable source). Read the `ArticleContent` type in `scripts/review-article/types.ts`, then either:
- Conditionally include the property: `...(lastUpdated !== undefined && { lastUpdated })`
- Or narrow the value before assignment

**Group C: Unsafe type assertion (1 error)** — line 221

- [ ] **Fix: `DimensionResult` to `Record<string, unknown>` assertion**

```typescript
// Before:
someValue as Record<string, unknown>

// After:
someValue as unknown as Record<string, unknown>
// OR better: define a proper type and avoid the assertion
```

Read the context to determine if the assertion can be eliminated entirely with proper typing.

**Group D: Property on `never` (1 error)** — line 398

- [ ] **Fix: the exhaustive switch default case**

The `CliArgs` type is a discriminated union with three modes: `'single' | 'all' | 'since'`. The `switch` handles all three cases, so `default` narrows `cliArgs` to `never`. Accessing `.mode` on `never` is an error.

```typescript
// Before:
default:
  throw new Error(`Unknown mode: ${cliArgs.mode as string}`);

// After — use a satisfies/exhaustive check:
default: {
  const _exhaustive: never = cliArgs;
  throw new Error(`Unknown CLI mode: ${String(_exhaustive)}`);
}
```

- [ ] **Verify all review-article errors are gone**

Run: `npx tsc --noEmit -p tsconfig.scripts.json 2>&1 | grep "review-article"`
Expected: No output

### Step 6: Fix `scripts/knowledge-audit/rules.test.ts` (15 errors)

All 13 errors are `exactOptionalPropertyTypes` (TS2379): test helper functions pass `{ prop: undefined }` for optional properties of `KnowledgeArticle`. Under `exactOptionalPropertyTypes`, you must **omit** the property rather than set it to `undefined`.

- [ ] **Fix: change `undefined` values to property omission**

Read the file to find the test helper (likely a `makeArticle` or similar factory function). The pattern is:

```typescript
// Before (in tests):
makeArticle({ diagramRef: undefined, module: undefined })

// After — simply omit the property:
makeArticle({ })
// Or if other properties are present:
makeArticle({ id: 'test', category: 'architecture' })
```

Apply this to ALL 13 occurrences. The affected lines are: 81, 355, 366, 409, 410, 430, 448, 449, 765, 783, 830, 941, 989.

For each one: if the property is set to `undefined`, simply remove that property from the object literal. The optional property's absence is semantically equivalent to `undefined` for these tests.

- [ ] **Verify all rules.test errors are gone**

Run: `npx tsc --noEmit -p tsconfig.scripts.json 2>&1 | grep "rules.test"`
Expected: No output

### Step 7: Final scripts typecheck verification

- [ ] **Verify zero errors**

Run: `npx tsc --noEmit -p tsconfig.scripts.json`
Expected: No output (clean)

- [ ] **Verify existing tests still pass**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Commit all script fixes**

```bash
git add scripts/
git commit -m "fix: resolve 30 type errors in scripts/ for strict type checking"
```

---

## Task 5: Wire `typecheck:scripts` into the `verify` pipeline

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts to `package.json`**

Add two new scripts and update `verify`:

```jsonc
{
  "scripts": {
    "typecheck": "astro check",
    "typecheck:scripts": "tsc --noEmit -p tsconfig.scripts.json",
    "typecheck:all": "astro check && tsc --noEmit -p tsconfig.scripts.json",
    "verify": "pnpm prebuild && biome check . && pnpm typecheck:all && vitest run --passWithNoTests --exclude 'tests/e2e/**' && pnpm verify:knowledge"
  }
}
```

**What changes in `verify`:** `astro check` → `pnpm typecheck:all` (which runs `astro check` + `tsc --noEmit -p tsconfig.scripts.json`).

- [ ] **Step 2: Run the full verify pipeline**

Run: `pnpm verify`
Expected: All steps pass (lint, typecheck:all, tests, knowledge audit)

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: wire scripts typecheck into verify pipeline"
```

---

## Task 6: Enable Biome `types` domain nursery rules

Add 3 type-aware nursery rules and fix the 3 `noMisusedPromises` violations they surface.

**Files:**
- Modify: `biome.json`
- Modify: `src/components/desktop/apps/TerminalApp.tsx`
- Modify: `src/components/learn/InteractiveExercise.tsx`
- Modify: `src/components/learn/KnowledgeGraph.tsx`

### Step 1: Update `biome.json`

- [ ] **Add `domains` and nursery rules**

In `biome.json`, add `"domains"` to the `"linter"` section and extend the `"nursery"` rules:

```jsonc
// In "linter" section, add at the top level (sibling to "enabled" and "rules"):
"domains": {
  "types": "all"
},

// In "linter.rules.nursery", add alongside existing "useExplicitType":
"noFloatingPromises": "error",
"noMisusedPromises": "error",
"useAwaitThenable": "error"
```

The full nursery section becomes:

```jsonc
"nursery": {
  "useExplicitType": "error",
  "noFloatingPromises": "error",
  "noMisusedPromises": "error",
  "useAwaitThenable": "error"
}
```

**Rules not included:** `noUnsafePlusOperands` (added Biome 2.4.10) and `noUselessTypeConversion` (added Biome 2.4.11) are too new — nursery rules this fresh risk being renamed/removed on the next Biome minor update. Revisit when they graduate from nursery.

- [ ] **Verify biome reports exactly 3 errors**

Run: `npx @biomejs/biome check --formatter-enabled=false --assist-enabled=false . 2>&1 | grep "nursery"`
Expected: 3 `noMisusedPromises` errors in `TerminalApp.tsx`, `InteractiveExercise.tsx`, `KnowledgeGraph.tsx`

### Step 2: Fix `onMount(async ...)` pattern (3 files)

SolidJS `onMount` expects `() => void`. Passing `async () => { ... }` means if the promise rejects, the error is silently swallowed. The fix is to wrap the async body in a self-invoking void promise:

- [ ] **Fix `src/components/desktop/apps/TerminalApp.tsx:156`**

```typescript
// Before:
onMount(async () => {
  // ... async body ...
});

// After:
onMount(() => {
  void (async () => {
    // ... async body unchanged ...
  })();
});
```

- [ ] **Fix `src/components/learn/InteractiveExercise.tsx:82`**

Same pattern — wrap the async IIFE in `void` inside a sync `onMount` callback.

- [ ] **Fix `src/components/learn/KnowledgeGraph.tsx:346`**

Same pattern.

- [ ] **Verify biome passes cleanly**

Run: `npx @biomejs/biome check --formatter-enabled=false --assist-enabled=false . 2>&1 | tail -3`
Expected: `Checked N files in Ns. No fixes applied.` with 0 errors.

- [ ] **Verify existing tests still pass**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Commit**

```bash
git add biome.json src/components/desktop/apps/TerminalApp.tsx src/components/learn/InteractiveExercise.tsx src/components/learn/KnowledgeGraph.tsx
git commit -m "feat: enable Biome types domain with 5 nursery rules, fix noMisusedPromises"
```

---

## Task 7: Eliminate unsafe type assertions

Replace `as X` casts on `JSON.parse()` / `response.json()` with runtime type guards, delete redundant discriminated union casts, and fix remaining unsafe assertion patterns.

**Files:**
- Modify: `src/pages/api/contact.ts`
- Modify: `src/pages/api/flag-article.ts`
- Modify: `src/components/desktop/apps/EmailApp.tsx`
- Modify: `packages/knowledge-engine/src/progress.ts`
- Modify: `scripts/generate-diagrams.ts`
- Modify: `scripts/audit-knowledge.ts`
- Modify: `scripts/review-article.ts`
- Modify: `src/utils/graph-stats.ts`
- Modify: `src/scripts/learn/article-progress.ts`

### Step 1: Create shared type guard utilities

Many guards share the same patterns. Create a small helper:

- [ ] **Add `src/utils/type-guards.ts`**

```typescript
/** Check that a value is a non-null object (not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Check that a value is an array where every element satisfies a predicate. */
export function isArrayOf<T>(value: unknown, predicate: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(predicate);
}
```

- [ ] **Commit**

```bash
git add src/utils/type-guards.ts
git commit -m "feat: add shared type guard utilities"
```

### Step 2: Fix API endpoint assertions (3 files)

- [ ] **Fix `src/pages/api/contact.ts`**

The `ContactBody` has all optional string fields. After `request.json()`, validate the shape:

```typescript
// Before:
body = (await request.json()) as ContactBody;

// After:
const raw: unknown = await request.json();
if (!isRecord(raw)) {
  return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
body = {
  name: typeof raw['name'] === 'string' ? raw['name'] : undefined,
  email: typeof raw['email'] === 'string' ? raw['email'] : undefined,
  subject: typeof raw['subject'] === 'string' ? raw['subject'] : undefined,
  message: typeof raw['message'] === 'string' ? raw['message'] : undefined,
  website: typeof raw['website'] === 'string' ? raw['website'] : undefined,
};
```

Import `isRecord` from `../../utils/type-guards`.

- [ ] **Fix `src/pages/api/flag-article.ts`**

Same pattern — `FlagBody` has `articleId?: string` and `reason?: string`:

```typescript
// Before:
body = (await request.json()) as FlagBody;

// After:
const raw: unknown = await request.json();
if (!isRecord(raw)) {
  return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
body = {
  articleId: typeof raw['articleId'] === 'string' ? raw['articleId'] : undefined,
  reason: typeof raw['reason'] === 'string' ? raw['reason'] : undefined,
};
```

- [ ] **Fix `src/components/desktop/apps/EmailApp.tsx`**

The response shape is `{ ok: boolean; error?: string }`:

```typescript
// Before:
const data = (await res.json()) as { ok: boolean; error?: string };

// After:
const raw: unknown = await res.json();
const data = isRecord(raw) && typeof raw['ok'] === 'boolean'
  ? { ok: raw['ok'], error: typeof raw['error'] === 'string' ? raw['error'] : undefined }
  : { ok: false, error: 'Invalid response' };
```

Import `isRecord` from `../../../utils/type-guards`.

- [ ] **Verify and commit**

Run: `npx tsc --noEmit && pnpm test`
Expected: Clean

```bash
git add src/pages/api/contact.ts src/pages/api/flag-article.ts src/components/desktop/apps/EmailApp.tsx src/utils/type-guards.ts
git commit -m "fix: replace unsafe type assertions with runtime validation in API endpoints"
```

### Step 3: Fix `packages/knowledge-engine/src/progress.ts`

`StoredLearningProgress` has `{ articlesRead?: unknown; modulesCompleted?: unknown }` — the fields are already `unknown`, so the guard just needs to check the outer shape:

- [ ] **Fix the assertion**

```typescript
// Before:
const parsed = JSON.parse(raw) as StoredLearningProgress;

// After:
const rawParsed: unknown = JSON.parse(raw);
if (typeof rawParsed !== 'object' || rawParsed === null) return emptyProgress();
const parsed: StoredLearningProgress = {
  articlesRead: (rawParsed as Record<string, unknown>)['articlesRead'],
  modulesCompleted: (rawParsed as Record<string, unknown>)['modulesCompleted'],
};
```

Alternatively, add a local `isRecord` check (this package must have zero Astro deps, so don't import from `src/utils/`):

```typescript
const rawParsed: unknown = JSON.parse(raw);
if (typeof rawParsed !== 'object' || rawParsed === null || Array.isArray(rawParsed)) {
  return emptyProgress();
}
const obj = rawParsed as Record<string, unknown>;
const parsed: StoredLearningProgress = {
  articlesRead: obj['articlesRead'],
  modulesCompleted: obj['modulesCompleted'],
};
```

**Note:** The `as Record<string, unknown>` after the `typeof === 'object'` guard is structurally safe — we've verified it's a non-null, non-array object. TypeScript doesn't narrow `unknown` to `Record<string, unknown>` automatically after the check, so this single assertion is acceptable as the type-safe bridge.

- [ ] **Verify and commit**

Run: `npx tsc --noEmit && pnpm test`

```bash
git add packages/knowledge-engine/src/progress.ts
git commit -m "fix: replace unsafe JSON.parse assertion in progress module"
```

### Step 4: Fix script-side assertions (3 files)

- [ ] **Fix `scripts/audit-knowledge.ts`**

Add a type guard for `ReviewFlag`:

```typescript
function isReviewFlag(value: unknown): value is ReviewFlag {
  return (
    typeof value === 'object' &&
    value !== null &&
    'articleId' in value &&
    typeof (value as Record<string, unknown>)['articleId'] === 'string' &&
    'flaggedAt' in value &&
    typeof (value as Record<string, unknown>)['flaggedAt'] === 'string'
  );
}

// Then in the map callback:
const parsed: unknown = JSON.parse(content);
if (!isReviewFlag(parsed)) return null;
return parsed;
// Add .filter((f): f is ReviewFlag => f !== null) after .map()
```

- [ ] **Fix `scripts/generate-diagrams.ts`**

The `KnowledgeGraph` type has `{ nodes: GraphNode[], edges: GraphEdge[], metadata: GraphMetadata }`. For a build-time script reading its own generated JSON, a lightweight guard is sufficient:

```typescript
// Before:
const graph = JSON.parse(graphJson) as KnowledgeGraph;

// After:
const parsed: unknown = JSON.parse(graphJson);
if (
  typeof parsed !== 'object' ||
  parsed === null ||
  !('nodes' in parsed) ||
  !('edges' in parsed) ||
  !('metadata' in parsed)
) {
  throw new Error('Invalid knowledge graph JSON — missing required fields');
}
const graph = parsed as KnowledgeGraph;
```

**Note:** After the structural `in` checks, the `as KnowledgeGraph` is narrowed to a known-good shape. Full deep validation of `GraphNode[]` would be overkill for a build-time script consuming its own output.

- [ ] **Fix `scripts/review-article.ts` lines 238 and 221**

Line 238 (`JSON.parse` as `Record<string, unknown>`): add a `typeof/null` guard before the cast.

Line 221 (`result as Record<string, unknown>`): refactor `extractDimensionField` to avoid the cast. Instead of mutating `result` through an index signature cast, assign the field directly:

```typescript
// Before:
(result as Record<string, unknown>)[field] = value.filter(...);

// After — in the caller, assign the known field:
result[field] = value.filter(...);
// This requires typing `result` as having optional string[] fields.
// Since DimensionResult already has these optional fields (issues?, suggestedImprovements?, etc.),
// narrow `field` to the correct key type and assign directly.
```

Read the `extractDimensionField` function signature and `DimensionResult` type to determine the cleanest refactor.

Line 262 (`key as ReviewDimension`): replace with a set-based guard:

```typescript
const REVIEW_DIMENSIONS = new Set<string>(['grounding', 'depth', 'coverage', 'exerciseQuality', 'referenceQuality']);

function isReviewDimension(key: string): key is ReviewDimension {
  return REVIEW_DIMENSIONS.has(key);
}

// Then:
if (!isReviewDimension(key)) continue;
const dim = dimensions[key];
```

Line 298 (`results as QualityReport['dimensions']`): the `results` variable is `Partial<QualityReport['dimensions']>` and by the time we reach line 298, all 5 dimensions have been assigned. Assert with a runtime check:

```typescript
// Before:
const allDimensions = results as QualityReport['dimensions'];

// After:
const missingDims = dimensions.filter((d) => !(d in results));
if (missingDims.length > 0) {
  throw new Error(`Missing review dimensions: ${missingDims.join(', ')}`);
}
const allDimensions = results as QualityReport['dimensions'];
```

This keeps the `as` but makes it **guarded** — the assertion is now backed by a runtime check.

- [ ] **Verify and commit**

Run: `npx tsc --noEmit -p tsconfig.scripts.json && pnpm test`

```bash
git add scripts/audit-knowledge.ts scripts/generate-diagrams.ts scripts/review-article.ts
git commit -m "fix: replace unsafe type assertions with runtime validation in scripts"
```

### Step 5: Delete redundant discriminated union casts (1 file)

- [ ] **Fix `src/utils/graph-stats.ts`**

All 4 casts are inside `if (n.type === '...')` blocks where TypeScript already narrows the `GraphNode` discriminated union. Simply delete the `as` casts:

```typescript
// Line 107 — Before:
const cat = (n as ArticleNode).category;
// After:
const cat = n.category;

// Line 206 — Before:
moduleLabels.set(n.id, (n as ModuleNode).label);
// After:
moduleLabels.set(n.id, n.label);

// Line 236 — Before:
techNodes.push({ slug: n.id.replace('tech:', ''), label: (n as TechnologyNode).label });
// After:
techNodes.push({ slug: n.id.replace('tech:', ''), label: n.label });

// Line 242 — Before:
if (n.type === 'article' && (n as ArticleNode).category === 'technology') {
// After — split the check so TS narrows before accessing .category:
if (n.type === 'article') {
  if (n.category === 'technology') {
```

**Note:** Line 242 has both the type check and the property access in one `&&` expression. TypeScript narrows on the left side of `&&` for the right side, so `n.type === 'article' && n.category === 'technology'` should work directly. Test this — if TS doesn't narrow across `&&` in this case, use the nested `if` form.

- [ ] **Verify and commit**

Run: `npx tsc --noEmit && pnpm test`

```bash
git add src/utils/graph-stats.ts
git commit -m "fix: remove redundant discriminated union type assertions"
```

### Step 6: Fix dataset attribute assertions (1 file)

- [ ] **Fix `src/scripts/learn/article-progress.ts`**

The `button.dataset[DATA_PROGRESS_STAGE] as MasteryStage | undefined` trusts that HTML `data-*` attributes contain valid mastery stages. Validate against known values:

```typescript
const MASTERY_STAGES = new Set<string>(['read', 'checked', 'practiced', 'mastered']);

function isMasteryStage(value: string | undefined): value is MasteryStage {
  return value !== undefined && MASTERY_STAGES.has(value);
}

// Line 63 — Before:
const buttonStage = button.dataset[DATA_PROGRESS_STAGE] as MasteryStage | undefined;
// After:
const buttonStageRaw = button.dataset[DATA_PROGRESS_STAGE];
if (!isMasteryStage(buttonStageRaw)) return;
const buttonStage = buttonStageRaw;

// Line 81 — same pattern:
const nextStageRaw = button.dataset[DATA_PROGRESS_STAGE];
if (!isMasteryStage(nextStageRaw)) return;
const nextStage = nextStageRaw;
```

- [ ] **Verify and commit**

Run: `npx tsc --noEmit && pnpm test`

```bash
git add src/scripts/learn/article-progress.ts
git commit -m "fix: validate dataset mastery stage values at runtime"
```

---

## Task 8: Eliminate DOM event handler casts with SolidJS type inference

SolidJS's JSX event handler types already provide correctly-typed `e.currentTarget` (as the element type) and `e.target` (as `Element`, or the specific element for `InputEventHandler`). Currently, all event handlers are typed with raw DOM event types (`PointerEvent`, `InputEvent`), losing SolidJS's augmentation and forcing `as HTMLElement` casts everywhere.

This task covers the straightforward cases. Window.tsx (8 casts in drag/resize) and ExplorerCanvas.tsx (4 casts in SVG panning) are deferred to a separate PR — they touch complex interaction code and need careful testing.

**Files:**
- Modify: `src/components/desktop/apps/EmailApp.tsx`
- Modify: `src/components/desktop/Desktop.tsx`
- Modify: `src/components/desktop/DesktopIcon.tsx`

### Step 1: Fix EmailApp.tsx input handler casts (5 casts)

SolidJS's `InputEventHandler<HTMLInputElement, InputEvent>` types `e.target` as `HTMLInputElement` when the handler is on an `<input>`. The explicit `(e: InputEvent)` annotation overrides this inference. Simply remove the annotation to let SolidJS infer correctly.

- [ ] **Remove explicit event type annotations from inline input handlers**

```tsx
// Before (5 instances like this):
onInput={(e: InputEvent) => setEmail((e.target as HTMLInputElement).value)}

// After — remove annotation, remove cast:
onInput={(e) => setEmail(e.target.value)}
```

Apply to all 4 `onInput` handlers (email, name, subject, honeypot) and the 1 `onChange` handler on the `<select>` (font size):

```tsx
// Before (select):
onChange={(e: Event) => {
  const val = (e.target as HTMLSelectElement).value;
  if (val) execFormat('fontSize', val);
}}

// After:
onChange={(e) => {
  const val = e.target.value;
  if (val) execFormat('fontSize', val);
}}
```

**Why this works:** SolidJS's `ChangeEventHandler<HTMLSelectElement>` types `e.target` as `HTMLSelectElement` because the handler is on a `<select>` element.

- [ ] **Verify and commit**

Run: `npx tsc --noEmit && npx @biomejs/biome check .`
Expected: Clean

```bash
git add src/components/desktop/apps/EmailApp.tsx
git commit -m "fix: remove redundant DOM event casts in EmailApp using SolidJS type inference"
```

### Step 2: Fix Desktop.tsx event handler cast (1 cast)

- [ ] **Replace `e.target as HTMLElement` with `instanceof` narrowing**

```typescript
// Before:
const handleDesktopClick = (e: MouseEvent): void => {
  const target = e.target as HTMLElement;
  if (state.startMenuOpen) {
    const isStartBtn = target.closest('.taskbar__start-btn');
    // ...
  }
};

// After:
const handleDesktopClick: JSX.EventHandler<HTMLDivElement, MouseEvent> = (e) => {
  if (state.startMenuOpen) {
    if (e.target instanceof HTMLElement) {
      const isStartBtn = e.target.closest('.taskbar__start-btn');
      const isStartMenu = e.target.closest('.start-menu');
      if (!(isStartBtn || isStartMenu)) {
        actions.closeStartMenu();
      }
    }
  }

  if (state.selectedDesktopIcon !== null) {
    if (e.target instanceof HTMLElement) {
      const isIcon = e.target.closest('.desktop-icon');
      if (!isIcon) {
        actions.selectDesktopIcon(null);
      }
    }
  }
};
```

Add `import type { JSX } from 'solid-js';` if not already present.

- [ ] **Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/desktop/Desktop.tsx
git commit -m "fix: replace HTMLElement cast with instanceof narrowing in Desktop.tsx"
```

### Step 3: Fix DesktopIcon.tsx event handler casts (2 casts)

- [ ] **Retype `handlePointerDown` and `handlePointerUp`**

```typescript
import type { JSX } from 'solid-js';

// Before:
const handlePointerDown = (e: PointerEvent): void => {
  // ...
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);
};

// After:
const handlePointerDown: JSX.EventHandler<HTMLButtonElement, PointerEvent> = (e) => {
  // ...
  e.currentTarget.setPointerCapture(e.pointerId);  // typed as HTMLButtonElement
};
```

Same for `handlePointerUp`:
```typescript
const handlePointerUp: JSX.EventHandler<HTMLButtonElement, PointerEvent> = (e) => {
  if (!isDragging) return;
  isDragging = false;
  e.currentTarget.releasePointerCapture(e.pointerId);
  // ...
};
```

**Note:** `handlePointerMove` doesn't use `e.currentTarget` or `e.target` (it uses `elementRef` directly), so it can stay as `(e: PointerEvent): void`.

- [ ] **Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/desktop/DesktopIcon.tsx
git commit -m "fix: replace HTMLElement casts with SolidJS event handler types in DesktopIcon.tsx"
```

---

## Task 9: Eliminate Cytoscape double casts in KnowledgeGraph.tsx

The `as unknown as Record<string, unknown>` double-cast pattern completely erases type checking. Cytoscape's `NodeDataDefinition` has `[key: string]: any`, so custom data fields are accepted directly.

**Files:**
- Modify: `src/components/learn/KnowledgeGraph.tsx`

### Step 1: Remove data double casts

- [ ] **Remove `as unknown as Record<string, unknown>` from node/edge data**

Cytoscape's `NodeDataDefinition` extends `ElementDataDefinition` with `[key: string]: any`. Our `CyNodeData` and `CyEdgeData` are subtypes — they have concrete typed fields that satisfy the index signature.

```typescript
// Before (lines 366, 371):
elements: [
  ...elements.nodes.map((n) => ({
    group: 'nodes' as const,
    data: n.data as unknown as Record<string, unknown>,
    classes: n.classes,
  })),
  ...elements.edges.map((e) => ({
    group: 'edges' as const,
    data: e.data as unknown as Record<string, unknown>,
  })),
] as cytoscape.ElementDefinition[],

// After — pass data directly, use proper ElementDefinition[] typing:
elements: [
  ...elements.nodes.map((n): cytoscape.NodeDefinition => ({
    group: 'nodes',
    data: n.data,
    classes: n.classes,
  })),
  ...elements.edges.map((e): cytoscape.EdgeDefinition => ({
    group: 'edges',
    data: e.data,
  })),
],
```

**If TypeScript still complains about `CyNodeData` → `NodeDataDefinition` assignability** (e.g., due to strict excess-property checks or `null` vs `undefined` mismatches in optional fields), the fallback is to spread into a compatible shape:
```typescript
data: { ...n.data },
```
Spreading creates a fresh object literal inferred as `{ [key: string]: ... }` which satisfies the index signature.

### Step 2: Downgrade stylesheet double cast to single cast

- [ ] **Replace `as unknown as` with a single structural cast**

```typescript
// Before (line 374):
style: buildStylesheet() as unknown as cytoscape.StylesheetJson,

// After — single cast, TS still checks structural compatibility:
style: buildStylesheet() as cytoscape.Stylesheet[],
```

Cytoscape's CSS types use a complex `Css.Node | Css.Edge | Css.Core` union that doesn't cleanly match `Record<string, unknown>`. A single `as` is an acceptable pragmatic cast here — what matters is eliminating the `as unknown as` double cast that erases all type checking.

- [ ] **Verify and commit**

Run: `npx tsc --noEmit && pnpm test`

```bash
git add src/components/learn/KnowledgeGraph.tsx
git commit -m "fix: remove unsafe double casts in KnowledgeGraph.tsx cytoscape initialization"
```

---

## Task 10: Simplify registry component type

SolidJS's `lazy<T extends Component<any>>()` returns `T & { preload: ... }`, which is a subtype of `Component`. The union type `Component | ReturnType<typeof lazy>` is redundant — `lazy()` already produces a `Component`.

**Files:**
- Modify: `src/components/desktop/store/types.ts`
- Modify: `src/components/desktop/apps/registry.ts`

- [ ] **Step 1: Simplify `component` field in `AppRegistryEntry`**

```typescript
// Before (src/components/desktop/store/types.ts):
export interface AppRegistryEntry {
  // ...
  component: Component | ReturnType<typeof import('solid-js')['lazy']>;
  // ...
}

// After:
export interface AppRegistryEntry {
  // ...
  component: Component;
  // ...
}
```

- [ ] **Step 2: Remove the cast in `resolveAppComponent`**

```typescript
// Before (src/components/desktop/apps/registry.ts):
export function resolveAppComponent(appId: string): Component | undefined {
  return APP_REGISTRY[appId]?.component as Component | undefined;
}

// After — cast is no longer needed:
export function resolveAppComponent(appId: string): Component | undefined {
  return APP_REGISTRY[appId]?.component;
}
```

- [ ] **Step 3: Verify all app registrations still type-check**

Run: `npx tsc --noEmit`
Expected: Clean — `lazy()` returns `Component & { preload }`, which is assignable to `Component`.

- [ ] **Commit**

```bash
git add src/components/desktop/store/types.ts src/components/desktop/apps/registry.ts
git commit -m "fix: simplify AppRegistryEntry component type, remove redundant cast"
```

---

## Task 11: Enforce type assertion discipline (lint rules + policy)

Prevent future `as` casts from creeping back in. Biome 2.x doesn't have a `noTypeAssertion` rule yet, so we close the two related escape hatches via lint escalation and document the `as` policy in AGENTS.md for code review and AI agents.

**Files:**
- Modify: `biome.json`

### Step 1: Escalate Biome lint rules to `error`

- [ ] **Upgrade `noNonNullAssertion` and `noExplicitAny` to error severity**

These are currently at `warn` (Biome's recommended default). Escalate them so they block CI:

```jsonc
// In biome.json → linter.rules.style, add:
"noNonNullAssertion": "error"

// In biome.json → linter.rules.suspicious, add:
"noExplicitAny": "error"
```

These catch the two related type-system escape hatches: `value!` (non-null assertion) and `value: any` (explicit any). Combined with code review discipline for `as` casts, all three bypass mechanisms are covered.

- [ ] **Verify biome still passes**

Run: `npx @biomejs/biome check .`
Expected: Clean (the codebase already has zero `any` types and only 1 `!` assertion in a test file — if that one surfaces, fix it with a guard).

- [ ] **Commit**

```bash
git add biome.json
git commit -m "chore: escalate noNonNullAssertion and noExplicitAny to error"
```

### Step 2: Document the policy in AGENTS.md

- [ ] **Add a rule to the "Non-discoverable rules" section of AGENTS.md**

Add the following after the "TypeScript strictness" rule:

```markdown
### No `as X` type assertions
Do not use `as` type assertions (type casts). They bypass the type checker and hide bugs. Instead:
- Use **type guards** (`value is T` predicates) for `JSON.parse`, `fetch().json()`, `localStorage` data.
- Use **`instanceof`** narrowing for DOM event targets (`e.target instanceof HTMLElement`).
- Use **SolidJS JSX event handler types** (`JSX.EventHandler<HTMLDivElement, PointerEvent>`) for extracted event handlers — these type `e.currentTarget` correctly.
- Use **discriminated union narrowing** — check the `type` field and let TypeScript narrow automatically.
- `as const` is fine — it's a narrowing tool, not a cast.
- In rare cases, an `as` cast is acceptable when the cost of removing it is worse than keeping it (e.g., build-time data from typed Astro content collections where the shape is guaranteed by the build pipeline, or dynamic `import()` of `.ts` modules in build scripts). When leaving an `as` cast, add a brief comment explaining why the tradeoff favors keeping it.
```

- [ ] **Commit**

```bash
git add AGENTS.md
git commit -m "docs: add no-type-assertion policy to AGENTS.md"
```

---

## Task 12: Final verification

- [ ] **Run the full `pnpm verify` pipeline**

Run: `pnpm verify`
Expected: All steps pass — lint (biome), typecheck:all (astro check + scripts tsc), unit tests, knowledge audit.

- [ ] **Run e2e tests**

Run: `pnpm test:e2e`
Expected: All pass. The event handler retyping and `onMount` wrapping are no-op changes at runtime — same behavior, just better types.

- [ ] **Final commit and squash if desired**

```bash
git log --oneline -10
```

Verify the commit history is clean. The commits from this plan are:

1. `chore: add tsconfig.base.json with strictest shared flags`
2. `refactor: root tsconfig extends tsconfig.base.json`
3. `chore: knowledge-engine tsconfig extends shared base with strictest flags`
4. `chore: add tsconfig.scripts.json for scripts type checking`
5. `fix: resolve 30 type errors in scripts/ for strict type checking`
6. `chore: wire scripts typecheck into verify pipeline`
7. `feat: enable Biome types domain with 3 nursery rules, fix noMisusedPromises`
8. `feat: add shared type guard utilities`
9. `fix: replace unsafe type assertions with runtime validation in API endpoints`
10. `fix: replace unsafe JSON.parse assertion in progress module`
11. `fix: replace unsafe type assertions with runtime validation in scripts`
12. `fix: remove redundant discriminated union type assertions`
13. `fix: validate dataset mastery stage values at runtime`
14. `fix: remove redundant DOM event casts in EmailApp using SolidJS type inference`
15. `fix: replace HTMLElement cast with instanceof narrowing in Desktop.tsx`
16. `fix: replace HTMLElement casts with SolidJS event handler types in DesktopIcon.tsx`
17. `fix: remove unsafe double casts in KnowledgeGraph.tsx cytoscape initialization`
18. `fix: simplify AppRegistryEntry component type, remove redundant cast`
19. `chore: escalate noNonNullAssertion and noExplicitAny to error`
20. `docs: add no-type-assertion policy to AGENTS.md`

---

## Summary of coverage after this plan

| Zone | Before | After |
|---|---|---|
| `src/` (42 files) | ✅ `astro check` strictest | ✅ `astro check` strictest (unchanged) |
| `packages/knowledge-engine/` (12 files) | ⚠️ checked by root but own tsconfig weak | ✅ own tsconfig extends `tsconfig.base.json` strictest |
| `tests/e2e/` (14 files) | ✅ checked by root tsconfig | ✅ checked by root tsconfig (unchanged) |
| `scripts/` (14 files) | ❌ **not checked at all** | ✅ `tsc -p tsconfig.scripts.json` strictest |
| Biome type-aware linting | ❌ disabled | ✅ 3 nursery rules (`types` domain) |
| Unsafe `as X` assertions | ~65 unvalidated casts | ✅ ~15 remaining (accepted: build-time data, dynamic imports, test factories, complex interaction handlers — deferred to separate PR), all others replaced with type guards, `instanceof`, SolidJS JSX types, or discriminated union narrowing |
| `!` non-null assertions | ⚠️ `warn` | ✅ `error` |
| `any` types | ⚠️ `warn` | ✅ `error` |
| `pnpm verify` enforces | lint + astro check + tests | lint + astro check + **scripts tsc** + tests |
