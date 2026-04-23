// Structured prompts for each quality review dimension.

import { stringify as stringifyYaml } from 'yaml';
import type { ArticleContent } from './types.ts';

// ── Helpers ─────────────────────────────────────────────────────────────

/** Truncate source file content to avoid exceeding context limits. */
function truncateFileContent(content: string, maxChars: number = 8000): string {
  if (content.length <= maxChars) return content;
  return `${content.slice(0, maxChars)}
... (truncated)`;
}

function formatRelatedFiles(article: ArticleContent): string {
  const entries = Object.entries(article.relatedFileContents);
  if (entries.length === 0) return '(no related files)';

  return entries
    .map(([path, content]) => `--- ${path} ---\n${truncateFileContent(content)}`)
    .join('\n\n');
}

function formatExercisesYaml(article: ArticleContent): string {
  if (article.exercises.length === 0) return '(no exercises)';
  return stringifyYaml(article.exercises);
}

function formatReferencesYaml(article: ArticleContent): string {
  if (article.externalReferences.length === 0) return '(no external references)';
  return stringifyYaml(article.externalReferences);
}

function formatLearningObjectives(article: ArticleContent): string {
  if (article.learningObjectives.length === 0) return '(no learning objectives)';
  return article.learningObjectives.map((obj) => `- ${obj}`).join('\n');
}

const JSON_REMINDER = 'Respond ONLY with valid JSON, no markdown fences, no extra text.';

// ── Dimension prompts ───────────────────────────────────────────────────

export function buildGroundingPrompt(article: ArticleContent): string {
  return `You are reviewing a technical article for accuracy.

Here is the article titled "${article.title}":

${article.body}

Here are the actual source files the article references:

${formatRelatedFiles(article)}

Task: Check if the article accurately describes what the code does AND whether inline citations are used correctly. List any:
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

${JSON_REMINDER}
Respond as JSON: { "score": N, "issues": ["issue1", "issue2"], "rationale": "..." }`;
}

export function buildDepthPrompt(article: ArticleContent): string {
  return `You are evaluating the depth of a technical explanation.

Here is the article titled "${article.title}":

${article.body}

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

${JSON_REMINDER}
Respond as JSON: { "score": N, "rationale": "...", "suggestedImprovements": ["improvement1", "improvement2"] }`;
}

export function buildCoveragePrompt(article: ArticleContent): string {
  return `You are evaluating the completeness of a technical article.

Concept being explained: ${article.title}
Article content:

${article.body}

Source files referenced:

${formatRelatedFiles(article)}

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

${JSON_REMINDER}
Respond as JSON: { "score": N, "missingTopics": ["topic1", "topic2"], "rationale": "..." }`;
}

export function buildExerciseQualityPrompt(article: ArticleContent): string {
  return `You are evaluating the quality of learning exercises.

Here are the exercises for an article about "${article.title}":

${formatExercisesYaml(article)}

Task: Evaluate whether these exercises test genuine understanding vs. surface recall. Check:
- Do "predict" exercises require reasoning about behavior, not just memory?
- Do "explain" exercises require synthesis, not just repetition of the article?
- Do "do" exercises require meaningful action, not just copy-pasting?
- Are the answers thorough and educational?
- Do the exercises cover the article's key learning objectives?

Learning objectives:
${formatLearningObjectives(article)}

Score 1-5:
5 = Exercises thoroughly test understanding at multiple Bloom's levels
4 = Good exercises, test real understanding
3 = Adequate but could be more challenging
2 = Mostly recall-based
1 = Trivial or missing

${JSON_REMINDER}
Respond as JSON: { "score": N, "rationale": "...", "suggestedExercises": ["exercise1", "exercise2"] }`;
}

export function buildReferenceQualityPrompt(article: ArticleContent): string {
  return `Here are the external references for an article about "${article.title}":

${formatReferencesYaml(article)}

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

${JSON_REMINDER}
Respond as JSON: { "score": N, "rationale": "...", "suggestedReferences": ["reference1", "reference2"] }`;
}
