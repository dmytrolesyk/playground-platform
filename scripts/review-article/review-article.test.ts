import { describe, expect, it } from 'vitest';
import {
  buildCoveragePrompt,
  buildDepthPrompt,
  buildExerciseQualityPrompt,
  buildGroundingPrompt,
  buildReferenceQualityPrompt,
} from './prompts.ts';
import { createProvider } from './providers.ts';
import type { ArticleContent, LlmProvider } from './types.ts';

// ── Test fixtures ───────────────────────────────────────────────────────

const SAMPLE_ARTICLE: ArticleContent = {
  slug: 'concepts/test-article',
  title: 'Test Article',
  body: '# Test Article\n\nThis explains a concept with [a citation](https://example.com).\n',
  frontmatter: {
    title: 'Test Article',
    category: 'concept',
    relatedFiles: ['src/components/Example.tsx'],
  },
  relatedFileContents: {
    'src/components/Example.tsx': 'export function Example() { return <div>Hello</div>; }',
  },
  exercises: [
    {
      question: 'What happens when X?',
      type: 'predict',
      answer: 'Y happens because Z.',
    },
  ],
  learningObjectives: ['Understand the concept of X', 'Apply X in context Y'],
  externalReferences: [
    { title: 'Official Docs', url: 'https://example.com/docs', type: 'docs' },
    { title: 'Deep Dive Article', url: 'https://example.com/article', type: 'article' },
  ],
  lastUpdated: '2026-04-20',
};

// ── Prompt generation tests ─────────────────────────────────────────────

describe('review-article prompts', () => {
  it('builds a grounding prompt with article body and related files', () => {
    const prompt = buildGroundingPrompt(SAMPLE_ARTICLE);
    expect(prompt).toContain('Test Article');
    expect(prompt).toContain('This explains a concept');
    expect(prompt).toContain('src/components/Example.tsx');
    expect(prompt).toContain('export function Example');
    expect(prompt).toContain('Score 1-5');
    expect(prompt).toContain('"score"');
  });

  it('builds a depth prompt with article body', () => {
    const prompt = buildDepthPrompt(SAMPLE_ARTICLE);
    expect(prompt).toContain('Test Article');
    expect(prompt).toContain('This explains a concept');
    expect(prompt).toContain('WHY');
    expect(prompt).toContain('suggestedImprovements');
  });

  it('builds a coverage prompt with article body and related files', () => {
    const prompt = buildCoveragePrompt(SAMPLE_ARTICLE);
    expect(prompt).toContain('Test Article');
    expect(prompt).toContain('missingTopics');
    expect(prompt).toContain('src/components/Example.tsx');
  });

  it('builds an exercise quality prompt with exercises and objectives', () => {
    const prompt = buildExerciseQualityPrompt(SAMPLE_ARTICLE);
    expect(prompt).toContain('Test Article');
    expect(prompt).toContain('What happens when X?');
    expect(prompt).toContain('Understand the concept of X');
    expect(prompt).toContain('suggestedExercises');
  });

  it('builds a reference quality prompt with external references', () => {
    const prompt = buildReferenceQualityPrompt(SAMPLE_ARTICLE);
    expect(prompt).toContain('Test Article');
    expect(prompt).toContain('Official Docs');
    expect(prompt).toContain('https://example.com/docs');
    expect(prompt).toContain('suggestedReferences');
  });

  it('handles article with no related files', () => {
    const article: ArticleContent = {
      ...SAMPLE_ARTICLE,
      relatedFileContents: {},
    };
    const prompt = buildGroundingPrompt(article);
    expect(prompt).toContain('(no related files)');
  });

  it('handles article with no exercises', () => {
    const article: ArticleContent = {
      ...SAMPLE_ARTICLE,
      exercises: [],
    };
    const prompt = buildExerciseQualityPrompt(article);
    expect(prompt).toContain('(no exercises)');
  });

  it('handles article with no learning objectives', () => {
    const article: ArticleContent = {
      ...SAMPLE_ARTICLE,
      learningObjectives: [],
    };
    const prompt = buildExerciseQualityPrompt(article);
    expect(prompt).toContain('(no learning objectives)');
  });

  it('handles article with no external references', () => {
    const article: ArticleContent = {
      ...SAMPLE_ARTICLE,
      externalReferences: [],
    };
    const prompt = buildReferenceQualityPrompt(article);
    expect(prompt).toContain('(no external references)');
  });
});

// ── Provider factory tests ──────────────────────────────────────────────

describe('review-article providers', () => {
  it('creates an Anthropic provider', () => {
    const provider: LlmProvider = createProvider('anthropic', 'test-key', 'test-model');
    expect(provider).toBeDefined();
    expect(typeof provider.complete).toBe('function');
  });

  it('creates an OpenAI provider', () => {
    const provider: LlmProvider = createProvider('openai', 'test-key', 'test-model');
    expect(provider).toBeDefined();
    expect(typeof provider.complete).toBe('function');
  });
});
