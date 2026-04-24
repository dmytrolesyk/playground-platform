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

// Pattern for Markdown inline links: [text](url) where url is external
const MARKDOWN_INLINE_LINK_PATTERN = /\[(?:[^\]]*)\]\(\s*(https?:\/\/[^\s)]+)\s*\)/gu;

export function auditKnowledgeRules(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return [
    ...auditArticleReferences(input),
    ...auditArchitectureGraph(input),
    ...auditPrerequisiteCycles(input),
    ...auditMinimumRelatedConcepts(input),
    ...auditMinimumExercises(input),
    ...auditRequiredLearningObjectives(input),
    ...auditArchitectureRequiresDiagram(input),
    ...auditLabRequiresPrerequisites(input),
    ...auditNoOrphanArticles(input),
    ...auditTechnologyCoverage(input),
    ...auditModuleCompleteness(input),
    ...auditBroaderNarrowerSymmetry(input),
    ...auditMinimumWordCount(input),
    ...auditExerciseTypeDiversity(input),
    ...auditExternalReferenceMinimum(input),
    ...auditInlineCitationDensity(input),
    ...auditMissingLastUpdated(input),
    ...auditStaleCodeReference(input),
    ...auditUncitedReference(input),
    ...auditUnlistedInlineCitation(input),
  ];
}

export function auditArticleReferences(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const articleIds = new Set(input.articles.map((article) => article.id));
  const moduleIds = new Set(input.modules.map((module) => module.id));
  const nodeIds = new Set(input.architectureNodes.map((node) => node.id));

  return input.articles.flatMap((article) => [
    ...auditRelatedConcepts(article, articleIds),
    ...auditPrerequisites(article, articleIds),
    ...auditBroaderTargets(article, articleIds),
    ...auditNarrowerTargets(article, articleIds),
    ...auditArticleModule(article, moduleIds),
    ...auditArticleDiagramRef(article, nodeIds),
  ]);
}

function auditRelatedConcepts(
  article: KnowledgeArticle,
  articleIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  return article.relatedConcepts
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
  return article.prerequisites
    .filter((prerequisite) => !articleIds.has(prerequisite))
    .map((prerequisite) =>
      error(
        'missing-prerequisite',
        article.id,
        `${article.id} lists prerequisite "${prerequisite}", but no article has that id.`,
      ),
    );
}

function auditBroaderTargets(
  article: KnowledgeArticle,
  articleIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  return article.broader
    .filter((broaderId) => !articleIds.has(broaderId))
    .map((broaderId) =>
      error(
        'missing-broader-target',
        article.id,
        `${article.id} lists "${broaderId}" in broader, but no article has that id.`,
      ),
    );
}

function auditNarrowerTargets(
  article: KnowledgeArticle,
  articleIds: ReadonlySet<string>,
): KnowledgeAuditIssue[] {
  return article.narrower
    .filter((narrowerId) => !articleIds.has(narrowerId))
    .map((narrowerId) =>
      error(
        'missing-narrower-target',
        article.id,
        `${article.id} lists "${narrowerId}" in narrower, but no article has that id.`,
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
      article.prerequisites.filter((prerequisite) => articleIds.has(prerequisite)),
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

function issue(
  severity: 'error' | 'warning',
  code: KnowledgeAuditIssueCode,
  subject: string,
  message: string,
): KnowledgeAuditIssue {
  return { severity, code, subject, message };
}

function error(
  code: KnowledgeAuditIssueCode,
  subject: string,
  message: string,
): KnowledgeAuditIssue {
  return issue('error', code, subject, message);
}

function warning(
  code: KnowledgeAuditIssueCode,
  subject: string,
  message: string,
): KnowledgeAuditIssue {
  return issue('warning', code, subject, message);
}

// --- Rule 1: minimum-related-concepts ---

export function auditMinimumRelatedConcepts(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => article.relatedConcepts.length === 0)
    .map((article) =>
      warning(
        'minimum-related-concepts',
        article.id,
        `${article.id} has no relatedConcepts (minimum 1).`,
      ),
    );
}

// --- Rule 2: minimum-exercises ---

export function auditMinimumExercises(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => article.category !== 'lab')
    .filter((article) => article.exercises.length < 2)
    .map((article) =>
      error(
        'minimum-exercises',
        article.id,
        `${article.id} has ${article.exercises.length} exercises (minimum 2 for non-lab articles).`,
      ),
    );
}

// --- Rule 3: required-learning-objectives ---

export function auditRequiredLearningObjectives(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => article.learningObjectives.length === 0)
    .map((article) =>
      error(
        'required-learning-objectives',
        article.id,
        `${article.id} has no learningObjectives (minimum 1).`,
      ),
    );
}

// --- Rule 4: architecture-requires-diagram ---

export function auditArchitectureRequiresDiagram(
  input: KnowledgeAuditInput,
): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => article.category === 'architecture')
    .filter((article) => !article.diagramRef)
    .map((article) =>
      warning(
        'architecture-requires-diagram',
        article.id,
        `${article.id} is an architecture article but has no diagramRef.`,
      ),
    );
}

// --- Rule 5: lab-requires-prerequisites ---

export function auditLabRequiresPrerequisites(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => article.category === 'lab')
    .filter((article) => article.prerequisites.length === 0)
    .map((article) =>
      warning(
        'lab-requires-prerequisites',
        article.id,
        `${article.id} is a lab but has no prerequisites (minimum 1).`,
      ),
    );
}

// --- Rule 6: no-orphan-articles ---

export function auditNoOrphanArticles(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  // An article is NOT orphaned if:
  // - It's referenced by another article's relatedConcepts or prerequisites, OR
  // - It's assigned to a module
  const referenced = new Set<string>();
  for (const article of input.articles) {
    for (const ref of article.relatedConcepts) {
      referenced.add(ref);
    }
    for (const prereq of article.prerequisites) {
      referenced.add(prereq);
    }
  }

  return input.articles
    .filter((article) => !(referenced.has(article.id) || article.module))
    .map((article) =>
      warning(
        'no-orphan-articles',
        article.id,
        `${article.id} is not referenced by any other article and has no module assignment.`,
      ),
    );
}

// --- Rule 7: technology-coverage ---

export function auditTechnologyCoverage(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  // Collect all unique technology tags used across all articles
  const allTechTags = new Set<string>();
  for (const article of input.articles) {
    for (const tech of article.technologies) {
      allTechTags.add(tech);
    }
  }

  // Collect technology article slugs (category: technology, id like "technologies/foo")
  const coveredTechs = new Set<string>();
  for (const article of input.articles) {
    if (article.category === 'technology') {
      // Extract the slug part after "technologies/"
      const parts = article.id.split('/');
      const slug = parts[parts.length - 1];
      if (slug) {
        coveredTechs.add(slug);
      }
    }
  }

  return [...allTechTags]
    .filter((tech) => !coveredTechs.has(tech))
    .sort()
    .map((tech) =>
      warning(
        'technology-coverage',
        tech,
        `Technology tag "${tech}" is used but no technologies/${tech} article exists.`,
      ),
    );
}

// --- Rule 8: module-completeness ---

export function auditModuleCompleteness(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const articlesByModule = new Map<string, number>();
  for (const article of input.articles) {
    if (article.module) {
      articlesByModule.set(article.module, (articlesByModule.get(article.module) ?? 0) + 1);
    }
  }

  return input.modules
    .filter((mod) => (articlesByModule.get(mod.id) ?? 0) < 2)
    .map((mod) =>
      warning(
        'module-completeness',
        mod.id,
        `Module "${mod.id}" has ${articlesByModule.get(mod.id) ?? 0} articles (minimum 2).`,
      ),
    );
}

// --- Rule 9: broader-narrower-symmetry ---

export function auditBroaderNarrowerSymmetry(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const articleMap = new Map(input.articles.map((a) => [a.id, a]));
  return [
    ...checkBroaderLinks(input.articles, articleMap),
    ...checkNarrowerLinks(input.articles, articleMap),
  ];
}

function checkBroaderLinks(
  articles: readonly KnowledgeArticle[],
  articleMap: ReadonlyMap<string, KnowledgeArticle>,
): KnowledgeAuditIssue[] {
  const issues: KnowledgeAuditIssue[] = [];
  for (const article of articles) {
    for (const broaderId of article.broader) {
      const broaderArticle = articleMap.get(broaderId);
      if (broaderArticle && !broaderArticle.narrower.includes(article.id)) {
        issues.push(
          error(
            'broader-narrower-symmetry',
            article.id,
            `${article.id} lists "${broaderId}" in broader, but "${broaderId}" does not list "${article.id}" in narrower.`,
          ),
        );
      }
    }
  }
  return issues;
}

function checkNarrowerLinks(
  articles: readonly KnowledgeArticle[],
  articleMap: ReadonlyMap<string, KnowledgeArticle>,
): KnowledgeAuditIssue[] {
  const issues: KnowledgeAuditIssue[] = [];
  for (const article of articles) {
    for (const narrowerId of article.narrower) {
      const narrowerArticle = articleMap.get(narrowerId);
      if (narrowerArticle && !narrowerArticle.broader.includes(article.id)) {
        issues.push(
          error(
            'broader-narrower-symmetry',
            article.id,
            `${article.id} lists "${narrowerId}" in narrower, but "${narrowerId}" does not list "${article.id}" in broader.`,
          ),
        );
      }
    }
  }
  return issues;
}

// --- Rule 10: minimum-word-count ---

const MINIMUM_WORD_COUNTS: Record<string, number> = {
  architecture: 1500,
  concept: 1000,
  technology: 800,
  feature: 600,
  'cs-fundamentals': 1000,
  lab: 800,
  'project-lab': 800,
};

export function auditMinimumWordCount(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => article.body !== undefined)
    .filter((article) => {
      const minimum = MINIMUM_WORD_COUNTS[article.category];
      if (minimum === undefined) return false;
      const wordCount = countWords(article.body ?? '');
      return wordCount < minimum;
    })
    .map((article) => {
      const wordCount = countWords(article.body ?? '');
      const minimum = MINIMUM_WORD_COUNTS[article.category] ?? 0;
      return warning(
        'minimum-word-count',
        article.id,
        `${article.id} has ${wordCount} words (minimum ${minimum} for ${article.category}).`,
      );
    });
}

export function countWords(text: string): number {
  // Strip Markdown frontmatter (should already be stripped, but be safe)
  // Count words in the body: split on whitespace, filter empty strings
  const stripped = text.replace(WORD_STRIP_FRONTMATTER_PATTERN, '');
  const words = stripped.split(WORD_SPLIT_PATTERN).filter((word) => word.length > 0);
  return words.length;
}

// --- Rule 11: exercise-type-diversity ---

export function auditExerciseTypeDiversity(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => article.category !== 'lab')
    .filter((article) => article.exercises.length > 0)
    .filter((article) => {
      const types = article.exercises.map((ex) => ex.type).filter(Boolean);
      return !types.some((type) => type === 'predict' || type === 'do');
    })
    .map((article) =>
      warning(
        'exercise-type-diversity',
        article.id,
        `${article.id} exercises must include at least 1 "predict" or "do" type (not all "explain").`,
      ),
    );
}

// --- Rule 12: external-reference-minimum ---

export function auditExternalReferenceMinimum(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => {
      const refs = article.externalReferences;
      if (refs.length < 2) return true;
      const types = new Set(refs.map((ref) => ref.type).filter(Boolean));
      return types.size < 2;
    })
    .map((article) => {
      const refs = article.externalReferences;
      const types = new Set(refs.map((ref) => ref.type).filter(Boolean));
      if (refs.length < 2) {
        return warning(
          'external-reference-minimum',
          article.id,
          `${article.id} has ${refs.length} external references (minimum 2).`,
        );
      }
      return warning(
        'external-reference-minimum',
        article.id,
        `${article.id} has ${types.size} external reference type(s) (minimum 2 different types).`,
      );
    });
}

// --- Rule 13: inline-citation-density ---

const EXTERNAL_URL_PATTERN = /https?:\/\/[^\s)\]>]+/gu;
const BODY_FRONTMATTER_PATTERN = /^---[\s\S]*?---\s*/u;
const WORD_SPLIT_PATTERN = /\s+/u;
const WORD_STRIP_FRONTMATTER_PATTERN = /^---[\s\S]*?---\s*/u;

export function auditInlineCitationDensity(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => article.body !== undefined)
    .filter((article) => {
      const body = (article.body ?? '').replace(BODY_FRONTMATTER_PATTERN, '');
      const urls = body.match(EXTERNAL_URL_PATTERN) ?? [];
      return urls.length < 3;
    })
    .map((article) => {
      const body = (article.body ?? '').replace(BODY_FRONTMATTER_PATTERN, '');
      const urls = body.match(EXTERNAL_URL_PATTERN) ?? [];
      return warning(
        'inline-citation-density',
        article.id,
        `${article.id} has ${urls.length} inline citations (minimum 3 external URLs in body).`,
      );
    });
}

// --- Rule 14: missing-last-updated ---

export function auditMissingLastUpdated(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  return input.articles
    .filter((article) => !article.lastUpdated)
    .map((article) =>
      warning(
        'missing-last-updated',
        article.id,
        `${article.id} has no lastUpdated date. Required for staleness detection.`,
      ),
    );
}

// --- Rule 15: stale-code-reference ---

export function auditStaleCodeReference(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const fileModifiedMap = new Map(
    (input.fileModifiedDates ?? []).map((entry) => [entry.filePath, entry.lastModified]),
  );

  const issues: KnowledgeAuditIssue[] = [];

  for (const article of input.articles) {
    const { lastUpdated, relatedFiles } = article;
    if (!lastUpdated || relatedFiles.length === 0) continue;

    for (const filePath of relatedFiles) {
      const fileModified = fileModifiedMap.get(filePath);
      if (!fileModified) continue;
      if (fileModified > lastUpdated) {
        issues.push(
          warning(
            'stale-code-reference',
            article.id,
            `${article.id} references ${filePath} which was modified on ${fileModified}, after the article's lastUpdated (${lastUpdated}).`,
          ),
        );
      }
    }
  }

  return issues;
}

// --- Rule 16: uncited-reference ---

/**
 * Extract all inline Markdown link URLs from article body.
 * Matches `[text](https://...)` patterns.
 */
export function extractInlineLinkUrls(body: string): Set<string> {
  const cleaned = body.replace(BODY_FRONTMATTER_PATTERN, '');
  const urls = new Set<string>();
  MARKDOWN_INLINE_LINK_PATTERN.lastIndex = 0;
  for (;;) {
    const match = MARKDOWN_INLINE_LINK_PATTERN.exec(cleaned);
    if (!match) break;
    const url = match[1];
    if (url) urls.add(url);
  }
  return urls;
}

export function auditUncitedReference(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const issues: KnowledgeAuditIssue[] = [];

  for (const article of input.articles) {
    const { body, externalReferences } = article;
    if (!body || externalReferences.length === 0) continue;

    const inlineUrls = extractInlineLinkUrls(body);
    const referencedUrls = externalReferences
      .map((ref) => ref.url)
      .filter((url): url is string => url !== undefined);

    for (const refUrl of referencedUrls) {
      if (!inlineUrls.has(refUrl)) {
        issues.push(
          warning(
            'uncited-reference',
            article.id,
            `${article.id} lists ${refUrl} in externalReferences but never links to it inline.`,
          ),
        );
      }
    }
  }

  return issues;
}

// --- Rule 17: unlisted-inline-citation ---

export function auditUnlistedInlineCitation(input: KnowledgeAuditInput): KnowledgeAuditIssue[] {
  const issues: KnowledgeAuditIssue[] = [];

  for (const article of input.articles) {
    if (!article.body) continue;

    const inlineUrls = extractInlineLinkUrls(article.body);
    const referenceUrls = new Set(
      article.externalReferences
        .map((ref) => ref.url)
        .filter((url): url is string => url !== undefined),
    );

    for (const inlineUrl of inlineUrls) {
      if (!referenceUrls.has(inlineUrl)) {
        issues.push(
          warning(
            'unlisted-inline-citation',
            article.id,
            `${article.id} links to ${inlineUrl} inline but it is not in externalReferences.`,
          ),
        );
      }
    }
  }

  return issues;
}
