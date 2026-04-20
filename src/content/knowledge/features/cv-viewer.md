---
title: "CV Viewer"
category: feature
summary: "The BrowserApp — a Netscape-styled CV reader that displays pre-rendered HTML from a JSON script tag."
difficulty: beginner
relatedConcepts:
  - concepts/islands-architecture
relatedFiles:
  - src/components/desktop/apps/BrowserApp.tsx
  - src/components/desktop/apps/cv-data.ts
  - src/components/desktop/apps/styles/browser-app.css
technologies:
  - solidjs
order: 1
dateAdded: 2026-04-20
---

## What It Does

The BrowserApp is a Win95-styled "web browser" window that displays the CV content. It has a toolbar with disabled navigation buttons (for aesthetic), an address bar showing a fake URL, and a scrollable content area.

## How It Works

1. At build time, `index.astro` renders CV Markdown to HTML and serializes it as JSON
2. At runtime, `loadCvData()` reads the JSON from `<script id="cv-data">`
3. BrowserApp renders each section's HTML with `innerHTML`

The component is simple — it's essentially a styled HTML viewer:

```typescript
export function BrowserApp(): JSX.Element {
  const [sections, setSections] = createSignal<CvSection[]>([]);
  onMount(() => setSections(loadCvData()));

  return (
    <div class="browser-app">
      <Toolbar />
      <div class="browser-viewport">
        {sections().map(section => <div innerHTML={section.html} />)}
      </div>
      <StatusBar />
    </div>
  );
}
```

## Design Decisions

- **Fake toolbar** — Navigation buttons are disabled because there's nowhere to go. They exist for the Netscape aesthetic.
- **Photo header** — A profile photo and name header sit above the CV content, styled to look like a personal homepage from the late '90s.
- **No Markdown runtime** — The HTML is already rendered. Zero processing on the client.
