/**
 * KnowledgeGraph — Cytoscape.js interactive visualization (SolidJS island).
 *
 * Lazy-loads cytoscape + cytoscape-fcose to keep the main bundle small.
 * Reads mastery progress from localStorage for node border coloring.
 */

import type { KnowledgeGraph as KnowledgeGraphData } from '@playground/knowledge-engine/graph/types';
import type { MasteryStage } from '@playground/knowledge-engine/progress';
import { getProgress } from '@playground/knowledge-engine/progress';
import {
  type Component,
  createEffect,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import {
  type CyElements,
  getCategories,
  getEdgeTypes,
  getNodeTypes,
  toCytoscapeElements,
} from '../../utils/cytoscape-transform';

// ── Types ───────────────────────────────────────────────────────────

type CyCore = import('cytoscape').Core;

// Cytoscape stylesheet entry — use a lightweight local type to avoid
// fighting the complex Css.Node | Css.Edge | Css.Core union.
interface StyleEntry {
  selector: string;
  style: Record<string, unknown>;
}

interface Props {
  graphData: KnowledgeGraphData;
}

// ── Constants ───────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  architecture: '#4a90d9',
  concept: '#9b59b6',
  technology: '#27ae60',
  feature: '#e67e22',
  'cs-fundamentals': '#16a085',
  lab: '#e74c3c',
};

const MASTERY_BORDER_COLORS: Record<MasteryStage, string> = {
  read: '#5dade2',
  checked: '#f4d03f',
  practiced: '#eb984e',
  mastered: '#2ecc71',
};

const EDGE_TYPE_STYLES: Record<string, { lineStyle: string; width: number; color: string }> = {
  prerequisite: { lineStyle: 'solid', width: 2, color: '#555' },
  relatedConcept: { lineStyle: 'dashed', width: 1, color: '#999' },
  usesTechnology: { lineStyle: 'dotted', width: 0.5, color: '#bbb' },
  belongsToModule: { lineStyle: 'solid', width: 0.5, color: '#ddd' },
  dependency: { lineStyle: 'solid', width: 1, color: '#aaa' },
  'data-flow': { lineStyle: 'dashed', width: 1, color: '#aaa' },
  renders: { lineStyle: 'dotted', width: 1, color: '#aaa' },
  hasDiagramRef: { lineStyle: 'dotted', width: 0.5, color: '#ccc' },
  'lazy-load': { lineStyle: 'dashed', width: 0.5, color: '#ccc' },
};

const EDGE_TYPE_LABELS: Record<string, string> = {
  prerequisite: 'Prerequisites',
  relatedConcept: 'Related Concepts',
  usesTechnology: 'Uses Technology',
  belongsToModule: 'Module Membership',
  dependency: 'Dependencies',
  'data-flow': 'Data Flow',
  renders: 'Renders',
  hasDiagramRef: 'Diagram Refs',
  'lazy-load': 'Lazy Loads',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  article: 'Articles',
  technology: 'Technologies',
  module: 'Modules',
  'architecture-node': 'Architecture',
};

const CATEGORY_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  concept: 'Concepts',
  technology: 'Technologies',
  feature: 'Features',
  'cs-fundamentals': 'CS Fundamentals',
  lab: 'Labs',
};

// ── Cytoscape stylesheet ────────────────────────────────────────────

function buildStylesheet(): StyleEntry[] {
  const styles: StyleEntry[] = [
    // Default node
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'font-size': '10px',
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'text-valign': 'center',
        'text-halign': 'center',
        width: 40,
        height: 40,
        'border-width': 2,
        'border-color': '#ccc',
        'background-color': '#ddd',
        color: '#333',
      },
    },
    // Article nodes — round rectangle
    {
      selector: 'node.article',
      style: {
        shape: 'round-rectangle',
        width: 60,
        height: 40,
      },
    },
    // Technology nodes — diamond
    {
      selector: 'node.technology',
      style: {
        shape: 'diamond',
        'background-color': '#1e8449',
        color: '#1e8449',
        width: 35,
        height: 35,
      },
    },
    // Module compound nodes
    {
      selector: 'node.module',
      style: {
        shape: 'round-rectangle',
        'background-color': '#f0f0ec',
        'background-opacity': 0.6,
        'border-width': 1,
        'border-color': '#bbb',
        'border-style': 'dashed',
        'font-size': '12px',
        'font-weight': 'bold',
        'text-valign': 'top',
        'text-halign': 'center',
        'padding-top': '10px',
        color: '#555',
      },
    },
    // Architecture nodes — hexagon
    {
      selector: 'node.architecture-node',
      style: {
        shape: 'hexagon',
        'background-color': '#aab',
        width: 30,
        height: 30,
        'font-size': '8px',
      },
    },
  ];

  // Category colors for articles
  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    styles.push({
      selector: `node.cat-${cat}`,
      style: { 'background-color': color, color: '#333' },
    });
  }

  // Default edge style
  styles.push({
    selector: 'edge',
    style: {
      width: 1,
      'line-color': '#ccc',
      'target-arrow-color': '#ccc',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 0.8,
      opacity: 0.7,
    },
  });

  // Edge type-specific styles
  for (const [edgeType, s] of Object.entries(EDGE_TYPE_STYLES)) {
    styles.push({
      selector: `edge[edgeType="${edgeType}"]`,
      style: {
        width: s.width,
        'line-style': s.lineStyle,
        'line-color': s.color,
        'target-arrow-color': s.color,
      },
    });
  }

  // Selected node
  styles.push({
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#000080',
      'overlay-opacity': 0.1,
    },
  });

  // Hidden elements (via filter)
  styles.push({
    selector: '.hidden',
    style: { display: 'none' },
  });

  // Mastery border styles
  for (const [stage, color] of Object.entries(MASTERY_BORDER_COLORS)) {
    styles.push({
      selector: `node.mastery-${stage}`,
      style: {
        'border-width': 3,
        'border-color': color,
      },
    });
  }

  return styles;
}

// ── Component ───────────────────────────────────────────────────────

const KnowledgeGraph: Component<Props> = (props: Props): JSX.Element => {
  let containerRef: HTMLDivElement | undefined;
  let cy: CyCore | undefined;

  const elements: CyElements = toCytoscapeElements(props.graphData);
  const categories = getCategories(elements.nodes);
  const edgeTypes = getEdgeTypes(elements.edges);
  const nodeTypes = getNodeTypes(elements.nodes);

  // Filter state
  const [hiddenCategories, setHiddenCategories] = createSignal<Set<string>>(new Set());
  const [hiddenEdgeTypes, setHiddenEdgeTypes] = createSignal<Set<string>>(new Set());
  const [hiddenNodeTypes, setHiddenNodeTypes] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal(true);
  const [hoveredNode, setHoveredNode] = createSignal<string | null>(null);

  // ── Mastery coloring ──────────────────────────────────────────────

  function applyMasteryColors(): void {
    if (!cy) return;
    const progress = getProgress();

    for (const slug of Object.keys(progress.articlesRead)) {
      const article = progress.articlesRead[slug];
      if (!article) continue;
      const node = cy.$(`node[id="${slug}"]`);
      if (node.length > 0) {
        // Remove any existing mastery classes
        node.removeClass('mastery-read mastery-checked mastery-practiced mastery-mastered');
        node.addClass(`mastery-${article.stage}`);
      }
    }
  }

  // ── Filter application ────────────────────────────────────────────

  function applyFilters(): void {
    if (!cy) return;
    const graph = cy;
    const hCats = hiddenCategories();
    const hEdges = hiddenEdgeTypes();
    const hNodes = hiddenNodeTypes();

    graph.batch(() => {
      // Show all first
      graph.elements().removeClass('hidden');

      // Hide by category
      for (const cat of hCats) {
        graph.$(`node[category="${cat}"]`).addClass('hidden');
      }

      // Hide by edge type
      for (const et of hEdges) {
        graph.$(`edge[edgeType="${et}"]`).addClass('hidden');
      }

      // Hide by node type
      for (const nt of hNodes) {
        graph.$(`node[nodeType="${nt}"]`).addClass('hidden');
      }
    });
  }

  // React to filter changes
  createEffect(() => {
    // Access signals to track them
    hiddenCategories();
    hiddenEdgeTypes();
    hiddenNodeTypes();
    applyFilters();
  });

  // ── Toggle handlers ───────────────────────────────────────────────

  function toggleCategory(cat: string): void {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleEdgeType(et: string): void {
    setHiddenEdgeTypes((prev) => {
      const next = new Set(prev);
      if (next.has(et)) next.delete(et);
      else next.add(et);
      return next;
    });
  }

  function toggleNodeType(nt: string): void {
    setHiddenNodeTypes((prev) => {
      const next = new Set(prev);
      if (next.has(nt)) next.delete(nt);
      else next.add(nt);
      return next;
    });
  }

  // ── Initialize Cytoscape ──────────────────────────────────────────

  onMount(() => {
    (async () => {
    if (!containerRef) return;

    // Dynamic import to keep bundle small (lazy loading boundary)
    const [cytoscapeMod, fcoseMod] = await Promise.all([
      import('cytoscape'),
      import('cytoscape-fcose'),
    ]);

    const cytoscape = cytoscapeMod.default;
    const fcose = fcoseMod.default;

    // Register the layout extension
    cytoscape.use(fcose);

    cy = cytoscape({
      container: containerRef,
      elements: [
        ...elements.nodes.map((n) => ({
          group: 'nodes' as const,
          data: { ...n.data },
          classes: n.classes,
        })),
        ...elements.edges.map((e) => ({
          group: 'edges' as const,
          data: { ...e.data },
        })),
      ] as cytoscape.ElementDefinition[],
      // Cytoscape accepts both 'style' and 'css' as the property name; types only declare 'css'
      style: buildStylesheet() as cytoscape.StylesheetJson,
      layout: {
        name: 'fcose',
        animate: false,
        quality: 'proof',
        nodeDimensionsIncludeLabels: true,
        packComponents: true,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 80,
        edgeElasticity: () => 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        gravityRange: 3.8,
        numIter: 2500,
        tile: true,
        tilingPaddingVertical: 20,
        tilingPaddingHorizontal: 20,
      } as cytoscape.LayoutOptions,
      minZoom: 0.1,
      maxZoom: 4,
      wheelSensitivity: 0.3,
    });

    // Apply mastery colors after initialization
    applyMasteryColors();
    setLoading(false);

    // ── Interactions ──────────────────────────────────────────────

    // Click → navigate to article
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeType = node.data('nodeType') as string;
      const nodeId = node.data('id') as string;

      if (nodeType === 'article') {
        window.location.href = `/learn/${nodeId}`;
      } else if (nodeType === 'architecture-node') {
        const slug = node.data('knowledgeSlug') as string | null;
        if (slug) {
          window.location.href = `/learn/${slug}`;
        }
      }
    });

    // Hover → show tooltip
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const label = node.data('label') as string;
      const nodeType = node.data('nodeType') as string;
      const category = node.data('category') as string | undefined;
      const parts = [label];
      if (nodeType) parts.push(`[${nodeType}]`);
      if (category) parts.push(`(${category})`);
      setHoveredNode(parts.join(' '));
      if (containerRef) containerRef.style.cursor = 'pointer';
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
      if (containerRef) containerRef.style.cursor = 'default';
    });

    // Expose for E2E testing
    window.__cyGraph = cy;
    })().catch(() => { /* cytoscape init failure */ });
  });

  onCleanup(() => {
    if (cy) {
      cy.destroy();
      cy = undefined;
    }
    if (typeof window !== 'undefined') {
      window.__cyGraph = undefined;
    }
  });

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div class="knowledge-graph-wrapper">
      {/* Filter controls */}
      <div class="knowledge-graph-controls">
        <fieldset class="knowledge-graph-fieldset">
          <legend>Categories</legend>
          <For each={categories}>
            {(cat: string) => (
              <label class="knowledge-graph-filter">
                <input
                  type="checkbox"
                  checked={!hiddenCategories().has(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                <span
                  class="knowledge-graph-swatch"
                  style={{ 'background-color': CATEGORY_COLORS[cat] ?? '#999' }}
                />
                {CATEGORY_LABELS[cat] ?? cat}
              </label>
            )}
          </For>
        </fieldset>

        <fieldset class="knowledge-graph-fieldset">
          <legend>Node Types</legend>
          <For each={nodeTypes}>
            {(nt: string) => (
              <label class="knowledge-graph-filter">
                <input
                  type="checkbox"
                  checked={!hiddenNodeTypes().has(nt)}
                  onChange={() => toggleNodeType(nt)}
                />
                {NODE_TYPE_LABELS[nt] ?? nt}
              </label>
            )}
          </For>
        </fieldset>

        <fieldset class="knowledge-graph-fieldset">
          <legend>Edge Types</legend>
          <For each={edgeTypes}>
            {(et: string) => (
              <label class="knowledge-graph-filter">
                <input
                  type="checkbox"
                  checked={!hiddenEdgeTypes().has(et)}
                  onChange={() => toggleEdgeType(et)}
                />
                {EDGE_TYPE_LABELS[et] ?? et}
              </label>
            )}
          </For>
        </fieldset>

        {/* Legend: mastery borders */}
        <fieldset class="knowledge-graph-fieldset">
          <legend>Mastery Progress</legend>
          <div class="knowledge-graph-legend">
            <span class="knowledge-graph-legend-item">
              <span
                class="knowledge-graph-swatch knowledge-graph-swatch--border"
                style={{ 'border-color': '#ccc' }}
              />
              Unread
            </span>
            <span class="knowledge-graph-legend-item">
              <span
                class="knowledge-graph-swatch knowledge-graph-swatch--border"
                style={{ 'border-color': MASTERY_BORDER_COLORS.read }}
              />
              Read
            </span>
            <span class="knowledge-graph-legend-item">
              <span
                class="knowledge-graph-swatch knowledge-graph-swatch--border"
                style={{ 'border-color': MASTERY_BORDER_COLORS.checked }}
              />
              Checked
            </span>
            <span class="knowledge-graph-legend-item">
              <span
                class="knowledge-graph-swatch knowledge-graph-swatch--border"
                style={{ 'border-color': MASTERY_BORDER_COLORS.practiced }}
              />
              Practiced
            </span>
            <span class="knowledge-graph-legend-item">
              <span
                class="knowledge-graph-swatch knowledge-graph-swatch--border"
                style={{ 'border-color': MASTERY_BORDER_COLORS.mastered }}
              />
              Mastered
            </span>
          </div>
        </fieldset>
      </div>

      {/* Tooltip */}
      <Show when={hoveredNode()}>
        <div class="knowledge-graph-tooltip">{hoveredNode()}</div>
      </Show>

      {/* Loading indicator */}
      <Show when={loading()}>
        <div class="knowledge-graph-loading">Loading graph…</div>
      </Show>

      {/* Graph container */}
      <div ref={containerRef} class="knowledge-graph-container" data-cy="knowledge-graph" />
    </div>
  );
};

export default KnowledgeGraph;
