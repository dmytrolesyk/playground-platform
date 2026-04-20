---
title: "From Markdown to Screen"
category: architecture
summary: "The complete data pipeline — how Markdown files become pre-rendered HTML available to client-side components."
difficulty: beginner
relatedConcepts:
  - concepts/islands-architecture
  - concepts/progressive-enhancement
  - concepts/module-systems-and-bundling
relatedFiles:
  - src/content.config.ts
  - src/content/cv/
  - src/pages/index.astro
  - src/components/desktop/apps/cv-data.ts
  - src/components/desktop/apps/BrowserApp.tsx
  - src/content/knowledge/
  - src/pages/learn/index.astro
  - src/pages/learn/[...slug].astro
technologies:
  - astro
order: 5
dateAdded: 2026-04-20
lastUpdated: 2026-04-20
externalReferences:
  - title: "Astro Content Collections"
    url: "https://docs.astro.build/en/guides/content-collections/"
    type: docs
  - title: "Zod — TypeScript-first schema validation"
    url: "https://zod.dev/"
    type: docs
  - title: "Astro Data Fetching"
    url: "https://docs.astro.build/en/guides/data-fetching/"
    type: docs
  - title: "innerHTML and XSS Security"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML"
    type: docs
---

## Why Should I Care?

The most common question about this codebase is: "How does the CV content get from Markdown files into the Win95 browser window?" The answer reveals a design pattern that eliminates an entire class of problems — runtime Markdown parsing, client-side bundle bloat, XSS vulnerabilities from dynamic content, and loading-state complexity.

The same pipeline powers both the CV viewer and the knowledge base, so understanding it once explains two features.

## The Complete Pipeline

Content goes through four stages, each at a different time. No stage has access to the artifacts of a later stage — it's a strict forward pipeline:

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant FS as Filesystem
    participant Astro as Astro Build
    participant Zod as Zod Validator
    participant HTML as HTML Page
    participant Client as SolidJS Client

    Dev->>FS: Write Markdown + frontmatter
    FS->>Astro: Content collection glob reads files
    Astro->>Zod: Validate frontmatter against schema
    Zod-->>Astro: ✓ Valid (or ✗ Build fails)
    Astro->>Astro: Render Markdown → HTML string
    Astro->>HTML: Serialize as script#cv-data JSON
    HTML->>Client: Browser loads static page
    Client->>Client: JSON.parse(script tag content)
    Client->>Client: Render via innerHTML
```

### Stage 1: Authoring (Developer Time)

Markdown files with YAML frontmatter live in `src/content/cv/`:

```markdown
---
title: "Work Experience"
order: 2
---

## Senior Frontend Engineer — Acme Corp
*2022–Present*

Built the widget system using React and TypeScript...
```

Each CV section is a separate file with two required frontmatter fields: `title` (display name) and `order` (sequence in the rendered CV). This separation means sections are independently editable and reorderable without touching other content.

### Stage 2: Validation (Build Time)

Astro's content collections validate every file against a Zod schema defined in `src/content.config.ts`:

```typescript
const cv = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cv' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});
```

If a file has a missing `title`, a non-numeric `order`, or unexpected fields, **the build fails**. This is a compile-time guarantee: if the build succeeds, every content file conforms to the schema. No runtime validation needed. No "undefined is not an object" errors when rendering.

### Stage 3: Rendering (Build Time)

In `src/pages/index.astro`, the collection is fetched, sorted by order, and each entry's Markdown is rendered to HTML:

```typescript
const cvSections = ((await getCollection('cv')) as CvEntry[]).sort(
  (a, b) => a.data.order - b.data.order,
);
const cvData = cvSections.map((section) => ({
  slug: section.id,
  title: section.data.title,
  html: section.rendered?.html ?? section.body ?? '',
}));
```

The resulting array of `{ slug, title, html }` objects is serialized into the page as a JSON script tag:

```html
<script type="application/json" id="cv-data">
  [{"slug":"summary","title":"Summary","html":"<p>Experienced...</p>"},
   {"slug":"experience","title":"Work Experience","html":"<h2>Senior..."}]
</script>
```

### Stage 4: Display (Client Time)

The `BrowserApp` component in `src/components/desktop/apps/BrowserApp.tsx` reads this JSON from the DOM:

```typescript
const [sections, setSections] = createSignal<CvSection[]>([]);
onMount(() => setSections(loadCvData()));

// loadCvData reads from the DOM:
function loadCvData(): CvSection[] {
  const el = document.getElementById('cv-data');
  return JSON.parse(el?.textContent ?? '[]');
}
```

Each section's HTML is rendered with `innerHTML`:

```tsx
{sections().map((section: CvSection) => (
  <div class="browser-section" innerHTML={section.html} />
))}
```

This is **zero runtime Markdown processing**. The client receives pre-rendered HTML. No Markdown parser in the bundle, no WASM module, no processing delay.

## innerHTML Security: Why It's Safe Here

Using `innerHTML` is normally a red flag for XSS (Cross-Site Scripting). But in this project, it's safe because:

1. **The HTML is generated at build time** — Astro's Markdown renderer produces the HTML. No user input is involved.
2. **The source is the developer's own Markdown files** — committed to the repository, code-reviewed.
3. **The JSON is embedded in the page source** — it's not fetched from an API or user-submitted form.
4. **No interpolation** — the HTML is a string literal from the build, not a template with dynamic values.

If the CV content came from a CMS, user submissions, or an external API, `innerHTML` would be dangerous. Here, it's equivalent to writing the HTML directly in the template.

## The Knowledge Collection: Same Pattern, Different Output

The knowledge base follows the identical pipeline but produces **static routes** instead of a JSON blob:

```typescript
// src/content.config.ts
const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['architecture', 'concept', 'technology', 'feature']),
    summary: z.string(),
    // ... additional fields for the richer knowledge schema
  }),
});
```

Astro's file-based routing renders each knowledge entry as a static HTML page:

```
/learn/architecture/overview  → src/content/knowledge/architecture/overview.md
/learn/concepts/signals-vs-vdom → src/content/knowledge/concepts/signals-vs-vdom.md
```

The `/learn/*` pages are fully static — no SolidJS island, no client-side hydration (except a small Mermaid rendering script). They're pre-rendered HTML that works without JavaScript.

Additionally, `index.astro` serializes a knowledge index into the page for the Library app's tree view:

```typescript
const knowledgeEntries = ((await getCollection('knowledge')) as KnowledgeEntry[]).map((entry) => ({
  id: entry.id,
  title: entry.data.title,
  category: entry.data.category,
  summary: entry.data.summary,
}));
```

```html
<script type="application/json" id="knowledge-index">
  [{"id":"architecture/overview","title":"The Big Picture",...}]
</script>
```

## What If We'd Used Runtime Markdown Parsing?

If the BrowserApp parsed Markdown at runtime, you'd need:

1. **A Markdown library** — `marked` (~7KB gzip), `markdown-it` (~12KB gzip), or `remark` ecosystem (~50KB+ with plugins). Added to every user's bundle.
2. **Processing time** — Parsing Markdown on the client takes 10-50ms depending on content length. Noticeable as a flash of unstyled content.
3. **Loading state** — The CV viewer would need a loading spinner while Markdown parses.
4. **Raw Markdown in page source** — Search engines would see unrendered Markdown instead of HTML.
5. **Security complexity** — The Markdown parser's HTML output would need sanitization to prevent XSS.

The build-time approach eliminates all of these: zero client-side dependencies, instant rendering, and the HTML is in the page source for crawlers.

## What If We'd Used a CMS?

A headless CMS (Contentful, Sanity, Strapi) would work but adds complexity:

| Concern | Content Collections | Headless CMS |
|---|---|---|
| **Content storage** | Git-tracked Markdown files | External database |
| **Schema validation** | Build-time Zod | CMS-defined schema |
| **Build dependency** | None (files are local) | API must be reachable during build |
| **Editing workflow** | Code editor → Git commit | CMS web interface |
| **Cost** | Free | Free tier + potential paid plan |
| **Version control** | Full Git history | CMS-specific versioning |
| **Offline editing** | Always works | Requires internet |

For a personal CV site with one author, Git-tracked Markdown files are simpler, faster, and more reliable than an external CMS. The tradeoff: no web-based editing interface.
