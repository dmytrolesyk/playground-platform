export const ARCHITECTURE_NODE_CATEGORIES = [
  'astro',
  'solidjs',
  'registry',
  'app',
  'css',
  'infrastructure',
  'concept',
] as const;

export const ARCHITECTURE_EDGE_TYPES = ['data-flow', 'dependency', 'renders', 'lazy-load'] as const;

export type KnowledgeAuditSeverity = 'error' | 'warning';

export type KnowledgeAuditIssueCode =
  | 'missing-related-concept'
  | 'missing-prerequisite'
  | 'unknown-module'
  | 'bad-diagram-ref'
  | 'broken-edge-endpoint'
  | 'duplicate-architecture-node-id'
  | 'invalid-node-category'
  | 'invalid-edge-type'
  | 'bad-knowledge-slug'
  | 'prerequisite-cycle'
  | 'minimum-related-concepts'
  | 'minimum-exercises'
  | 'required-learning-objectives'
  | 'architecture-requires-diagram'
  | 'lab-requires-prerequisites'
  | 'no-orphan-articles'
  | 'technology-coverage'
  | 'module-completeness'
  | 'broader-narrower-symmetry'
  | 'minimum-word-count'
  | 'exercise-type-diversity'
  | 'external-reference-minimum'
  | 'inline-citation-density';

export interface KnowledgeAuditIssue {
  severity: KnowledgeAuditSeverity;
  code: KnowledgeAuditIssueCode;
  subject: string;
  message: string;
}

export interface ExternalReference {
  type?: string;
}

export interface Exercise {
  type?: string;
}

export interface KnowledgeArticle {
  id: string;
  category: string;
  frontmatter?: Record<string, unknown>;
  body?: string;
  relatedConcepts?: readonly string[];
  prerequisites?: readonly string[];
  module?: string;
  diagramRef?: string;
  relatedFiles?: readonly string[];
  learningObjectives?: readonly string[];
  exercises?: readonly Exercise[];
  estimatedMinutes?: number;
  technologies?: readonly string[];
  externalReferences?: readonly ExternalReference[];
  broader?: readonly string[];
  narrower?: readonly string[];
}

export interface CurriculumModule {
  id: string;
}

export interface ArchitectureNode {
  id: string;
  category: string;
  knowledgeSlug?: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  type: string;
}

export interface KnowledgeAuditInput {
  articles: readonly KnowledgeArticle[];
  modules: readonly CurriculumModule[];
  architectureNodes: readonly ArchitectureNode[];
  architectureEdges: readonly ArchitectureEdge[];
  allowedNodeCategories?: readonly string[];
  allowedEdgeTypes?: readonly string[];
}
