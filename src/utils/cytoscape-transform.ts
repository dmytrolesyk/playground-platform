/**
 * Transforms knowledge-graph.json data into Cytoscape.js elements format.
 * Pure function — no I/O, no DOM, no Cytoscape dependency.
 */

import type {
  ArchitectureGraphNode,
  ArticleNode,
  GraphEdge,
  GraphNode,
  KnowledgeGraph,
  ModuleNode,
  TechnologyNode,
} from '@playground/knowledge-engine/graph/types';

// ── Cytoscape element types ─────────────────────────────────────────

export interface CyNodeData {
  id: string;
  label: string;
  nodeType: 'article' | 'technology' | 'module' | 'architecture-node';
  category?: string;
  difficulty?: string | null;
  module?: string | null;
  estimatedMinutes?: number | null;
  hasExercises?: boolean;
  exerciseCount?: number;
  knowledgeSlug?: string | null;
  parent?: string;
}

export interface CyEdgeData {
  id: string;
  source: string;
  target: string;
  edgeType: string;
}

export interface CyNode {
  data: CyNodeData;
  classes?: string;
}

export interface CyEdge {
  data: CyEdgeData;
}

export interface CyElements {
  nodes: CyNode[];
  edges: CyEdge[];
}

// ── Category → Cytoscape class mapping ──────────────────────────────

const ARTICLE_CATEGORY_CLASS: Record<string, string> = {
  architecture: 'cat-architecture',
  concept: 'cat-concept',
  technology: 'cat-technology',
  feature: 'cat-feature',
  'cs-fundamentals': 'cat-cs-fundamentals',
  lab: 'cat-lab',
};

function articleClass(category: string): string {
  return ARTICLE_CATEGORY_CLASS[category] ?? 'cat-default';
}

// ── Node transformers ───────────────────────────────────────────────

function transformArticle(n: ArticleNode): CyNode {
  return {
    data: {
      id: n.id,
      label: n.label,
      nodeType: 'article',
      category: n.category,
      difficulty: n.difficulty,
      module: n.module,
      estimatedMinutes: n.estimatedMinutes,
      hasExercises: n.hasExercises,
      exerciseCount: n.exerciseCount,
      // Group articles inside their module compound node
      ...(n.module ? { parent: `module:${n.module}` } : {}),
    },
    classes: `article ${articleClass(n.category)}`,
  };
}

function transformTechnology(n: TechnologyNode): CyNode {
  return {
    data: {
      id: n.id,
      label: n.label,
      nodeType: 'technology',
    },
    classes: 'technology',
  };
}

function transformModule(n: ModuleNode): CyNode {
  return {
    data: {
      id: n.id,
      label: n.label,
      nodeType: 'module',
    },
    classes: 'module',
  };
}

function transformArchNode(n: ArchitectureGraphNode): CyNode {
  return {
    data: {
      id: n.id,
      label: n.label,
      nodeType: 'architecture-node',
      category: n.category,
      knowledgeSlug: n.knowledgeSlug,
    },
    classes: 'architecture-node',
  };
}

function transformNode(n: GraphNode): CyNode {
  switch (n.type) {
    case 'article':
      return transformArticle(n);
    case 'technology':
      return transformTechnology(n);
    case 'module':
      return transformModule(n);
    case 'architecture-node':
      return transformArchNode(n);
    default: {
      // Fallback for unknown node types
      const unknown = n as { id: string; label?: string; type: string };
      return {
        data: {
          id: unknown.id,
          label: unknown.label ?? unknown.id,
          nodeType: 'article',
        },
      };
    }
  }
}

// ── Edge transformer ────────────────────────────────────────────────

function transformEdge(e: GraphEdge, idx: number): CyEdge {
  return {
    data: {
      id: `e${idx}`,
      source: e.source,
      target: e.target,
      edgeType: e.type,
    },
  };
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Convert the full KnowledgeGraph JSON into Cytoscape.js element arrays.
 * Filters out edges whose source or target nodes are missing.
 */
export function toCytoscapeElements(graph: KnowledgeGraph): CyElements {
  const nodes = graph.nodes.map(transformNode);
  const nodeIds = new Set(nodes.map((n) => n.data.id));

  // Only include edges where both endpoints exist
  const edges: CyEdge[] = [];
  for (let i = 0; i < graph.edges.length; i++) {
    const e = graph.edges[i];
    if (e && nodeIds.has(e.source) && nodeIds.has(e.target)) {
      edges.push(transformEdge(e, i));
    }
  }

  return { nodes, edges };
}

/**
 * Get unique categories from a set of CyNodes (for filter UI).
 */
export function getCategories(nodes: CyNode[]): string[] {
  const cats = new Set<string>();
  for (const n of nodes) {
    if (n.data.category) cats.add(n.data.category);
  }
  return [...cats].sort();
}

/**
 * Get unique edge types from a set of CyEdges (for filter UI).
 */
export function getEdgeTypes(edges: CyEdge[]): string[] {
  const types = new Set<string>();
  for (const e of edges) {
    types.add(e.data.edgeType);
  }
  return [...types].sort();
}

/**
 * Get unique node types from a set of CyNodes (for filter UI).
 */
export function getNodeTypes(nodes: CyNode[]): string[] {
  const types = new Set<string>();
  for (const n of nodes) {
    types.add(n.data.nodeType);
  }
  return [...types].sort();
}
