# Feature 12: Project Labs — Guided Rebuild as a Learning Method

## Goal

Create a new content type — `project-lab` — for multi-session guided builds of simplified versions of real systems. Each project-lab takes a target repo or system, defines a simplification scope, and walks the learner through reconstructing the essential parts step by step, with every build phase connected to knowledge graph concepts.

This is the system's killer feature: **learn a codebase by rebuilding a simplified version of it, with each step anchored to deep explanatory content.**

## Depends On

All infrastructure features (1-11). This feature uses the full system: knowledge graph for concept linking, Cytoscape.js for visualizing what concepts you're learning at each phase, SKOS for connecting project-lab concepts to existing vocabulary, exercise types for embedded practice, quality pipeline for validating generated content, and the engine package for schema definitions.

## Applicable Skills

- `typescript-magician` — complex nested Zod schema (phases → steps → DO/OBSERVE/EXPLAIN)
- `astro` — project-lab rendering template, code block components, collapsible sections
- `web-design-guidelines` — project-lab UI (copy buttons, diff views, checkpoint display, progress indicators)
- `subagent-driven-development` — multiple independent deliverables (schema, rendering, content, checkpoint tests, review script)

## How It Differs from Existing Labs

| | Lab (existing) | Project-Lab (new) |
|---|---|---|
| Duration | 30-60 min | 4-20 hours across multiple sessions |
| Scope | One concept, one experiment | Multiple concepts, builds a working system |
| Output | Understanding of a pattern | A working simplified version of a real system |
| Structure | DO/OBSERVE/EXPLAIN (flat) | Phases → steps → DO/OBSERVE/EXPLAIN (nested) |
| Target | Own codebase | External repo or system |
| Key feature | — | "Real system comparison" at each phase |

## Schema

Add to the `category` enum in content.config.ts:
```typescript
category: z.enum([
  'architecture', 'concept', 'technology', 'feature', 'lab', 'cs-fundamentals',
  'project-lab',  // NEW
]),
```

New frontmatter fields for `project-lab` articles (additions to existing schema):

```typescript
// Project-lab specific fields (optional, only used when category is 'project-lab')
targetRepo: z.string().optional(),           // URL of the repo being studied
targetBranch: z.string().optional(),         // specific branch/tag to study (default: main)
targetDescription: z.string().optional(),    // what we're building a simplified version of
simplificationScope: z.string().optional(),  // what's included vs omitted and why
setupInstructions: z.string().optional(),    // how to clone, install, and set up the target repo
totalEstimatedHours: z.number().optional(),  // total time across all phases
phases: z.array(z.object({
  title: z.string(),
  estimatedMinutes: z.number(),
  buildObjective: z.string(),               // what the learner builds in this phase
  realSystemComparison: z.string(),         // how this maps to the real system
  concepts: z.array(z.string()),            // knowledge graph concept IDs
  steps: z.array(z.object({
    do: z.string(),                          // instruction
    observe: z.string(),                     // what to notice
    explain: z.string(),                     // why it matters
    code: z.string().optional(),             // code to write (if applicable)
    checkpoint: z.string().optional(),       // how to verify this step worked
  })),
})).optional(),
```

## Content Structure

Project-labs live in `src/content/knowledge/project-labs/` (new directory):

```
src/content/knowledge/project-labs/
├── tiny-sqlite/
│   ├── index.md           # overview, setup, simplification scope
│   ├── phase-01-pages.md  # Phase 1: Fixed-size pages
│   ├── phase-02-btree.md  # Phase 2: B-tree nodes
│   ├── phase-03-cache.md  # Phase 3: Page cache
│   └── phase-04-api.md    # Phase 4: Simple key-value API
└── tiny-http-server/
    ├── index.md
    ├── phase-01-tcp.md
    └── ...
```

Alternative: a single long Markdown file per project-lab with phases as H2 sections. The multi-file approach is better for progress tracking (mark each phase independently) and for keeping file sizes manageable.

If using multi-file: the index.md has `category: project-lab` with the `phases` frontmatter. Phase files have `category: project-lab` with a `parentProjectLab` field linking back to the index. Or, simpler: phase files are just regular articles with `category: lab` that are referenced from the index.

## Example: "Build a Tiny HTTP Server"

```yaml
# project-labs/tiny-http-server/index.md
---
title: "Project Lab: Build a Tiny HTTP Server"
category: project-lab
summary: "Understand HTTP and TCP by building a simplified HTTP/1.1 server from scratch in Node.js"
difficulty: intermediate
targetRepo: "https://github.com/nodejs/node (net and http modules)"
targetDescription: "We're building a simplified version of Node.js's HTTP server — just enough to handle GET requests, parse headers, and serve responses."
simplificationScope: "TCP listener + HTTP/1.1 request parsing + response writing. No HTTPS, no HTTP/2, no keep-alive, no chunked encoding, no streams."
totalEstimatedHours: 6
technologies:
  - nodejs
  - typescript
relatedConcepts:
  - cs-fundamentals/networking-fundamentals
  - concepts/event-loop-and-microtasks
prerequisites:
  - cs-fundamentals/networking-fundamentals
phases:
  - title: "Phase 1: TCP Echo Server"
    estimatedMinutes: 60
    buildObjective: "Create a TCP server that accepts connections and echoes data back"
    realSystemComparison: "In Node.js, this is the net.createServer() API. Our version uses the same syscalls but skips connection pooling and backpressure."
    concepts:
      - cs-fundamentals/networking-fundamentals
    steps:
      - do: "Create server.ts with net.createServer(), listen on port 3000"
        observe: "Use curl or telnet to connect. Type text — it comes back."
        explain: "TCP is a bidirectional byte stream. The OS handles the three-way handshake. Our callback fires when a connection is established."
        code: |
          import { createServer } from 'node:net';
          const server = createServer((socket) => {
            socket.on('data', (data) => socket.write(data));
          });
          server.listen(3000);
        checkpoint: "Run `echo 'hello' | nc localhost 3000` — you should see 'hello' back."
      - do: "Add connection logging — print remote address and port on each connection"
        observe: "Open multiple telnet sessions. Each gets a unique port."
        explain: "Each TCP connection is identified by a 4-tuple: source IP, source port, dest IP, dest port. The OS assigns ephemeral source ports."
  - title: "Phase 2: HTTP Request Parser"
    estimatedMinutes: 90
    buildObjective: "Parse raw TCP bytes into structured HTTP requests (method, path, headers)"
    realSystemComparison: "Node.js uses llhttp (a C parser) for performance. Ours is a simple line-by-line string parser — correct but slow."
    concepts:
      - cs-fundamentals/networking-fundamentals
    steps:
      - do: "Create parser.ts that splits the request line and extracts method, path, HTTP version"
        observe: "Send a curl request to port 3000. Print the parsed result."
        explain: "HTTP/1.1 is a text protocol. The first line is always METHOD PATH VERSION. Everything after is headers as key: value pairs, terminated by an empty line."
---

## Why Build This?

Every web developer uses HTTP servers daily, but few understand what happens between
`curl http://localhost:3000` and the response appearing. This project-lab builds an
HTTP server from TCP sockets up, so you understand every layer...
```

## The AI-Assisted Generation Workflow

Project-labs are too complex to generate fully automatically. The workflow:

1. **Human picks a target:** "I want to understand SQLite's storage engine"
2. **AI analyzes the target repo:** Identifies core modules, key abstractions, dependencies between components
3. **AI proposes a simplification scope:** "We'll build: page storage, B-tree index, simple key-value API. We'll skip: SQL parser, query optimizer, WAL, locking, VACUUM"
4. **Human reviews and adjusts scope:** "Add the page cache, skip the key-value API"
5. **AI generates phase outlines:** For each phase: build objective, real system comparison, connected concepts, step sequence
6. **Human reviews phase structure:** Reorder, adjust granularity, ensure each phase produces something testable
7. **AI generates full step content:** DO/OBSERVE/EXPLAIN for each step, code samples, checkpoints
8. **Quality pipeline reviews:** Run `scripts/review-article.ts` on the generated content
9. **Human does the project-lab themselves:** The ultimate quality check — does following the steps actually produce understanding?

Steps 2-3 and 5-7 are where the AI agent does heavy work. Steps 1, 4, 6, 8-9 are human. This matches the existing AGENTS.md workflow: AI generates, human curates, audit validates.

## Knowledge Graph Integration

- Each project-lab phase links to knowledge graph concepts via `concepts` field
- Cytoscape.js can highlight "concepts covered by this project-lab" as a filtered view
- Progress tracking: each phase is independently trackable (read → checked → practiced → mastered)
- The project-lab's own concepts may create new nodes in the knowledge graph (e.g., studying SQLite adds "B-tree storage" and "page cache" concepts)

## Rendering

The project-lab index page shows:
- Title, target repo, simplification scope
- Phase list with progress indicators
- Total estimated time
- Linked concepts (with Cytoscape.js minimap showing relevant subgraph, if feasible)

Each phase page shows:
- Build objective and real system comparison (side by side or as a callout)
- Steps in DO/OBSERVE/EXPLAIN sequence
- Code blocks with copy buttons
- Checkpoint verification instructions
- "What you've built so far" running summary
- Links to related concept articles

## First Project-Lab Candidates

Two tiers of candidates:

### Tier 1: Validate the format (build alongside Features 1-11)

1. **"Build a Tiny App Framework"** — reconstruct a simplified version of the playground-platform's own desktop framework (app registry, window manager, store). This is the easiest because the target repo is your own codebase, the concepts already exist in the knowledge graph, and the existing "Build an App from Scratch" lab is a prototype for one phase.

2. **"Build a Tiny HTTP Server"** — a Node.js HTTP server from TCP sockets up. Small scope, well-understood domain, excellent for learning networking fundamentals that are in the cs-fundamentals category.

Start with #1 because it validates the format using content that already exists.

### Tier 2: Stress-test the engine + learn target technologies (post-Feature 12)

These project labs serve double duty: they generate diverse content that validates the engine at scale AND they teach the technologies needed for future pet project features.

3. **"Build a Tiny 3D Scene"** — study Three.js internals (scene graph, WebGL, transforms, animation). Needed for: rendering the app inside a 3D monitor model.
4. **"Build a Tiny Peer Connection"** — study WebRTC (ICE, STUN/TURN, SDP, MediaStream). Needed for: retro video chat feature.
5. **"Build a Tiny DOS Emulator"** — study em-dosbox (x86 subset, memory, display buffer). Needed for: DOS game integration.
6. **"Build a Tiny JS Runtime"** — study MuJS/DOjS (lexing, parsing, bytecode, GC). Needed for: DOjS integration and AI game builder.

Each generates 15-20 articles in a completely different domain, exercising SKOS cross-domain linking, NetworkX community detection, and the full audit pipeline on diverse content. After 2-3 of these, the engine is battle-tested for standalone extraction.

## Coding Environment: Local-First, No Browser IDE

Project-labs do NOT include an in-browser code editor. The learner codes in their own IDE (VS Code, Cursor, etc.) and runs code on their own machine. This matches the "hands dirty" learning philosophy — real tools, real environment, real debugging.

The project-lab page provides:
- **Code blocks with copy buttons** — snippets to paste into the IDE
- **"Open in VS Code" links** — `vscode://file/{path}:{line}` links that open specific files directly (works when the project is cloned locally)
- **Collapsible "expected result" sections** — expandable panels showing what the code/output should look like after each step
- **Step-by-step diff views** — highlighted diffs showing what changed in this step
- **"What you should have so far" sections** — expandable full file state at the end of each phase

These are CSS + minor Astro component work, not new dependencies.

## Checkpoint Verification: Local Test Suites

Each project-lab phase includes a **vitest checkpoint test file** that the learner runs locally to verify their implementation:

```
project-labs/tiny-http-server/
├── phase-01-tcp/
│   ├── instructions.md
│   └── checkpoint.test.ts    ← vitest test the learner runs
├── phase-02-parser/
│   ├── instructions.md
│   └── checkpoint.test.ts
```

The learner runs:
```bash
pnpm vitest run project-labs/tiny-http-server/phase-01-tcp/checkpoint.test.ts
```

Checkpoint test example:
```typescript
import { describe, it, expect } from 'vitest';

describe('Phase 1: TCP Echo Server', () => {
  it('server.ts exports a createServer function', async () => {
    const mod = await import('../src/server.ts');
    expect(typeof mod.createServer).toBe('function');
  });

  it('server echoes data back', async () => {
    const { createServer } = await import('../src/server.ts');
    const server = createServer();
    // ... test that connecting and sending data returns the same data
    server.close();
  });

  it('server logs connections with remote address', async () => {
    // ... test that connection logging works
  });
});
```

Output:
```
✅ server.ts exports a createServer function
✅ server echoes data back
❌ server does not log connections with remote address
   → Expected: console.log called with remote address on connection
   → Hint: Use socket.remoteAddress inside the connection callback
```

Checkpoint tests are **generated by the AI agent** as part of project-lab content creation, using the same vitest already in devDependencies. Zero new infrastructure.

## Optional: AI Code Review After Checkpoint

After passing a checkpoint, the learner can optionally get AI feedback comparing their implementation with the real system:

```bash
node --experimental-strip-types scripts/review-my-code.ts tiny-http-server phase-01
```

The script:
1. Reads the learner's implementation files for that phase
2. Reads the project-lab's `realSystemComparison` for that phase
3. Optionally reads the actual target repo's corresponding code (if cloned locally)
4. Sends to the LLM API with a structured prompt:
   - "How does this implementation compare to the real system?"
   - "What simplifications did the learner make (intentionally or not)?"
   - "What would the learner need to change to get closer to production quality?"
5. Prints feedback to stdout

This uses the existing Claude API subscription, runs locally, and provides the kind of deep "your version vs. the real thing" insight that makes project-labs more valuable than just following a tutorial.

**Script:** `scripts/review-my-code.ts`

This is optional — the project-lab works without it. But it's the feature that turns a guided build into a genuinely insightful learning experience.

## Files to Create

- `src/content/knowledge/project-labs/` directory
- First project-lab content (multiple .md files)
- Checkpoint test files per phase (`.test.ts`)
- `scripts/review-my-code.ts` — AI code review CLI tool
- Potentially a project-lab rendering template if the existing `[...slug].astro` doesn't handle the nested structure well

## Files to Modify

- `src/content.config.ts` — add `project-lab` to category enum, add project-lab-specific schema fields
- `scripts/knowledge-audit/rules.ts` — add validation rules for project-labs (e.g., must have phases, each phase must have concepts, total estimated hours required)
- `src/pages/learn/index.astro` — add project-labs section
- `src/pages/learn/[...slug].astro` — render project-lab format (phases, steps, checkpoints, real system comparison callouts, diff views, collapsible expected results)
- `package.json` — add `review:my-code` script
- AGENTS.md — add project-lab content creation guidelines

## AGENTS.md Update

```markdown
### Project-labs

Project-labs are multi-session guided builds of simplified versions of real systems.
They are the most complex content type and require careful design.

When creating a project-lab:
1. Start with a clear simplification scope — what's included and what's deliberately omitted
2. Each phase must produce a testable, working increment
3. Each phase must have a "real system comparison" explaining how the simplified version
   maps to the actual system
4. Every step needs DO (instruction), OBSERVE (what to notice), EXPLAIN (why it matters)
5. Include checkpoints — concrete ways to verify each step worked
6. Link each phase to knowledge graph concepts
7. The first project-lab for a new target should start with the simplest possible scope
   and expand in follow-up project-labs

Quality bar: a project-lab must be followable by someone who has completed the
prerequisite articles. If a step requires knowledge not covered by prerequisites
or earlier phases, that's a bug.
```

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/12-project-labs`
2. Implement with tests (schema validation tests, checkpoint tests run with vitest, rendering builds successfully)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build`
4. Check all acceptance criteria below
5. Commit and stop.

## Acceptance Criteria

- [ ] `project-lab` category added to schema
- [ ] Project-lab-specific frontmatter fields validate correctly
- [ ] First project-lab created (at least 2 phases with full steps)
- [ ] Project-lab renders correctly on /learn pages (phases, steps, checkpoints, real system comparison)
- [ ] Code blocks have copy buttons
- [ ] Collapsible "expected result" sections work
- [ ] Step-by-step diff views render correctly
- [ ] Checkpoint test files exist for each phase and run with vitest
- [ ] `review-my-code.ts` script works for at least one phase
- [ ] Progress tracking works per phase
- [ ] Knowledge graph includes project-lab → concept edges
- [ ] Audit rules validate project-lab structure
- [ ] `pnpm verify` and `pnpm verify:knowledge` pass
