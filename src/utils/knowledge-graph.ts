import type {
  ArchitectureGraphNode,
  ArticleNode,
  GraphEdge,
  GraphMetadata,
  GraphNode,
  KnowledgeGraph,
  ModuleNode,
  TechnologyNode,
} from '@playground/knowledge-engine/graph/types';
import { isArrayOf, isRecord } from './type-guards.ts';

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isStringArray(value: unknown): value is string[] {
  return isArrayOf(value, (item): item is string => typeof item === 'string');
}

function isArticleNode(value: unknown): value is ArticleNode {
  return (
    isRecord(value) &&
    value.type === 'article' &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.category === 'string' &&
    isNullableString(value.difficulty) &&
    isNullableString(value.module) &&
    isNullableNumber(value.estimatedMinutes) &&
    isStringArray(value.technologies) &&
    typeof value.hasExercises === 'boolean' &&
    typeof value.exerciseCount === 'number' &&
    typeof value.hasLearningObjectives === 'boolean' &&
    isNullableString(value.diagramRef)
  );
}

function isTechnologyNode(value: unknown): value is TechnologyNode {
  return (
    isRecord(value) &&
    value.type === 'technology' &&
    typeof value.id === 'string' &&
    typeof value.label === 'string'
  );
}

function isModuleNode(value: unknown): value is ModuleNode {
  return (
    isRecord(value) &&
    value.type === 'module' &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.order === 'number'
  );
}

function isArchitectureGraphNode(value: unknown): value is ArchitectureGraphNode {
  return (
    isRecord(value) &&
    value.type === 'architecture-node' &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.category === 'string' &&
    isNullableString(value.knowledgeSlug)
  );
}

function isGraphNode(value: unknown): value is GraphNode {
  return (
    isArticleNode(value) ||
    isTechnologyNode(value) ||
    isModuleNode(value) ||
    isArchitectureGraphNode(value)
  );
}

function isGraphEdge(value: unknown): value is GraphEdge {
  return (
    isRecord(value) &&
    typeof value.source === 'string' &&
    typeof value.target === 'string' &&
    typeof value.type === 'string'
  );
}

function isGraphMetadata(value: unknown): value is GraphMetadata {
  return (
    isRecord(value) &&
    typeof value.generatedAt === 'string' &&
    typeof value.articleCount === 'number' &&
    typeof value.edgeCount === 'number' &&
    isStringArray(value.categories)
  );
}

function isKnowledgeGraph(value: unknown): value is KnowledgeGraph {
  return (
    isRecord(value) &&
    isArrayOf(value.nodes, isGraphNode) &&
    isArrayOf(value.edges, isGraphEdge) &&
    isGraphMetadata(value.metadata)
  );
}

export function parseKnowledgeGraph(value: unknown): KnowledgeGraph {
  if (!isKnowledgeGraph(value)) {
    throw new Error('Invalid knowledge graph JSON data');
  }
  return value;
}
