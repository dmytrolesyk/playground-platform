import { describe, expect, it } from 'vitest';
import analysisJson from '../data/graph-analysis.json';
import graphJson from '../data/knowledge-graph.json';
import type { GraphAnalysis } from './graph-analysis.ts';
import { prepareGraphAnalysisDisplay } from './graph-analysis.ts';

const analysis = analysisJson as GraphAnalysis;

describe('prepareGraphAnalysisDisplay', () => {
  it('sorts depth buckets numerically and communities by size', () => {
    const prepared = prepareGraphAnalysisDisplay({
      centrality: [],
      prerequisiteDepth: {
        longestPath: ['concepts/a', 'concepts/b', 'concepts/c'],
        maxDepth: 3,
        depthDistribution: {
          3: 2,
          1: 5,
          2: 4,
        },
      },
      communities: [
        { id: 3, members: ['concepts/a'], suggestedLabel: 'Singleton' },
        {
          id: 1,
          members: ['concepts/b', 'concepts/c', 'concepts/d'],
          suggestedLabel: 'Largest',
        },
        { id: 2, members: ['concepts/e', 'concepts/f'], suggestedLabel: 'Medium' },
      ],
      coverageGaps: {
        uncoveredTechnologies: ['networkx'],
        deadEndArticles: ['concepts/leaf'],
        disconnectedComponents: [['concepts/c', 'concepts/a'], ['concepts/b']],
        highTrafficLowContent: [
          {
            id: 'concepts/high-traffic',
            label: 'High Traffic',
            incomingReferences: 9,
            exerciseCount: 1,
            estimatedMinutes: 8,
            wordCount: 480,
            reasons: ['few exercises'],
          },
        ],
      },
      summary: {
        nodeCount: 6,
        edgeCount: 7,
        weaklyConnectedComponents: 2,
      },
    });

    expect(prepared.depthDistribution).toEqual([
      { depth: 1, count: 5 },
      { depth: 2, count: 4 },
      { depth: 3, count: 2 },
    ]);
    expect(prepared.communities.map((community) => community.suggestedLabel)).toEqual([
      'Largest',
      'Medium',
      'Singleton',
    ]);
    expect(prepared.coverageGaps.disconnectedComponents).toEqual([
      ['concepts/a', 'concepts/c'],
      ['concepts/b'],
    ]);
  });
});

describe('generated graph-analysis.json', () => {
  it('contains all required sections and stays in sync with knowledge-graph.json counts', () => {
    expect(analysis.centrality.length).toBeGreaterThan(0);
    expect(analysis.prerequisiteDepth.maxDepth).toBeGreaterThan(0);
    expect(analysis.prerequisiteDepth.longestPath).toHaveLength(
      analysis.prerequisiteDepth.maxDepth,
    );
    expect(analysis.communities.length).toBeGreaterThan(1);
    expect(Array.isArray(analysis.coverageGaps.uncoveredTechnologies)).toBe(true);
    expect(Array.isArray(analysis.coverageGaps.deadEndArticles)).toBe(true);
    expect(Array.isArray(analysis.coverageGaps.disconnectedComponents)).toBe(true);
    expect(Array.isArray(analysis.coverageGaps.highTrafficLowContent)).toBe(true);
    expect(analysis.summary.nodeCount).toBe(graphJson.nodes.length);
    expect(analysis.summary.edgeCount).toBe(graphJson.edges.length);
    expect(analysis.summary.weaklyConnectedComponents).toBeGreaterThan(0);
  });
});
