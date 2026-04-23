import type { KnowledgeGraph } from '@playground/knowledge-engine/graph/types';
import { describe, expect, it } from 'vitest';
import {
  generateCategoryDistributionDiagram,
  generateModuleArticleDiagram,
  generateModulePrerequisiteDiagram,
  generateTechnologyUsageDiagram,
} from './generate-diagrams.ts';

function minimalGraph(overrides: Partial<KnowledgeGraph> = {}): KnowledgeGraph {
  return {
    nodes: overrides.nodes ?? [
      {
        id: 'architecture/overview',
        type: 'article',
        label: 'The Big Picture',
        category: 'architecture',
        difficulty: 'beginner',
        module: 'foundation',
        estimatedMinutes: 15,
        technologies: ['solidjs'],
        hasExercises: true,
        exerciseCount: 2,
        hasLearningObjectives: true,
        diagramRef: null,
      },
      {
        id: 'architecture/data-flow',
        type: 'article',
        label: 'From Markdown to Screen',
        category: 'architecture',
        difficulty: 'beginner',
        module: 'foundation',
        estimatedMinutes: 15,
        technologies: ['astro'],
        hasExercises: true,
        exerciseCount: 2,
        hasLearningObjectives: true,
        diagramRef: null,
      },
      {
        id: 'concepts/reactivity',
        type: 'article',
        label: 'Fine-Grained Reactivity',
        category: 'concept',
        difficulty: 'intermediate',
        module: 'reactivity',
        estimatedMinutes: 20,
        technologies: ['solidjs'],
        hasExercises: true,
        exerciseCount: 3,
        hasLearningObjectives: true,
        diagramRef: null,
      },
      { id: 'module:foundation', type: 'module', label: 'The Foundation', order: 1 },
      { id: 'module:reactivity', type: 'module', label: 'Why SolidJS?', order: 2 },
      { id: 'tech:solidjs', type: 'technology', label: 'SolidJS' },
      { id: 'tech:astro', type: 'technology', label: 'Astro' },
    ],
    edges: overrides.edges ?? [
      {
        source: 'architecture/overview',
        target: 'module:foundation',
        type: 'belongsToModule',
      },
      {
        source: 'architecture/data-flow',
        target: 'module:foundation',
        type: 'belongsToModule',
      },
      {
        source: 'concepts/reactivity',
        target: 'module:reactivity',
        type: 'belongsToModule',
      },
      {
        source: 'architecture/data-flow',
        target: 'architecture/overview',
        type: 'prerequisite',
      },
      {
        source: 'architecture/overview',
        target: 'tech:solidjs',
        type: 'usesTechnology',
      },
      {
        source: 'architecture/data-flow',
        target: 'tech:astro',
        type: 'usesTechnology',
      },
      {
        source: 'concepts/reactivity',
        target: 'tech:solidjs',
        type: 'usesTechnology',
      },
    ],
    metadata: {
      generatedAt: '2026-04-23T00:00:00.000Z',
      articleCount: 3,
      edgeCount: 7,
      categories: ['architecture', 'concept'],
    },
  };
}

describe('generateModuleArticleDiagram', () => {
  it('produces a valid Mermaid flowchart for a module', () => {
    const graph = minimalGraph();
    const result = generateModuleArticleDiagram(graph, 'foundation', 'The Foundation');

    expect(result).toContain('flowchart TD');
    expect(result).toContain('The Big Picture');
    expect(result).toContain('From Markdown to Screen');
    // Should NOT contain articles from other modules
    expect(result).not.toContain('Fine-Grained Reactivity');
  });

  it('includes internal prerequisite edges', () => {
    const graph = minimalGraph();
    const result = generateModuleArticleDiagram(graph, 'foundation', 'The Foundation');

    // architecture/data-flow has prerequisite on architecture/overview
    // In the diagram, the arrow goes from target → source (prereq → dependent)
    expect(result).toContain('architecture_overview');
    expect(result).toContain('architecture_data_flow');
    expect(result).toContain('-->');
  });

  it('returns a diagram even for a module with no articles', () => {
    const graph = minimalGraph();
    const result = generateModuleArticleDiagram(graph, 'nonexistent', 'Empty Module');

    expect(result).toContain('flowchart TD');
    // Should still be valid Mermaid, just no nodes
  });

  it('includes auto-generated comment', () => {
    const graph = minimalGraph();
    const result = generateModuleArticleDiagram(graph, 'foundation', 'The Foundation');

    expect(result).toContain('%% Auto-generated');
  });
});

describe('generateTechnologyUsageDiagram', () => {
  it('produces a valid Mermaid flowchart with technology nodes', () => {
    const graph = minimalGraph();
    const result = generateTechnologyUsageDiagram(graph);

    expect(result).toContain('flowchart LR');
    expect(result).toContain('SolidJS');
    expect(result).toContain('Astro');
  });

  it('connects technologies to their articles', () => {
    const graph = minimalGraph();
    const result = generateTechnologyUsageDiagram(graph);

    // SolidJS is used by 2 articles
    expect(result).toContain('tech_solidjs');
    expect(result).toContain('architecture_overview');
    expect(result).toContain('concepts_reactivity');
  });

  it('sorts technologies by usage count (most used first)', () => {
    const graph = minimalGraph();
    const result = generateTechnologyUsageDiagram(graph);

    // SolidJS (2 articles) should appear before Astro (1 article)
    const solidjsPos = result.indexOf('tech_solidjs((');
    const astroPos = result.indexOf('tech_astro((');
    expect(solidjsPos).toBeLessThan(astroPos);
  });
});

describe('generateCategoryDistributionDiagram', () => {
  it('produces a valid Mermaid pie chart', () => {
    const graph = minimalGraph();
    const result = generateCategoryDistributionDiagram(graph);

    expect(result).toContain('pie title Articles by Category');
    expect(result).toContain('"architecture" : 2');
    expect(result).toContain('"concept" : 1');
  });

  it('sorts categories by count descending', () => {
    const graph = minimalGraph();
    const result = generateCategoryDistributionDiagram(graph);

    const archPos = result.indexOf('"architecture"');
    const conceptPos = result.indexOf('"concept"');
    expect(archPos).toBeLessThan(conceptPos);
  });
});

describe('generateModulePrerequisiteDiagram', () => {
  it('produces a valid Mermaid flowchart with module nodes', () => {
    const graph = minimalGraph();
    // Uses real modules.ts from the project root
    const result = generateModulePrerequisiteDiagram(graph, process.cwd());

    expect(result).toContain('flowchart LR');
    expect(result).toContain('%% Auto-generated');
    // Should contain module nodes from our test graph
    expect(result).toContain('foundation');
    expect(result).toContain('reactivity');
  });

  it('includes prerequisite edges from modules.ts', () => {
    const graph = minimalGraph();
    const result = generateModulePrerequisiteDiagram(graph, process.cwd());

    // 'reactivity' has prerequisite 'foundation' in modules.ts
    expect(result).toContain('foundation --> reactivity');
  });
});
