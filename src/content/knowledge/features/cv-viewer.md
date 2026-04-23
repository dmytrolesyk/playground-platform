---
title: "CV Viewer"
category: feature
summary: "The BrowserApp — a Netscape-styled CV reader that displays pre-rendered HTML from a JSON script tag."
difficulty: beginner
relatedConcepts:
  - concepts/islands-architecture
  - concepts/progressive-enhancement
relatedFiles:
  - src/components/desktop/apps/BrowserApp.tsx
  - src/components/desktop/apps/cv-data.ts
  - src/components/desktop/apps/styles/browser-app.css
  - src/pages/index.astro
  - src/content.config.ts
technologies:
  - solidjs
  - astro
order: 1
dateAdded: 2026-04-20
lastUpdated: 2026-04-23
externalReferences:
  - title: "Astro Content Collections"
    url: "https://docs.astro.build/en/guides/content-collections/"
    type: docs
  - title: "innerHTML Security Considerations — MDN"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations"
    type: docs
  - title: "SolidJS onMount Lifecycle"
    url: "https://docs.solidjs.com/reference/lifecycle/on-mount"
    type: docs
  - title: "Astro GitHub Repository"
    url: "https://github.com/withastro/astro"
    type: repo
module: foundation
moduleOrder: 5
estimatedMinutes: 10
prerequisites:
  - architecture/data-flow
  - concepts/islands-architecture
learningObjectives:
  - "Describe how CV Markdown becomes pre-rendered HTML embedded in a script tag"
  - "Explain why innerHTML is safe here but dangerous in general"
  - "Trace the data path from Markdown file to rendered CV in the browser"
exercises:
  - question: "What happens if you add a new Markdown file to src/content/cv/ with a title but no 'order' field?"
    type: predict
    hint: "Content collections validate at build time."
    answer: "The build fails with a Zod validation error because the cv collection schema requires order: z.number(). Astro's content collections enforce schemas at build time, not runtime. You'll see an error like 'Expected number, received undefined' pointing to the exact file. This compile-time guarantee means every Markdown file in the collection is valid if the build succeeds."
  - question: "Why is using innerHTML safe for the CV content but dangerous for user-submitted content?"
    type: explain
    answer: "The CV content is controlled by the developer — it comes from Markdown files in the repository, rendered by Astro at build time. There's no user input in the pipeline, so no XSS attack vector. innerHTML with user-submitted content (like a comment form) is dangerous because a user could inject <script> tags or event handlers. The CV pipeline is safe because the content author IS the developer, and Astro's Markdown renderer doesn't pass through raw HTML by default."
  - question: "Right-click the page, choose View Source, and find the script tag with id='cv-data'. What's the structure of the JSON inside it?"
    type: do
    hint: "Search for 'cv-data' in the page source."
    answer: "The JSON is an array of objects, each with: title (string, like 'Work Experience'), order (number for sorting), and html (string containing the pre-rendered HTML from Markdown). The html field contains full HTML markup (headings, paragraphs, lists) ready to be injected via innerHTML. The array is sorted by order in the rendering code. This is the serialization boundary — Astro produced this at build time."
---

## Why Should I Care?

The CV viewer looks like the simplest component in the project — it just shows some HTML in a scrollable window. But it demonstrates a powerful pattern: **build-time content serialization**. The CV Markdown never touches the client as Markdown. It's rendered to HTML at build time by [Astro's content collections](https://docs.astro.build/en/guides/content-collections/), serialized as JSON into the page, and read by a [SolidJS](https://www.solidjs.com/) component that does nothing but set [`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML). Zero runtime content processing, zero Markdown parser in the bundle, zero cost to the user.

## The Build-Time Serialization Pipeline

The CV content follows a four-stage pipeline, with all heavy work happening at build time:

```mermaid
flowchart LR
    A["Markdown files<br/><code>src/content/cv/*.md</code>"] --> B["Astro Content Collection<br/>Zod validation + render"]
    B --> C["JSON blob<br/><code>&lt;script id='cv-data'&gt;</code>"]
    C --> D["BrowserApp reads JSON<br/>sets innerHTML"]
    style A fill:#e8e8e8
    style B fill:#ffe0b2
    style C fill:#c8e6c9
    style D fill:#bbdefb
```

**Stage 1: Markdown files.** Each CV section is a separate Markdown file in `src/content/cv/` with frontmatter defining `title` and `order`.

**Stage 2: Astro processes the collection.** In `src/content.config.ts`, the `cv` collection uses a `glob` loader and a Zod schema. At build time, Astro renders each Markdown file to HTML and validates the frontmatter:

```typescript
// src/content.config.ts
const cv = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cv' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});
```

**Stage 3: Serialization into the page.** `src/pages/index.astro` sorts the sections by `order`, extracts the rendered HTML, and serializes the result as a JSON `<script>` tag:

```astro
<!-- src/pages/index.astro -->
<script is:inline type="application/json" id="cv-data"
  set:html={JSON.stringify(cvData)} />
```

This JSON blob becomes part of the static HTML — it's embedded in the page at build time, not fetched at runtime.

**Stage 4: Client reads and displays.** The `loadCvData()` function in `cv-data.ts` parses the JSON:

```typescript
// src/components/desktop/apps/cv-data.ts
export function loadCvData(): CvSection[] {
  const el = document.getElementById('cv-data');
  if (!el?.textContent) return [];
  try {
    return JSON.parse(el.textContent) as CvSection[];
  } catch {
    return [];
  }
}
```

`BrowserApp` calls this in `onMount` and renders each section using `innerHTML`:

```typescript
sections().map((section: CvSection) => (
  <div class="browser-section" innerHTML={section.html} />
))
```

## Why innerHTML Is Safe Here

Using `innerHTML` is normally a security red flag — it's the classic XSS vector. But in this specific case, it's safe because:

1. **The HTML is generated at build time** from trusted Markdown files in the repository. There's no user input in the pipeline.
2. **The content comes from a JSON blob** embedded in the page by Astro's build process, not from a network request or user-controlled source.
3. **The Markdown → HTML conversion** is handled by Astro's Markdown renderer (using remark/rehype), which produces sanitized HTML.

The critical invariant is: the CV content pipeline has **no user input**. If this ever changed — say, if CV sections could be edited through a CMS — the `innerHTML` approach would need to be replaced with a sanitizer.

## The Retro Browser Aesthetic

The BrowserApp is styled to evoke Netscape Navigator and early Internet Explorer:

- **Disabled navigation buttons** — Back, Forward, Reload, Home are rendered but disabled. There's nowhere to navigate, but they're essential to the 1990s browser look.
- **Fake address bar** — Shows `http://cv.local/dmytro-lesyk`, reinforcing the illusion that you're browsing a personal homepage from the late '90s.
- **Photo header** — A profile photo and contact info sit above the CV content, styled like the personal homepages of that era.
- **98.css status bar** — The bottom `<div class="status-bar">` with "Document: Done" uses 98.css's built-in status bar styling.

All visual elements use 98.css classes (`status-bar`, `status-bar-field`, `button`) — the custom CSS in `browser-app.css` handles only layout (flexbox arrangement, toolbar spacing, viewport scrolling).

## PDF and DOCX Exports

The CV is also available as downloadable files via the Export CV window (`ExplorerApp`). These are pre-built static files in `public/downloads/`, generated by `pnpm generate-cv` (which uses Chrome headless for PDF and pandoc for DOCX). The BrowserApp doesn't handle exports — that's a separate app following the single-responsibility principle.

## What If We'd Used Runtime Markdown?

If the BrowserApp parsed Markdown at runtime (using, say, `marked` or `remark`), the cost would be:

- **~30-50KB** extra JavaScript for a Markdown parser
- **Parsing time** on every page load (or at least on every window open)
- **Runtime errors** from malformed Markdown would surface in the user's browser, not at build time

The build-time approach catches errors during `pnpm build`, ships zero extra code, and makes the viewer's runtime code trivially simple — it's just `innerHTML`.
