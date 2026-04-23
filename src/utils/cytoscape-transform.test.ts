import type { KnowledgeGraph } from '@playground/knowledge-engine/graph/types';
import { describe, expect, it } from 'vitest';
import {
  getCategories,
  getEdgeTypes,
  getNodeTypes,
  toCytoscapeElements,
} from './cytoscape-transform';

function makeGraph(overrides: Partial<KnowledgeGraph> = {}): KnowledgeGraph {
  return {
    nodes: [],
    edges: [],
    metadata: {
      generatedAt: '2026-01-01T00:00:00Z',
      articleCount: 0,
      edgeCount: 0,
      categories: [],
    },
    ...overrides,
  };
}

describe('toCytoscapeElements', () => {
  it('returns empty arrays for an empty graph', () => {
    const result = toCytoscapeElements(makeGraph());
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('transforms article nodes with correct data and classes', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'architecture/overview',
          type: 'article',
          label: 'Architecture Overview',
          category: 'architecture',
          difficulty: 'beginner',
          module: 'foundation',
          estimatedMinutes: 15,
          technologies: ['solidjs'],
          hasExercises: true,
          exerciseCount: 3,
          hasLearningObjectives: true,
          diagramRef: null,
        },
      ],
    });

    const result = toCytoscapeElements(graph);
    expect(result.nodes).toHaveLength(1);

    const [node] = result.nodes;
    expect(node).toBeDefined();
    if (!node) throw new Error('Expected transformed node');

    expect(node.data.id).toBe('architecture/overview');
    expect(node.data.label).toBe('Architecture Overview');
    expect(node.data.nodeType).toBe('article');
    expect(node.data.category).toBe('architecture');
    expect(node.data.difficulty).toBe('beginner');
    expect(node.data.parent).toBe('module:foundation');
    expect(node.classes).toBe('article cat-architecture');
  });

  it('assigns correct category classes to articles', () => {
    const categories = [
      'architecture',
      'concept',
      'technology',
      'feature',
      'cs-fundamentals',
      'lab',
    ];
    const expectedClasses = [
      'article cat-architecture',
      'article cat-concept',
      'article cat-technology',
      'article cat-feature',
      'article cat-cs-fundamentals',
      'article cat-lab',
    ];

    for (let i = 0; i < categories.length; i++) {
      const graph = makeGraph({
        nodes: [
          {
            id: `test/${categories[i]}`,
            type: 'article',
            label: `Test ${categories[i]}`,
            category: categories[i] ?? 'concept',
            difficulty: null,
            module: null,
            estimatedMinutes: null,
            technologies: [],
            hasExercises: false,
            exerciseCount: 0,
            hasLearningObjectives: false,
            diagramRef: null,
          },
        ],
      });

      const result = toCytoscapeElements(graph);
      expect(result.nodes[0]?.classes).toBe(expectedClasses[i]);
    }
  });

  it('does not set parent when article has no module', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'test/orphan',
          type: 'article',
          label: 'Orphan',
          category: 'concept',
          difficulty: null,
          module: null,
          estimatedMinutes: null,
          technologies: [],
          hasExercises: false,
          exerciseCount: 0,
          hasLearningObjectives: false,
          diagramRef: null,
        },
      ],
    });

    const result = toCytoscapeElements(graph);
    expect(result.nodes[0]?.data.parent).toBeUndefined();
  });

  it('transforms technology nodes', () => {
    const graph = makeGraph({
      nodes: [{ id: 'tech:solidjs', type: 'technology', label: 'SolidJS' }],
    });

    const result = toCytoscapeElements(graph);
    expect(result.nodes[0]?.data.nodeType).toBe('technology');
    expect(result.nodes[0]?.classes).toBe('technology');
  });

  it('transforms module nodes', () => {
    const graph = makeGraph({
      nodes: [{ id: 'module:foundation', type: 'module', label: 'The Foundation', order: 1 }],
    });

    const result = toCytoscapeElements(graph);
    expect(result.nodes[0]?.data.nodeType).toBe('module');
    expect(result.nodes[0]?.classes).toBe('module');
  });

  it('transforms architecture nodes', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'arch:content-collections',
          type: 'architecture-node',
          label: 'Content Collections',
          category: 'astro',
          knowledgeSlug: 'architecture/overview',
        },
      ],
    });

    const result = toCytoscapeElements(graph);
    expect(result.nodes[0]?.data.nodeType).toBe('architecture-node');
    expect(result.nodes[0]?.data.knowledgeSlug).toBe('architecture/overview');
    expect(result.nodes[0]?.classes).toBe('architecture-node');
  });

  it('transforms edges with correct data', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'a',
          type: 'article',
          label: 'A',
          category: 'concept',
          difficulty: null,
          module: null,
          estimatedMinutes: null,
          technologies: [],
          hasExercises: false,
          exerciseCount: 0,
          hasLearningObjectives: false,
          diagramRef: null,
        },
        {
          id: 'b',
          type: 'article',
          label: 'B',
          category: 'concept',
          difficulty: null,
          module: null,
          estimatedMinutes: null,
          technologies: [],
          hasExercises: false,
          exerciseCount: 0,
          hasLearningObjectives: false,
          diagramRef: null,
        },
      ],
      edges: [{ source: 'a', target: 'b', type: 'prerequisite' }],
    });

    const result = toCytoscapeElements(graph);
    expect(result.edges).toHaveLength(1);

    const [edge] = result.edges;
    expect(edge).toBeDefined();
    if (!edge) throw new Error('Expected transformed edge');

    expect(edge.data.source).toBe('a');
    expect(edge.data.target).toBe('b');
    expect(edge.data.edgeType).toBe('prerequisite');
    expect(edge.data.id).toBe('e0');
  });

  it('filters out edges with missing source or target nodes', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'a',
          type: 'article',
          label: 'A',
          category: 'concept',
          difficulty: null,
          module: null,
          estimatedMinutes: null,
          technologies: [],
          hasExercises: false,
          exerciseCount: 0,
          hasLearningObjectives: false,
          diagramRef: null,
        },
      ],
      edges: [
        { source: 'a', target: 'missing', type: 'prerequisite' },
        { source: 'missing', target: 'a', type: 'relatedConcept' },
      ],
    });

    const result = toCytoscapeElements(graph);
    expect(result.edges).toHaveLength(0);
  });

  it('handles a full graph with multiple node types and edges', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'architecture/overview',
          type: 'article',
          label: 'Overview',
          category: 'architecture',
          difficulty: 'beginner',
          module: 'foundation',
          estimatedMinutes: 10,
          technologies: ['solidjs'],
          hasExercises: true,
          exerciseCount: 2,
          hasLearningObjectives: true,
          diagramRef: null,
        },
        { id: 'tech:solidjs', type: 'technology', label: 'SolidJS' },
        { id: 'module:foundation', type: 'module', label: 'The Foundation', order: 1 },
      ],
      edges: [
        { source: 'architecture/overview', target: 'tech:solidjs', type: 'usesTechnology' },
        { source: 'architecture/overview', target: 'module:foundation', type: 'belongsToModule' },
      ],
    });

    const result = toCytoscapeElements(graph);
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
  });
});

describe('getCategories', () => {
  it('returns sorted unique categories', () => {
    const { nodes } = toCytoscapeElements(
      makeGraph({
        nodes: [
          {
            id: 'a',
            type: 'article',
            label: 'A',
            category: 'concept',
            difficulty: null,
            module: null,
            estimatedMinutes: null,
            technologies: [],
            hasExercises: false,
            exerciseCount: 0,
            hasLearningObjectives: false,
            diagramRef: null,
          },
          {
            id: 'b',
            type: 'article',
            label: 'B',
            category: 'architecture',
            difficulty: null,
            module: null,
            estimatedMinutes: null,
            technologies: [],
            hasExercises: false,
            exerciseCount: 0,
            hasLearningObjectives: false,
            diagramRef: null,
          },
          { id: 'tech:x', type: 'technology', label: 'X' },
        ],
      }),
    );

    expect(getCategories(nodes)).toEqual(['architecture', 'concept']);
  });
});

describe('getEdgeTypes', () => {
  it('returns sorted unique edge types', () => {
    const { edges } = toCytoscapeElements(
      makeGraph({
        nodes: [
          {
            id: 'a',
            type: 'article',
            label: 'A',
            category: 'concept',
            difficulty: null,
            module: null,
            estimatedMinutes: null,
            technologies: [],
            hasExercises: false,
            exerciseCount: 0,
            hasLearningObjectives: false,
            diagramRef: null,
          },
          {
            id: 'b',
            type: 'article',
            label: 'B',
            category: 'concept',
            difficulty: null,
            module: null,
            estimatedMinutes: null,
            technologies: [],
            hasExercises: false,
            exerciseCount: 0,
            hasLearningObjectives: false,
            diagramRef: null,
          },
        ],
        edges: [
          { source: 'a', target: 'b', type: 'prerequisite' },
          { source: 'b', target: 'a', type: 'relatedConcept' },
        ],
      }),
    );

    expect(getEdgeTypes(edges)).toEqual(['prerequisite', 'relatedConcept']);
  });
});

describe('getNodeTypes', () => {
  it('returns sorted unique node types', () => {
    const { nodes } = toCytoscapeElements(
      makeGraph({
        nodes: [
          {
            id: 'a',
            type: 'article',
            label: 'A',
            category: 'concept',
            difficulty: null,
            module: null,
            estimatedMinutes: null,
            technologies: [],
            hasExercises: false,
            exerciseCount: 0,
            hasLearningObjectives: false,
            diagramRef: null,
          },
          { id: 'tech:x', type: 'technology', label: 'X' },
          { id: 'module:m', type: 'module', label: 'M', order: 1 },
        ],
      }),
    );

    expect(getNodeTypes(nodes)).toEqual(['article', 'module', 'technology']);
  });
});
