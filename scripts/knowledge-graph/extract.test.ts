import { extractKnowledgeGraph, formatTechnologyLabel } from '@playground/knowledge-engine/graph';
import type { ExtractionInput } from '@playground/knowledge-engine/graph/types';
import { describe, expect, it } from 'vitest';

const FIXED_DATE = '2026-04-22T00:00:00.000Z';

function baseInput(overrides: Partial<ExtractionInput> = {}): ExtractionInput {
  return {
    articles: overrides.articles ?? [
      {
        id: 'architecture/overview',
        title: 'The Big Picture',
        category: 'architecture',
        difficulty: 'beginner',
        module: 'foundation',
        estimatedMinutes: 15,
        technologies: ['solidjs', 'astro'],
        relatedConcepts: ['concepts/fine-grained-reactivity'],
        prerequisites: [],
        diagramRef: 'desktop',
        exerciseCount: 3,
        learningObjectiveCount: 2,
      },
      {
        id: 'concepts/fine-grained-reactivity',
        title: 'Fine-Grained Reactivity',
        category: 'concept',
        difficulty: 'intermediate',
        module: 'reactivity',
        estimatedMinutes: 20,
        technologies: ['solidjs'],
        relatedConcepts: [],
        prerequisites: ['architecture/overview'],
        diagramRef: undefined,
        exerciseCount: 0,
        learningObjectiveCount: 0,
      },
    ],
    modules: overrides.modules ?? [
      { id: 'foundation', title: 'The Foundation', order: 1 },
      { id: 'reactivity', title: 'Why SolidJS?', order: 2 },
    ],
    architectureNodes: overrides.architectureNodes ?? [
      {
        id: 'desktop',
        label: 'Desktop',
        category: 'solidjs',
        knowledgeSlug: 'architecture/overview',
      },
      {
        id: 'app-registry',
        label: 'APP_REGISTRY',
        category: 'registry',
        knowledgeSlug: undefined,
      },
    ],
    architectureEdges: overrides.architectureEdges ?? [
      { from: 'desktop', to: 'app-registry', type: 'dependency' },
    ],
  };
}

describe('extractKnowledgeGraph', () => {
  it('produces valid JSON-serializable output', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const json = JSON.stringify(graph);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('creates article nodes from input articles', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const articleNodes = graph.nodes.filter((n) => n.type === 'article');
    expect(articleNodes).toHaveLength(2);

    const overview = articleNodes.find((n) => n.id === 'architecture/overview');
    expect(overview).toEqual({
      id: 'architecture/overview',
      type: 'article',
      label: 'The Big Picture',
      category: 'architecture',
      difficulty: 'beginner',
      module: 'foundation',
      estimatedMinutes: 15,
      technologies: ['solidjs', 'astro'],
      hasExercises: true,
      exerciseCount: 3,
      hasLearningObjectives: true,
      diagramRef: 'desktop',
    });
  });

  it('handles articles with no optional fields', () => {
    const input = baseInput({
      articles: [
        {
          id: 'features/test',
          title: 'Test Feature',
          category: 'feature',
          difficulty: undefined,
          module: undefined,
          estimatedMinutes: undefined,
          technologies: [],
          relatedConcepts: [],
          prerequisites: [],
          diagramRef: undefined,
          exerciseCount: 0,
          learningObjectiveCount: 0,
        },
      ],
    });
    const graph = extractKnowledgeGraph(input, FIXED_DATE);
    const node = graph.nodes.find((n) => n.id === 'features/test');
    expect(node).toMatchObject({
      difficulty: null,
      module: null,
      estimatedMinutes: null,
      diagramRef: null,
      hasExercises: false,
      hasLearningObjectives: false,
    });
  });

  it('synthesizes deduplicated technology nodes', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const techNodes = graph.nodes.filter((n) => n.type === 'technology');
    // Both articles use 'solidjs', one also uses 'astro' → 2 unique techs
    expect(techNodes).toHaveLength(2);
    expect(techNodes.map((n) => n.id).sort()).toEqual(['tech:astro', 'tech:solidjs']);
  });

  it('creates module nodes from input modules', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const moduleNodes = graph.nodes.filter((n) => n.type === 'module');
    expect(moduleNodes).toHaveLength(2);
    expect(moduleNodes[0]).toEqual({
      id: 'module:foundation',
      type: 'module',
      label: 'The Foundation',
      order: 1,
    });
  });

  it('creates architecture nodes with arch: prefix', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const archNodes = graph.nodes.filter((n) => n.type === 'architecture-node');
    expect(archNodes).toHaveLength(2);
    expect(archNodes[0]).toEqual({
      id: 'arch:desktop',
      type: 'architecture-node',
      label: 'Desktop',
      category: 'solidjs',
      knowledgeSlug: 'architecture/overview',
    });
    expect(archNodes[1]).toMatchObject({
      id: 'arch:app-registry',
      knowledgeSlug: null,
    });
  });

  it('creates relatedConcept edges', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const related = graph.edges.filter((e) => e.type === 'relatedConcept');
    expect(related).toEqual([
      {
        source: 'architecture/overview',
        target: 'concepts/fine-grained-reactivity',
        type: 'relatedConcept',
      },
    ]);
  });

  it('creates prerequisite edges', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const prereqs = graph.edges.filter((e) => e.type === 'prerequisite');
    expect(prereqs).toEqual([
      {
        source: 'concepts/fine-grained-reactivity',
        target: 'architecture/overview',
        type: 'prerequisite',
      },
    ]);
  });

  it('creates usesTechnology edges', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const techEdges = graph.edges.filter((e) => e.type === 'usesTechnology');
    expect(techEdges).toHaveLength(3); // overview: solidjs + astro, reactivity: solidjs
    expect(techEdges).toContainEqual({
      source: 'architecture/overview',
      target: 'tech:solidjs',
      type: 'usesTechnology',
    });
    expect(techEdges).toContainEqual({
      source: 'architecture/overview',
      target: 'tech:astro',
      type: 'usesTechnology',
    });
  });

  it('creates belongsToModule edges', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const moduleEdges = graph.edges.filter((e) => e.type === 'belongsToModule');
    expect(moduleEdges).toHaveLength(2);
    expect(moduleEdges).toContainEqual({
      source: 'architecture/overview',
      target: 'module:foundation',
      type: 'belongsToModule',
    });
  });

  it('creates hasDiagramRef edges only when diagramRef is set', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const diagramEdges = graph.edges.filter((e) => e.type === 'hasDiagramRef');
    expect(diagramEdges).toHaveLength(1);
    expect(diagramEdges[0]).toEqual({
      source: 'architecture/overview',
      target: 'arch:desktop',
      type: 'hasDiagramRef',
    });
  });

  it('creates architecture edges with arch: prefix', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    const archEdges = graph.edges.filter((e) => e.type === 'dependency');
    expect(archEdges).toContainEqual({
      source: 'arch:desktop',
      target: 'arch:app-registry',
      type: 'dependency',
    });
  });

  it('computes correct metadata', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    expect(graph.metadata.generatedAt).toBe(FIXED_DATE);
    expect(graph.metadata.articleCount).toBe(2);
    expect(graph.metadata.edgeCount).toBe(graph.edges.length);
    expect(graph.metadata.categories).toEqual(['architecture', 'concept']);
  });

  it('produces correct total node count', () => {
    const graph = extractKnowledgeGraph(baseInput(), FIXED_DATE);
    // 2 articles + 2 technologies + 2 modules + 2 architecture nodes = 8
    expect(graph.nodes).toHaveLength(8);
  });

  it('handles empty input', () => {
    const input: ExtractionInput = {
      articles: [],
      modules: [],
      architectureNodes: [],
      architectureEdges: [],
    };
    const graph = extractKnowledgeGraph(input, FIXED_DATE);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
    expect(graph.metadata.articleCount).toBe(0);
    expect(graph.metadata.edgeCount).toBe(0);
    expect(graph.metadata.categories).toEqual([]);
  });
});

describe('formatTechnologyLabel', () => {
  it('maps known slugs to human labels', () => {
    expect(formatTechnologyLabel('solidjs')).toBe('SolidJS');
    expect(formatTechnologyLabel('98css')).toBe('98.css');
    expect(formatTechnologyLabel('typescript')).toBe('TypeScript');
    expect(formatTechnologyLabel('node')).toBe('Node.js');
  });

  it('returns the slug as-is for unknown technologies', () => {
    expect(formatTechnologyLabel('unknown-tech')).toBe('unknown-tech');
  });
});
