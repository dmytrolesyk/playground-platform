// Pure extraction logic — takes structured input, outputs a KnowledgeGraph.
// No filesystem or I/O — fully testable.

import type {
  ArchitectureGraphNode,
  ArticleNode,
  ExtractionInput,
  GraphEdge,
  GraphNode,
  KnowledgeGraph,
  ModuleNode,
  TechnologyNode,
} from './types.ts';

/** Well-known technology slug → human-readable label */
const TECHNOLOGY_LABELS: Record<string, string> = {
  '98css': '98.css',
  astro: 'Astro',
  biome: 'Biome',
  node: 'Node.js',
  playwright: 'Playwright',
  resend: 'Resend',
  solidjs: 'SolidJS',
  typescript: 'TypeScript',
  vitest: 'Vitest',
  xterm: 'xterm.js',
};

export function formatTechnologyLabel(slug: string): string {
  return TECHNOLOGY_LABELS[slug] ?? slug;
}

export function extractKnowledgeGraph(
  input: ExtractionInput,
  generatedAt?: string,
): KnowledgeGraph {
  const { articleNodes, articleEdges, technologies, categories } = extractArticles(input.articles);
  const technologyNodes = buildTechnologyNodes(technologies);
  const moduleNodes = buildModuleNodes(input.modules);
  const { nodes: archNodes, edges: archEdges } = buildArchitectureGraph(
    input.architectureNodes,
    input.architectureEdges,
  );

  const nodes: GraphNode[] = [...articleNodes, ...technologyNodes, ...moduleNodes, ...archNodes];
  const edges: GraphEdge[] = [...articleEdges, ...archEdges];

  return {
    nodes,
    edges,
    metadata: {
      generatedAt: generatedAt ?? new Date().toISOString(),
      articleCount: input.articles.length,
      edgeCount: edges.length,
      categories: [...categories].sort(),
    },
  };
}

// ── Article extraction ──────────────────────────────────────────────────

interface ArticleExtractionResult {
  articleNodes: ArticleNode[];
  articleEdges: GraphEdge[];
  technologies: Set<string>;
  categories: Set<string>;
}

function extractArticles(articles: ExtractionInput['articles']): ArticleExtractionResult {
  const articleNodes: ArticleNode[] = [];
  const articleEdges: GraphEdge[] = [];
  const technologies = new Set<string>();
  const categories = new Set<string>();

  for (const article of articles) {
    articleNodes.push({
      id: article.id,
      type: 'article',
      label: article.title,
      category: article.category,
      difficulty: article.difficulty ?? null,
      module: article.module ?? null,
      estimatedMinutes: article.estimatedMinutes ?? null,
      technologies: article.technologies,
      hasExercises: article.exerciseCount > 0,
      exerciseCount: article.exerciseCount,
      hasLearningObjectives: article.learningObjectiveCount > 0,
      diagramRef: article.diagramRef ?? null,
    });
    categories.add(article.category);

    for (const tech of article.technologies) {
      technologies.add(tech);
    }

    articleEdges.push(...buildArticleEdges(article));
  }

  return { articleNodes, articleEdges, technologies, categories };
}

function buildArticleEdges(article: ExtractionInput['articles'][number]): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const related of article.relatedConcepts) {
    edges.push({ source: article.id, target: related, type: 'relatedConcept' });
  }
  for (const prereq of article.prerequisites) {
    edges.push({ source: article.id, target: prereq, type: 'prerequisite' });
  }
  for (const tech of article.technologies) {
    edges.push({ source: article.id, target: `tech:${tech}`, type: 'usesTechnology' });
  }
  if (article.module) {
    edges.push({
      source: article.id,
      target: `module:${article.module}`,
      type: 'belongsToModule',
    });
  }
  if (article.diagramRef) {
    edges.push({
      source: article.id,
      target: `arch:${article.diagramRef}`,
      type: 'hasDiagramRef',
    });
  }

  return edges;
}

// ── Technology nodes ────────────────────────────────────────────────────

function buildTechnologyNodes(technologies: Set<string>): TechnologyNode[] {
  return [...technologies].sort().map((tech) => ({
    id: `tech:${tech}`,
    type: 'technology' as const,
    label: formatTechnologyLabel(tech),
  }));
}

// ── Module nodes ────────────────────────────────────────────────────────

function buildModuleNodes(modules: ExtractionInput['modules']): ModuleNode[] {
  return modules.map((mod) => ({
    id: `module:${mod.id}`,
    type: 'module' as const,
    label: mod.title,
    order: mod.order,
  }));
}

// ── Architecture graph ──────────────────────────────────────────────────

function buildArchitectureGraph(
  archNodes: ExtractionInput['architectureNodes'],
  archEdges: ExtractionInput['architectureEdges'],
): { nodes: ArchitectureGraphNode[]; edges: GraphEdge[] } {
  const nodes: ArchitectureGraphNode[] = archNodes.map((n) => ({
    id: `arch:${n.id}`,
    type: 'architecture-node' as const,
    label: n.label,
    category: n.category,
    knowledgeSlug: n.knowledgeSlug ?? null,
  }));

  const edges: GraphEdge[] = archEdges.map((e) => ({
    source: `arch:${e.from}`,
    target: `arch:${e.to}`,
    type: e.type,
  }));

  return { nodes, edges };
}
