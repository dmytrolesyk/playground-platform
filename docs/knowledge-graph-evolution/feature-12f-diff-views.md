# Feature 12f: Step-by-Step Diff Views (Enhancement)

_Status: Deferred — not part of core Feature 12 delivery_

## Goal

Add diff rendering to project-lab phases, showing what changed at each step.

## Rationale for Deferral

No platform in the prior-art study (CodeCrafters, Exercism, Odin Project, freeCodeCamp, boot.dev) provides step-by-step diff rendering. All use code blocks with copy buttons. Diff rendering requires either a library (diff2html ~45KB) or custom implementation, plus syntax highlighting within diffs. The project-lab format works well without them.

## When to Build

After Feature 12e validates the format. If learner feedback indicates that "seeing what changed" is more valuable than "seeing the full code," implement this.

## Approach Options

**Option A: diff2html library**
- ~45KB, well-maintained, supports syntax highlighting
- Renders side-by-side or unified diffs
- Would need lazy loading (lazy boundary rule)
- Input: two code strings, output: highlighted diff HTML

**Option B: Custom minimal diff renderer**
- Show added/removed lines with `+`/`-` prefix and green/red backgrounds
- No syntax highlighting within diffs
- Much smaller, no dependency
- Sufficient for the use case

**Option C: Git-based diffs from committed step snapshots**
- Each step's code is committed to a branch
- Diff is computed at build time from git history
- Most accurate, but complex build pipeline

**Recommendation:** Option A (diff2html) behind a `lazy()` boundary. It's a mature solution and the bundle cost is acceptable when lazy-loaded.

## Content Format

Diffs would be authored as paired code blocks in the Markdown:

````markdown
```diff-step from="step-1" to="step-2"
- const server = createServer((socket) => {
-   socket.on('data', (data) => socket.write(data));
- });
+ const server = createServer((socket) => {
+   console.log(`Connection from ${socket.remoteAddress}`);
+   socket.on('data', (data) => socket.write(data));
+ });
```
````

A rehype plugin would detect `language-diff-step` and render it with diff2html.

## Estimated Effort

1 weekend.
