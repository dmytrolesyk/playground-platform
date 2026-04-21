import { describe, expect, it } from 'vitest';
import { auditKnowledgeRules } from './rules';
import type { KnowledgeAuditInput } from './types';

function issueCodesFor(input: KnowledgeAuditInput): string[] {
  return auditKnowledgeRules(input).map((issue) => issue.code);
}

function baseInput(overrides: Partial<KnowledgeAuditInput> = {}): KnowledgeAuditInput {
  return {
    articles: [
      {
        id: 'architecture/overview',
        category: 'architecture',
        module: 'foundation',
        diagramRef: 'overview',
        relatedConcepts: ['concepts/fine-grained-reactivity'],
        prerequisites: [],
      },
      {
        id: 'concepts/fine-grained-reactivity',
        category: 'concept',
        module: 'reactivity',
        prerequisites: ['architecture/overview'],
      },
    ],
    modules: [{ id: 'foundation' }, { id: 'reactivity' }],
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

  it('reports related concepts that do not resolve to articles', () => {
    const codes = issueCodesFor(
      baseInput({
        articles: [
          {
            id: 'architecture/overview',
            category: 'architecture',
            relatedConcepts: ['concepts/missing'],
          },
        ],
      }),
    );

    expect(codes).toContain('missing-related-concept');
  });

  it('reports prerequisites that do not resolve to articles', () => {
    const codes = issueCodesFor(
      baseInput({
        articles: [
          {
            id: 'concepts/fine-grained-reactivity',
            category: 'concept',
            prerequisites: ['architecture/missing'],
          },
        ],
      }),
    );

    expect(codes).toContain('missing-prerequisite');
  });

  it('reports article modules that do not resolve to known curriculum modules', () => {
    const codes = issueCodesFor(
      baseInput({
        articles: [
          {
            id: 'architecture/overview',
            category: 'architecture',
            module: 'missing-module',
          },
        ],
      }),
    );

    expect(codes).toContain('unknown-module');
  });

  it('reports diagram refs that do not resolve to architecture nodes', () => {
    const codes = issueCodesFor(
      baseInput({
        articles: [
          {
            id: 'architecture/overview',
            category: 'architecture',
            diagramRef: 'missing-node',
          },
        ],
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
          {
            id: 'architecture/overview',
            category: 'architecture',
            prerequisites: ['concepts/fine-grained-reactivity'],
          },
          {
            id: 'concepts/fine-grained-reactivity',
            category: 'concept',
            prerequisites: ['architecture/overview'],
          },
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
    expect(issues[0]?.message).not.toContain('architecture/overview -> architecture/overview');
  });
});
