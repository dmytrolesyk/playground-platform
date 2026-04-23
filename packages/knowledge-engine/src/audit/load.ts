import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  CurriculumModule,
  Exercise,
  ExternalReference,
  KnowledgeArticle,
  KnowledgeAuditInput,
} from './types.ts';

const MARKDOWN_EXTENSION_PATTERN = /\.md$/;
const FRONTMATTER_PATTERN = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---\r?\n?(?<body>[\s\S]*)$/u;

interface LoadKnowledgeAuditOptions {
  root?: string;
}

interface ArchitectureDataModule {
  NODES: readonly ArchitectureNode[];
  EDGES: readonly ArchitectureEdge[];
}

interface CurriculumModuleDataModule {
  MODULES: readonly CurriculumModule[];
}

export async function loadKnowledgeAuditInput(
  options: LoadKnowledgeAuditOptions = {},
): Promise<KnowledgeAuditInput> {
  const root = options.root ?? process.cwd();
  const contentRoot = join(root, 'src/content/knowledge');
  const [architectureData, moduleData] = await Promise.all([
    importArchitectureData(root),
    importCurriculumModules(root),
  ]);

  return {
    articles: loadKnowledgeArticles(contentRoot),
    modules: moduleData.MODULES.map((module) => ({ id: module.id })),
    architectureNodes: architectureData.NODES.map((node) => {
      const result: ArchitectureNode = {
        id: node.id,
        category: node.category,
      };
      if (node.knowledgeSlug !== undefined) {
        result.knowledgeSlug = node.knowledgeSlug;
      }
      return result;
    }),
    architectureEdges: architectureData.EDGES.map((edge) => ({
      from: edge.from,
      to: edge.to,
      type: edge.type,
    })),
  };
}

function loadKnowledgeArticles(contentRoot: string): KnowledgeArticle[] {
  return listMarkdownFiles(contentRoot).map((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(source, filePath);

    const article: KnowledgeArticle = {
      id: articleIdFromPath(contentRoot, filePath),
      category: getString(frontmatter, 'category') ?? '',
      frontmatter,
      body,
      relatedConcepts: getStringArray(frontmatter, 'relatedConcepts'),
      prerequisites: getStringArray(frontmatter, 'prerequisites'),
      relatedFiles: getStringArray(frontmatter, 'relatedFiles'),
      learningObjectives: getStringArray(frontmatter, 'learningObjectives'),
      exercises: getExercises(frontmatter),
      technologies: getStringArray(frontmatter, 'technologies'),
      externalReferences: getExternalReferences(frontmatter),
      broader: getStringArray(frontmatter, 'broader'),
      narrower: getStringArray(frontmatter, 'narrower'),
    };

    const module = getString(frontmatter, 'module');
    if (module !== undefined) article.module = module;

    const diagramRef = getString(frontmatter, 'diagramRef');
    if (diagramRef !== undefined) article.diagramRef = diagramRef;

    const estimatedMinutes = getNumber(frontmatter, 'estimatedMinutes');
    if (estimatedMinutes !== undefined) article.estimatedMinutes = estimatedMinutes;

    return article;
  });
}

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

function parseFrontmatter(
  source: string,
  filePath: string,
): { frontmatter: Record<string, unknown>; body: string } {
  const match = FRONTMATTER_PATTERN.exec(source);

  if (!match?.groups) {
    return { frontmatter: {}, body: source };
  }

  const { frontmatter: rawFrontmatter, body: rawBody } = match.groups;

  const parsed = parseYaml(rawFrontmatter ?? '');
  if (!isRecord(parsed)) {
    throw new Error(`Frontmatter in ${filePath} must parse to an object.`);
  }

  return {
    frontmatter: parsed,
    body: rawBody ?? '',
  };
}

async function importArchitectureData(root: string): Promise<ArchitectureDataModule> {
  const moduleUrl = pathToFileURL(
    join(root, 'src/components/desktop/apps/architecture-explorer/architecture-data.ts'),
  ).href;
  return (await import(moduleUrl)) as ArchitectureDataModule;
}

async function importCurriculumModules(root: string): Promise<CurriculumModuleDataModule> {
  const moduleUrl = pathToFileURL(join(root, 'src/content/knowledge/modules.ts')).href;
  return (await import(moduleUrl)) as CurriculumModuleDataModule;
}

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function getStringArray(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function getArray(record: Record<string, unknown>, key: string): unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function getExercises(record: Record<string, unknown>): Exercise[] {
  return getArray(record, 'exercises')
    .filter(isRecord)
    .map(({ type }) => (typeof type === 'string' ? { type } : {}));
}

function getExternalReferences(record: Record<string, unknown>): ExternalReference[] {
  return getArray(record, 'externalReferences')
    .filter(isRecord)
    .map(({ type }) => (typeof type === 'string' ? { type } : {}));
}

function getNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
