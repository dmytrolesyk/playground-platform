#!/usr/bin/env node
// Generate Mermaid diagram files from the knowledge graph JSON.
// Run: node --experimental-strip-types scripts/generate-diagrams.ts
//
// Produces .mmd files in src/data/generated-diagrams/ that are always
// in sync with the knowledge graph. These are derived artifacts — never
// edit them manually.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { KnowledgeGraph, ModuleNode } from '@playground/knowledge-engine/graph/types';

const ROOT = process.cwd();
const GRAPH_PATH = join(ROOT, 'src/data/knowledge-graph.json');
const OUTPUT_DIR = join(ROOT, 'src/data/generated-diagrams');

// ── Helpers ─────────────────────────────────────────────────────────────

/** Sanitize a label for Mermaid node text (escape quotes, brackets). */
function sanitize(label: string): string {
  return label.replace(/"/g, '#quot;').replace(/[[\](){}]/g, ' ');
}

/** Create a valid Mermaid node ID from an arbitrary string. */
function mermaidId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '_');
}

// ── Module prerequisite diagram ─────────────────────────────────────────

const MODULE_BLOCK_SPLIT_PATTERN = /\n {2}\{/;
const MODULE_ID_PATTERN = /id:\s*'([^']+)'/;
const MODULE_PREREQ_PATTERN = /prerequisites:\s*\[([^\]]*)\]/;

interface ModuleInputForDiagram {
  id: string;
  label: string;
  order: number;
}

function loadModulePrerequisites(root: string): {
  modules: ModuleInputForDiagram[];
  prerequisites: Map<string, string[]>;
} {
  // Dynamic import isn't needed — we parse modules.ts manually from the
  // graph JSON (module nodes + we need the prerequisite data from the
  // original modules.ts). Since we already have module nodes in the graph,
  // we read the modules.ts file directly for prerequisites.
  const modulesPath = join(root, 'src/content/knowledge/modules.ts');
  const source = readFileSync(modulesPath, 'utf8');

  // Extract prerequisite arrays from the TypeScript source.
  // Each module block has: id: 'xxx' ... prerequisites: ['a', 'b']
  const moduleBlocks = source.split(MODULE_BLOCK_SPLIT_PATTERN);
  const prerequisites = new Map<string, string[]>();

  for (const block of moduleBlocks) {
    const idMatch = MODULE_ID_PATTERN.exec(block);
    const prereqMatch = MODULE_PREREQ_PATTERN.exec(block);
    if (!idMatch) continue;
    const id = idMatch[1];
    if (!id) continue;
    const prereqs = prereqMatch?.[1]
      ? prereqMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter(Boolean)
      : [];
    prerequisites.set(id, prereqs);
  }

  return { modules: [], prerequisites };
}

export function generateModulePrerequisiteDiagram(graph: KnowledgeGraph, root: string): string {
  const moduleNodes = graph.nodes
    .filter((n): n is ModuleNode => n.type === 'module')
    .sort((a, b) => a.order - b.order);

  const { prerequisites } = loadModulePrerequisites(root);

  const lines: string[] = [
    '%% Auto-generated from knowledge-graph.json — do not edit',
    'flowchart LR',
  ];

  // Nodes
  for (const mod of moduleNodes) {
    const shortId = mod.id.replace('module:', '');
    lines.push(`  ${mermaidId(shortId)}["${mod.order}. ${sanitize(mod.label)}"]`);
  }

  // Edges from module prerequisites
  for (const mod of moduleNodes) {
    const shortId = mod.id.replace('module:', '');
    const prereqs = prerequisites.get(shortId) ?? [];
    for (const prereq of prereqs) {
      lines.push(`  ${mermaidId(prereq)} --> ${mermaidId(shortId)}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

// ── Per-module article DAGs ─────────────────────────────────────────────

export function generateModuleArticleDiagram(
  graph: KnowledgeGraph,
  moduleId: string,
  moduleLabel: string,
): string {
  // Find articles belonging to this module
  const articleIds = new Set(
    graph.edges
      .filter((e) => e.type === 'belongsToModule' && e.target === `module:${moduleId}`)
      .map((e) => e.source),
  );

  const articleNodes = graph.nodes.filter((n) => n.type === 'article' && articleIds.has(n.id));

  // Prerequisite edges within this module
  const prereqEdges = graph.edges.filter(
    (e) => e.type === 'prerequisite' && articleIds.has(e.source) && articleIds.has(e.target),
  );

  const lines: string[] = [
    `%% Auto-generated — articles in module "${moduleLabel}"`,
    'flowchart TD',
  ];

  for (const node of articleNodes) {
    lines.push(`  ${mermaidId(node.id)}["${sanitize(node.label)}"]`);
  }

  for (const edge of prereqEdges) {
    lines.push(`  ${mermaidId(edge.target)} --> ${mermaidId(edge.source)}`);
  }

  // If no internal prereq edges, show articles without connections
  return `${lines.join('\n')}\n`;
}

// ── Technology usage map ────────────────────────────────────────────────

export function generateTechnologyUsageDiagram(graph: KnowledgeGraph): string {
  const techEdges = graph.edges.filter((e) => e.type === 'usesTechnology');

  // Collect technologies and their articles
  const techToArticles = new Map<string, Set<string>>();
  for (const edge of techEdges) {
    const set = techToArticles.get(edge.target) ?? new Set<string>();
    set.add(edge.source);
    techToArticles.set(edge.target, set);
  }

  // Technology node labels
  const techLabels = new Map<string, string>();
  for (const node of graph.nodes) {
    if (node.type === 'technology') {
      techLabels.set(node.id, node.label);
    }
  }

  // Article labels
  const articleLabels = new Map<string, string>();
  for (const node of graph.nodes) {
    if (node.type === 'article') {
      articleLabels.set(node.id, node.label);
    }
  }

  const lines: string[] = ['%% Auto-generated — technology usage across articles', 'flowchart LR'];

  // Sort by usage count (most used first)
  const sorted = [...techToArticles.entries()].sort((a, b) => b[1].size - a[1].size);

  for (const [techId, articles] of sorted) {
    const label = techLabels.get(techId) ?? techId;
    lines.push(`  ${mermaidId(techId)}(("${sanitize(label)}"))`);
    for (const articleId of articles) {
      const articleLabel = articleLabels.get(articleId) ?? articleId;
      lines.push(`  ${mermaidId(techId)} --- ${mermaidId(articleId)}["${sanitize(articleLabel)}"]`);
    }
  }

  return `${lines.join('\n')}\n`;
}

// ── Category distribution diagram ───────────────────────────────────────

export function generateCategoryDistributionDiagram(graph: KnowledgeGraph): string {
  const categoryCounts = new Map<string, number>();
  for (const node of graph.nodes) {
    if (node.type === 'article' && 'category' in node) {
      const cat = (node as { category: string }).category;
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }
  }

  const lines: string[] = [
    '%% Auto-generated — article distribution by category',
    'pie title Articles by Category',
  ];

  const sorted = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [category, count] of sorted) {
    lines.push(`  "${category}" : ${count}`);
  }

  return `${lines.join('\n')}\n`;
}

// ── Main ────────────────────────────────────────────────────────────────

function main(): void {
  const graphJson = readFileSync(GRAPH_PATH, 'utf8');
  const graph = JSON.parse(graphJson) as KnowledgeGraph;

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Module prerequisites
  const modulePrereqs = generateModulePrerequisiteDiagram(graph, ROOT);
  writeFileSync(join(OUTPUT_DIR, 'module-prerequisites.mmd'), modulePrereqs);

  // 2. Per-module article DAGs
  const moduleNodes = graph.nodes
    .filter((n): n is ModuleNode => n.type === 'module')
    .sort((a, b) => a.order - b.order);

  for (const mod of moduleNodes) {
    const shortId = mod.id.replace('module:', '');
    const diagram = generateModuleArticleDiagram(graph, shortId, mod.label);
    writeFileSync(join(OUTPUT_DIR, `module-${shortId}-articles.mmd`), diagram);
  }

  // 3. Technology usage map
  const techUsage = generateTechnologyUsageDiagram(graph);
  writeFileSync(join(OUTPUT_DIR, 'technology-usage.mmd'), techUsage);

  // 4. Category distribution
  const categoryDist = generateCategoryDistributionDiagram(graph);
  writeFileSync(join(OUTPUT_DIR, 'category-distribution.mmd'), categoryDist);

  const totalFiles = 1 + moduleNodes.length + 2; // prereqs + per-module + tech + category
  process.stdout.write(`✓ Generated ${totalFiles} Mermaid diagram(s) → ${OUTPUT_DIR}/\n`);
}

main();
