---
title: "From Markdown to Screen"
category: architecture
summary: "The complete data pipeline — how Markdown files become pre-rendered HTML available to client-side components."
difficulty: beginner
relatedConcepts:
  - concepts/islands-architecture
relatedFiles:
  - src/content.config.ts
  - src/content/cv/
  - src/pages/index.astro
  - src/components/desktop/apps/cv-data.ts
  - src/components/desktop/apps/BrowserApp.tsx
technologies:
  - astro
order: 5
dateAdded: 2026-04-20
---

## The Pipeline

Content goes through four stages, each at a different time:

### Stage 1: Authoring (Developer Time)

Markdown files with YAML frontmatter live in `src/content/cv/`:

```markdown
---
title: "Work Experience"
order: 2
---

## Senior Frontend Engineer — Acme Corp
*2022–Present*

Built the widget system...
```

### Stage 2: Validation (Build Time)

Astro's content collections validate every file against a Zod schema:

```typescript
const cv = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cv' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});
```

If a file has a missing `title` or non-numeric `order`, the build fails. This is a compile-time guarantee.

### Stage 3: Rendering (Build Time)

In `index.astro`, the collection is fetched and each entry's Markdown is rendered to HTML:

```typescript
const cvSections = (await getCollection('cv')).sort((a, b) => a.data.order - b.data.order);
const cvData = cvSections.map((section) => ({
  slug: section.id,
  title: section.data.title,
  html: section.rendered?.html ?? '',
}));
```

The resulting array of `{ slug, title, html }` objects is serialized into the page:

```html
<script type="application/json" id="cv-data">
  [{"slug":"summary","title":"Summary","html":"<p>Experienced...</p>"},...]
</script>
```

### Stage 4: Display (Client Time)

The `BrowserApp` component reads this JSON from the DOM:

```typescript
function loadCvData(): CvSection[] {
  const el = document.getElementById('cv-data');
  return JSON.parse(el.textContent);
}
```

This is **zero runtime Markdown processing**. The client receives pre-rendered HTML. No Markdown parser in the bundle, no WASM module, no processing delay.

## Why This Architecture?

1. **Performance** — HTML is ready instantly. No parsing delay.
2. **Bundle size** — No Markdown library shipped to the client.
3. **Security** — No dynamic content interpretation on the client.
4. **SEO** — The HTML is in the page source for crawlers (inside the JSON tag).

## The Same Pattern for Knowledge

The knowledge base follows the same pipeline but renders to separate `/learn/*` routes instead of a JSON blob. Both use Astro content collections with Zod schemas, both render Markdown to HTML at build time.
