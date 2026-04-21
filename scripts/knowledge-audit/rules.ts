import {
  ARCHITECTURE_EDGE_TYPES,
  ARCHITECTURE_NODE_CATEGORIES,
  type ArchitectureEdge,
  type ArchitectureNode,
  type KnowledgeArticle,
  type KnowledgeAuditInput,
  type KnowledgeAuditIssue,
  type KnowledgeAuditIssueCode,
} from './types.ts';

export function auditKnowledgeRules(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return [
    ...auditArticleReferences(input),
    ...auditArchitectureGraph(input),
    ...auditPrerequisiteCycles(input),
  ];
}

export function auditArticleReferences(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const articleIds = new Set(input.articles.map((article) => article.id));
  const moduleIds = new Set(input.modules.map((module) => module.id));
  const nodeIds = new Set(input.architectureNodes.map((node) => node.id));

  return input.articles.flatMap((article) => [
    ...auditRelatedConcepts(article, articleIds),
    ...auditPrerequisites(article, articleIds),
    ...auditArticleModule(article, moduleIds),
    ...auditArticleDiagramRef(article, nodeIds),
  ]);
}

function auditRelatedConcepts(
  article: KnowledgeArticle,
  articleIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  return (article.relatedConcepts ?? [])
    .filter((relatedConcept) => !articleIds.has(relatedConcept))
    .map((relatedConcept) =>
      error(
        'missing-related-concept',
        article.id,
        `${article.id} references related concept "${relatedConcept}", but no article has that id.`,
      ),
    );
}

function auditPrerequisites(
  article: KnowledgeArticle,
  articleIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  return (article.prerequisites ?? [])
    .filter((prerequisite) => !articleIds.has(prerequisite))
    .map((prerequisite) =>
      error(
        'missing-prerequisite',
        article.id,
        `${article.id} lists prerequisite "${prerequisite}", but no article has that id.`,
      ),
    );
}

function auditArticleModule(
  article: KnowledgeArticle,
  moduleIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  if (!(article.module && !moduleIds.has(article.module))) {
    return [];
  }

  return [
    error(
      'unknown-module',
      article.id,
      `${article.id} belongs to module "${article.module}", but no module has that id.`,
    ),
  ];
}

function auditArticleDiagramRef(
  article: KnowledgeArticle,
  nodeIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  if (!(article.diagramRef && !nodeIds.has(article.diagramRef))) {
    return [];
  }

  return [
    error(
      'bad-diagram-ref',
      article.id,
      `${article.id} uses diagramRef "${article.diagramRef}", but no architecture node has that id.`,
    ),
  ];
}

export function auditArchitectureGraph(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const articleIds = new Set(input.articles.map((article) => article.id));
  const nodeIds = collectNodeIds(input.architectureNodes);
  const allowedNodeCategories = new Set(
    input.allowedNodeCategories ?? ARCHITECTURE_NODE_CATEGORIES,
  );
  const allowedEdgeTypes = new Set(input.allowedEdgeTypes ?? ARCHITECTURE_EDGE_TYPES);

  return [
    ...input.architectureNodes.flatMap((node) =>
      auditArchitectureNode(node, allowedNodeCategories, articleIds),
    ),
    ...findDuplicateNodeIds(input.architectureNodes).map((nodeId) =>
      error(
        'duplicate-architecture-node-id',
        nodeId,
        `Architecture node id "${nodeId}" is declared more than once.`,
      ),
    ),
    ...input.architectureEdges.flatMap((edge) =>
      auditArchitectureEdge(edge, nodeIds, allowedEdgeTypes),
    ),
  ];
}

function collectNodeIds(nodes: readonly ArchitectureNode[]): Set<string> {
  return new Set(nodes.map((node) => node.id));
}

function findDuplicateNodeIds(nodes: readonly ArchitectureNode[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const node of nodes) {
    if (seen.has(node.id)) {
      duplicates.add(node.id);
    }
    seen.add(node.id);
  }

  return [...duplicates];
}

function auditArchitectureNode(
  node: ArchitectureNode,
  allowedNodeCategories: ReadonlySet<string>,
  articleIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  const issues: KnowledgeAuditIssue[] = [];

  if (!allowedNodeCategories.has(node.category)) {
    issues.push(
      error(
        'invalid-node-category',
        node.id,
        `Architecture node "${node.id}" uses category "${node.category}", which is not in the graph contract.`,
      ),
    );
  }

  if (node.knowledgeSlug && !articleIds.has(node.knowledgeSlug)) {
    issues.push(
      error(
        'bad-knowledge-slug',
        node.id,
        `Architecture node "${node.id}" links to knowledgeSlug "${node.knowledgeSlug}", but no article has that id.`,
      ),
    );
  }

  return issues;
}

function auditArchitectureEdge(
  edge: ArchitectureEdge,
  nodeIds: ReadonlySet<string>,
  allowedEdgeTypes: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  return [...auditEdgeEndpoints(edge, nodeIds), ...auditEdgeType(edge, allowedEdgeTypes)];
}

function auditEdgeEndpoints(
  edge: ArchitectureEdge,
  nodeIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  const missingEndpoints = [edge.from, edge.to].filter((nodeId) => !nodeIds.has(nodeId));
  if (missingEndpoints.length === 0) {
    return [];
  }

  return [
    error(
      'broken-edge-endpoint',
      `${edge.from}->${edge.to}`,
      `Architecture edge "${edge.from}" -> "${edge.to}" references missing node(s): ${missingEndpoints.join(
        ', ',
      )}.`,
    ),
  ];
}

function auditEdgeType(
  edge: ArchitectureEdge,
  allowedEdgeTypes: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  if (allowedEdgeTypes.has(edge.type)) {
    return [];
  }

  return [
    error(
      'invalid-edge-type',
      `${edge.from}->${edge.to}`,
      `Architecture edge "${edge.from}" -> "${edge.to}" uses type "${edge.type}", which is not in the graph contract.`,
    ),
  ];
}

export function auditPrerequisiteCycles(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const articleIds = new Set(input.articles.map((article) => article.id));
  const prerequisitesByArticle = new Map<string, readonly string[]>(
    input.articles.map((article) => [
      article.id,
      (article.prerequisites ?? []).filter((prerequisite) => articleIds.has(prerequisite)),
    ]),
  );
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const reportedCycles = new Set<string>();
  const issues: KnowledgeAuditIssue[] = [];

  function visit(articleId: string, path: string[]): void {
    if (visiting.has(articleId)) {
      const cycleStart = path.indexOf(articleId);
      const cycle = path.slice(cycleStart);
      const cycleKey = canonicalCycleKey(cycle);
      if (!reportedCycles.has(cycleKey)) {
        reportedCycles.add(cycleKey);
        issues.push(
          error(
            'prerequisite-cycle',
            articleId,
            `Prerequisite cycle detected: ${cycle.join(' -> ')}.`,
          ),
        );
      }
      return;
    }

    if (visited.has(articleId)) {
      return;
    }

    visiting.add(articleId);
    for (const prerequisite of prerequisitesByArticle.get(articleId) ?? []) {
      visit(prerequisite, [...path, prerequisite]);
    }
    visiting.delete(articleId);
    visited.add(articleId);
  }

  for (const article of input.articles) {
    visit(article.id, [article.id]);
  }

  return issues;
}

function canonicalCycleKey(cycle: readonly string[]): string {
  const uniqueCycle = cycle.slice(0, -1);
  if (uniqueCycle.length === 0) {
    return cycle.join(' -> ');
  }

  const rotations = uniqueCycle.map((_, index) => [
    ...uniqueCycle.slice(index),
    ...uniqueCycle.slice(0, index),
  ]);
  rotations.sort((left, right) => left.join('\u0000').localeCompare(right.join('\u0000')));
  const [canonical] = rotations;
  return canonical ? canonical.join('\u0000') : cycle.join(' -> ');
}

function error(
  code: KnowledgeAuditIssueCode,
  subject: string,
  message: string,
): KnowledgeAuditIssue {
  return {
    severity: 'error',
    code,
    subject,
    message,
  };
}
