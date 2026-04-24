# Feature 12b: Project-Lab Core Rendering

## Goal

Render project-lab index pages and phase pages with appropriate UI components: phase navigation, DO/OBSERVE/EXPLAIN step rendering, copyable code blocks, collapsible sections, and build objective/real system comparison callouts.

## Depends On

Feature 12a (schema exists).

## Applicable Skills

- `astro` — Astro page templates, component rendering
- `web-design-guidelines` — 98.css-compatible component design
- `typescript-magician` — type-safe component props

## Design

### Project-Lab Index Page Rendering

When `[...slug].astro` detects `category === 'project-lab'`, render a different layout:

**Sections:**
1. **Header:** Title, target description, simplification scope
2. **Phase list:** Ordered list of phases with:
   - Phase number and title
   - Build objective (one-liner)
   - Estimated time
   - Progress indicator (read/checked/practiced/mastered icon, or "not started")
   - Link to phase page
3. **Metadata sidebar:** Total estimated hours, technologies, prerequisites, related concepts
4. **"Continue" button:** Links to first non-completed phase (or first phase if none started)

**98.css compatibility:**
- Phase list rendered as a 98.css `tree-view` or a simple ordered list with 98.css buttons
- Progress indicators use text labels or simple icons (no custom CSS for 98.css elements)
- "Continue" button is a standard 98.css `<button>`

### Phase Page Rendering

Phase pages render as enhanced lab articles. In addition to the standard article layout:

1. **Phase header callout:** Build objective + real system comparison in a visually distinct 98.css `window` or `fieldset` box
2. **Phase navigation:** "← Previous Phase" / "Next Phase →" links at top and bottom
3. **"Part N of M" indicator:** Persistent breadcrumb showing which phase of the project-lab this is
4. **Steps:** DO/OBSERVE/EXPLAIN sections rendered from the Markdown body

### Step Rendering (DO/OBSERVE/EXPLAIN)

Steps use Markdown conventions that the existing renderer handles, with minor CSS enhancements:

```markdown
### Step 1: Create the store file

**DO:** Create `src/store.ts`...

**OBSERVE:** Run the file and check the output...

**EXPLAIN:** The store works because...
```

The **OBSERVE** and **EXPLAIN** sections should be rendered inside `<details>` elements (collapsible by default). This implements progressive disclosure — the learner can try to figure things out before reading explanations.

**Implementation approach:** A remark/rehype plugin or post-processing step that detects `**OBSERVE:**` and `**EXPLAIN:**` patterns and wraps them in `<details><summary>Observe</summary>...</details>`. Alternatively, use standard HTML `<details>` directly in the Markdown (Astro supports this).

**Recommended approach:** Direct `<details>` in Markdown. Simpler, no plugin needed, works with existing Astro pipeline:

```markdown
### Step 1: Create the store

**DO:** Create `src/store.ts` with the following content...

<details>
<summary>🔍 Observe</summary>

Run `node --experimental-strip-types src/store.ts` and check the output...

</details>

<details>
<summary>💡 Explain</summary>

The store uses `createStore` from SolidJS, which wraps the object in a Proxy...

</details>
```

### Checkpoint Rendering

Checkpoints use a fenced code block with a `checkpoint` language tag, rendered as a visually distinct box:

```markdown
```checkpoint
Run `curl http://localhost:3000` — you should see "Hello World" in the response.
```‎
```

**Implementation:** A custom rehype plugin or CSS class that styles `language-checkpoint` code blocks differently — e.g., green-tinted background, ✅ icon prefix. Falls back to standard code block styling if the plugin isn't loaded.

### Copyable Code Blocks

Code blocks already exist in the Astro pipeline. Adding a copy button requires:
- A small SolidJS component or vanilla JS snippet that adds a "Copy" button to `<pre>` elements
- The button copies the `<code>` text content to clipboard
- Shows "Copied!" feedback briefly
- 98.css-styled button (small, positioned top-right of the code block)

**Note:** This component benefits ALL knowledge articles, not just project-labs. It should be implemented as a general enhancement.

### Mobile Rendering

- Phase list on index page: vertical list, full-width items
- Phase navigation: full-width prev/next buttons
- Code blocks: horizontal scroll (already standard behavior)
- Collapsible sections: work natively with `<details>` on mobile

## Important Implementation Notes

**Inline interface in `[...slug].astro`:** This file defines its own `KnowledgeEntry` interface (~50 lines) that must be extended with the new project-lab fields: `parentProjectLab`, `projectLabPhases`, `buildObjective`, `realSystemComparison`, `phaseOrder`, `phaseConcepts`. Without these, the conditional rendering and phase navigation logic cannot access the data.

**Copy button follows existing `<script>` pattern:** The `/learn` pages already use `<script>` tags in `LearnLayout.astro` for mermaid rendering and progress tracking. The copy button should follow this same pattern — a `<script>` in `LearnLayout.astro` that finds `<pre>` elements and injects a copy button. NOT a new SolidJS island (violates single-island rule for the desktop page, and `/learn` pages use `<script>` tags for client-side behavior).

**Checkpoint blocks follow the mermaid pattern:** The existing mermaid rendering finds `code.language-mermaid` elements and transforms them. Checkpoint blocks should follow the same approach: a `<script>` in `LearnLayout.astro` that detects `code.language-checkpoint` parent `<pre>` elements and adds distinct styling (green-tinted background, ✅ prefix). No rehype plugin needed.

## Files to Create

- Phase header callout (CSS styling in existing learn stylesheet, or a `<fieldset>` pattern)
- Phase navigation markup (prev/next links, built into `[...slug].astro` conditionally)
- Copy button script (added to `LearnLayout.astro` `<script>` section)
- Checkpoint block script (added to `LearnLayout.astro` `<script>` section)

## Files to Modify

- `src/pages/learn/[...slug].astro` — extend `KnowledgeEntry` interface, detect `project-lab` category for index layout, detect `parentProjectLab` on lab articles for phase navigation
- `src/pages/learn/index.astro` — add project-labs section (filter `category === 'project-lab'`)
- `src/layouts/LearnLayout.astro` — add copy-button and checkpoint-block `<script>` sections
- Learn page CSS for checkpoint blocks, phase callouts, copy buttons

## Acceptance Criteria

- [ ] Project-lab index page renders with phase list, metadata, continue button
- [ ] Phase pages render with build objective / real system comparison callout
- [ ] Phase navigation (prev/next) works on all phase pages
- [ ] "Part N of M" breadcrumb visible on phase pages
- [ ] `<details>` OBSERVE/EXPLAIN sections collapse/expand correctly
- [ ] Code blocks have copy buttons (across all /learn pages, not just project-labs)
- [ ] Checkpoint blocks render with distinct styling
- [ ] Mobile layout works (full-width phases, scrollable code blocks)
- [ ] `pnpm build` succeeds
- [ ] `pnpm test:e2e` passes (or snapshots updated for new UI)
