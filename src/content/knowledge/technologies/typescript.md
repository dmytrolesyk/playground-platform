---
title: "TypeScript — Type Safety Without a Build Step"
category: technology
summary: "How this project uses TypeScript with Astro's strictest config, native Node.js type stripping for scripts, and Zod for runtime validation."
difficulty: beginner
prefLabel: "TypeScript"
altLabels:
  - "TS"
  - "typed JavaScript"
  - "TypeScript language"
  - ".ts files"
relatedConcepts:
  - cs-fundamentals/type-systems
  - concepts/module-systems-and-bundling
relatedFiles:
  - tsconfig.json
  - src/content.config.ts
  - scripts/audit-knowledge.ts
  - scripts/build-knowledge-graph.ts
  - src/components/desktop/store/desktop-store.ts
  - src/components/desktop/apps/app-manifest.ts
technologies:
  - typescript
order: 4
dateAdded: 2026-04-23
lastUpdated: 2026-04-24
externalReferences:
  - title: "TypeScript Official Documentation"
    url: "https://www.typescriptlang.org/docs/"
    type: docs
  - title: "Node.js — Running TypeScript Natively"
    url: "https://nodejs.org/en/learn/typescript/run-natively"
    type: docs
  - title: "Astro TypeScript Guide"
    url: "https://docs.astro.build/en/guides/typescript/"
    type: docs
  - title: "TypeScript GitHub Repository"
    url: "https://github.com/microsoft/TypeScript"
    type: repo
  - title: "Matt Pocock — Total TypeScript"
    url: "https://www.totaltypescript.com/"
    type: article
  - title: "Typescript — Astro Docs"
    url: "https://docs.astro.build/en/guides/typescript/#strict"
    type: docs
  - title: "Tsconfig — TypeScript"
    url: "https://www.typescriptlang.org/tsconfig/#strict"
    type: docs
  - title: "Release Notes — Node.js"
    url: "https://nodejs.org/en/blog/release/v22.6.0"
    type: article
  - title: "Zod Documentation"
    url: "https://zod.dev/?id=zod-enums"
    type: docs
  - title: "Zod Documentation"
    url: "https://zod.dev/"
    type: docs
  - title: "Env and mode — Vite"
    url: "https://vite.dev/guide/env-and-mode"
    type: docs
module: foundation
moduleOrder: 5
estimatedMinutes: 15
prerequisites:
  - cs-fundamentals/type-systems
learningObjectives:
  - "Explain how TypeScript's structural type system differs from nominal typing and why it matters for this codebase"
  - "Describe the two different TypeScript execution paths in this project: Astro/Vite compilation and Node.js type stripping"
  - "Use Zod schemas to bridge the gap between compile-time types and runtime validation"
exercises:
  - question: "The project runs scripts with `node --experimental-strip-types scripts/audit-knowledge.ts`. What happens to the type annotations at runtime? What would break if a script used `enum` or `namespace`?"
    type: predict
    hint: "Type stripping is literal removal of type syntax, not full compilation."
    answer: "Node.js type stripping literally removes type annotations from the source before executing it as JavaScript. The engine never sees TypeScript — it sees `const x = 5` instead of `const x: number = 5`. This means TypeScript-only runtime constructs like `enum` (which generates JavaScript code) and `namespace` (which creates runtime objects) would fail because the stripper doesn't generate code, it only removes syntax. The project avoids these constructs entirely, using `as const` objects instead of enums and ES modules instead of namespaces."
  - question: "Open `tsconfig.json` and note that it extends `astro/tsconfigs/strictest`. Then open `src/content.config.ts` and find a Zod schema. Why does the project need BOTH TypeScript's compile-time types AND Zod's runtime validation for content collections?"
    type: do
    hint: "Think about when each check runs and what data sources they validate."
    answer: "TypeScript types are erased at compile time — they verify that YOUR code is self-consistent but can't validate external data (Markdown frontmatter, API responses, user input). Zod schemas run at build time when Astro processes content collections, catching real data errors like a missing `title` field or an invalid `category` value in a Markdown file. The project needs both: TypeScript ensures the code that processes data is type-safe, while Zod ensures the data itself is valid. This is why `content.config.ts` defines Zod schemas that mirror the TypeScript types — they're the runtime enforcement layer."
  - question: "Why does the project set `verbatimModuleSyntax: true` in tsconfig.json instead of using the older `isolatedModules` flag alone?"
    type: explain
    answer: "The `verbatimModuleSyntax` flag enforces that imports and exports are written exactly as they should appear in the output JavaScript. With this flag, you must use `import type { Foo }` for type-only imports — a bare `import { Foo }` that resolves to a type is a compile error. This prevents a subtle bug where a type import looks like a value import and either causes runtime errors (the import resolves to `undefined`) or prevents tree-shaking (the bundler keeps the import because it looks like a value). The flag replaces the weaker `isolatedModules` guarantee with a stricter contract: what you write is what you get."
---

## Why Should I Care?

Every file in this project is [TypeScript](https://www.typescriptlang.org/docs/) — `.ts` for scripts, `.tsx` for SolidJS components, `.astro` for pages and layouts. But TypeScript isn't used in a single way. The same codebase has **two completely different TypeScript execution paths**: Astro's Vite-based compilation for the web app, and Node.js native [type stripping](https://nodejs.org/en/learn/typescript/run-natively) for build scripts. Understanding how each path works — and where TypeScript's guarantees end — is essential for avoiding subtle bugs that the compiler can't catch. [Total TypeScript](https://www.totaltypescript.com/) and the [TypeScript repository](https://github.com/microsoft/TypeScript) are valuable learning resources.

## The Strictest Config

The project's `tsconfig.json` extends [`astro/tsconfigs/strictest`](https://docs.astro.build/en/guides/typescript/#strict), which enables every strict flag TypeScript offers:

```json
{
  "extends": ["./tsconfig.base.json", "astro/tsconfigs/strictest"],
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "jsxImportSource": "solid-js"
  }
}
```

The `strictest` preset includes `strict: true` (which enables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and more), plus additional flags like `noUncheckedIndexedAccess` — meaning every `array[index]` or `record[key]` access returns `T | undefined`, forcing explicit null checks. This is TypeScript's [strict mode](https://www.typescriptlang.org/tsconfig/#strict) taken to its maximum.

The project rule is clear: **if the compiler complains, fix the code — do not loosen the config.** This strictness catches real bugs. For example, `noUncheckedIndexedAccess` prevents a common pattern where `windows[id].x` silently accesses a property on `undefined` when the window ID doesn't exist.

```mermaid
flowchart TD
    A[tsconfig.json] -->|extends| B["astro/tsconfigs/strictest"]
    B --> C["strict: true"]
    B --> D["noUncheckedIndexedAccess"]
    B --> E["exactOptionalPropertyTypes"]
    A --> F["verbatimModuleSyntax"]
    A --> G["jsx: preserve + solid-js"]
    
    C --> H["All strict* flags enabled"]
    D --> I["array[i] returns T | undefined"]
    F --> J["import type enforced"]
```

## Two Execution Paths

### Path 1: Astro + Vite (Web Application)

When you run `pnpm build` or `pnpm dev`, [Astro delegates to Vite](https://docs.astro.build/en/guides/typescript/), which uses esbuild to strip types from `.ts` and `.tsx` files as part of its transform pipeline. Vite doesn't type-check — it just removes type syntax at high speed. Type checking is a separate step via `astro check` (which runs `tsc` under the hood).

This path handles all of `src/` — components, pages, layouts, stores, and the content config. SolidJS JSX is compiled by `vite-plugin-solid`, which transforms reactive JSX expressions into direct DOM creation calls. The `jsxImportSource: "solid-js"` in tsconfig tells the compiler to use SolidJS's JSX types instead of React's.

### Path 2: Node.js Type Stripping (Build Scripts)

Scripts in `scripts/` run directly with Node.js using the [`--experimental-strip-types`](https://nodejs.org/en/learn/typescript/run-natively) flag:

```bash
node --experimental-strip-types scripts/audit-knowledge.ts
```

This is a fundamentally different execution path. Node.js doesn't use Vite or esbuild — since Node.js 22, it has [built-in type stripping](https://nodejs.org/en/blog/release/v22.6.0) that removes TypeScript syntax before the V8 engine executes the code. No compilation step, no intermediate `.js` files, no `outDir`.

The key limitation: type stripping is **syntactic removal only**. It removes `: string`, `interface Foo {}`, and `as Type` — anything that's purely type syntax. It cannot handle TypeScript constructs that generate runtime code:

| Construct | Works with strip? | Why |
|---|---|---|
| Type annotations (`: string`) | ✅ | Pure syntax, removed cleanly |
| Interfaces / type aliases | ✅ | Pure syntax |
| `as const` assertions | ✅ | Removed, value unchanged |
| `enum` | ❌ | Generates runtime JavaScript object |
| `namespace` | ❌ | Generates runtime IIFE |
| `const enum` | ❌ | Requires compilation to inline values |
| Parameter properties | ❌ | Requires constructor code generation |

The project avoids all unsupported constructs. Instead of `enum Category { Architecture, Concept }`, it uses a [Zod enum](https://zod.dev/?id=zod-enums): `z.enum(['architecture', 'concept', ...])` — which is a runtime value that also provides type inference.

## Zod: Where Compile-Time Meets Runtime

TypeScript types disappear at runtime — they can't validate data that arrives from outside your code (Markdown files, API requests, environment variables). [Zod](https://zod.dev/) fills this gap by defining schemas that validate at runtime and infer TypeScript types at compile time.

The project's `src/content.config.ts` defines Zod schemas for every content collection. Here's a simplified view of the knowledge article schema:

```typescript
const knowledgeSchema = z.object({
  title: z.string(),
  category: z.enum(['architecture', 'concept', 'technology', 'feature', 'cs-fundamentals', 'lab']),
  technologies: z.array(z.string()).optional(),
  exercises: z.array(exerciseSchema).min(2),
  // ... 20+ fields
});
```

When Astro processes content collections at build time, each Markdown file's frontmatter is validated against this schema. A missing required field or invalid enum value produces a clear error message at build time — not a mysterious runtime crash.

The type inference flows in one direction: `z.infer<typeof knowledgeSchema>` extracts a TypeScript type from the Zod schema, ensuring the compile-time type and runtime validation are always synchronized. You never define the type separately — the schema is the single source of truth.

## TypeScript in Component Code

SolidJS components use TypeScript for props typing, store shape definition, and discriminated unions. The desktop store in `desktop-store.ts` is a good example of TypeScript enabling safe state management:

```typescript
interface DesktopState {
  windows: Record<string, WindowState>;
  windowOrder: string[];
  nextZIndex: number;
  startMenuOpen: boolean;
  selectedDesktopIcon: string | null;
  isMobile: boolean;
}
```

With `noUncheckedIndexedAccess`, accessing `state.windows[id]` returns `WindowState | undefined`, forcing every call site to handle the "window not found" case. This prevents an entire category of bugs where code assumes a window exists.

The app registry uses TypeScript's discriminated unions pattern through Zod-validated manifest types, ensuring that every registered app has the required fields and that the type system catches missing properties at compile time.

## Scripts and the Audit Pipeline

The audit scripts in `scripts/knowledge-audit/` demonstrate TypeScript's value in a non-UI context. The audit pipeline defines typed interfaces for its input, rules, and output:

```typescript
// scripts/knowledge-audit/types.ts
interface KnowledgeAuditInput {
  articles: KnowledgeArticle[];
  modules: CurriculumModule[];
  architectureNodeIds: string[];
}

type AuditSeverity = 'error' | 'warning';

interface KnowledgeAuditIssue {
  severity: AuditSeverity;
  code: AuditRuleCode;
  articleId: string;
  message: string;
}
```

Each audit rule is a pure function: `(input: KnowledgeAuditInput) => KnowledgeAuditIssue[]`. TypeScript ensures every rule returns properly structured issues, and the `AuditRuleCode` union type ensures no rule uses an unregistered code. Adding a new rule requires adding its code to the union — the compiler then flags every switch/match that doesn't handle it.

## Gotchas

**`import.meta.env` is build-time only.** Vite inlines ALL `import.meta.env` values during build — not just `PUBLIC_*` prefixed ones. In Docker/CI where secrets aren't present at build time, they become empty strings. Server-side code must use `process.env` for runtime secrets. This is a [Vite behavior](https://vite.dev/guide/env-and-mode), not a TypeScript issue, but TypeScript doesn't warn about it because both access patterns type-check.

**Type stripping doesn't type-check.** Neither Vite's esbuild transform nor Node.js type stripping actually run the type checker. They just remove type syntax. Type checking only happens when you explicitly run `astro check` or `tsc`. The `pnpm verify` command runs `astro check` as part of its pipeline, but if you skip verification, type errors won't be caught.

**`exactOptionalPropertyTypes` changes fixture design.** With this flag on, `foo?: string` does **not** mean “`foo` may be the string `undefined`.” It means the property may be omitted entirely. This shows up most often in tests and parsed data: if an optional field is missing, omit it from the object instead of writing `foo: undefined`. The payoff is real signal at API and content boundaries, where “missing” and “present but undefined” should not silently collapse into the same thing.
