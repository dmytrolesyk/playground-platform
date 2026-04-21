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
  | 'prerequisite-cycle';

export interface KnowledgeAuditIssue {
  severity: KnowledgeAuditSeverity;
  code: KnowledgeAuditIssueCode;
  subject: string;
  message: string;
}

export interface KnowledgeArticle {
  id: string;
  category: string;
  relatedConcepts?: readonly string[];
  prerequisites?: readonly string[];
  module?: string;
  diagramRef?: string;
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
