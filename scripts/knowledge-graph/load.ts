// Loads knowledge articles, modules, and architecture data from disk.
// Produces ExtractionInput for the pure extraction function.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  getArray,
  getNumber,
  getString,
  getStringArray,
  isRecord,
} from '@playground/knowledge-engine/frontmatter';
import type {
  ArchitectureEdgeInput,
  ArchitectureNodeInput,
  ArticleInput,
  ExtractionInput,
  ModuleInput,
} from '@playground/knowledge-engine/graph/types';
import { parse as parseYaml } from 'yaml';

const MARKDOWN_EXTENSION_PATTERN = /\.md$/;
const FRONTMATTER_PATTERN = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---/u;

// ── Public API ──────────────────────────────────────────────────────────

export async function loadExtractionInput(root: string): Promise<ExtractionInput> {
  const contentRoot = join(root, 'src/content/knowledge');
  const [architectureData, moduleData] = await Promise.all([
    importArchitectureData(root),
    importCurriculumModules(root),
  ]);

  return {
    articles: loadArticles(contentRoot),
    modules: moduleData.MODULES.map(
      (m): ModuleInput => ({
        id: m.id,
        title: m.title,
        order: m.order,
      }),
    ),
    architectureNodes: architectureData.NODES.map(
      (n): ArchitectureNodeInput => ({
        id: n.id,
        label: n.label,
        category: n.category,
        knowledgeSlug: n.knowledgeSlug,
      }),
    ),
    architectureEdges: architectureData.EDGES.map(
      (e): ArchitectureEdgeInput => ({
        from: e.from,
        to: e.to,
        type: e.type,
      }),
    ),
  };
}

// ── Article loading ─────────────────────────────────────────────────────

function loadArticles(contentRoot: string): ArticleInput[] {
  return listMarkdownFiles(contentRoot).map((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(source, filePath);

    return {
      id: articleIdFromPath(contentRoot, filePath),
      title: getString(frontmatter, 'title') ?? '',
      category: getString(frontmatter, 'category') ?? '',
      difficulty: getString(frontmatter, 'difficulty'),
      module: getString(frontmatter, 'module'),
      estimatedMinutes: getNumber(frontmatter, 'estimatedMinutes'),
      technologies: getStringArray(frontmatter, 'technologies'),
      relatedConcepts: getStringArray(frontmatter, 'relatedConcepts'),
      prerequisites: getStringArray(frontmatter, 'prerequisites'),
      broader: getStringArray(frontmatter, 'broader'),
      narrower: getStringArray(frontmatter, 'narrower'),
      diagramRef: getString(frontmatter, 'diagramRef'),
      exerciseCount: getArray(frontmatter, 'exercises').length,
      learningObjectiveCount: getStringArray(frontmatter, 'learningObjectives').length,
    };
  });
}

// ── Filesystem helpers ──────────────────────────────────────────────────

function listMarkdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(fullPath);
      }
      return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function articleIdFromPath(contentRoot: string, filePath: string): string {
  return relative(contentRoot, filePath)
    .replaceAll(sep, '/')
    .replace(MARKDOWN_EXTENSION_PATTERN, '');
}

// ── Frontmatter parsing ─────────────────────────────────────────────────

function parseFrontmatter(source: string, filePath: string): Record<string, unknown> {
  const match = FRONTMATTER_PATTERN.exec(source);
  if (!match?.groups?.frontmatter) {
    return {};
  }

  const parsed: unknown = parseYaml(match.groups.frontmatter);
  if (!isRecord(parsed)) {
    throw new Error(`Frontmatter in ${filePath} must parse to an object.`);
  }

  return parsed;
}

// ── Dynamic imports ─────────────────────────────────────────────────────

interface ArchitectureDataModule {
  NODES: ReadonlyArray<{ id: string; label: string; category: string; knowledgeSlug?: string }>;
  EDGES: ReadonlyArray<{ from: string; to: string; type: string }>;
}

interface CurriculumModuleDataModule {
  MODULES: ReadonlyArray<{ id: string; title: string; order: number }>;
}

function isArchitectureNodeModuleValue(
  value: unknown,
): value is ArchitectureDataModule['NODES'][number] {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.category === 'string' &&
    (value.knowledgeSlug === undefined || typeof value.knowledgeSlug === 'string')
  );
}

function isArchitectureEdgeModuleValue(
  value: unknown,
): value is ArchitectureDataModule['EDGES'][number] {
  return (
    isRecord(value) &&
    typeof value.from === 'string' &&
    typeof value.to === 'string' &&
    typeof value.type === 'string'
  );
}

function isArchitectureDataModule(value: unknown): value is ArchitectureDataModule {
  return (
    isRecord(value) &&
    Array.isArray(value.NODES) &&
    value.NODES.every(isArchitectureNodeModuleValue) &&
    Array.isArray(value.EDGES) &&
    value.EDGES.every(isArchitectureEdgeModuleValue)
  );
}

function isCurriculumModuleValue(
  value: unknown,
): value is CurriculumModuleDataModule['MODULES'][number] {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.order === 'number'
  );
}

function isCurriculumModuleDataModule(value: unknown): value is CurriculumModuleDataModule {
  return (
    isRecord(value) && Array.isArray(value.MODULES) && value.MODULES.every(isCurriculumModuleValue)
  );
}

async function importArchitectureData(root: string): Promise<ArchitectureDataModule> {
  const moduleUrl = pathToFileURL(
    join(root, 'src/components/desktop/apps/architecture-explorer/architecture-data.ts'),
  ).href;
  const loaded: unknown = await import(moduleUrl);
  if (!isArchitectureDataModule(loaded)) {
    throw new Error('Architecture data module has an unexpected shape.');
  }
  return loaded;
}

async function importCurriculumModules(root: string): Promise<CurriculumModuleDataModule> {
  const moduleUrl = pathToFileURL(join(root, 'src/content/knowledge/modules.ts')).href;
  const loaded: unknown = await import(moduleUrl);
  if (!isCurriculumModuleDataModule(loaded)) {
    throw new Error('Curriculum modules module has an unexpected shape.');
  }
  return loaded;
}
