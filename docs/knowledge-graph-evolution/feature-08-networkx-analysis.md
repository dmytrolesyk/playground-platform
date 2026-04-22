# Feature 8: NetworkX Graph Analysis

## Goal

Create a Python script that reads `knowledge-graph.json`, runs graph analyses, and outputs `graph-analysis.json` for Astro pages to consume.

## Depends On

Features 1 and 4 (needs `src/data/knowledge-graph.json`, consumes engine output from outside the package)

## Applicable Skills

- `data-visualization` — Python chart/visualization best practices for analysis output

## Deliverables

- **Script:** `scripts/analyze-graph.py`
- **Output:** `src/data/graph-analysis.json`
- **Dependencies:** `requirements.txt` with `networkx` and `python-louvain`
- **Run as:** `python3 scripts/analyze-graph.py`

## Four Analyses

### 1. Concept Centrality (PageRank)

Rank nodes by importance (how connected and referenced they are).

```python
pagerank = nx.pagerank(G)
top_concepts = sorted(pagerank.items(), key=lambda x: -x[1])[:20]
```

Output: ranked list of concept IDs with scores. Use to identify which articles deserve the deepest content investment.

### 2. Prerequisite Chain Depth

Find the longest path in the prerequisite subgraph (the critical learning path).

```python
prereq_edges = [(u, v) for u, v, d in G.edges(data=True) if d.get('type') == 'prerequisite']
prereq_graph = nx.DiGraph(prereq_edges)
longest_path = nx.dag_longest_path(prereq_graph)
```

Output: longest chain, max depth, depth distribution.

### 3. Community Detection (Louvain)

Detect natural concept clusters.

```python
import community as community_louvain
partition = community_louvain.best_partition(G.to_undirected())
```

Output: community assignments for each node. Compare with manual module assignments to validate module structure.

### 4. Coverage Gap Detection

Structural analysis:
- Technology nodes with no corresponding `category: technology` article
- Articles with zero outgoing edges (dead ends)
- Disconnected components
- Articles with many incoming edges but few exercises or short content

## Output Schema

```json
{
  "centrality": [
    { "id": "concepts/fine-grained-reactivity", "label": "Fine-Grained Reactivity", "score": 0.045 }
  ],
  "prerequisiteDepth": {
    "longestPath": ["article-a", "article-b", "article-c"],
    "maxDepth": 3,
    "depthDistribution": { "1": 5, "2": 8, "3": 2 }
  },
  "communities": [
    { "id": 0, "members": ["article-a", "article-b"], "suggestedLabel": "" }
  ],
  "coverageGaps": {
    "uncoveredTechnologies": ["typescript"],
    "deadEndArticles": ["features/crt-monitor-frame"],
    "disconnectedComponents": [],
    "highTrafficLowContent": []
  },
  "summary": {
    "nodeCount": 65,
    "edgeCount": 156,
    "weaklyConnectedComponents": 1
  }
}
```

## Integration

- Import `graph-analysis.json` in the stats dashboard (Feature 2) to display analysis results
- Optionally use in Cytoscape.js (Feature 6) to color nodes by community or centrality score
- Run manually after adding content: `python3 scripts/analyze-graph.py`
- Could be added to prebuild, but keeping it manual avoids Python dependency in CI
- **After completing articles for a new feature:** run the analysis and check `coverageGaps.disconnectedComponents` for new clusters that aren't connected to the main graph. Missing cross-domain links should be added as `relatedConcepts` in the relevant articles.

## Files to Create

- `scripts/analyze-graph.py`
- `requirements.txt` (or `scripts/requirements.txt`)
- `src/data/graph-analysis.json` (generated output)

## Files to Modify

- `src/pages/learn/index.astro` (or wherever stats dashboard lives) — display analysis results

## Branch & Completion Workflow

1. Create branch: `git checkout -b feat/08-networkx-analysis`
2. Implement with tests (Python script produces valid JSON, analysis results are plausible)
3. Verify: `pnpm verify` + `pnpm verify:knowledge` + `pnpm build` + `python3 scripts/analyze-graph.py`
4. Check all acceptance criteria below
5. Commit and stop. Do not start the next feature.

## Acceptance Criteria

- [ ] Script runs: `python3 scripts/analyze-graph.py`
- [ ] Output JSON is valid and contains all four analysis sections
- [ ] PageRank results are plausible (well-connected concepts rank high)
- [ ] Prerequisite chain depth matches manual verification
- [ ] Community detection produces non-trivial partitions
- [ ] Coverage gaps identify real issues
- [ ] Stats dashboard displays analysis results
