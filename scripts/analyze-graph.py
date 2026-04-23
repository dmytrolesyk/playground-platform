#!/usr/bin/env python3
"""Analyze the knowledge graph with NetworkX and write graph-analysis.json.

Run with:
    python3 scripts/analyze-graph.py

Optional flags:
    --input  Path to knowledge-graph.json
    --output Path to graph-analysis.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

try:
    import networkx as nx
except ImportError as exc:  # pragma: no cover - import guard
    sys.stderr.write(
        "Missing dependency: networkx. Install with `python3 -m pip install -r requirements.txt`.\n"
    )
    raise SystemExit(1) from exc

try:
    import community as community_louvain
except ImportError as exc:  # pragma: no cover - import guard
    sys.stderr.write(
        "Missing dependency: python-louvain. Install with `python3 -m pip install -r requirements.txt`.\n"
    )
    raise SystemExit(1) from exc

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / 'src/data/knowledge-graph.json'
DEFAULT_OUTPUT = ROOT / 'src/data/graph-analysis.json'
CONTENT_ROOT = ROOT / 'src/content/knowledge'
SEMANTIC_EDGE_TYPES = {'prerequisite', 'relatedConcept', 'broader', 'narrower'}
WORD_COUNT_MINIMUMS = {
    'architecture': 1500,
    'concept': 1000,
    'technology': 800,
    'feature': 600,
    'cs-fundamentals': 1000,
    'lab': 800,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Analyze the knowledge graph with NetworkX.')
    parser.add_argument('--input', type=Path, default=DEFAULT_INPUT, help='Path to knowledge-graph.json')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT, help='Path to graph-analysis.json')
    return parser.parse_args()


def load_graph(path: Path) -> dict[str, Any]:
    with path.open('r', encoding='utf-8') as file:
        return json.load(file)


def get_article_nodes(graph_data: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        node['id']: node
        for node in graph_data.get('nodes', [])
        if node.get('type') == 'article'
    }


def get_module_labels(graph_data: dict[str, Any]) -> dict[str, str]:
    return {
        node['id']: node['label']
        for node in graph_data.get('nodes', [])
        if node.get('type') == 'module'
    }


def build_article_semantic_graph(graph_data: dict[str, Any]) -> nx.DiGraph:
    article_nodes = get_article_nodes(graph_data)
    graph = nx.DiGraph()
    graph.add_nodes_from(article_nodes.keys())

    for edge in graph_data.get('edges', []):
        if edge.get('type') not in SEMANTIC_EDGE_TYPES:
            continue
        source = edge.get('source')
        target = edge.get('target')
        if source in article_nodes and target in article_nodes:
            graph.add_edge(source, target, type=edge['type'])

    return graph


def build_full_graph(graph_data: dict[str, Any]) -> nx.DiGraph:
    graph = nx.DiGraph()
    for node in graph_data.get('nodes', []):
        graph.add_node(node['id'])
    for edge in graph_data.get('edges', []):
        graph.add_edge(edge['source'], edge['target'], type=edge['type'])
    return graph


def compute_centrality(
    semantic_graph: nx.DiGraph, article_nodes: dict[str, dict[str, Any]], limit: int = 20
) -> list[dict[str, Any]]:
    if semantic_graph.number_of_nodes() == 0:
        return []

    # NetworkX 3.5 routes nx.pagerank() through SciPy. Use the pure-Python
    # implementation so the manual workflow only needs the dependencies from
    # requirements.txt.
    scores = nx.algorithms.link_analysis.pagerank_alg._pagerank_python(semantic_graph)
    ranked = sorted(scores.items(), key=lambda item: (-item[1], item[0]))[:limit]
    return [
        {
            'id': node_id,
            'label': article_nodes[node_id]['label'],
            'score': round(score, 6),
        }
        for node_id, score in ranked
    ]


def build_prerequisite_learning_graph(graph_data: dict[str, Any]) -> nx.DiGraph:
    article_nodes = get_article_nodes(graph_data)
    graph = nx.DiGraph()
    graph.add_nodes_from(article_nodes.keys())

    for edge in graph_data.get('edges', []):
        if edge.get('type') != 'prerequisite':
            continue
        source = edge.get('source')
        target = edge.get('target')
        if source in article_nodes and target in article_nodes:
            # Stored graph edge: article -> prerequisite.
            # Learning-order graph: prerequisite -> dependent article.
            graph.add_edge(target, source)

    return graph


def compute_prerequisite_depth(graph_data: dict[str, Any]) -> dict[str, Any]:
    prereq_graph = build_prerequisite_learning_graph(graph_data)
    if prereq_graph.number_of_nodes() == 0:
        return {
            'longestPath': [],
            'maxDepth': 0,
            'depthDistribution': {},
        }

    if prereq_graph.number_of_edges() == 0:
        return {
            'longestPath': [],
            'maxDepth': 0,
            'depthDistribution': {},
        }

    topo_order = list(nx.topological_sort(prereq_graph))
    node_depths: dict[str, int] = {}

    for node in topo_order:
        predecessors = list(prereq_graph.predecessors(node))
        if not predecessors:
            node_depths[node] = 1
        else:
            node_depths[node] = max(node_depths[predecessor] for predecessor in predecessors) + 1

    longest_path = nx.dag_longest_path(prereq_graph)
    depth_distribution = Counter(node_depths.values())

    return {
        'longestPath': longest_path,
        'maxDepth': len(longest_path),
        'depthDistribution': {
            str(depth): count
            for depth, count in sorted(depth_distribution.items(), key=lambda item: item[0])
        },
    }


def titleize_slug(slug: str) -> str:
    return slug.replace('-', ' ').replace('_', ' ').title()


def suggest_community_label(
    members: list[str],
    article_nodes: dict[str, dict[str, Any]],
    module_labels: dict[str, str],
) -> str:
    if len(members) == 1:
        return article_nodes[members[0]]['label']

    module_counts = Counter(
        article_nodes[member].get('module')
        for member in members
        if article_nodes[member].get('module')
    )
    if module_counts:
        module_id, count = module_counts.most_common(1)[0]
        if module_id is not None and count >= max(2, len(members) // 2):
            return module_labels.get(f'module:{module_id}', titleize_slug(module_id))

    category_counts = Counter(article_nodes[member].get('category') for member in members)
    if category_counts:
        category, _ = category_counts.most_common(1)[0]
        return f"{titleize_slug(category)} cluster"

    return 'Mixed cluster'


def compute_communities(graph_data: dict[str, Any]) -> list[dict[str, Any]]:
    article_nodes = get_article_nodes(graph_data)
    module_labels = get_module_labels(graph_data)
    undirected_graph = build_article_semantic_graph(graph_data).to_undirected()

    if undirected_graph.number_of_nodes() == 0:
        return []

    partition = community_louvain.best_partition(undirected_graph)
    grouped_members: dict[int, list[str]] = {}
    for member, community_id in partition.items():
        grouped_members.setdefault(community_id, []).append(member)

    sorted_groups = sorted(
        grouped_members.values(),
        key=lambda members: (-len(members), members[0]),
    )

    communities: list[dict[str, Any]] = []
    for index, members in enumerate(sorted_groups):
        sorted_members = sorted(members)
        communities.append(
            {
                'id': index,
                'members': sorted_members,
                'suggestedLabel': suggest_community_label(sorted_members, article_nodes, module_labels),
            }
        )

    return communities


def count_words(markdown_path: Path) -> int | None:
    if not markdown_path.exists():
        return None

    raw = markdown_path.read_text(encoding='utf-8')
    body = re.sub(r'^---\n.*?\n---\n?', '', raw, count=1, flags=re.DOTALL)
    body = re.sub(r'```[\s\S]*?```', ' ', body)
    body = re.sub(r'`[^`]*`', ' ', body)
    body = re.sub(r'<[^>]+>', ' ', body)
    words = re.findall(r"\b[\w'’-]+\b", body)
    return len(words)


def find_uncovered_technologies(graph_data: dict[str, Any]) -> list[str]:
    tech_slugs = sorted(
        node['id'].removeprefix('tech:')
        for node in graph_data.get('nodes', [])
        if node.get('type') == 'technology'
    )
    technology_articles = {
        node['id'].split('/', 1)[1]
        for node in graph_data.get('nodes', [])
        if node.get('type') == 'article' and node.get('category') == 'technology' and '/' in node['id']
    }
    return [slug for slug in tech_slugs if slug not in technology_articles]


def find_dead_end_articles(semantic_graph: nx.DiGraph) -> list[str]:
    return sorted(node for node, degree in semantic_graph.out_degree() if degree == 0)


def find_disconnected_components(semantic_graph: nx.DiGraph) -> list[list[str]]:
    undirected_graph = semantic_graph.to_undirected()
    components = [sorted(component) for component in nx.connected_components(undirected_graph)]
    if len(components) <= 1:
        return []

    components.sort(key=lambda component: (-len(component), component[0]))
    return components[1:]


def percentile(values: list[int], proportion: float) -> int:
    if not values:
        return 0
    if len(values) == 1:
        return values[0]
    ordered = sorted(values)
    index = int(round((len(ordered) - 1) * proportion))
    return ordered[index]


def find_high_traffic_low_content(
    graph_data: dict[str, Any], semantic_graph: nx.DiGraph
) -> list[dict[str, Any]]:
    article_nodes = get_article_nodes(graph_data)
    incoming_references = {node: semantic_graph.in_degree(node) for node in semantic_graph.nodes}
    threshold = max(3, percentile(list(incoming_references.values()), 0.75))

    flagged_articles: list[dict[str, Any]] = []
    for article_id, incoming_count in incoming_references.items():
        if incoming_count < threshold:
            continue

        article = article_nodes[article_id]
        markdown_path = CONTENT_ROOT / f'{article_id}.md'
        word_count = count_words(markdown_path)
        reasons: list[str] = []

        minimum_word_count = WORD_COUNT_MINIMUMS.get(article.get('category', ''))
        if article.get('exerciseCount', 0) < 2:
            reasons.append('fewer than 2 exercises')
        if minimum_word_count is not None and word_count is not None and word_count < minimum_word_count:
            reasons.append(f'{word_count} words below {minimum_word_count}-word target')
        elif word_count is not None and word_count < 600:
            reasons.append(f'{word_count} words is unusually short for a high-traffic article')

        if not reasons:
            continue

        flagged_articles.append(
            {
                'id': article_id,
                'label': article['label'],
                'incomingReferences': incoming_count,
                'exerciseCount': article.get('exerciseCount', 0),
                'estimatedMinutes': article.get('estimatedMinutes'),
                'wordCount': word_count,
                'reasons': reasons,
            }
        )

    return sorted(
        flagged_articles,
        key=lambda article: (-article['incomingReferences'], article['wordCount'] or sys.maxsize, article['id']),
    )


def build_analysis(graph_data: dict[str, Any]) -> dict[str, Any]:
    article_nodes = get_article_nodes(graph_data)
    semantic_graph = build_article_semantic_graph(graph_data)
    full_graph = build_full_graph(graph_data)

    return {
        'centrality': compute_centrality(semantic_graph, article_nodes),
        'prerequisiteDepth': compute_prerequisite_depth(graph_data),
        'communities': compute_communities(graph_data),
        'coverageGaps': {
            'uncoveredTechnologies': find_uncovered_technologies(graph_data),
            'deadEndArticles': find_dead_end_articles(semantic_graph),
            'disconnectedComponents': find_disconnected_components(semantic_graph),
            'highTrafficLowContent': find_high_traffic_low_content(graph_data, semantic_graph),
        },
        'summary': {
            'nodeCount': len(graph_data.get('nodes', [])),
            'edgeCount': len(graph_data.get('edges', [])),
            'weaklyConnectedComponents': nx.number_weakly_connected_components(full_graph)
            if full_graph.number_of_nodes() > 0
            else 0,
        },
    }


def write_analysis(output_path: Path, analysis: dict[str, Any]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(f"{json.dumps(analysis, indent=2)}\n", encoding='utf-8')


def main() -> int:
    args = parse_args()
    graph_data = load_graph(args.input)
    analysis = build_analysis(graph_data)
    write_analysis(args.output, analysis)

    sys.stdout.write(f'✓ Graph analysis written to {args.output}\n')
    sys.stdout.write(
        f"  {len(analysis['centrality'])} centrality rows, {len(analysis['communities'])} communities, {analysis['summary']['weaklyConnectedComponents']} weakly connected component(s)\n"
    )
    sys.stdout.write(
        f"  Coverage gaps: {len(analysis['coverageGaps']['uncoveredTechnologies'])} uncovered technologies, {len(analysis['coverageGaps']['deadEndArticles'])} dead ends, {len(analysis['coverageGaps']['disconnectedComponents'])} disconnected clusters, {len(analysis['coverageGaps']['highTrafficLowContent'])} high-traffic low-content articles\n"
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
