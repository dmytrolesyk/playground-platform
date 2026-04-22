// Types for the knowledge graph JSON output

export interface ArticleNode {
  id: string;
  type: 'article';
  label: string;
  category: string;
  difficulty: string | null;
  module: string | null;
  estimatedMinutes: number | null;
  technologies: string[];
  hasExercises: boolean;
  exerciseCount: number;
  hasLearningObjectives: boolean;
  diagramRef: string | null;
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
  order: number;
}

export interface ArchitectureGraphNode {
  id: string;
  type: 'architecture-node';
  label: string;
  category: string;
  knowledgeSlug: string | null;
}

export type GraphNode = ArticleNode | TechnologyNode | ModuleNode | ArchitectureGraphNode;

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphMetadata {
  generatedAt: string;
  articleCount: number;
  edgeCount: number;
  categories: string[];
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

// Input types for the extraction function (loader produces these)

export interface ArticleInput {
  id: string;
  title: string;
  category: string;
  difficulty: string | undefined;
  module: string | undefined;
  estimatedMinutes: number | undefined;
  technologies: string[];
  relatedConcepts: string[];
  prerequisites: string[];
  diagramRef: string | undefined;
  exerciseCount: number;
  learningObjectiveCount: number;
}

export interface ModuleInput {
  id: string;
  title: string;
  order: number;
}

export interface ArchitectureNodeInput {
  id: string;
  label: string;
  category: string;
  knowledgeSlug: string | undefined;
}

export interface ArchitectureEdgeInput {
  from: string;
  to: string;
  type: string;
}

export interface ExtractionInput {
  articles: readonly ArticleInput[];
  modules: readonly ModuleInput[];
  architectureNodes: readonly ArchitectureNodeInput[];
  architectureEdges: readonly ArchitectureEdgeInput[];
}
