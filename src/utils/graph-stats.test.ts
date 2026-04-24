import type {
  ArchitectureGraphNode,
  ArticleNode,
  GraphEdge,
  GraphNode,
  ModuleNode,
  TechnologyNode,
} from '@playground/knowledge-engine/graph/types';
import { describe, expect, it } from 'vitest';
import type { GraphStatsInput } from './graph-stats.ts';
import { computeGraphStats } from './graph-stats.ts';

function makeGraph(nodes: GraphNode[], edges: GraphEdge[] = []): GraphStatsInput {
  return { nodes, edges };
}

function article(id: string, category = 'concept', module: string | null = null): GraphNode {
  const node: ArticleNode = {
    id,
    type: 'article',
    label: id,
    category,
    difficulty: null,
    module,
    estimatedMinutes: null,
    technologies: [],
    hasExercises: false,
    exerciseCount: 0,
    hasLearningObjectives: false,
    diagramRef: null,
  };
  return node;
}

function techNode(slug: string, label: string): GraphNode {
  const node: TechnologyNode = { id: `tech:${slug}`, type: 'technology', label };
  return node;
}

function moduleNode(id: string, label: string): GraphNode {
  const node: ModuleNode = { id: `module:${id}`, type: 'module', label, order: 1 };
  return node;
}

function archNode(id: string): GraphNode {
  const node: ArchitectureGraphNode = {
    id,
    type: 'architecture-node',
    label: id,
    category: 'component',
    knowledgeSlug: null,
  };
  return node;
}

function edge(source: string, target: string, type: string): GraphEdge {
  return { source, target, type };
}

describe('computeGraphStats', () => {
  describe('node and edge breakdowns', () => {
    it('counts nodes by type', () => {
      const graph = makeGraph([
        article('a/one'),
        article('a/two'),
        techNode('ts', 'TypeScript'),
        moduleNode('foundation', 'Foundation'),
        archNode('arch:desktop'),
      ]);
      const stats = computeGraphStats(graph);
      expect(stats.nodes.total).toBe(5);
      expect(stats.nodes.byType).toEqual({
        article: 2,
        'architecture-node': 1,
        technology: 1,
        module: 1,
      });
    });

    it('counts edges by type', () => {
      const graph = makeGraph(
        [article('a'), article('b')],
        [
          edge('a', 'b', 'prerequisite'),
          edge('a', 'b', 'relatedConcept'),
          edge('a', 'tech:ts', 'usesTechnology'),
        ],
      );
      const stats = computeGraphStats(graph);
      expect(stats.edges.total).toBe(3);
      expect(stats.edges.byType).toEqual({
        prerequisite: 1,
        relatedConcept: 1,
        usesTechnology: 1,
      });
    });
  });

  describe('articlesPerCategory', () => {
    it('groups and sorts by count descending', () => {
      const graph = makeGraph([
        article('a/1', 'architecture'),
        article('a/2', 'architecture'),
        article('a/3', 'architecture'),
        article('c/1', 'concept'),
        article('t/1', 'technology'),
        techNode('ts', 'TS'), // non-article, should be ignored
      ]);
      const stats = computeGraphStats(graph);
      expect(stats.articlesPerCategory).toEqual([
        { category: 'architecture', count: 3 },
        { category: 'concept', count: 1 },
        { category: 'technology', count: 1 },
      ]);
    });
  });

  describe('orphanArticles', () => {
    it('identifies articles with no incoming relatedConcept or prerequisite edges', () => {
      const graph = makeGraph(
        [article('a'), article('b'), article('c')],
        [
          edge('a', 'b', 'relatedConcept'),
          // c has no incoming edges → orphan
          // a has no incoming edges → orphan
          // b is referenced by a → not orphan
        ],
      );
      const stats = computeGraphStats(graph);
      expect(stats.orphanArticles).toEqual([{ id: 'a' }, { id: 'c' }]);
    });

    it('does not count usesTechnology edges as incoming', () => {
      const graph = makeGraph(
        [article('a'), techNode('ts', 'TS')],
        [edge('a', 'tech:ts', 'usesTechnology')],
      );
      const stats = computeGraphStats(graph);
      expect(stats.orphanArticles).toEqual([{ id: 'a' }]);
    });

    it('counts prerequisite target as referenced', () => {
      const graph = makeGraph([article('a'), article('b')], [edge('a', 'b', 'prerequisite')]);
      const stats = computeGraphStats(graph);
      // b is referenced via prerequisite → not orphan, a is orphan
      expect(stats.orphanArticles).toEqual([{ id: 'a' }]);
    });

    it('returns empty array when all articles are referenced', () => {
      const graph = makeGraph(
        [article('a'), article('b')],
        [edge('a', 'b', 'prerequisite'), edge('b', 'a', 'relatedConcept')],
      );
      const stats = computeGraphStats(graph);
      expect(stats.orphanArticles).toEqual([]);
    });
  });

  describe('longestPrerequisiteChain', () => {
    it('returns 0 for no prerequisite edges', () => {
      const graph = makeGraph([article('a'), article('b')], [edge('a', 'b', 'relatedConcept')]);
      const stats = computeGraphStats(graph);
      expect(stats.longestPrerequisiteChain).toBe(0);
      expect(stats.prerequisiteChainPath.length).toBeLessThanOrEqual(1);
    });

    it('computes chain length for a linear prerequisite path', () => {
      const graph = makeGraph(
        [article('a'), article('b'), article('c'), article('d')],
        [
          edge('a', 'b', 'prerequisite'),
          edge('b', 'c', 'prerequisite'),
          edge('c', 'd', 'prerequisite'),
        ],
      );
      const stats = computeGraphStats(graph);
      expect(stats.longestPrerequisiteChain).toBe(3);
      expect(stats.prerequisiteChainPath).toEqual(['a', 'b', 'c', 'd']);
    });

    it('picks the longest branch in a diamond', () => {
      // a → b → d
      // a → c → d → e
      const graph = makeGraph(
        [article('a'), article('b'), article('c'), article('d'), article('e')],
        [
          edge('a', 'b', 'prerequisite'),
          edge('a', 'c', 'prerequisite'),
          edge('b', 'd', 'prerequisite'),
          edge('c', 'd', 'prerequisite'),
          edge('d', 'e', 'prerequisite'),
        ],
      );
      const stats = computeGraphStats(graph);
      // longest is a→b→d→e or a→c→d→e = 3 edges
      expect(stats.longestPrerequisiteChain).toBe(3);
      expect(stats.prerequisiteChainPath).toHaveLength(4);
      expect(stats.prerequisiteChainPath[0]).toBe('a');
      expect(stats.prerequisiteChainPath[3]).toBe('e');
    });
  });

  describe('moduleSizes', () => {
    it('counts articles per module using belongsToModule edges', () => {
      const graph = makeGraph(
        [
          article('a', 'concept', 'foundation'),
          article('b', 'concept', 'foundation'),
          article('c', 'concept', 'reactivity'),
          moduleNode('foundation', 'The Foundation'),
          moduleNode('reactivity', 'Why SolidJS?'),
        ],
        [
          edge('a', 'module:foundation', 'belongsToModule'),
          edge('b', 'module:foundation', 'belongsToModule'),
          edge('c', 'module:reactivity', 'belongsToModule'),
        ],
      );
      const stats = computeGraphStats(graph);
      expect(stats.moduleSizes).toEqual([
        { moduleId: 'module:foundation', label: 'The Foundation', count: 2 },
        { moduleId: 'module:reactivity', label: 'Why SolidJS?', count: 1 },
      ]);
    });

    it('shows 0 for modules with no articles', () => {
      const graph = makeGraph([moduleNode('empty', 'Empty Module')]);
      const stats = computeGraphStats(graph);
      expect(stats.moduleSizes).toEqual([
        { moduleId: 'module:empty', label: 'Empty Module', count: 0 },
      ]);
    });
  });

  describe('technologyGaps', () => {
    it('identifies tech nodes without a matching technology article', () => {
      const graph = makeGraph([
        techNode('typescript', 'TypeScript'),
        techNode('solidjs', 'SolidJS'),
        article('technologies/solidjs', 'technology'),
        // no technologies/typescript article
      ]);
      const stats = computeGraphStats(graph);
      expect(stats.technologyGaps).toEqual([{ slug: 'typescript', label: 'TypeScript' }]);
    });

    it('returns empty when all tech nodes have articles', () => {
      const graph = makeGraph([
        techNode('astro', 'Astro'),
        article('technologies/astro', 'technology'),
      ]);
      const stats = computeGraphStats(graph);
      expect(stats.technologyGaps).toEqual([]);
    });

    it('ignores non-technology articles when matching', () => {
      const graph = makeGraph([
        techNode('solidjs', 'SolidJS'),
        article('concepts/solidjs', 'concept'), // wrong category
      ]);
      const stats = computeGraphStats(graph);
      expect(stats.technologyGaps).toEqual([{ slug: 'solidjs', label: 'SolidJS' }]);
    });
  });

  describe('integration with real-shaped data', () => {
    it('handles a realistic graph with mixed node types', () => {
      const graph = makeGraph(
        [
          article('architecture/overview', 'architecture', 'foundation'),
          article('concepts/reactivity', 'concept', 'reactivity'),
          article('technologies/solidjs', 'technology', 'reactivity'),
          article('labs/trace', 'lab', 'foundation'),
          techNode('solidjs', 'SolidJS'),
          techNode('astro', 'Astro'),
          moduleNode('foundation', 'The Foundation'),
          moduleNode('reactivity', 'Why SolidJS?'),
          archNode('arch:desktop'),
        ],
        [
          edge('architecture/overview', 'concepts/reactivity', 'relatedConcept'),
          edge('concepts/reactivity', 'technologies/solidjs', 'prerequisite'),
          edge('architecture/overview', 'tech:solidjs', 'usesTechnology'),
          edge('architecture/overview', 'module:foundation', 'belongsToModule'),
          edge('concepts/reactivity', 'module:reactivity', 'belongsToModule'),
          edge('technologies/solidjs', 'module:reactivity', 'belongsToModule'),
          edge('labs/trace', 'module:foundation', 'belongsToModule'),
        ],
      );
      const stats = computeGraphStats(graph);

      expect(stats.nodes.total).toBe(9);
      expect(stats.edges.total).toBe(7);
      expect(stats.articlesPerCategory.length).toBe(4);
      // solidjs has a technology article → only astro is a gap
      expect(stats.technologyGaps).toEqual([{ slug: 'astro', label: 'Astro' }]);
      // architecture/overview and labs/trace are orphans (no incoming relatedConcept/prerequisite)
      expect(stats.orphanArticles.map((o) => o.id)).toContain('architecture/overview');
      expect(stats.orphanArticles.map((o) => o.id)).toContain('labs/trace');
      // Prerequisite chain: concepts/reactivity → technologies/solidjs = 1
      expect(stats.longestPrerequisiteChain).toBe(1);
    });
  });
});
