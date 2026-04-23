import { describe, expect, it } from 'vitest';
import {
  auditArchitectureRequiresDiagram,
  auditBroaderNarrowerSymmetry,
  auditExerciseTypeDiversity,
  auditExternalReferenceMinimum,
  auditInlineCitationDensity,
  auditKnowledgeRules,
  auditLabRequiresPrerequisites,
  auditMinimumExercises,
  auditMinimumRelatedConcepts,
  auditMinimumWordCount,
  auditModuleCompleteness,
  auditNoOrphanArticles,
  auditRequiredLearningObjectives,
  auditTechnologyCoverage,
  countWords,
} from './rules';
import type { KnowledgeArticle, KnowledgeAuditInput } from './types';

function issueCodesFor(input: KnowledgeAuditInput): string[] {
  return auditKnowledgeRules(input).map((issue) => issue.code);
}

// Generate a body with enough words and inline citations for all rules to pass
function makeBody(category: string): string {
  const minWords: Record<string, number> = {
    architecture: 1500,
    concept: 1000,
    technology: 800,
    feature: 600,
    'cs-fundamentals': 1000,
    lab: 800,
  };
  const needed = (minWords[category] ?? 800) + 50;
  const filler = Array.from({ length: needed }, (_, i) => `word${i}`).join(' ');
  return `See https://example.com/doc1 and https://example.com/doc2 and https://example.com/doc3 for details.\n\n${filler}`;
}

function cleanArticle(overrides: Partial<KnowledgeArticle> = {}): KnowledgeArticle {
  const category = overrides.category ?? 'architecture';
  return {
    id: 'architecture/overview',
    category,
    module: 'foundation',
    diagramRef: 'overview',
    relatedConcepts: ['concepts/fine-grained-reactivity'],
    prerequisites: [],
    learningObjectives: ['Describe the architecture'],
    exercises: [{ type: 'predict' }, { type: 'explain' }],
    externalReferences: [{ type: 'docs' }, { type: 'article' }],
    body: makeBody(category),
    ...overrides,
  };
}

function baseInput(overrides: Partial<KnowledgeAuditInput> = {}): KnowledgeAuditInput {
  return {
    articles: [
      cleanArticle({
        id: 'architecture/overview',
        category: 'architecture',
        module: 'foundation',
        diagramRef: 'overview',
        relatedConcepts: ['concepts/fine-grained-reactivity'],
        prerequisites: [],
      }),
      cleanArticle({
        id: 'concepts/fine-grained-reactivity',
        category: 'concept',
        module: 'foundation',
        relatedConcepts: ['architecture/overview'],
        prerequisites: ['architecture/overview'],
        diagramRef: undefined,
      }),
    ],
    modules: [{ id: 'foundation' }],
    architectureNodes: [
      { id: 'overview', category: 'astro', knowledgeSlug: 'architecture/overview' },
      {
        id: 'fine-grained-reactivity',
        category: 'concept',
        knowledgeSlug: 'concepts/fine-grained-reactivity',
      },
    ],
    architectureEdges: [{ from: 'overview', to: 'fine-grained-reactivity', type: 'dependency' }],
    ...overrides,
  };
}

describe('auditKnowledgeRules', () => {
  it('passes clean graph data', () => {
    expect(auditKnowledgeRules(baseInput())).toEqual([]);
  });

  // --- Existing rules ---

  it('reports related concepts that do not resolve to articles', () => {
    const codes = issueCodesFor(
      baseInput({
        articles: [
          cleanArticle({
            id: 'architecture/overview',
            relatedConcepts: ['concepts/missing'],
          }),
        ],
      }),
    );
    expect(codes).toContain('missing-related-concept');
  });

  it('reports prerequisites that do not resolve to articles', () => {
    const codes = issueCodesFor(
      baseInput({
        articles: [
          cleanArticle({
            id: 'concepts/fine-grained-reactivity',
            category: 'concept',
            prerequisites: ['architecture/missing'],
          }),
        ],
      }),
    );
    expect(codes).toContain('missing-prerequisite');
  });

  it('reports article modules that do not resolve to known curriculum modules', () => {
    const codes = issueCodesFor(
      baseInput({
        articles: [cleanArticle({ id: 'architecture/overview', module: 'missing-module' })],
      }),
    );
    expect(codes).toContain('unknown-module');
  });

  it('reports diagram refs that do not resolve to architecture nodes', () => {
    const codes = issueCodesFor(
      baseInput({
        articles: [cleanArticle({ id: 'architecture/overview', diagramRef: 'missing-node' })],
      }),
    );
    expect(codes).toContain('bad-diagram-ref');
  });

  it('reports architecture edges with missing endpoints', () => {
    const codes = issueCodesFor(
      baseInput({
        architectureEdges: [{ from: 'overview', to: 'missing-node', type: 'dependency' }],
      }),
    );
    expect(codes).toContain('broken-edge-endpoint');
  });

  it('reports duplicate architecture node IDs', () => {
    const codes = issueCodesFor(
      baseInput({
        architectureNodes: [
          { id: 'overview', category: 'astro' },
          { id: 'overview', category: 'solidjs' },
        ],
      }),
    );
    expect(codes).toContain('duplicate-architecture-node-id');
  });

  it('reports architecture node categories outside the allowed graph contract', () => {
    const codes = issueCodesFor(
      baseInput({
        architectureNodes: [{ id: 'overview', category: 'database' }],
      }),
    );
    expect(codes).toContain('invalid-node-category');
  });

  it('reports architecture edge types outside the allowed graph contract', () => {
    const codes = issueCodesFor(
      baseInput({
        architectureEdges: [{ from: 'overview', to: 'fine-grained-reactivity', type: 'opens' }],
      }),
    );
    expect(codes).toContain('invalid-edge-type');
  });

  it('reports architecture node knowledge slugs that do not resolve to articles', () => {
    const codes = issueCodesFor(
      baseInput({
        architectureNodes: [
          { id: 'overview', category: 'astro', knowledgeSlug: 'architecture/missing' },
        ],
      }),
    );
    expect(codes).toContain('bad-knowledge-slug');
  });

  it('reports prerequisite cycles', () => {
    const issues = auditKnowledgeRules(
      baseInput({
        articles: [
          cleanArticle({
            id: 'architecture/overview',
            prerequisites: ['concepts/fine-grained-reactivity'],
            relatedConcepts: ['concepts/fine-grained-reactivity'],
          }),
          cleanArticle({
            id: 'concepts/fine-grained-reactivity',
            category: 'concept',
            prerequisites: ['architecture/overview'],
            relatedConcepts: ['architecture/overview'],
          }),
        ],
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'prerequisite-cycle',
          message: expect.stringContaining(
            'architecture/overview -> concepts/fine-grained-reactivity -> architecture/overview',
          ),
        }),
      ]),
    );
  });
});

// --- New rules (Feature 3) ---

describe('minimum-related-concepts', () => {
  it('passes when article has at least 1 relatedConcept', () => {
    const issues = auditMinimumRelatedConcepts(
      baseInput({ articles: [cleanArticle({ relatedConcepts: ['concepts/foo'] })] }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when article has no relatedConcepts', () => {
    const issues = auditMinimumRelatedConcepts(
      baseInput({ articles: [cleanArticle({ relatedConcepts: [] })] }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('minimum-related-concepts');
    expect(issues[0]?.severity).toBe('warning');
  });

  it('warns when relatedConcepts is undefined', () => {
    const issues = auditMinimumRelatedConcepts(
      baseInput({ articles: [cleanArticle({ relatedConcepts: undefined })] }),
    );
    expect(issues).toHaveLength(1);
  });
});

describe('minimum-exercises', () => {
  it('passes when non-lab article has 2+ exercises', () => {
    const issues = auditMinimumExercises(
      baseInput({
        articles: [cleanArticle({ exercises: [{ type: 'predict' }, { type: 'explain' }] })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('errors when non-lab article has fewer than 2 exercises', () => {
    const issues = auditMinimumExercises(
      baseInput({ articles: [cleanArticle({ exercises: [{ type: 'predict' }] })] }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('minimum-exercises');
    expect(issues[0]?.severity).toBe('error');
  });

  it('skips lab articles', () => {
    const issues = auditMinimumExercises(
      baseInput({ articles: [cleanArticle({ category: 'lab', exercises: [] })] }),
    );
    expect(issues).toEqual([]);
  });
});

describe('required-learning-objectives', () => {
  it('passes when article has at least 1 learning objective', () => {
    const issues = auditRequiredLearningObjectives(
      baseInput({ articles: [cleanArticle({ learningObjectives: ['Objective 1'] })] }),
    );
    expect(issues).toEqual([]);
  });

  it('errors when article has no learning objectives', () => {
    const issues = auditRequiredLearningObjectives(
      baseInput({ articles: [cleanArticle({ learningObjectives: [] })] }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('required-learning-objectives');
    expect(issues[0]?.severity).toBe('error');
  });
});

describe('architecture-requires-diagram', () => {
  it('passes when architecture article has diagramRef', () => {
    const issues = auditArchitectureRequiresDiagram(
      baseInput({
        articles: [cleanArticle({ category: 'architecture', diagramRef: 'some-node' })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when architecture article has no diagramRef', () => {
    const issues = auditArchitectureRequiresDiagram(
      baseInput({
        articles: [cleanArticle({ category: 'architecture', diagramRef: undefined })],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('architecture-requires-diagram');
    expect(issues[0]?.severity).toBe('warning');
  });

  it('skips non-architecture articles', () => {
    const issues = auditArchitectureRequiresDiagram(
      baseInput({
        articles: [cleanArticle({ category: 'concept', diagramRef: undefined })],
      }),
    );
    expect(issues).toEqual([]);
  });
});

describe('lab-requires-prerequisites', () => {
  it('passes when lab has prerequisites', () => {
    const issues = auditLabRequiresPrerequisites(
      baseInput({
        articles: [cleanArticle({ category: 'lab', prerequisites: ['concepts/foo'] })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when lab has no prerequisites', () => {
    const issues = auditLabRequiresPrerequisites(
      baseInput({
        articles: [cleanArticle({ category: 'lab', prerequisites: [] })],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('lab-requires-prerequisites');
    expect(issues[0]?.severity).toBe('warning');
  });

  it('skips non-lab articles', () => {
    const issues = auditLabRequiresPrerequisites(
      baseInput({
        articles: [cleanArticle({ category: 'concept', prerequisites: [] })],
      }),
    );
    expect(issues).toEqual([]);
  });
});

describe('no-orphan-articles', () => {
  it('passes when article is referenced by another article', () => {
    const issues = auditNoOrphanArticles(
      baseInput({
        articles: [
          cleanArticle({ id: 'a', module: undefined, relatedConcepts: ['b'] }),
          cleanArticle({ id: 'b', module: undefined, relatedConcepts: ['a'] }),
        ],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('passes when article has a module assignment', () => {
    const issues = auditNoOrphanArticles(
      baseInput({
        articles: [cleanArticle({ id: 'a', module: 'foundation', relatedConcepts: [] })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when article is unreferenced and has no module', () => {
    const issues = auditNoOrphanArticles(
      baseInput({
        articles: [
          cleanArticle({
            id: 'a',
            module: undefined,
            relatedConcepts: [],
            prerequisites: [],
          }),
        ],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('no-orphan-articles');
    expect(issues[0]?.severity).toBe('warning');
  });

  it('considers prerequisites as references', () => {
    const issues = auditNoOrphanArticles(
      baseInput({
        articles: [
          cleanArticle({ id: 'a', module: undefined, relatedConcepts: [], prerequisites: ['b'] }),
          cleanArticle({ id: 'b', module: undefined, relatedConcepts: [] }),
        ],
      }),
    );
    // 'b' is referenced by 'a' via prerequisites, but 'a' is unreferenced and has no module
    const orphans = issues.map((i) => i.subject);
    expect(orphans).toContain('a');
    expect(orphans).not.toContain('b');
  });
});

describe('technology-coverage', () => {
  it('passes when all tech tags have matching technology articles', () => {
    const issues = auditTechnologyCoverage(
      baseInput({
        articles: [
          cleanArticle({
            id: 'technologies/solidjs',
            category: 'technology',
            technologies: ['solidjs'],
          }),
        ],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when a tech tag has no matching technology article', () => {
    const issues = auditTechnologyCoverage(
      baseInput({
        articles: [cleanArticle({ technologies: ['solidjs'] })],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('technology-coverage');
    expect(issues[0]?.subject).toBe('solidjs');
  });

  it('skips tags that have a matching article', () => {
    const issues = auditTechnologyCoverage(
      baseInput({
        articles: [
          cleanArticle({ technologies: ['solidjs', 'astro'] }),
          cleanArticle({ id: 'technologies/solidjs', category: 'technology' }),
          cleanArticle({ id: 'technologies/astro', category: 'technology' }),
        ],
      }),
    );
    expect(issues).toEqual([]);
  });
});

describe('module-completeness', () => {
  it('passes when module has 2+ articles', () => {
    const issues = auditModuleCompleteness(
      baseInput({
        articles: [
          cleanArticle({ id: 'a', module: 'foundation' }),
          cleanArticle({ id: 'b', module: 'foundation' }),
        ],
        modules: [{ id: 'foundation' }],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when module has fewer than 2 articles', () => {
    const issues = auditModuleCompleteness(
      baseInput({
        articles: [cleanArticle({ id: 'a', module: 'foundation' })],
        modules: [{ id: 'foundation' }],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('module-completeness');
    expect(issues[0]?.severity).toBe('warning');
  });

  it('warns when module has 0 articles', () => {
    const issues = auditModuleCompleteness(
      baseInput({
        articles: [],
        modules: [{ id: 'foundation' }],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('0 articles');
  });
});

describe('broader-narrower-symmetry', () => {
  it('passes when broader/narrower are symmetric', () => {
    const issues = auditBroaderNarrowerSymmetry(
      baseInput({
        articles: [
          cleanArticle({ id: 'a', broader: ['b'], narrower: [] }),
          cleanArticle({ id: 'b', broader: [], narrower: ['a'] }),
        ],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('errors when A lists B in broader but B does not list A in narrower', () => {
    const issues = auditBroaderNarrowerSymmetry(
      baseInput({
        articles: [
          cleanArticle({ id: 'a', broader: ['b'] }),
          cleanArticle({ id: 'b', narrower: [] }),
        ],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('broader-narrower-symmetry');
    expect(issues[0]?.severity).toBe('error');
  });

  it('errors when A lists B in narrower but B does not list A in broader', () => {
    const issues = auditBroaderNarrowerSymmetry(
      baseInput({
        articles: [
          cleanArticle({ id: 'a', narrower: ['b'] }),
          cleanArticle({ id: 'b', broader: [] }),
        ],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('broader-narrower-symmetry');
    expect(issues[0]?.severity).toBe('error');
  });

  it('does nothing when neither broader nor narrower is set', () => {
    const issues = auditBroaderNarrowerSymmetry(
      baseInput({
        articles: [cleanArticle({ id: 'a' }), cleanArticle({ id: 'b' })],
      }),
    );
    expect(issues).toEqual([]);
  });
});

describe('minimum-word-count', () => {
  it('passes when article meets word minimum', () => {
    const issues = auditMinimumWordCount(
      baseInput({
        articles: [cleanArticle({ category: 'architecture', body: makeBody('architecture') })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when architecture article is below 1500 words', () => {
    const issues = auditMinimumWordCount(
      baseInput({
        articles: [cleanArticle({ category: 'architecture', body: 'short text here' })],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('minimum-word-count');
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toContain('1500');
  });

  it('uses correct minimums per category', () => {
    const categories: [string, number][] = [
      ['concept', 1000],
      ['technology', 800],
      ['feature', 600],
      ['cs-fundamentals', 1000],
      ['lab', 800],
    ];
    for (const [category, min] of categories) {
      const issues = auditMinimumWordCount(
        baseInput({ articles: [cleanArticle({ category, body: 'short' })] }),
      );
      expect(issues).toHaveLength(1);
      expect(issues[0]?.message).toContain(String(min));
    }
  });

  it('skips articles with unknown category', () => {
    const issues = auditMinimumWordCount(
      baseInput({ articles: [cleanArticle({ category: 'unknown', body: 'short' })] }),
    );
    expect(issues).toEqual([]);
  });
});

describe('countWords', () => {
  it('counts words split by whitespace', () => {
    expect(countWords('hello world foo bar')).toBe(4);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('handles multiple spaces and newlines', () => {
    expect(countWords('hello   world\n\nfoo')).toBe(3);
  });
});

describe('exercise-type-diversity', () => {
  it('passes when exercises include predict type', () => {
    const issues = auditExerciseTypeDiversity(
      baseInput({
        articles: [cleanArticle({ exercises: [{ type: 'predict' }, { type: 'explain' }] })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('passes when exercises include do type', () => {
    const issues = auditExerciseTypeDiversity(
      baseInput({
        articles: [cleanArticle({ exercises: [{ type: 'do' }, { type: 'explain' }] })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when all exercises are explain only', () => {
    const issues = auditExerciseTypeDiversity(
      baseInput({
        articles: [cleanArticle({ exercises: [{ type: 'explain' }, { type: 'explain' }] })],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('exercise-type-diversity');
    expect(issues[0]?.severity).toBe('warning');
  });

  it('skips lab articles', () => {
    const issues = auditExerciseTypeDiversity(
      baseInput({
        articles: [cleanArticle({ category: 'lab', exercises: [{ type: 'explain' }] })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('skips articles with no exercises', () => {
    const issues = auditExerciseTypeDiversity(
      baseInput({ articles: [cleanArticle({ exercises: [] })] }),
    );
    expect(issues).toEqual([]);
  });
});

describe('external-reference-minimum', () => {
  it('passes with 2+ references of 2+ types', () => {
    const issues = auditExternalReferenceMinimum(
      baseInput({
        articles: [cleanArticle({ externalReferences: [{ type: 'docs' }, { type: 'article' }] })],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('warns when fewer than 2 references', () => {
    const issues = auditExternalReferenceMinimum(
      baseInput({
        articles: [cleanArticle({ externalReferences: [{ type: 'docs' }] })],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('external-reference-minimum');
    expect(issues[0]?.message).toContain('1 external references');
  });

  it('warns when 2+ references but only 1 type', () => {
    const issues = auditExternalReferenceMinimum(
      baseInput({
        articles: [cleanArticle({ externalReferences: [{ type: 'docs' }, { type: 'docs' }] })],
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('external-reference-minimum');
    expect(issues[0]?.message).toContain('1 external reference type');
  });

  it('warns when no references at all', () => {
    const issues = auditExternalReferenceMinimum(
      baseInput({ articles: [cleanArticle({ externalReferences: [] })] }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('0 external references');
  });
});

describe('inline-citation-density', () => {
  it('passes with 3+ external URLs in body', () => {
    const body = 'See https://a.com and https://b.com and https://c.com for more.';
    const issues = auditInlineCitationDensity(baseInput({ articles: [cleanArticle({ body })] }));
    expect(issues).toEqual([]);
  });

  it('warns with fewer than 3 external URLs', () => {
    const body = 'See https://a.com and https://b.com for more.';
    const issues = auditInlineCitationDensity(baseInput({ articles: [cleanArticle({ body })] }));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('inline-citation-density');
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toContain('2 inline citations');
  });

  it('warns with no URLs in body', () => {
    const issues = auditInlineCitationDensity(
      baseInput({ articles: [cleanArticle({ body: 'no links here' })] }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('0 inline citations');
  });

  it('skips articles with no body', () => {
    const issues = auditInlineCitationDensity(
      baseInput({ articles: [cleanArticle({ body: undefined })] }),
    );
    expect(issues).toEqual([]);
  });
});
