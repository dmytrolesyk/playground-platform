# Feature 5b: AI-Assisted Content Review CLI

## Goal

Add an AI-assisted review CLI tool that evaluates article content quality across 5 dimensions using structured LLM prompts. This completes the three-tier quality pipeline: Feature 3 + 5a provide deterministic checks (Tier A) and human feedback (Tier C); this feature adds model-based evaluation (Tier B).

**When to implement:** After content volume reaches ~80+ articles (post-Phase 2 mini-cycle or later). At ~40 articles, hand-reviewing flagged content is practical. The AI review tool becomes cost-effective when the volume exceeds what a human can reasonably audit.

## Depends On

Feature 5a (Tier A checks + human feedback infrastructure)

## Applicable Skills

- `node` — CLI script design, LLM API integration, structured JSON output parsing, error handling
- `test-driven-development` — at least a smoke test that the script runs without crashing
- `deep-research` - for conducting research for articles (should be used sparingly, whenever is necessary)

## CLI Tool

**Script:** `scripts/review-article.ts`

**Usage:**

```bash
# Review a single article
node --experimental-strip-types scripts/review-article.ts concepts/fine-grained-reactivity

# Review all articles
node --experimental-strip-types scripts/review-article.ts --all

# Review articles modified since a date
node --experimental-strip-types scripts/review-article.ts --since 2026-04-20
```

**Output:** A quality report per article, written to `src/data/quality-reports/{article-slug}.json` and summarized to stdout.

## Five Quality Dimensions

The tool sends the article content + relevant source files to an LLM with structured evaluation prompts. Each dimension gets a score (1-5) and a written rationale.

### 1. Factual Grounding (does the explanation match the code AND the cited sources?)

**Prompt pattern:**

```
You are reviewing a technical article for accuracy. Here is the article:
{article body}

Here are the actual source files the article references:
{content of each relatedFiles entry}

Here are the external sources cited inline in the article:
{list of inline citation URLs with surrounding context}

Task: Check if the article accurately describes what the code does AND whether
inline citations are used correctly. List any:
- Factual errors (article says X, code does Y)
- Outdated claims (article describes old behavior)
- Misleading simplifications (technically true but creates wrong mental model)
- Citation misuse (inline link claims source says X, but source actually says Y)
- Unsupported claims (major assertion with no inline citation to a source)

Score 1-5:
5 = Fully accurate, no issues
4 = Minor inaccuracies that don't affect understanding
3 = Some inaccuracies that could confuse
2 = Significant errors
1 = Fundamentally wrong

Respond as JSON: { "score": N, "issues": [...], "rationale": "..." }
```

### 2. Depth (does it explain WHY, not just WHAT?)

**Prompt pattern:**

```
You are evaluating the depth of a technical explanation. Here is the article:
{article body}

Task: Evaluate whether this article explains the underlying reasoning, not just the surface behavior. Check for:
- Does it explain WHY this approach was chosen?
- Does it connect to underlying CS principles or design patterns?
- Does it discuss tradeoffs and alternatives?
- Would a reader understand the concept deeply enough to apply it in a different context?

Score 1-5:
5 = Exceptional depth — explains principles, tradeoffs, and transferable insights
4 = Good depth — covers why, not just what
3 = Adequate — some depth but mostly descriptive
2 = Shallow — mostly restates what the code does
1 = Surface-level summary only

Respond as JSON: { "score": N, "rationale": "...", "suggestedImprovements": [...] }
```

### 3. Coverage (does it cover the important aspects?)

**Prompt pattern:**

```
You are evaluating the completeness of a technical article.

Concept being explained: {title}
Article content: {article body}
Source files referenced: {relatedFiles content}

Task: What important aspects of this concept are NOT adequately covered? Consider:
- Key behaviors or edge cases
- Common misconceptions
- Performance implications
- Security considerations (if relevant)
- Relationship to other concepts in the system

Score 1-5:
5 = Comprehensive — covers all important aspects
4 = Good coverage — minor gaps only
3 = Adequate — missing 1-2 important aspects
2 = Incomplete — missing significant aspects
1 = Major gaps

Respond as JSON: { "score": N, "missingTopics": [...], "rationale": "..." }
```

### 4. Exercise Quality (do the exercises test real understanding?)

**Prompt pattern:**

```
You are evaluating the quality of learning exercises. Here are the exercises for an article about "{title}":

{exercises as YAML}

Task: Evaluate whether these exercises test genuine understanding vs. surface recall. Check:
- Do "predict" exercises require reasoning about behavior, not just memory?
- Do "explain" exercises require synthesis, not just repetition of the article?
- Do "do" exercises require meaningful action, not just copy-pasting?
- Are the answers thorough and educational?
- Do the exercises cover the article's key learning objectives?

Learning objectives: {learningObjectives}

Score 1-5:
5 = Exercises thoroughly test understanding at multiple Bloom's levels
4 = Good exercises, test real understanding
3 = Adequate but could be more challenging
2 = Mostly recall-based
1 = Trivial or missing

Respond as JSON: { "score": N, "rationale": "...", "suggestedExercises": [...] }
```

### 5. External Reference Quality (are references authoritative and diverse?)

**Prompt pattern:**

```
Here are the external references for an article about "{title}":

{externalReferences as YAML}

Task: Evaluate the quality and relevance of these references. Check:
- Are they from authoritative sources (official docs, reputable authors, peer-reviewed)?
- Are they diverse in type (docs, articles, talks, repos)?
- Are they still likely to be current and available?
- Do they provide genuine additional learning value beyond the article itself?
- Are there obvious missing references (e.g., official docs not cited)?

Score 1-5:
5 = Excellent references — authoritative, diverse, high learning value
4 = Good references
3 = Adequate but could be stronger
2 = Weak — low authority or low relevance
1 = Poor or missing

Respond as JSON: { "score": N, "rationale": "...", "suggestedReferences": [...] }
```

## Quality Report Schema

```json
{
  "articleId": "concepts/fine-grained-reactivity",
  "reviewedAt": "2026-04-22T15:00:00Z",
  "overallScore": 4.2,
  "dimensions": {
    "grounding": { "score": 5, "issues": [], "rationale": "..." },
    "depth": { "score": 4, "rationale": "...", "suggestedImprovements": [] },
    "coverage": { "score": 4, "missingTopics": ["..."], "rationale": "..." },
    "exerciseQuality": { "score": 4, "rationale": "...", "suggestedExercises": [] },
    "referenceQuality": { "score": 4, "rationale": "...", "suggestedReferences": [] }
  },
  "model": "claude-sonnet-4-20250514",
  "articleLastUpdated": "2026-04-20"
}
```

`overallScore` = weighted average: grounding (30%), depth (25%), coverage (20%), exercises (15%), references (10%).

## Integration with the System

- Quality reports are stored in `src/data/quality-reports/` as JSON files
- The stats dashboard (Feature 2) can display aggregate quality metrics
- Cytoscape.js (Feature 6) can optionally color nodes by quality score
- Articles below a threshold (e.g., overall < 3.0) are flagged for rewrite
- The AI review prompts can suggest specific improvements, which feed back into the AI agent's next revision

## Configuration

The script needs an LLM API key. Use environment variable:

```bash
REVIEW_API_KEY=sk-... node --experimental-strip-types scripts/review-article.ts concepts/fine-grained-reactivity
```

Model choice should be configurable. Default to whatever model the builder is already using for content generation. Ideally use a **different** model for review than for generation (to avoid correlated blind spots), but same model is acceptable for a personal project.

## Files to Create

- `scripts/review-article.ts` — AI-assisted review CLI tool
- `src/data/quality-reports/` — directory for quality report JSON files

## Files to Modify

- `package.json` — add `review:article` script

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/05b-ai-review`
2. Implement with tests (at least a smoke test that the script runs without crashing on one article)
3. Verify: `pnpm verify` + `pnpm build`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] `review-article.ts` runs on a single article and produces a quality report JSON
- [ ] All 5 dimensions scored with rationale
- [ ] Report includes suggested improvements
- [ ] `--all` flag reviews all articles (with rate limiting)
- [ ] `--since` flag filters by date
- [ ] Reports stored in `src/data/quality-reports/`
- [ ] Script handles API errors gracefully (timeout, rate limit, missing key)
- [ ] `pnpm verify` still passes

---

## AGENTS.md Update

Add to the content quality section:

```markdown
### Content quality review (AI-assisted)

After writing or significantly updating a knowledge article, run the quality review:
`node --experimental-strip-types scripts/review-article.ts {article-slug}`

The review scores 5 dimensions (1-5 each): grounding, depth, coverage, exercise quality,
reference quality. Articles scoring below 3.0 overall must be revised before merging.

When revising based on quality feedback:
- Grounding issues: re-read the actual source files in `relatedFiles`, correct inaccuracies
- Depth issues: add WHY explanations, connect to underlying principles, discuss tradeoffs
- Coverage issues: address the specific missing topics listed in the report
- Exercise issues: add predict/do exercises, make answers more thorough
- Reference issues: find authoritative sources (official docs, reputable authors)
```
