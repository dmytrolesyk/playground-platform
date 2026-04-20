# Knowledge Base v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the knowledge base from passive documentation into an active learning system with exercises, labs, CS fundamentals, structured curriculum, and progress tracking.

**Architecture:** Extends existing `knowledge` content collection with new Zod fields, two new categories, curriculum modules config, progress tracking via vanilla JS + localStorage, and redesigned `/learn` pages. No new runtime dependencies for core content.

**Tech Stack:** Astro content collections, Zod, vanilla JS (progress tracking), Mermaid (existing), CSS.

**Design doc:** `docs/features/knowledge-base-v2.md`

---

## File Map

### Files to create:
- `src/content/knowledge/modules.ts` — curriculum module definitions
- `src/scripts/learn-progress.ts` — localStorage progress tracking (vanilla JS, bundled into learn pages)
- `src/content/knowledge/cs-fundamentals/hash-maps-and-lookup.md`
- `src/content/knowledge/cs-fundamentals/trees-and-traversal.md`
- `src/content/knowledge/cs-fundamentals/memory-management-and-gc.md`
- `src/content/knowledge/cs-fundamentals/concurrency-models.md`
- `src/content/knowledge/cs-fundamentals/type-systems.md`
- `src/content/knowledge/cs-fundamentals/networking-fundamentals.md`
- `src/content/knowledge/labs/break-reactivity.md`
- `src/content/knowledge/labs/measure-compositor-performance.md`
- `src/content/knowledge/labs/build-an-app-from-scratch.md`
- `src/content/knowledge/labs/trace-a-request.md`
- `src/content/knowledge/labs/create-a-memory-leak.md`

### Files to modify:
- `src/content.config.ts` — extend Zod schema
- `src/pages/learn/[...slug].astro` — render objectives, exercises, prereqs, time, progress button
- `src/pages/learn/index.astro` — curriculum view with modules, progress, labs section
- `src/styles/learn.css` — styles for exercises, objectives, progress, modules
- `src/layouts/LearnLayout.astro` — add progress tracking script
- `src/components/desktop/apps/architecture-explorer/architecture-data.ts` — new nodes/edges
- `src/pages/index.astro` — include new fields in knowledge-index JSON (for Library app)
- All 28 existing `src/content/knowledge/**/*.md` — add new frontmatter fields + exercises

### Files already updated (Phase 7 done):
- `docs/feature-development.md` ✅
- `AGENTS.md` ✅
- `docs/features/knowledge-base-v2.md` ✅

---

## Task 1: Extend Zod Schema

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add new categories, fields, and external ref type to the knowledge schema**

```typescript
// src/content.config.ts — full replacement of the knowledge collection
const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['architecture', 'concept', 'technology', 'feature', 'lab', 'cs-fundamentals']),
    summary: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    relatedConcepts: z.array(z.string()).default([]),
    relatedFiles: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    externalReferences: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
          type: z.enum(['article', 'video', 'docs', 'talk', 'repo', 'book']),
        }),
      )
      .default([]),
    diagramRef: z.string().optional(),
    order: z.number().optional(),
    dateAdded: z.date().optional(),
    lastUpdated: z.date().optional(),
    // v2 fields
    prerequisites: z.array(z.string()).default([]),
    learningObjectives: z.array(z.string()).default([]),
    exercises: z
      .array(
        z.object({
          question: z.string(),
          hint: z.string().optional(),
          answer: z.string(),
          type: z.enum(['predict', 'explain', 'do', 'debug']).default('explain'),
        }),
      )
      .default([]),
    estimatedMinutes: z.number().optional(),
    module: z.string().optional(),
    moduleOrder: z.number().optional(),
  }),
});
```

- [ ] **Step 2: Verify build passes with existing articles (all new fields have defaults)**

Run: `pnpm build 2>&1 | tail -5`
Expected: `[build] Complete!` — all 28 existing articles still valid because new fields default to `[]` / `undefined`.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat(knowledge-v2): extend Zod schema with exercises, prerequisites, modules, labs, cs-fundamentals"
```

---

## Task 2: Create Curriculum Modules Config

**Files:**
- Create: `src/content/knowledge/modules.ts`

- [ ] **Step 1: Create the modules definition file**

```typescript
// src/content/knowledge/modules.ts

export interface CurriculumModule {
  id: string;
  title: string;
  objective: string;
  estimatedHours: number;
  checkpoint: string;
  prerequisites: string[]; // module IDs that should be completed first
  order: number;
}

export const MODULES: CurriculumModule[] = [
  {
    id: 'foundation',
    title: 'The Foundation',
    objective: 'Explain the 3-layer architecture and trace data from Markdown to screen',
    estimatedHours: 2,
    checkpoint: 'Can you draw the build pipeline from memory? Describe each layer and how data flows between them.',
    prerequisites: [],
    order: 1,
  },
  {
    id: 'reactivity',
    title: 'Why SolidJS?',
    objective: 'Explain fine-grained reactivity and predict what re-renders when state changes',
    estimatedHours: 3,
    checkpoint: 'Predict what happens when you call setState in a SolidJS store — then verify with the browser DevTools.',
    prerequisites: ['foundation'],
    order: 2,
  },
  {
    id: 'window-manager',
    title: 'The Window Manager',
    objective: 'Understand drag mechanics, compositor optimization, and pointer capture',
    estimatedHours: 2.5,
    checkpoint: 'Explain why transform beats left/top for window dragging, with profiling evidence from DevTools.',
    prerequisites: ['foundation', 'reactivity'],
    order: 3,
  },
  {
    id: 'extensibility',
    title: 'Extensibility',
    objective: 'Build a new app using the registry pattern, end to end',
    estimatedHours: 1.5,
    checkpoint: 'You have built and registered a working Calculator app with tests.',
    prerequisites: ['foundation'],
    order: 4,
  },
  {
    id: 'full-stack',
    title: 'The Full Stack',
    objective: 'Trace a request from browser form submission to email inbox',
    estimatedHours: 2,
    checkpoint: 'Explain every hop of a contact form submission: DOM event → fetch → Astro endpoint → Resend API → email delivery.',
    prerequisites: ['foundation'],
    order: 5,
  },
  {
    id: 'aesthetics-performance',
    title: 'Aesthetics & Performance',
    objective: 'Understand the CSS strategy, CRT frame, and event loop mechanics',
    estimatedHours: 1.5,
    checkpoint: 'Find and fix a deliberate memory leak using Chrome DevTools Memory panel.',
    prerequisites: ['foundation', 'reactivity'],
    order: 6,
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/content/knowledge/modules.ts
git commit -m "feat(knowledge-v2): add curriculum modules config"
```

---

## Task 3: Progress Tracking Script

**Files:**
- Create: `src/scripts/learn-progress.ts`

This is vanilla TypeScript that runs on `/learn` pages. It manages localStorage and renders progress UI. It must work as a progressive enhancement — pages are fully functional without it.

- [ ] **Step 1: Create the progress tracking module**

```typescript
// src/scripts/learn-progress.ts

interface ArticleProgress {
  firstRead: string;
  lastRead: string;
  completed: boolean;
}

interface LearningProgress {
  articlesRead: Record<string, ArticleProgress>;
  modulesCompleted: string[];
}

const STORAGE_KEY = 'kb-learning-progress';

function loadProgress(): LearningProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LearningProgress;
  } catch { /* ignore corrupt data */ }
  return { articlesRead: {}, modulesCompleted: [] };
}

function saveProgress(progress: LearningProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markArticleRead(slug: string): void {
  const progress = loadProgress();
  const now = new Date().toISOString();
  const existing = progress.articlesRead[slug];
  progress.articlesRead[slug] = {
    firstRead: existing?.firstRead ?? now,
    lastRead: now,
    completed: existing?.completed ?? false,
  };
  saveProgress(progress);
}

export function markArticleCompleted(slug: string, completed: boolean): void {
  const progress = loadProgress();
  const now = new Date().toISOString();
  const existing = progress.articlesRead[slug];
  progress.articlesRead[slug] = {
    firstRead: existing?.firstRead ?? now,
    lastRead: now,
    completed,
  };
  saveProgress(progress);
}

export function getProgress(): LearningProgress {
  return loadProgress();
}

export function isArticleRead(slug: string): boolean {
  return slug in loadProgress().articlesRead;
}

export function isArticleCompleted(slug: string): boolean {
  return loadProgress().articlesRead[slug]?.completed ?? false;
}

export function getReadCount(): number {
  return Object.keys(loadProgress().articlesRead).length;
}

export function getCompletedCount(): number {
  return Object.values(loadProgress().articlesRead).filter((a) => a.completed).length;
}

export function getModuleProgress(articleSlugs: string[]): { read: number; completed: number; total: number } {
  const progress = loadProgress();
  let read = 0;
  let completed = 0;
  for (const slug of articleSlugs) {
    const entry = progress.articlesRead[slug];
    if (entry) {
      read++;
      if (entry.completed) completed++;
    }
  }
  return { read, completed, total: articleSlugs.length };
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/learn-progress.ts
git commit -m "feat(knowledge-v2): add localStorage progress tracking module"
```

---

## Task 4: Update Article Page — Render New Sections

**Files:**
- Modify: `src/pages/learn/[...slug].astro`

This is the largest rendering change. The article page gains: learning objectives at top, prerequisites links, estimated time, exercises at bottom, and a "Mark as understood" button.

- [ ] **Step 1: Update the KnowledgeEntry interface to include new fields**

Add to the existing interface in `[...slug].astro`:

```typescript
interface KnowledgeEntry {
  id: string;
  data: {
    title: string;
    category: string;
    summary: string;
    difficulty?: string;
    relatedConcepts: string[];
    relatedFiles: string[];
    technologies: string[];
    externalReferences: Array<{ title: string; url: string; type: string }>;
    order?: number;
    // v2 fields
    prerequisites: string[];
    learningObjectives: string[];
    exercises: Array<{ question: string; hint?: string; answer: string; type: string }>;
    estimatedMinutes?: number;
    module?: string;
    moduleOrder?: number;
  };
  rendered?: { html: string };
  body?: string;
}
```

- [ ] **Step 2: Add prerequisite resolution and module context logic**

After the existing `relatedEntries` resolution, add:

```typescript
// Resolve prerequisites to actual entries
const prerequisiteEntries = (entry.data.prerequisites ?? [])
  .map((slug: string) =>
    allEntries.find((e: KnowledgeEntry) => e.id === slug || e.id.endsWith(`/${slug}`)),
  )
  .filter((e): e is KnowledgeEntry => e !== undefined);

// Find previous/next article in same module
const moduleArticles = entry.data.module
  ? allEntries
      .filter((e: KnowledgeEntry) => e.data.module === entry.data.module)
      .sort((a, b) => (a.data.moduleOrder ?? 99) - (b.data.moduleOrder ?? 99))
  : [];
const currentModuleIndex = moduleArticles.findIndex((e) => e.id === entry.id);
const prevInModule = currentModuleIndex > 0 ? moduleArticles[currentModuleIndex - 1] : null;
const nextInModule = currentModuleIndex < moduleArticles.length - 1 ? moduleArticles[currentModuleIndex + 1] : null;

const exerciseTypeLabels: Record<string, string> = {
  predict: '🔮 Predict',
  explain: '💬 Explain',
  do: '🛠️ Do',
  debug: '🐛 Debug',
};
```

- [ ] **Step 3: Update category lists for sidebar to include new categories**

Update `categoryOrder` and `categoryLabels`:

```typescript
const categoryOrder = ['architecture', 'concept', 'technology', 'feature', 'cs-fundamentals', 'lab'];
const categoryLabels: Record<string, string> = {
  architecture: 'Architecture',
  concept: 'Concepts',
  technology: 'Technologies',
  feature: 'Features',
  'cs-fundamentals': 'CS Fundamentals',
  lab: 'Labs',
};
```

Add to `typeIcons`:
```typescript
const typeIcons: Record<string, string> = {
  article: '📄',
  video: '🎥',
  docs: '📚',
  talk: '🎤',
  repo: '💻',
  book: '📖',
};
```

- [ ] **Step 4: Add the article metadata header (time, prerequisites, objectives) between summary and body**

Insert after the `<p class="learn-content__summary">` and before `<article set:html={html} />`:

```astro
{/* Estimated reading time */}
{entry.data.estimatedMinutes && (
  <p class="learn-meta__time">⏱️ Estimated: {entry.data.estimatedMinutes} minutes</p>
)}

{/* Prerequisites */}
{prerequisiteEntries.length > 0 && (
  <div class="learn-prerequisites">
    <strong>📋 Read first:</strong>
    <ul>
      {prerequisiteEntries.map((e: KnowledgeEntry) => (
        <li><a href={`/learn/${e.id}`}>{e.data.title}</a></li>
      ))}
    </ul>
  </div>
)}

{/* Learning objectives */}
{entry.data.learningObjectives.length > 0 && (
  <div class="learn-objectives">
    <strong>🎯 After reading this, you should be able to:</strong>
    <ul>
      {entry.data.learningObjectives.map((obj: string) => (
        <li>{obj}</li>
      ))}
    </ul>
  </div>
)}
```

- [ ] **Step 5: Add exercises section after the article body, before the related section**

Insert after `<article set:html={html} />` and before `<section class="learn-related">`:

```astro
{/* Exercises */}
{entry.data.exercises.length > 0 && (
  <section class="learn-exercises">
    <h2>🧪 Check Your Understanding</h2>
    {entry.data.exercises.map((ex: { question: string; hint?: string; answer: string; type: string }, i: number) => (
      <div class={`exercise exercise--${ex.type}`}>
        <p class="exercise__label">{exerciseTypeLabels[ex.type] ?? ex.type}</p>
        <p class="exercise__question">{ex.question}</p>
        {ex.hint && (
          <details class="exercise__hint">
            <summary>Show hint</summary>
            <p>{ex.hint}</p>
          </details>
        )}
        <details class="exercise__answer">
          <summary>Show answer</summary>
          <p>{ex.answer}</p>
        </details>
      </div>
    ))}
  </section>
)}
```

- [ ] **Step 6: Add module navigation (prev/next) after the related section**

Append at the end of `<main class="learn-content">`:

```astro
{/* Module navigation */}
{(prevInModule || nextInModule) && (
  <nav class="learn-module-nav">
    {prevInModule ? (
      <a href={`/learn/${prevInModule.id}`} class="learn-module-nav__prev">
        ← {prevInModule.data.title}
      </a>
    ) : <span />}
    {nextInModule ? (
      <a href={`/learn/${nextInModule.id}`} class="learn-module-nav__next">
        {nextInModule.data.title} →
      </a>
    ) : <span />}
  </nav>
)}

{/* Progress tracking placeholder — hydrated by client script */}
<div id="progress-tracker" data-slug={entry.id}></div>
```

- [ ] **Step 7: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`
Expected: `[build] Complete!`

- [ ] **Step 8: Commit**

```bash
git add src/pages/learn/[...slug].astro
git commit -m "feat(knowledge-v2): render objectives, exercises, prereqs, module nav on article pages"
```

---

## Task 5: Add Styles for New Sections

**Files:**
- Modify: `src/styles/learn.css`

- [ ] **Step 1: Add styles for prerequisites, objectives, exercises, module nav, and progress**

Append to `src/styles/learn.css`:

```css
/* ===== v2: Learning metadata ===== */

.learn-meta__time {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0 0 16px;
}

/* Prerequisites */
.learn-prerequisites {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 12px 16px;
  margin: 0 0 16px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
}

.learn-prerequisites ul {
  margin: 4px 0 0;
  padding-left: 20px;
}

.learn-prerequisites li {
  margin: 2px 0;
}

/* Learning objectives */
.learn-objectives {
  background: #d4edda;
  border: 1px solid #28a745;
  border-radius: 4px;
  padding: 12px 16px;
  margin: 0 0 24px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
}

.learn-objectives ul {
  margin: 4px 0 0;
  padding-left: 20px;
}

.learn-objectives li {
  margin: 2px 0;
}

/* ===== v2: Exercises ===== */

.learn-exercises {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 2px solid var(--learn-border);
}

.learn-exercises h2 {
  font-size: 22px;
  color: var(--learn-heading);
  margin: 0 0 20px;
  border-bottom: none;
}

.exercise {
  background: #fff;
  border: 1px solid var(--learn-border);
  border-radius: 4px;
  padding: 16px 20px;
  margin: 0 0 16px;
  border-left: 4px solid #666;
}

.exercise--predict { border-left-color: #9b59b6; }
.exercise--explain { border-left-color: #3498db; }
.exercise--do { border-left-color: #e67e22; }
.exercise--debug { border-left-color: #e74c3c; }

.exercise__label {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  margin: 0 0 8px;
}

.exercise__question {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 12px;
}

.exercise__hint,
.exercise__answer {
  margin: 8px 0 0;
}

.exercise__hint summary,
.exercise__answer summary {
  cursor: pointer;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--learn-accent);
  padding: 4px 0;
}

.exercise__hint summary:hover,
.exercise__answer summary:hover {
  text-decoration: underline;
}

.exercise__hint p,
.exercise__answer p {
  margin: 8px 0 0;
  padding: 12px 16px;
  background: var(--learn-code-bg);
  border-radius: 3px;
  font-size: 15px;
  line-height: 1.6;
}

/* ===== v2: Module navigation ===== */

.learn-module-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--learn-border);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
}

.learn-module-nav a {
  color: var(--learn-accent);
  text-decoration: none;
  padding: 8px 0;
}

.learn-module-nav a:hover {
  text-decoration: underline;
}

/* ===== v2: Progress tracking ===== */

.progress-tracker {
  margin-top: 32px;
  padding: 16px 20px;
  background: var(--learn-sidebar-bg);
  border: 1px solid var(--learn-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
}

.progress-tracker__btn {
  padding: 6px 16px;
  border: 1px solid var(--learn-border);
  border-radius: 3px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.progress-tracker__btn:hover {
  background: var(--learn-accent);
  color: #fff;
  border-color: var(--learn-accent);
}

.progress-tracker__btn--completed {
  background: #28a745;
  color: #fff;
  border-color: #28a745;
}

/* ===== v2: Curriculum modules on index ===== */

.learn-modules {
  margin: 32px 0;
}

.learn-module {
  background: #fff;
  border: 1px solid var(--learn-border);
  border-radius: 4px;
  padding: 20px 24px;
  margin: 0 0 16px;
}

.learn-module__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 4px;
}

.learn-module__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--learn-heading);
  margin: 0;
}

.learn-module__meta {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  color: #666;
}

.learn-module__objective {
  font-size: 15px;
  color: #555;
  margin: 4px 0 12px;
  font-style: italic;
}

.learn-module__prereqs {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  color: #888;
  margin: 0 0 8px;
}

.learn-module__articles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
}

.learn-module__articles li a {
  display: inline-block;
  padding: 3px 10px;
  background: var(--learn-code-bg);
  border: 1px solid var(--learn-border);
  border-radius: 3px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  color: var(--learn-text);
  text-decoration: none;
}

.learn-module__articles li a:hover {
  background: var(--learn-accent);
  color: #fff;
  border-color: var(--learn-accent);
}

.learn-module__progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0d8;
  border-radius: 3px;
  margin: 12px 0 0;
  overflow: hidden;
}

.learn-module__progress-fill {
  height: 100%;
  background: var(--learn-accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Progress summary header */
.learn-progress-summary {
  background: var(--learn-sidebar-bg);
  border: 1px solid var(--learn-border);
  border-radius: 4px;
  padding: 12px 20px;
  margin: 0 0 32px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  color: #555;
}

/* Labs section */
.learn-labs {
  margin: 32px 0;
}

.learn-lab-card {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--learn-border);
}

.learn-lab-card__time {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .learn-module-nav {
    flex-direction: column;
    gap: 8px;
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/styles/learn.css
git commit -m "feat(knowledge-v2): add CSS for exercises, objectives, modules, progress tracking"
```

---

## Task 6: Add Progress Tracking to LearnLayout

**Files:**
- Modify: `src/layouts/LearnLayout.astro`

- [ ] **Step 1: Add a second `<script>` block for progress tracking**

After the existing mermaid `<script>` block, add:

```html
<script>
  // Progress tracking — marks articles as read and renders the progress UI.
  // Uses localStorage. Progressive enhancement — pages work without it.

  const STORAGE_KEY = 'kb-learning-progress';

  interface ArticleProgress {
    firstRead: string;
    lastRead: string;
    completed: boolean;
  }

  interface LearningProgress {
    articlesRead: Record<string, ArticleProgress>;
  }

  function loadProgress(): LearningProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as LearningProgress;
    } catch { /* ignore */ }
    return { articlesRead: {} };
  }

  function saveProgress(progress: LearningProgress): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function initProgressTracker(): void {
    const container = document.getElementById('progress-tracker');
    if (!container) return;

    const slug = container.dataset.slug;
    if (!slug) return;

    const progress = loadProgress();
    const now = new Date().toISOString();

    // Mark as read
    const existing = progress.articlesRead[slug];
    progress.articlesRead[slug] = {
      firstRead: existing?.firstRead ?? now,
      lastRead: now,
      completed: existing?.completed ?? false,
    };
    saveProgress(progress);

    // Render the "Mark as understood" button
    const isCompleted = progress.articlesRead[slug]?.completed ?? false;
    container.innerHTML = `
      <div class="progress-tracker">
        <span>${isCompleted ? '✅ Marked as understood' : '📖 You\'ve read this article'}</span>
        <button class="progress-tracker__btn ${isCompleted ? 'progress-tracker__btn--completed' : ''}"
                id="toggle-understood">
          ${isCompleted ? 'Understood ✓' : 'Mark as understood'}
        </button>
      </div>
    `;

    document.getElementById('toggle-understood')?.addEventListener('click', () => {
      const p = loadProgress();
      const entry = p.articlesRead[slug];
      if (entry) {
        entry.completed = !entry.completed;
        saveProgress(p);
        initProgressTracker(); // re-render
      }
    });
  }

  function initIndexProgress(): void {
    // Update progress bars on the /learn index page
    const bars = document.querySelectorAll<HTMLElement>('[data-module-articles]');
    const progress = loadProgress();

    for (const bar of bars) {
      const slugsStr = bar.dataset.moduleArticles;
      if (!slugsStr) continue;
      const slugs = slugsStr.split(',').filter(Boolean);
      const completed = slugs.filter((s) => progress.articlesRead[s]?.completed).length;
      const pct = slugs.length > 0 ? (completed / slugs.length) * 100 : 0;

      const fill = bar.querySelector<HTMLElement>('.learn-module__progress-fill');
      if (fill) fill.style.width = `${pct}%`;

      const label = bar.querySelector<HTMLElement>('.learn-module__progress-label');
      if (label) label.textContent = `${completed}/${slugs.length} completed`;
    }

    // Update summary header
    const summary = document.getElementById('progress-summary');
    if (summary) {
      const total = Object.keys(progress.articlesRead).length;
      const completed = Object.values(progress.articlesRead).filter((a) => a.completed).length;
      summary.textContent = `📊 Your Progress: ${total} articles read · ${completed} understood`;
    }
  }

  document.addEventListener('astro:page-load', () => {
    initProgressTracker();
    initIndexProgress();
  });
</script>
```

Note: The `src/scripts/learn-progress.ts` from Task 3 is a reference/utility module. The actual client-side logic lives in the `<script>` tag above because it needs to run in the browser as part of the Astro page, not as an importable module. The standalone file can be deleted or kept as a documented reference for the progress data structure.

- [ ] **Step 2: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/layouts/LearnLayout.astro
git commit -m "feat(knowledge-v2): add progress tracking script to learn layout"
```

---

## Task 7: Redesign `/learn/index.astro` — Curriculum View

**Files:**
- Modify: `src/pages/learn/index.astro`

- [ ] **Step 1: Import modules config and update data types**

Replace the current frontmatter script with an expanded version that imports modules, groups articles by module, and handles the new categories:

```astro
---
import { getCollection } from 'astro:content';
import LearnLayout from '../../layouts/LearnLayout.astro';
import { MODULES } from '../../content/knowledge/modules';

export const prerender = true;

interface KnowledgeEntry {
  id: string;
  data: {
    title: string;
    category: string;
    summary: string;
    difficulty?: string;
    order?: number;
    module?: string;
    moduleOrder?: number;
    estimatedMinutes?: number;
    prerequisites: string[];
  };
}

const entries = (await getCollection('knowledge')) as KnowledgeEntry[];

// Group by category (for browse section)
const categories: Record<string, KnowledgeEntry[]> = {};
for (const entry of entries) {
  const cat = entry.data.category;
  if (!categories[cat]) categories[cat] = [];
  categories[cat].push(entry);
}
for (const cat of Object.keys(categories)) {
  categories[cat]?.sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
}

const categoryOrder = ['architecture', 'concept', 'technology', 'feature', 'cs-fundamentals', 'lab'];
const categoryLabels: Record<string, string> = {
  architecture: '🏗️ Architecture',
  concept: '💡 Concepts',
  technology: '🔧 Technologies',
  feature: '✨ Features',
  'cs-fundamentals': '🧠 CS Fundamentals',
  lab: '🧪 Labs',
};

// Group articles by module
const moduleArticles: Record<string, KnowledgeEntry[]> = {};
for (const entry of entries) {
  if (entry.data.module) {
    if (!moduleArticles[entry.data.module]) moduleArticles[entry.data.module] = [];
    moduleArticles[entry.data.module].push(entry);
  }
}
for (const mod of Object.keys(moduleArticles)) {
  moduleArticles[mod]?.sort((a, b) => (a.data.moduleOrder ?? 99) - (b.data.moduleOrder ?? 99));
}

// Labs for dedicated section
const labs = entries
  .filter((e) => e.data.category === 'lab')
  .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));

// Sort modules by order
const sortedModules = [...MODULES].sort((a, b) => a.order - b.order);
---
```

- [ ] **Step 2: Replace the HTML template with the curriculum view**

```astro
<LearnLayout title="Knowledge Base">
  <div class="learn-page">
    <aside class="learn-sidebar">
      <h3>Learning Path</h3>
      <ul>
        {sortedModules.map((mod) => (
          <li><a href={`#module-${mod.id}`}>{mod.title}</a></li>
        ))}
      </ul>
      <h3>Categories</h3>
      <ul>
        {categoryOrder.map((cat) => (
          <li><a href={`#${cat}`}>{categoryLabels[cat]}</a></li>
        ))}
      </ul>
    </aside>

    <main class="learn-content">
      <h1>Knowledge Base</h1>
      <p class="learn-content__summary">
        A structured learning system for understanding this platform — the architecture, technologies, patterns, CS fundamentals, and hands-on experiments.
      </p>

      {/* Progress summary — hydrated by client script */}
      <div class="learn-progress-summary" id="progress-summary">
        📊 Loading progress...
      </div>

      {/* ===== Learning Path ===== */}
      <h2>🎓 Learning Path</h2>
      <p>Work through these modules in order. Each builds on the previous ones.</p>

      <div class="learn-modules">
        {sortedModules.map((mod) => {
          const articles = moduleArticles[mod.id] ?? [];
          const articleSlugs = articles.map((a) => a.id).join(',');
          const prereqNames = mod.prerequisites
            .map((pid) => MODULES.find((m) => m.id === pid)?.title)
            .filter(Boolean);
          return (
            <div class="learn-module" id={`module-${mod.id}`}>
              <div class="learn-module__header">
                <h3 class="learn-module__title">{mod.title}</h3>
                <span class="learn-module__meta">~{mod.estimatedHours}h</span>
              </div>
              <p class="learn-module__objective">{mod.objective}</p>
              {prereqNames.length > 0 && (
                <p class="learn-module__prereqs">
                  Builds on: {prereqNames.join(', ')}
                </p>
              )}
              <ul class="learn-module__articles">
                {articles.map((a) => (
                  <li><a href={`/learn/${a.id}`}>{a.data.title}</a></li>
                ))}
              </ul>
              <div class="learn-module__progress-bar" data-module-articles={articleSlugs}>
                <div class="learn-module__progress-fill" style="width: 0%"></div>
              </div>
              <span class="learn-module__progress-label learn-module__meta" style="display:block;margin-top:4px">
                0/{articles.length} completed
              </span>
            </div>
          );
        })}
      </div>

      {/* ===== Labs ===== */}
      {labs.length > 0 && (
        <>
          <h2 id="lab">🧪 Labs</h2>
          <p>Guided hands-on experiments in your own codebase.</p>
          <div class="learn-labs">
            {labs.map((lab) => (
              <div class="learn-lab-card">
                <a href={`/learn/${lab.id}`}>{lab.data.title}</a>
                {lab.data.estimatedMinutes && (
                  <span class="learn-lab-card__time">{lab.data.estimatedMinutes} min</span>
                )}
                {lab.data.difficulty && (
                  <span class={`learn-badge learn-badge--${lab.data.difficulty}`}>
                    {lab.data.difficulty}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== Browse by Category ===== */}
      <h2>📚 Browse by Category</h2>
      {categoryOrder.map((cat) => {
        const items = categories[cat];
        if (!items?.length) return null;
        return (
          <>
            <h3 id={cat}>{categoryLabels[cat]}</h3>
            <ul>
              {items.map((entry) => (
                <li>
                  <a href={`/learn/${entry.id}`}>{entry.data.title}</a>
                  {entry.data.difficulty && (
                    <span class={`learn-badge learn-badge--${entry.data.difficulty}`}>
                      {entry.data.difficulty}
                    </span>
                  )}
                  <br />
                  <em>{entry.data.summary}</em>
                </li>
              ))}
            </ul>
          </>
        );
      })}
    </main>
  </div>
</LearnLayout>
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/pages/learn/index.astro
git commit -m "feat(knowledge-v2): redesign learn index with curriculum modules, progress, labs"
```

---

## Task 8: Enrich All 28 Existing Articles — Frontmatter Fields

**Files:**
- Modify: all 28 files in `src/content/knowledge/**/*.md`

This task adds `module`, `moduleOrder`, `prerequisites`, `learningObjectives`, and `estimatedMinutes` to every existing article. Exercises are a separate task (Task 9) because they require more thought per article.

- [ ] **Step 1: Add v2 frontmatter to all 6 architecture articles**

Module assignment: `foundation` for overview, data-flow; `reactivity` for state-management; `window-manager` for window-manager; `extensibility` for app-registry; `full-stack` for contact-system.

For each file, add after the existing frontmatter fields (before the closing `---`):

**`architecture/overview.md`:**
```yaml
module: foundation
moduleOrder: 1
estimatedMinutes: 20
prerequisites: []
learningObjectives:
  - "Describe the three-layer architecture (Astro, SolidJS, App Registry) and each layer's responsibility"
  - "Trace the data flow from Markdown files to rendered pixels in the browser"
  - "Explain why a single SolidJS island was chosen over multiple islands"
```

**`architecture/data-flow.md`:**
```yaml
module: foundation
moduleOrder: 4
estimatedMinutes: 15
prerequisites:
  - architecture/overview
  - technologies/astro
learningObjectives:
  - "Trace the complete pipeline from a Markdown file edit to visible content on screen"
  - "Explain why there is zero runtime Markdown processing on the client"
  - "Describe how the knowledge base content collection differs from the CV collection"
```

**`architecture/state-management.md`:**
```yaml
module: reactivity
moduleOrder: 3
estimatedMinutes: 20
prerequisites:
  - concepts/fine-grained-reactivity
  - technologies/solidjs
learningObjectives:
  - "Explain how createStore with produce() enables fine-grained nested state updates"
  - "Describe the DesktopContext provider pattern and why all state is in one store"
  - "Predict which components re-render when a specific store path changes"
```

**`architecture/window-manager.md`:**
```yaml
module: window-manager
moduleOrder: 1
estimatedMinutes: 25
prerequisites:
  - architecture/state-management
  - concepts/pointer-events-and-capture
learningObjectives:
  - "Describe the complete drag lifecycle from pointerdown to pointerup"
  - "Explain z-index stacking and why a global counter works"
  - "Predict what breaks if setPointerCapture is removed"
```

**`architecture/app-registry.md`:**
```yaml
module: extensibility
moduleOrder: 1
estimatedMinutes: 15
prerequisites:
  - architecture/overview
  - concepts/inversion-of-control
learningObjectives:
  - "Add a new app to the platform using only registerApp() and a component file"
  - "Explain how the registry achieves the Open/Closed Principle"
  - "Describe which consumers read from APP_REGISTRY and what they use"
```

**`architecture/contact-system.md`:**
```yaml
module: full-stack
moduleOrder: 1
estimatedMinutes: 15
prerequisites:
  - architecture/overview
  - technologies/resend
learningObjectives:
  - "Trace a contact form submission from browser to email inbox"
  - "Explain the process.env vs import.meta.env landmine and why it matters in Docker builds"
  - "Describe the Resend error handling pattern (check error, don't try/catch)"
```

- [ ] **Step 2: Add v2 frontmatter to all 13 concept articles**

Apply the same pattern. Key module assignments:
- `reactivity` module: fine-grained-reactivity (order 1), signals-vs-vdom (2), observer-pattern (4), javascript-proxies (5), event-loop-and-microtasks (6)
- `window-manager` module: pointer-events (2), compositor-pattern (3), browser-rendering-pipeline (4)
- `extensibility` module: inversion-of-control (2), lazy-loading (3), module-systems (4)
- `foundation` module: islands-architecture (3), progressive-enhancement (2)

Each article needs:
- `module` and `moduleOrder` as specified above
- `estimatedMinutes` (10-25 depending on article length and complexity)
- `prerequisites` (which articles should be read before — follow the module ordering and cross-references)
- `learningObjectives` (2-4 action-verb objectives specific to the article content)

Apply to each of the 13 concept articles. Use the article content and relatedConcepts to derive appropriate prerequisites and learning objectives.

- [ ] **Step 3: Add v2 frontmatter to all 5 technology articles**

Module assignments:
- `foundation` module: astro (order 2), 98css (unassigned or aesthetics-performance)
- `reactivity` module: solidjs (order 2)
- `full-stack` module: resend (order 2)
- `aesthetics-performance` module: 98css (order 1)
- xterm: no primary module (referenced from features/terminal)

- [ ] **Step 4: Add v2 frontmatter to all 4 feature articles**

Module assignments:
- `foundation` or no primary module: cv-viewer
- `window-manager` or `aesthetics-performance`: crt-monitor-frame
- `extensibility`: snake-game (order 5)
- terminal: no primary module (cross-cutting)

- [ ] **Step 5: Verify build passes with all updated articles**

Run: `pnpm build 2>&1 | tail -10`
Expected: All 28 `/learn/` pages build successfully.

- [ ] **Step 6: Commit**

```bash
git add src/content/knowledge/
git commit -m "feat(knowledge-v2): add module, prerequisites, learningObjectives, estimatedMinutes to all 28 articles"
```

---

## Task 9: Add Exercises to All 28 Existing Articles

**Files:**
- Modify: all 28 files in `src/content/knowledge/**/*.md`

This is the largest content task. Each article gets 2-4 exercises in the `exercises` frontmatter array. At least one exercise per article must be type `predict` or `do`.

- [ ] **Step 1: Add exercises to architecture articles (6 articles × 3 exercises avg = ~18 exercises)**

Example for `architecture/overview.md`:
```yaml
exercises:
  - question: "If you added a seventh app to the platform, which files would you need to create or modify? List them."
    type: predict
    hint: "Think about the registry pattern — what's the single extensibility point?"
    answer: "You would create one component file in src/components/desktop/apps/ and add one registerApp() call in app-manifest.ts. No other files need changes — Desktop.tsx, WindowManager.tsx, Taskbar.tsx, and StartMenu.tsx all read from the registry automatically."
  - question: "Why does the platform use client:load instead of client:idle or client:visible for the Desktop island?"
    type: explain
    answer: "The desktop IS the entire page — there is no static content 'above the fold' to show first. The user needs interactivity immediately (clicking icons, opening windows). client:idle would delay hydration until the browser is idle, causing a noticeable lag. client:visible wouldn't trigger until the element scrolls into view, which doesn't apply to a full-viewport component."
  - question: "Open the browser's Network tab, reload the page, and find the CV content. Is it loaded via a fetch request or embedded in the HTML? What format is it in?"
    type: do
    hint: "Look at the page source, not the network requests."
    answer: "The CV content is embedded directly in the HTML as a <script type='application/json' id='cv-data'> tag. There is no fetch request. The SolidJS component reads it with JSON.parse(document.getElementById('cv-data').textContent). This is zero-overhead: no runtime request, no loading state."
```

Each article's exercises should be specific to that article's content and test real understanding. Follow these patterns:
- Architecture articles: focus on `predict` (what happens if X changes) and `do` (trace in DevTools)
- Concept articles: focus on `predict` (compare approaches) and `explain` (why does this work)
- Technology articles: focus on `do` (try the API) and `debug` (spot the mistake)
- Feature articles: focus on `do` (modify the feature) and `explain` (why this approach)

- [ ] **Step 2: Add exercises to concept articles (13 articles × 3 exercises avg = ~39 exercises)**

- [ ] **Step 3: Add exercises to technology articles (5 articles × 3 exercises avg = ~15 exercises)**

- [ ] **Step 4: Add exercises to feature articles (4 articles × 2-3 exercises avg = ~10 exercises)**

- [ ] **Step 5: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 6: Spot-check exercise rendering by running dev server**

Run: `pnpm dev`
Open: `http://localhost:4321/learn/architecture/overview`
Verify: exercises render at the bottom with collapsible hint/answer sections.

- [ ] **Step 7: Commit**

```bash
git add src/content/knowledge/
git commit -m "feat(knowledge-v2): add exercises to all 28 existing articles (~82 exercises)"
```

---

## Task 10: Write CS Fundamentals Articles (6 new articles)

**Files:**
- Create: 6 new files in `src/content/knowledge/cs-fundamentals/`

Each article must follow the CS fundamentals quality standards from `docs/features/knowledge-base-v2.md`:
- 1000-1800 words
- Open with a real-world engineering scenario
- Show where concept appears in THIS codebase
- Include performance/correctness implications
- Include "deeper rabbit holes" section
- 3-6 external references (including at least one book)
- ≥1 Mermaid diagram
- 2-4 exercises
- Learning objectives, prerequisites, module assignment, estimated time

**Research process is mandatory.** Read the actual source code, consult official docs, search the web. Do not write from training data alone.

- [ ] **Step 1: Write `cs-fundamentals/hash-maps-and-lookup.md`**

Topic: Hash maps, O(1) lookup, collision handling.
Codebase connection: `Record<string, WindowState>` in `desktop-store.ts`, `APP_REGISTRY` in `registry.ts`.
Module: `reactivity`, moduleOrder: 7.
Prerequisites: `architecture/overview`.

- [ ] **Step 2: Write `cs-fundamentals/trees-and-traversal.md`**

Topic: Tree data structures, DOM tree, component tree, BFS/DFS.
Codebase connection: Component hierarchy in `Desktop.tsx`, DOM traversal in `Window.tsx` (`closest()`).
Module: `reactivity`, moduleOrder: 8.
Prerequisites: `architecture/overview`, `cs-fundamentals/hash-maps-and-lookup`.

- [ ] **Step 3: Write `cs-fundamentals/memory-management-and-gc.md`**

Topic: JavaScript garbage collection, closures as retention, reference counting, `onCleanup`, WeakRef/WeakMap.
Codebase connection: `onCleanup()` in `TerminalApp.tsx`, closure-based event handlers in `Window.tsx`.
Module: `aesthetics-performance`, moduleOrder: 4.
Prerequisites: `concepts/event-loop-and-microtasks`.

- [ ] **Step 4: Write `cs-fundamentals/concurrency-models.md`**

Topic: Single-threaded event loop, Web Workers, compositor thread, SharedArrayBuffer.
Codebase connection: Event loop in drag handling, compositor thread in `transform` animations, future WASM workers.
Module: `window-manager`, moduleOrder: 5.
Prerequisites: `concepts/event-loop-and-microtasks`, `concepts/compositor-pattern`.

- [ ] **Step 5: Write `cs-fundamentals/type-systems.md`**

Topic: Structural vs nominal typing, generics, type narrowing, union types, TypeScript's approach.
Codebase connection: `WindowState` interface, `AppRegistryEntry`, discriminated unions in store actions.
Module: `extensibility`, moduleOrder: 5.
Prerequisites: `architecture/overview`.

- [ ] **Step 6: Write `cs-fundamentals/networking-fundamentals.md`**

Topic: HTTP request lifecycle, DNS, TLS, TCP handshake, the full path of a Resend email.
Codebase connection: `/api/contact.ts` endpoint, Resend API call, email delivery chain.
Module: `full-stack`, moduleOrder: 3.
Prerequisites: `architecture/contact-system`.

- [ ] **Step 7: Verify build passes**

Run: `pnpm build 2>&1 | tail -10`
Expected: 6 new `/learn/cs-fundamentals/*` pages built.

- [ ] **Step 8: Commit**

```bash
git add src/content/knowledge/cs-fundamentals/
git commit -m "feat(knowledge-v2): add 6 CS fundamentals articles"
```

---

## Task 11: Write Lab Articles (5 new articles)

**Files:**
- Create: 5 new files in `src/content/knowledge/labs/`

Each lab must follow the lab quality standards:
- 800-1500 words
- Exact setup instructions (git branch, files to create)
- Each experiment: DO → OBSERVE → EXPLAIN
- Link back to ≥2 theory articles
- Cleanup/reset instructions
- Estimated time (45-90 minutes)
- Labs have `exercises: []` (the lab IS the exercise)

- [ ] **Step 1: Write `labs/break-reactivity.md`**

5 experiments that break SolidJS reactivity in different ways:
1. Destructuring props
2. Early return before signal read
3. Async after await
4. Accessing store outside tracking scope
5. Stale closure in setTimeout

Module: `reactivity`, moduleOrder: 99.
Prerequisites: `concepts/fine-grained-reactivity`, `technologies/solidjs`, `concepts/javascript-proxies`.
Estimated: 45 minutes.

- [ ] **Step 2: Write `labs/measure-compositor-performance.md`**

Experiments comparing `transform` vs `left/top` with Chrome DevTools profiling:
1. Baseline measurement with transform
2. Switch to left/top, measure
3. Compare Layout/Paint/Composite times
4. Inspect GPU layers with Layers panel
5. Test will-change impact

Module: `window-manager`, moduleOrder: 99.
Prerequisites: `concepts/compositor-pattern`, `concepts/browser-rendering-pipeline`.
Estimated: 30 minutes.

- [ ] **Step 3: Write `labs/build-an-app-from-scratch.md`**

Build a Calculator app from zero using the registry pattern:
1. Create the engine (pure functions + tests)
2. Create the SolidJS component
3. Register with registerApp()
4. Add icon, verify in desktop + start menu + terminal

Module: `extensibility`, moduleOrder: 99.
Prerequisites: `architecture/app-registry`, `concepts/inversion-of-control`.
Estimated: 60 minutes.

- [ ] **Step 4: Write `labs/trace-a-request.md`**

Follow a contact form submission through every layer:
1. Inspect the form submission in Network tab
2. Read the Astro endpoint code
3. Trace the Resend API call
4. Check email headers for SPF/DKIM
5. Trace environment variable resolution (process.env path)

Module: `full-stack`, moduleOrder: 99.
Prerequisites: `architecture/contact-system`, `technologies/resend`.
Estimated: 30 minutes.

- [ ] **Step 5: Write `labs/create-a-memory-leak.md`**

Create and detect memory leaks in SolidJS:
1. Create a component with a setInterval that's never cleared
2. Open/close the window repeatedly
3. Use Chrome Memory panel to detect growing detached nodes
4. Fix with onCleanup
5. Verify the fix with another snapshot comparison

Module: `aesthetics-performance`, moduleOrder: 99.
Prerequisites: `cs-fundamentals/memory-management-and-gc`, `concepts/event-loop-and-microtasks`.
Estimated: 45 minutes.

- [ ] **Step 6: Verify build passes**

Run: `pnpm build 2>&1 | tail -10`
Expected: 5 new `/learn/labs/*` pages built.

- [ ] **Step 7: Commit**

```bash
git add src/content/knowledge/labs/
git commit -m "feat(knowledge-v2): add 5 hands-on lab articles"
```

---

## Task 12: Update Architecture Explorer

**Files:**
- Modify: `src/components/desktop/apps/architecture-explorer/architecture-data.ts`

- [ ] **Step 1: Add a "Knowledge System" group node**

Add nodes for the knowledge content collection, `/learn` routes, Library app connection, and the new categories:

```typescript
// Knowledge system nodes
{
  id: 'knowledge-collection',
  label: 'Knowledge Collection',
  category: 'astro',
  x: 600, y: 30, width: 160, height: 50,
  description: 'Markdown articles in 6 categories: architecture, concepts, technologies, features, CS fundamentals, labs.',
  knowledgeSlug: 'architecture/data-flow',
  sourceFiles: ['src/content/knowledge/', 'src/content.config.ts'],
},
{
  id: 'learn-routes',
  label: '/learn/* routes',
  category: 'astro',
  x: 600, y: 100, width: 140, height: 50,
  description: 'Static HTML pages for each knowledge article. Curriculum index with modules and progress tracking.',
  knowledgeSlug: 'architecture/overview',
  sourceFiles: ['src/pages/learn/index.astro', 'src/pages/learn/[...slug].astro'],
},
```

- [ ] **Step 2: Add edges connecting knowledge system to existing nodes**

```typescript
// Knowledge system edges
{ from: 'knowledge-collection', to: 'learn-routes', label: 'builds', type: 'data-flow' },
{ from: 'learn-routes', to: 'library-app', label: 'iframe src', type: 'dependency' },
{ from: 'content-collections', to: 'knowledge-collection', label: 'same pattern', type: 'dependency' },
```

- [ ] **Step 3: Verify the explorer renders correctly**

Run: `pnpm dev`
Open the Architecture Explorer app on the desktop.
Verify: new nodes appear, edges connect correctly, clicking opens the detail panel.

- [ ] **Step 4: Commit**

```bash
git add src/components/desktop/apps/architecture-explorer/architecture-data.ts
git commit -m "feat(knowledge-v2): add knowledge system nodes to architecture explorer"
```

---

## Task 13: Update Knowledge Index in index.astro for Library App

**Files:**
- Modify: `src/pages/index.astro`

The Library app's tree view reads from the `knowledge-index` JSON. It needs to include the new categories.

- [ ] **Step 1: Verify the existing knowledge-index serialization handles new categories automatically**

The current code maps `entry.data.category` directly — no filtering. As long as new articles have valid categories, they'll appear in the Library tree view automatically.

Check: `grep -A8 'knowledgeEntries' src/pages/index.astro`

If the mapping filters by category, add `cs-fundamentals` and `lab` to the filter. Otherwise, no change needed.

- [ ] **Step 2: Commit (only if changes were needed)**

```bash
git add src/pages/index.astro
git commit -m "feat(knowledge-v2): include new categories in Library app knowledge index"
```

---

## Task 14: Wire Cross-References Between New and Existing Articles

**Files:**
- Modify: select existing articles in `src/content/knowledge/`

- [ ] **Step 1: Add `relatedConcepts` references from existing articles to new CS fundamentals**

Articles that should reference CS fundamentals:
- `concepts/fine-grained-reactivity.md` → add `cs-fundamentals/hash-maps-and-lookup`
- `concepts/observer-pattern.md` → add `cs-fundamentals/trees-and-traversal`
- `concepts/event-loop-and-microtasks.md` → add `cs-fundamentals/concurrency-models`
- `concepts/compositor-pattern.md` → add `cs-fundamentals/concurrency-models`
- `architecture/contact-system.md` → add `cs-fundamentals/networking-fundamentals`
- `architecture/state-management.md` → add `cs-fundamentals/hash-maps-and-lookup`

- [ ] **Step 2: Verify build passes**

Run: `pnpm build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/content/knowledge/
git commit -m "feat(knowledge-v2): wire cross-references between existing and new articles"
```

---

## Task 15: Final Verification

- [ ] **Step 1: Run full verify**

```bash
pnpm verify
```
Expected: 0 errors, all tests pass.

- [ ] **Step 2: Run full build**

```bash
pnpm build 2>&1 | grep -E '(learn|error|Error|FAIL)'
```
Expected: All `/learn/*` routes build (28 existing + 6 CS fundamentals + 5 labs = 39 total). No errors.

- [ ] **Step 3: Manual smoke test**

```bash
pnpm dev
```

Verify:
1. `/learn` — curriculum view with modules, progress summary, labs section, browse by category
2. `/learn/architecture/overview` — learning objectives at top, exercises at bottom, module nav, progress button
3. `/learn/cs-fundamentals/hash-maps-and-lookup` — new CS fundamentals article renders correctly
4. `/learn/labs/break-reactivity` — lab article renders, no exercises section (labs have empty exercises)
5. Progress tracking — click "Mark as understood" on an article, return to `/learn`, see progress update
6. Architecture Explorer — new knowledge system nodes visible
7. Library app — tree view includes new categories (CS Fundamentals, Labs)

- [ ] **Step 4: Update knowledge-base-v2.md status to "In Progress" or "Complete"**

```bash
# In docs/features/knowledge-base-v2.md, change:
# ## Status
# Design
# to:
# ## Status
# Complete
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(knowledge-v2): complete knowledge base v2 — active learning system"
```

---

## Execution Order & Dependencies

```
Task 1 (Schema) ──────────┬──→ Task 8 (Enrich frontmatter) ──→ Task 9 (Exercises)
                           │
Task 2 (Modules config) ──┤──→ Task 7 (Index page)
                           │
Task 3 (Progress script) ──┤──→ Task 6 (LearnLayout script)
                           │
Task 5 (CSS) ─────────────┘──→ Task 4 (Article page rendering)
                                          │
                                          ├──→ Task 10 (CS fundamentals) ──┐
                                          │                                  │
                                          ├──→ Task 11 (Labs) ─────────────┤
                                          │                                  │
                                          └──→ Task 12 (Arch explorer) ────┤
                                                                             │
                                          Task 13 (index.astro) ────────────┤
                                                                             │
                                          Task 14 (Cross-references) ───────┤
                                                                             │
                                          Task 15 (Final verification) ◄────┘
```

**Parallelizable groups:**
- Tasks 1-3, 5 can all be done first (no dependencies between them)
- Tasks 4, 6, 7 depend on Tasks 1-3, 5 but are independent of each other
- Tasks 8-9 (content enrichment) can start after Task 1
- Tasks 10-11 (new articles) can start after Task 4
- Tasks 12-14 can start after Tasks 10-11
- Task 15 must be last

---

## Estimated Effort

| Task | Effort | Type |
|---|---|---|
| Tasks 1-7 (infrastructure) | ~2-3 hours | Code changes |
| Task 8 (frontmatter enrichment) | ~1-2 hours | Content metadata |
| Task 9 (exercises for 28 articles) | ~4-6 hours | Content creation (research required) |
| Task 10 (6 CS fundamentals articles) | ~6-10 hours | Content creation (deep research required) |
| Task 11 (5 lab articles) | ~4-6 hours | Content creation (must be tested/verified) |
| Tasks 12-15 (wiring + verification) | ~1-2 hours | Code + integration |
| **Total** | **~18-29 hours** | |

Content tasks (9, 10, 11) are the bulk. They benefit most from parallelization via subagents.
