// Types for the AI-assisted content review CLI.

import type { Result } from '@playground/knowledge-engine/result';

export type ReviewDimension =
  | 'grounding'
  | 'depth'
  | 'coverage'
  | 'exerciseQuality'
  | 'referenceQuality';

export interface DimensionResult {
  score: number;
  rationale: string;
  error?: string;
  // Dimension-specific optional fields
  issues?: string[];
  suggestedImprovements?: string[];
  missingTopics?: string[];
  suggestedExercises?: string[];
  suggestedReferences?: string[];
}

export interface QualityReport {
  articleId: string;
  reviewedAt: string;
  overallScore: number;
  dimensions: Record<ReviewDimension, DimensionResult>;
  model: string;
  articleLastUpdated: string;
}

export interface ArticleContent {
  slug: string;
  title: string;
  body: string;
  frontmatter: Record<string, unknown>;
  relatedFileContents: Record<string, string>;
  exercises: unknown[];
  learningObjectives: string[];
  externalReferences: unknown[];
  lastUpdated?: string;
}

export type CliArgs =
  | { mode: 'single'; slug: string }
  | { mode: 'all' }
  | { mode: 'since'; since: string };

export interface LlmProvider {
  complete(prompt: string): Promise<Result<string, string>>;
}
