# Feature 12h: AI Code Review Script (Enhancement)

_Status: Deferred — not part of core Feature 12 delivery_

## Goal

Create a CLI script that compares the learner's implementation with the real system and provides AI-powered feedback.

## Rationale for Deferral

This feature requires:
- LLM API integration (env var management, cost management)
- Learner project path resolution (where is their code?)
- Target repo comparison logic (which files map to which phase?)
- Prompt engineering for useful feedback

All of these are orthogonal to the project-lab format. The project-lab works perfectly without AI review. The existing `review-article.ts` script provides a pattern to follow when this is eventually built.

## When to Build

After completing 2+ project-labs and validating that learners want comparative feedback (not just "does my code work?" but "how does mine compare to the real thing?").

## Approach

**Script:** `scripts/review-my-code.ts`

**Usage:**
```bash
REVIEW_API_KEY=sk-... node --experimental-strip-types scripts/review-my-code.ts \
  --project-lab tiny-app-framework \
  --phase 2 \
  --learner-dir ~/projects/my-tiny-framework/
```

**The script:**
1. Reads the phase's `realSystemComparison` and `buildObjective`
2. Reads the learner's implementation files from `--learner-dir`
3. Optionally reads the real system's corresponding files (e.g., `src/components/desktop/apps/registry.ts`)
4. Sends to the LLM with a structured prompt comparing the three: spec, learner code, real code
5. Outputs feedback: what's similar, what's different, what the learner would need to change to get closer to production quality

**Env vars:** Shares `REVIEW_API_KEY`, `REVIEW_MODEL`, `REVIEW_PROVIDER` with the existing `review-article.ts`.

## Estimated Effort

1 weekend.
