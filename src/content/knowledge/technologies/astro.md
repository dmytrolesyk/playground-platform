---
title: "Astro — Static First, Islands Where Needed"
category: technology
summary: "The meta-framework that renders static HTML at build time and hydrates interactive islands on the client."
difficulty: beginner
relatedConcepts:
  - concepts/islands-architecture
technologies:
  - astro
order: 2
dateAdded: 2026-04-20
externalReferences:
  - title: "Astro Documentation"
    url: "https://docs.astro.build/"
    type: docs
  - title: "Astro GitHub Repository"
    url: "https://github.com/withastro/astro"
    type: repo
---

## What Astro Does

Astro is a web framework optimized for content-heavy sites. It renders pages to static HTML at build time and ships **zero JavaScript by default**. Interactive components (islands) opt in to client-side JS explicitly.

## How We Use It

### Content Collections

Markdown files with Zod-validated frontmatter:

```typescript
const cv = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cv' }),
  schema: z.object({ title: z.string(), order: z.number() }),
});
```

We have two collections: `cv` (résumé sections) and `knowledge` (learning articles).

### File-Based Routing

```
src/pages/
├── index.astro        → /         (desktop)
├── cv-print/index.astro → /cv-print (print-friendly CV)
├── api/contact.ts     → /api/contact (SSR endpoint)
└── learn/
    ├── index.astro    → /learn    (knowledge index)
    └── [...slug].astro → /learn/* (knowledge articles)
```

### Hybrid Rendering

Astro 6 with `@astrojs/node` defaults to prerendering (static). Pages opt out with `export const prerender = false` for SSR. Only `/api/contact` needs SSR.

### Component Islands

```astro
<Desktop client:load />
```

`client:load` hydrates the Desktop component immediately. This is the only island in the entire site.

### Build-Time Data Serialization

```astro
<script type="application/json" id="cv-data" set:html={JSON.stringify(cvData)} />
```

Content is rendered to HTML at build time and serialized into the page. Client components read the JSON — no runtime content processing.

## Key Configuration

```javascript
// astro.config.mjs
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [solidJs()],
});
```

The `node` adapter produces a standalone Node.js server for Railway deployment.
