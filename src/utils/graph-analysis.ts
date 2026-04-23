export interface CentralityEntry {
  id: string;
  label: string;
  score: number;
}

export interface PrerequisiteDepthAnalysis {
  longestPath: string[];
  maxDepth: number;
  depthDistribution: Record<string, number>;
}

export interface CommunityAnalysis {
  id: number;
  members: string[];
  suggestedLabel: string;
}

export interface HighTrafficLowContentEntry {
  id: string;
  label: string;
  incomingReferences: number;
  exerciseCount: number;
  estimatedMinutes: number | null;
  wordCount: number | null;
  reasons: string[];
}

export interface CoverageGapAnalysis {
  uncoveredTechnologies: string[];
  deadEndArticles: string[];
  disconnectedComponents: string[][];
  highTrafficLowContent: HighTrafficLowContentEntry[];
}

export interface GraphAnalysisSummary {
  nodeCount: number;
  edgeCount: number;
  weaklyConnectedComponents: number;
}

export interface GraphAnalysis {
  centrality: CentralityEntry[];
  prerequisiteDepth: PrerequisiteDepthAnalysis;
  communities: CommunityAnalysis[];
  coverageGaps: CoverageGapAnalysis;
  summary: GraphAnalysisSummary;
}

export interface PreparedCommunityAnalysis extends CommunityAnalysis {
  size: number;
}

export interface DepthDistributionBucket {
  depth: number;
  count: number;
}

export interface PreparedGraphAnalysis extends GraphAnalysis {
  communities: PreparedCommunityAnalysis[];
  depthDistribution: DepthDistributionBucket[];
}

export function prepareGraphAnalysisDisplay(analysis: GraphAnalysis): PreparedGraphAnalysis {
  const communities = [...analysis.communities]
    .map((community) => ({
      ...community,
      size: community.members.length,
    }))
    .sort((a, b) => b.size - a.size || a.id - b.id);

  const disconnectedComponents = [...analysis.coverageGaps.disconnectedComponents]
    .map((component) => [...component].sort())
    .sort((a, b) => {
      const left = a[0] ?? '';
      const right = b[0] ?? '';
      return b.length - a.length || left.localeCompare(right);
    });

  const highTrafficLowContent = [...analysis.coverageGaps.highTrafficLowContent].sort(
    (a, b) => b.incomingReferences - a.incomingReferences || a.id.localeCompare(b.id),
  );

  return {
    ...analysis,
    communities,
    depthDistribution: Object.entries(analysis.prerequisiteDepth.depthDistribution)
      .map(([depth, count]) => ({ depth: Number(depth), count }))
      .sort((a, b) => a.depth - b.depth),
    coverageGaps: {
      ...analysis.coverageGaps,
      disconnectedComponents,
      highTrafficLowContent,
    },
  };
}
