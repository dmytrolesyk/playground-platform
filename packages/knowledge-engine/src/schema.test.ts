import { describe, expect, it } from 'vitest';
import { knowledgeSchema } from './schema.ts';

describe('knowledgeSchema exercise types', () => {
  const baseArticle = {
    title: 'Test Article',
    category: 'concept' as const,
    summary: 'A test article',
  };

  it('accepts existing exercise types (predict, explain, do, debug)', () => {
    for (const type of ['predict', 'explain', 'do', 'debug'] as const) {
      const result = knowledgeSchema.safeParse({
        ...baseArticle,
        exercises: [{ question: 'Q?', answer: 'A', type }],
      });
      expect(result.success, `type '${type}' should be valid`).toBe(true);
    }
  });

  it('accepts new exercise types (arrange, compare, trace)', () => {
    for (const type of ['arrange', 'compare', 'trace'] as const) {
      const result = knowledgeSchema.safeParse({
        ...baseArticle,
        exercises: [{ question: 'Q?', answer: 'A', type }],
      });
      expect(result.success, `type '${type}' should be valid`).toBe(true);
    }
  });

  it('rejects unknown exercise types', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [{ question: 'Q?', answer: 'A', type: 'unknown' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts arrange exercise with fragments and correctOrder', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [
        {
          question: 'Arrange these steps:',
          answer: 'The correct order is...',
          type: 'arrange',
          fragments: ['Step A', 'Step B', 'Step C'],
          correctOrder: [2, 0, 1],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const exercise = result.data.exercises[0];
      expect(exercise?.fragments).toEqual(['Step A', 'Step B', 'Step C']);
      expect(exercise?.correctOrder).toEqual([2, 0, 1]);
    }
  });

  it('accepts compare exercise with approachA and approachB', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [
        {
          question: 'Compare these approaches:',
          answer: 'Approach A is better because...',
          type: 'compare',
          approachA: '// Approach A code',
          approachB: '// Approach B code',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const exercise = result.data.exercises[0];
      expect(exercise?.approachA).toBe('// Approach A code');
      expect(exercise?.approachB).toBe('// Approach B code');
    }
  });

  it('accepts trace exercise with steps', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [
        {
          question: 'Trace the execution:',
          answer: 'The key insight is...',
          type: 'trace',
          steps: [
            { description: 'Step 1 happens', expectedState: 'State becomes X' },
            { description: 'Step 2 happens', expectedState: 'State becomes Y' },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const exercise = result.data.exercises[0];
      expect(exercise?.steps).toHaveLength(2);
      expect(exercise?.steps?.[0]?.description).toBe('Step 1 happens');
      expect(exercise?.steps?.[0]?.expectedState).toBe('State becomes X');
    }
  });

  it('accepts targetConcepts on any exercise type', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [
        {
          question: 'What happens?',
          answer: 'This happens.',
          type: 'predict',
          targetConcepts: ['concepts/fine-grained-reactivity', 'concepts/observer-pattern'],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const exercise = result.data.exercises[0];
      expect(exercise?.targetConcepts).toEqual([
        'concepts/fine-grained-reactivity',
        'concepts/observer-pattern',
      ]);
    }
  });

  it('type-specific fields are optional (arrange without fragments)', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [{ question: 'Q?', answer: 'A', type: 'arrange' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises[0]?.fragments).toBeUndefined();
      expect(result.data.exercises[0]?.correctOrder).toBeUndefined();
    }
  });

  it('type-specific fields are optional (compare without approaches)', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [{ question: 'Q?', answer: 'A', type: 'compare' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises[0]?.approachA).toBeUndefined();
      expect(result.data.exercises[0]?.approachB).toBeUndefined();
    }
  });

  it('type-specific fields are optional (trace without steps)', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [{ question: 'Q?', answer: 'A', type: 'trace' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises[0]?.steps).toBeUndefined();
    }
  });

  it('defaults exercise type to explain when not specified', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [{ question: 'Q?', answer: 'A' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises[0]?.type).toBe('explain');
    }
  });

  it('exercises default to empty array when not provided', () => {
    const result = knowledgeSchema.safeParse(baseArticle);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises).toEqual([]);
    }
  });

  it('accepts code exercise type', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [{ question: 'Write a function', answer: 'Explanation', type: 'code' }],
    });
    expect(result.success, 'code type should be valid').toBe(true);
  });

  it('accepts code exercise with all code-specific fields', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [
        {
          question: 'Write a memoize function',
          answer: 'Memoization caches results',
          type: 'code',
          starterCode: 'function memoize(fn) {\n  // your code here\n}',
          solution:
            'function memoize(fn) {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n}',
          testCases: [
            { input: 'const add = memoize((a, b) => a + b); add(1, 2);', expected: '3' },
            {
              input: 'const add = memoize((a, b) => a + b); add(1, 2); add(1, 2);',
              expected: 'fn called once',
            },
          ],
          language: 'javascript',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const exercise = result.data.exercises[0];
      expect(exercise?.type).toBe('code');
      expect(exercise?.starterCode).toContain('memoize');
      expect(exercise?.solution).toContain('Map');
      expect(exercise?.testCases).toHaveLength(2);
      expect(exercise?.language).toBe('javascript');
    }
  });

  it('accepts all language options for code exercises', () => {
    for (const language of ['typescript', 'javascript', 'python', 'html', 'css'] as const) {
      const result = knowledgeSchema.safeParse({
        ...baseArticle,
        exercises: [
          {
            question: 'Q?',
            answer: 'A',
            type: 'code',
            language,
          },
        ],
      });
      expect(result.success, `language '${language}' should be valid`).toBe(true);
    }
  });

  it('rejects invalid language for code exercises', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [
        {
          question: 'Q?',
          answer: 'A',
          type: 'code',
          language: 'rust',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('code-specific fields are optional', () => {
    const result = knowledgeSchema.safeParse({
      ...baseArticle,
      exercises: [{ question: 'Q?', answer: 'A', type: 'code' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises[0]?.starterCode).toBeUndefined();
      expect(result.data.exercises[0]?.solution).toBeUndefined();
      expect(result.data.exercises[0]?.testCases).toBeUndefined();
      expect(result.data.exercises[0]?.language).toBeUndefined();
    }
  });
});
