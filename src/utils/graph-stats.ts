// Pure computation functions for knowledge graph statistics.
// Takes the knowledge-graph.json shape as input — no I/O.

export interface ArticleNode {
  id: string;
  type: 'article';
  category: string;
  module: string | null;
  technologies: string[];
}

export interface TechnologyNode {
  id: string;
  type: 'technology';
  label: string;
}

export interface ModuleNode {
  id: string;
  type: 'module';
  label: string;
}

export interface OtherNode {
  id: string;
  type: string;
}

export type GraphNode = ArticleNode | TechnologyNode | ModuleNode | OtherNode;

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Result types ──

export interface NodeBreakdown {
  total: number;
  byType: Record<string, number>;
}

export interface EdgeBreakdown {
  total: number;
  byType: Record<string, number>;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface OrphanArticle {
  id: string;
}

export interface ModuleSize {
  moduleId: string;
  label: string;
  count: number;
}

export interface TechnologyGap {
  slug: string;
  label: string;
}

export interface GraphStats {
  nodes: NodeBreakdown;
  edges: EdgeBreakdown;
  articlesPerCategory: CategoryCount[];
  orphanArticles: OrphanArticle[];
  longestPrerequisiteChain: number;
  prerequisiteChainPath: string[];
  moduleSizes: ModuleSize[];
  technologyGaps: TechnologyGap[];
}

// ── Computation ──

function countByType(nodes: GraphNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    counts[n.type] = (counts[n.type] ?? 0) + 1;
  }
  return counts;
}

function countEdgesByType(edges: GraphEdge[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of edges) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return counts;
}

function getArticlesPerCategory(nodes: GraphNode[]): CategoryCount[] {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    if (n.type === 'article') {
      const cat = (n as ArticleNode).category;
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Orphan articles: articles with zero incoming `relatedConcept` or `prerequisite` edges.
 * An article is an orphan if no other article points TO it via these edge types.
 */
function getOrphanArticles(nodes: GraphNode[], edges: GraphEdge[]): OrphanArticle[] {
  const articleIds = new Set<string>();
  for (const n of nodes) {
    if (n.type === 'article') articleIds.add(n.id);
  }

  const referenced = new Set<string>();
  for (const e of edges) {
    if ((e.type === 'relatedConcept' || e.type === 'prerequisite') && articleIds.has(e.target)) {
      referenced.add(e.target);
    }
  }

  return [...articleIds]
    .filter((id) => !referenced.has(id))
    .sort()
    .map((id) => ({ id }));
}

/**
 * Longest prerequisite chain via depth-first traversal.
 * Returns the chain length (number of edges) and the path (node ids).
 */
function getLongestPrerequisiteChain(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { length: number; path: string[] } {
  const articleIds = new Set<string>();
  for (const n of nodes) {
    if (n.type === 'article') articleIds.add(n.id);
  }

  // Build adjacency: source → targets (for prerequisite edges)
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (e.type === 'prerequisite') {
      const existing = adj.get(e.source);
      if (existing) {
        existing.push(e.target);
      } else {
        adj.set(e.source, [e.target]);
      }
    }
  }

  // Memoized DFS: returns [length, path] where length = number of edges
  const memo = new Map<string, { length: number; path: string[] }>();

  function dfs(node: string): { length: number; path: string[] } {
    const cached = memo.get(node);
    if (cached) return cached;

    const neighbors = adj.get(node);
    if (!neighbors || neighbors.length === 0) {
      const result = { length: 0, path: [node] };
      memo.set(node, result);
      return result;
    }

    let best = { length: 0, path: [node] };
    for (const next of neighbors) {
      const sub = dfs(next);
      if (sub.length + 1 > best.length) {
        best = { length: sub.length + 1, path: [node, ...sub.path] };
      }
    }
    memo.set(node, best);
    return best;
  }

  let longest = { length: 0, path: [] as string[] };
  for (const id of articleIds) {
    const result = dfs(id);
    if (result.length > longest.length) {
      longest = result;
    }
  }

  return longest;
}

function getModuleSizes(nodes: GraphNode[], edges: GraphEdge[]): ModuleSize[] {
  // Module nodes provide the label
  const moduleLabels = new Map<string, string>();
  for (const n of nodes) {
    if (n.type === 'module') {
      moduleLabels.set(n.id, (n as ModuleNode).label);
    }
  }

  // Count articles per module using belongsToModule edges
  const counts = new Map<string, number>();
  for (const e of edges) {
    if (e.type === 'belongsToModule') {
      counts.set(e.target, (counts.get(e.target) ?? 0) + 1);
    }
  }

  return [...moduleLabels.entries()]
    .map(([moduleId, label]) => ({
      moduleId,
      label,
      count: counts.get(moduleId) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Technology coverage gaps: technology nodes that have no corresponding
 * `category: technology` article. Matching is by slug: tech node `tech:solidjs`
 * matches article `technologies/solidjs`.
 */
function getTechnologyGaps(nodes: GraphNode[]): TechnologyGap[] {
  const techNodes: { slug: string; label: string }[] = [];
  for (const n of nodes) {
    if (n.type === 'technology') {
      techNodes.push({ slug: n.id.replace('tech:', ''), label: (n as TechnologyNode).label });
    }
  }

  const techArticleSlugs = new Set<string>();
  for (const n of nodes) {
    if (n.type === 'article' && (n as ArticleNode).category === 'technology') {
      const slug = n.id.includes('/') ? (n.id.split('/').pop() ?? n.id) : n.id;
      techArticleSlugs.add(slug);
    }
  }

  return techNodes
    .filter((t) => !techArticleSlugs.has(t.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// ── Main entry point ──

export function computeGraphStats(graph: KnowledgeGraphData): GraphStats {
  const chain = getLongestPrerequisiteChain(graph.nodes, graph.edges);

  return {
    nodes: {
      total: graph.nodes.length,
      byType: countByType(graph.nodes),
    },
    edges: {
      total: graph.edges.length,
      byType: countEdgesByType(graph.edges),
    },
    articlesPerCategory: getArticlesPerCategory(graph.nodes),
    orphanArticles: getOrphanArticles(graph.nodes, graph.edges),
    longestPrerequisiteChain: chain.length,
    prerequisiteChainPath: chain.path,
    moduleSizes: getModuleSizes(graph.nodes, graph.edges),
    technologyGaps: getTechnologyGaps(graph.nodes),
  };
}
