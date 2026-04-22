#!/usr/bin/env node
// Build-time script that extracts the implicit knowledge graph into explicit JSON.
// Run: node --experimental-strip-types scripts/build-knowledge-graph.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { extractKnowledgeGraph } from './knowledge-graph/extract.ts';
import { loadExtractionInput } from './knowledge-graph/load.ts';

const ROOT = process.cwd();
const OUTPUT_PATH = join(ROOT, 'src/data/knowledge-graph.json');

async function main(): Promise<void> {
  const input = await loadExtractionInput(ROOT);
  const graph = extractKnowledgeGraph(input);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(graph, null, 2)}\n`);

  process.stdout.write(`✓ Knowledge graph written to ${OUTPUT_PATH}\n`);
  process.stdout.write(
    `  ${graph.metadata.articleCount} articles, ${graph.nodes.length} nodes, ${graph.metadata.edgeCount} edges\n`,
  );
  process.stdout.write(`  Categories: ${graph.metadata.categories.join(', ')}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to build knowledge graph: ${message}\n`);
  process.exitCode = 1;
});
